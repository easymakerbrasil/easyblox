const tap = require('tap');

const EasyMakerProductProfile =
    require('../../src/board-profiles/easymaker-product-profile');

const test = tap.test;

test('EasyMaker ProductProfile identifies the logical product and target', t => {
    t.equal(
        EasyMakerProductProfile.id,
        'easymaker'
    );

    t.equal(
        EasyMakerProductProfile.targetBoardId,
        'arduino-uno'
    );

    t.end();
});

test('EasyMaker ProductProfile defines the canonical analog physical ports', t => {
    const ports = EasyMakerProductProfile.physicalPorts;

    t.same(
        ports.analogA0,
        {
            id: 'analog-a0',
            symbolId: 'square',
            fallbackLabel: '\u25A1',
            pins: [14]
        }
    );

    t.same(
        ports.analogA1,
        {
            id: 'analog-a1',
            symbolId: 'circle',
            fallbackLabel: '\u25CB',
            pins: [15]
        }
    );

    t.same(
        ports.analogA2,
        {
            id: 'analog-a2',
            symbolId: 'semicircle',
            fallbackLabel: 'A2',
            pins: [16]
        }
    );

    t.same(
        ports.analogA2A3,
        {
            id: 'analog-a2-a3',
            symbolId: 'triangle',
            fallbackLabel: '\u25B3',
            pins: [
                16,
                17
            ]
        }
    );

    t.same(
        ports.analogA4A5,
        {
            id: 'analog-a4-a5',
            symbolId: 'pentagon',
            fallbackLabel: '\u2B1F',
            pins: [
                18,
                19
            ]
        }
    );

    t.end();
});

test('EasyMaker ProductProfile defines the canonical digital physical ports', t => {
    const ports = EasyMakerProductProfile.physicalPorts;

    t.same(
        ports.digitalD2D3,
        {
            id: 'digital-d2-d3',
            symbolId: 'asterisk',
            fallbackLabel: '*',
            pins: [
                2,
                3
            ]
        }
    );

    t.same(
        ports.digitalD4D7D8,
        {
            id: 'digital-d4-d7-d8',
            symbolId: 'equals',
            fallbackLabel: '=',
            pins: [
                4,
                7,
                8
            ]
        }
    );

    t.same(
        ports.digitalD9D10D11,
        {
            id: 'digital-d9-d10-d11',
            symbolId: 'exclamation',
            fallbackLabel: '!',
            pins: [
                9,
                10,
                11
            ]
        }
    );

    t.same(
        ports.digitalD12,
        {
            id: 'digital-d12',
            symbolId: 'question',
            fallbackLabel: '?',
            pins: [12]
        }
    );

    t.same(
        ports.digitalD13,
        {
            id: 'digital-d13',
            symbolId: 'chevrons',
            fallbackLabel: '<>',
            pins: [13]
        }
    );

    t.end();
});

test('EasyMaker ProductProfile maps ultrasonic physical ports to fixed pins', t => {
    const ultrasonic =
        EasyMakerProductProfile.devices.ultrasonic;

    t.equal(
        ultrasonic.id,
        'ultrasonic'
    );

    t.same(
        ultrasonic.ports['analog-a2-a3'],
        {
            trigPin: 16,
            echoPin: 17
        }
    );

    t.same(
        ultrasonic.ports['analog-a4-a5'],
        {
            trigPin: 18,
            echoPin: 19
        }
    );

    t.same(
        ultrasonic.ports['digital-d2-d3'],
        {
            trigPin: 2,
            echoPin: 3
        }
    );

    t.end();
});

test('EasyMaker ProductProfile maps DHT11 physical ports to fixed signal pins', t => {
    const dht11 =
        EasyMakerProductProfile.devices.dht11;

    t.equal(
        dht11.id,
        'dht-11'
    );

    t.same(
        dht11.ports['digital-d2-d3'],
        {
            pin: 3
        }
    );

    t.same(
        dht11.ports['digital-d12'],
        {
            pin: 12
        }
    );

    t.same(
        dht11.ports['digital-d13'],
        {
            pin: 13
        }
    );

    t.equal(
        EasyMakerProductProfile
            .physicalPorts
            .digitalD2D3
            .symbolId,
        'asterisk'
    );

    t.equal(
        EasyMakerProductProfile
            .physicalPorts
            .digitalD12
            .symbolId,
        'question'
    );

    t.equal(
        EasyMakerProductProfile
            .physicalPorts
            .digitalD13
            .symbolId,
        'chevrons'
    );

    t.end();
});

