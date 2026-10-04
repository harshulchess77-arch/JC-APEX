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
 */

#include <Arduino.h>
#include <RadioLib.h>
#include <ArduinoJson.h>

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

  // Use theoretical scaled zero-current baseline
  zeroCurrentOffset = V_ZERO_SCALED;

  Serial.printf("Zero-current offset (theoretical): %.5f V\n", zeroCurrentOffset);
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

void transmitTelemetry(float current) {
  StaticJsonDocument<64> doc;

  doc["packet_id"] = packetId++;
  doc["current"] = round(current * 100) / 100.0;  // Round to 2 decimal places

  char jsonBuffer[64];
  serializeJson(doc, jsonBuffer);

  // Transmit using RadioLib
  int state = radio.transmit(jsonBuffer);

  if (state == RADIOLIB_ERR_NONE) {
    Serial.printf("[%lu] TX: %s\n", millis(), jsonBuffer);
  } else {
    Serial.printf("[%lu] TX failed, code: %d\n", millis(), state);
  }
}
