/**
 * ============================================================================
 * JC-APEX TELEMETRY SYSTEM — TRANSMITTER (TX) FIRMWARE v2.0
 * ELECTRATHON AMERICA 48V TRACTIVE PACK, HALL SPEED & GPS TELEMETRY
 * ============================================================================
 * Target MCU : Heltec WiFi LoRa 32 (V3) [ESP32-S3 + Semtech SX1262]
 * RF Link    : 915.0 MHz | BW 125 kHz | SF7 | CR 4/5 | Sync 0x12 | 22 dBm
 * Update Rate: 5 Hz (200 ms deterministic telemetry loop)
 *
 * LIVE SERIAL CALIBRATION COMMANDS (115200 baud, Newline):
 *   V=54.80   -> Calibrates battery voltage to match multimeter (54.80V) & saves to Flash
 *   ZERO      ->Zeros the WCS1600 current sensor at 0A load & saves to Flash
 *   I=12.50   -> Calibrates current sensitivity to match clamp meter (12.50A) & saves
 *   RESET     -> Restores default theoretical calibration constants
 *   STATUS    -> Prints current saved calibration parameters and raw pin voltages
 * ============================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <Preferences.h>
#include <RadioLib.h>
#include <TinyGPSPlus.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ============================================================================
// 1. HARDWARE PIN MAPPING (HELTEC WIFI LORA 32 V3)
// ============================================================================

// Analog Sensor Pins
#define PIN_CURRENT_ADC       1     // GPIO 1 (ADC1_CH0) - WCS1600 Current Sensor via 10k/18k divider
#define PIN_VOLTAGE_ADC       19    // GPIO 19 - 48V Pack Divider (Move to GPIO 4/5/6 if rewiring)
#define PIN_HELTEC_ADC_CTRL   37    // GPIO 37 - Isolates Heltec onboard LiPo divider from GPIO 1
#define PIN_USR_BUTTON        0     // GPIO 0  - Onboard PRG/USR button (hold 1s to zero current)

// Hall Effect Wheel Speed Sensor
#define PIN_HALL_SENSOR       7     // GPIO 7  - Active-low Hall sensor (INPUT_PULLUP)

// GPS UART1 (Setting TX to -1 frees GPIO 17 so onboard OLED & GPS work together!)
#define PIN_GPS_RX            15    // GPIO 15 <- GPS TX
#define PIN_GPS_TX            -1    // Unused (ESP32 only receives NMEA sentences from GPS)
#define GPS_BAUD              9600

// Semtech SX1262 LoRa Internal SPI Bus
#define LORA_NSS              8
#define LORA_DIO1             14
#define LORA_NRST             12
#define LORA_BUSY             13

// Onboard SSD1306 128x64 OLED Display
#define OLED_SDA              17
#define OLED_SCL              18
#define OLED_RST              21
#define PIN_VEXT              36    // Active LOW power switch for onboard OLED
#define SCREEN_WIDTH          128
#define SCREEN_HEIGHT         64

// LoRa Radio Configuration (Must match Receiver)
#define LORA_FREQ             915.0f
#define LORA_BW               125.0f
#define LORA_SF               7
#define LORA_CR               5
#define LORA_SYNC_WORD        0x12
#define LORA_TX_POWER         22
#define LORA_PREAMBLE         8

// ============================================================================
// 2. DEFAULT PHYSICAL & KINEMATIC CONSTANTS
// ============================================================================

// Default Theoretical Constants (Overridden automatically when calibrated via Serial)
const float DEFAULT_VOLT_MULTIPLIER   = 18.4468f; // (820k + 47k) / 47k
const float DEFAULT_CURR_DIVIDER      = 1.5556f;  // (10k + 18k) / 18k
const float DEFAULT_CURR_MV_PER_AMP   = 22.0f;    // WCS1600 standard sensitivity (22 mV/A)
const float DEFAULT_CURR_ZERO_VOLTS   = 2.5000f;  // WCS1600 0A output (at sensor Vout)

// Filtering & Noise Rejection
const int   ADC_OVERSAMPLE_COUNT      = 32;       // 32 samples per reading (trimmed mean)
const float CURRENT_EMA_ALPHA         = 0.30f;    // Exponential moving average smoothing
const float CURRENT_DEADBAND_AMPS     = 0.15f;    // Clamps < 0.15A sensor noise floor to 0.00A
const float VOLTAGE_DEADBAND_VOLTS    = 0.80f;    // Clamps floating/disconnected pack to 0.00V

// Wheel Hall Kinematics (Period-Based High-Resolution Timing)
const float WHEEL_CIRCUMFERENCE_M     = 1.55f;    // 20-inch Electrathon wheel circumference (meters)
const float PULSES_PER_REVOLUTION     = 1.0f;     // Number of magnets on wheel hub
const float GEAR_RATIO                = 1.0f;     // 1.0 for direct wheel mount
const uint32_t HALL_DEBOUNCE_US       = 20000UL;  // 20 ms min pulse period (~173 mph physical max)
const uint32_t HALL_ZERO_TIMEOUT_US   = 2500000UL;// 2.5 s without pulse = 0.0 mph

// Loop Timing
const uint32_t TELEMETRY_INTERVAL_MS  = 200;      // 5 Hz transmission rate

// ============================================================================
// 3. GLOBAL INSTANCES & STATE VARIABLES
// ============================================================================

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RST);
SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_NRST, LORA_BUSY);
TinyGPSPlus gps;
Preferences prefs;

// Runtime Calibration State (Persisted in ESP32 NVS Flash)
struct CalibrationConfig {
  float voltMultiplier;     // PackVolts = PinVolts * voltMultiplier
  float currDividerRatio;   // SensorVolts = PinVolts * currDividerRatio
  float currZeroSensorV;    // Sensor voltage at 0.00A
  float currMvPerAmp;       // Sensor sensitivity in mV/A
} cal;

// Live Telemetry State
uint32_t packetId           = 0;
uint32_t lastLoopMs         = 0;
uint32_t lastEnergyIntegMs  = 0;
bool     oledReady          = false;

float    rawBattPinVolts    = 0.0f;
float    rawCurrPinVolts    = 0.0f;
float    batteryVolts       = 0.0f;
float    currentAmps        = 0.0f;
float    powerWatts         = 0.0f;
float    cumulativeWh       = 0.0f;
float    speedHallMph       = 0.0f;
float    speedGpsMph        = 0.0f;

// Hall Sensor ISR Variables (Volatile for thread-safe ISR access)
volatile uint32_t isrLastPulseUs      = 0;
volatile uint32_t isrPulseIntervalUs  = 0;
volatile uint32_t isrTotalPulses      = 0;

// Non-blocking LoRa TX State
volatile bool loraTxDoneFlag          = true;
bool          loraTransmitting        = false;
int           lastLoraState           = RADIOLIB_ERR_NONE;

// ============================================================================
// 4. INTERRUPT SERVICE ROUTINES (ISRs)
// ============================================================================

void IRAM_ATTR onHallPulseISR() {
  uint32_t nowUs = micros();
  uint32_t dtUs  = nowUs - isrLastPulseUs;
  if (dtUs >= HALL_DEBOUNCE_US) {
    isrPulseIntervalUs = dtUs;
    isrLastPulseUs     = nowUs;
    isrTotalPulses++;
  }
}

void IRAM_ATTR onLoraTxDoneISR() {
  loraTxDoneFlag = true;
}

// ============================================================================
// 5. ROBUST ADC ENGINE (TRIMMED MEAN + FACTORY eFUSE CALIBRATION)
// ============================================================================

/**
 * Samples the pin 32 times using Espressif factory eFuse millivolt curves,
 * sorts the array, discards the lowest 8 and highest 8 switching-noise spikes,
 * and averages the center 16 readings.
 */
