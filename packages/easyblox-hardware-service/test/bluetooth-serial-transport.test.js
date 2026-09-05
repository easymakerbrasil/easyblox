const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');

const BluetoothSerialTransport =
    require('../src/bluetooth-serial-transport');

class FakeSerialPort extends EventEmitter {
    constructor ({path, baudRate}) {
        super();

        this.path = path;
        this.baudRate = baudRate;
        this.isOpen = false;
        this.writes = [];
    }

    open (callback) {
        this.isOpen = true;
        callback(null);
    }

    write (bytes, callback) {
        this.writes.push(
            Buffer.from(bytes)
        );

        callback(null);
    }

    close (callback) {
        this.isOpen = false;
        callback(null);
    }
}

const createFakeAdapter = () => {
    const ports = [
        {
            path: 'COM11',
            label: 'Arduino Uno'
        },
        {
            path: 'COM12',
            label: 'EasyMaker-37'
        }
    ];

    const createdPorts = [];

    return {
        ports,
        createdPorts,

        async list () {
            return ports.map(port => ({
                ...port
            }));
        },

        createPort (options) {
            const port =
                new FakeSerialPort(options);

            createdPorts.push(port);

            return port;
        }
    };
};

test('Bluetooth Serial Transport lists serial devices without selecting one automatically', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    assert.deepEqual(
        await transport.listDevices(),
        [
            {
                id: 'COM11',
                label: 'Arduino Uno'
            },
            {
                id: 'COM12',
                label: 'EasyMaker-37'
            }
        ]
    );
});

test('Bluetooth Serial Transport connects using the fixed EasyBlox BT serial settings', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    await transport.connect({
        deviceId: 'COM12'
    });

    assert.equal(
        adapter.createdPorts.length,
        1
    );

    assert.equal(
        adapter.createdPorts[0].path,
        'COM12'
    );

    assert.equal(
        adapter.createdPorts[0].baudRate,
        9600
    );

    assert.equal(
        transport.getState(),
        'connected'
    );
});

test('Bluetooth Serial Transport writes raw bytes without knowing EBCP', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    await transport.connect({
        deviceId: 'COM12'
    });

    await transport.write(
        Buffer.from([
            0x45,
            0x42,
            0x01
        ])
    );

    assert.deepEqual(
        adapter.createdPorts[0].writes,
        [
            Buffer.from([
                0x45,
                0x42,
                0x01
            ])
        ]
    );
});

test('Bluetooth Serial Transport forwards incoming raw bytes', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    const received = [];

    transport.onData(bytes => {
        received.push(
            Buffer.from(bytes)
        );
    });

    await transport.connect({
        deviceId: 'COM12'
    });

    adapter.createdPorts[0].emit(
        'data',
        Buffer.from([
            0x10,
            0x20,
            0x30
        ])
    );

    assert.deepEqual(
        received,
        [
            Buffer.from([
                0x10,
                0x20,
                0x30
            ])
        ]
    );
});

test('Bluetooth Serial Transport disconnects cleanly', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    await transport.connect({
        deviceId: 'COM12'
    });

    assert.equal(
        await transport.disconnect(),
        true
    );

    assert.equal(
        transport.getState(),
        'disconnected'
    );

    assert.equal(
        adapter.createdPorts[0].isOpen,
        false
    );

    assert.equal(
        await transport.disconnect(),
        false
    );
});

test('Bluetooth Serial Transport becomes disconnected when the port closes unexpectedly', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    await transport.connect({
        deviceId: 'COM12'
    });

    adapter.createdPorts[0].isOpen = false;
    adapter.createdPorts[0].emit('close');

    assert.equal(
        transport.getState(),
        'disconnected'
    );

    assert.equal(
        await transport.disconnect(),
        false
    );
});

test('Bluetooth Serial Transport forwards native port errors in a controlled way', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    const errors = [];

    transport.onError(error => {
        errors.push(error);
    });

    await transport.connect({
        deviceId: 'COM12'
    });

    const portError =
        new Error('Bluetooth serial port lost');

    adapter.createdPorts[0].emit(
        'error',
        portError
    );

    assert.deepEqual(
        errors,
        [
            portError
        ]
    );
});

test('Bluetooth Serial Transport can reconnect after an unexpected port close', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    await transport.connect({
        deviceId: 'COM12'
    });

    adapter.createdPorts[0].isOpen = false;
    adapter.createdPorts[0].emit('close');

    await transport.connect({
        deviceId: 'COM12'
    });

    assert.equal(
        adapter.createdPorts.length,
        2
    );

    assert.equal(
        transport.getState(),
        'connected'
    );

    assert.equal(
        adapter.createdPorts[1].path,
        'COM12'
    );
});
