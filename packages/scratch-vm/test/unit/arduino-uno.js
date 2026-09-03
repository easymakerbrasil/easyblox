const fs = require('fs');
const path = require('path');
const tap = require('tap');

const BlockType = require('../../src/extension-support/block-type');
const BlockExecutionMode = require('../../src/extension-support/block-execution-mode');
const BlockInactiveModeBehavior = require('../../src/extension-support/block-inactive-mode-behavior');
const ArgumentType = require('../../src/extension-support/argument-type');
const ArduinoUnoPeripheral = require('../../src/extensions/scratch3_arduino_uno/peripheral');
const Scratch3ArduinoUnoBlocks = require('../../src/extensions/scratch3_arduino_uno');
const {
    COMMANDS,
    LCD_MODES,
    RESPONSES,
    STAGE_FIRMWARE_COMPATIBILITY_VERSION,
    encodeFrame: encodeProtocolFrame
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
MockRuntime.PERIPHERAL_STAGE_READY = 'PERIPHERAL_STAGE_READY';
MockRuntime.PERIPHERAL_STAGE_HANDSHAKE_FAILED =
    'PERIPHERAL_STAGE_HANDSHAKE_FAILED';

const encodeFrame = (sequence, command, payload) =>
    encodeProtocolFrame(
        sequence,
        command,
        command === RESPONSES.PONG &&
        typeof payload === 'undefined' ?
            [STAGE_FIRMWARE_COMPATIBILITY_VERSION] :
            payload
    );

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

    const disconnected =
        await peripheral.disconnect();

    t.equal(
        disconnected,
        true
    );

    t.equal(peripheral.isConnected(), false);
    t.equal(closeCalled, true);

    t.equal(
        runtime.events[runtime.events.length - 1].event,
        MockRuntime.PERIPHERAL_DISCONNECTED
    );
});

