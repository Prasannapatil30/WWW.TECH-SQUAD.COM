# TechSquad - Arduino UNO code for the 3 robot cars

Sketches: `obstacle_avoidance_car`, `bluetooth_car`, `line_following_car`.
These are written for the Arduino UNO R3 (CH340G) boards in the kits. They have NOT yet been run on real hardware: build one of each car and test before you ship.

## Arduino IDE setup
1. Install the Arduino IDE.
2. Plug in the Uno. If no COM port appears, install the CH340 driver.
3. Tools > Board > **Arduino Uno**, pick the COM port, open the `.ino` file, click Upload.
4. The obstacle car needs the built-in **Servo** library (already included). The Bluetooth car uses the built-in **SoftwareSerial**.

## Motor wiring (same for all three cars, L298N)
Remove the two jumpers on L298N ENA and ENB, then connect:

| L298N | Uno pin |
|---|---|
| ENA | 5 |
| IN1 | 7 |
| IN2 | 8 |
| IN3 | 12 |
| IN4 | 13 |
| ENB | 6 |
| GND | GND (also battery negative) |

- 4WD chassis: connect the two LEFT motors in parallel to OUT1/OUT2 and the two RIGHT motors in parallel to OUT3/OUT4. If a side spins backwards, swap that side's two wires.
- Battery (2 x 18650 = about 7.4 V): positive to L298N 12V terminal and to Uno VIN, negative to GND. Keep USB unplugged while running on battery.

## Obstacle avoidance car
| Part | Uno pin |
|---|---|
| HC-SR04 VCC / GND | 5V / GND |
| HC-SR04 TRIG | 9 |
| HC-SR04 ECHO | 10 |
| SG90 servo signal | 4 |
| SG90 servo power / GND | 5V / GND |

Mount the ultrasonic sensor on the servo at the front. Tune `STOP_DISTANCE_CM` and `TURN_TIME_MS` at the top of the sketch.

## Bluetooth car
| Part | Uno pin |
|---|---|
| HC-05 VCC / GND | 5V / GND |
| HC-05 TXD | 2 |
| HC-05 RXD | 3 through a voltage divider: pin 3 - 1k resistor - HC-05 RXD - 2k resistor - GND |

The divider is needed because the HC-05 data pin is 3.3 V. Without it the HC-05 can be damaged over time. Add two resistors (1k and 2k) to the kit.
Pair the phone with "HC-05" (PIN 1234 or 0000) and use any Serial Bluetooth Terminal app. Commands: F, B, L, R, S, digits 0-9 for speed.

## Line following car
| Part | Uno pin |
|---|---|
| Left TCRT5000 OUT | A0 |
| Center TCRT5000 OUT | A1 |
| Right TCRT5000 OUT | A2 |
| All sensors VCC / GND | 5V / GND |

Sensors face the floor about 5-10 mm above it. Turn each sensor's blue potentiometer until its LED lights only over the black tape.

## Troubleshooting
- Uno resets when the motors start: batteries are weak or low-charged, or the 5V/VIN wiring is loose.
- Car turns the wrong way: swap that side's motor wires.
- No Bluetooth reply: check that TXD goes to pin 2 and RXD to pin 3 (not swapped), and that the HC-05 baud is 9600.
