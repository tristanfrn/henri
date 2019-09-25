import Adafruit_PCA9685
import time
import sys
 
print("starting")

servo = Adafruit_PCA9685.PCA9685()
servo.set_pwm_freq(50)

var1 = int(sys.argv[1])
var2 = int(sys.argv[2])

var3 = 0
if(var1 == 0):
    var3 = var2*((600-150)/180)+150

if(var1 == 1):
    var3 = var2*((600-150)/180)+150

print("moving")

servo.set_pwm(var1, 0, var3)
time.sleep(0.4)
servo.set_pwm(var1, 0, 0)

print("ended")