tap.test('Arduino UNO exposes USB connection metadata for upload handoff', async t => {
    const connection = {
        peripheralId:
            'web-serial-1',
        name:
            'USB Serial (1A86:7523)',
        usbVendorId:
            0x1A86,
        usbProductId:
            0x7523
    };

    const transport = {
        listPorts:
            async () => [
                connection
            ],
        open:
            async () => {},
        close:
            async () => {}
    };

    const runtime =
        new MockRuntime(transport);

    const peripheral =
        new ArduinoUnoPeripheral(
            runtime
        );

    peripheral.scan();

    await flushPromises();

    peripheral.connect(
        connection.peripheralId
    );

    await flushPromises();

    t.same(
        peripheral.getConnectionInfo(),
        connection
    );

    await peripheral.disconnect();

    t.equal(
        peripheral.getConnectionInfo(),
        null
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
    const stageReadyEvent =
        runtime.events.find(
            event =>
                event.event ===
                MockRuntime.PERIPHERAL_STAGE_READY
        );

    t.ok(stageReadyEvent);

    t.same(
        stageReadyEvent.data,
        {
            extensionId: 'arduinoUno',
            firmwareCompatibilityVersion:
                STAGE_FIRMWARE_COMPATIBILITY_VERSION
        }
    );
});

tap.test('Arduino UNO rejects legacy and incompatible Stage firmware PONGs', t => {
    const cases = [
        {
            name: 'legacy',
            payload: [],
            reason: 'legacy',
            firmwareCompatibilityVersion: null
        },
        {
            name: 'incompatible',
            payload: [
                STAGE_FIRMWARE_COMPATIBILITY_VERSION + 1
            ],
            reason: 'incompatible',
            firmwareCompatibilityVersion:
                STAGE_FIRMWARE_COMPATIBILITY_VERSION + 1
        }
    ];

    for (const testCase of cases) {
        const runtime = new MockRuntime(null);
        const peripheral =
            new ArduinoUnoPeripheral(runtime);

        peripheral._pingSequence = 23;

        peripheral._handleFrame({
            command: RESPONSES.PONG,
            sequence: 23,
            payload: Uint8Array.from(
                testCase.payload
            )
        });

        t.equal(
            peripheral.isStageConnected(),
            false,
            `${testCase.name} firmware does not become Stage-ready`
        );

        t.equal(
            runtime.events.some(
                event =>
                    event.event ===
                    MockRuntime.PERIPHERAL_STAGE_READY
            ),
            false,
            `${testCase.name} firmware does not emit Stage ready`
        );

        const failureEvent =
            runtime.events.find(
                event =>
                    event.event ===
                    MockRuntime
                        .PERIPHERAL_STAGE_HANDSHAKE_FAILED
            );

        t.same(
            failureEvent && failureEvent.data,
            {
                extensionId: 'arduinoUno',
                reason: testCase.reason,
                firmwareCompatibilityVersion:
                    testCase.firmwareCompatibilityVersion,
                expectedFirmwareCompatibilityVersion:
                    STAGE_FIRMWARE_COMPATIBILITY_VERSION
            },
            `${testCase.name} firmware is classified explicitly`
        );
    }

    t.end();
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

tap.test('Arduino UNO reports when the Stage handshake is exhausted without PONG', async t => {
    const writtenFrames = [];

    const transport = {
        open: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime =
        new MockRuntime(transport);

    const peripheral =
        new ArduinoUnoPeripheral(runtime);

    peripheral.connect('COM3');

    await new Promise(
        resolve =>
            setTimeout(resolve, 3600)
    );

    t.equal(
        peripheral.isConnected(),
        true
    );

    t.equal(
        peripheral.isStageConnected(),
        false
    );

    t.equal(
        writtenFrames.length,
        6
    );

    for (const frame of writtenFrames) {
        t.equal(
            frame[4],
            COMMANDS.PING
        );
    }

    const handshakeFailedEvents =
        runtime.events.filter(
            event =>
                event.event ===
                MockRuntime
                    .PERIPHERAL_STAGE_HANDSHAKE_FAILED
        );

    t.equal(
        handshakeFailedEvents.length,
        1
    );

    t.same(
        handshakeFailedEvents[0].data,
        {
            extensionId: 'arduinoUno',
            reason: 'unidentified',
            firmwareCompatibilityVersion: null,
            expectedFirmwareCompatibilityVersion:
                STAGE_FIRMWARE_COMPATIBILITY_VERSION
        }
    );

    t.equal(
        runtime.events.some(
            event =>
                event.event ===
                MockRuntime.PERIPHERAL_STAGE_READY
        ),
        false
    );

    await peripheral.disconnect();
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

tap.test('Arduino UNO sends musical TONE_START and TONE_STOP after the Stage handshake', async t => {
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

    const startSequence =
        peripheral.toneStart(
            7,
            440,
            500
        );

    const stopSequence =
        peripheral.toneStop(7);

    await flushPromises();

    t.equal(startSequence, 2);
    t.equal(stopSequence, 3);
    t.equal(writtenFrames.length, 3);

    t.same(
        writtenFrames[1],
        encodeFrame(
            startSequence,
            COMMANDS.TONE_START,
            [
                7,
                0xB8,
                0x01,
                0xF4,
                0x01
            ]
        ),
        'TONE_START sends pin, frequency and duration'
    );

    t.same(
        writtenFrames[2],
        encodeFrame(
            stopSequence,
            COMMANDS.TONE_STOP,
            [7]
        )
    );
});

tap.test('Arduino UNO validates musical Tone Stage requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.toneStart(
            7,
            440,
            500
        ),
        null,
        'does not start Tone before the Stage handshake'
    );

    t.equal(
        peripheral.toneStop(7),
        null,
        'does not stop Tone before the Stage handshake'
    );

    peripheral._stageConnected = true;

    peripheral._sendCommand = () => 99;

    const validDigitalPins = [
        2,
        7,
        13,
        14,
        19
    ];

    for (const pin of validDigitalPins) {
        t.equal(
            peripheral.toneStart(
                pin,
                440,
                500
            ),
            99,
            `accepts digital Tone start pin ${pin}`
        );

        t.equal(
            peripheral.toneStop(pin),
            99,
            `accepts digital Tone stop pin ${pin}`
        );
    }

    const invalidPins = [
        0,
        1,
        20,
        6.5
    ];

    for (const pin of invalidPins) {
        t.equal(
            peripheral.toneStart(
                pin,
                440,
                500
            ),
            null,
            `rejects invalid Tone start pin ${pin}`
        );

        t.equal(
            peripheral.toneStop(pin),
            null,
            `rejects invalid Tone stop pin ${pin}`
        );
    }

    t.equal(
        peripheral.toneStart(
            7,
            0,
            500
        ),
        null,
        'rejects zero Tone frequency'
    );

    t.equal(
        peripheral.toneStart(
            7,
            65536,
            500
        ),
        null,
        'rejects Tone frequency above uint16 range'
    );

    t.equal(
        peripheral.toneStart(
            7,
            440.5,
            500
        ),
        null,
        'rejects fractional Tone frequency'
    );

    t.equal(
        peripheral.toneStart(
            7,
            440,
            0
        ),
        null,
        'rejects zero Tone duration'
    );

    t.equal(
        peripheral.toneStart(
            7,
            440,
            65536
        ),
        null,
        'rejects Tone duration above uint16 range'
    );

    t.equal(
        peripheral.toneStart(
            7,
            440,
            500.5
        ),
        null,
        'rejects fractional Tone duration'
    );

    t.end();
});

tap.test('Arduino UNO Stage firmware protects Timer2 PWM while Tone is active', t => {
    const firmwarePath = path.join(
        __dirname,
        '../../firmware/arduino-uno/stage/stage.ino'
    );

    const firmware = fs.readFileSync(
        firmwarePath,
        'utf8'
    );

    const readHandler = (startMarker, endMarker) => {
        const start = firmware.indexOf(startMarker);
        const end = firmware.indexOf(
            endMarker,
            start
        );

        t.ok(
            start >= 0,
            `finds ${startMarker}`
        );

        t.ok(
            end > start,
            `finds end of ${startMarker}`
        );

        return firmware.slice(
            start,
            end
        );
    };

    const pwmWriteHandler = readHandler(
        'void handlePwmWrite()',
        'void handleToneStart()'
    );

    const motorWriteHandler = readHandler(
        'void handleMotorWrite()',
        'void handleMotorStop()'
    );

    const motorStopHandler = readHandler(
        'void handleMotorStop()',
        'bool lcdProbeAddress'
    );

    t.match(
        pwmWriteHandler,
        /activeTonePin != NO_TONE_PIN[\s\S]*\(pin == 3 \|\| pin == 11\)/,
        'rejects PWM D3/D11 while Tone is active'
    );

    t.match(
        motorWriteHandler,
        /activeTonePin != NO_TONE_PIN[\s\S]*\(pwmPin == 3 \|\| pwmPin == 11\)/,
        'rejects MotorWrite Timer2 PWM while Tone is active'
    );

    t.match(
        motorStopHandler,
        /activeTonePin != NO_TONE_PIN[\s\S]*\(pwmPin == 3 \|\| pwmPin == 11\)/,
        'rejects MotorStop Timer2 PWM while Tone is active'
    );

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

tap.test('Arduino UNO reads joystick axes and click after the Stage handshake', async t => {
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

    const readPromise = peripheral.joystickRead(
        18,
        19,
        13
    );

    t.ok(readPromise instanceof Promise);

    await flushPromises();

    t.equal(writtenFrames.length, 2);

    const readFrame = writtenFrames[1];

    t.equal(
        readFrame[4],
        COMMANDS.JOYSTICK_READ
    );

    t.equal(readFrame[5], 3);
    t.equal(readFrame[6], 18);
    t.equal(readFrame[7], 19);
    t.equal(readFrame[8], 13);
    t.equal(readFrame[3], 2);

    const readSequence = readFrame[3];

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.JOYSTICK_READ,
            [
                18,
                19,
                13,
                0x02,
                0x00,
                0x01,
                0xFF,
                1
            ]
        )
    );

    t.same(
        await readPromise,
        {
            x: 512,
            y: 511,
            clicked: true
        }
    );
});

tap.test('Arduino UNO rejects invalid JOYSTICK_READ requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.joystickRead(18, 19, 13),
        null,
        'does not read before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.joystickRead(13, 19, 13), null);
    t.equal(peripheral.joystickRead(20, 19, 13), null);
    t.equal(peripheral.joystickRead(18.5, 19, 13), null);

    t.equal(peripheral.joystickRead(18, 13, 13), null);
    t.equal(peripheral.joystickRead(18, 20, 13), null);
    t.equal(peripheral.joystickRead(18, 19.5, 13), null);

    t.equal(peripheral.joystickRead(18, 18, 13), null);

    t.equal(peripheral.joystickRead(18, 19, 1), null);
    t.equal(peripheral.joystickRead(18, 19, 14), null);
    t.equal(peripheral.joystickRead(18, 19, 13.5), null);

    t.end();
});

tap.test('Arduino UNO resolves JOYSTICK_READ errors as null', async t => {
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

    onData(
        encodeFrame(
            pingFrame[3],
            RESPONSES.PONG
        )
    );

    const readPromise = peripheral.joystickRead(
        18,
        19,
        13
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
        peripheral._pendingJoystickReads.size,
        0
    );
});

tap.test('Arduino UNO reads the Stage timer as unsigned 32-bit milliseconds', async t => {
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

    const readPromise = peripheral.timerRead();

    t.ok(
        readPromise instanceof Promise,
        'TIMER_READ returns a Promise'
    );

    await flushPromises();

    t.equal(
        writtenFrames.length,
        2,
        'TIMER_READ is sent after the handshake'
    );

    const readSequence = writtenFrames[1][3];

    t.same(
        writtenFrames[1],
        encodeFrame(
            readSequence,
            COMMANDS.TIMER_READ
        ),
        'TIMER_READ sends no payload'
    );

    t.equal(
        peripheral._pendingTimerReads.size,
        1,
        'TIMER_READ remains pending before its response'
    );

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.TIMER_READ,
            [
                0xFE,
                0xDC,
                0xBA,
                0x98
            ]
        )
    );

    t.equal(
        await readPromise,
        0xFEDCBA98,
        'TIMER_READ preserves the full unsigned 32-bit value'
    );

    t.equal(
        peripheral._pendingTimerReads.size,
        0,
        'TIMER_READ response clears the pending read'
    );
});

