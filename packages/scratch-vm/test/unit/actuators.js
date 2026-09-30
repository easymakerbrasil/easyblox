const tap = require('tap');

const ArgumentType = require('../../src/extension-support/argument-type');
const Scratch3ActuatorsBlocks = require('../../src/extensions/scratch3_actuators');

const EasyMakerProductProfile =
    require('../../src/board-profiles/easymaker-product-profile');

const test = tap.test;

test('Actuators reuse the registered Arduino UNO peripheral', t => {
    const sharedPeripheral = {};

    const runtime = {
        getPeripheralExtension: extensionId => {
            t.equal(
                extensionId,
                'arduinoUno',
                'actuators request the Arduino UNO peripheral'
            );

            return sharedPeripheral;
        }
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    t.equal(
        extension._peripheral,
        sharedPeripheral,
        'actuators reuse the registered Arduino UNO peripheral instance'
    );

    t.end();
});

test('Actuators expose the servo block and supported servo pins', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    t.equal(info.id, 'actuators');
    t.equal(info.name, 'Atuadores');
    t.equal(info.color1, '#2E7D32');
    t.equal(info.color2, '#1B5E20');
    t.equal(info.color3, '#124116');
    t.equal(info.blocks.length, 12);

    const servoBlock = info.blocks[5];

    t.equal(servoBlock.opcode, 'servoWrite');
    t.equal(
        servoBlock.text,
        'mover servo no pino [PIN] para [ANGLE] graus'
    );

    t.equal(
        servoBlock.arguments.PIN.defaultValue,
        5
    );

    t.equal(
        servoBlock.arguments.ANGLE.defaultValue,
        90
    );

    t.equal(
        servoBlock.arguments.ANGLE.type,
        ArgumentType.SERVO_ANGLE
    );

    t.same(
        info.menus.servoPins.items,
        [
            {text: 'D3', value: '3'},
            {text: 'D5', value: '5'},
            {text: 'D6', value: '6'},
            {text: 'D9', value: '9'},
            {text: 'D10', value: '10'},
            {text: 'D11', value: '11'}
        ]
    );

    t.end();
});

test('Actuators expose numbered EasyMaker servo ports', t => {
    const runtime = {
        getPeripheralExtension: () => ({}),
        getEasyBloxSelectedBoardId:
            () => 'easymaker'
    };

    const extension =
        new Scratch3ActuatorsBlocks(
            runtime
        );

    const info = extension.getInfo();
    const servoBlock = info.blocks[5];

    t.equal(
        servoBlock.opcode,
        'servoWrite'
    );

    t.equal(
        servoBlock.text,
        'mover servo [PIN] para [ANGLE] graus'
    );

    t.equal(
        servoBlock.arguments.PIN.menu,
        'easyMakerServoPorts'
    );

    t.same(
        info.menus
            .easyMakerServoPorts
            .items,
        [
            {text: '1', value: '5'},
            {text: '2', value: '9'},
            {text: '3', value: '10'},
            {text: '4', value: '11'}
        ]
    );

    t.end();
});

