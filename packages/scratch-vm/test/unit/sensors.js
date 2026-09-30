const tap = require('tap');

const BlockType = require('../../src/extension-support/block-type');
const ArgumentType = require('../../src/extension-support/argument-type');
const Scratch3SensorsBlocks = require('../../src/extensions/scratch3_sensors');

const EasyMakerPortSymbols =
    require('../../src/board-profiles/easymaker-port-symbols');

const test = tap.test;

test('Sensors reuse the registered Arduino UNO peripheral', t => {
    const sharedPeripheral = {};

    const runtime = {
        getPeripheralExtension: extensionId => {
            t.equal(
                extensionId,
                'arduinoUno',
                'sensors request the Arduino UNO peripheral'
            );

            return sharedPeripheral;
        }
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        extension._peripheral,
        sharedPeripheral,
        'sensors reuse the registered Arduino UNO peripheral instance'
    );

    t.end();
});

test('Sensors expose the ultrasonic block, colors and pins', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3SensorsBlocks(runtime);
    const info = extension.getInfo();

    t.equal(info.id, 'sensors');
    t.equal(info.name, 'Sensores Arduino');
    t.equal(info.color1, '#29B6F6');
    t.equal(info.color2, '#039BE5');
    t.equal(info.color3, '#0277BD');
    t.equal(info.blocks.length, 11);

    const ultrasonicBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'ultrasonicRead'
        );

    t.equal(
        ultrasonicBlock.hideFromPalette,
        false
    );

    const easyMakerUltrasonicBlock =
        info.blocks.find(
            block =>
                block.opcode ===
                'ultrasonicReadPort'
        );

    t.ok(easyMakerUltrasonicBlock);

    t.equal(
        easyMakerUltrasonicBlock.hideFromPalette,
        true
    );

    t.equal(
        ultrasonicBlock.opcode,
        'ultrasonicRead'
    );

    t.equal(
        ultrasonicBlock.blockType,
        BlockType.REPORTER
    );

    t.equal(
        ultrasonicBlock.text,
        'distância do ultrassônico TRIG [TRIG] ECHO [ECHO] (cm)'
    );

    t.equal(
        ultrasonicBlock.arguments.TRIG.type,
        ArgumentType.NUMBER
    );

    t.equal(
        ultrasonicBlock.arguments.ECHO.type,
        ArgumentType.NUMBER
    );

    t.equal(
        ultrasonicBlock.arguments.TRIG.defaultValue,
        16
    );

    t.equal(
        ultrasonicBlock.arguments.ECHO.defaultValue,
        17
    );

    t.equal(
        ultrasonicBlock.arguments.TRIG.menu,
        'ultrasonicPins'
    );

    t.equal(
        ultrasonicBlock.arguments.ECHO.menu,
        'ultrasonicPins'
    );

    t.same(
        info.menus.ultrasonicPins.items,
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

test('Sensors expose EasyMaker ultrasonic physical port symbols', t => {
    const runtime = {
        getPeripheralExtension: () => ({}),
        getEasyBloxSelectedBoardId: () =>
            'easymaker'
    };

    const extension =
        new Scratch3SensorsBlocks(runtime);

    const info = extension.getInfo();

    const legacyBlock =
        info.blocks.find(
            block =>
                block.opcode ===
                'ultrasonicRead'
        );

    const physicalBlock =
        info.blocks.find(
            block =>
                block.opcode ===
                'ultrasonicReadPort'
        );

    t.equal(
        legacyBlock.hideFromPalette,
        true
    );

    t.equal(
        physicalBlock.hideFromPalette,
        false
    );

    t.equal(
        physicalBlock.blockType,
        BlockType.REPORTER
    );

    t.equal(
        physicalBlock.text,
        'distância do ultrassônico na porta [PORT] (cm)'
    );

    t.equal(
        physicalBlock.arguments.PORT.type,
        ArgumentType.STRING
    );

    t.equal(
        physicalBlock.arguments.PORT.menu,
        'easyMakerUltrasonicPorts'
    );

    t.equal(
        physicalBlock.arguments.PORT.defaultValue,
        'analog-a2-a3'
    );

    t.equal(
        info
            .menus
            .easyMakerUltrasonicPorts
            .acceptReporters,
        false
    );

    t.same(
        info
            .menus
            .easyMakerUltrasonicPorts
            .items,
        [
            {
                text: {
                    src:
                        EasyMakerPortSymbols
                            .triangle
                            .dataURI,
                    alt: 'porta triângulo',
                    width: 32,
                    height: 32
                },
                value: 'analog-a2-a3'
            },
            {
                text: {
                    src:
                        EasyMakerPortSymbols
                            .pentagon
                            .dataURI,
                    alt: 'porta pentágono',
                    width: 32,
                    height: 32
                },
                value: 'analog-a4-a5'
            },
            {
                text: {
                    src:
                        EasyMakerPortSymbols
                            .asterisk
                            .dataURI,
                    alt: 'porta asterisco',
                    width: 32,
                    height: 32
                },
                value: 'digital-d2-d3'
            }
        ]
    );

    t.end();
});

test('Sensors expose the DHT block, types and digital pins', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3SensorsBlocks(runtime);
    const info = extension.getInfo();

    const dhtBlock = info.blocks.find(
        block => block.opcode === 'dhtRead'
    );

    t.ok(dhtBlock);

    t.equal(
        dhtBlock.hideFromPalette,
        false
    );

    const easyMakerDhtBlock =
        info.blocks.find(
            block =>
                block.opcode ===
                'dhtReadPort'
        );

    t.ok(easyMakerDhtBlock);

    t.equal(
        easyMakerDhtBlock.hideFromPalette,
        true
    );

    t.equal(
        dhtBlock.blockType,
        BlockType.REPORTER
    );

    t.equal(
        dhtBlock.text,
        '[TYPE] do DHT no pino [PIN]'
    );

    t.equal(
        dhtBlock.arguments.TYPE.type,
        ArgumentType.STRING
    );

    t.equal(
        dhtBlock.arguments.TYPE.menu,
        'dhtTypes'
    );

    t.equal(
        dhtBlock.arguments.TYPE.defaultValue,
        '0'
    );

    t.equal(
        dhtBlock.arguments.PIN.type,
        ArgumentType.NUMBER
    );

    t.equal(
        dhtBlock.arguments.PIN.menu,
        'dhtPins'
    );

    t.equal(
        dhtBlock.arguments.PIN.defaultValue,
        12
    );

    t.same(
        info.menus.dhtTypes.items,
        [
            {text: 'temperatura', value: '0'},
            {text: 'umidade', value: '1'}
        ]
    );

    t.same(
        info.menus.dhtPins.items,
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
            {text: 'D13', value: '13'}
        ]
    );

    t.end();
});

