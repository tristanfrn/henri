var picture_i = 0

function checkMovement(){

    console.log('Watching, taking picture')

    picture_i = picture_i == 0 ? 1 : 0;

    spawn('raspistill', ['-o', 'cam'+picture_i+'.jpg'])
    
    Jimp.read('cam0.jpg')
        .then(image1 => {
            Jimp.read('cam1.jpg')
                .then(image2 => {
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
    
}