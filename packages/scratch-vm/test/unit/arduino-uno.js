const tap = require('tap');

const BlockType = require('../../src/extension-support/block-type');
const ArgumentType = require('../../src/extension-support/argument-type');
const ArduinoUnoPeripheral = require('../../src/extensions/scratch3_arduino_uno/peripheral');
const Scratch3ArduinoUnoBlocks = require('../../src/extensions/scratch3_arduino_uno');
const {
    COMMANDS,
    LCD_MODES,
    RESPONSES,
    encodeFrame
} = require('../../src/extensions/scratch3_arduino_uno/protocol');

class MockRuntime {
    constructor (transport) {
        this.transport = transport;
        this.events = [];
        this.peripheralExtensions = {};
    }

    getSerialTransport () {
        return this.transport;
    }

    registerPeripheralExtension (extensionId, extension) {
        this.peripheralExtensions[extensionId] = extension;
    }

    emit (event, data) {
        this.events.push({event, data});
    }
}

MockRuntime.PERIPHERAL_LIST_UPDATE = 'PERIPHERAL_LIST_UPDATE';
MockRuntime.USER_PICKED_PERIPHERAL = 'USER_PICKED_PERIPHERAL';
MockRuntime.PERIPHERAL_CONNECTED = 'PERIPHERAL_CONNECTED';
MockRuntime.PERIPHERAL_DISCONNECTED = 'PERIPHERAL_DISCONNECTED';
MockRuntime.PERIPHERAL_REQUEST_ERROR = 'PERIPHERAL_REQUEST_ERROR';
MockRuntime.PERIPHERAL_SCAN_TIMEOUT = 'PERIPHERAL_SCAN_TIMEOUT';
MockRuntime.PERIPHERAL_CONNECTION_LOST_ERROR = 'PERIPHERAL_CONNECTION_LOST_ERROR';

const flushPromises = () =>
    new Promise(resolve => setImmediate(resolve));

tap.test('Arduino UNO registers itself as a peripheral extension', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        runtime.peripheralExtensions.arduinoUno,
        peripheral
    );

    t.equal(peripheral.isConnected(), false);

    t.end();
});

tap.test('Arduino UNO scans serial ports at 115200 baud', async t => {
    let receivedOptions = null;

    const transport = {
        listPorts: async options => {
            receivedOptions = options;

            return [{
                peripheralId: 'COM3',
                name: 'Arduino UNO'
            }];
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.scan();

    await new Promise(resolve => setImmediate(resolve));

    t.same(receivedOptions, {
        baudRate: 115200
    });

    t.equal(
        runtime.events[0].event,
        MockRuntime.PERIPHERAL_LIST_UPDATE
    );

    t.same(runtime.events[0].data, {
        COM3: {
            peripheralId: 'COM3',
            name: 'Arduino UNO'
        }
    });
});

tap.test('Arduino UNO connects to the selected serial port', async t => {
    let openedPeripheralId = null;
    let openedOptions = null;

    const transport = {
        open: async (peripheralId, options) => {
            openedPeripheralId = peripheralId;
            openedOptions = options;
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    t.equal(openedPeripheralId, 'COM3');

    t.same(openedOptions, {
        baudRate: 115200
    });

    t.equal(peripheral.isConnected(), true);

    t.equal(
        runtime.events[0].event,
        MockRuntime.PERIPHERAL_CONNECTED
    );
});

tap.test('Arduino UNO disconnects from the serial port', async t => {
    let closeCalled = false;

    const transport = {
        open: async () => {},
        close: async () => {
            closeCalled = true;
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setImmediate(resolve));

    t.equal(peripheral.isConnected(), true);

    peripheral.disconnect();

    await new Promise(resolve => setImmediate(resolve));

    t.equal(peripheral.isConnected(), false);
    t.equal(closeCalled, true);

    t.equal(
        runtime.events[runtime.events.length - 1].event,
        MockRuntime.PERIPHERAL_DISCONNECTED
    );
});

tap.test('Arduino UNO completes the Stage handshake with PING and PONG', async t => {
    let onData = null;
    let writtenFrame = null;

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrame = data;
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(peripheral.isStageConnected(), false);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    t.equal(peripheral.isConnected(), true);
    t.equal(peripheral.isStageConnected(), false);

    t.ok(writtenFrame instanceof Uint8Array);

    t.equal(
        writtenFrame[4],
        COMMANDS.PING
    );

    const pingSequence = writtenFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);
});

tap.test('Arduino UNO retries the Stage handshake until PONG is received', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 1050));

    t.equal(peripheral.isConnected(), true);
    t.equal(peripheral.isStageConnected(), false);

    t.equal(writtenFrames.length, 2);

    t.equal(
        writtenFrames[0][4],
        COMMANDS.PING
    );

    t.equal(
        writtenFrames[1][4],
        COMMANDS.PING
    );

    const retrySequence = writtenFrames[1][3];

    onData(
        encodeFrame(
            retrySequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    await new Promise(resolve => setTimeout(resolve, 550));

    t.equal(writtenFrames.length, 2);
});

tap.test('Arduino UNO sends DIGITAL_WRITE after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const sequence = peripheral.digitalWrite(13, 1);

    await flushPromises();

    t.equal(sequence, 2);
    t.equal(writtenFrames.length, 2);

    t.same(
        writtenFrames[1],
        encodeFrame(
            sequence,
            COMMANDS.DIGITAL_WRITE,
            [13, 1]
        )
    );
});

tap.test('Arduino UNO rejects invalid DIGITAL_WRITE requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.digitalWrite(13, 1),
        null,
        'does not write before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.digitalWrite(0, 1), null);
    t.equal(peripheral.digitalWrite(1, 1), null);
    t.equal(peripheral.digitalWrite(20, 1), null);
    t.equal(peripheral.digitalWrite(13, 2), null);
    t.equal(peripheral.digitalWrite(13, -1), null);
    t.equal(peripheral.digitalWrite(13.5, 1), null);

    t.end();
});

tap.test('Arduino UNO sends PWM_WRITE after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const lowSequence = peripheral.pwmWrite(3, 0);
    const highSequence = peripheral.pwmWrite(11, 255);

    await flushPromises();

    t.equal(lowSequence, 2);
    t.equal(highSequence, 3);
    t.equal(writtenFrames.length, 3);

    t.same(
        writtenFrames[1],
        encodeFrame(
            lowSequence,
            COMMANDS.PWM_WRITE,
            [3, 0]
        )
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            highSequence,
            COMMANDS.PWM_WRITE,
            [11, 255]
        )
    );
});

