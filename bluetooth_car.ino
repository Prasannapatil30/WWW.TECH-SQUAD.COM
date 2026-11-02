/*
  TechSquad Bluetooth Control Car - Arduino UNO R3
  Parts: L298N driver, HC-05 Bluetooth module, 4WD chassis

  Pair your phone with the HC-05 (name "HC-05", PIN 1234 or 0000), open a
  "Serial Bluetooth Terminal" app (or any Bluetooth RC car app) and send one letter:
    F = forward   B = backward   L = left   R = right   S = stop
    0..9 = speed (0 slowest, 9 fastest)     q = full speed

  HC-05 wiring (IMPORTANT):
    HC-05 VCC -> Uno 5V      HC-05 GND -> Uno GND
    HC-05 TXD -> Uno pin 2
    HC-05 RXD <- Uno pin 3 through a voltage divider: pin 3 - 1k - HC-05 RXD - 2k - GND
    (the HC-05 data pin is 3.3V, the Uno sends 5V)
*/

#include <SoftwareSerial.h>

// ---------- Pins ----------
const int ENA = 5;      // left motors speed (PWM) - remove the ENA jumper on the L298N
const int IN1 = 7;
const int IN2 = 8;
const int IN3 = 12;
const int IN4 = 13;
const int ENB = 6;      // right motors speed (PWM) - remove the ENB jumper on the L298N
const int BT_RX = 2;    // Uno receives here (from HC-05 TXD)
const int BT_TX = 3;    // Uno sends here (to HC-05 RXD via divider)

SoftwareSerial bt(BT_RX, BT_TX);
int speedValue = 180;   // 0-255

// leftSpeed / rightSpeed: -255..255 (negative = reverse)
void drive(int leftSpeed, int rightSpeed) {
  digitalWrite(IN1, leftSpeed > 0);
  digitalWrite(IN2, leftSpeed < 0);
  digitalWrite(IN3, rightSpeed > 0);
  digitalWrite(IN4, rightSpeed < 0);
  analogWrite(ENA, abs(leftSpeed));
  analogWrite(ENB, abs(rightSpeed));
}

void setup() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  drive(0, 0);

  Serial.begin(9600);
  bt.begin(9600);          // default HC-05 data speed
  Serial.println("Bluetooth car ready");
}

void loop() {
  if (bt.available()) {
    char c = bt.read();
    switch (c) {
      case 'F': case 'f': drive(speedValue, speedValue); break;
      case 'B': case 'b': drive(-speedValue, -speedValue); break;
      case 'L': case 'l': drive(-speedValue, speedValue); break;   // spin left
      case 'R': case 'r': drive(speedValue, -speedValue); break;   // spin right
      case 'S': case 's': drive(0, 0); break;
      case 'q': speedValue = 255; break;
      default:
        if (c >= '0' && c <= '9') {
          speedValue = map(c - '0', 0, 9, 90, 255);
        }
        break;
    }
  }
}
