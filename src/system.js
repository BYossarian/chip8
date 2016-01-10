
// chip-8 includes a set of pre-defined spites for each of 
// the hexadecimal characters
var HEX_CHARACTER_GLYPHS = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];
// used to control 'clock speed'
var CYCLE_TIMEOUT = 4;

var instructions = require('./instructions.js');
var getInstructionName = require('./get-instruction-name.js');
var audio = require('./io/audio.js');
var display = require('./io/display.js');
var input = require('./io/input.js');

var system = {

    // 4096 bytes of memory
    // so memory addresses will be 3 hexademical digits
    // 0x000 to 0x1FF is for the system
    // (with 0x050 to 0x0A0 being the built-in font set)
    // 0x200 onwards is for programs
    // (actually, video ram and call stack full up the high end addresses 
    // but we don't need to worry about those)
    memory: new Uint8Array(4096),

    // the program counter, pc
    // points to the address in memory of the currently executing opcode
    pc: 0x200,

    // 16 8-bit registers
    // all can be used directly, although the last of them is often 
    // altered by certain opcodes
    registers: new Uint8Array(16),

    // a single register used for storing memory addresses
    // used as a pointer for reading graphics sprites; and 
    // reading/writing the registers to main memory
    // called the I (index) register in the chip 8 spec
    iRegister: 0x000,

    // each memory address is 12 bits long
    // just use 16 bits per address for simplicity
    callStack: new Uint16Array(16),

    stackPointer: 0,

    // video memory
    // monochrome graphics on a 64x32 pixel display
    // just going to use one byte per pixel for simplicity
    vram: new Uint8Array(2048),

    // used to signify whenever a redraw is required
    drawFlag: false,

    // this is a register whose value can be set, and will be 
    // decreased at a rate of 60Hz. Used for timing.
    delayTimer: 0,

    // this is a register whose value can be set, and will be 
    // decreased at a rate of 60Hz. Whenever it holds a nonzero 
    // value a sound is to be played
    soundTimer: 0,

    // the input for chip 8 consisted of a keyboard with only 
    // hexadecimal characters (ie. 0-9 and A-F).
    // this will hold the state of each key
    keyStates: new Uint16Array(16),

    // js timer ids
    timerInterval: 0,
    cycleTimeout: 0,

    // resets the system to it's initial state.
    // needs to run at least once to load the hex glyphs 
    // into memory.
    reset: function() {

        this.memory.fill(0);
        this.pc = 0x200;
        this.registers.fill(0);
        this.iRegister = 0x000;
        this.callStack.fill(0);
        this.stackPointer = 0;
        this.vram.fill(0);
        this.drawFlag = false;
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.inputFlag = false;
        this.inputBuffer = 0;

        // load the hex glyphs into memory, starting at address 0x050
        this.memory.set(HEX_CHARACTER_GLYPHS, 0x050);

    },

    init: function() {

        // run a reset to load hex glyphs into memory
        this.reset();

    },

    // loads a program, in the form of an ArrayBuffer, into memory
    loadProgram: function(buffer) {

        this.memory.set(new Uint8Array(buffer), 0x200);

    },

    getDisplayBuffer: function() {

        if (!this.drawFlag) {
            return null;
        }

        this.drawFlag = false;
        return this.vram;

    },

    updateKeyState: function(hexNumber, state) {

        this.keyStates[hexNumber] = state ? 1 : 0;

    },

    cycle: function() {

        // the opcode corresponds to the two sequential bytes held in 
        // memory at the location given by the program counter, pc.
        // combining the two bytes into one:
        var opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];
        var instructionName = getInstructionName(opcode);

        // run code
        instructions[instructionName](system, opcode);

        audio.setAudioState(!!this.soundTimer);

        this.cycleTimeout = setTimeout(this.cycle.bind(this), CYCLE_TIMEOUT);

    },

    start: function() {

        // timers should be decreased at a rate of 60Hz
        this.timerInterval = setInterval(function() {

            if (system.delayTimer) {
                system.delayTimer--;
            }

            if (system.soundTimer) {
                system.soundTimer--;
            }

        }, 16);

        this.cycle();

    },

    stop: function() {

        // stop any sound
        audio.setAudioState(false);

        // stop loops
        clearTimeout(cycleTimeout);
        clearInterval(timerInterval);

    }

};

system.init();

display.setVRAMRequestHandler(system.getDisplayBuffer.bind(system));

input.setStartProgramHandler(function(buffer) {
    system.reset();
    system.loadProgram(buffer);
    system.start();
});

input.setKeyChangeHandler(system.updateKeyState.bind(system));