tap.test('Arduino UNO rejects invalid PWM_WRITE requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.pwmWrite(3, 128),
        null,
        'does not write PWM before the Stage handshake'
    );

    peripheral._stageConnected = true;

    const invalidPins = [
        0,
        1,
        2,
        4,
        7,
        8,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20
    ];

    for (const pin of invalidPins) {
        t.equal(
            peripheral.pwmWrite(pin, 128),
            null,
            `rejects non-PWM pin ${pin}`
        );
    }

    t.equal(peripheral.pwmWrite(3, -1), null);
    t.equal(peripheral.pwmWrite(3, 256), null);
    t.equal(peripheral.pwmWrite(3, 128.5), null);
    t.equal(peripheral.pwmWrite(3.5, 128), null);

    t.end();
});

tap.test('Arduino UNO sends TONE_START and TONE_STOP after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const startSequence = peripheral.toneStart(6, 440);
    const stopSequence = peripheral.toneStop(6);

    await flushPromises();

    t.equal(startSequence, 2);
    t.equal(stopSequence, 3);
    t.equal(writtenFrames.length, 3);

    t.same(
        writtenFrames[1],
        encodeFrame(
            startSequence,
            COMMANDS.TONE_START,
            [6, 0xB8, 0x01]
        )
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            stopSequence,
            COMMANDS.TONE_STOP,
            [6]
        )
    );
});

tap.test('Arduino UNO rejects invalid TONE_START and TONE_STOP requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.toneStart(6, 440),
        null,
        'does not start tone before the Stage handshake'
    );

    t.equal(
        peripheral.toneStop(6),
        null,
        'does not stop tone before the Stage handshake'
    );

    peripheral._stageConnected = true;

    const invalidPins = [
        0,
        1,
        2,
        4,
        7,
        8,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20
    ];

    for (const pin of invalidPins) {
        t.equal(
            peripheral.toneStart(pin, 440),
            null,
            `rejects non-PWM tone start pin ${pin}`
        );

        t.equal(
            peripheral.toneStop(pin),
            null,
            `rejects non-PWM tone stop pin ${pin}`
        );
    }

    t.equal(peripheral.toneStart(6, 0), null);
    t.equal(peripheral.toneStart(6, 65536), null);
    t.equal(peripheral.toneStart(6, 440.5), null);
    t.equal(peripheral.toneStart(6.5, 440), null);
    t.equal(peripheral.toneStop(6.5), null);

    t.end();
});