test('Actuators expose configured motor blocks and motor menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    const motorInitBlock = info.blocks[0];
    const motorConfigureBlock = info.blocks[1];
    const motorWriteBlock = info.blocks[2];
    const motorStopBlock = info.blocks[3];

    t.equal(
        motorInitBlock.opcode,
        'motorInit'
    );

    t.equal(
        motorInitBlock.hideFromPalette,
        true,
        'generic Arduino hides EasyMaker motor initialization'
    );

    t.equal(
        motorConfigureBlock.opcode,
        'motorConfigure'
    );

    t.equal(
        motorConfigureBlock.hideFromPalette,
        false,
        'generic Arduino keeps motor configuration visible'
    );

    t.equal(
        motorConfigureBlock.text,
        'configurar motor [MOTOR] IN1 [IN1] IN2 [IN2] PWM [PWM]'
    );

    t.equal(
        motorConfigureBlock.arguments.MOTOR.defaultValue,
        '1'
    );

    t.equal(
        motorConfigureBlock.arguments.IN1.defaultValue,
        2
    );

    t.equal(
        motorConfigureBlock.arguments.IN2.defaultValue,
        4
    );

    t.equal(
        motorConfigureBlock.arguments.PWM.defaultValue,
        3
    );

    t.equal(
        motorWriteBlock.opcode,
        'motorWrite'
    );

    t.equal(
        motorWriteBlock.text,
        'girar motor [MOTOR] sentido [DIRECTION] velocidade [SPEED] %'
    );

    t.equal(
        motorWriteBlock.arguments.MOTOR.defaultValue,
        '1'
    );

    t.equal(
        motorWriteBlock.arguments.SPEED.type,
        ArgumentType.MOTOR_SPEED
    );

    t.equal(
        motorWriteBlock.arguments.SPEED.defaultValue,
        100
    );

    t.equal(
        motorStopBlock.opcode,
        'motorStop'
    );

    t.equal(
        motorStopBlock.text,
        'parar motor [MOTOR]'
    );

    t.equal(
        motorStopBlock.arguments.MOTOR.defaultValue,
        '1'
    );

    t.same(
        info.menus.motorNumbers.items,
        [
            {text: '1', value: '1'},
            {text: '2', value: '2'}
        ]
    );

    t.same(
        info.menus.motorDirections.items,
        [
            {text: 'frente', value: '0'},
            {text: 'trás', value: '1'}
        ]
    );

    t.same(
        info.menus.motorDigitalPins.items,
        [
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
    );

    t.same(
        info.menus.motorPwmPins.items,
        [
            {text: 'D3', value: '3'},
            {text: 'D5', value: '5'},
            {text: 'D6', value: '6'},
            {text: 'D9', value: '9'},
            {text: 'D10', value: '10'},
            {text: 'D11', value: '11'}
        ]
    );

    t.notOk(
        info.menus.motorStopModes,
        'stop mode menu is no longer exposed'
    );

    t.end();
});

test('Actuators expose relay block and relay menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    const relayBlock = info.blocks[7];

    t.equal(relayBlock.opcode, 'relayWrite');

    t.equal(
        relayBlock.text,
        'definir relé no pino [PIN] como [STATE]'
    );

    t.equal(
        relayBlock.arguments.PIN.defaultValue,
        12
    );

    t.equal(
        relayBlock.arguments.STATE.defaultValue,
        '1'
    );

    t.same(
        info.menus.relayStates.items,
        [
            {text: 'ligado', value: '1'},
            {text: 'desligado', value: '0'}
        ]
    );

    t.same(
        info.menus.relayPins.items,
        [
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
    );

    t.end();
});