float samplePinVoltsFiltered(uint8_t pin) {
  uint32_t samples[ADC_OVERSAMPLE_COUNT];
  for (int i = 0; i < ADC_OVERSAMPLE_COUNT; i++) {
    samples[i] = analogReadMilliVolts(pin);
  }

  // Insertion sort (fast for N=32)
  for (int i = 1; i < ADC_OVERSAMPLE_COUNT; i++) {
    uint32_t key = samples[i];
    int j = i - 1;
    while (j >= 0 && samples[j] > key) {
      samples[j + 1] = samples[j];
      j--;
    }
    samples[j + 1] = key;
  }

  // Average the middle 50% (indices 8 through 23)
  uint32_t sumMv = 0;
  const int trim = ADC_OVERSAMPLE_COUNT / 4;
  for (int i = trim; i < ADC_OVERSAMPLE_COUNT - trim; i++) {
    sumMv += samples[i];
  }

  float avgMv = (float)sumMv / (float)(ADC_OVERSAMPLE_COUNT - (2 * trim));
  return avgMv / 1000.0f;
}

// ============================================================================
// 6. NVS FLASH CALIBRATION & INTERACTIVE SERIAL ENGINE
// ============================================================================

void loadCalibrationFromFlash() {
  prefs.begin("jcapex_cal", true); // Read-only mode
  cal.voltMultiplier   = prefs.getFloat("v_mult", DEFAULT_VOLT_MULTIPLIER);
  cal.currDividerRatio = prefs.getFloat("i_div",  DEFAULT_CURR_DIVIDER);
  cal.currZeroSensorV  = prefs.getFloat("i_zero", DEFAULT_CURR_ZERO_VOLTS);
  cal.currMvPerAmp     = prefs.getFloat("i_sens", DEFAULT_CURR_MV_PER_AMP);
  prefs.end();
}

