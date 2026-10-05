/**
 * ============================================================================
 * JC-APEX TELEMETRY SYSTEM - TRANSMITTER (TX) FIRMWARE
 * ELECTROTHON 48V TRACTIVE PACK, MOTOR HALL & GPS INTEGRATION
 * ============================================================================
 * Hardware: Heltec WiFi LoRa 32 (V3) [ESP32-S3 + Semtech SX1262]
 * Target Vehicle: Electrothon 48V DC Competition Car
 * Frequency: 915.0 MHz (US915 Band)
 *
 * ----------------------------------------------------------------------------
 * CIRCUIT & WIRING SPECIFICATION:
 * ----------------------------------------------------------------------------
 * 1. 48V TRACTIVE BATTERY VOLTAGE MONITOR:
 *    - Voltage Pin: ESP32 GPIO 19
 *    - Divider values: R1 = 820000 (820kΩ, positive), R2 = 47000 (47kΩ, ground)
 *    - Math multiplier: (820 + 47) / 47 = 18.4468
 *    - Equation: trueVoltage = (analogRead(19) * 3.3 / 4095.0) * 18.4468;
 *
 * 2. GPS INTEGRATION:
 *    - Hardware UART: Serial1.begin(9600, SERIAL_8N1, 17, 15); // RX pin 17, TX pin 15
 *    - Asynchronous parsing via TinyGPS++
 *
 * 3. MOTOR/WHEEL HALL EFFECT SPEED SENSOR:
 *    - Signal Pin: ESP32 GPIO 7 (INPUT_PULLUP)
 *    - Hardware interrupt: attachInterrupt(digitalPinToInterrupt(7), countPulse, FALLING);
 *    - Non-blocking RPM and speed calculation
 *
 * 4. WCS1600 CURRENT SENSOR:
 *    - Signal Pin: ESP32 GPIO 1 (ADC1_CH0)
 *    - Boot dynamic auto-zero calibration & EMA filter
 *
 * 5. LORA TRANSMISSION & JSON SERIALIZATION:
 *    - TX sends compressed CSV at 5 Hz: packet_id,amps,volts,watts,speed_hall,speed_gps
 *    - RX catches packet, appends RSSI/SNR, and outputs strict JSON to Serial (115200 baud)
 *
 * REQUIRED ARDUINO IDE LIBRARIES:
 * - RadioLib (by Jan Gromes)
 * - TinyGPSPlus (by Mikal Hart)
 * - Adafruit SSD1306 & Adafruit GFX (for onboard OLED diagnostics)
 * ============================================================================
 */

#include <Arduino.h>
#include <RadioLib.h>
#include <TinyGPSPlus.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ============================================================================
// 1. PIN ALLOCATION & HARDWARE CONSTANTS
// ============================================================================

// ADC Pins (ESP32-S3 ADC1)
#define CURRENT_SENSOR_PIN    1   // GPIO 1 (ADC1_CH0) - WCS1600 Current Sensor
#define BATTERY_VOLTAGE_PIN   19  // GPIO 19 - 48V Battery Resistor Divider (820k / 47k)

// Hall Effect Speed Sensor
#define HALL_SENSOR_PIN       7   // GPIO 7 - Assigned as INPUT_PULLUP with hardware interrupt

// GPS Hardware UART (Serial1)
#define GPS_RX_PIN            17  // ESP32 RX <- GPS TX (GPIO 17)
#define GPS_TX_PIN            15  // ESP32 TX -> GPS RX (GPIO 15)
#define GPS_BAUD_RATE         9600

// SX1262 LoRa Pinout for Heltec WiFi LoRa 32 (V3)
#define LORA_NSS              8
#define LORA_DIO1             14
#define LORA_NRST             12
#define LORA_BUSY             13

// Onboard OLED Pins & Power Control
#define OLED_SDA              41  // Moved off GPIO 17 to prevent collision with GPS RX
#define OLED_SCL              42
#define OLED_RST              21
#define VEXT_PIN              36
#define SCREEN_WIDTH          128
#define SCREEN_HEIGHT         64

// LoRa RF Parameters (US 915 MHz)
#define LORA_FREQ             915.0f  // MHz
#define LORA_BANDWIDTH        125.0f  // kHz
#define LORA_SPREAD_FACTOR    7       // SF7 (high speed, 5 Hz capable)
#define LORA_CODE_RATE        5       // 4/5
#define LORA_SYNC_WORD        0x12    // Private network sync word
#define LORA_TX_POWER         22      // dBm (max SX1262 power)
#define LORA_PREAMBLE_LEN     8       // symbols

// ============================================================================
// 2. MATHEMATICAL CALIBRATION & FILTER PARAMETERS
// ============================================================================

