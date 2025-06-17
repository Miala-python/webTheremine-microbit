from microbit import *
from time import *
from machine import time_pulse_us

# Pins
trig = pin1
echo = pin2
timeout_us = 50000  # Timeout (30ms ~5m range)
pause_ms = 50

while True:
    trig.write_digital(0)
    sleep_us(2)
    trig.write_digital(1)
    sleep_us(10)
    trig.write_digital(0)
    dist = time_pulse_us(echo, 1, timeout_us)
    print(dist)
    sleep_ms(pause_ms)