void saveCalibrationToFlash() {
  prefs.begin("jcapex_cal", false); // Read-write mode
  prefs.putFloat("v_mult", cal.voltMultiplier);
  prefs.putFloat("i_div",  cal.currDividerRatio);
  prefs.putFloat("i_zero", cal.currZeroSensorV);
  prefs.putFloat("i_sens", cal.currMvPerAmp);
  prefs.end();
}

void zeroCurrentSensor(bool saveToNvs) {
  Serial.println(F("[CAL] Sampling WCS1600 0A baseline (keep motor OFF)..."));
  float accumPinV = 0.0f;
  for (int i = 0; i < 25; i++) {
    accumPinV += samplePinVoltsFiltered(PIN_CURRENT_ADC);
    delay(5);
  }
  float avgPinV = accumPinV / 25.0f;
  cal.currZeroSensorV = avgPinV * cal.currDividerRatio;
  currentAmps = 0.0f;

  if (saveToNvs) {
    saveCalibrationToFlash();
  }
  Serial.printf("[CAL OK] Zero-Current Baseline = %.4f V (GPIO %d Pin = %.4f V)\n",
                cal.currZeroSensorV, PIN_CURRENT_ADC, avgPinV);
}

void printCalibrationStatus() {
  Serial.println(F("\n---------------- JC-APEX CALIBRATION STATUS ----------------"));
  Serial.printf("  Battery Pin (GPIO %d) Raw : %.4f V\n", PIN_VOLTAGE_ADC, rawBattPinVolts);
  Serial.printf("  Voltage Multiplier       : %.4f  --> Calculated Pack: %.2f V\n", cal.voltMultiplier, batteryVolts);
  Serial.printf("  Current Pin (GPIO %d) Raw : %.4f V (Sensor Vout: %.4f V)\n",
                PIN_CURRENT_ADC, rawCurrPinVolts, rawCurrPinVolts * cal.currDividerRatio);
  Serial.printf("  Current 0A Baseline      : %.4f V | Sensitivity: %.2f mV/A\n",
                cal.currZeroSensorV, cal.currMvPerAmp);
  Serial.println(F("  Commands: V=<multimeter_V> | ZERO | I=<clamp_A> | RESET | STATUS"));
  Serial.println(F("------------------------------------------------------------\n"));
}

