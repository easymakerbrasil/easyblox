const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

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
            blocks: [
                {
                    opcode: 'digitalWrite',
                    blockType: BlockType.COMMAND,
                    text: 'definir pino [PIN] como [VALUE]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'digitalPins',
                            defaultValue: 13
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            menu: 'digitalValues',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'digitalRead',
                    blockType: BlockType.BOOLEAN,
                    text: 'ler pino digital [PIN]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'digitalPins',
                            defaultValue: 2
                        }
                    }
                },
                {
                    opcode: 'analogRead',
                    blockType: BlockType.REPORTER,
                    text: 'ler pino analógico [PIN]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'analogPins',
                            defaultValue: 14
                        }
                    }
                }
            ],
            menus: {
                digitalPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'D2', value: '2'},
                        {text: 'D3', value: '3'},
                        {text: 'D4', value: '4'},
                        {text: 'D5', value: '5'},
                        {text: 'D6', value: '6'},
                        {text: 'D7', value: '7'},
                        {text: 'D8', value: '8'},
                        {text: 'D9', value: '9'},
                        {text: 'D10', value: '10'},
                        {text: 'D11', value: '11'},
                        {text: 'D12', value: '12'},
                        {text: 'D13', value: '13'},
                        {text: 'A0', value: '14'},
                        {text: 'A1', value: '15'},
                        {text: 'A2', value: '16'},
                        {text: 'A3', value: '17'},
                        {text: 'A4', value: '18'},
                        {text: 'A5', value: '19'}
                    ]
                },
                analogPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'A0', value: '14'},
                        {text: 'A1', value: '15'},
                        {text: 'A2', value: '16'},
                        {text: 'A3', value: '17'},
                        {text: 'A4', value: '18'},
                        {text: 'A5', value: '19'}
                    ]
                },
                digitalValues: {
                    acceptReporters: true,
                    items: [
                        {
                            text: 'ALTO',
                            value: '1'
                        },
                        {
                            text: 'BAIXO',
                            value: '0'
                        }
                    ]
                }
            }
        };
    }

    /**
     * Set a digital Arduino UNO pin HIGH or LOW in Stage mode.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    digitalWrite (args) {
        return this._peripheral.digitalWrite(
            Number(args.PIN),
            Number(args.VALUE)
        );
    }

    /**
     * Read a digital Arduino UNO pin in Stage mode.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<boolean>} Promise resolved with true or false, or null when unavailable.
     */
    digitalRead (args) {
        const result = this._peripheral.digitalRead(
            Number(args.PIN)
        );

        if (!result) {
            return result;
        }

        return result.then(value => value === 1);
    }

    /**
     * Read an analog Arduino UNO pin in Stage mode.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved with a value from 0 to 1023, or null when unavailable.
     */
    analogRead (args) {
        return this._peripheral.analogRead(
            Number(args.PIN)
        );
    }
}
module.exports = Scratch3ArduinoUnoBlocks;
