const tap = require('tap');

const ArduinoUnoPeripheral = require('../../src/extensions/scratch3_arduino_uno/peripheral');
const {
    COMMANDS,
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