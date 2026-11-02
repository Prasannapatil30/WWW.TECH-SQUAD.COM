/*
  TechSquad Obstacle Avoidance Car - Arduino UNO R3
  Parts: L298N driver, HC-SR04 ultrasonic sensor, SG90 servo, 4WD chassis

  The car drives forward. When something is closer than STOP_DISTANCE_CM it stops,
  backs up a little, looks left and right with the servo, and turns toward the side
  with more free space.

  Board in Arduino IDE: Tools > Board > Arduino Uno (CH340G clone: install the CH340 driver if no port appears)
*/

#include <Servo.h>

// ---------- Pins ----------
const int ENA = 5;      // left motors speed (PWM) - remove the ENA jumper on the L298N
const int IN1 = 7;
const int IN2 = 8;
const int IN3 = 12;
const int IN4 = 13;
const int ENB = 6;      // right motors speed (PWM) - remove the ENB jumper on the L298N
const int TRIG_PIN = 9;
const int ECHO_PIN = 10;
const int SERVO_PIN = 4;

// ---------- Settings (tune these) ----------
const int SPEED = 170;              // 0-255
const int STOP_DISTANCE_CM = 20;    // react when closer than this
const int TURN_TIME_MS = 450;       // how long to turn (depends on your car and battery)
const int BACK_TIME_MS = 300;

Servo head;

// leftSpeed / rightSpeed: -255..255 (negative = reverse)
void drive(int leftSpeed, int rightSpeed) {
  digitalWrite(IN1, leftSpeed > 0);
  digitalWrite(IN2, leftSpeed < 0);
  digitalWrite(IN3, rightSpeed > 0);
  digitalWrite(IN4, rightSpeed < 0);
  analogWrite(ENA, abs(leftSpeed));
  analogWrite(ENB, abs(rightSpeed));
}

void stopCar() { drive(0, 0); }

// Returns distance in cm (999 if nothing is detected)
int readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);  // 30 ms timeout
  if (duration == 0) return 999;
  return (int)(duration * 0.034 / 2);
}

int lookAt(int angle) {
  head.write(angle);
  delay(450);
  return readDistanceCm();
}

void setup() {
  Serial.begin(9600);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  head.attach(SERVO_PIN);
  head.write(90);          // look straight ahead
  stopCar();
  delay(1000);
}

void loop() {
  int distance = readDistanceCm();
  Serial.println(distance);

  if (distance > STOP_DISTANCE_CM) {
    drive(SPEED, SPEED);                 // forward
  } else {
    stopCar();
    delay(150);
    drive(-SPEED, -SPEED);               // back up
    delay(BACK_TIME_MS);
    stopCar();

    int leftDist = lookAt(160);          // look left
    int rightDist = lookAt(20);          // look right
    head.write(90);                      // look ahead again
    delay(300);

    if (leftDist > rightDist) {
      drive(-SPEED, SPEED);              // spin left
    } else {
      drive(SPEED, -SPEED);              // spin right
    }
    delay(TURN_TIME_MS);
    stopCar();
    delay(100);
  }
  delay(40);
}
