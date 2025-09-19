#include <DHT.h>
#include <Servo.h>
#include <SoftwareSerial.h>

#define LED_PIN 13
#define BUZZER_PIN 12
#define SERVO_PIN 9
#define LDR_PIN A0
#define DHT_PIN 2
#define PIR_PIN 3
#define REED_PIN 4
#define POT_PIN A1
#define BUTTON_PIN 5

#define BLE_RX 10
#define BLE_TX 11

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);
Servo myServo;
SoftwareSerial BLE(BLE_RX, BLE_TX);

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(REED_PIN, INPUT_PULLUP);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Serial.begin(9600);
  BLE.begin(9600);
  myServo.attach(SERVO_PIN);
  dht.begin();

  Serial.println("Arduino ready (USB+BLE)");
  BLE.println("Arduino ready (BLE)");
}

void loop() {
  if (Serial.available()) handleCommand(Serial.readStringUntil('\n'));
  if (BLE.available()) handleCommand(BLE.readStringUntil('\n'));

  static unsigned long lastSend = 0;
  if (millis() - lastSend > 2000) {
    lastSend = millis();

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int ldr = analogRead(LDR_PIN);
    int pot = analogRead(POT_PIN);
    int pir = digitalRead(PIR_PIN);
    int reed = digitalRead(REED_PIN);
    int btn = digitalRead(BUTTON_PIN);

    String msg = "DHT:T"+String(temp)+",H"+String(hum);
    msg += ";LDR:"+String(ldr);
    msg += ";PIR:"+String(pir);
    msg += ";REED:"+String(reed);
    msg += ";POT:"+String(pot);
    msg += ";BUTTON:"+String(btn);

    Serial.println(msg);
    BLE.println(msg);
  }
}

void handleCommand(String cmd){
  cmd.trim();
  Serial.println("Got command: " + cmd);
  BLE.println("Got command: " + cmd);

  if(cmd=="LED_ON") digitalWrite(LED_PIN,HIGH);
  else if(cmd=="LED_OFF") digitalWrite(LED_PIN,LOW);
  else if(cmd=="BUZZER_ON") digitalWrite(BUZZER_PIN,HIGH);
  else if(cmd=="BUZZER_OFF") digitalWrite(BUZZER_PIN,LOW);
  else if(cmd.startsWith("SERVO:")){
    int angle = cmd.substring(6).toInt();
    angle = constrain(angle,0,180);
    myServo.write(angle);
  }
}
