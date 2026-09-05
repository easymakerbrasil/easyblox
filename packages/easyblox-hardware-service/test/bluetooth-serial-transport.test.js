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
            path: 'COM1',
            label: 'Porta de comunicação'
        },
        {
            path: 'COM11',
            label: 'USB-SERIAL CH340',
            pnpId: 'USB\\VID_1A86&PID_7523'
        },
        {
            path: 'COM12',
            label: 'Dispositivo serial',
            pnpId: 'BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}'
        },
        {
            path: 'COM13',
            label: 'HC-06'
        },
        {
            path: 'COM14',
            label: 'Standard Serial over Bluetooth link'
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

test('Bluetooth Serial Transport lists only Bluetooth serial candidates without selecting one automatically', async () => {
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
                id: 'COM12',
                label: 'Dispositivo serial'
            },
            {
                id: 'COM13',
                label: 'HC-06'
            },
            {
                id: 'COM14',
                label: 'Standard Serial over Bluetooth link'
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

test('Bluetooth Serial Transport notifies an unexpected physical disconnect', async () => {
    const adapter =
        createFakeAdapter();

    const transport =
        new BluetoothSerialTransport({
            serialAdapter: adapter
        });

    const disconnects = [];

    transport.onDisconnect(() => {
        disconnects.push(
            'disconnected'
        );
    });

    await transport.connect({
        deviceId: 'COM12'
    });

    adapter.createdPorts[0].isOpen = false;
    adapter.createdPorts[0].emit('close');

    assert.deepEqual(
        disconnects,
        [
            'disconnected'
        ]
    );
});