tap.test('Arduino UNO waits for ACK before completing TIMER_RESET', async t => {
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

    const resetPromise = peripheral.timerReset();

    t.ok(
        resetPromise instanceof Promise,
        'TIMER_RESET returns a Promise'
    );

    await flushPromises();

    t.equal(
        writtenFrames.length,
        2,
        'TIMER_RESET is sent after the handshake'
    );

    const resetSequence = writtenFrames[1][3];

    t.same(
        writtenFrames[1],
        encodeFrame(
            resetSequence,
            COMMANDS.TIMER_RESET
        ),
        'TIMER_RESET sends no payload'
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        1,
        'TIMER_RESET remains pending before ACK'
    );

    onData(
        encodeFrame(
            resetSequence,
            RESPONSES.ACK
        )
    );

    t.equal(
        await resetPromise,
        resetSequence,
        'TIMER_RESET completes after matching ACK'
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        0,
        'TIMER_RESET ACK clears the pending command'
    );
});

tap.test('Arduino UNO resolves TIMER_READ with null on firmware error', async t => {
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

    const readPromise = peripheral.timerRead();

    await flushPromises();

    const readSequence = writtenFrames[1][3];

    t.equal(
        peripheral._pendingTimerReads.size,
        1
    );

    onData(
        encodeFrame(
            readSequence,
            RESPONSES.ERROR
        )
    );

    t.equal(
        await readPromise,
        null,
        'firmware ERROR resolves TIMER_READ with null'
    );

    t.equal(
        peripheral._pendingTimerReads.size,
        0,
        'firmware ERROR clears the pending timer read'
    );
});

