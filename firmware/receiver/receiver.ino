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
 */

#include <Arduino.h>
#include <RadioLib.h>
#include <ArduinoJson.h>

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

void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial);

  Serial.println(F("=== ESP32 LoRa Receiver ==="));
  Serial.println(F("Initializing RadioLib SX1262..."));

  // Initialize SX1262 with matching transmitter parameters
  int state = radio.begin(FREQUENCY, BANDWIDTH, SPREADING_FACTOR, CODING_RATE, SYNC_WORD, OUTPUT_POWER, PREAMBLE_LENGTH);
  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("RadioLib initialized successfully"));
    Serial.printf("Frequency: %.1f MHz\n", FREQUENCY);
    Serial.printf("Bandwidth: %.1f kHz\n", BANDWIDTH);
    Serial.printf("Spreading Factor: %d\n", SPREADING_FACTOR);
    Serial.printf("Coding Rate: %d\n", CODING_RATE);
  } else {
    Serial.print(F("RadioLib init failed, code: "));
    Serial.println(state);
    while (1);
  }

  Serial.println(F("Listening for telemetry packets..."));
}

void loop() {
  // Start receiving
  int state = radio.startReceive();
  if (state != RADIOLIB_ERR_NONE) {
    Serial.printf("Receive start failed, code: %d\n", state);
    delay(100);
    return;
  }

  // Wait for packet with timeout
  state = radio.receivePacket();
  if (state == RADIOLIB_ERR_NONE) {
    handleIncomingPacket();
  } else if (state == RADIOLIB_ERR_RX_TIMEOUT) {
    // Timeout is expected when no packets
  } else {
    Serial.printf("Receive error, code: %d\n", state);
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

  // LED blink on successful receive
  digitalWrite(LED_BUILTIN, HIGH);
  delay(5);
  digitalWrite(LED_BUILTIN, LOW);
}