tap.test('Arduino UNO sends SERVO_WRITE after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const lowSequence = peripheral.servoWrite(3, 0);
    const highSequence = peripheral.servoWrite(11, 180);

    await flushPromises();

    t.equal(lowSequence, 2);
    t.equal(highSequence, 3);
    t.equal(writtenFrames.length, 3);

    t.same(
        writtenFrames[1],
        encodeFrame(
            lowSequence,
            COMMANDS.SERVO_WRITE,
            [3, 0]
        )
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            highSequence,
            COMMANDS.SERVO_WRITE,
            [11, 180]
        )
    );
});

tap.test('Arduino UNO rejects invalid SERVO_WRITE requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.servoWrite(5, 90),
        null,
        'does not move servo before the Stage handshake'
    );

    peripheral._stageConnected = true;

    const invalidPins = [
        0,
        1,
        2,
        4,
        7,
        8,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20
    ];

    for (const pin of invalidPins) {
        t.equal(
            peripheral.servoWrite(pin, 90),
            null,
            `rejects non-PWM servo pin ${pin}`
        );
    }

    t.equal(peripheral.servoWrite(5, -1), null);
    t.equal(peripheral.servoWrite(5, 181), null);
    t.equal(peripheral.servoWrite(5, 90.5), null);
    t.equal(peripheral.servoWrite(5.5, 90), null);

    t.end();
});

tap.test('Arduino UNO sends MOTOR_WRITE and MOTOR_STOP after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const forwardSequence = peripheral.motorWrite(
        7,
        8,
        5,
        0,
        0
    );

    const reverseSequence = peripheral.motorWrite(
        7,
        8,
        5,
        1,
        255
    );

    const stopSequence = peripheral.motorStop(
        7,
        8,
        5,
        1
    );

    await flushPromises();

    t.equal(forwardSequence, 2);
    t.equal(reverseSequence, 3);
    t.equal(stopSequence, 4);
    t.equal(writtenFrames.length, 4);

    t.same(
        writtenFrames[1],
        encodeFrame(
            forwardSequence,
            COMMANDS.MOTOR_WRITE,
            [7, 8, 5, 0, 0]
        )
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            reverseSequence,
            COMMANDS.MOTOR_WRITE,
            [7, 8, 5, 1, 255]
        )
    );

    t.same(
        writtenFrames[3],
        encodeFrame(
            stopSequence,
            COMMANDS.MOTOR_STOP,
            [7, 8, 5, 1]
        )
    );
});

tap.test('Arduino UNO rejects invalid motor requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.motorWrite(7, 8, 5, 0, 128),
        null,
        'does not drive motor before the Stage handshake'
    );

    t.equal(
        peripheral.motorStop(7, 8, 5, 0),
        null,
        'does not stop motor before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.motorWrite(1, 8, 5, 0, 128), null);
    t.equal(peripheral.motorWrite(20, 8, 5, 0, 128), null);
    t.equal(peripheral.motorWrite(7.5, 8, 5, 0, 128), null);

    t.equal(peripheral.motorWrite(7, 1, 5, 0, 128), null);
    t.equal(peripheral.motorWrite(7, 20, 5, 0, 128), null);
    t.equal(peripheral.motorWrite(7, 8.5, 5, 0, 128), null);

    t.equal(peripheral.motorWrite(7, 8, 4, 0, 128), null);
    t.equal(peripheral.motorWrite(7, 8, 5.5, 0, 128), null);

    t.equal(peripheral.motorWrite(7, 7, 5, 0, 128), null);
    t.equal(peripheral.motorWrite(5, 8, 5, 0, 128), null);
    t.equal(peripheral.motorWrite(7, 5, 5, 0, 128), null);

    t.equal(peripheral.motorWrite(7, 8, 5, -1, 128), null);
    t.equal(peripheral.motorWrite(7, 8, 5, 2, 128), null);
    t.equal(peripheral.motorWrite(7, 8, 5, 0.5, 128), null);

    t.equal(peripheral.motorWrite(7, 8, 5, 0, -1), null);
    t.equal(peripheral.motorWrite(7, 8, 5, 0, 256), null);
    t.equal(peripheral.motorWrite(7, 8, 5, 0, 128.5), null);

    t.equal(peripheral.motorStop(1, 8, 5, 0), null);
    t.equal(peripheral.motorStop(7, 20, 5, 0), null);
    t.equal(peripheral.motorStop(7, 8, 4, 0), null);

    t.equal(peripheral.motorStop(7, 7, 5, 0), null);
    t.equal(peripheral.motorStop(5, 8, 5, 0), null);
    t.equal(peripheral.motorStop(7, 5, 5, 0), null);

    t.equal(peripheral.motorStop(7, 8, 5, -1), null);
    t.equal(peripheral.motorStop(7, 8, 5, 2), null);
    t.equal(peripheral.motorStop(7, 8, 5, 0.5), null);

    t.end();
});

