const { spawn } = require('child_process');
const Jimp = require('jimp');
const PiCamera = require('pi-camera');

var picture_i = 0

const camera = new PiCamera({
    mode: 'photo',
    output: `${ __dirname }/'cam${ picture_i }.jpg'`,
    width: 640,
    height: 480,
    timeout: 2000,
    nopreview: true
})

function checkMovement(){

    console.log('Watching, taking picture')

    picture_i = picture_i == 0 ? 1 : 0;

    // spawn('raspistill ', ['-w 480', '-h 360', '-n', '-gc', '-th none', '-x none', '-t 2000', '-o cam'+picture_i+'.jpg'])


    camera.snap()
        .then((result) => {
            console.log('opening cam0 ...')
            Jimp.read('cam0.jpg')
                .then(image1 => {
                    console.log('opening cam1 ...')
                    Jimp.read('cam1.jpg')
                    .then(image2 => {
                        console.log('calculating diff ...')
                        var distance = Jimp.distance(image1, image2)
                            // var diff = Jimp.diff(image1, image2)
                            console.log(distance)
                            checkMovement()
                        })
                        .catch(err => {
                            console.log(err)
                            checkMovement()
                        })
                    })
                    .catch(err => {
                        console.log(err)
                        checkMovement() 
                    })
        })
        .catch((error) => {
            console.log(error)
            checkMovement() 
        })
    
}

checkMovement()