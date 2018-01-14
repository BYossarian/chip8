
var PIXEL_COLOUR = 'rgb(63, 188, 236)';
var CANVAS_SCALE = 10; // 10 'modern' pixels to 1 chip 8 pixel

var canvas = document.getElementById('screen');
var ctx = canvas.getContext('2d');
var getDisplayBuffer = null;

ctx.fillStyle = PIXEL_COLOUR;

function draw(vram) {

    var xCoord = 0;
    var yCoord = 0;

    // clear out canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    vram.forEach(function(value, i) {
        if (value) {
            // CANVAS_SCALE is size of old chip 8 pixels
            xCoord = (i % 64) * CANVAS_SCALE;
            yCoord = Math.floor(i / 64) * CANVAS_SCALE;
            ctx.fillRect(xCoord, yCoord, CANVAS_SCALE, CANVAS_SCALE);
        }
    });

};

function drawLoop() {

    if (!getDisplayBuffer) { return }

    var vram = getDisplayBuffer();

    if (vram) {
        draw(vram);
    }

    requestAnimationFrame(drawLoop);

}

function setVRAMRequestHandler(func) {

    getDisplayBuffer = func;

}

requestAnimationFrame(drawLoop);

module.exports = {
    setVRAMRequestHandler: setVRAMRequestHandler
};