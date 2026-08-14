const tap = require('tap');

const Serial = require('../../src/io/serial');

class MockRuntime {
    constructor (transport = null) {
        this.transport = transport;
        this.events = [];
    }

    getSerialTransport () {
        return this.transport;
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

tap.test('Serial reports unavailable transport', t => {
    const runtime = new MockRuntime();
    const serial = new Serial(runtime, 'arduinoUno');

    serial.scan();

    t.equal(runtime.events.length, 1);
    t.equal(runtime.events[0].event, MockRuntime.PERIPHERAL_REQUEST_ERROR);
    t.equal(runtime.events[0].data.extensionId, 'arduinoUno');

    t.end();
});

tap.test('Serial uses external port picker when requestPort is available', async t => {
    const peripheral = {
        peripheralId: 'web-port-1',
        name: 'Arduino UNO'
    };

    const transport = {
        requestPort: async () => peripheral
    };

    const runtime = new MockRuntime(transport);
    const serial = new Serial(runtime, 'arduinoUno', {baudRate: 115200});

    serial.scan();

    await new Promise(resolve => setImmediate(resolve));

    t.equal(runtime.events.length, 1);
    t.equal(runtime.events[0].event, MockRuntime.USER_PICKED_PERIPHERAL);
    t.same(runtime.events[0].data, {
        'web-port-1': peripheral
    });
});

tap.test('Serial lists ports when passive enumeration is available', async t => {
    const peripherals = [
        {
            peripheralId: 'COM3',
            name: 'Arduino UNO'
        },
        {
            peripheralId: 'COM4',
            name: 'USB Serial'
        }
    ];

    const transport = {
        listPorts: async () => peripherals
    };

    const runtime = new MockRuntime(transport);
    const serial = new Serial(runtime, 'arduinoUno');

    serial.scan();

    await new Promise(resolve => setImmediate(resolve));

    t.equal(runtime.events.length, 1);
    t.equal(runtime.events[0].event, MockRuntime.PERIPHERAL_LIST_UPDATE);
    t.same(runtime.events[0].data, {
        COM3: peripherals[0],
        COM4: peripherals[1]
    });
});

tap.test('Serial connects to selected peripheral', async t => {
    const calls = [];
    let connectedCallbackCalled = false;

    const transport = {
        open: async (peripheralId, options) => {
            calls.push({peripheralId, options});
        }
    };

    const runtime = new MockRuntime(transport);
    const serial = new Serial(
        runtime,
        'arduinoUno',
        {baudRate: 115200},
        () => {
            connectedCallbackCalled = true;
        }
    );

    serial.connect('COM3');

    await new Promise(resolve => setImmediate(resolve));

    t.equal(serial.isConnected(), true);
    t.same(calls, [{
        peripheralId: 'COM3',
        options: {baudRate: 115200}
    }]);
    t.equal(runtime.events[0].event, MockRuntime.PERIPHERAL_CONNECTED);
    t.equal(connectedCallbackCalled, true);
});

tap.test('Serial forwards received bytes to the peripheral callback', t => {
    let onData = null;
    let received = null;

    const transport = {
        setOnData: callback => {
            onData = callback;
        }
    };

    const runtime = new MockRuntime(transport);

    new Serial(
        runtime,
        'arduinoUno',
        {},
        null,
        null,
        data => {
            received = data;
        }
    );

    const bytes = new Uint8Array([0xFF, 0x55, 0x01]);
    onData(bytes);

    t.equal(received, bytes);

    t.end();
});

tap.test('Serial writes raw bytes through the transport', async t => {
    let onClose = null;
    let written = null;

    const transport = {
        setOnClose: callback => {
            onClose = callback;
        },
        open: async () => {},
        write: async data => {
            written = data;
        }
    };

    const runtime = new MockRuntime(transport);
    const serial = new Serial(runtime, 'arduinoUno');

    serial.connect('COM3');
    await new Promise(resolve => setImmediate(resolve));

    const bytes = new Uint8Array([1, 2, 3]);
    await serial.write(bytes);

    t.equal(written, bytes);
    t.type(onClose, 'function');
});

tap.test('Serial distinguishes deliberate disconnect from connection loss', async t => {
    let onClose = null;
    let resetCalled = false;

    const transport = {
        setOnClose: callback => {
            onClose = callback;
        },
        open: async () => {},
        close: async () => {}
    };

    const runtime = new MockRuntime(transport);
    const serial = new Serial(
        runtime,
        'arduinoUno',
        {},
        null,
        () => {
            resetCalled = true;
        }
    );

    serial.connect('COM3');
    await new Promise(resolve => setImmediate(resolve));

    runtime.events = [];

    serial.disconnect();
    onClose();

    t.equal(serial.isConnected(), false);
    t.equal(resetCalled, false);
    t.same(runtime.events.map(event => event.event), [
        MockRuntime.PERIPHERAL_DISCONNECTED
    ]);
});

tap.test('Serial reports unexpected connection loss', async t => {
    let onClose = null;
    let resetCalled = false;

    const transport = {
        setOnClose: callback => {
            onClose = callback;
        },
        open: async () => {},
        close: async () => {}
    };

    const runtime = new MockRuntime(transport);
    const serial = new Serial(
        runtime,
        'arduinoUno',
        {},
        null,
        () => {
            resetCalled = true;
        }
    );

    serial.connect('COM3');
    await new Promise(resolve => setImmediate(resolve));

    runtime.events = [];

    onClose();

    t.equal(serial.isConnected(), false);
    t.equal(resetCalled, true);
    t.same(runtime.events.map(event => event.event), [
        MockRuntime.PERIPHERAL_DISCONNECTED,
        MockRuntime.PERIPHERAL_CONNECTION_LOST_ERROR
    ]);
    t.equal(runtime.events[1].data.extensionId, 'arduinoUno');
});