tap.test('Arduino UNO sends RELAY_WRITE after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const offSequence = peripheral.relayWrite(
        12,
        0
    );

    const onSequence = peripheral.relayWrite(
        12,
        1
    );

    await flushPromises();

    t.equal(offSequence, 2);
    t.equal(onSequence, 3);
    t.equal(writtenFrames.length, 3);

    t.same(
        writtenFrames[1],
        encodeFrame(
            offSequence,
            COMMANDS.RELAY_WRITE,
            [12, 0]
        )
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            onSequence,
            COMMANDS.RELAY_WRITE,
            [12, 1]
        )
    );
});

tap.test('Arduino UNO rejects invalid RELAY_WRITE requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.relayWrite(12, 1),
        null,
        'does not write relay before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.relayWrite(1, 1), null);
    t.equal(peripheral.relayWrite(20, 1), null);
    t.equal(peripheral.relayWrite(12.5, 1), null);

    t.equal(peripheral.relayWrite(12, -1), null);
    t.equal(peripheral.relayWrite(12, 2), null);
    t.equal(peripheral.relayWrite(12, 0.5), null);

    t.end();
});

tap.test('Arduino UNO reads a digital pin after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const readPromise = peripheral.digitalRead(2);

    t.ok(readPromise instanceof Promise);

    await flushPromises();

    t.equal(writtenFrames.length, 2);

    const readFrame = writtenFrames[1];

    t.equal(
        readFrame[4],
        COMMANDS.DIGITAL_READ
    );

    t.equal(readFrame[5], 1);
    t.equal(readFrame[6], 2);

    const readSequence = readFrame[3];

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.DIGITAL_READ,
            [2, 1]
        )
    );

    t.equal(
        await readPromise,
        1
    );
});

tap.test('Arduino UNO rejects invalid DIGITAL_READ requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.digitalRead(13),
        null,
        'does not read before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.digitalRead(0), null);
    t.equal(peripheral.digitalRead(1), null);
    t.equal(peripheral.digitalRead(20), null);
    t.equal(peripheral.digitalRead(13.5), null);

    t.end();
});

tap.test('Arduino UNO reads an analog pin after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const readPromise = peripheral.analogRead(14);

    t.ok(readPromise instanceof Promise);

    await flushPromises();

    t.equal(writtenFrames.length, 2);

    const readFrame = writtenFrames[1];

    t.equal(
        readFrame[4],
        COMMANDS.ANALOG_READ
    );

    t.equal(readFrame[5], 1);
    t.equal(readFrame[6], 14);
    t.equal(readFrame[3], 2);

    const readSequence = readFrame[3];

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.ANALOG_READ,
            [14, 0x03, 0xFF]
        )
    );

    t.equal(
        await readPromise,
        1023
    );
});

tap.test('Arduino UNO rejects invalid ANALOG_READ requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.analogRead(14),
        null,
        'does not read before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.analogRead(13), null);
    t.equal(peripheral.analogRead(20), null);
    t.equal(peripheral.analogRead(14.5), null);

    t.end();
});

tap.test('Arduino UNO reads an ultrasonic distance after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const readPromise = peripheral.ultrasonicRead(
        16,
        17
    );

    t.ok(readPromise instanceof Promise);

    await flushPromises();

    t.equal(writtenFrames.length, 2);

    const readFrame = writtenFrames[1];

    t.equal(
        readFrame[4],
        COMMANDS.ULTRASONIC_READ
    );

    t.equal(readFrame[5], 2);
    t.equal(readFrame[6], 16);
    t.equal(readFrame[7], 17);

    const readSequence = readFrame[3];

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.ULTRASONIC_READ,
            [16, 17, 0x01, 0xF4]
        )
    );

    t.equal(
        await readPromise,
        500
    );
});

