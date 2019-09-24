const { spawn } = require('child_process');
const PiCamera = require('pi-camera');
const Jimp = require('jimp');

class Infrared {
    constructor() {

        this.process = spawn('python', ['-u', './python/infrared.py'])
        this.lastData = {
            left: true,
            right: true
        }

        this.process.stdout.on('data', (data) => {
            this.lastData = this.handleValue(data.toString())
        })

        this.process.on('close', (code, signal) => {
            console.log(`Infrared ended : ${signal}`)
        })

    }
    handleValue(value){
        var values = value.trim().split('|')
        return {
            left: values[0] == 1 ? true : false,
            right: values[1] == 1 ? true : false
        }
    }
    get values() {
        return this.lastData
    }
    stop() {
        child.kill('SIGTERM')
    }
}

class Ranging {
    constructor() {

        this.process = spawn('python', ['-u', './python/ranging.py'])
        this.lastData = null

        this.process.stdout.on('data', (data) => {
            this.lastData = this.handleValue(data.toString())
        })

        this.process.on('close', (code, signal) => {
            console.log(`Infrared ended : ${signal}`)
        })
    }
    handleValue(value){
        var value = parseFloat(value.trim())
        return isNaN(value) ? 99999 : value
    }
    get values() {
        return this.lastData
    }
    stop() {
        child.kill('SIGTERM')
    }
}

class Motor {
    constructor() {
        this.direction = null
        this.process = null
        this.status = "ended"
    }
    move(direction, options, callback) {
        
        if(this.status === "ended") {

            this.direction = direction
            this.status = "waiting"

            if(this.process != null){
                this.process.kill('SIGTERM')
            }

            if(options !== undefined && options.time !== undefined){
                this.process = spawn('python', ['-u', './python/move.py', direction, options.time])
            }else{
                this.process = spawn('python3', ['-u', './python/move.py', direction])
            }

            // this.process.on('close', (code, signal) => {
            //     console.log(`Motor move ended : ${signal}`)
            // })

            this.process.stdout.on('data', (data) => {
                var temp_status = data.toString().trim()
                if(temp_status == "ended"){
                    this.status = "ended"
                    if(callback != undefined){
                        callback()
                    }
                }
                if(temp_status == "moving"){
                    this.status = "moving"
                }
            })

            setTimeout(() => {
                if(this.status != "ended"){
                    this.status = "ended"
                    if(callback != undefined){
                        callback()
                    }
                }
            }, 10000)

        }else{
            console.log('last action not ended')
        }

    }
    
    stop() {
        this.lastDirection = null
        this.process.kill('SIGTERM')
        setTimeout(() => {
            this.move('stop')
        }, 400)
    }
}

class Servo {
    constructor(channel) {
        this.process = null
        this.status = "ended"
        this.channel = channel
    }
    move(angle, delay) {

        if(this.status === "ended") {

            this.status = "waiting"

            delay = delay == undefined ? 0 : delay

            setTimeout(() => {

                this.process = spawn('python', ['-u', './python/servo.py', this.channel, angle])
                
                this.process.stdout.on('data', (data) => {
                    var temp_status = data.toString().trim()
                    if(temp_status == "ended"){
                        this.status = "ended"
                    }
                    if(temp_status == "moving"){
                        this.status = "moving"
                    }
                })

            }, delay)

            // this.process.on('close', (code, signal) => {
            //     console.log(`Motor move ended : ${signal}`)
            // })


        }

    }
    
    stop() {
        this.lastDirection = null
        this.process.kill('SIGTERM')
        this.move('stop')
    }
}

class Bot {
    constructor() {
        
        this.infrared = new Infrared()
        this.ranging = new Ranging()
        this.motor = new Motor()
        this.servoHorizontal = new Servo(0)
        this.servoVertical = new Servo(1)

        this.isActive = false
        this.currentAction = null
        this.watchingTimeout = null

    }
    
    watching(){

        if(this.currentAction !== "watching"){

            console.log('watching')

            this.currentAction = "watching"
    
            this.servoHorizontal.move(90)
            this.servoVertical.move(40, 700)

        }

    }

    attack(){
        if(this.currentAction !== "attacking"){

            console.log('attacking')
            this.currentAction = "attacking"
    
            // this.servoHorizontal.move(90)
            // this.servoVertical.move(40, 500)
            this.servoVertical.move(140)
    
            // this.resetWatchingTimeout()

        }
    }

    escapeLeft(){

        if(this.currentAction !== "escape-left"){

            console.log('escape-left')
            this.currentAction = "escape-left"

            this.servoVertical.move(125)
            this.servoHorizontal.move(30, 500)
            // var vertical_angle = Math.floor(Math.random() * 40 + 90)
            
            this.motor.move('left', {
                time: 0.25
            })

            // this.resetWatchingTimeout()

        }

    }

    escapeRight(){

        if(this.currentAction !== "escape-right"){

            console.log('escape-right')
            this.currentAction = "escape-right"

            this.servoVertical.move(150)
            this.servoHorizontal.move(140, 500)
            // var vertical_angle = Math.floor(Math.random() * 40 + 90)

            this.motor.move('right', {
                time: 0.25
            })

            // this.resetWatchingTimeout()
        }

    }
    
