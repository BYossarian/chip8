
function getPaddedHexString(opcode, length) {

    length = length || 4;

    return '0x' + ('000' + opcode.toString(16)).substr(-length).toUpperCase();

}

module.exports = {
    getPaddedHexString: getPaddedHexString
};