test('Actuators expose EasyMaker LED on its physical ports', t => {
    const calls = [];

    const sharedPeripheral = {
        digitalWrite: (pin, state) => {
            calls.push({
                pin,
                state
            });

            return 46;
        }
    };

    const runtime = {
        getPeripheralExtension:
            () => sharedPeripheral,

        getEasyBloxSelectedBoardId:
            () => EasyMakerProductProfile.id
    };

    const extension =
        new Scratch3ActuatorsBlocks(runtime);

    const info = extension.getInfo();

    const ledBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode === 'ledWrite'
        );

    t.ok(
        ledBlock,
        'EasyMaker exposes the LED block'
    );

    t.equal(
        ledBlock.hideFromPalette,
        false,
        'LED block is visible for EasyMaker'
    );

    t.equal(
        ledBlock.text,
        'definir LED na porta [PORT] como [STATE]'
    );

    t.equal(
        ledBlock.arguments.PORT.menu,
        'easyMakerLedPorts'
    );

    t.equal(
        ledBlock.arguments.STATE.menu,
        'ledStates'
    );

    t.same(
        info.menus
            .easyMakerLedPorts
            .items
            .map(item => ({
                alt: item.text.alt,
                value: item.value
            })),
        [
            {
                alt: 'porta asterisco',
                value: '3'
            },
            {
                alt: 'porta igual',
                value: '8'
            },
            {
                alt: 'porta exclamação',
                value: '11'
            },
            {
                alt: 'porta interrogação',
                value: '12'
            },
            {
                alt: 'porta menor e maior',
                value: '13'
            }
        ]
    );

    t.ok(
        info.menus
            .easyMakerLedPorts
            .items
            .every(
                item =>
                    /^data:image\/svg\+xml,/
                        .test(item.text.src)
            ),
        'EasyMaker LED ports use the physical SVG symbols'
    );

    t.same(
        info.menus.ledStates.items,
        [
            {text: 'ligado', value: '1'},
            {text: 'desligado', value: '0'}
        ]
    );

    const validResult =
        extension.ledWrite({
            PORT: '8',
            STATE: '1'
        });

    const secondValidResult =
        extension.ledWrite({
            PORT: '13',
            STATE: '0'
        });

    const invalidPortResult =
        extension.ledWrite({
            PORT: '4',
            STATE: '1'
        });

    const invalidStateResult =
        extension.ledWrite({
            PORT: '3',
            STATE: '2'
        });

    t.equal(
        validResult,
        46,
        'EasyMaker accepts an LED physical port'
    );

    t.equal(
        secondValidResult,
        46,
        'EasyMaker accepts every mapped LED output'
    );

    t.equal(
        invalidPortResult,
        null,
        'EasyMaker rejects pins outside the LED contract'
    );

    t.equal(
        invalidStateResult,
        null,
        'EasyMaker rejects invalid LED states'
    );

    t.same(
        calls,
        [
            {
                pin: 8,
                state: 1
            },
            {
                pin: 13,
                state: 0
            }
        ],
        'LED writes resolve only valid EasyMaker mappings'
    );

    t.end();
});

