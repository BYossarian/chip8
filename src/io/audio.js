
var audioCtx = null;
var oscillator = null;
var gainNode = null;

// some browser don't support AudioContext and some apparently throw 
// in certain cases so:
try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
} catch (err) {}

if (audioCtx) {
    // create oscillator
    oscillator = audioCtx.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = 3000; // value in hertz
    oscillator.start();

    // create gain node for turning sound on/off
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    // connect it all up
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
}

function setAudioState(state) {

    if (!gainNode) {
        // no sound for you!
        return;
    }

    if (state) {
        gainNode.gain.value = 1;
    } else {
        gainNode.gain.value = 0;
    }

}

module.exports = {
    setAudioState: setAudioState
};