/**
 * ESP32 LoRa Transmitter Node
 * Hardware: Heltec V3 ESP32 SX1262 LoRa Module
 * Sensor: WCS1600 Hall Effect Current Sensor
 * Frequency: 915.0 MHz
 *
 * Circuit:
 * - WCS1600 VCC -> 5V
 * - WCS1600 GND -> GND
 * - WCS1600 VOUT -> Voltage Divider (R1+R2)/R2 -> GPIO 1 (ADC1_CH0)
 * - Voltage Divider: Scale to 0-3.3V ADC range
 * - OLED: I2C (SDA=GPIO 8, SCL=GPIO 9)
 */

#include <Arduino.h>
#include <RadioLib.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// LoRa Configuration - SX1262
#define FREQUENCY 915.0
#define BANDWIDTH 125.0
#define SPREADING_FACTOR 7
#define CODING_RATE 5
#define OUTPUT_POWER 22
#define PREAMBLE_LENGTH 8
#define SYNC_WORD 0x12

// Sensor Configuration
#define SENSOR_PIN 1  // GPIO 1 (ADC1_CH0)
#define ADC_VOLTAGE 3.3
#define ADC_RESOLUTION 4095.0
#define R1 10000.0  // 10k resistor (line series)
#define R2 18000.0  // 18k resistor (pull-down to GND)
#define WCS1600_SENSITIVITY 0.066  // V/A at 5V supply
#define WCS1600_VCC 5.0  // Sensor supply voltage
#define WCS1600_V_ZERO 2.5  // Zero-current center output at 5V
#define MOVING_AVG_WINDOW 50
#define SAMPLING_INTERVAL 200  // ms (5Hz sampling)

// OLED Configuration (Heltec V3)
#define OLED_SDA 8
#define OLED_SCL 9
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Calculated constants
// Voltage division factor: K = R2 / (R1 + R2) = 18k / (10k + 18k) = 18/28 ≈ 0.64286
#define VOLTAGE_DIVIDER_K (R2 / (R1 + R2))
// Scaled zero-current baseline: V_zero_scaled = 2.5V * K = 1.60714V
#define V_ZERO_SCALED (WCS1600_V_ZERO * VOLTAGE_DIVIDER_K)
// Combined sensitivity factor: S * K = 0.066 * 0.64286 = 0.04243
#define SENSITIVITY_SCALED (WCS1600_SENSITIVITY * VOLTAGE_DIVIDER_K)

// Global Variables
SX1262 radio = new Module(SS, DIO1, RST, BUSY);
unsigned long lastSampleTime = 0;
uint32_t packetId = 0;
float zeroCurrentOffset = 0.0;
float movingAverageBuffer[MOVING_AVG_WINDOW];
int maIndex = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println(F("=== ESP32 LoRa Transmitter ==="));
  Serial.println(F("Initializing WCS1600 Current Sensor..."));

  // Initialize ADC
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // Initialize OLED
  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED initialization failed"));
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println(F("TX Node Init..."));
    display.display();
  }

  // Calibrate zero-current offset
  calibrateZeroCurrent();

  Serial.println(F("Initializing RadioLib SX1262..."));

  // Initialize SX1262 with specified parameters
  int state = radio.begin(FREQUENCY, BANDWIDTH, SPREADING_FACTOR, CODING_RATE, SYNC_WORD, OUTPUT_POWER, PREAMBLE_LENGTH);
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("RadioLib initialized successfully"));
    Serial.printf("Frequency: %.1f MHz\n", FREQUENCY);
    Serial.printf("Bandwidth: %.1f kHz\n", BANDWIDTH);
    Serial.printf("Spreading Factor: %d\n", SPREADING_FACTOR);
    Serial.printf("Coding Rate: %d\n", CODING_RATE);
    Serial.printf("Output Power: %d dBm\n", OUTPUT_POWER);
  } else {
    Serial.print(F("RadioLib init failed, code: "));
    Serial.println(state);
    while (1);
  }

  // Initialize moving average buffer
  for (int i = 0; i < MOVING_AVG_WINDOW; i++) {
    movingAverageBuffer[i] = 0.0;
  }

  Serial.println(F("Starting telemetry transmission at 5Hz..."));

  // Update OLED with initial status
  updateOLED(0.0, 0.0);
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastSampleTime >= SAMPLING_INTERVAL) {
    lastSampleTime = currentTime;

    // Read sensor
    float currentReading = readCurrentSensor();

    // Apply moving average filter
    float filteredCurrent = applyMovingAverage(currentReading);

    // Transmit telemetry
    transmitTelemetry(filteredCurrent);
  }
}