// ADC Conversion Constants (12-bit, 3.3V reference)
const float ADC_REF_VOLTAGE = 3.3f;
const float ADC_MAX_COUNT = 4095.0f;

// 48V Battery Voltage Divider: R1 = 820000 (820kΩ, positive), R2 = 47000 (47kΩ, ground)
// Math multiplier: (820 + 47) / 47 = 18.4468
// Equation: trueVoltage = (analogRead(19) * 3.3 / 4095.0) * 18.4468;
const float BATT_R1 = 820000.0f;
const float BATT_R2 = 47000.0f;
const float BATT_VOLTAGE_DIVIDER_FACTOR = 18.4468f;

// WCS1600 Current Sensor: R1 = 10kΩ, R2 = 18kΩ
// Factor = (10 + 18) / 18 ≈ 1.5555556
const float CURRENT_R1 = 10000.0f;
const float CURRENT_R2 = 18000.0f;
const float CURRENT_VOLTAGE_DIVIDER_FACTOR = (CURRENT_R1 + CURRENT_R2) / CURRENT_R2;
const float CURRENT_SENSITIVITY_MV_PER_AMP = 22.0f; // WCS1600 standard sensitivity (22 mV/A)
const float CURRENT_EMA_ALPHA = 0.25f;              // EMA filter coefficient (0.0 to 1.0)

// Dynamic Auto-Zero Calibration baseline for current sensor
float zeroCurrentOffsetVolts = 1.65f;
float emaFilteredCurrentAmps = 0.0f;

// Vehicle Wheel & Motor Hall Kinematics
// Configurable constants for Electrothon car setup
const float WHEEL_CIRCUMFERENCE_METERS = 1.55f; // Standard ~20-inch Electrothon bicycle wheel (~1.55 m)
const float GEAR_RATIO = 1.0f;                 // 1.0 if sensor is on wheel hub; adjust if on motor shaft
const float HALL_PULSES_PER_REV = 1.0f;        // 1 magnet on wheel = 1 pulse per rev
const unsigned long HALL_CALC_INTERVAL_MS = 200; // Calculate speed synchronized with 5 Hz cycle

// Telemetry Transmission Loop Rate
const unsigned long TX_INTERVAL_MS = 200; // 200 ms = 5 Hz update rate

// ============================================================================
// 3. HARDWARE & PERIPHERAL INSTANCES
// ============================================================================

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RST);
SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_NRST, LORA_BUSY);
TinyGPSPlus gps;

// State Variables
uint32_t packetId = 0;
unsigned long lastTxTime = 0;
bool oledReady = false;

// Hall Effect Speed Sensor Interrupt State
volatile unsigned long hallPulseCounter = 0;
unsigned long lastHallPulseTime = 0;
unsigned long lastHallCalcTime = 0;
unsigned long prevHallPulses = 0;
float currentSpeedHallMph = 0.0f;
float speed_gps = 0.0f;

// ============================================================================
// 4. INTERRUPT SERVICE ROUTINE (ISR)
// ============================================================================

void IRAM_ATTR countPulse() {
  unsigned long nowUs = micros();
  // Software debounce (ignore spurious noise pulses < 3ms, equivalent to > 150 mph)
  static unsigned long lastInterruptTimeUs = 0;
  if (nowUs - lastInterruptTimeUs > 3000) {
    hallPulseCounter++;
    lastInterruptTimeUs = nowUs;
  }
}

// ============================================================================
// 5. HELPER FUNCTIONS: POWER & OLED
// ============================================================================

void powerOnVext() {
  pinMode(VEXT_PIN, OUTPUT);
  digitalWrite(VEXT_PIN, LOW); // LOW activates Vext power on Heltec V3
  delay(50);
}

void initOLED() {
  Wire.begin(OLED_SDA, OLED_SCL);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledReady = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println(F("JC-APEX ELECTROTHON"));
    display.setCursor(0, 12);
    display.println(F("48V Live Telemetry"));
    display.setCursor(0, 24);
    display.println(F("Calibrating sensors..."));
    display.display();
  }
}

void updateOLED(uint32_t pktId, float volts, float amps, float watts, float speedH, float speedG, int txStatus) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.printf("JC-APEX TX #%lu", pktId);
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // Live Electrical (Volts & Amps)
  display.setCursor(0, 12);
  display.printf("%.1fV | %.1fA", volts, amps);

  // Live Power
  display.setCursor(0, 24);
  display.setTextSize(2);
  if (watts >= 1000.0f) {
    display.printf("%.2f kW", watts / 1000.0f);
  } else {
    display.printf("%.0f W", watts);
  }

  // Live Speeds
  display.setTextSize(1);
  display.setCursor(0, 43);
  display.printf("SpdH: %.1f | GPS: %.1f", speedH, speedG);

  // Status & GPS Fix
  display.setCursor(0, 55);
  if (txStatus == RADIOLIB_ERR_NONE) {
    display.printf("TX OK | GPS:%s", gps.location.isValid() ? "LOCK" : "SEARCH");
  } else {
    display.printf("TX ERR %d", txStatus);
  }

  display.display();
}

