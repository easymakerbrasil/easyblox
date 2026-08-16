const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

const EXTENSION_ID = 'actuators';

/**
 * Shared actuator blocks for supported hardware boards.
 */
class Scratch3ActuatorsBlocks {
    /**
     * @param {Runtime} runtime Scratch runtime.
     */
    constructor (runtime) {
        this.runtime = runtime;
        this._peripheral = runtime.getPeripheralExtension('arduinoUno');
    }

    /**
     * Describe the actuators extension to the Scratch VM.
     * Blocks will be added incrementally as actuator support is implemented.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'Atuadores',
            blocks: [
                {
                    opcode: 'servoWrite',
                    blockType: BlockType.COMMAND,
                    text: 'mover servo no pino [PIN] para [ANGLE] graus',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'servoPins',
                            defaultValue: 5
                        },
                        ANGLE: {
                            type: ArgumentType.SERVO_ANGLE,
                            defaultValue: 90
                        }
                    }
                }
            ],
            menus: {
                servoPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'D3', value: '3'},
                        {text: 'D5', value: '5'},
                        {text: 'D6', value: '6'},
                        {text: 'D9', value: '9'},
                        {text: 'D10', value: '10'},
                        {text: 'D11', value: '11'}
                    ]
                }
            }
        };
    }

    /**
     * Move a servo using the active board peripheral.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    servoWrite (args) {
        const pin = Number(args.PIN);
        const angle = Math.max(
            0,
            Math.min(
                180,
                Math.round(Number(args.ANGLE))
            )
        );
        return this._peripheral.servoWrite(
            pin,
            angle
        );
    }
}

module.exports = Scratch3ActuatorsBlocks;