tap.test('Arduino UNO clears pending TIMER_READ when peripheral state resets', async t => {
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

    const readPromise = peripheral.timerRead();

    await flushPromises();

    t.equal(
        peripheral._pendingTimerReads.size,
        1
    );

    peripheral._reset();

    t.equal(
        await readPromise,
        null,
        'reset resolves pending TIMER_READ with null'
    );

    t.equal(
        peripheral._pendingTimerReads.size,
        0,
        'reset clears pending timer reads'
    );

    t.equal(
        peripheral.isStageConnected(),
        false
    );
});

tap.test('Arduino UNO timer operations require an active Stage connection', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.timerRead(),
        null
    );

    t.equal(
        peripheral.timerReset(),
        null
    );

    t.end();
});

tap.test('Arduino UNO exposes reordered blocks and timer blocks', t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);
    const info = extension.getInfo();

    t.equal(
        info.blocks.length,
        11,
        'Arduino UNO exposes nine blocks and two visual separators'
    );

    t.equal(info.blocks[0].opcode, 'whenArduinoUnoStart');
    t.equal(
        info.blocks[0].executionMode,
        BlockExecutionMode.UPLOAD_ONLY,
        'Arduino UNO start hat is Upload-only'
    );
    t.equal(info.blocks[1].opcode, 'digitalWrite');
    t.equal(info.blocks[2].opcode, 'digitalRead');
    t.equal(info.blocks[3].opcode, 'analogRead');
    t.equal(info.blocks[4].opcode, 'pwmWrite');

    t.equal(
        info.blocks[5],
        '---',
        'entry/I/O and tone groups are visually separated'
    );

    t.equal(info.blocks[6].opcode, 'toneStart');
    t.equal(info.blocks[7].opcode, 'toneStop');

    t.equal(
        info.blocks[8],
        '---',
        'tone and timer groups are visually separated'
    );

    const timerReadBlock = info.blocks[9];
    const timerResetBlock = info.blocks[10];

    t.equal(
        timerReadBlock.opcode,
        'timerRead'
    );

    t.equal(
        timerReadBlock.blockType,
        BlockType.REPORTER
    );

    t.equal(
        timerReadBlock.text,
        'obter temporizador'
    );

    t.equal(
        timerResetBlock.opcode,
        'timerReset'
    );

    t.equal(
        timerResetBlock.blockType,
        BlockType.COMMAND
    );

    t.equal(
        timerResetBlock.text,
        'zerar temporizador'
    );

    t.end();
});

tap.test('Arduino UNO timer reporter converts milliseconds to seconds', async t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    extension._peripheral = {
        timerRead: () => Promise.resolve(2020)
    };

    t.equal(
        await extension.timerRead(),
        2.02,
        '2020 milliseconds are reported as 2.02 seconds'
    );
});