// ============================================================================
// 6. SENSOR MEASUREMENT & MATHEMATICAL PROCESSING
// ============================================================================

/**
 * Calibrates WCS1600 zero-current baseline by averaging 100 samples at boot.
 * Ensures chassis magnetic fields are neutralized.
 */
void calibrateCurrentSensorZero() {
  Serial.println(F("[CALIB] Sampling 100 readings for WCS1600 zero-current offset..."));
  float totalVolts = 0.0f;
  const int NUM_SAMPLES = 100;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    int rawAdc = analogRead(CURRENT_SENSOR_PIN);
    float pinVolts = ((float)rawAdc * ADC_REF_VOLTAGE) / ADC_MAX_COUNT;
    float sensorVolts = pinVolts * CURRENT_VOLTAGE_DIVIDER_FACTOR;
    totalVolts += sensorVolts;
    delay(10);
  }

  zeroCurrentOffsetVolts = totalVolts / (float)NUM_SAMPLES;
  Serial.printf("[CALIB OK] Zero-Current Baseline = %.4f V\n", zeroCurrentOffsetVolts);
}

/**
 * Reads WCS1600 current sensor and applies Exponential Moving Average (EMA).
 */
float readCurrentSensor() {
  int rawAdc = analogRead(CURRENT_SENSOR_PIN);
  float pinVolts = ((float)rawAdc * ADC_REF_VOLTAGE) / ADC_MAX_COUNT;
  float trueSensorVolts = pinVolts * CURRENT_VOLTAGE_DIVIDER_FACTOR;

  // Current calculation: (V_sensor - V_zero) * 1000 / Sensitivity
  float rawCurrentAmps = (trueSensorVolts - zeroCurrentOffsetVolts) * 1000.0f / CURRENT_SENSITIVITY_MV_PER_AMP;
  if (rawCurrentAmps < 0.0f) {
    rawCurrentAmps = 0.0f; // Eliminate negative noise floor
  }

  // Apply Exponential Moving Average (EMA) to smooth motor controller electrical noise
  emaFilteredCurrentAmps = (CURRENT_EMA_ALPHA * rawCurrentAmps) + ((1.0f - CURRENT_EMA_ALPHA) * emaFilteredCurrentAmps);
  return emaFilteredCurrentAmps;
}

/**
 * Reads 48V tractive battery pack voltage through high-voltage resistor divider.
 * Equation: trueVoltage = (adcValue * 3.3 / 4095.0) * ((R1 + R2) / R2)
 */
float readBatteryVoltage() {
  // Equation: trueVoltage = (analogRead(19) * 3.3 / 4095.0) * 18.4468;
  int rawAdc = analogRead(BATTERY_VOLTAGE_PIN);
  float trueVoltage = ((float)rawAdc * 3.3f / 4095.0f) * 18.4468f;

  if (trueVoltage < 0.5f) {
    trueVoltage = 0.0f; // Clean zero baseline when pack is disconnected
  }

  return trueVoltage;
}

/**
 * Calculates vehicle speed from Hall sensor pulse interrupts.
 * Non-blocking calculation using delta time.
 */
void updateHallSpeed() {
  unsigned long now = millis();
  unsigned long dtMs = now - lastHallCalcTime;

  if (dtMs >= HALL_CALC_INTERVAL_MS) {
    // Atomically read and calculate pulses
    noInterrupts();
    unsigned long currentPulses = hallPulseCounter;
    interrupts();

    unsigned long deltaPulses = currentPulses - prevHallPulses;
    prevHallPulses = currentPulses;
    lastHallCalcTime = now;

    if (deltaPulses == 0) {
      // Vehicle stopped or zero pulses detected
      currentSpeedHallMph = 0.0f;
    } else {
      // Calculate Wheel RPM: (deltaPulses / pulses_per_rev) * (60,000 / dt_ms) / gear_ratio
      float wheelRpm = ((float)deltaPulses / HALL_PULSES_PER_REV) * (60000.0f / (float)dtMs) / GEAR_RATIO;
      // Wheel Linear Speed (m/s) = (wheelRpm * Circumference_m) / 60
      float speedMps = (wheelRpm * WHEEL_CIRCUMFERENCE_METERS) / 60.0f;
      // Convert to MPH: 1 m/s = 2.23694 MPH
      currentSpeedHallMph = speedMps * 2.23694f;
    }
  }
}

