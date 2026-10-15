const tap = require('tap');

const EasyDuinoJrProductProfile =
    require('../../src/board-profiles/easyduino-jr-product-profile');

const test = tap.test;

test('EasyDuino Jr identifies the logical product, UNO target and microcontroller', t => {
    t.equal(EasyDuinoJrProductProfile.id, 'easyduino-jr');
    t.equal(EasyDuinoJrProductProfile.targetBoardId, 'arduino-uno');
    t.equal(EasyDuinoJrProductProfile.microcontroller, 'ATmega328P');
    t.end();
});

const expectedDevices = {
    rgbLed: {
        id: 'rgb-led',
        polarity: 'common-cathode',
        redPin: 9,
        greenPin: 10,
        bluePin: 11
    },
    buzzer: {id: 'buzzer', type: 'passive', pin: 6},
    ultrasonic: {id: 'ultrasonic', model: 'HC-SR04', trigPin: 16, echoPin: 17},
    ldr: {id: 'ldr', pin: 15},
    potentiometer: {id: 'potentiometer', pin: 14},
    dht11: {id: 'dht-11', model: 'DHT11', pin: 12},
    reflectiveSensor: {id: 'reflective-sensor', signal: 'digital', activeLevel: 'LOW', pin: 13},
    servo: {id: 'servo', pin: 5},
    tm1637: {id: 'tm1637', dioPin: 18, clkPin: 19},
    trafficLight: {id: 'traffic-light', greenPin: 4, yellowPin: 7, redPin: 8},
    soilMoisture: {id: 'soil-moisture', signal: 'analog', pin: 16},
    lcd16x2: {
        id: 'lcd-16x2',
        external: true,
        connection: 'shield-female-header-with-jumpers',
        bus: 'i2c',
        pins: {sdaPin: 18, sclPin: 19}
    }
};

for (const [deviceId, expected] of Object.entries(expectedDevices)) {
    test(`EasyDuino Jr defines the official ${deviceId} contract`, t => {
        t.same(EasyDuinoJrProductProfile.devices[deviceId], expected);
        t.end();
    });
}

test('EasyDuino Jr contains only the documented devices', t => {
    t.same(Object.keys(EasyDuinoJrProductProfile.devices), Object.keys(expectedDevices));
    t.end();
});

test('EasyDuino Jr maps both L293D motors and their external battery supply', t => {
    t.same(EasyDuinoJrProductProfile.dedicatedResources, {
        motorPowerSupply: 'external-battery',
        motors: {
            1: {driver: 'L293D', in1Pin: 2, in2Pin: 4, pwmPin: 3},
            2: {driver: 'L293D', in1Pin: 7, in2Pin: 8, pwmPin: 5}
        }
    });
    t.end();
});

test('EasyDuino Jr exposes exactly the seven official external pins', t => {
    t.same(EasyDuinoJrProductProfile.physicalPorts, {
        digitalD2: {id: 'digital-d2', fallbackLabel: 'D2', pins: [2]},
        digitalD3: {id: 'digital-d3', fallbackLabel: 'D3', pins: [3]},
        digitalD5: {id: 'digital-d5', fallbackLabel: 'D5', pins: [5]},
        digitalD7: {id: 'digital-d7', fallbackLabel: 'D7', pins: [7]},
        digitalD8: {id: 'digital-d8', fallbackLabel: 'D8', pins: [8]},
        analogA2: {id: 'analog-a2', fallbackLabel: 'A2', pins: [16]},
        analogA3: {id: 'analog-a3', fallbackLabel: 'A3', pins: [17]}
    });
    t.end();
});

test('EasyDuino Jr declares no Bluetooth, EasyConect or resource policies', t => {
    t.same(EasyDuinoJrProductProfile.capabilities, []);
    t.same(Object.keys(EasyDuinoJrProductProfile), [
        'id',
        'targetBoardId',
        'microcontroller',
        'capabilities',
        'physicalPorts',
        'devices',
        'dedicatedResources'
    ]);
    t.end();
});

test('EasyDuino Jr keeps shared pin mappings without reservations or conflict rules', t => {
    const profile = EasyDuinoJrProductProfile;
    t.equal(profile.devices.servo.pin, profile.dedicatedResources.motors[2].pwmPin);
    t.equal(profile.devices.soilMoisture.pin, profile.devices.ultrasonic.trigPin);
    t.equal(profile.devices.tm1637.dioPin, profile.devices.lcd16x2.pins.sdaPin);
    t.equal(profile.devices.tm1637.clkPin, profile.devices.lcd16x2.pins.sclPin);
    t.equal(profile.devices.trafficLight.greenPin, profile.dedicatedResources.motors[1].in2Pin);
    t.equal(profile.devices.trafficLight.yellowPin, profile.dedicatedResources.motors[2].in1Pin);
    t.equal(profile.devices.trafficLight.redPin, profile.dedicatedResources.motors[2].in2Pin);
    t.end();
});

test('EasyDuino Jr freezes every nested object and array', t => {
    const assertFrozen = (value, path) => {
        if (value && typeof value === 'object') {
            t.ok(Object.isFrozen(value), `${path} is frozen`);
            for (const [key, child] of Object.entries(value)) {
                assertFrozen(child, `${path}.${key}`);
            }
        }
    };
    assertFrozen(EasyDuinoJrProductProfile, 'profile');
    t.equal(Reflect.set(EasyDuinoJrProductProfile, 'id', 'other-board'), false);
    t.equal(Reflect.set(EasyDuinoJrProductProfile.devices.rgbLed, 'redPin', 2), false);
    t.equal(Reflect.set(EasyDuinoJrProductProfile.devices.lcd16x2.pins, 'sdaPin', 2), false);
    t.throws(() => EasyDuinoJrProductProfile.capabilities.push('bluetoothSerial'), TypeError);
    t.throws(() => EasyDuinoJrProductProfile.physicalPorts.digitalD2.pins.push(3), TypeError);
    t.equal(EasyDuinoJrProductProfile.id, 'easyduino-jr');
    t.equal(EasyDuinoJrProductProfile.devices.rgbLed.redPin, 9);
    t.end();
});