tap.test('Arduino UNO timer blocks propagate unavailable state and delegate reset', async t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    extension._peripheral = {
        timerRead: () => null,
        timerReset: () => 37
    };

    t.equal(
        extension.timerRead(),
        null,
        'timer reporter preserves unavailable peripheral state'
    );

    t.equal(
        extension.timerReset(),
        37,
        'timer reset delegates to the peripheral'
    );

    extension._peripheral.timerRead =
        () => Promise.resolve(null);

    t.equal(
        await extension.timerRead(),
        null,
        'firmware error remains null instead of becoming zero seconds'
    );
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

    const decimalResult = extension.pwmWrite({
        PIN: '5',
        VALUE: '128.9'
    });

    t.equal(receivedPin, 5);
    t.equal(
        receivedValue,
        128,
        'truncates decimal PWM values to an integer'
    );
    t.equal(decimalResult, 42);

    t.end();
});

tap.test('Arduino UNO exposes musical Tone blocks and delegates note duration', t => {
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
        'tocar nota [NOTE] no pino [PIN] por [DURATION]'
    );

    t.equal(
        toneStartBlock.arguments.PIN.defaultValue,
        6
    );

    t.equal(
        toneStartBlock.arguments.PIN.menu,
        'digitalPins',
        'Tone accepts any EasyBlox digital pin'
    );

    const noteArgument =
        toneStartBlock.arguments.NOTE || {};

    t.equal(
        noteArgument.defaultValue,
        262,
        'C4 is the default Tone note'
    );

    t.equal(
        noteArgument.menu,
        'toneNotes'
    );

    const durationArgument =
        toneStartBlock.arguments.DURATION || {};

    t.equal(
        durationArgument.defaultValue,
        500,
        'half duration defaults to 500 ms'
    );

    t.equal(
        durationArgument.menu,
        'toneDurations'
    );

    const toneNotes =
        info.menus.toneNotes &&
        Array.isArray(info.menus.toneNotes.items) ?
            info.menus.toneNotes.items :
            [];

    t.same(
        toneNotes[0],
        {
            text: 'C2',
            value: '65'
        },
        'Tone note menu starts at C2'
    );

    t.same(
        toneNotes[toneNotes.length - 1],
        {
            text: 'C8',
            value: '4186'
        },
        'Tone note menu ends at C8'
    );

    t.ok(
        toneNotes.some(item =>
            item.text === 'C4' &&
            item.value === '262'
        ),
        'Tone note menu maps C4 to 262 Hz'
    );

    t.ok(
        toneNotes.some(item =>
            item.text === 'A4' &&
            item.value === '440'
        ),
        'Tone note menu maps A4 to 440 Hz'
    );

    const toneDurations =
        info.menus.toneDurations &&
        Array.isArray(info.menus.toneDurations.items) ?
            info.menus.toneDurations.items :
            [];

    t.same(
        toneDurations,
        [
            {
                text: 'dobro',
                value: '2000'
            },
            {
                text: 'inteiro',
                value: '1000'
            },
            {
                text: 'metade',
                value: '500'
            },
            {
                text: 'um quarto',
                value: '250'
            },
            {
                text: 'um oitavo',
                value: '125'
            }
        ],
        'Tone duration labels map directly to milliseconds'
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
        'digitalPins',
        'Tone stop accepts any EasyBlox digital pin'
    );

    let receivedStartPin = null;
    let receivedFrequency = null;
    let receivedDuration = null;
    let receivedStopPin = null;

    extension._peripheral.toneStart = (
        pin,
        frequency,
        duration
    ) => {
        receivedStartPin = pin;
        receivedFrequency = frequency;
        receivedDuration = duration;

        return 43;
    };

    extension._peripheral.toneStop = pin => {
        receivedStopPin = pin;

        return 44;
    };

    const startResult = extension.toneStart({
        PIN: '7',
        NOTE: '262',
        DURATION: '500'
    });

    t.equal(receivedStartPin, 7);
    t.equal(receivedFrequency, 262);
    t.equal(receivedDuration, 500);
    t.equal(startResult, 43);

    const stopResult = extension.toneStop({
        PIN: '7'
    });

    t.equal(receivedStopPin, 7);
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

tap.test('Arduino UNO exposes an inert Upload entry point hat', t => {
    const runtime = new MockRuntime(null);
    const extension = new Scratch3ArduinoUnoBlocks(runtime);

    const info = extension.getInfo();
    const startBlock = info.blocks.find(
        block => block && block.opcode === 'whenArduinoUnoStart'
    );

    t.ok(startBlock);
    t.equal(startBlock.blockType, BlockType.HAT);
    t.equal(startBlock.text, 'quando Arduino Uno iniciar');
    t.equal(startBlock.isEdgeActivated, false);
    t.equal(startBlock.shouldRestartExistingThreads, false);

        t.equal(
        startBlock.executionMode,
        BlockExecutionMode.UPLOAD_ONLY,
        'Upload entry point must remain Upload-only'
    );
    t.equal(
        startBlock.inactiveModeBehavior,
        BlockInactiveModeBehavior.SHOW_DISABLED,
        'Upload entry point must remain visible but disabled in Stage mode'
    );

    t.equal(
        extension.whenArduinoUnoStart(),
        false,
        'Upload entry point must remain inert in Stage mode'
    );

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

tap.test('Arduino UNO waits for ACK before completing matrix commands', async t => {
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

    const rows = [
        0x00,
        0x66,
        0xFF,
        0xFF,
        0x7E,
        0x3C,
        0x18,
        0x00
    ];

    const writePromise = peripheral.matrixWrite(
        11,
        10,
        13,
        rows
    );

    t.ok(
        writePromise instanceof Promise,
        'MATRIX_WRITE returns a Promise'
    );

    await flushPromises();

    t.equal(
        writtenFrames.length,
        2,
        'MATRIX_WRITE is sent after the handshake'
    );

    const writeSequence = writtenFrames[1][3];

    t.same(
        writtenFrames[1],
        encodeFrame(
            writeSequence,
            COMMANDS.MATRIX_WRITE,
            [
                11,
                10,
                13,
                ...rows
            ]
        )
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        1,
        'MATRIX_WRITE remains pending before ACK'
    );

    onData(
        encodeFrame(
            writeSequence,
            RESPONSES.ACK
        )
    );

    t.equal(
        await writePromise,
        writeSequence,
        'MATRIX_WRITE completes after matching ACK'
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        0,
        'MATRIX_WRITE ACK clears the pending command'
    );

    const brightnessPromise =
        peripheral.matrixBrightness(
            11,
            10,
            13,
            50
        );

    t.ok(
        brightnessPromise instanceof Promise,
        'MATRIX_BRIGHTNESS returns a Promise'
    );

    await flushPromises();

    t.equal(
        writtenFrames.length,
        3,
        'MATRIX_BRIGHTNESS is sent'
    );

    const brightnessSequence =
        writtenFrames[2][3];

    t.same(
        writtenFrames[2],
        encodeFrame(
            brightnessSequence,
            COMMANDS.MATRIX_BRIGHTNESS,
            [
                11,
                10,
                13,
                50
            ]
        )
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        1,
        'MATRIX_BRIGHTNESS remains pending before ACK'
    );

    onData(
        encodeFrame(
            brightnessSequence,
            RESPONSES.ACK
        )
    );

    t.equal(
        await brightnessPromise,
        brightnessSequence,
        'MATRIX_BRIGHTNESS completes after matching ACK'
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        0,
        'MATRIX_BRIGHTNESS ACK clears the pending command'
    );
});

tap.test('Arduino UNO resolves matrix command with null on ERROR', async t => {
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

    const pingSequence = writtenFrames[0][3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const commandPromise = peripheral.matrixWrite(
        11,
        10,
        13,
        [
            0x00,
            0x66,
            0xFF,
            0xFF,
            0x7E,
            0x3C,
            0x18,
            0x00
        ]
    );

    await flushPromises();

    const sequence = writtenFrames[1][3];

    onData(
        encodeFrame(
            sequence,
            RESPONSES.ERROR
        )
    );

    t.equal(
        await commandPromise,
        null
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        0
    );
});

tap.test('Arduino UNO resolves pending matrix command with null on reset', async t => {
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

    const pingSequence = writtenFrames[0][3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const commandPromise = peripheral.matrixBrightness(
        11,
        10,
        13,
        50
    );

    await flushPromises();

    t.equal(
        peripheral._pendingCommandAcks.size,
        1
    );

    peripheral._reset();

    t.equal(
        await commandPromise,
        null
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        0
    );

    t.equal(
        peripheral.isStageConnected(),
        false
    );
});

tap.test('Arduino UNO resolves matrix command with null on ACK timeout', async t => {
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

    const pingSequence = writtenFrames[0][3];

    onData(
        encodeFrame(
            pingSequence,
            RESPONSES.PONG
        )
    );

    const commandPromise = peripheral.matrixWrite(
        11,
        10,
        13,
        [
            0x00,
            0x66,
            0xFF,
            0xFF,
            0x7E,
            0x3C,
            0x18,
            0x00
        ]
    );

    await flushPromises();

    t.equal(
        peripheral._pendingCommandAcks.size,
        1
    );

    t.equal(
        await commandPromise,
        null,
        'MATRIX_WRITE times out when ACK never arrives'
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        0
    );
});

tap.test('Arduino UNO rejects invalid matrix requests', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    const rows = [
        0x00,
        0x66,
        0xFF,
        0xFF,
        0x7E,
        0x3C,
        0x18,
        0x00
    ];

    t.equal(
        peripheral.matrixWrite(
            11,
            10,
            13,
            rows
        ),
        null,
        'does not write matrix before the Stage handshake'
    );

    t.equal(
        peripheral.matrixBrightness(
            11,
            10,
            13,
            50
        ),
        null,
        'does not set matrix brightness before the Stage handshake'
    );

    peripheral._stageConnected = true;

    t.equal(peripheral.matrixWrite(1, 10, 13, rows), null);
    t.equal(peripheral.matrixWrite(20, 10, 13, rows), null);
    t.equal(peripheral.matrixWrite(11.5, 10, 13, rows), null);

    t.equal(peripheral.matrixWrite(11, 1, 13, rows), null);
    t.equal(peripheral.matrixWrite(11, 20, 13, rows), null);
    t.equal(peripheral.matrixWrite(11, 10.5, 13, rows), null);

    t.equal(peripheral.matrixWrite(11, 10, 1, rows), null);
    t.equal(peripheral.matrixWrite(11, 10, 20, rows), null);
    t.equal(peripheral.matrixWrite(11, 10, 13.5, rows), null);

    t.equal(peripheral.matrixWrite(11, 11, 13, rows), null);
    t.equal(peripheral.matrixWrite(11, 10, 11, rows), null);
    t.equal(peripheral.matrixWrite(11, 10, 10, rows), null);

    t.equal(
        peripheral.matrixWrite(
            11,
            10,
            13,
            '0066FFFF7E3C1800'
        ),
        null
    );

    t.equal(
        peripheral.matrixWrite(
            11,
            10,
            13,
            [0, 1, 2, 3, 4, 5, 6]
        ),
        null
    );

    t.equal(
        peripheral.matrixWrite(
            11,
            10,
            13,
            [0, 1, 2, 3, 4, 5, 6, -1]
        ),
        null
    );

    t.equal(
        peripheral.matrixWrite(
            11,
            10,
            13,
            [0, 1, 2, 3, 4, 5, 6, 256]
        ),
        null
    );

    t.equal(
        peripheral.matrixWrite(
            11,
            10,
            13,
            [0, 1, 2, 3, 4, 5, 6, 7.5]
        ),
        null
    );

    t.equal(
        peripheral.matrixBrightness(1, 10, 13, 50),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 20, 13, 50),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 10, 20, 50),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 11, 13, 50),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 10, 11, 50),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 10, 10, 50),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 10, 13, -1),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 10, 13, 101),
        null
    );

    t.equal(
        peripheral.matrixBrightness(11, 10, 13, 50.5),
        null
    );

    t.end();
});