    rotateRandom(callback){

        if(this.currentAction !== "rotating-random"){

            console.log('rotating-random')
            this.currentAction = "rotating-random"

            this.motor.move('right', {
                time: Math.random()*2
            }, callback)

        }

    }

    moveForward(){
        
        if(this.currentAction !== "moving-forward"){

            console.log('moving-forward')
            this.currentAction = "moving-forward"

            this.servoHorizontal.move(90)
            this.servoVertical.move(120, 600)

            this.motor.move('forward', {
                time: 10
            })

            // setTimeout(() => {
            //     this.resetWatchingTimeout()
            // }, 10000)

        }

    }

    moveBackward(){
        
        if(this.currentAction !== "moving-forward"){

            console.log('moving-forward')
            this.currentAction = "moving-forward"

            this.motor.move('backward', {
                time: 2
            })

        }

    }

    stop(){
        
        if(this.currentAction !== "stopping"){

            console.log('stopping')
            this.currentAction = "stopping"

            this.motor.stop()

            // this.resetWatchingTimeout()

        }

    }

    checkMovement(){

        if(this.currentAction == "watching"){

            console.log('Watching, taking picture')

            this.picture_i = this.picture_i === undefined ? 1 : this.picture_i;
            this.picture_i = this.picture_i == 0 ? 1 : 0;

            spawn('raspistill', ['-o', 'cam'+this.picture_i+'.jpg'])
            
            Jimp.read('cam0.jpg')
                .then(image1 => {
                    Jimp.read('cam1.jpg')
                        .then(image2 => {
                            var distance = Jimp.distance(image1, image2)
                            // var diff = Jimp.diff(image1, image2)
                            console.log(distance)
                            this.checkMovement()
                        })
                        .catch(err => {
                            console.log(err)
                            this.checkMovement()
                        })
                })
                .catch(err => {
                    console.log(err)
                    this.checkMovement()
                })

        }else{

            setTimeout(() => {
                this.checkMovement()
            }, 1000)
        }
        
    }

    // resetWatchingTimeout(){
    //     if(this.watchingTimeout != null){
    //         clearTimeout(this.watchingTimeout)
    //     }
    //     this.watchingTimeout = setTimeout(() => {
    //         this.watching()
    //     }, 2000)
    // }

    gotEvent(event, min, callback){

        min = min/100
        
        this.eventsCounts = this.eventsCounts == undefined ? {} : this.eventsCounts
        this.eventsTimeouts = this.eventsTimeouts == undefined ? {} : this.eventsTimeouts

        this.eventsCounts[event] = this.eventsCounts[event] == undefined ? 1 : (this.eventsCounts[event]+1)
        
        if(this.eventsTimeouts[event] !== undefined && this.eventsTimeouts[event] != null){
            clearTimeout(this.eventsTimeouts[event])
            this.eventsTimeouts[event] = null
        }

        console.log(event+' '+this.eventsCounts[event])
        if(this.eventsCounts[event] >= min){
            callback()
            this.setLastActionTime()
        }

        this.eventsTimeouts[event] = setTimeout(() => {
            this.eventsCounts[event] = 0
        }, 300)

    }

    setLastActionTime(){
        this.lastActionTimestamp = Math.round(new Date().getTime()/1000)
    }

    getLastActionTime(){
        if(this.lastActionTimestamp !== undefined){
            return (Math.round(new Date().getTime()/1000)) - this.lastActionTimestamp
        }else{
            return 0
        }
    }

    init(){

        console.log('starting bot')

        setTimeout(() => {

            console.log('activating bot')
            this.isActive = true

            this.setLastActionTime()
            this.watching()

            setTimeout(() => {
                // this.checkMovement()
            }, 1000)

        }, 1000)

        setInterval(() => {
            
            if(this.isActive === true){
                
                if(this.currentAction == "moving-forward"){

                    var distance = this.ranging.values
                    if(distance < 40){
                        this.gotEvent('object-near', 300, () => {
                            this.stop()
                        })
                    }

                }else if(this.currentAction == "watching"){
                    
                    if(this.getLastActionTime() > 30){
                        this.gotEvent('nothing-happens', 1000, () => {
                            
                            this.rotateRandom(() => {
                                this.moveForward()
                            })

                        })
                    }

                    var distance = this.ranging.values
                    if(distance < 15){
                        this.gotEvent('object-near', 300, () => {
                            this.attack()
                        })
                    }

                    if(this.infrared.values.right == false){
                        
                        this.gotEvent('object-near-right', 1000, () => {
                            this.escapeLeft()
                        })
                        
                    }else if(this.infrared.values.left == false){
                        
                        this.gotEvent('object-near-left', 1000, () => {
                            this.escapeRight()
                        })
                
                    }

                }else{

                    if(this.getLastActionTime() >= 4){
                        this.watching()
                    }
                    
                }

            }

        }, 100)
    
    }
}

let bot = new Bot()
bot.init()