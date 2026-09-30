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

            const easyMakerBuzzerPortMenuItems =
            Object.entries(
                EasyMakerProductProfile
                    .devices
                    .buzzer
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

            const easyMakerTrafficLightPortMenuItems =
            Object.keys(
                EasyMakerProductProfile
                    .devices
                    .trafficLight
                    .ports
            ).map(physicalPortId => {
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
                            physicalPortId,
                    value: physicalPortId
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
            blocks: this._orderBlocksForSurface([
                {
                    opcode: 'motorInit',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerMotorSurface,
                    text: 'inicializar motor [MOTOR] na porta [PORT]',
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
                            'mover servo na porta [PIN] para [ANGLE] graus' :
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
                {
                    opcode: 'trafficLightWrite',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerSurface,
                    text:
                        'definir semáforo na porta [PORT] [COLOR] como [STATE]',
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu:
                                'easyMakerTrafficLightPorts',
                            defaultValue:
                                'digital-d4-d7-d8'
                        },
                        COLOR: {
                            type: ArgumentType.STRING,
                            menu: 'trafficLightColors',
                            defaultValue: 'GREEN'
                        },
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'ledStates',
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'toneStart',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerSurface,
                    text:
                        'tocar nota [NOTE] na porta [PIN] por [DURATION]',
                    arguments: {
                        NOTE: {
                            type: ArgumentType.NUMBER,
                            menu: 'toneNotes',
                            defaultValue: 65
                        },
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu:
                                'easyMakerBuzzerPorts',
                            defaultValue: 3
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
                    hideFromPalette:
                        !useEasyMakerSurface,
                    text:
                        'parar tom na porta [PIN]',
                    arguments: {
                        PIN: {
                            type: ArgumentType.NUMBER,
                            menu:
                                'easyMakerBuzzerPorts',
                            defaultValue: 3
                        }
                    }
                }
            ], useEasyMakerSurface),
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
                        {
                            text: 'vermelho',
                            value: 'R'
                        },
                        {
                            text: 'verde',
                            value: 'G'
                        },
                        {
                            text: 'azul',
                            value: 'B'
                        }
                    ]
                },

                easyMakerTrafficLightPorts: {
                    acceptReporters: true,
                    items:
                        easyMakerTrafficLightPortMenuItems
                },

                trafficLightColors: {
                    acceptReporters: true,
                    items: [
                        {
                            text: 'verde',
                            value: 'GREEN'
                        },
                        {
                            text: 'amarelo',
                            value: 'YELLOW'
                        },
                        {
                            text: 'vermelho',
                            value: 'RED'
                        }
                    ]
                },
                easyMakerBuzzerPorts: {
                    acceptReporters: true,
                    items:
                        easyMakerBuzzerPortMenuItems
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
                        {
                            text: 'um quarto',
                            value: '250'
                        },
                        {
                            text: 'um oitavo',
                            value: '125'
                        }
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
     * Order actuator blocks for the EasyMaker pedagogical surface.
     * Generic boards retain the original technical ordering.
     * @param {Array<object|string>} blocks Registered actuator blocks.
     * @param {boolean} useEasyMakerSurface Whether EasyMaker is active.
     * @returns {Array<object|string>} Ordered extension blocks.
     * @private
     */
    _orderBlocksForSurface (
        blocks,
        useEasyMakerSurface
    ) {
        if (!useEasyMakerSurface) {
            return blocks;
        }

        const blocksByOpcode =
            new Map(
                blocks
                    .filter(
                        block =>
                            block &&
                            block !== '---'
                    )
                    .map(block => [
                        block.opcode,
                        block
                    ])
            );

        return [
            blocksByOpcode.get(
                'ledWrite'
            ),
            blocksByOpcode.get(
                'rgbLedDigitalWrite'
            ),
            blocksByOpcode.get(
                'rgbLedPwmWrite'
            ),
            blocksByOpcode.get(
                'trafficLightWrite'
            ),

            '---',

            blocksByOpcode.get(
                'toneStart'
            ),
            blocksByOpcode.get(
                'toneStop'
            ),

            '---',

            blocksByOpcode.get(
                'motorInit'
            ),
            blocksByOpcode.get(
                'motorConfigure'
            ),
            blocksByOpcode.get(
                'motorWrite'
            ),
            blocksByOpcode.get(
                'motorStop'
            ),

            '---',

            blocksByOpcode.get(
                'servoWrite'
            ),

            '---',

            blocksByOpcode.get(
                'relayWrite'
            )
        ];
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
     * Play one musical note through an EasyMaker Buzzer.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    toneStart (args) {
        if (!this._isEasyMakerSelected()) {
            return null;
        }

        const pin = Number(args.PIN);
        const frequency = Number(args.NOTE);
        const duration = Number(args.DURATION);

        const supportedPins =
            Object.values(
                EasyMakerProductProfile
                    .devices
                    .buzzer
                    .ports
            ).map(port => port.pin);

        if (!supportedPins.includes(pin)) {
            return null;
        }

        return this._peripheral.toneStart(
            pin,
            frequency,
            duration
        );
    }

    /**
     * Stop an EasyMaker Buzzer tone.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    toneStop (args) {
        if (!this._isEasyMakerSelected()) {
            return null;
        }

        const pin = Number(args.PIN);

        const supportedPins =
            Object.values(
                EasyMakerProductProfile
                    .devices
                    .buzzer
                    .ports
            ).map(port => port.pin);

        if (!supportedPins.includes(pin)) {
            return null;
        }

        return this._peripheral.toneStop(
            pin
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

    /**
     * Set one EasyMaker traffic-light signal HIGH or LOW.
     * The selected physical connector determines the fixed signal pins.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    trafficLightWrite (args) {
        if (!this._isEasyMakerSelected()) {
            return null;
        }

        const portId =
            String(args.PORT);

        const color =
            String(args.COLOR).toUpperCase();

        const state =
            Number(args.STATE);

        const port =
            EasyMakerProductProfile
                .devices
                .trafficLight
                .ports[portId];

        if (!port) {
            return null;
        }

        const pinsByColor = {
            GREEN: port.greenPin,
            YELLOW: port.yellowPin,
            RED: port.redPin
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
}

module.exports = Scratch3ActuatorsBlocks;