tap.test('Arduino UNO waits for ACK before completing TM1637 writes', async t => {
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

    const segments = [
        0x06,
        0x5B,
        0x4F,
        0x66
    ];

    const writePromise = peripheral.tm1637Write(
        3,
        5,
        segments
    );

    t.ok(
        writePromise instanceof Promise,
        'TM1637_WRITE returns a Promise'
    );

    await flushPromises();

    t.equal(
        writtenFrames.length,
        2,
        'TM1637_WRITE is sent after the handshake'
    );

    const writeSequence = writtenFrames[1][3];

    t.same(
        writtenFrames[1],
        encodeFrame(
            writeSequence,
            COMMANDS.TM1637_WRITE,
            [
                3,
                5,
                ...segments
            ]
        )
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        1,
        'TM1637_WRITE remains pending before ACK'
    );

    onData(
        encodeFrame(
            writeSequence,
            RESPONSES.ACK
        )
    );

    t.equal(
        await writePromise,
        writeSequence,
        'TM1637_WRITE completes after matching ACK'
    );

    t.equal(
        peripheral._pendingCommandAcks.size,
        0,
        'TM1637_WRITE ACK clears the pending command'
    );

    t.equal(
        peripheral.tm1637Write(
            3,
            3,
            segments
        ),
        null,
        'TM1637_WRITE rejects equal CLK and DIO pins'
    );

    t.equal(
        peripheral.tm1637Write(
            1,
            5,
            segments
        ),
        null,
        'TM1637_WRITE rejects CLK below D2'
    );

    t.equal(
        peripheral.tm1637Write(
            3,
            20,
            segments
        ),
        null,
        'TM1637_WRITE rejects DIO above A5'
    );

    t.equal(
        peripheral.tm1637Write(
            3,
            5,
            [0x06, 0x5B, 0x4F]
        ),
        null,
        'TM1637_WRITE requires exactly four segment bytes'
    );

    t.equal(
        peripheral.tm1637Write(
            3,
            5,
            [0x06, 0x5B, 0x4F, 256]
        ),
        null,
        'TM1637_WRITE rejects segment bytes above 255'
    );

    t.equal(
        writtenFrames.length,
        2,
        'invalid TM1637 writes do not reach the transport'
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

tap.test('Arduino UNO Serial Monitor uses the requested baud and bypasses the Stage protocol', async t => {
    let onData = null;
    const opened = [];
    const writtenFrames = [];
    const emitted = [];

    const transport = {
        setOnData: callback => {
            onData = callback;
        },

        open: async (peripheralId, options) => {
            opened.push({
                peripheralId,
                options: Object.assign({}, options)
            });
        },

        close: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);

    Object.defineProperty(
        runtime.constructor,
        'PERIPHERAL_SERIAL_MONITOR_READY',
        {
            configurable: true,
            value: 'PERIPHERAL_SERIAL_MONITOR_READY'
        }
    );

    Object.defineProperty(
        runtime.constructor,
        'PERIPHERAL_SERIAL_MONITOR_DATA',
        {
            configurable: true,
            value: 'PERIPHERAL_SERIAL_MONITOR_DATA'
        }
    );

    runtime.emit = (event, data) => {
        emitted.push({event, data});
    };

    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.connectSerialMonitor('COM3', 9600),
        true,
        'accepts a valid Serial Monitor connection'
    );

    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 550));

    t.equal(opened.length, 1);
    t.equal(opened[0].peripheralId, 'COM3');
    t.same(opened[0].options, {
        baudRate: 9600
    });

    t.equal(
        writtenFrames.length,
        0,
        'Serial Monitor does not send a Stage PING'
    );

    t.equal(
        peripheral.isStageConnected(),
        false,
        'Serial Monitor is never considered Stage-ready'
    );

    t.equal(
        peripheral.isSerialMonitorConnected(),
        true,
        'Serial Monitor reports its physical connection'
    );

    const readyEvent = emitted.find(entry =>
        entry.event === 'PERIPHERAL_SERIAL_MONITOR_READY'
    );

    t.same(
        readyEvent && readyEvent.data,
        {
            extensionId: 'arduinoUno',
            baudRate: 9600
        },
        'Serial Monitor publishes its ready state'
    );

    const bytes = new Uint8Array([
        0x4F,
        0x6C,
        0x61,
        0x0A
    ]);

    onData(bytes);

    const dataEvent = emitted.find(entry =>
        entry.event === 'PERIPHERAL_SERIAL_MONITOR_DATA'
    );

    t.equal(
        dataEvent.data.extensionId,
        'arduinoUno'
    );

    t.same(
        dataEvent.data.data,
        bytes,
        'raw sketch bytes are published instead of entering the Stage parser'
    );

    t.end();
});