test('Actuators expose EasyMaker RGB LED digital and PWM surfaces', t => {
    const digitalCalls = [];
    const pwmCalls = [];

    const sharedPeripheral = {
        digitalWrite: (pin, state) => {
            digitalCalls.push({
                pin,
                state
            });

            return 47;
        },

        pwmWrite: (pin, value) => {
            pwmCalls.push({
                pin,
                value
            });

            return 48;
        }
    };

    const runtime = {
        getPeripheralExtension:
            () => sharedPeripheral,

        getEasyBloxSelectedBoardId:
            () => EasyMakerProductProfile.id
    };

    const extension =
        new Scratch3ActuatorsBlocks(runtime);

    const info =
        extension.getInfo();

    const digitalBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'rgbLedDigitalWrite'
        );

    const pwmBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'rgbLedPwmWrite'
        );

    t.ok(
        digitalBlock,
        'EasyMaker exposes the digital RGB LED block'
    );

    t.ok(
        pwmBlock,
        'EasyMaker exposes the PWM RGB LED block'
    );

    t.equal(
        digitalBlock.hideFromPalette,
        false,
        'digital RGB LED block is visible for EasyMaker'
    );

    t.equal(
        pwmBlock.hideFromPalette,
        false,
        'PWM RGB LED block is visible for EasyMaker'
    );

    t.equal(
        digitalBlock.text,
        'definir LED RGB [PORT] cor [COLOR] como [STATE]'
    );

    t.equal(
        pwmBlock.text,
        'definir LED RGB [PORT] cor [COLOR] intensidade [VALUE]'
    );

    t.equal(
        digitalBlock.arguments.PORT.type,
        'image'
    );

    t.equal(
        pwmBlock.arguments.PORT.type,
        'image'
    );

    t.ok(
        /^data:image\/svg\+xml,/.test(
            digitalBlock.arguments.PORT.dataURI
        ),
        'digital RGB LED uses the EasyMaker equals SVG symbol'
    );

    t.ok(
        /^data:image\/svg\+xml,/.test(
            pwmBlock.arguments.PORT.dataURI
        ),
        'PWM RGB LED uses the EasyMaker exclamation SVG symbol'
    );

    t.equal(
        digitalBlock.arguments.COLOR.menu,
        'rgbLedColors'
    );

    t.equal(
        pwmBlock.arguments.COLOR.menu,
        'rgbLedColors'
    );

    t.equal(
        digitalBlock.arguments.STATE.menu,
        'ledStates'
    );

    t.equal(
        pwmBlock.arguments.VALUE.type,
        'pwm_value'
    );

    t.same(
        info.menus.rgbLedColors.items,
        [
            {text: 'R', value: 'R'},
            {text: 'G', value: 'G'},
            {text: 'B', value: 'B'}
        ]
    );

    t.equal(
        extension.rgbLedDigitalWrite({
            COLOR: 'R',
            STATE: '1'
        }),
        47
    );

    t.equal(
        extension.rgbLedDigitalWrite({
            COLOR: 'B',
            STATE: '0'
        }),
        47
    );

    t.equal(
        extension.rgbLedPwmWrite({
            COLOR: 'G',
            VALUE: '128'
        }),
        48
    );

    t.equal(
        extension.rgbLedPwmWrite({
            COLOR: 'B',
            VALUE: '999'
        }),
        48,
        'PWM RGB intensity is clamped to 255'
    );

    t.equal(
        extension.rgbLedDigitalWrite({
            COLOR: 'X',
            STATE: '1'
        }),
        null,
        'digital RGB rejects unknown colors'
    );

    t.equal(
        extension.rgbLedDigitalWrite({
            COLOR: 'R',
            STATE: '2'
        }),
        null,
        'digital RGB rejects invalid digital states'
    );

    t.equal(
        extension.rgbLedPwmWrite({
            COLOR: 'X',
            VALUE: '128'
        }),
        null,
        'PWM RGB rejects unknown colors'
    );

    t.same(
        digitalCalls,
        [
            {
                pin: 4,
                state: 1
            },
            {
                pin: 8,
                state: 0
            }
        ],
        'digital RGB resolves R/G/B through D4/D7/D8'
    );

    t.same(
        pwmCalls,
        [
            {
                pin: 10,
                value: 128
            },
            {
                pin: 11,
                value: 255
            }
        ],
        'PWM RGB resolves R/G/B through D9/D10/D11'
    );

    t.end();
});

test('Actuators hide EasyMaker RGB LED surfaces on generic boards', t => {
    const runtime = {
        getPeripheralExtension:
            () => ({
                digitalWrite: () => 1,
                pwmWrite: () => 1
            }),

        getEasyBloxSelectedBoardId:
            () => null
    };

    const extension =
        new Scratch3ActuatorsBlocks(runtime);

    const info =
        extension.getInfo();

    const digitalBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'rgbLedDigitalWrite'
        );

    const pwmBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'rgbLedPwmWrite'
        );

    t.ok(
        digitalBlock,
        'digital RGB metadata remains registered'
    );

    t.ok(
        pwmBlock,
        'PWM RGB metadata remains registered'
    );

    t.equal(
        digitalBlock.hideFromPalette,
        true,
        'digital RGB surface is hidden on generic boards'
    );

    t.equal(
        pwmBlock.hideFromPalette,
        true,
        'PWM RGB surface is hidden on generic boards'
    );

    t.equal(
        extension.rgbLedDigitalWrite({
            COLOR: 'R',
            STATE: '1'
        }),
        null
    );

    t.equal(
        extension.rgbLedPwmWrite({
            COLOR: 'R',
            VALUE: '128'
        }),
        null
    );

    t.end();
});