/**
 * Asynchronously pumps GPS UART stream into TinyGPS++ parser without blocking.
 */
void updateGPS() {
  while (Serial1.available() > 0) {
    gps.encode(Serial1.read());
  }
}

// ============================================================================
// 7. SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("\n========================================================"));
  Serial.println(F("  JC-APEX ELECTROTHON TELEMETRY TRANSMITTER (48V TX)   "));
  Serial.println(F("========================================================"));

  // Initialize Vext & OLED
  powerOnVext();
  initOLED();

  // Configure ADC inputs
  analogReadResolution(12);
  analogSetPinAttenuation(CURRENT_SENSOR_PIN, ADC_11db);  // Full-scale input ~3.3V
  analogSetPinAttenuation(BATTERY_VOLTAGE_PIN, ADC_11db); // Full-scale input ~3.3V (GPIO 19)

  // Configure Hall Effect Sensor (GPIO 7) as INPUT_PULLUP with hardware interrupt
  pinMode(7, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(7), countPulse, FALLING);
  Serial.printf("[HALL] Interrupt attached: GPIO 7, countPulse, FALLING\n");

  // Initialize GPS UART on Serial1
  Serial1.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.printf("[GPS] Serial1 initialized on RX: GPIO %d, TX: GPIO %d at 9600 baud\n", GPS_RX_PIN, GPS_TX_PIN);

  // Calibrate WCS1600 current sensor zero offset
  calibrateCurrentSensorZero();

  // Initialize LoRa SX1262 Transceiver
  Serial.print(F("[LORA] Initializing SX1262 at "));
  Serial.print(LORA_FREQ);
  Serial.println(F(" MHz..."));

  int state = radio.begin(
    LORA_FREQ,
    LORA_BANDWIDTH,
    LORA_SPREAD_FACTOR,
    LORA_CODE_RATE,
    LORA_SYNC_WORD,
    LORA_TX_POWER,
    LORA_PREAMBLE_LEN
  );

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("[LORA OK] SX1262 online and ready for transmission."));
  } else {
    Serial.printf("[LORA ERROR] Failed to initialize SX1262, code: %d\n", state);
    if (oledReady) {
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println(F("LoRa INIT ERROR"));
      display.printf("Code: %d", state);
      display.display();
    }
    while (true) {
      delay(1000);
    }
  }

  Serial.println(F("[READY] Starting 5 Hz Electrothon telemetry loop...\n"));
  lastTxTime = millis();
  lastHallCalcTime = millis();
}

// ============================================================================
// 8. MAIN LOOP (NON-BLOCKING 5 HZ CYCLE)
// ============================================================================

void loop() {
  // Always pump non-blocking GPS stream
  updateGPS();

  unsigned long now = millis();

  // Check 5 Hz interval (every 200 ms)
  if (now - lastTxTime >= TX_INTERVAL_MS) {
    lastTxTime = now;

    // 1. Calculate Motor/Wheel Hall Speed
    updateHallSpeed();

    // 2. Read Sensors (Current, 48V Battery Voltage, Real-time Power)
    float currentAmps = readCurrentSensor();
    float batteryVolts = readBatteryVoltage();
    float powerWatts = batteryVolts * currentAmps;

    // 3. Extract GPS Speed
    speed_gps = gps.speed.isValid() ? (float)gps.speed.mph() : 0.0f;

    // 4. Construct Compact CSV LoRa Payload:
    // Format: packet_id,amps,volts,watts,speed_hall,speed_gps
    char payload[96];
    snprintf(payload, sizeof(payload), "%lu,%.2f,%.2f,%.2f,%.2f,%.2f",
             packetId,
             currentAmps,
             batteryVolts,
             powerWatts,
             currentSpeedHallMph,
             speed_gps);

    // 5. Transmit packet over LoRa (Non-blocking / fast transmit)
    int state = radio.transmit(payload);

    // 6. Debug print to Serial Monitor
    if (state == RADIOLIB_ERR_NONE) {
      Serial.printf("[TX #%lu] %5.1fV | %5.2fA | %6.1fW | Hall: %4.1fmph | GPS: %4.1fmph | OK\n",
                    packetId, batteryVolts, currentAmps, powerWatts, currentSpeedHallMph, speed_gps);
    } else {
      Serial.printf("[TX #%lu] TX FAILED (Code %d)\n", packetId, state);
    }

    // 7. Update Onboard OLED Screen
    updateOLED(packetId, batteryVolts, currentAmps, powerWatts, currentSpeedHallMph, speed_gps, state);

    // Increment packet ID
    packetId++;
  }
}
