const ArgumentType = require('../../extension-support/argument-type');
const BlockExecutionMode = require('../../extension-support/block-execution-mode');
const BlockInactiveModeBehavior = require('../../extension-support/block-inactive-mode-behavior');
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
                    opcode: 'whenArduinoUnoStart',
                    blockType: BlockType.HAT,
                    executionMode: BlockExecutionMode.UPLOAD_ONLY,
                    inactiveModeBehavior: BlockInactiveModeBehavior.SHOW_DISABLED,
                    text: 'quando Arduino Uno iniciar',
                    isEdgeActivated: false,
                    shouldRestartExistingThreads: false
                },
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
                },
                {
                    opcode: 'pwmWrite',
                    blockType: BlockType.COMMAND,
                    text: 'definir PWM no pino [PIN] como [VALUE]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'pwmPins',
                            defaultValue: 3
                        },
                        VALUE: {
                            type: ArgumentType.PWM_VALUE,
                            defaultValue: 255
                        }
                    }
                },
                '---',
                {
                    opcode: 'toneStart',
                    blockType: BlockType.COMMAND,
                    text: 'tocar nota [NOTE] no pino [PIN] por [DURATION]',
                    arguments: {
                        NOTE: {
                            type: ArgumentType.NUMBER,
                            menu: 'toneNotes',
                            defaultValue: 262
                        },
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'digitalPins',
                            defaultValue: 6
                        },
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            menu: 'toneDurations',
                            defaultValue: 500
                        }
                    }
                },
                {
                    opcode: 'toneStop',
                    blockType: BlockType.COMMAND,
                    text: 'parar tom no pino [PIN]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'digitalPins',
                            defaultValue: 6
                        }
                    }
                },
                '---',
                {
                    opcode: 'timerRead',
                    blockType: BlockType.REPORTER,
                    text: 'obter temporizador'
                },
                {
                    opcode: 'timerReset',
                    blockType: BlockType.COMMAND,
                    text: 'zerar temporizador'
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
                toneNotes: {
                    acceptReporters: false,
                    items: [
                        {text: 'C2', value: '65'},
                        {text: 'C#2', value: '69'},
                        {text: 'D2', value: '73'},
                        {text: 'D#2', value: '78'},
                        {text: 'E2', value: '82'},
                        {text: 'F2', value: '87'},
                        {text: 'F#2', value: '92'},
                        {text: 'G2', value: '98'},
                        {text: 'G#2', value: '104'},
                        {text: 'A2', value: '110'},
                        {text: 'A#2', value: '117'},
                        {text: 'B2', value: '123'},

                        {text: 'C3', value: '131'},
                        {text: 'C#3', value: '139'},
                        {text: 'D3', value: '147'},
                        {text: 'D#3', value: '156'},
                        {text: 'E3', value: '165'},
                        {text: 'F3', value: '175'},
                        {text: 'F#3', value: '185'},
                        {text: 'G3', value: '196'},
                        {text: 'G#3', value: '208'},
                        {text: 'A3', value: '220'},
                        {text: 'A#3', value: '233'},
                        {text: 'B3', value: '247'},

                        {text: 'C4', value: '262'},
                        {text: 'C#4', value: '277'},
                        {text: 'D4', value: '294'},
                        {text: 'D#4', value: '311'},
                        {text: 'E4', value: '330'},
                        {text: 'F4', value: '349'},
                        {text: 'F#4', value: '370'},
                        {text: 'G4', value: '392'},
                        {text: 'G#4', value: '415'},
                        {text: 'A4', value: '440'},
                        {text: 'A#4', value: '466'},
                        {text: 'B4', value: '494'},

                        {text: 'C5', value: '523'},
                        {text: 'C#5', value: '554'},
                        {text: 'D5', value: '587'},
                        {text: 'D#5', value: '622'},
                        {text: 'E5', value: '659'},
                        {text: 'F5', value: '698'},
                        {text: 'F#5', value: '740'},
                        {text: 'G5', value: '784'},
                        {text: 'G#5', value: '831'},
                        {text: 'A5', value: '880'},
                        {text: 'A#5', value: '932'},
                        {text: 'B5', value: '988'},

                        {text: 'C6', value: '1047'},
                        {text: 'C#6', value: '1109'},
                        {text: 'D6', value: '1175'},
                        {text: 'D#6', value: '1245'},
                        {text: 'E6', value: '1319'},
                        {text: 'F6', value: '1397'},
                        {text: 'F#6', value: '1480'},
                        {text: 'G6', value: '1568'},
                        {text: 'G#6', value: '1661'},
                        {text: 'A6', value: '1760'},
                        {text: 'A#6', value: '1865'},
                        {text: 'B6', value: '1976'},

                        {text: 'C7', value: '2093'},
                        {text: 'C#7', value: '2217'},
                        {text: 'D7', value: '2349'},
                        {text: 'D#7', value: '2489'},
                        {text: 'E7', value: '2637'},
                        {text: 'F7', value: '2794'},
                        {text: 'F#7', value: '2960'},
                        {text: 'G7', value: '3136'},
                        {text: 'G#7', value: '3322'},
                        {text: 'A7', value: '3520'},
                        {text: 'A#7', value: '3729'},
                        {text: 'B7', value: '3951'},

                        {text: 'C8', value: '4186'}
                    ]
                },
                toneDurations: {
                    acceptReporters: false,
                    items: [
                        {text: 'dobro', value: '2000'},
                        {text: 'inteiro', value: '1000'},
                        {text: 'metade', value: '500'},
                        {text: 'um quarto', value: '250'},
                        {text: 'um oitavo', value: '125'}
                    ]
                },
                pwmPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'D3', value: '3'},
                        {text: 'D5', value: '5'},
                        {text: 'D6', value: '6'},
                        {text: 'D9', value: '9'},
                        {text: 'D10', value: '10'},
                        {text: 'D11', value: '11'}
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
     * Upload-only Arduino UNO firmware entry point.
     * This hat must never start execution in Stage mode.
     * @returns {boolean} Always false in Stage mode.
     */
    whenArduinoUnoStart () {
        return false;
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
     * Set PWM output on an Arduino UNO PWM-capable pin in Stage mode.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    pwmWrite (args) {
        const pin = Number(args.PIN);
        const value = Math.trunc(
            Math.max(
                0,
                Math.min(
                    255,
                    Number(args.VALUE)
                )
            )
        );

        return this._peripheral.pwmWrite(
            pin,
            value
        );
    }

    /**
     * Play a musical note on an Arduino UNO digital pin in Stage mode.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    toneStart (args) {
        const pin = Number(args.PIN);
        const frequency = Number(args.NOTE);
        const duration = Number(args.DURATION);

        return this._peripheral.toneStart(
            pin,
            frequency,
            duration
        );
    }

    /**
     * Stop a tone on an Arduino UNO digital pin in Stage mode.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    toneStop (args) {
        return this._peripheral.toneStop(
            Number(args.PIN)
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

    /**
     * Read the Arduino UNO Stage timer in seconds.
     * @returns {?Promise<number>} Promise resolved with elapsed seconds,
     * or null when unavailable.
     */
    timerRead () {
        const result = this._peripheral.timerRead();

        if (!result) {
            return result;
        }

        return result.then(milliseconds => {
            if (milliseconds === null) {
                return null;
            }

            return milliseconds / 1000;
        });
    }

    /**
     * Reset the Arduino UNO Stage timer.
     * @returns {?Promise<number>} Promise resolved after ACK,
     * or null when unavailable.
     */
    timerReset () {
        return this._peripheral.timerReset();
    }
}
module.exports = Scratch3ArduinoUnoBlocks;
