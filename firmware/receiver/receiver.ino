/**
 * ============================================================================
 * JC-APEX TELEMETRY SYSTEM — RECEIVER (RX) FIRMWARE v2.1 (PRODUCTION)
 * ELECTRATHON AMERICA PIT-LANE GATEWAY & OLED MONITOR
 * ============================================================================
 * Target MCU : Heltec WiFi LoRa 32 (V3) [ESP32-S3 + Semtech SX1262]
 * Interface  : USB-C Serial JSON Stream (115200 baud) for Python Dashboard
 * RF Link    : 915.0 MHz | BW 125 kHz | SF7 | CR 4/5 | Sync 0x12
 * ============================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <RadioLib.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ============================================================================
// 1. HARDWARE PIN MAPPING (HELTEC WIFI LORA 32 V3)
// ============================================================================

#define SERIAL_BAUD           115200

// Semtech SX1262 LoRa Pins
#define LORA_NSS              8
#define LORA_DIO1             14
#define LORA_NRST             12
#define LORA_BUSY             13

//LoRa RF Parameters (Matches Transmitter v2.0)
#define LORA_FREQ             915.0f
#define LORA_BW               125.0f
#define LORA_SF               7
#define LORA_CR               5
#define LORA_SYNC_WORD        0x12
#define LORA_TX_POWER         22
#define LORA_PREAMBLE         8

// Onboard SSD1306 128x64 OLED Pins
#define OLED_SDA              17
#define OLED_SCL              18
#define OLED_RST              21
#define PIN_VEXT              36
#define SCREEN_WIDTH          128
#define SCREEN_HEIGHT         64

#define LINK_TIMEOUT_MS       2500UL  // Warn on OLED if no packet for 2.5 seconds

// ============================================================================
// 2. INSTANCES & TELEMETRY STATE
// ============================================================================

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RST);
SX1262 radio = new Module(LORA_NSS, LORA_DIO1, LORA_NRST, LORA_BUSY);

volatile bool packetReadyFlag = false;
bool          oledReady       = false;

struct TelemetryFrame {
  uint32_t id        = 0;
  float    amps      = 0.0f;
  float    volts     = 0.0f;
  float    watts     = 0.0f;
  float    speedHall = 0.0f;
  float    speedGps  = 0.0f;
  double   lat       = 0.0;
  double   lng       = 0.0;
  uint8_t  sats      = 0;
  float    wh        = 0.0f;
  int      rssi      = 0;
  float    snr       = 0.0f;
} rxData;

uint32_t totalPacketsOk     = 0;
uint32_t totalPacketsBadCs  = 0;
uint32_t lastPacketRxMs     = 0;

// ============================================================================
// 3. INTERRUPT & CHECKSUM VALIDATION
// ============================================================================

void IRAM_ATTR onPacketReceivedISR() {
  packetReadyFlag = true;
}

uint8_t computeXorChecksum(const char* str) {
  uint8_t cs = 0;
  while (*str) {
    cs ^= (uint8_t)(*str++);
  }
  return cs;
}

bool verifyAndStripChecksum(char* buffer) {
  char* starPtr = strchr(buffer, '*');
  if (starPtr == nullptr) {
    // Legacy packet without checksum — accept for backward compatibility
    return true;
  }

  uint8_t expectedCs = (uint8_t)strtoul(starPtr + 1, nullptr, 16);
  *starPtr = '\0'; // Terminate string at '*' so only payload is checksummed & parsed
  uint8_t actualCs = computeXorChecksum(buffer);
  return (expectedCs == actualCs);
}

// ============================================================================
// 4. OLED PIT-LANE DISPLAY
// ============================================================================

void initOLED() {
  pinMode(PIN_VEXT, OUTPUT);
  digitalWrite(PIN_VEXT, LOW);
  delay(50);

  Wire.begin(OLED_SDA, OLED_SCL);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledReady = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println(F("JC-APEX PIT RECEIVER"));
    display.setCursor(0, 14);
    display.println(F("915 MHz LoRa Active"));
    display.setCursor(0, 28);
    display.println(F("Waiting for car TX..."));
    display.display();
  }
}

void updateOLED(bool linkActive) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  if (linkActive) {
    display.printf("RX #%lu | %ddBm", rxData.id, rxData.rssi);
  } else {
    display.printf("SIGNAL LOST (%lus)", (millis() - lastPacketRxMs) / 1000UL);
  }
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // Electricals
  display.setCursor(0, 12);
  display.printf("%5.1fV | %5.2fA | %.0fWh", rxData.volts, rxData.amps, rxData.wh);

  // Power
  display.setCursor(0, 24);
  display.setTextSize(2);
  if (rxData.watts >= 1000.0f) {
    display.printf("%.2f kW", rxData.watts / 1000.0f);
  } else {
    display.printf("%.0f W", rxData.watts);
  }

  // Speeds
  display.setTextSize(1);
  display.setCursor(0, 43);
  display.printf("Hall:%.1f | GPS:%.1fmph", rxData.speedHall, rxData.speedGps);

  // Link Quality Footer
  display.setCursor(0, 55);
  display.printf("SNR:%.1fdB | OK:%lu", rxData.snr, totalPacketsOk);

  display.display();
}

// ============================================================================
// 5. PACKET PARSER & JSON SERIALIZER
// ============================================================================

void parseAndPublishPacket(String& rawStr) {
  char buf[160];
  rawStr.toCharArray(buf, sizeof(buf));

  if (!verifyAndStripChecksum(buf)) {
    totalPacketsBadCs++;
    return;
  }

  char* savePtr = nullptr;
  char* token   = strtok_r(buf, ",", &savePtr);
  int   field   = 0;

  while (token != nullptr) {
    switch (field) {
      case 0: rxData.id        = (uint32_t)strtoul(token, nullptr, 10); break;
      case 1: rxData.amps      = strtof(token, nullptr); break;
      case 2: rxData.volts     = strtof(token, nullptr); break;
      case 3: rxData.watts     = strtof(token, nullptr); break;
      case 4: rxData.speedHall = strtof(token, nullptr); break;
      case 5: rxData.speedGps  = strtof(token, nullptr); break;
      case 6:
        rxData.lat = strtod(token, nullptr);
        if (rxData.lat < -90.0 || rxData.lat > 90.0) rxData.lat = 0.0;
        break;
      case 7:
        rxData.lng = strtod(token, nullptr);
        if (rxData.lng < -180.0 || rxData.lng > 180.0) rxData.lng = 0.0;
        break;
      case 8: rxData.sats      = (uint8_t)atoi(token); break;
      case 9: rxData.wh        = strtof(token, nullptr); break;
      default: break;
    }
    token = strtok_r(nullptr, ",", &savePtr);
    field++;
  }

  // Require at least the core 6 telemetry fields to be valid
  if (field < 6) return;

  // Enforce physical consistency (Watts = Volts * Amps)
  rxData.watts = rxData.volts * rxData.amps;
  rxData.rssi  = radio.getRSSI();
  rxData.snr   = radio.getSNR();

  totalPacketsOk++;
  lastPacketRxMs = millis();

  // Serialize clean JSON for Python telemetry bridge
  StaticJsonDocument<384> doc;
  doc["id"]      = rxData.id;
  doc["amps"]    = serialized(String(rxData.amps, 2));
  doc["volts"]   = serialized(String(rxData.volts, 2));
  doc["watts"]   = serialized(String(rxData.watts, 1));
  doc["wh"]      = serialized(String(rxData.wh, 1));
  doc["speed_h"] = serialized(String(rxData.speedHall, 1));
  doc["speed_g"] = serialized(String(rxData.speedGps, 1));
  doc["lat"]     = serialized(String(rxData.lat, 6));
  doc["lng"]     = serialized(String(rxData.lng, 6));
  doc["sats"]    = rxData.sats;
  doc["rssi"]    = rxData.rssi;
  doc["snr"]     = serialized(String(rxData.snr, 1));

  serializeJson(doc, Serial);
  Serial.println();

  updateOLED(true);
}

// ============================================================================
// 6. SETUP & MAIN LOOP
// ============================================================================

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(400);

  initOLED();

  int state = radio.begin(LORA_FREQ, LORA_BW, LORA_SF, LORA_CR, LORA_SYNC_WORD, LORA_TX_POWER, LORA_PREAMBLE);
  if (state == RADIOLIB_ERR_NONE) {
    radio.setDio1Action(onPacketReceivedISR);
    radio.startReceive();
  } else {
    Serial.printf("{\"error\":\"LORA_INIT_FAIL\",\"code\":%d}\n", state);
    while (true) { delay(1000); }
  }
}

void loop() {
  if (packetReadyFlag) {
    packetReadyFlag = false;

    String incomingStr;
    int state = radio.readData(incomingStr);
    if (state == RADIOLIB_ERR_NONE && incomingStr.length() > 0) {
      parseAndPublishPacket(incomingStr);
    }

    radio.startReceive();
  }

  // Refresh OLED if link times out so pit crew knows car is out of range/off
  static uint32_t lastWatchdogMs = 0;
  if (totalPacketsOk > 0 && (millis() - lastPacketRxMs > LINK_TIMEOUT_MS)) {
    if (millis() - lastWatchdogMs > 1000) {
      lastWatchdogMs = millis();
      updateOLED(false);
    }
  }
}
