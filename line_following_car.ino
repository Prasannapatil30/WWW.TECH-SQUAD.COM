/*
  TechSquad IR Line Following Car - Arduino UNO R3
  Parts: L298N driver, 3 x TCRT5000 IR line sensor modules, 4WD chassis

  Use a black line (electrical tape) on a white or light floor.
  If the car runs away from the line, flip LINE_IS_HIGH below.
  Adjust each sensor's blue potentiometer until its LED lights only over the black line.
*/

// ---------- Pins ----------
const int ENA = 5;      // left motors speed (PWM) - remove the ENA jumper on the L298N
const int IN1 = 7;
const int IN2 = 8;
const int IN3 = 12;
const int IN4 = 13;
const int ENB = 6;      // right motors speed (PWM) - remove the ENB jumper on the L298N
const int SENSOR_LEFT = A0;
const int SENSOR_CENTER = A1;
const int SENSOR_RIGHT = A2;

// ---------- Settings (tune these) ----------
const bool LINE_IS_HIGH = true;   // most modules output HIGH over black. Flip if reversed.
const int FAST = 170;             // straight speed (0-255)
const int TURN = 140;             // speed of the outer wheels when correcting
const int SLOW = 0;               // speed of the inner wheels when correcting

int lastDirection = 0;            // -1 = line was on the left, 1 = on the right

// leftSpeed / rightSpeed: -255..255 (negative = reverse)
void drive(int leftSpeed, int rightSpeed) {
  digitalWrite(IN1, leftSpeed > 0);
  digitalWrite(IN2, leftSpeed < 0);
  digitalWrite(IN3, rightSpeed > 0);
  digitalWrite(IN4, rightSpeed < 0);
  analogWrite(ENA, abs(leftSpeed));
  analogWrite(ENB, abs(rightSpeed));
}

bool onLine(int pin) {
  bool v = digitalRead(pin);
  return LINE_IS_HIGH ? v : !v;
}

void setup() {
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(SENSOR_LEFT, INPUT);
  pinMode(SENSOR_CENTER, INPUT);
  pinMode(SENSOR_RIGHT, INPUT);
  drive(0, 0);
}

void loop() {
  bool l = onLine(SENSOR_LEFT);
  bool c = onLine(SENSOR_CENTER);
  bool r = onLine(SENSOR_RIGHT);

  if (c && !l && !r) {            // centered: go straight
    drive(FAST, FAST);
  } else if (l && !r) {           // line drifted left: steer left
    drive(SLOW, TURN);
    lastDirection = -1;
  } else if (r && !l) {           // line drifted right: steer right
    drive(TURN, SLOW);
    lastDirection = 1;
  } else if (l && c && r) {       // all black (crossing / stop mark): go straight slowly
    drive(FAST - 40, FAST - 40);
  } else {                        // line lost: spin toward where it was last seen
    if (lastDirection <= 0) drive(-TURN, TURN);
    else                    drive(TURN, -TURN);
  }
  delay(5);
}