void calibrateZeroCurrent() {
  Serial.println(F("Calibrating zero-current offset..."));

  // Take 100 samples to establish true zero-current baseline
  float sum = 0.0;
  for (int i = 0; i < 100; i++) {
    sum += readRawVoltage();
    delay(10);
  }
  zeroCurrentOffset = sum / 100.0;

  Serial.printf("Zero-current offset (measured): %.5f V\n", zeroCurrentOffset);
  Serial.printf("Voltage division factor K: %.5f\n", VOLTAGE_DIVIDER_K);
  Serial.printf("Scaled sensitivity: %.5f V/A\n", SENSITIVITY_SCALED);
  Serial.println(F("Calibration complete"));
}

float readRawVoltage() {
  int adcValue = analogRead(SENSOR_PIN);
  float adcVoltage = (adcValue / ADC_RESOLUTION) * ADC_VOLTAGE;
  return adcVoltage;
}

float readCurrentSensor() {
  float adcVoltage = readRawVoltage();
  // Calibration with zero-current offset
  float voltageOffset = adcVoltage - zeroCurrentOffset;
  // Calculate current using scaled sensitivity: I = |(V_adc - V_zero_scaled) / (S * K)
  float current = abs(voltageOffset / SENSITIVITY_SCALED);
  return current;
}

float applyMovingAverage(float newValue) {
  movingAverageBuffer[maIndex] = newValue;
  maIndex = (maIndex + 1) % MOVING_AVG_WINDOW;
  
  float sum = 0.0;
  for (int i = 0; i < MOVING_AVG_WINDOW; i++) {
    sum += movingAverageBuffer[i];
  }
  
  return sum / MOVING_AVG_WINDOW;
}

float readBatteryVoltage() {
  // Heltec V3 battery voltage divider (divide by 2)
  int adcValue = analogRead(37);  // GPIO 37 (ADC1_CH1) - Battery voltage pin
  float adcVoltage = (adcValue / ADC_RESOLUTION) * ADC_VOLTAGE;
  float batteryVoltage = adcVoltage * 2.0;  // Divide by 2 circuit
  return batteryVoltage;
}

void updateOLED(float current, float vbat) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println(F("TX Node Status"));

  display.setCursor(0, 12);
  display.printf("Packet #%lu", packetId);

  display.setCursor(0, 24);
  display.printf("Current: %.2f A", current);

  display.setCursor(0, 36);
  display.printf("Battery: %.2f V", vbat);

  display.setCursor(0, 48);
  display.printf("Freq: %.1f MHz", FREQUENCY);

  display.display();
}

void transmitTelemetry(float current) {
  StaticJsonDocument<96> doc;

  doc["packet_id"] = packetId++;
  doc["current"] = round(current * 100) / 100.0;  // Round to 2 decimal places
  doc["vbat"] = round(readBatteryVoltage() * 100) / 100.0;  // Battery voltage

  char jsonBuffer[96];
  serializeJson(doc, jsonBuffer);

  // Update OLED
  updateOLED(current, doc["vbat"]);

  // Transmit using RadioLib
  int state = radio.transmit(jsonBuffer);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.printf("[%lu] TX: %s\n", millis(), jsonBuffer);
  } else {
    Serial.printf("[%lu] TX failed, code: %d\n", millis(), state);
  }
}
