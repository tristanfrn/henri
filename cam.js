const { spawn } = require('child_process');
const Jimp = require('jimp');
const PiCamera = require('pi-camera');

var picture_i = 0

function checkMovement(){

    console.log('taking picture')

    picture_i = picture_i == 0 ? 1 : 0;

    let camera = new PiCamera({
        mode: 'photo',
        output: `${ __dirname }/'cam${ picture_i }.jpg'`,
        width: 640,
        height: 480,
        timeout: 2000,
        nopreview: true
    })

    camera.snap()
        .then((result) => {
            console.log('opening cam0 ...')
            Jimp.read('cam0.jpg')
                .then(image1 => {
                    console.log('opening cam1 ...')
                    Jimp.read('cam1.jpg')
                    .then(image2 => {
                        console.log('calculating diff ...')
                            // var distance = Jimp.distance(image1, image2)
                            var diff = Jimp.diff(image1, image2)
                            console.log((diff.percent*100).toFixed(0)+'%')
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