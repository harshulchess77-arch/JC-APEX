/**
 * ESP32 LoRa Receiver Node
 * Hardware: Heltec V3 ESP32 SX1262 LoRa Module
 * Interface: USB Serial to local host laptop
 * Frequency: 915.0 MHz
 *
 * Purpose:
 * - Listen for LoRa packets from transmitter
 * - Parse telemetry data
 * - Attach RSSI/SNR metrics
 * - Output formatted JSON to Serial USB at 115200 baud
 * - Display RX stats on OLED
 * - Non-blocking DIO1 interrupt for reliable reception
 */

#include <Arduino.h>
#include <RadioLib.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// OLED Configuration (Heltec V3)
#define OLED_SDA 8
#define OLED_SCL 9
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// LoRa Configuration - SX1262 (matching transmitter)
#define FREQUENCY 915.0
#define BANDWIDTH 125.0
#define SPREADING_FACTOR 7
#define CODING_RATE 5
#define OUTPUT_POWER 22
#define PREAMBLE_LENGTH 8
#define SYNC_WORD 0x12

// Serial Configuration
#define SERIAL_BAUD 115200

// Global Variables
SX1262 radio = new Module(SS, DIO1, RST, BUSY);
uint32_t packetsReceived = 0;
volatile bool packetReceived = false;
int lastRSSI = 0;
float lastSNR = 0.0;

// DIO1 interrupt flag
volatile bool dio1Flag = false;

// Non-blocking interrupt handler
void IRAM_ATTR onDIO1Flag() {
  dio1Flag = true;
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial);

  Serial.println(F("=== ESP32 LoRa Receiver ==="));

  // Initialize OLED
  Wire.begin(OLED_SDA, OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED initialization failed"));
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println(F("RX Node Init..."));
    display.display();
  }

  Serial.println(F("Initializing RadioLib SX1262..."));

  // Initialize SX1262 with matching transmitter parameters
  int state = radio.begin(FREQUENCY, BANDWIDTH, SPREADING_FACTOR, CODING_RATE, SYNC_WORD, OUTPUT_POWER, PREAMBLE_LENGTH);
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("RadioLib initialized successfully"));
    Serial.printf("Frequency: %.1f MHz\n", FREQUENCY);
    Serial.printf("Bandwidth: %.1f kHz\n", BANDWIDTH);
    Serial.printf("Spreading Factor: %d\n", SPREADING_FACTOR);
    Serial.printf("Coding Rate: %d\n", CODING_RATE);

    // Set DIO1 interrupt for non-blocking reception
    radio.setDio1Action(onDIO1Flag);
  } else {
    Serial.print(F("RadioLib init failed, code: "));
    Serial.println(state);
    while (1);
  }

  // Initialize OLED with initial status
  updateOLED(0, 0, 0.0);

  Serial.println(F("Listening for telemetry packets..."));
}

void loop() {
  // Start receiving (non-blocking with DIO1 interrupt)
  int state = radio.startReceive();
  if (state != RADIOLIB_ERR_NONE) {
    Serial.printf("Receive start failed, code: %d\n", state);
    delay(100);
    return;
  }

  // Wait for DIO1 interrupt flag (non-blocking)
  unsigned long startTime = millis();
  while (!dio1Flag && (millis() - startTime < 1000)) {
    // Small delay to prevent tight loop
    delay(1);
  }

  if (dio1Flag) {
    dio1Flag = false;
    state = radio.receivePacket();
    if (state == RADIOLIB_ERR_NONE) {
      handleIncomingPacket();
    } else if (state != RADIOLIB_ERR_RX_TIMEOUT) {
      Serial.printf("Receive error, code: %d\n", state);
    }
  }
}

void handleIncomingPacket() {
  packetsReceived++;

  // Get packet data
  int packetSize = radio.getPacketLength();
  char buffer[256];
  radio.readData(buffer, packetSize);
  buffer[packetSize] = '\0';

  // Get signal metrics from RadioLib
  int rssi = radio.getRSSI();
  float snr = radio.getSNR();

  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, buffer);

  if (error) {
    Serial.printf("[%lu] RX ERROR: Failed to parse JSON: %s\n", millis(), error.c_str());
    return;
  }

  // Extract telemetry data
  uint32_t packetId = doc["packet_id"];
  float current = doc["current"];

  // Update signal metrics
  lastRSSI = rssi;
  lastSNR = snr;

  // Build enhanced JSON with signal metrics injected
  StaticJsonDocument<256> outputDoc;
  outputDoc["packet_id"] = packetId;
  outputDoc["current"] = current;
  outputDoc["rssi"] = rssi;
  outputDoc["snr"] = round(snr * 10) / 10.0;

  // Serialize and output to Serial
  char outputBuffer[256];
  serializeJson(outputDoc, outputBuffer);
  Serial.println(outputBuffer);

  // Update OLED with latest stats
  updateOLED(packetsReceived, rssi, snr);

  // LED blink on successful receive
  digitalWrite(LED_BUILTIN, HIGH);
  delay(5);
  digitalWrite(LED_BUILTIN, LOW);
}

void updateOLED(uint32_t packetCount, int rssi, float snr) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println(F("RX Node Status"));

  display.setCursor(0, 12);
  display.printf("Packet #%lu", packetCount);

  display.setCursor(0, 24);
  display.printf("RSSI: %d dBm", rssi);

  display.setCursor(0, 36);
  display.printf("SNR: %.1f dB", snr);

  display.setCursor(0, 48);
  display.printf("Freq: %.1f MHz", FREQUENCY);

  display.display();
}
