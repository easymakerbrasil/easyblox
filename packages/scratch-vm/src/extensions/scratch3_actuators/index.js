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
                },
                {
                    opcode: 'motorWrite',
                    blockType: BlockType.COMMAND,
                    text: 'girar motor IN1 [IN1] IN2 [IN2] PWM [PWM] direção [DIRECTION] velocidade [SPEED] %',
                    arguments: {
                        IN1: {
                            type: ArgumentType.NUMBER,
                            menu: 'motorDigitalPins',
                            defaultValue: 2
                        },
                        IN2: {
                            type: ArgumentType.NUMBER,
                            menu: 'motorDigitalPins',
                            defaultValue: 4
                        },
                        PWM: {
                            type: ArgumentType.NUMBER,
                            menu: 'motorPwmPins',
                            defaultValue: 3
                        },
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'motorDirections',
                            defaultValue: '0'
                        },
                        SPEED: {
                            type: ArgumentType.MOTOR_SPEED,
                            defaultValue: 100
                        }
                    }
                },
                {
                    opcode: 'motorStop',
                    blockType: BlockType.COMMAND,
                    text: 'parar motor IN1 [IN1] IN2 [IN2] PWM [PWM] modo [STOP_MODE]',
                    arguments: {
                        IN1: {
                            type: ArgumentType.NUMBER,
                            menu: 'motorDigitalPins',
                            defaultValue: 2
                        },
                        IN2: {
                            type: ArgumentType.NUMBER,
                            menu: 'motorDigitalPins',
                            defaultValue: 4
                        },
                        PWM: {
                            type: ArgumentType.NUMBER,
                            menu: 'motorPwmPins',
                            defaultValue: 3
                        },
                        STOP_MODE: {
                            type: ArgumentType.STRING,
                            menu: 'motorStopModes',
                            defaultValue: '0'
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
                },
                motorDigitalPins: {
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
                motorPwmPins: {
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
                motorDirections: {
                    acceptReporters: true,
                    items: [
                        {text: 'frente', value: '0'},
                        {text: 'trás', value: '1'}
                    ]
                },
                motorStopModes: {
                    acceptReporters: true,
                    items: [
                        {text: 'livre', value: '0'},
                        {text: 'frear', value: '1'}
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

    /**
     * Drive one DC motor using the active board peripheral.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    motorWrite (args) {
        const in1Pin = Number(args.IN1);
        const in2Pin = Number(args.IN2);
        const pwmPin = Number(args.PWM);
        const direction = Number(args.DIRECTION);

        const speedPercent = Math.max(
            0,
            Math.min(
                100,
                Math.round(Number(args.SPEED))
            )
        );

        const speed = Math.round(
            speedPercent * 255 / 100
        );

        return this._peripheral.motorWrite(
            in1Pin,
            in2Pin,
            pwmPin,
            direction,
            speed
        );
    }

    /**
     * Stop one DC motor using the active board peripheral.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    motorStop (args) {
        const in1Pin = Number(args.IN1);
        const in2Pin = Number(args.IN2);
        const pwmPin = Number(args.PWM);
        const stopMode = Number(args.STOP_MODE);

        return this._peripheral.motorStop(
            in1Pin,
            in2Pin,
            pwmPin,
            stopMode
        );
    }
}

module.exports = Scratch3ActuatorsBlocks;