tap.test('Arduino UNO returns from Serial Monitor to Stage at the canonical baud', async t => {
    const opened = [];
    const writtenFrames = [];

    const transport = {
        setOnData: () => {},

        open: async (peripheralId, options) => {
            opened.push({
                peripheralId,
                options: Object.assign({}, options)
            });
        },

        close: async () => {},

        write: async data => {
            writtenFrames.push(data);
        }
    };

    const runtime = new MockRuntime(transport);

    Object.defineProperty(
        runtime.constructor,
        'PERIPHERAL_SERIAL_MONITOR_READY',
        {
            configurable: true,
            value: 'PERIPHERAL_SERIAL_MONITOR_READY'
        }
    );

    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.connectSerialMonitor('COM3', 57600),
        true
    );

    await flushPromises();

    t.equal(
        await peripheral.disconnect(),
        true,
        'Serial Monitor releases the physical port'
    );

    peripheral.connect('COM3');

    await new Promise(resolve => setTimeout(resolve, 550));

    t.same(
        opened.map(connection =>
            connection.options.baudRate
        ),
        [
            57600,
            115200
        ],
        'Stage reconnect restores the canonical Stage baud'
    );

    t.equal(
        peripheral.isSerialMonitorConnected(),
        false,
        'Stage connection leaves Serial Monitor mode'
    );

    t.equal(
        writtenFrames.length,
        1,
        'Stage reconnect resumes its handshake'
    );

    t.same(
        writtenFrames[0],
        encodeFrame(
            writtenFrames[0][3],
            COMMANDS.PING
        ),
        'Stage reconnect sends PING instead of monitor traffic'
    );

    t.end();
});

tap.test('Arduino UNO rejects invalid Serial Monitor baud values', t => {
    const runtime = new MockRuntime(null);
    const peripheral = new ArduinoUnoPeripheral(runtime);

    t.equal(
        peripheral.connectSerialMonitor('COM3', 0),
        false
    );

    t.equal(
        peripheral.connectSerialMonitor('COM3', 9600.5),
        false
    );

    t.equal(
        peripheral.connectSerialMonitor('COM3', '9600'),
        false
    );

    t.end();
});
