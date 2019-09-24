import RPi.GPIO as GPIO
import time

DR = 16
DL = 19

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(DR,GPIO.IN,GPIO.PUD_UP)
GPIO.setup(DL,GPIO.IN,GPIO.PUD_UP)

print("starting")

try:
	while True:
		DR_status = GPIO.input(DR)
		DL_status = GPIO.input(DL)
		print(str(DR_status)+'|'+str(DL_status))
		time.sleep(0.05)
except KeyboardInterrupt:
	GPIO.cleanup();