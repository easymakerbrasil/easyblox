const tap = require('tap');

const BlockType = require('../../src/extension-support/block-type');
const ArgumentType = require('../../src/extension-support/argument-type');
const Scratch3SensorsBlocks = require('../../src/extensions/scratch3_sensors');

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
    t.equal(info.blocks.length, 6);

    const ultrasonicBlock = info.blocks[0];

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
