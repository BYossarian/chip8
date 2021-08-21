
// NB: there seems to be some differences in documented behaviour
// see the footnotes to the opcodes here: https://en.wikipedia.org/wiki/CHIP-8
// For the bitshift operations, sometimes the second argument is ignored.
// Look at the function definitions for more info
var BITSHIFT_USES_REG_Y = false;
// For reading/writing the registers to memory, sometimes register I isn't 
// changed. Again, look at function definitions for more info.
var MOVE_I_ON_MEM_READ_WRITE = true;

var system = require('./system.js');

// all instructions are responsible for moving the program counter (pc)
// to it's required position
var instructions = {

    callMachineCode: function(system) {
        // opcode 0x0NNN where NNN is the address of the machine code.
        // this isn't usually implemented to the point where it's effectively
        // depreciated. throw a specific error, just in case it get's used
        throw new Error('Machine code subroutines not implemented.');
    },

    clearScreen: function(system) {
        // opcode 0x00E0
        system.vram.fill(0);
        system.drawFlag = true;
        system.pc += 2;
    },

    returnFromSubroutine: function(system) {
        // opcode 0x00EE
        // REVIEW: behaviour if call stack is empty?
        system.stackPointer--;
        system.pc = system.callStack[system.stackPointer];
        system.pc += 2;
    },

    jumpToAddress: function(system, opcode) {
        // opcode 0x1NNN where NNN is the address
        // therefore address is last three bytes of the opcode 
        // i.e. opcode & 0x0FFF
        system.pc = opcode & 0x0FFF;
    },

    callSubroutine: function(system, opcode) {
        // opcode 0x2NNN where NNN is the address of the
        // subroutine, therefore address is last three bytes 
        // of the opcode i.e. opcode & 0x0FFF
        // REVIEW: behaviour if call stack exceeded?
        system.callStack[system.stackPointer] = system.pc;
        system.stackPointer++;
        system.pc = opcode & 0x0FFF;
    },

    skipIfRegisterEqualsConstant: function(system, opcode) {
        // opcode 0x3XNN where X is the index of the register, and 
        // NN is the constant to compare against
        var registerValue = system.registers[(opcode & 0x0F00) >> 8];
        if (registerValue === (opcode & 0x00FF)) {
            system.pc += 4;
        } else {
            system.pc += 2;
        }
    },

    skipIfRegisterNotEqualsConstant: function(system, opcode) {
        // opcode 0x4XNN where X is the index of the register, and 
        // NN is the constant to compare against
        var registerValue = system.registers[(opcode & 0x0F00) >> 8];
        if (registerValue !== (opcode & 0x00FF)) {
            system.pc += 4;
        } else {
            system.pc += 2;
        }
    },

    skipIfRegistersEqual: function(system, opcode) {
        // opcode 0x5XY0 where X and Y are the indices of the 
        // registers to compare
        var registerXValue = system.registers[(opcode & 0x0F00) >> 8];
        var registerYValue = system.registers[(opcode & 0x00F0) >> 4];
        if (registerXValue === registerYValue) {
            system.pc += 4;
        } else {
            system.pc += 2;
        }
    },

    storeValue: function(system, opcode) {
        // opcode 0x6XNN where NN should be stored in register X
        system.registers[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
        system.pc += 2;
    },

    addToRegister: function(system, opcode) {
        // opcode 0x7XNN where NN should be added to register X
        system.registers[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
        system.pc += 2;
    },

    copyRegisterValue: function(system, opcode) {
        // opcode 0x8XY0 where the register X is set to the value of 
        // register Y
        system.registers[(opcode & 0x0F00) >> 8] = system.registers[(opcode & 0x00F0) >> 4];
        system.pc += 2;
    },

    bitwiseOr: function(system, opcode) {
        // opcode 0x8XY1 where the register X is set to the bitwise OR of 
        // registers X and Y
        system.registers[(opcode & 0x0F00) >> 8] |= system.registers[(opcode & 0x00F0) >> 4];
        system.pc += 2;
    },

    bitwiseAnd: function(system, opcode) {
        // opcode 0x8XY2 where the register X is set to the bitwise AND of 
        // registers X and Y
        system.registers[(opcode & 0x0F00) >> 8] &= system.registers[(opcode & 0x00F0) >> 4];
        system.pc += 2;
    },

    bitwiseXor: function(system, opcode) {
        // opcode 0x8XY3 where the register X is set to the bitwise XOR of 
        // registers X and Y
        system.registers[(opcode & 0x0F00) >> 8] ^= system.registers[(opcode & 0x00F0) >> 4];
        system.pc += 2;
    },

    addRegisters: function(system, opcode) {
        // opcode 0x8XY4 where the register X is set to the sum of 
        // registers X and Y. If the sum exceeds 0xFF (i.e. the largest 
        // number that can be stored in a register) then the result will 
        // wrap. i.e. we're really doing addition modulo 0xFF.
        // If wrapping occurs then set the last register (0xF) to 1; otherwise 0.
        var registerXIndex = (opcode & 0x0F00) >> 8;
        var sum = system.registers[registerXIndex] + system.registers[(opcode & 0x00F0) >> 4];
        if (sum > 0xFF) {
            system.registers[0xF] = 1;
        } else {
            system.registers[0xF] = 0;
        }
        // wrapping is taken care of by the JS engine since we're using typed arrays
        system.registers[registerXIndex] = sum;
        system.pc += 2;
    },

    subtractRegistersXFromY: function(system, opcode) {
        // opcode 0x8XY5 where the register X is set to the difference of 
        // register X minus Y. If the difference is negative (i.e. goes outside 
        // the bounds of numbers that can be stored in a register) then the result will 
        // wrap.
        // If wrapping occurs then set the last register (0xF) to 0; otherwise 1.
        var registerXIndex = (opcode & 0x0F00) >> 8;
        var difference = system.registers[registerXIndex] - system.registers[(opcode & 0x00F0) >> 4];
        if (difference < 0) {
            system.registers[0xF] = 0;
        } else {
            system.registers[0xF] = 1;
        }
        // wrapping is taken care of by the JS engine since we're using typed arrays
        system.registers[registerXIndex] = difference;
        system.pc += 2;
    },

    bitShiftRight: function(system, opcode) {
        // opcode 0x8XY6 where register X is set to the value of shifting the bits of 
        // either register X or Y right one bit. Different documents on chip 8 make 
        // different claims about whether to use X or Y, hence the BITSHIFT_USES_REG_Y flag.
        // Set register VF to value of the least significant bit prior to the shift.
        var registerIndex = BITSHIFT_USES_REG_Y ? (opcode & 0x00F0) >> 4 : (opcode & 0x0F00) >> 8;
        var registerValue = system.registers[registerIndex];
        system.registers[0xF] = registerValue & 1;
        system.registers[(opcode & 0x0F00) >> 8] = registerValue >> 1;
        system.pc += 2;
    },

    subtractRegistersYFromX: function(system, opcode) {
        // opcode 0x8XY7 where the register X is set to the difference of 
        // register Y minus X. If the difference is negative (i.e. goes outside 
        // the bounds of numbers that can be stored in a register) then the result will 
        // wrap.
        // If wrapping occurs then set the last register (0xF) to 0; otherwise 1.
        var registerXIndex = (opcode & 0x0F00) >> 8;
        var difference = system.registers[(opcode & 0x00F0) >> 4] - system.registers[registerXIndex];
        if (difference < 0) {
            system.registers[0xF] = 0;
        } else {
            system.registers[0xF] = 1;
        }
        // wrapping is taken care of by the JS engine since we're using typed arrays
        system.registers[registerXIndex] = difference;
        system.pc += 2;
    },

    bitShiftLeft: function(system, opcode) {
        // opcode 0x8XYE where register X is set to the value of shifting the bits of 
        // either register X or Y left one bit. Different documents on chip 8 make 
        // different claims about whether to use X or Y, hence the BITSHIFT_USES_REG_Y flag.
        // Set register VF to value of the most significant bit prior to the shift.
        var registerIndex = BITSHIFT_USES_REG_Y ? (opcode & 0x00F0) >> 4 : (opcode & 0x0F00) >> 8;
        var registerValue = system.registers[registerIndex];
        // 128 is the decimal of 0b10000000 (i.e. the bitmask used to get the most 
        // significant bit)
        system.registers[0xF] = (registerValue & 128) >> 7;
        system.registers[(opcode & 0x0F00) >> 8] = registerValue << 1;
        system.pc += 2;
    },

    skipIfRegistersNotEqual: function(system, opcode) {
        // opcode 0x9XY0 where X and Y are the indices of the 
        // registers to compare
        var registerXValue = system.registers[(opcode & 0x0F00) >> 8];
        var registerYValue = system.registers[(opcode & 0x00F0) >> 4];
        if (registerXValue !== registerYValue) {
            system.pc += 4;
        } else {
            system.pc += 2;
        }
    },

    storeAddressInRegisterI: function(system, opcode) {
        // opcode 0xANNN where NNN is the address to store
        system.iRegister = opcode & 0x0FFF;
        system.pc += 2;
    },

    jumpToAddressPlusRegister0: function(system, opcode) {
        // opcode 0xBNNN where NNN is added to the first register in order 
        // to find the address to jump to
        system.pc = (opcode & 0x0FFF) + system.registers[0];
    },

    genRandomNumber: function(system, opcode) {
        // opcode 0xCXNN where register X should be set to the value of the bitwise
        // AND of NN and a random number between 0x00 and 0xFF
        var rndNum = Math.floor(Math.random() * 256);
        system.registers[(opcode & 0x0F00) >> 8] = rndNum & (opcode & 0x00FF);
        system.pc += 2;
    },

    drawSprite: function(system, opcode) {
        // opcode 0xDXYN. Draw the spite at on-screen coordinates given by the values 
        // of registers X and Y. The spite in question will be taken from main memory, 
        // and will be N bytes long, starting from the address in register I.
        // It's monochrome graphics on a 64x32 pixel display, and each byte of the 
        // sprite represents a row of 8 pixels.
        // If the sprite is to be drawn far enough to the right then the sprite drawing 
        // wraps around to the next line.
        // Draw the spite using a XOR operation on the existing bit map in video memory.
        // If an ON pixel to be drawn on top of an already ON pixel - resulting in an 
        // OFF pixel due to the XOR operation used - then set VF to 1, otherwise set it 
        // to 0. This is used for collision detection.
        var n = opcode & 0x000F;
        var xCoord = system.registers[(opcode & 0x0F00) >> 8];
        var yCoord = system.registers[(opcode & 0x00F0) >> 4];
        var videoMemAddress = xCoord + yCoord * 64;
        var row = 0;
        var pixelToDraw = 0;

        // set to zero now, and change to a 1 when a collison is detected
        system.registers[0xF] = 0;

        for (var i = 0; i < n; i++) {
            row = system.memory[system.iRegister + i];
            // sprites are drawn with the most significant bit on the left, so 
            // this loop needs to countdown from 7
            for (var j = 7; j >= 0; j--) {
                pixelToDraw = (row & Math.pow(2, j)) >> j;
                // detect collision
                if (system.vram[videoMemAddress] && pixelToDraw) {
                    system.registers[0xF] = 1;
                }
                // althought system.vram holds bytes rather than bits 
                // they should only ever be 0 or 1, so can just use 
                // bitwise XOR as if it were just a bit:
                system.vram[videoMemAddress] ^= pixelToDraw;
                videoMemAddress++;
            }
            // videoMemAddress will already have been incremented by 8 as the 
            // row was scanned, so just need to add 56 to get to the start of 
            // the next row:
            videoMemAddress += 56;
        }
        system.drawFlag = true;
        system.pc += 2;

    },

    skipOnKeyPress: function(system, opcode) {
        // opcode 0xEX9E. skip the next instruction if the key corresponding to 
        // the hex value in register X is being pressed.
        if (system.keyStates[system.registers[(opcode & 0x0F00) >> 8]]) {
            system.pc += 4;
        } else {
            system.pc += 2;
        }
    },

    skipOnKeyNotPressed: function(system, opcode) {
        // opcode 0xEXA1. skip the next instruction if the key corresponding to 
        // the hex value in register X is not being pressed.
        if (!system.keyStates[system.registers[(opcode & 0x0F00) >> 8]]) {
            system.pc += 4;
        } else {
            system.pc += 2;
        }
    },

    getDelayTimerValue: function(system, opcode) {
        // opcode 0xFX07 where the delay timer value should be stored in register X
        system.registers[(opcode & 0x0F00) >> 8] = system.delayTimer;
        system.pc += 2;
    },

    waitForKeyPress: function(system, opcode) {
        // opcode FX0A. Wait for keypress and then store the value of that key press 
        // into register X.
        // sadly .indexOf on typed arrays currently doesn't have much in the way of 
        // support so...
        for (var i = 0; i < 16; i++) {
            if (system.keyStates[i]) {
                break;
            }
        }
        // if no keys where depressed then i will have been incremented to 16 
        // otherwise, it will equal the value of the first depressed key found
        if (i < 16) {
            system.registers[(opcode & 0x0F00) >> 8] = i;
            system.pc += 2;
        }
        // don't increment pc if no input has been pressed
        
    },

    setDelayTimer: function(system, opcode) {
        // opcode 0xFX15 where the delay timer is set to the value of register X
        system.delayTimer = system.registers[(opcode & 0x0F00) >> 8];
        system.pc += 2;
    },

    setSoundTimer: function(system, opcode) {
        // opcode 0xFX18 where the sound timer is set to the value of register X
        system.soundTimer = system.registers[(opcode & 0x0F00) >> 8];
        system.pc += 2;
    },

    addToRegisterI: function(system, opcode) {
        // opcode 0xFX1E where the value of register X should be added to register I.
        // If register I wraps then set register VF to 1; and 0 otherwise.
        // (NB: according to wikipedia the setting of VF is undocumented, but some 
        // programs rely on it nevertheless)
        var sum = system.iRegister + system.registers[(opcode & 0x0F00) >> 8];
        if (sum > 0xFFF) {
            system.registers[0xF] = 1;
        } else {
            system.registers[0xF] = 0;
        }
        system.iRegister = sum;
        system.pc += 2;
    },

    setRegisterIToHexGlyph: function(system, opcode) {
        // opcode 0xFX29 where register X holds the hex value whose glyph we want to point 
        // register I at.
        // The glyphs start at 0x050, and each glyph is 5 bytes long, so we can just multiple 
        // the hex character by 5, and add 0x050, to get the address:
        // REVIEW: behaviour when register X holds a value greater than 0x0F?
        system.iRegister = (system.registers[(opcode & 0x0F00) >> 8] * 5) + 0x050;
        system.pc += 2;
    },

    storeBinaryCodedDecimel: function(system, opcode) {
        // opcode 0xFX33 where the value of register X is converted into a binary-coded decimal, and
        // this is then stored in memory starting at the address in register I.
        // Binary-coded decimal takes a decimal number and converts each digit into it's binary value
        // (with the binary value padded with zeros to make up a full byte).
        // e.g. 491 would be 00000100 00001111 00000001 since 4 is 00000100 in binary, 9 is 00001111, 
        // and 1 is 00000001.
        // Each digit therefore takes one byte to store, and since the value of register X as a decimal 
        // is between 000 and 255 then storing this requires three bytes; starting with the byte in memory 
        // at the address given by register I, and including the following two memory-addresses/bytes.
        // I currently have no idea what the point of this is. :)
        var registerValue = system.registers[(opcode & 0x0F00) >> 8];
        var digits = ('000' + registerValue).substr(-3).split('').map(function(digit) { return parseInt(digit, 10); });
        
        system.memory.set(digits, system.iRegister);
        
        system.pc += 2;
    },

    storeRegistersInMemory: function(system, opcode) {
        // opcode 0xFX55. The registers V0 to VX inclusive are stored in memory starting at the address held 
        // in register I.
        // Afterwords, the value of register I may be incremented by X + 1. There seems to be a split in the
        // chip 8 documentation about whether or not this actually happens, hence the MOVE_I_ON_MEM_READ_WRITE
        // flag.
        var x = (opcode & 0x0F00) >> 8;
        for (var i = 0; i <= x; i++) {
            system.memory[system.iRegister + i] = system.registers[i];
        }
        if (MOVE_I_ON_MEM_READ_WRITE) { system.iRegister += (x + 1); }
        system.pc += 2;
    },

    copyMemoryToRegisters: function(system, opcode) {
        // opcode 0xFX65. The registers V0 to VX inclusive are set to values taken sequentially from memory, 
        // starting with the byte taken from memory at the address held in register I.
        // Afterwords, the value of register I may be incremented by X + 1. There seems to be a split in the
        // chip 8 documentation about whether or not this actually happens, hence the MOVE_I_ON_MEM_READ_WRITE
        // flag.
        var x = (opcode & 0x0F00) >> 8;
        for (var i = 0; i <= x; i++) {
            system.registers[i] = system.memory[system.iRegister + i];
        }
        if (MOVE_I_ON_MEM_READ_WRITE) { system.iRegister += (x + 1); }
        system.pc += 2;
    }

};

module.exports = instructions;