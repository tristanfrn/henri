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
        if(this.process != null){
            this.process.kill('SIGTERM')
            setTimeout(() => {
                this.move('stop')
            }, 400)
        }
    }
}

class Servo {
    constructor(channel) {
        this.process = null
        this.status = "ended"
        this.channel = channel
    }
    move(angle, delay, callback) {

        if(this.status === "ended") {

            this.status = "waiting"

            delay = delay == undefined ? 0 : delay

            setTimeout(() => {

                this.process = spawn('python', ['-u', './python/servo.py', this.channel, angle])
                
                this.process.stdout.on('data', (data) => {
                    var temp_status = data.toString().trim()
                    if(temp_status == "moving"){
                        this.status = "moving"
                    }
                    if(temp_status == "ended"){
                        this.status = "ended"
                        if(callback != undefined){
                            callback()
                        }
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
    
            this.servoHorizontal.move(90, 0, () => {
                this.servoVertical.move(40, 700)
            })

            this.currentAction = "watching"

        }

    }

    attack(callback){
        if(this.currentAction !== "attacking"){

            console.log('attacking')
            this.currentAction = "attacking"
    
            // this.servoHorizontal.move(90, 0, () => {
                // this.servoVertical.move(40, 0, () => {
                    this.servoVertical.move(140, 0, callback)
                // })
            // })

        }
    }

    moveFlag(callback){
        if(this.currentAction !== "moving-flag"){

            console.log('moving-flag')
            this.currentAction = "moving-flag"
    
            this.servoHorizontal.move(90, 0, () => {
                this.servoVertical.move(100, 0, () => {
                    this.servoVertical.move(140, 0, () => {
                        this.servoVertical.move(100, 0, callback)
                    })
                })
            })

        }
    }
    
    rotateRandom(callback){

        if(this.currentAction !== "rotating-random"){

            console.log('rotating-random')
            this.currentAction = "rotating-random"

            this.motor.move('right', {
                time: Math.random()*5
            }, callback)

        }

    }

    rotateLeft(time, callback){

        if(this.currentAction !== "rotating-left"){

            console.log('rotating-left')
            this.currentAction = "rotating-left"

            this.motor.move('left', {
                time: time
            }, callback)

        }

    }

    rotateRight(time, callback){

        if(this.currentAction !== "rotating-right"){

            console.log('rotating-right')
            this.currentAction = "rotating-right"

            this.motor.move('right', {
                time: time
            }, callback)

        }

    }

    moveForward(time, callback){
        
        if(this.currentAction !== "moving-forward"){

            console.log('moving-forward')
            this.currentAction = "moving-forward"

            this.servoHorizontal.move(90, 0, () => {
                this.servoVertical.move(120)
            })

            this.motor.move('forward', {
                time: time
            }, callback)

        }

    }

    moveBackward(time, callback){
        
        if(this.currentAction !== "moving-backward"){

            console.log('moving-backward')
            this.currentAction = "moving-backward"

            this.motor.move('backward', {
                time: time
            }, callback)

        }

    }

    stop(callback){
        
        if(this.currentAction !== "stopping"){

            console.log('stopping')
            this.currentAction = "stopping"
            this.motor.stop()

            callback()

            // this.resetWatchingTimeout()

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

        }, 1000)

        setInterval(() => {

            // console.log('current action is '+this.currentAction)
            
            if(this.isActive === true){
                
                if(this.currentAction == "moving-forward"){

                    var distance = this.ranging.values
                    if(distance < 70){
                        this.gotEvent('object-near', 300, () => {
                            this.stop(() => {
                                this.watching()
                            })
                        })
                    }

                }else if(this.currentAction == "watching"){
                    
                    if(this.getLastActionTime() > 15){
                        this.gotEvent('nothing-happens', 1000, () => {
                            this.rotateRandom(() => {
                                this.moveForward(3, () => {
                                    this.watching()
                                })
                            })
                        })
                    }

                    var distance = this.ranging.values
                    if(distance < 40){
                        this.gotEvent('object-near', 300, () => {
                            console.log('call attack');
                            this.attack(() => {
                                console.log('callback attach');
                                this.moveBackward(2, () => {
                                    this.watching()
                                })
                            })
                        })
                    }

                    if(this.infrared.values.right == false){
                        
                        this.gotEvent('object-near-right', 500, () => {
                            console.log('has object near right')
                            this.rotateLeft(2, () => {
                                this.watching()
                            })
                        })
                        
                    }else if(this.infrared.values.left == false){
                        
                        this.gotEvent('object-near-left', 500, () => {
                            console.log('has object near right')
                            this.rotateRight(2, () => {
                                this.watching()
                            })
                        })
                
                    }

                }else{

                    if(this.getLastActionTime() >= 7){

                        this.moveFlag(() => {
                            this.watching()
                        })

                    }
                    
                }

            }

        }, 100)
    
    }
}

let bot = new Bot()
bot.init()