tap.test('Arduino UNO rejects invalid ULTRASONIC_READ requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.ultrasonicRead(16, 17),
        null,
        'does not read before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.ultrasonicRead(16, 16), null);

    t.equal(peripheral.ultrasonicRead(1, 17), null);
    t.equal(peripheral.ultrasonicRead(16, 1), null);

    t.equal(peripheral.ultrasonicRead(20, 17), null);
    t.equal(peripheral.ultrasonicRead(16, 20), null);

    t.equal(peripheral.ultrasonicRead(16.5, 17), null);
    t.equal(peripheral.ultrasonicRead(16, 17.5), null);

    t.end();
});

tap.test('Arduino UNO resolves ultrasonic read with null on ERROR', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const readPromise = peripheral.ultrasonicRead(
        16,
        17
    );

    await flushPromises();

    const readSequence = writtenFrames[1][3];

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.ERROR
        )
    );

    t.equal(
        await readPromise,
        null
    );

    t.equal(
        peripheral._pendingUltrasonicReads.size,
        0
    );
});

tap.test('Arduino UNO resolves pending ultrasonic read with null on reset', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const readPromise = peripheral.ultrasonicRead(
        16,
        17
    );

    t.equal(
        peripheral._pendingUltrasonicReads.size,
        1
    );

    peripheral._reset();

    t.equal(
        await readPromise,
        null
    );

    t.equal(
        peripheral._pendingUltrasonicReads.size,
        0
    );

    t.equal(
        peripheral.isStageConnected(),
        false
    );
});

tap.test('Arduino UNO reads DHT values in Stage mode', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(
        peripheral.isStageConnected(),
        true
    );

    const readPromise = peripheral.dhtRead(
        12,
        1
    );

    t.ok(readPromise instanceof Promise);

    await flushPromises();

    t.equal(writtenFrames.length, 2);

    const readFrame = writtenFrames[1];

    t.equal(
        readFrame[4],
        COMMANDS.DHT_READ
    );

    t.equal(readFrame[5], 2);
    t.equal(readFrame[6], 12);
    t.equal(readFrame[7], 1);

    const readSequence = readFrame[3];

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.DHT_READ,
            [
                12,
                0x09,
                0x60,
                0x14,
                0xB4
            ]
        )
    );

    const result = await readPromise;

    t.equal(
        result.temperature,
        2400
    );

    t.equal(
        result.humidity,
        5300
    );

    t.equal(
        peripheral._pendingDhtReads.size,
        0
    );
});

tap.test('Arduino UNO rejects invalid DHT_READ requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.dhtRead(12, 0),
        null,
        'does not read before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.dhtRead(1, 0), null);
    t.equal(peripheral.dhtRead(14, 0), null);
    t.equal(peripheral.dhtRead(12.5, 0), null);

    t.equal(peripheral.dhtRead(12, -1), null);
    t.equal(peripheral.dhtRead(12, 2), null);
    t.equal(peripheral.dhtRead(12, 0.5), null);

    t.end();
});

tap.test('Arduino UNO resolves DHT read with null on ERROR', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const readPromise = peripheral.dhtRead(
        12,
        0
    );

    await flushPromises();

    const readSequence = writtenFrames[1][3];

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.ERROR
        )
    );

    t.equal(
        await readPromise,
        null
    );

    t.equal(
        peripheral._pendingDhtReads.size,
        0
    );
});

tap.test('Arduino UNO resolves pending DHT read with null on reset', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const readPromise = peripheral.dhtRead(
        12,
        0
    );

    t.equal(
        peripheral._pendingDhtReads.size,
        1
    );

    peripheral._reset();

    t.equal(
        await readPromise,
        null
    );

    t.equal(
        peripheral._pendingDhtReads.size,
        0
    );

    t.equal(
        peripheral.isStageConnected(),
        false
    );
});