test('Actuators expose EasyMaker traffic light physical port surface', t => {
    const calls = [];

    const sharedPeripheral = {
        digitalWrite: (pin, state) => {
            calls.push({
                pin,
                state
            });

            return 49;
        }
    };

    const runtime = {
        getPeripheralExtension:
            () => sharedPeripheral,

        getEasyBloxSelectedBoardId:
            () => EasyMakerProductProfile.id
    };

    const extension =
        new Scratch3ActuatorsBlocks(runtime);

    const info =
        extension.getInfo();

    const trafficLightBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'trafficLightWrite'
        );

    t.ok(
        trafficLightBlock,
        'EasyMaker exposes the traffic light block'
    );

    t.equal(
        trafficLightBlock.hideFromPalette,
        false,
        'traffic light block is visible for EasyMaker'
    );

    t.equal(
        trafficLightBlock.text,
        'definir semáforo na porta [PORT] [COLOR] como [STATE]'
    );

    t.equal(
        trafficLightBlock.arguments.PORT.menu,
        'easyMakerTrafficLightPorts'
    );

    t.equal(
        trafficLightBlock.arguments.COLOR.menu,
        'trafficLightColors'
    );

    t.equal(
        trafficLightBlock.arguments.STATE.menu,
        'ledStates'
    );

    t.same(
        info.menus
            .easyMakerTrafficLightPorts
            .items
            .map(item => ({
                alt: item.text.alt,
                value: item.value
            })),
        [
            {
                alt: 'porta igual',
                value:
                    'digital-d4-d7-d8'
            },
            {
                alt: 'porta exclamação',
                value:
                    'digital-d9-d10-d11'
            }
        ]
    );

    t.ok(
        info.menus
            .easyMakerTrafficLightPorts
            .items
            .every(
                item =>
                    /^data:image\/svg\+xml,/
                        .test(item.text.src)
            ),
        'traffic light ports use the physical SVG symbols'
    );

    t.same(
        info.menus
            .trafficLightColors
            .items,
        [
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
    );

    t.equal(
        extension.trafficLightWrite({
            PORT:
                'digital-d4-d7-d8',
            COLOR: 'GREEN',
            STATE: '1'
        }),
        49
    );

    t.equal(
        extension.trafficLightWrite({
            PORT:
                'digital-d4-d7-d8',
            COLOR: 'RED',
            STATE: '0'
        }),
        49
    );

    t.equal(
        extension.trafficLightWrite({
            PORT:
                'digital-d9-d10-d11',
            COLOR: 'YELLOW',
            STATE: '1'
        }),
        49
    );

    t.equal(
        extension.trafficLightWrite({
            PORT:
                'digital-d9-d10-d11',
            COLOR: 'RED',
            STATE: '0'
        }),
        49
    );

    t.equal(
        extension.trafficLightWrite({
            PORT: 'invalid-port',
            COLOR: 'GREEN',
            STATE: '1'
        }),
        null,
        'traffic light rejects unknown physical ports'
    );

    t.equal(
        extension.trafficLightWrite({
            PORT:
                'digital-d4-d7-d8',
            COLOR: 'BLUE',
            STATE: '1'
        }),
        null,
        'traffic light rejects unknown colors'
    );

    t.equal(
        extension.trafficLightWrite({
            PORT:
                'digital-d4-d7-d8',
            COLOR: 'GREEN',
            STATE: '2'
        }),
        null,
        'traffic light rejects invalid digital states'
    );

    t.same(
        calls,
        [
            {
                pin: 4,
                state: 1
            },
            {
                pin: 8,
                state: 0
            },
            {
                pin: 10,
                state: 1
            },
            {
                pin: 11,
                state: 0
            }
        ],
        'traffic light resolves both EasyMaker physical connectors'
    );

    t.end();
});