test('Sensors expose EasyMaker DHT physical port symbols', t => {
    const runtime = {
        getPeripheralExtension: () => ({}),
        getEasyBloxSelectedBoardId: () =>
            'easymaker'
    };

    const extension =
        new Scratch3SensorsBlocks(runtime);

    const info = extension.getInfo();

    const legacyBlock =
        info.blocks.find(
            block =>
                block.opcode ===
                'dhtRead'
        );

    const physicalBlock =
        info.blocks.find(
            block =>
                block.opcode ===
                'dhtReadPort'
        );

    t.equal(
        legacyBlock.hideFromPalette,
        true
    );

    t.equal(
        physicalBlock.hideFromPalette,
        false
    );

    t.equal(
        physicalBlock.text,
        '[TYPE] do DHT na porta [PORT]'
    );

    t.equal(
        physicalBlock.arguments.PORT.type,
        ArgumentType.STRING
    );

    t.equal(
        physicalBlock.arguments.PORT.menu,
        'easyMakerDhtPorts'
    );

    t.equal(
        physicalBlock.arguments.PORT.defaultValue,
        'digital-d12'
    );

    t.equal(
        info
            .menus
            .easyMakerDhtPorts
            .acceptReporters,
        false
    );

    t.same(
        info
            .menus
            .easyMakerDhtPorts
            .items,
        [
            {
                text: {
                    src:
                        EasyMakerPortSymbols
                            .asterisk
                            .dataURI,
                    alt: 'porta asterisco',
                    width: 32,
                    height: 32
                },
                value: 'digital-d2-d3'
            },
            {
                text: {
                    src:
                        EasyMakerPortSymbols
                            .question
                            .dataURI,
                    alt: 'porta interrogação',
                    width: 32,
                    height: 32
                },
                value: 'digital-d12'
            },
            {
                text: {
                    src:
                        EasyMakerPortSymbols
                            .chevrons
                            .dataURI,
                    alt: 'porta menor e maior',
                    width: 32,
                    height: 32
                },
                value: 'digital-d13'
            }
        ]
    );

    t.end();
});