void processSerialCommands() {
  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toUpperCase();
  if (cmd.length() == 0) return;

  if (cmd.startsWith("V=")) {
    float trueVolts = cmd.substring(2).toFloat();
    float pinV = samplePinVoltsFiltered(PIN_VOLTAGE_ADC);
    if (trueVolts > 1.0f && pinV > 0.05f) {
      cal.voltMultiplier = trueVolts / pinV;
      saveCalibrationToFlash();
      Serial.printf("\n[CAL SAVED] Multimeter=%.2fV, Pin=%.4fV -> New Multiplier = %.4f\n\n",
                    trueVolts, pinV, cal.voltMultiplier);
    } else {
      Serial.println(F("[CAL ERR] Pin voltage too low (<0.05V). Check battery connection!"));
    }
  } else if (cmd == "ZERO") {
    zeroCurrentSensor(true);
  } else if (cmd.startsWith("I=")) {
    float trueAmps = cmd.substring(2).toFloat();
    float pinV = samplePinVoltsFiltered(PIN_CURRENT_ADC);
    float sensorV = pinV * cal.currDividerRatio;
    float deltaMv = fabsf(sensorV - cal.currZeroSensorV) * 1000.0f;
    if (trueAmps > 0.5f && deltaMv > 5.0f) {
      cal.currMvPerAmp = deltaMv / trueAmps;
      saveCalibrationToFlash();
      Serial.printf("\n[CAL SAVED] ClampMeter=%.2fA -> New Sensitivity = %.3f mV/A\n\n",
                    trueAmps, cal.currMvPerAmp);
    } else {
      Serial.println(F("[CAL ERR] Apply at least 1A load before calibrating I=<amps>."));
    }
  } else if (cmd == "RESET") {
    cal.voltMultiplier   = DEFAULT_VOLT_MULTIPLIER;
    cal.currDividerRatio = DEFAULT_CURR_DIVIDER;
    cal.currMvPerAmp     = DEFAULT_CURR_MV_PER_AMP;
    saveCalibrationToFlash();
    zeroCurrentSensor(true);
    Serial.println(F("\n[CAL RESET] Restored default theoretical constants.\n"));
  } else if (cmd == "STATUS") {
    printCalibrationStatus();
  }
}

// ============================================================================
// 7. SENSOR UPDATE FUNCTIONS
// ============================================================================

void updateElectricalSensors() {
  // 1. Battery Voltage
  rawBattPinVolts = samplePinVoltsFiltered(PIN_VOLTAGE_ADC);
  float calcVolts = rawBattPinVolts * cal.voltMultiplier;
  batteryVolts    = (calcVolts < VOLTAGE_DEADBAND_VOLTS) ? 0.0f : calcVolts;

  // 2. Tractive Current (Polarity-independent via fabsf)
  rawCurrPinVolts   = samplePinVoltsFiltered(PIN_CURRENT_ADC);
  float sensorVolts = rawCurrPinVolts * cal.currDividerRatio;
  float rawAmps     = fabsf(sensorVolts - cal.currZeroSensorV) * 1000.0f / cal.currMvPerAmp;

  // Exponential Moving Average filter applied BEFORE zero-deadband
  currentAmps = (CURRENT_EMA_ALPHA * rawAmps) + ((1.0f - CURRENT_EMA_ALPHA) * currentAmps);
  if (currentAmps < CURRENT_DEADBAND_AMPS) {
    currentAmps = 0.0f;
  }

  // 3. Power & Cumulative Energy (Watt-hours)
  powerWatts = batteryVolts * currentAmps;
  uint32_t nowMs = millis();
  if (lastEnergyIntegMs > 0) {
    float dtHours = (float)(nowMs - lastEnergyIntegMs) / 3600000.0f;
    cumulativeWh += powerWatts * dtHours;
  }
  lastEnergyIntegMs = nowMs;
}

