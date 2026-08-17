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
    t.equal(info.blocks.length, 1);

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