test('Sensors expose EasyMaker generic digital and analog sensor surfaces', async t => {
    const calls = [];

    const sharedPeripheral = {
        digitalRead: pin => {
            calls.push({
                type: 'digital',
                pin
            });

            return Promise.resolve(
                pin === 12 ?
                    1 :
                    0
            );
        },

        analogRead: pin => {
            calls.push({
                type: 'analog',
                pin
            });

            return Promise.resolve(
                pin === 17 ?
                    777 :
                    999
            );
        }
    };

    const genericExtension =
        new Scratch3SensorsBlocks({
            getPeripheralExtension:
                () => sharedPeripheral
        });

    const genericInfo =
        genericExtension.getInfo();

    const genericDigitalBlock =
        genericInfo.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'digitalSensorRead'
        );

    const genericAnalogBlock =
        genericInfo.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'analogSensorRead'
        );

    t.equal(
        genericDigitalBlock.hideFromPalette,
        true,
        'generic Arduino hides EasyMaker digital sensor surface'
    );

    t.equal(
        genericAnalogBlock.hideFromPalette,
        true,
        'generic Arduino hides EasyMaker analog sensor surface'
    );

    const extension =
        new Scratch3SensorsBlocks({
            getPeripheralExtension:
                () => sharedPeripheral,

            getEasyBloxSelectedBoardId:
                () => 'easymaker'
        });

    const info =
        extension.getInfo();

    const digitalBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'digitalSensorRead'
        );

    const analogBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'analogSensorRead'
        );

    t.ok(
        digitalBlock,
        'EasyMaker exposes digital sensor block'
    );

    t.ok(
        analogBlock,
        'EasyMaker exposes analog sensor block'
    );

    t.equal(
        digitalBlock.hideFromPalette,
        false
    );

    t.equal(
        analogBlock.hideFromPalette,
        false
    );

    t.equal(
        digitalBlock.blockType,
        BlockType.BOOLEAN
    );

    t.equal(
        analogBlock.blockType,
        BlockType.REPORTER
    );

    t.equal(
        digitalBlock.text,
        'sensor digital [TYPE] na porta [PORT]'
    );

    t.equal(
        analogBlock.text,
        'sensor analógico [TYPE] na porta [PORT]'
    );

    t.equal(
        digitalBlock.arguments.TYPE.menu,
        'digitalSensorTypes'
    );

    t.equal(
        digitalBlock.arguments.PORT.menu,
        'easyMakerDigitalSensorPorts'
    );

    t.equal(
        analogBlock.arguments.TYPE.menu,
        'analogSensorTypes'
    );

    t.equal(
        analogBlock.arguments.PORT.menu,
        'easyMakerAnalogSensorPorts'
    );

    t.same(
        info.menus
            .digitalSensorTypes
            .items,
        [
            {
                text: 'PIR',
                value: 'PIR'
            },
            {
                text: 'Tilt',
                value: 'TILT'
            },
            {
                text: 'Reflexivo',
                value: 'REFLECTIVE'
            },
            {
                text: 'Chuva',
                value: 'RAIN'
            },
            {
                text: 'Botão',
                value: 'BUTTON'
            },
            {
                text: 'Som',
                value: 'SOUND'
            }
        ]
    );

    t.same(
        info.menus
            .analogSensorTypes
            .items,
        [
            {
                text: 'Potenciômetro',
                value: 'POTENTIOMETER'
            },
            {
                text: 'Reflexivo',
                value: 'REFLECTIVE'
            },
            {
                text: 'LDR',
                value: 'LDR'
            },
            {
                text: 'Umidade do Solo',
                value: 'SOIL_MOISTURE'
            },
            {
                text: 'Som',
                value: 'SOUND'
            }
        ]
    );

    t.same(
        info.menus
            .easyMakerDigitalSensorPorts
            .items
            .map(item => ({
                alt: item.text.alt,
                value: item.value
            })),
        [
            {
                alt: 'porta asterisco',
                value: 'digital-d2-d3'
            },
            {
                alt: 'porta interrogação',
                value: 'digital-d12'
            },
            {
                alt: 'porta menor e maior',
                value: 'digital-d13'
            }
        ]
    );

    t.same(
        info.menus
            .easyMakerAnalogSensorPorts
            .items
            .map(item => ({
                alt: item.text.alt,
                value: item.value
            })),
        [
            {
                alt: 'porta quadrado',
                value: 'analog-a0'
            },
            {
                alt: 'porta círculo',
                value: 'analog-a1'
            },
            {
                alt: 'porta semicírculo',
                value: 'analog-a2'
            },
            {
                alt: 'porta triângulo',
                value: 'analog-a2-a3'
            },
            {
                alt: 'porta pentágono',
                value: 'analog-a4-a5'
            }
        ]
    );

    t.ok(
        info.menus
            .easyMakerDigitalSensorPorts
            .items
            .every(
                item =>
                    /^data:image\/svg\+xml,/
                        .test(item.text.src)
            ),
        'digital sensor ports use physical SVG symbols'
    );

    t.ok(
        info.menus
            .easyMakerAnalogSensorPorts
            .items
            .every(
                item =>
                    /^data:image\/svg\+xml,/
                        .test(item.text.src)
            ),
        'analog sensor ports use physical SVG symbols'
    );

    t.equal(
        await extension.digitalSensorRead({
            TYPE: 'PIR',
            PORT: 'digital-d12'
        }),
        true,
        'digital sensor resolves question port to D12'
    );

    t.equal(
        await extension.digitalSensorRead({
            TYPE: 'TILT',
            PORT: 'digital-d13'
        }),
        false,
        'digital sensor resolves chevrons port to D13'
    );

    t.equal(
        await extension.digitalSensorRead({
            TYPE: 'RAIN',
            PORT: 'digital-d2-d3'
        }),
        false,
        'rain sensor resolves asterisk port to D3'
    );

    t.equal(
        await extension.digitalSensorRead({
            TYPE: 'BUTTON',
            PORT: 'digital-d12'
        }),
        true,
        'button resolves question port to D12'
    );

    t.equal(
        await extension.digitalSensorRead({
            TYPE: 'SOUND',
            PORT: 'digital-d13'
        }),
        false,
        'digital sound sensor resolves chevrons port to D13'
    );

    t.equal(
        await extension.analogSensorRead({
            TYPE: 'POTENTIOMETER',
            PORT: 'analog-a2-a3'
        }),
        777,
        'analog sensor resolves triangle port to A3'
    );

    t.equal(
        await extension.analogSensorRead({
            TYPE: 'REFLECTIVE',
            PORT: 'analog-a4-a5'
        }),
        999,
        'analog sensor resolves pentagon port to A5'
    );

    t.equal(
        await extension.analogSensorRead({
            TYPE: 'LDR',
            PORT: 'analog-a0'
        }),
        999,
        'LDR resolves square port to A0'
    );

    t.equal(
        await extension.analogSensorRead({
            TYPE: 'SOIL_MOISTURE',
            PORT: 'analog-a1'
        }),
        999,
        'soil moisture resolves circle port to A1'
    );

    t.equal(
        await extension.analogSensorRead({
            TYPE: 'SOUND',
            PORT: 'analog-a2'
        }),
        999,
        'analog sound sensor resolves semicircle port to A2'
    );

    t.equal(
        extension.digitalSensorRead({
            TYPE: 'UNKNOWN',
            PORT: 'digital-d12'
        }),
        null,
        'digital sensor rejects unknown types'
    );

    t.equal(
        extension.digitalSensorRead({
            TYPE: 'PIR',
            PORT: 'invalid-port'
        }),
        null,
        'digital sensor rejects unknown ports'
    );

    t.equal(
        extension.analogSensorRead({
            TYPE: 'UNKNOWN',
            PORT: 'analog-a0'
        }),
        null,
        'analog sensor rejects unknown types'
    );

    t.equal(
        extension.analogSensorRead({
            TYPE: 'POTENTIOMETER',
            PORT: 'invalid-port'
        }),
        null,
        'analog sensor rejects unknown ports'
    );

    t.same(
        calls,
        [
            {
                type: 'digital',
                pin: 12
            },
            {
                type: 'digital',
                pin: 13
            },
            {
                type: 'digital',
                pin: 3
            },
            {
                type: 'digital',
                pin: 12
            },
            {
                type: 'digital',
                pin: 13
            },
            {
                type: 'analog',
                pin: 17
            },
            {
                type: 'analog',
                pin: 19
            },
            {
                type: 'analog',
                pin: 14
            },
            {
                type: 'analog',
                pin: 15
            },
            {
                type: 'analog',
                pin: 16
            }
        ],
        'Stage resolves EasyMaker physical ports before reading'
    );

    t.end();
});

