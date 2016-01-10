
// Original keyboard layout:
//     +---+---+---+---+
//     | 1 | 2 | 3 | C |
//     +---+---+---+---+
//     | 4 | 5 | 6 | D |
//     +---+---+---+---+
//     | 7 | 8 | 9 | E |
//     +---+---+---+---+
//     | A | 0 | B | F |
//     +---+---+---+---+
var KEY_BINDINGS = {
    'x': 0x0,
    '1': 0x1,
    '2': 0x2,
    '3': 0x3,
    'q': 0x4,
    'w': 0x5,
    'e': 0x6,
    'a': 0x7,
    's': 0x8,
    'd': 0x9,
    'z': 0xA,
    'c': 0xB,
    '4': 0xC,
    'r': 0xD,
    'f': 0xE,
    'v': 0xF
};

var fileInput = document.getElementById('tape');
var startProgram = null;
var updateKeyState = null;
var currentKey = 0;

fileInput.addEventListener('change', function() {

    if (!startProgram) { return; }
    
    var reader = new FileReader();
    var file = this.files[0];

    if (!file) { return; }

    // TODO: add error event handler on reader
    reader.onload = function() {
        startProgram(this.result);
    };
    reader.readAsArrayBuffer(file);

}, false);

document.body.addEventListener('keydown', function(e) {

    if (!updateKeyState) { return; }

    var character = String.fromCharCode(e.which || e.keyCode).toLowerCase();
    var hexValue = KEY_BINDINGS[character];

    if (!hexValue) {
        return;
    }

    updateKeyState(hexValue, true);

});

document.body.addEventListener('keyup', function(e) {

    if (!updateKeyState) { return; }

    var character = String.fromCharCode(e.which || e.keyCode).toLowerCase();
    var hexValue = KEY_BINDINGS[character];

    if (!hexValue) {
        return;
    }

    updateKeyState(hexValue, false);

});

function setStartProgramHandler(func) {

    startProgram = func;

}

function setKeyChangeHandler(func) {

    updateKeyState = func;

}

module.exports = {
    setStartProgramHandler: setStartProgramHandler,
    setKeyChangeHandler: setKeyChangeHandler
};