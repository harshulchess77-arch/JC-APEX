/**
 * ============================================================================
 * JC-APEX TELEMETRY SYSTEM - RECEIVER (RX) FIRMWARE
 * ELECTROTHON 48V TRACTIVE PACK, MOTOR HALL & GPS INTEGRATION
 * ============================================================================
 * Hardware: Heltec WiFi LoRa 32 (V3) [ESP32-S3 + Semtech SX1262]
 * Interface: USB-C Serial to Host PC / Gateway (115200 baud)
 * Frequency: 915.0 MHz (US915 Band)
 *
 * ----------------------------------------------------------------------------
 * PURPOSE & PROTOCOL SPECIFICATION:
 * ----------------------------------------------------------------------------
 * 1. Catch incoming 5 Hz LoRa packets via SX1262 DIO1 hardware interrupt.
 * 2. Unpack CSV payload:
 *      packet_id,amps,volts,watts,speed_hall,speed_gps
 * 3. Append physical RF signal metrics from SX1262:
 *      - RSSI (Received Signal Strength Indicator, dBm)
 *      - SNR (Signal-to-Noise Ratio, dB)
 * 4. Output a STRICT, SINGLE-LINE JSON OBJECT to Serial at 115200 baud:
 *      {"id": 105, "amps": 45.2, "volts": 49.8, "watts": 2250.96, "speed_h": 24.5, "speed_g": 24.2, "rssi": -60, "snr": 8.1}
 *
 * CRITICAL SERIAL RULE:
 * - Suppress all other debug text or conversational messages on Serial during
 *   normal loop operation. Any stray text will cause JSONDecodeError on the
 *   Python gateway (bridge_online.py).
 * - All visual diagnostics are rendered exclusively on the onboard OLED display.
 *
 * REQUIRED ARDUINO IDE LIBRARIES:
 * - RadioLib (by Jan Gromes)
 * - ArduinoJson (by Benoit Blanchon, v6 or v7)
 * - Adafruit SSD1306 & Adafruit GFX (for onboard OLED diagnostics)
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

// Onboard OLED Display (Heltec V3: SDA=GPIO 17, SCL=GPIO 18, RST=GPIO 21, Vext=GPIO 36)
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

// ============================================================================
// 2. INTERRUPT SERVICE ROUTINE (ISR)
// ============================================================================

void IRAM_ATTR setPacketReceivedFlag() {
  packetReceivedFlag = true;
}

// ============================================================================
// 3. OLED DIAGNOSTICS (Zero Serial pollution)
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
  // Start high-speed Serial connection for Gateway bridge (SILENT - no boot messages)
  Serial.begin(SERIAL_BAUD);

  // Initialize Vext & OLED
  powerOnVext();
  initOLED();

  // Initialize SX1262 LoRa module
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
    // Attach DIO1 interrupt for non-blocking packet reception
    radio.setDio1Action(setPacketReceivedFlag);
    // Put radio into continuous reception mode
    radio.startReceive();
  } else {
    // Render error on OLED without polluting serial
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
// 5. MAIN LOOP (NON-BLOCKING INTERRUPT-DRIVEN RX)
// ============================================================================

void loop() {
  if (packetReceivedFlag) {
    packetReceivedFlag = false;

    // Read incoming packet string from radio FIFO
    String incomingStr = "";
    int readState = radio.readData(incomingStr);

    if (readState == RADIOLIB_ERR_NONE && incomingStr.length() > 0) {
      totalPacketsReceived++;

      // Extract hardware RF signal metrics
      int rssi = radio.getRSSI();
      float snr = radio.getSNR();

      // Variables to parse from 6-field CSV payload:
      // packet_id,amps,volts,watts,speed_hall,speed_gps
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

      // If watts wasn't calculated or sent, derive it
      if (watts == 0.0f && volts > 0.0f && amps > 0.0f) {
        watts = volts * amps;
      }

      // Construct STRICT JSON Serialization:
      // Format: {"id": 105, "amps": 45.2, "volts": 49.8, "watts": 2250.96, "speed_h": 24.5, "speed_g": 24.2, "rssi": -60, "snr": 8.1}
      StaticJsonDocument<256> doc;
      doc["id"] = packetId;
      doc["amps"] = round(amps * 100.0f) / 100.0f;
      doc["volts"] = round(volts * 100.0f) / 100.0f;
      doc["watts"] = round(watts * 100.0f) / 100.0f;
      doc["speed_h"] = round(speedHall * 100.0f) / 100.0f;
      doc["speed_g"] = round(speedGps * 100.0f) / 100.0f;
      doc["rssi"] = rssi;
      doc["snr"] = round(snr * 10.0f) / 10.0f;

      // Print strict single-line JSON to Serial for Python gateway (No debug strings)
      char jsonOutput[256];
      serializeJson(doc, jsonOutput);
      Serial.println(jsonOutput);

      // Update onboard OLED diagnostics
      updateOLED(packetId, volts, amps, watts, speedHall, speedGps, rssi, snr);
    }

    // Re-arm SX1262 receiver for next packet
    radio.startReceive();
  }

  // Micro-yield to prevent WDT resets
  delay(1);
}
