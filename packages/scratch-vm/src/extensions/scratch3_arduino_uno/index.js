const ArduinoUnoPeripheral = require('./peripheral');

const EXTENSION_ID = 'arduinoUno';

/**
 * Scratch blocks and lifecycle for Arduino UNO.
 */
class Scratch3ArduinoUnoBlocks {
    /**
     * @param {Runtime} runtime Scratch runtime.
     */
    constructor (runtime) {
        this.runtime = runtime;
        this._peripheral = new ArduinoUnoPeripheral(runtime);
    }

    /**
     * Describe the Arduino UNO extension to the Scratch VM.
     * Blocks will be added incrementally as Stage Mode is implemented.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'Arduino UNO',
            blocks: []
        };
    }
}

module.exports = Scratch3ArduinoUnoBlocks;