void updateWheelHallSpeed() {
  noInterrupts();
  uint32_t lastPulseUs = isrLastPulseUs;
  uint32_t intervalUs  = isrPulseIntervalUs;
  interrupts();

  uint32_t ageUs = micros() - lastPulseUs;

  // If no pulse received within timeout window (2.5s), wheel is stopped
  if (lastPulseUs == 0 || intervalUs == 0 || ageUs > HALL_ZERO_TIMEOUT_US) {
    speedHallMph = 0.0f;
    return;
  }

  // If the current wait time exceeds the last interval, smoothly decay speed downward
  uint32_t effectivePeriodUs = (ageUs > intervalUs) ? ageUs : intervalUs;

  float wheelRevPerSec = (1000000.0f / (float)effectivePeriodUs) / (PULSES_PER_REVOLUTION * GEAR_RATIO);
  float speedMetersPerSec = wheelRevPerSec * WHEEL_CIRCUMFERENCE_M;
  speedHallMph = speedMetersPerSec * 2.236936f;
}

void serviceGPS() {
  while (Serial1.available() > 0) {
    gps.encode(Serial1.read());
  }
}

// ============================================================================
// 8. OLED DISPLAY ENGINE
// ============================================================================

void initOLED() {
  pinMode(PIN_VEXT, OUTPUT);
  digitalWrite(PIN_VEXT, LOW); // Enable Vext 3.3V rail for OLED
  delay(50);

  Wire.begin(OLED_SDA, OLED_SCL);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledReady = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println(F("JC-APEX TELEMETRY v2"));
    display.setCursor(0, 14);
    display.println(F("Initializing Sensors"));
    display.display();
  }
}

void renderOLED() {
  if (!oledReady) return;
  display.clearDisplay();

  // Top Bar: Packet ID & GPS Fix
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.printf("TX #%lu | SAT:%u %s",
                 packetId,
                 gps.satellites.isValid() ? gps.satellites.value() : 0,
                 gps.location.isValid() ? "LOCK" : "WAIT");
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // Row 1: Volts & Amps
  display.setCursor(0, 12);
  display.printf("%5.1fV | %5.2fA", batteryVolts, currentAmps);

  // Row 2: Large Power Readout
  display.setCursor(0, 23);
  display.setTextSize(2);
  if (powerWatts >= 1000.0f) {
    display.printf("%.2f kW", powerWatts / 1000.0f);
  } else {
    display.printf("%.0f W", powerWatts);
  }

  // Row 3: Hall Speed, GPS Speed, and Energy Used
  display.setTextSize(1);
  display.setCursor(0, 43);
  display.printf("H:%.1f G:%.1fmph|%.0fWh", speedHallMph, speedGpsMph, cumulativeWh);

  // Row 4: Raw Pin Diagnostics (for instant multimeter check!)
  display.setCursor(0, 55);
  display.printf("P19:%.2fV P1:%.2fV %s",
                 rawBattPinVolts,
                 rawCurrPinVolts,
                 (lastLoraState == RADIOLIB_ERR_NONE) ? "OK" : "ERR");

  display.display();
}

// ============================================================================
// 9. PACKET CHECKSUM & NON-BLOCKING LORA TRANSMIT
// ============================================================================

uint8_t computeXorChecksum(const char* str) {
  uint8_t cs = 0;
  while (*str) {
    cs ^= (uint8_t)(*str++);
  }
  return cs;
}