test('Actuators hide EasyMaker traffic light surface on generic boards', t => {
    const runtime = {
        getPeripheralExtension:
            () => ({
                digitalWrite: () => 1
            }),

        getEasyBloxSelectedBoardId:
            () => null
    };

    const extension =
        new Scratch3ActuatorsBlocks(runtime);

    const info =
        extension.getInfo();

    const trafficLightBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'trafficLightWrite'
        );

    t.ok(
        trafficLightBlock,
        'traffic light metadata remains registered'
    );

    t.equal(
        trafficLightBlock.hideFromPalette,
        true,
        'traffic light surface is hidden on generic boards'
    );

    t.equal(
        extension.trafficLightWrite({
            PORT:
                'digital-d4-d7-d8',
            COLOR: 'GREEN',
            STATE: '1'
        }),
        null
    );

    t.end();
});

test('Actuators hide the EasyMaker LED surface on generic boards', t => {
    const runtime = {
        getPeripheralExtension:
            () => ({
                digitalWrite: () => 1
            }),

        getEasyBloxSelectedBoardId:
            () => null
    };

    const extension =
        new Scratch3ActuatorsBlocks(runtime);

    const info = extension.getInfo();

    const ledBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode === 'ledWrite'
        );

    t.ok(
        ledBlock,
        'LED block metadata remains registered'
    );

    t.equal(
        ledBlock.hideFromPalette,
        true,
        'EasyMaker LED surface is hidden on generic boards'
    );

    t.equal(
        extension.ledWrite({
            PORT: '3',
            STATE: '1'
        }),
        null,
        'generic boards cannot invoke the EasyMaker LED surface'
    );

    t.end();
});

test('Actuators expose EasyMaker relay on simple digital ports', t => {
    const calls = [];

    const sharedPeripheral = {
        relayWrite: (pin, state) => {
            calls.push({
                pin,
                state
            });

            return 45;
        }
    };

    const runtime = {
        getPeripheralExtension:
            () => sharedPeripheral,
        getEasyBloxSelectedBoardId:
            () => 'easymaker'
    };

    const extension =
        new Scratch3ActuatorsBlocks(
            runtime
        );

    const info = extension.getInfo();
    const relayBlock = info.blocks[7];

    t.equal(
        relayBlock.opcode,
        'relayWrite'
    );

    t.equal(
        relayBlock.text,
        'definir relé na porta [PIN] como [STATE]'
    );

    t.equal(
        relayBlock.arguments.PIN.menu,
        'easyMakerDigitalPorts'
    );

    t.same(
        info.menus
            .easyMakerDigitalPorts
            .items
            .map(item => ({
                alt: item.text.alt,
                value: item.value
            })),
        [
            {
                alt: 'porta asterisco',
                value: '3'
            },
            {
                alt: 'porta interrogação',
                value: '12'
            },
            {
                alt: 'porta menor e maior',
                value: '13'
            }
        ]
    );

    t.ok(
        info.menus
            .easyMakerDigitalPorts
            .items
            .every(
                item =>
                    /^data:image\/svg\+xml,/
                        .test(item.text.src)
            ),
        'EasyMaker relay ports use the physical SVG symbols'
    );

    const validResult =
        extension.relayWrite({
            PIN: '3',
            STATE: '1'
        });

    const invalidResult =
        extension.relayWrite({
            PIN: '8',
            STATE: '1'
        });

    t.equal(
        validResult,
        45,
        'EasyMaker accepts a supported simple digital port'
    );

    t.equal(
        invalidResult,
        null,
        'EasyMaker rejects ports outside the simple digital contract'
    );

    t.same(
        calls,
        [
            {
                pin: 3,
                state: 1
            }
        ],
        'only supported EasyMaker relay ports reach the peripheral'
    );

    t.end();
});

test('Actuators delegate servo writes to the shared peripheral', t => {
    const calls = [];

    const sharedPeripheral = {
        servoWrite: (pin, angle) => {
            calls.push({
                pin,
                angle
            });

            return 42;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const result = extension.servoWrite({
        PIN: '5',
        ANGLE: '90'
    });

    t.equal(
        result,
        42,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                pin: 5,
                angle: 90
            }
        ],
        'delegates numeric pin and angle to the shared peripheral'
    );

    t.end();
});