test('EasyMaker ProductProfile maps traffic light physical ports to fixed signals', t => {
    const trafficLight =
        EasyMakerProductProfile.devices.trafficLight;

    t.equal(
        trafficLight.id,
        'traffic-light'
    );

    t.same(
        trafficLight.ports['digital-d4-d7-d8'],
        {
            greenPin: 4,
            yellowPin: 7,
            redPin: 8
        }
    );

    t.same(
        trafficLight.ports['digital-d9-d10-d11'],
        {
            greenPin: 9,
            yellowPin: 10,
            redPin: 11
        }
    );

    t.equal(
        EasyMakerProductProfile
            .physicalPorts
            .digitalD4D7D8
            .fallbackLabel,
        '='
    );

    t.equal(
        EasyMakerProductProfile
            .physicalPorts
            .digitalD9D10D11
            .fallbackLabel,
        '!'
    );

    t.end();
});

test('EasyMaker ProductProfile maps LCD to the physical A4 A5 port', t => {
    const lcd =
        EasyMakerProductProfile.devices.lcd16x2;

    t.same(
        lcd,
        {
            id: 'lcd-16x2',
            portId: 'analog-a4-a5',
            bus: 'i2c',
            pins: {
                sdaPin: 18,
                sclPin: 19
            }
        }
    );

    t.equal(
        EasyMakerProductProfile
            .physicalPorts
            .analogA4A5
            .symbolId,
        'pentagon'
    );

    t.end();
});

test('EasyMaker ProductProfile maps TM1637 physical ports to CLK and DIO', t => {
    const tm1637 =
        EasyMakerProductProfile.devices.tm1637;

    t.equal(
        tm1637.id,
        'tm1637'
    );

    t.same(
        tm1637.ports['analog-a2-a3'],
        {
            clkPin: 16,
            dioPin: 17
        }
    );

    t.same(
        tm1637.ports['analog-a4-a5'],
        {
            clkPin: 18,
            dioPin: 19
        }
    );

    t.same(
        tm1637.ports['digital-d2-d3'],
        {
            clkPin: 2,
            dioPin: 3
        }
    );

    t.end();
});

test('EasyMaker ProductProfile defines the simple digital I/O ports', t => {
    t.same(
        EasyMakerProductProfile.simpleDigitalPorts,
        {
            d3: {
                id: 'digital-d3',
                physicalPortId:
                    'digital-d2-d3',
                pin: 3
            },

            d12: {
                id: 'digital-d12',
                physicalPortId:
                    'digital-d12',
                pin: 12
            },

            d13: {
                id: 'digital-d13',
                physicalPortId:
                    'digital-d13',
                pin: 13
            }
        }
    );

    t.end();
});

test('EasyMaker ProductProfile defines the dedicated matrix and joystick bus', t => {
    t.same(
        EasyMakerProductProfile.dedicatedResources.matrixJoystick,
        {
            id: 'matrix-joystick',
            pins: {
                a4: 18,
                a5: 19,
                d13: 13
            }
        }
    );

    t.end();
});

test('EasyMaker ProductProfile exposes only the physical servo ports', t => {
    t.same(
        EasyMakerProductProfile.dedicatedResources.servoPorts,
        [
            5,
            9,
            10,
            11
        ]
    );

    t.end();
});

test('EasyMaker ProductProfile defines the fixed motor wiring', t => {
    t.same(
        EasyMakerProductProfile.dedicatedResources.motors,
        {
            1: {
                symbolId: 'star',
                in1Pin: 4,
                in2Pin: 7,
                pwmPin: 5
            },
            2: {
                symbolId: 'star',
                in1Pin: 8,
                in2Pin: 12,
                pwmPin: 6
            }
        }
    );

    t.end();
});

test('EasyMaker ProductProfile keeps physical identifiers stable and separate from labels', t => {
    const ports = EasyMakerProductProfile.physicalPorts;

    t.equal(
        ports.analogA0.id,
        'analog-a0'
    );
    t.equal(
        ports.analogA0.symbolId,
        'square'
    );
    t.equal(
        ports.analogA0.fallbackLabel,
        '\u25A1'
    );

    t.not(
        ports.analogA0.id,
        ports.analogA0.fallbackLabel
    );

    t.end();
});