void transmitTelemetryPacket() {
  // Reap previous asynchronous TX if completed
  if (loraTransmitting) {
    if (loraTxDoneFlag) {
      loraTxDoneFlag = false;
      loraTransmitting = false;
      radio.finishTransmit();
    } else {
      // Radio still busy from previous frame; skip to avoid blocking loop
      return;
    }
  }

  speedGpsMph = gps.speed.isValid() ? (float)gps.speed.mph() : 0.0f;
  float lat   = gps.location.isValid() ? (float)gps.location.lat() : 0.0f;
  float lng   = gps.location.isValid() ? (float)gps.location.lng() : 0.0f;
  uint8_t sat = gps.satellites.isValid() ? (uint8_t)gps.satellites.value() : 0;

  // Build core CSV payload (10 fields: id,amps,volts,watts,speed_h,speed_g,lat,lng,sats,wh)
  char corePayload[112];
  snprintf(corePayload, sizeof(corePayload),
           "%lu,%.2f,%.2f,%.1f,%.1f,%.1f,%.6f,%.6f,%u,%.1f",
           packetId,
           currentAmps,
           batteryVolts,
           powerWatts,
           speedHallMph,
           speedGpsMph,
           lat,
           lng,
           sat,
           cumulativeWh);

  // Append *XX hex XOR checksum for corruption immunity
  uint8_t cs = computeXorChecksum(corePayload);
  char fullPacket[124];
  snprintf(fullPacket, sizeof(fullPacket), "%s*%02X", corePayload, cs);

  lastLoraState = radio.startTransmit(fullPacket);
  if (lastLoraState == RADIOLIB_ERR_NONE) {
    loraTransmitting = true;
    Serial.printf("[TX #%lu] %5.2fV (Pin19:%.3fV) | %5.2fA (Pin1:%.3fV) | %6.1fW | %5.1fWh | Hall:%4.1fmph | GPS:%4.1fmph | Sats:%u\n",
                  packetId, batteryVolts, rawBattPinVolts, currentAmps, rawCurrPinVolts,
                  powerWatts, cumulativeWh, speedHallMph, speedGpsMph, sat);
  } else {
    Serial.printf("[TX #%lu] LORA START ERR: %d\n", packetId, lastLoraState);
  }

  packetId++;
}

// ============================================================================
// 10. ARDUINO SETUP & MAIN LOOP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(400);

  Serial.println(F("\n========================================================"));
  Serial.println(F("   JC-APEX ELECTRATHON TELEMETRY TRANSMITTER (v2.0)     "));
  Serial.println(F("========================================================"));

  // Isolate Heltec V3 onboard battery sense FET from GPIO 1
  pinMode(PIN_HELTEC_ADC_CTRL, INPUT);
  pinMode(PIN_USR_BUTTON, INPUT_PULLUP);

  // Configure ESP32-S3 SAR ADC for 12-bit factory eFuse calibrated reads
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_CURRENT_ADC, ADC_11db);
  analogSetPinAttenuation(PIN_VOLTAGE_ADC, ADC_11db);

  initOLED();
  loadCalibrationFromFlash();

  // Auto-zero current sensor on startup if no current baseline was saved yet
  zeroCurrentSensor(false);

  // Configure Hall sensor interrupt
  pinMode(PIN_HALL_SENSOR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_HALL_SENSOR), onHallPulseISR, FALLING);

  // Configure GPS UART1 (RX only on GPIO 15 so GPIO 17 OLED works!)
  Serial1.setRxBufferSize(1024);
  Serial1.begin(GPS_BAUD, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);

  // Initialize SX1262 LoRa Radio
  int state = radio.begin(LORA_FREQ, LORA_BW, LORA_SF, LORA_CR, LORA_SYNC_WORD, LORA_TX_POWER, LORA_PREAMBLE);
  if (state == RADIOLIB_ERR_NONE) {
    radio.setDio1Action(onLoraTxDoneISR);
    Serial.println(F("[LORA OK] SX1262 915MHz Non-Blocking Transmitter Ready."));
  } else {
    Serial.printf("[LORA FATAL] SX1262 init failed (code %d)\n", state);
    while (true) { delay(1000); }
  }

  printCalibrationStatus();
  lastLoopMs = millis();
  lastEnergyIntegMs = millis();
}

void loop() {
  serviceGPS();
  processSerialCommands();

  // Hold onboard PRG/USR button (GPIO 0) to zero current sensor anytime on the grid
  if (digitalRead(PIN_USR_BUTTON) == LOW) {
    delay(40);
    if (digitalRead(PIN_USR_BUTTON) == LOW) {
      zeroCurrentSensor(true);
      while (digitalRead(PIN_USR_BUTTON) == LOW) { delay(10); }
    }
  }

  uint32_t nowMs = millis();
  if (nowMs - lastLoopMs >= TELEMETRY_INTERVAL_MS) {
    lastLoopMs = nowMs;

    updateElectricalSensors();
    updateWheelHallSpeed();
    transmitTelemetryPacket();
    renderOLED();
  }
}