test('Actuators normalize servo angles to integer values from 0 to 180', t => {
    const calls = [];

    const sharedPeripheral = {
        servoWrite: (pin, angle) => {
            calls.push({
                pin,
                angle
            });

            return 1;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    extension.servoWrite({
        PIN: '3',
        ANGLE: '-10'
    });

    extension.servoWrite({
        PIN: '5',
        ANGLE: '190'
    });

    extension.servoWrite({
        PIN: '6',
        ANGLE: '90.6'
    });

    t.same(
        calls,
        [
            {
                pin: 3,
                angle: 0
            },
            {
                pin: 5,
                angle: 180
            },
            {
                pin: 6,
                angle: 91
            }
        ]
    );

    t.end();
});

test('Actuators initialize the two generic Arduino motor profiles', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    t.same(
        extension._motors,
        {
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
        }
    );

    t.end();
});

test('Actuators hide configuration and use fixed EasyMaker motor wiring', t => {
    const calls = [];

    const sharedPeripheral = {
        motorWrite: (
            in1Pin,
            in2Pin,
            pwmPin,
            direction,
            speed
        ) => {
            calls.push({
                method: 'write',
                in1Pin,
                in2Pin,
                pwmPin,
                direction,
                speed
            });

            return 42;
        },

        motorStop: (
            in1Pin,
            in2Pin,
            pwmPin,
            stopMode
        ) => {
            calls.push({
                method: 'stop',
                in1Pin,
                in2Pin,
                pwmPin,
                stopMode
            });

            return 43;
        }
    };

    const runtime = {
        getPeripheralExtension:
            () => sharedPeripheral,

        getEasyBloxSelectedBoardId:
            () => 'easymaker'
    };

    const extension =
        new Scratch3ActuatorsBlocks(
            runtime
        );

    const info = extension.getInfo();

    const motorInitBlock =
        info.blocks[0];

    const motorConfigureBlock =
        info.blocks[1];

    t.equal(
        motorInitBlock.opcode,
        'motorInit'
    );

    t.equal(
        motorInitBlock.text,
        'iniciar motor [MOTOR] [PORT]'
    );

    t.equal(
        motorInitBlock.arguments.PORT.type,
        ArgumentType.IMAGE,
        'EasyMaker motor initialization uses the physical port symbol'
    );

    t.match(
        motorInitBlock.arguments.PORT.dataURI,
        /^data:image\/svg\+xml,/,
        'EasyMaker motor symbol is exposed as an SVG image'
    );

    t.equal(
        motorInitBlock.hideFromPalette,
        false,
        'EasyMaker exposes fixed motor initialization'
    );

    t.equal(
        motorConfigureBlock.opcode,
        'motorConfigure'
    );

    t.equal(
        motorConfigureBlock.hideFromPalette,
        true,
        'EasyMaker hides manual motor pin configuration'
    );

    extension.motorInit({
        MOTOR: '1'
    });

    extension.motorConfigure({
        MOTOR: '1',
        IN1: '2',
        IN2: '4',
        PWM: '3'
    });

    extension.motorWrite({
        MOTOR: '1',
        DIRECTION: '0',
        SPEED: '100'
    });

    extension.motorStop({
        MOTOR: '2'
    });

    t.same(
        calls,
        [
            {
                method: 'stop',
                in1Pin: 4,
                in2Pin: 7,
                pwmPin: 5,
                stopMode: 0
            },
            {
                method: 'write',
                in1Pin: 4,
                in2Pin: 7,
                pwmPin: 5,
                direction: 0,
                speed: 255
            },
            {
                method: 'stop',
                in1Pin: 8,
                in2Pin: 12,
                pwmPin: 6,
                stopMode: 0
            }
        ],
        'EasyMaker always uses the canonical fixed motor wiring'
    );

    t.end();
});

test('Actuators configure one motor locally and preserve configuration on invalid input', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const result = extension.motorConfigure({
        MOTOR: '2',
        IN1: '9',
        IN2: '10',
        PWM: '11'
    });

    t.equal(
        result,
        undefined,
        'configuration block returns undefined'
    );

    t.same(
        extension._motors[2],
        {
            in1Pin: 9,
            in2Pin: 10,
            pwmPin: 11
        }
    );

    extension.motorConfigure({
        MOTOR: '2',
        IN1: '9',
        IN2: '9',
        PWM: '11'
    });

    t.same(
        extension._motors[2],
        {
            in1Pin: 9,
            in2Pin: 10,
            pwmPin: 11
        },
        'invalid configuration does not overwrite the previous profile'
    );

    t.end();
});