test('Sensors convert ultrasonic millimeters to centimeters', async t => {
    const calls = [];

    const sharedPeripheral = {
        ultrasonicRead: (trigPin, echoPin) => {
            calls.push({
                trigPin,
                echoPin
            });

            return Promise.resolve(500);
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    const result = await extension.ultrasonicRead({
        TRIG: '16',
        ECHO: '17'
    });

    t.equal(result, 50);
    t.same(
        calls,
        [
            {
                trigPin: 16,
                echoPin: 17
            }
        ]
    );

    t.end();
});

test('Sensors resolve EasyMaker ultrasonic physical port before Stage read', async t => {
    const calls = [];

    const sharedPeripheral = {
        ultrasonicRead: (trigPin, echoPin) => {
            calls.push({
                trigPin,
                echoPin
            });

            return Promise.resolve(500);
        }
    };

    const runtime = {
        getPeripheralExtension: () =>
            sharedPeripheral
    };

    const extension =
        new Scratch3SensorsBlocks(runtime);

    const result =
        await extension.ultrasonicReadPort({
            PORT: 'analog-a4-a5'
        });

    t.equal(result, 50);

    t.same(
        calls,
        [
            {
                trigPin: 18,
                echoPin: 19
            }
        ]
    );

    t.equal(
        extension.ultrasonicReadPort({
            PORT: 'invalid-port'
        }),
        null
    );

    t.end();
});

test('Sensors propagate unavailable ultrasonic readings as null', async t => {
    const sharedPeripheral = {
        ultrasonicRead: () => Promise.resolve(null)
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        await extension.ultrasonicRead({
            TRIG: '16',
            ECHO: '17'
        }),
        null
    );

    t.end();
});

test('Sensors return null when ultrasonic reading is unavailable', t => {
    const sharedPeripheral = {
        ultrasonicRead: () => null
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        extension.ultrasonicRead({
            TRIG: '16',
            ECHO: '17'
        }),
        null
    );

    t.end();
});

test('Sensors convert DHT temperature hundredths to degrees Celsius', async t => {
    const calls = [];

    const sharedPeripheral = {
        dhtRead: (pin, type) => {
            calls.push({
                pin,
                type
            });

            return Promise.resolve({
                temperature: 2400,
                humidity: 5300
            });
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    const result = await extension.dhtRead({
        TYPE: '0',
        PIN: '12'
    });

    t.equal(result, 24);

    t.same(
        calls,
        [
            {
                pin: 12,
                type: 0
            }
        ]
    );

    t.end();
});

test('Sensors resolve EasyMaker DHT physical ports before Stage read', async t => {
    const calls = [];

    const sharedPeripheral = {
        dhtRead: (pin, type) => {
            calls.push({
                pin,
                type
            });

            return Promise.resolve({
                temperature: 2400,
                humidity: 5300
            });
        }
    };

    const runtime = {
        getPeripheralExtension: () =>
            sharedPeripheral
    };

    const extension =
        new Scratch3SensorsBlocks(runtime);

    t.equal(
        await extension.dhtReadPort({
            TYPE: '0',
            PORT: 'digital-d2-d3'
        }),
        24
    );

    t.equal(
        await extension.dhtReadPort({
            TYPE: '0',
            PORT: 'digital-d12'
        }),
        24
    );

    t.equal(
        await extension.dhtReadPort({
            TYPE: '0',
            PORT: 'digital-d13'
        }),
        24
    );

    t.same(
        calls,
        [
            {
                pin: 3,
                type: 0
            },
            {
                pin: 12,
                type: 0
            },
            {
                pin: 13,
                type: 0
            }
        ]
    );

    t.equal(
        extension.dhtReadPort({
            TYPE: '0',
            PORT: 'invalid-port'
        }),
        null
    );

    t.end();
});

test('Sensors convert DHT humidity hundredths to percent', async t => {
    const sharedPeripheral = {
        dhtRead: () => Promise.resolve({
            temperature: 2400,
            humidity: 5300
        })
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        await extension.dhtRead({
            TYPE: '1',
            PIN: '12'
        }),
        53
    );

    t.end();
});

test('Sensors propagate unavailable DHT readings as null', async t => {
    const sharedPeripheral = {
        dhtRead: () => Promise.resolve(null)
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        await extension.dhtRead({
            TYPE: '0',
            PIN: '12'
        }),
        null
    );

    t.end();
});

test('Sensors return null when DHT reading is unavailable', t => {
    const sharedPeripheral = {
        dhtRead: () => null
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        extension.dhtRead({
            TYPE: '0',
            PIN: '12'
        }),
        null
    );

    t.end();
});

test('Sensors expose the joystick blocks and menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3SensorsBlocks(runtime);
    const info = extension.getInfo();

    const initBlock = info.blocks.find(
        block => block.opcode === 'joystickInit'
    );

    const valueBlock = info.blocks.find(
        block => block.opcode === 'joystickValue'
    );

    const clickedBlock = info.blocks.find(
        block => block.opcode === 'joystickClicked'
    );

    t.ok(initBlock);
    t.ok(valueBlock);
    t.ok(clickedBlock);

    t.equal(initBlock.blockType, BlockType.COMMAND);
    t.equal(
        initBlock.text,
        'inicializar joystick X [X] Y [Y] CLICK [CLICK]'
    );

    t.equal(initBlock.arguments.X.defaultValue, 18);
    t.equal(initBlock.arguments.Y.defaultValue, 19);
    t.equal(initBlock.arguments.CLICK.defaultValue, 13);

    t.equal(
        initBlock.arguments.X.menu,
        'joystickAnalogPins'
    );

    t.equal(
        initBlock.arguments.Y.menu,
        'joystickAnalogPins'
    );

    t.equal(
        initBlock.arguments.CLICK.menu,
        'joystickClickPins'
    );

    t.equal(valueBlock.blockType, BlockType.REPORTER);
    t.equal(valueBlock.text, 'valor do joystick [AXIS]');
    t.equal(valueBlock.arguments.AXIS.defaultValue, 'X');
    t.equal(valueBlock.arguments.AXIS.menu, 'joystickAxes');

    t.equal(clickedBlock.blockType, BlockType.BOOLEAN);
    t.equal(clickedBlock.text, 'joystick clicado?');

    t.same(
        info.menus.joystickAnalogPins.items,
        [
            {text: 'A0', value: '14'},
            {text: 'A1', value: '15'},
            {text: 'A2', value: '16'},
            {text: 'A3', value: '17'},
            {text: 'A4', value: '18'},
            {text: 'A5', value: '19'}
        ]
    );

    t.same(
        info.menus.joystickAxes.items,
        [
            {text: 'X', value: 'X'},
            {text: 'Y', value: 'Y'}
        ]
    );

    t.end();
});

test('Sensors expose fixed EasyMaker joystick initialization', t => {
    const runtime = {
        getPeripheralExtension: () => ({}),
        getEasyBloxSelectedBoardId:
            () => 'easymaker'
    };

    const extension =
        new Scratch3SensorsBlocks(runtime);

    const info = extension.getInfo();

    const genericInitBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'joystickInit'
        );

    const easyMakerInitBlock =
        info.blocks.find(
            block =>
                block &&
                block.opcode ===
                    'joystickInitEasyMaker'
        );

    t.equal(
        genericInitBlock.hideFromPalette,
        true,
        'EasyMaker hides manual joystick pin configuration'
    );

    t.equal(
        easyMakerInitBlock.hideFromPalette,
        false,
        'EasyMaker exposes dedicated joystick initialization'
    );

    t.equal(
        easyMakerInitBlock.text,
        'inicializar joystick'
    );

    t.equal(
        easyMakerInitBlock.arguments,
        undefined,
        'EasyMaker joystick exposes no Arduino pin arguments'
    );

    extension.joystickInit({
        X: '14',
        Y: '15',
        CLICK: '12'
    });

    t.equal(
        extension._joystickXPin,
        18
    );

    t.equal(
        extension._joystickYPin,
        19
    );

    t.equal(
        extension._joystickClickPin,
        13
    );

    extension.joystickInitEasyMaker();

    t.equal(
        extension._joystickXPin,
        18
    );

    t.equal(
        extension._joystickYPin,
        19
    );

    t.equal(
        extension._joystickClickPin,
        13
    );

    t.end();
});

test('Sensors configure joystick pins locally', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    const result = extension.joystickInit({
        X: '14',
        Y: '15',
        CLICK: '12'
    });

    t.equal(
        result,
        undefined,
        'joystick configuration does not report a value'
    );

    t.equal(extension._joystickXPin, 14);
    t.equal(extension._joystickYPin, 15);
    t.equal(extension._joystickClickPin, 12);

    t.end();
});

test('Sensors reject invalid joystick pin configurations', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    extension.joystickInit({
        X: '14',
        Y: '15',
        CLICK: '12'
    });

    extension.joystickInit({
        X: '13',
        Y: '15',
        CLICK: '12'
    });

    t.equal(extension._joystickXPin, 14);
    t.equal(extension._joystickYPin, 15);
    t.equal(extension._joystickClickPin, 12);

    extension.joystickInit({
        X: '14',
        Y: '14',
        CLICK: '12'
    });

    t.equal(extension._joystickXPin, 14);
    t.equal(extension._joystickYPin, 15);

    extension.joystickInit({
        X: '14',
        Y: '15',
        CLICK: '14'
    });

    t.equal(extension._joystickClickPin, 12);

    t.end();
});