tap.test('Arduino UNO exposes the PWM_WRITE block and delegates numeric values', t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    const info = extension.getInfo();
    const pwmWriteBlock = info.blocks.find(
        block => block.opcode === 'pwmWrite'
    );

    t.ok(pwmWriteBlock);

    t.equal(
        pwmWriteBlock.blockType,
        BlockType.COMMAND
    );

    t.equal(
        pwmWriteBlock.text,
        'definir PWM no pino [PIN] como [VALUE]'
    );

    t.equal(
        pwmWriteBlock.arguments.PIN.defaultValue,
        3
    );

    t.equal(
        pwmWriteBlock.arguments.PIN.menu,
        'pwmPins'
    );

    t.equal(
        pwmWriteBlock.arguments.VALUE.defaultValue,
        255
    );

    t.equal(
        pwmWriteBlock.arguments.VALUE.type,
        ArgumentType.PWM_VALUE
    );

    t.same(
        info.menus.pwmPins.items,
        [
            {text: 'D3', value: '3'},
            {text: 'D5', value: '5'},
            {text: 'D6', value: '6'},
            {text: 'D9', value: '9'},
            {text: 'D10', value: '10'},
            {text: 'D11', value: '11'}
        ]
    );

    let receivedPin = null;
    let receivedValue = null;

    extension._peripheral.pwmWrite = (pin, value) => {
        receivedPin = pin;
        receivedValue = value;

        return 42;
    };

    const result = extension.pwmWrite({
        PIN: '5',
        VALUE: '128'
    });

    t.equal(receivedPin, 5);
    t.equal(receivedValue, 128);
    t.equal(result, 42);

    const highResult = extension.pwmWrite({
        PIN: '5',
        VALUE: '600'
    });

    t.equal(receivedPin, 5);
    t.equal(
        receivedValue,
        255,
        'clamps PWM values above 255 to 255'
    );
    t.equal(highResult, 42);

    const lowResult = extension.pwmWrite({
        PIN: '5',
        VALUE: '-20'
    });

    t.equal(receivedPin, 5);
    t.equal(
        receivedValue,
        0,
        'clamps PWM values below 0 to 0'
    );
    t.equal(lowResult, 42);

    t.end();
});

tap.test('Arduino UNO exposes TONE_START and TONE_STOP blocks and delegates numeric values', t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    const info = extension.getInfo();

    const toneStartBlock = info.blocks.find(
        block => block.opcode === 'toneStart'
    );

    const toneStopBlock = info.blocks.find(
        block => block.opcode === 'toneStop'
    );

    t.ok(toneStartBlock);
    t.ok(toneStopBlock);

    t.equal(
        toneStartBlock.blockType,
        BlockType.COMMAND
    );

    t.equal(
        toneStartBlock.text,
        'tocar tom no pino [PIN] com frequência [FREQUENCY] Hz'
    );

    t.equal(
        toneStartBlock.arguments.PIN.defaultValue,
        6
    );

    t.equal(
        toneStartBlock.arguments.PIN.menu,
        'pwmPins'
    );

    t.equal(
        toneStartBlock.arguments.FREQUENCY.defaultValue,
        440
    );

    t.equal(
        toneStopBlock.blockType,
        BlockType.COMMAND
    );

    t.equal(
        toneStopBlock.text,
        'parar tom no pino [PIN]'
    );

    t.equal(
        toneStopBlock.arguments.PIN.defaultValue,
        6
    );

    t.equal(
        toneStopBlock.arguments.PIN.menu,
        'pwmPins'
    );

    let receivedStartPin = null;
    let receivedFrequency = null;
    let receivedStopPin = null;

    extension._peripheral.toneStart = (pin, frequency) => {
        receivedStartPin = pin;
        receivedFrequency = frequency;

        return 43;
    };

    extension._peripheral.toneStop = pin => {
        receivedStopPin = pin;

        return 44;
    };

    const startResult = extension.toneStart({
        PIN: '6',
        FREQUENCY: '440'
    });

    t.equal(receivedStartPin, 6);
    t.equal(receivedFrequency, 440);
    t.equal(startResult, 43);

    const highResult = extension.toneStart({
        PIN: '6',
        FREQUENCY: '70000'
    });

    t.equal(receivedStartPin, 6);
    t.equal(
        receivedFrequency,
        65535,
        'clamps tone frequencies above 65535 to 65535'
    );
    t.equal(highResult, 43);

    const lowResult = extension.toneStart({
        PIN: '6',
        FREQUENCY: '0'
    });

    t.equal(receivedStartPin, 6);
    t.equal(
        receivedFrequency,
        1,
        'clamps tone frequencies below 1 to 1'
    );
    t.equal(lowResult, 43);

    const stopResult = extension.toneStop({
        PIN: '6'
    });

    t.equal(receivedStopPin, 6);
    t.equal(stopResult, 44);

    t.end();
});

