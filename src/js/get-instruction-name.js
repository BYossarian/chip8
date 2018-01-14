
var utils = require('./utils.js');

function getInstructionName(opcode) {

    var firstHexChar = (opcode & 0xF000) >> 12;
    var lastHexChar = 0;
    var lastTwoHexChars = 0;

    switch (firstHexChar) {
        case 0x0:
            switch (opcode) {
                case 0x0000:
                    throw new Error('Empty opcode: 0x0000');
                case 0x00E0:
                    return 'clearScreen';
                case 0x00EE:
                    return 'returnFromSubroutine';
                default:
                    return 'callMachineCode';
            }
        case 0x1:
            return 'jumpToAddress';
        case 0x2:
            return 'callSubroutine';
        case 0x3:
            return 'skipIfRegisterEqualsConstant';
        case 0x4:
            return 'skipIfRegisterNotEqualsConstant';
        case 0x5:
            return 'skipIfRegistersEqual';
        case 0x6:
            return 'storeValue';
        case 0x7:
            return 'addToRegister';
        case 0x8:
            lastHexChar = (opcode & 0x000F);
            switch (lastHexChar) {
                case 0x0:
                    return 'copyRegisterValue';
                case 0x1:
                    return 'bitwiseOr';
                case 0x2:
                    return 'bitwiseAnd';
                case 0x3:
                    return 'bitwiseXor';
                case 0x4:
                    return 'addRegisters';
                case 0x5:
                    return 'subtractRegistersXFromY';
                case 0x6:
                    return 'bitShiftRight';
                case 0x7:
                    return 'subtractRegistersYFromX';
                case 0xE:
                    return 'bitShiftLeft';
                default:
                    throw new Error('Unknown opcode: ' + utils.getPaddedHexString(opcode));
            }
        case 0x9:
            return 'skipIfRegistersNotEqual';
        case 0xA:
            return 'storeAddressInRegisterI';
        case 0xB:
            return 'jumpToAddressPlusRegister0';
        case 0xC:
            return 'genRandomNumber';
        case 0xD:
            return 'drawSprite';
        case 0xE:
            lastTwoHexChars = (opcode & 0x00FF);
            switch (lastTwoHexChars) {
                case 0x9E:
                    return 'skipOnKeyPress';
                case 0xA1:
                    return 'skipOnKeyNotPressed';
                default:
                    throw new Error('Unknown opcode: ' + utils.getPaddedHexString(opcode));
            }
        case 0xF:
            lastTwoHexChars = (opcode & 0x00FF);
            switch (lastTwoHexChars) {
                case 0x07:
                    return 'getDelayTimerValue';
                case 0x0A:
                    return 'waitForKeyPress';
                case 0x15:
                    return 'setDelayTimer';
                case 0x18:
                    return 'setSoundTimer';
                case 0x1E:
                    return 'addToRegisterI';
                case 0x29:
                    return 'setRegisterIToHexGlyph';
                case 0x33:
                    return 'storeBinaryCodedDecimel';
                case 0x55:
                    return 'storeRegistersInMemory';
                case 0x65:
                    return 'copyMemoryToRegisters';
                default:
                    throw new Error('Unknown opcode: ' + utils.getPaddedHexString(opcode));
            }
        default:
            throw new Error('Unknown opcode: ' + utils.getPaddedHexString(opcode));

    }

}

module.exports = getInstructionName;