test('Actuators normalize motor speed percentage and use configured motor profiles', t => {
    const calls = [];

    const sharedPeripheral = {
        motorWrite: (in1Pin, in2Pin, pwmPin, direction, speed) => {
            calls.push({
                in1Pin,
                in2Pin,
                pwmPin,
                direction,
                speed
            });

            return 42;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const motor1Result = extension.motorWrite({
        MOTOR: '1',
        DIRECTION: '0',
        SPEED: '100'
    });

    extension.motorWrite({
        MOTOR: '2',
        DIRECTION: '1',
        SPEED: '50'
    });

    extension.motorWrite({
        MOTOR: '1',
        DIRECTION: '0',
        SPEED: '-10'
    });

    extension.motorWrite({
        MOTOR: '1',
        DIRECTION: '0',
        SPEED: '120'
    });

    t.equal(
        motor1Result,
        42,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 255
            },
            {
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5,
                direction: 1,
                speed: 128
            },
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 0
            },
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 255
            }
        ]
    );

    t.end();
});

test('Actuators stop configured motors using coast mode', t => {
    const calls = [];

    const sharedPeripheral = {
        motorStop: (in1Pin, in2Pin, pwmPin, stopMode) => {
            calls.push({
                in1Pin,
                in2Pin,
                pwmPin,
                stopMode
            });

            return 43;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const motor1Result = extension.motorStop({
        MOTOR: '1'
    });

    extension.motorStop({
        MOTOR: '2'
    });

    t.equal(
        motor1Result,
        43,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                stopMode: 0
            },
            {
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5,
                stopMode: 0
            }
        ]
    );

    t.end();
});

test('Actuators reject invalid motor numbers for write and stop', t => {
    const calls = [];

    const sharedPeripheral = {
        motorWrite: (...args) => {
            calls.push({
                method: 'write',
                args
            });
            return 42;
        },
        motorStop: (...args) => {
            calls.push({
                method: 'stop',
                args
            });
            return 43;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    t.equal(
        extension.motorWrite({
            MOTOR: '3',
            DIRECTION: '0',
            SPEED: '100'
        }),
        null
    );

    t.equal(
        extension.motorWrite({
            MOTOR: '1',
            DIRECTION: '2',
            SPEED: '100'
        }),
        null
    );

    t.equal(
        extension.motorStop({
            MOTOR: '0'
        }),
        null
    );

    t.same(
        calls,
        [],
        'invalid motor commands never reach the peripheral'
    );

    t.end();
});

test('Actuators delegate relay states to the shared peripheral', t => {
    const calls = [];

    const sharedPeripheral = {
        relayWrite: (pin, state) => {
            calls.push({
                pin,
                state
            });

            return 44;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const onResult = extension.relayWrite({
        PIN: '12',
        STATE: '1'
    });

    extension.relayWrite({
        PIN: '2',
        STATE: '0'
    });

    t.equal(
        onResult,
        44,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                pin: 12,
                state: 1
            },
            {
                pin: 2,
                state: 0
            }
        ]
    );

    t.end();
});