tap.test('Arduino UNO exposes the DIGITAL_WRITE block and delegates numeric values', t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    const info = extension.getInfo();
    const digitalWriteBlock = info.blocks.find(
        block => block.opcode === 'digitalWrite'
    );

    t.ok(digitalWriteBlock);
    t.equal(digitalWriteBlock.text, 'definir pino [PIN] como [VALUE]');
    t.equal(digitalWriteBlock.arguments.PIN.defaultValue, 13);
    t.equal(digitalWriteBlock.arguments.VALUE.defaultValue, 1);

    t.same(
        info.menus.digitalPins.items[0],
        {text: 'D2', value: '2'}
    );

    t.same(
        info.menus.digitalPins.items[11],
        {text: 'D13', value: '13'}
    );

    t.same(
        info.menus.digitalPins.items[12],
        {text: 'A0', value: '14'}
    );

    t.same(
        info.menus.digitalPins.items[17],
        {text: 'A5', value: '19'}
    );

    t.same(
        info.menus.digitalValues.items,
        [
            {text: 'ALTO', value: '1'},
            {text: 'BAIXO', value: '0'}
        ]
    );

    let receivedPin = null;
    let receivedValue = null;

    extension._peripheral.digitalWrite = (pin, value) => {
        receivedPin = pin;
        receivedValue = value;

        return 42;
    };

    const result = extension.digitalWrite({
        PIN: '13',
        VALUE: '1'
    });

    t.equal(receivedPin, 13);
    t.equal(receivedValue, 1);
    t.equal(result, 42);

    t.end();
});

tap.test('Arduino UNO exposes the DIGITAL_READ boolean block and delegates numeric pin', async t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    const info = extension.getInfo();
    const digitalReadBlock = info.blocks.find(
        block => block.opcode === 'digitalRead'
    );

    t.ok(digitalReadBlock);

    t.equal(
        digitalReadBlock.blockType,
        BlockType.BOOLEAN
    );

    t.equal(
        digitalReadBlock.text,
        'ler pino digital [PIN]'
    );

    t.equal(
        digitalReadBlock.arguments.PIN.defaultValue,
        2
    );

    t.equal(
        digitalReadBlock.arguments.PIN.menu,
        'digitalPins'
    );

    let receivedPin = null;

    extension._peripheral.digitalRead = pin => {
        receivedPin = pin;

        return Promise.resolve(1);
    };

    const highResult = await extension.digitalRead({
        PIN: '2'
    });

    t.equal(receivedPin, 2);
    t.equal(highResult, true);

    extension._peripheral.digitalRead = () =>
        Promise.resolve(0);

    const lowResult = await extension.digitalRead({
        PIN: '2'
    });

    t.equal(lowResult, false);

    t.end();
});

tap.test('Arduino UNO exposes the ANALOG_READ reporter block and delegates numeric pin', async t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    const info = extension.getInfo();
    const analogReadBlock = info.blocks.find(
        block => block.opcode === 'analogRead'
    );

    t.ok(analogReadBlock);

    t.equal(
        analogReadBlock.blockType,
        BlockType.REPORTER
    );

    t.equal(
        analogReadBlock.text,
        'ler pino analógico [PIN]'
    );

    t.equal(
        analogReadBlock.arguments.PIN.defaultValue,
        14
    );

    t.equal(
        analogReadBlock.arguments.PIN.menu,
        'analogPins'
    );

    t.same(
        info.menus.analogPins.items,
        [
            {text: 'A0', value: '14'},
            {text: 'A1', value: '15'},
            {text: 'A2', value: '16'},
            {text: 'A3', value: '17'},
            {text: 'A4', value: '18'},
            {text: 'A5', value: '19'}
        ]
    );

    let receivedPin = null;

    extension._peripheral.analogRead = pin => {
        receivedPin = pin;

        return Promise.resolve(512);
    };

    const result = await extension.analogRead({
        PIN: '16'
    });

    t.equal(receivedPin, 16);
    t.equal(result, 512);

    t.end();
});

