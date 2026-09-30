// ============================================================
//  IV MONITORING SYSTEM — ESP32
//  Modules: Level Sensor | IR Drip Sensor | Bubble Sensor
//           WiFi | HTTP POST → Backend | SD Card backup
// ============================================================

#include <ESP32Servo.h>
#include <SPI.h>
#include <SD.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================================
//  PIN DEFINITIONS
// ============================================================
#define LEVEL_PIN   4
#define IR_PIN      34
#define BUBBLE_PIN  35
#define SERVO_PIN   17
#define BUZZER      5
#define SD_CS       13

// ============================================================
//  WiFi + BACKEND CONFIG
// ============================================================
const char* WIFI_SSID  = "your_wifi";
const char* WIFI_PASS  = "your_wifi_password";
const char* SERVER_URL = "Backend_api_url";

const unsigned long POST_INTERVAL = 3000;
unsigned long lastPostTime        = 0;

// ============================================================
//  OBJECTS
// ============================================================
Servo myServo;

// ============================================================
//  LEVEL SENSOR — State
//  Original logic: fixed thresholds 100 (LOW) and 300 (HIGH)
//  30 samples × 5 ms apart = 150 ms window, non-blocking
// ============================================================
int           baseline       = 0;
int           lastLevelState = -1;

// Non-blocking sampling: one touchRead per 5 ms tick, 30 samples total
const int     LEVEL_SAMPLES  = 30;
const int     LEVEL_INTERVAL = 5;
long          levelSum       = 0;
int           levelCount     = 0;
unsigned long levelSampleTimer = 0;

// ============================================================
//  IR DRIP SENSOR — State
// ============================================================
int           count       = 0;
unsigned long blockStart  = 0;
bool          beamBlocked = false;

const int           minBlockTime = 20;
const int           dropGap      = 250;
unsigned long       lastDropTime = 0;

const unsigned long emptyTime  = 15000;
bool                alertGiven  = false;
bool                bottleEmpty = false;

// ============================================================
//  BUBBLE SENSOR — State
// ============================================================
int  lastBubbleValue = 0;
int  lastBubblePrint = 0;
int  dropThreshold   = 250;
int  minValid        = 600;
bool clamped         = false;
bool bubbleDetected  = false;

unsigned long lastBubbleRead   = 0;

// ============================================================
//  BUZZER
// ============================================================
unsigned long lastBuzzerToggle = 0;
bool          buzzerState      = false;

// ============================================================
//  SD CARD
// ============================================================
void logToSD(String data) {
  File f = SD.open("/log.txt", FILE_APPEND);
  if (f) {
    f.println(data);
    f.close();
  }
}

