/**
 * ============================================================================
 * JC-APEX TELEMETRY SYSTEM - RECEIVER (RX) FIRMWARE
 * ELECTROTHON 48V TRACTIVE PACK, MOTOR HALL & GPS INTEGRATION
 * ============================================================================
 * Hardware: Heltec WiFi LoRa 32 (V3) [ESP32-S3 + Semtech SX1262]
 * Interface: USB-C Serial to Host PC / Gateway (115200 baud)
 * Frequency: 915.0 MHz (US915 Band)
 * ============================================================================
 */

#include <Arduino.h>
#include <RadioLib.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ============================================================================
// 1. HARDWARE CONFIGURATION & PIN MAPPINGS
// ============================================================================

#define SERIAL_BAUD         115200

// LoRa SX1262 RF Parameters (Matching Transmitter exactly)
#define LORA_FREQ           915.0f  // MHz
#define LORA_BANDWIDTH      125.0f  // kHz
#define LORA_SPREAD_FACTOR  7       // SF7
#define LORA_CODE_RATE      5       // 4/5
#define LORA_SYNC_WORD      0x12    // Private network sync word
#define LORA_TX_POWER       22      // dBm
#define LORA_PREAMBLE_LEN   8       // symbols

// Heltec V3 Pinout Mapping for SX1262
#define LORA_NSS            8
#define LORA_DIO1           14
#define LORA_NRST           12
#define LORA_BUSY           13

// Onboard OLED Display Pins
#define OLED_SDA            17
#define OLED_SCL            18
#define OLED_RST            21
#define VEXT_PIN            36
#define SCREEN_WIDTH        128
#define SCREEN_HEIGHT       64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RST);
SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_NRST, LORA_BUSY);

// Non-blocking interrupt flag
volatile bool packetReceivedFlag = false;
bool oledReady = false;
uint32_t totalPacketsReceived = 0;

// Scaling multiplier for uncalibrated TX hardware (8.9V raw -> 55.0V actual)
const float UNCALIBRATED_TX_VOLTAGE_FACTOR = 6.1798f;

// ============================================================================
// 2. INTERRUPT SERVICE ROUTINE (ISR)
// ============================================================================

void IRAM_ATTR setPacketReceivedFlag() {
  packetReceivedFlag = true;
}

// ============================================================================
// 3. OLED DIAGNOSTICS
// ============================================================================

void powerOnVext() {
  pinMode(VEXT_PIN, OUTPUT);
  digitalWrite(VEXT_PIN, LOW); // LOW activates Vext on Heltec V3
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
    display.println(F("JC-APEX LoRa RX"));
    display.setCursor(0, 14);
    display.println(F("Electrothon 48V Link"));
    display.setCursor(0, 28);
    display.println(F("Listening for packets..."));
    display.display();
  }
}

void updateOLED(uint32_t pktId, float volts, float amps, float watts, float speedH, float speedG, int rssi, float snr) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.printf("RX #%lu | %d dBm", pktId, rssi);
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // Electricals
  display.setCursor(0, 12);
  display.printf("%.1fV | %.1fA", volts, amps);

  // Power
  display.setCursor(0, 24);
  display.setTextSize(2);
  if (watts >= 1000.0f) {
    display.printf("%.2f kW", watts / 1000.0f);
  } else {
    display.printf("%.0f W", watts);
  }

  // Speeds
  display.setTextSize(1);
  display.setCursor(0, 43);
  display.printf("Hall: %.1f | GPS: %.1f", speedH, speedG);

  // Signal stats
  display.setCursor(0, 55);
  display.printf("SNR: %.1fdB | Pkts: %lu", snr, totalPacketsReceived);

  display.display();
}

// ============================================================================
// 4. SETUP
// ============================================================================

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);

  // Print startup confirmation so Serial Monitor shows output immediately
  Serial.println(F("\n========================================================"));
  Serial.println(F("   JC-APEX ELECTROTHON TELEMETRY RECEIVER (RX ONLINE)   "));
  Serial.println(F("========================================================"));

  powerOnVext();
  initOLED();

  Serial.print(F("[LORA] Initializing SX1262 Receiver at "));
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
    radio.setDio1Action(setPacketReceivedFlag);
    radio.startReceive();
    Serial.println(F("[LORA OK] Receiver active. Listening for 915MHz packets...\n"));
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
}

// ============================================================================
// 5. MAIN LOOP
// ============================================================================

void loop() {
  if (packetReceivedFlag) {
    packetReceivedFlag = false;

    String incomingStr = "";
    int readState = radio.readData(incomingStr);

    if (readState == RADIOLIB_ERR_NONE && incomingStr.length() > 0) {
      totalPacketsReceived++;

      int rssi = radio.getRSSI();
      float snr = radio.getSNR();

      uint32_t packetId = 0;
      float amps = 0.0f;
      float volts = 0.0f;
      float watts = 0.0f;
      float speedHall = 0.0f;
      float speedGps = 0.0f;

      // Safe CSV tokenization
      char buffer[128];
      incomingStr.toCharArray(buffer, sizeof(buffer));

      char* token = strtok(buffer, ",");
      int tokenIndex = 0;

      while (token != NULL) {
        switch (tokenIndex) {
          case 0: packetId = (uint32_t)strtoul(token, NULL, 10); break;
          case 1: amps = atof(token); break;
          case 2: volts = atof(token); break;
          case 3: watts = atof(token); break;
          case 4: speedHall = atof(token); break;
          case 5: speedGps = atof(token); break;
          default: break;
        }
        token = strtok(NULL, ",");
        tokenIndex++;
      }

      // Auto-scale voltage if transmitter is still sending uncalibrated ~8.9V
      if (volts > 0.5f && volts < 15.0f) {
        volts = volts * UNCALIBRATED_TX_VOLTAGE_FACTOR;
      }

      // Calculate watts if zero
      watts = volts * amps;

      // Print formatted output matching Transmitter layout
      Serial.printf("[RX #%lu] %5.1fV | %5.2fA | %6.1fW | Hall: %4.1fmph | GPS: %4.1fmph | RSSI: %ddBm | SNR: %.1fdB | OK\n",
                    packetId, volts, amps, watts, speedHall, speedGps, rssi, snr);

      // Update onboard OLED display
      updateOLED(packetId, volts, amps, watts, speedHall, speedGps, rssi, snr);
    }

    // Re-arm SX1262 receiver for next packet
    radio.startReceive();
  }

  delay(1);
}