test('Sensors read joystick X and Y axes', async t => {
    const calls = [];

    const sharedPeripheral = {
        joystickRead: (xPin, yPin, clickPin) => {
            calls.push({
                xPin,
                yPin,
                clickPin
            });

            return Promise.resolve({
                x: 538,
                y: 508,
                clicked: false
            });
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        await extension.joystickValue({
            AXIS: 'X'
        }),
        538
    );

    t.equal(
        await extension.joystickValue({
            AXIS: 'Y'
        }),
        508
    );

    t.same(
        calls,
        [
            {
                xPin: 18,
                yPin: 19,
                clickPin: 13
            },
            {
                xPin: 18,
                yPin: 19,
                clickPin: 13
            }
        ]
    );

    t.end();
});

test('Sensors report joystick click as a boolean', async t => {
    const sharedPeripheral = {
        joystickRead: () => Promise.resolve({
            x: 538,
            y: 508,
            clicked: true
        })
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        await extension.joystickClicked(),
        true
    );

    t.end();
});

test('Sensors propagate unavailable joystick readings as null', async t => {
    const sharedPeripheral = {
        joystickRead: () => Promise.resolve(null)
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3SensorsBlocks(runtime);

    t.equal(
        await extension.joystickValue({
            AXIS: 'X'
        }),
        null
    );

    t.equal(
        await extension.joystickClicked(),
        null
    );

    t.end();
});
