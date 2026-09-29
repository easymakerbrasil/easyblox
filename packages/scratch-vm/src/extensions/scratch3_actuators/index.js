const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

const EasyMakerProductProfile =
    require('../../board-profiles/easymaker-product-profile');

const EasyMakerPortSymbols =
    require('../../board-profiles/easymaker-port-symbols');

const EXTENSION_ID = 'actuators';

const EASYMAKER_SIMPLE_DIGITAL_PORT_ALT_LABELS =
    Object.freeze({
        asterisk: 'porta asterisco',
        equals: 'porta igual',
        exclamation: 'porta exclamação',
        question: 'porta interrogação',
        chevrons: 'porta menor e maior'
    });

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
        this._motors = {
            1: {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3
            },
            2: {
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5
            }
        };
    }

    /**
     * Describe the actuators extension to the Scratch VM.
     * Blocks will be added incrementally as actuator support is implemented.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        const useEasyMakerSurface =
            this._isEasyMakerSelected();

        const useEasyMakerMotorSurface =
            useEasyMakerSurface;

        const easyMakerMotorSymbolId =
            EasyMakerProductProfile
                .dedicatedResources
                .motors[1]
                .symbolId;

        const easyMakerMotorSymbol =
            EasyMakerPortSymbols[
                easyMakerMotorSymbolId
            ];

        const easyMakerPhysicalPorts =
            Object.values(
                EasyMakerProductProfile
                    .physicalPorts
            );

        const easyMakerDigitalPortMenuItems =
            Object.values(
                EasyMakerProductProfile
                    .simpleDigitalPorts
            ).map(port => {
                const physicalPort =
                    easyMakerPhysicalPorts.find(
                        candidate =>
                            candidate.id ===
                            port.physicalPortId
                    );

                const symbol =
                    physicalPort ?
                        EasyMakerPortSymbols[
                            physicalPort.symbolId
                        ] :
                        null;

                const alt =
                    physicalPort ?
                        EASYMAKER_SIMPLE_DIGITAL_PORT_ALT_LABELS[
                            physicalPort.symbolId
                        ] :
                        null;

                return {
                    text:
                        symbol && alt ?
                            {
                                src: symbol.dataURI,
                                alt,
                                width: symbol.width,
                                height: symbol.height
                            } :
                            physicalPort ?
                                physicalPort.fallbackLabel :
                                port.id,
                    value: String(port.pin)
                };
            });

        const easyMakerLedPortMenuItems =
            Object.entries(
                EasyMakerProductProfile
                    .devices
                    .led
                    .ports
            ).map(([physicalPortId, port]) => {
                const physicalPort =
                    easyMakerPhysicalPorts.find(
                        candidate =>
                            candidate.id ===
                            physicalPortId
                    );

                const symbol =
                    physicalPort ?
                        EasyMakerPortSymbols[
                            physicalPort.symbolId
                        ] :
                        null;

                const alt =
                    physicalPort ?
                        EASYMAKER_SIMPLE_DIGITAL_PORT_ALT_LABELS[
                            physicalPort.symbolId
                        ] :
                        null;

                return {
                    text:
                        symbol && alt ?
                            {
                                src: symbol.dataURI,
                                width: symbol.width,
                                height: symbol.height,
                                alt
                            } :
                            String(port.pin),
                    value: String(port.pin)
                };
            });

        const easyMakerRgbDigitalPort =
            easyMakerPhysicalPorts.find(
                candidate =>
                    candidate.id ===
                    'digital-d4-d7-d8'
            );

        const easyMakerRgbDigitalSymbol =
            EasyMakerPortSymbols[
                easyMakerRgbDigitalPort.symbolId
            ];

        const easyMakerRgbPwmPort =
            easyMakerPhysicalPorts.find(
                candidate =>
                    candidate.id ===
                    'digital-d9-d10-d11'
            );

        const easyMakerRgbPwmSymbol =
            EasyMakerPortSymbols[
                easyMakerRgbPwmPort.symbolId
            ];

        return {
            id: EXTENSION_ID,
            name: 'Atuadores',
            color1: '#2E7D32',
            color2: '#1B5E20',
            color3: '#124116',
            blocks: [
                {
                    opcode: 'motorInit',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerMotorSurface,
                    text: 'iniciar motor [MOTOR] [PORT]',
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorNumbers',
                            defaultValue: '1'
                        },
                        PORT: {
                            type: ArgumentType.IMAGE,
                            dataURI:
                                easyMakerMotorSymbol
                                    .dataURI,
                            width:
                                easyMakerMotorSymbol
                                    .width,
                            height:
                                easyMakerMotorSymbol
                                    .height
                        }
                    }
                },
                {
                    opcode: 'motorConfigure',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        useEasyMakerMotorSurface,
                    text: 'configurar motor [MOTOR] IN1 [IN1] IN2 [IN2] PWM [PWM]',
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorNumbers',
                            defaultValue: '1'
                        },
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
                        }
                    }
                },
                {
                    opcode: 'motorWrite',
                    blockType: BlockType.COMMAND,
                    text: 'girar motor [MOTOR] sentido [DIRECTION] velocidade [SPEED] %',
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorNumbers',
                            defaultValue: '1'
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
                    text: 'parar motor [MOTOR]',
                    arguments: {
                        MOTOR: {
                            type: ArgumentType.STRING,
                            menu: 'motorNumbers',
                            defaultValue: '1'
                        }
                    }
                },
                '---',
                {
                    opcode: 'servoWrite',
                    blockType: BlockType.COMMAND,
                    text:
                        useEasyMakerSurface ?
                            'mover servo [PIN] para [ANGLE] graus' :
                            'mover servo no pino [PIN] para [ANGLE] graus',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu:
                                useEasyMakerSurface ?
                                    'easyMakerServoPorts' :
                                    'servoPins',
                            defaultValue: 5
                        },
                        ANGLE: {
                            type: ArgumentType.SERVO_ANGLE,
                            defaultValue: 90
                        }
                    }
                },
                '---',
                {
                    opcode: 'relayWrite',
                    blockType: BlockType.COMMAND,
                    text:
                        useEasyMakerSurface ?
                            'definir relé na porta [PIN] como [STATE]' :
                            'definir relé no pino [PIN] como [STATE]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu:
                                useEasyMakerSurface ?
                                    'easyMakerDigitalPorts' :
                                    'relayPins',
                            defaultValue: 12
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'relayStates',
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'ledWrite',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerSurface,
                    text: 'definir LED na porta [PORT] como [STATE]',
                    arguments: {
                        PORT: {
                            type: ArgumentType.NUMBER,
                            menu: 'easyMakerLedPorts',
                            defaultValue: 3
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'ledStates',
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'rgbLedDigitalWrite',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerSurface,
                    text:
                        'definir LED RGB [PORT] cor [COLOR] como [STATE]',
                    arguments: {
                        PORT: {
                            type: ArgumentType.IMAGE,
                            dataURI:
                                easyMakerRgbDigitalSymbol
                                    .dataURI,
                            width:
                                easyMakerRgbDigitalSymbol
                                    .width,
                            height:
                                easyMakerRgbDigitalSymbol
                                    .height
                        },
                        COLOR: {
                            type: ArgumentType.STRING,
                            menu: 'rgbLedColors',
                            defaultValue: 'R'
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'ledStates',
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'rgbLedPwmWrite',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerSurface,
                    text:
                        'definir LED RGB [PORT] cor [COLOR] intensidade [VALUE]',
                    arguments: {
                        PORT: {
                            type: ArgumentType.IMAGE,
                            dataURI:
                                easyMakerRgbPwmSymbol
                                    .dataURI,
                            width:
                                easyMakerRgbPwmSymbol
                                    .width,
                            height:
                                easyMakerRgbPwmSymbol
                                    .height
                        },
                        COLOR: {
                            type: ArgumentType.STRING,
                            menu: 'rgbLedColors',
                            defaultValue: 'R'
                        },
                        VALUE: {
                            type: ArgumentType.PWM_VALUE,
                            defaultValue: 255
                        }
                    }
                },
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

                easyMakerServoPorts: {
                    acceptReporters: true,
                    items:
                        EasyMakerProductProfile
                            .dedicatedResources
                            .servoPorts
                            .map((pin, index) => ({
                                text: String(index + 1),
                                value: String(pin)
                            }))
                },

                motorNumbers: {
                    acceptReporters: true,
                    items: [
                        {text: '1', value: '1'},
                        {text: '2', value: '2'}
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
                easyMakerDigitalPorts: {
                    acceptReporters: true,
                    items:
                        easyMakerDigitalPortMenuItems
                },
                relayPins: {
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
                easyMakerLedPorts: {
                    acceptReporters: true,
                    items:
                        easyMakerLedPortMenuItems
                },

                rgbLedColors: {
                    acceptReporters: true,
                    items: [
                        {text: 'R', value: 'R'},
                        {text: 'G', value: 'G'},
                        {text: 'B', value: 'B'}
                    ]
                },

                ledStates: {
                    acceptReporters: true,
                    items: [
                        {text: 'ligado', value: '1'},
                        {text: 'desligado', value: '0'}
                    ]
                },
                relayStates: {
                    acceptReporters: true,
                    items: [
                        {text: 'ligado', value: '1'},
                        {text: 'desligado', value: '0'}
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
     * Report whether the active physical board is EasyMaker.
     * @returns {boolean} True when EasyMaker is selected.
     * @private
     */
    _isEasyMakerSelected () {
        return (
            typeof this.runtime
                .getEasyBloxSelectedBoardId ===
                'function' &&
            this.runtime
                .getEasyBloxSelectedBoardId() ===
                EasyMakerProductProfile.id
        );
    }

    /**
     * Resolve one motor configuration for the active board.
     * EasyMaker uses its fixed PCB wiring; generic boards retain
     * the locally configurable motor profiles.
     * @param {number} motor Logical motor number.
     * @returns {?object} Motor pin configuration.
     * @private
     */
    _getMotorConfiguration (motor) {
        if (this._isEasyMakerSelected()) {
            return (
                EasyMakerProductProfile
                    .dedicatedResources
                    .motors[motor] ||
                null
            );
        }

        return this._motors[motor] || null;
    }

    /**
     * Initialize one fixed EasyMaker motor resource.
     * In Stage mode initialization leaves the motor safely stopped.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    motorInit (args) {
        if (!this._isEasyMakerSelected()) {
            return null;
        }

        const motor = Number(args.MOTOR);

        if (
            !Number.isInteger(motor) ||
            (motor !== 1 && motor !== 2)
        ) {
            return null;
        }

        const configuration =
            this._getMotorConfiguration(
                motor
            );

        if (!configuration) {
            return null;
        }

        return this._peripheral.motorStop(
            configuration.in1Pin,
            configuration.in2Pin,
            configuration.pwmPin,
            0
        );
    }

    /**
     * Configure one local DC motor profile.
     * @param {object} args Scratch block arguments.
     * @returns {void}
     */
    motorConfigure (args) {
        const motor = Number(args.MOTOR);
        const in1Pin = Number(args.IN1);
        const in2Pin = Number(args.IN2);
        const pwmPin = Number(args.PWM);

        if (
            !Number.isInteger(motor) ||
            (motor !== 1 && motor !== 2) ||
            !Number.isInteger(in1Pin) ||
            !Number.isInteger(in2Pin) ||
            !Number.isInteger(pwmPin) ||
            in1Pin < 2 ||
            in1Pin > 19 ||
            in2Pin < 2 ||
            in2Pin > 19 ||
            ![3, 5, 6, 9, 10, 11].includes(pwmPin) ||
            in1Pin === in2Pin ||
            in1Pin === pwmPin ||
            in2Pin === pwmPin
        ) {
            return;
        }

        this._motors[motor] = {
            in1Pin,
            in2Pin,
            pwmPin
        };
    }

    /**
     * Drive one configured DC motor using the active board peripheral.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    motorWrite (args) {
        const motor = Number(args.MOTOR);
        const direction = Number(args.DIRECTION);

        if (
            !Number.isInteger(motor) ||
            (motor !== 1 && motor !== 2) ||
            !Number.isInteger(direction) ||
            (direction !== 0 && direction !== 1)
        ) {
            return null;
        }

        const configuration =
            this._getMotorConfiguration(
                motor
            );

        if (!configuration) {
            return null;
        }

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
            configuration.in1Pin,
            configuration.in2Pin,
            configuration.pwmPin,
            direction,
            speed
        );
    }

    /**
     * Stop one configured DC motor using the active board peripheral.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    motorStop (args) {
        const motor = Number(args.MOTOR);

        if (
            !Number.isInteger(motor) ||
            (motor !== 1 && motor !== 2)
        ) {
            return null;
        }

        const configuration =
            this._getMotorConfiguration(
                motor
            );

        if (!configuration) {
            return null;
        }

        return this._peripheral.motorStop(
            configuration.in1Pin,
            configuration.in2Pin,
            configuration.pwmPin,
            0
        );
    }

    /**
     * Set one relay using the active board peripheral.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    relayWrite (args) {
        const pin = Number(args.PIN);
        const state = Number(args.STATE);

        if (this._isEasyMakerSelected()) {
            const supportedPins =
                Object.values(
                    EasyMakerProductProfile
                        .simpleDigitalPorts
                ).map(port => port.pin);

            if (!supportedPins.includes(pin)) {
                return null;
            }
        }

        return this._peripheral.relayWrite(
            pin,
            state
        );
    }

    /**
     * Set one EasyMaker LED output HIGH or LOW.
     * The physical port is resolved by the EasyMaker ProductProfile.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    ledWrite (args) {
        if (!this._isEasyMakerSelected()) {
            return null;
        }

        const pin = Number(args.PORT);
        const state = Number(args.STATE);

        const supportedPins =
            Object.values(
                EasyMakerProductProfile
                    .devices
                    .led
                    .ports
            ).map(port => port.pin);

        if (
            !Number.isInteger(pin) ||
            !supportedPins.includes(pin) ||
            (state !== 0 && state !== 1)
        ) {
            return null;
        }

        return this._peripheral.digitalWrite(
            pin,
            state
        );
    }

    /**
     * Set one channel of the EasyMaker digital RGB LED HIGH or LOW.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    rgbLedDigitalWrite (args) {
        if (!this._isEasyMakerSelected()) {
            return null;
        }

        const color =
            String(args.COLOR).toUpperCase();

        const state =
            Number(args.STATE);

        const port =
            EasyMakerProductProfile
                .devices
                .rgbLed
                .ports[
                    'digital-d4-d7-d8'
                ];

        const pinsByColor = {
            R: port.redPin,
            G: port.greenPin,
            B: port.bluePin
        };

        const pin =
            pinsByColor[color];

        if (
            !Number.isInteger(pin) ||
            (state !== 0 && state !== 1)
        ) {
            return null;
        }

        return this._peripheral.digitalWrite(
            pin,
            state
        );
    }

    /**
     * Set the PWM intensity of one EasyMaker RGB LED channel.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    rgbLedPwmWrite (args) {
        if (!this._isEasyMakerSelected()) {
            return null;
        }

        const color =
            String(args.COLOR).toUpperCase();

        const value =
            Math.max(
                0,
                Math.min(
                    255,
                    Number(args.VALUE)
                )
            );

        const port =
            EasyMakerProductProfile
                .devices
                .rgbLed
                .ports[
                    'digital-d9-d10-d11'
                ];

        const pinsByColor = {
            R: port.redPin,
            G: port.greenPin,
            B: port.bluePin
        };

        const pin =
            pinsByColor[color];

        if (!Number.isInteger(pin)) {
            return null;
        }

        return this._peripheral.pwmWrite(
            pin,
            value
        );
    }
}

module.exports = Scratch3ActuatorsBlocks;