tap.test('Arduino UNO sends LCD commands after the Stage handshake', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    t.equal(peripheral.isStageConnected(), true);

    const initSequence = peripheral.lcdInit();

    const writeSequence = peripheral.lcdWrite(
        'EasyBlox',
        0,
        0
    );

    const clearSequence = peripheral.lcdClear();

    const modeSequence = peripheral.lcdMode(
        LCD_MODES.BLINK_ON
    );

    await flushPromises();

    t.equal(initSequence, 2);
    t.equal(writeSequence, 3);
    t.equal(clearSequence, 4);
    t.equal(modeSequence, 5);

    t.equal(writtenFrames.length, 5);

    t.same(
        writtenFrames[1],
        encodeFrame(
            initSequence,
            COMMANDS.LCD_INIT
        )
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            writeSequence,
            COMMANDS.LCD_WRITE,
            [
                0,
                0,
                0x45,
                0x61,
                0x73,
                0x79,
                0x42,
                0x6C,
                0x6F,
                0x78
            ]
        )
    );

    t.same(
        writtenFrames[3],
        encodeFrame(
            clearSequence,
            COMMANDS.LCD_CLEAR
        )
    );

    t.same(
        writtenFrames[4],
        encodeFrame(
            modeSequence,
            COMMANDS.LCD_MODE,
            [LCD_MODES.BLINK_ON]
        )
    );
});

tap.test('Arduino UNO normalizes and clips LCD text', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const normalizedSequence = peripheral.lcdWrite(
        'Olá, João!',
        0,
        0
    );

    const clippedSequence = peripheral.lcdWrite(
        'ABCDE',
        1,
        13
    );

    await flushPromises();

    t.same(
        writtenFrames[1],
        encodeFrame(
            normalizedSequence,
            COMMANDS.LCD_WRITE,
            [
                0,
                0,
                0x4F,
                0x6C,
                0x61,
                0x2C,
                0x20,
                0x4A,
                0x6F,
                0x61,
                0x6F,
                0x21
            ]
        )
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            clippedSequence,
            COMMANDS.LCD_WRITE,
            [
                1,
                13,
                0x41,
                0x42,
                0x43
            ]
        )
    );
});

tap.test('Arduino UNO sends all supported LCD modes', async t => {
    let onData = null;
    const writtenFrames = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    const pingFrame = writtenFrames[0];
    const pingSequence = pingFrame[3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const modes = [
        LCD_MODES.BLINK_ON,
        LCD_MODES.BLINK_OFF,
        LCD_MODES.CURSOR_ON,
        LCD_MODES.CURSOR_OFF,
        LCD_MODES.DISPLAY_ON,
        LCD_MODES.DISPLAY_OFF,
        LCD_MODES.AUTOSCROLL_ON,
        LCD_MODES.AUTOSCROLL_OFF,
        LCD_MODES.SCROLL_LEFT,
        LCD_MODES.SCROLL_RIGHT
    ];

    const sequences = modes.map(mode =>
        peripheral.lcdMode(mode)
    );

    await flushPromises();

    sequences.forEach((sequence, index) => {
        t.equal(
            sequence,
            index + 2
        );

        t.same(
            writtenFrames[index + 1],
            encodeFrame(
                sequence,
                COMMANDS.LCD_MODE,
                [modes[index]]
            )
        );
    });

    t.equal(
        writtenFrames.length,
        modes.length + 1
    );
}),

tap.test('Arduino UNO rejects invalid LCD requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.lcdInit(),
        null,
        'does not initialize LCD before the Stage handshake'
    );

    t.equal(
        peripheral.lcdWrite('EasyBlox', 0, 0),
        null,
        'does not write LCD before the Stage handshake'
    );

    t.equal(
        peripheral.lcdClear(),
        null,
        'does not clear LCD before the Stage handshake'
    );

    t.equal(
        peripheral.lcdMode(LCD_MODES.BLINK_ON),
        null,
        'does not set LCD mode before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.lcdWrite('A', -1, 0), null);
    t.equal(peripheral.lcdWrite('A', 2, 0), null);
    t.equal(peripheral.lcdWrite('A', 0.5, 0), null);

    t.equal(peripheral.lcdWrite('A', 0, -1), null);
    t.equal(peripheral.lcdWrite('A', 0, 16), null);
    t.equal(peripheral.lcdWrite('A', 0, 1.5), null);

    t.equal(peripheral.lcdMode(-1), null);
    t.equal(peripheral.lcdMode(10), null);
    t.equal(peripheral.lcdMode(0.5), null);

    t.end();
});