// ============================================================
//  HTTP POST
// ============================================================
void postToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] No WiFi — SD only");
    return;
  }

  int fluid;
  if      (lastLevelState == 2) fluid = 80;
  else if (lastLevelState == 1) fluid = 45;
  else if (lastLevelState == 0) fluid = 10;
  else                          fluid = 0;

  int drip   = bottleEmpty ? 0 : count;
  int bubble = bubbleDetected ? 1 : 0;
  bubbleDetected = false;

  StaticJsonDocument<128> doc;
  doc["fluid"]  = fluid;
  doc["drip"]   = drip;
  doc["bubble"] = bubble;

  String body;
  serializeJson(doc, body);

  Serial.print("[HTTP] POST → ");
  Serial.println(body);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);

  int code = http.POST(body);

  if (code == 200) {
    String responseStr = http.getString();
    Serial.println("[HTTP] Response: " + responseStr);

    // Parse JSON response { "command": "CLAMP" } or { "command": "OPEN" }
    StaticJsonDocument<64> response;
    DeserializationError err = deserializeJson(response, responseStr);

    if (!err) {
      const char* command = response["command"];
      if (command && strcmp(command, "CLAMP") == 0 && !clamped) {
        Serial.println("[CMD] CLAMP → clamping tube");
        myServo.write(90);
        clamped = true;
        logToSD("Clamp: backend command");
      } else if (command && strcmp(command, "OPEN") == 0 && clamped) {
        Serial.println("[CMD] OPEN → opening tube");
        myServo.write(0);
        clamped = false;
        logToSD("Open: backend command");
      }
    }
  } else {
    Serial.println("[HTTP] Failed. Code: " + String(code));
    logToSD("HTTP Failed: " + String(code));
  }

  http.end();
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(IR_PIN, INPUT);
  analogSetAttenuation(ADC_11db);

  myServo.attach(SERVO_PIN);
  myServo.write(0);

  // SD Card
  if (!SD.begin(SD_CS)) {
    Serial.println("SD Card Failed!");
  } else {
    Serial.println("SD Card Ready");
    logToSD("=== System Started ===");
  }

  // ── Level sensor calibration (original logic) ────────────
  Serial.println("Calibrating...");
  delay(2000);

  long sum = 0;
  for (int i = 0; i < 50; i++) {
    sum += touchRead(LEVEL_PIN);
    delay(20);
  }
  baseline = (int)(sum / 50);
  Serial.print("Baseline: ");
  Serial.println(baseline);

  // ── WiFi ─────────────────────────────────────────────────
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
    logToSD("WiFi: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi FAILED — SD backup active");
    logToSD("WiFi FAILED");
  }

  Serial.println("System ready.");
  Serial.println("==========================================");

  lastPostTime      = millis();
  levelSampleTimer  = millis();
  lastBubbleRead    = millis();
  lastDropTime      = millis();
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
  unsigned long now = millis();

  // Auto reconnect WiFi if dropped (non-blocking — no delay)
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
  }

  // =====================================================
  // MODULE 1: LEVEL SENSOR
  // Original logic: 30 samples × 5 ms, fixed thresholds 100/300
  // Non-blocking: one sample per 5 ms tick, evaluate at 30 samples
  // =====================================================
  if (now - levelSampleTimer >= LEVEL_INTERVAL) {
    levelSampleTimer = now;
    levelSum  += touchRead(LEVEL_PIN);
    levelCount++;

    if (levelCount >= LEVEL_SAMPLES) {
      int value  = (int)(levelSum / LEVEL_SAMPLES);
      int change = abs(baseline - value);

      Serial.print("Value: ");
      Serial.print(value);
      Serial.print("  Change: ");
      Serial.print(change);
      Serial.print(" --> ");

      int levelState;
      if (change < 100) {
        Serial.println("LOW ⚠️");
        levelState = 0;
      } else if (change < 300) {
        Serial.println("MEDIUM");
        levelState = 1;
      } else {
        Serial.println("HIGH ✅");
        levelState = 2;
      }

      // Log to SD only on state change
      if (levelState != lastLevelState) {
        lastLevelState = levelState;
        String msg = "Level: ";
        if      (levelState == 0) msg += "LOW";
        else if (levelState == 1) msg += "MEDIUM";
        else                      msg += "HIGH";
        logToSD(msg);
      }

      // Buzzer: non-blocking 200 ms ON/OFF beep on LOW
      if (levelState == 0) {
        if (now - lastBuzzerToggle > 200) {
          lastBuzzerToggle = now;
          buzzerState = !buzzerState;
          digitalWrite(BUZZER, buzzerState);
        }
      } else {
        digitalWrite(BUZZER, LOW);
        buzzerState = false;
      }

      // Reset averaging window
      levelSum   = 0;
      levelCount = 0;
    }
  }

  // =====================================================
  // MODULE 2: IR DRIP SENSOR
  // =====================================================
  int irState = digitalRead(IR_PIN);

  if (irState == LOW && !beamBlocked) {
    beamBlocked = true;
    blockStart  = now;
  }

  if (irState == HIGH && beamBlocked) {
    unsigned long blockDuration = now - blockStart;
    beamBlocked = false;

    if (blockDuration > minBlockTime && now - lastDropTime > dropGap) {
      count++;
      String msg = "Drops: " + String(count);
      Serial.println(msg);
      logToSD(msg);
      lastDropTime = now;
      alertGiven   = false;
      bottleEmpty  = false;
    }
  }

  if (now - lastDropTime > emptyTime && !alertGiven) {
    Serial.println("ALERT: Bottle Empty!");
    logToSD("Bottle Empty!");
    alertGiven  = true;
    bottleEmpty = true;
    count       = 0;
    if (!clamped) {
      myServo.write(90);
      clamped = true;
      logToSD("Clamp: Bottle empty");
    }
  }

  // =====================================================
  // MODULE 3: BUBBLE SENSOR
  // =====================================================
  if (now - lastBubbleRead > 200) {
    lastBubbleRead = now;

    int value = analogRead(BUBBLE_PIN);
    if (value < 50) return;

    if (abs(value - lastBubblePrint) > 100) {
      Serial.print("Bubble ADC: ");
      Serial.println(value);
      logToSD("Bubble: " + String(value));
      lastBubblePrint = value;
      
    }

    if (value > minValid) {
      if ((lastBubbleValue - value) > dropThreshold && !clamped) {
        Serial.println("Bubble Detected → CLAMPING");
        logToSD("Bubble Detected → Clamp");
        bubbleDetected = true;
        myServo.write(90);
        clamped = true;
      } 
      lastBubbleValue = value;
    }
  }

  // =====================================================
  // MODULE 4: HTTP POST every 3 seconds
  // =====================================================
  if (now - lastPostTime >= POST_INTERVAL) {
    lastPostTime = now;
    postToBackend();
  }
}