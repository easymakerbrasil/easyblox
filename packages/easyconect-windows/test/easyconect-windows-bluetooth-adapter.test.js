const test = require('node:test');
const assert = require('node:assert/strict');

const {
    validateEasyConectDiscovery,
    validateEasyConectTransport
} = require(
    '@easymaker/easyconect-core'
);

const {
    EasyConectWindowsBluetoothAdapter
} = require('../src');

class FakeWindowsBluetoothTransport {
    constructor () {
        this.devices = [];
        this.connectCalls = [];
        this.disconnectCalls = 0;
        this.writes = [];

        this.dataListeners = [];
        this.errorListeners = [];
        this.disconnectListeners = [];
    }

    async listDevices () {
        return this.devices.map(
            device => ({
                ...device
            })
        );
    }

    async connect (options) {
        this.connectCalls.push({
            ...options
        });

        return true;
    }

    async disconnect () {
        this.disconnectCalls += 1;

        return true;
    }

    async write (bytes) {
        this.writes.push(
            new Uint8Array(
                bytes
            )
        );
    }

    onData (listener) {
        this.dataListeners.push(
            listener
        );
    }

    onError (listener) {
        this.errorListeners.push(
            listener
        );
    }

    onDisconnect (listener) {
        this.disconnectListeners.push(
            listener
        );
    }

    emitData (bytes) {
        for (
            const listener of
            this.dataListeners
        ) {
            listener(
                bytes
            );
        }
    }

    emitError (error) {
        for (
            const listener of
            this.errorListeners
        ) {
            listener(
                error
            );
        }
    }

    emitDisconnect () {
        for (
            const listener of
            this.disconnectListeners
        ) {
            listener();
        }
    }
}

test('Windows Bluetooth adapter satisfies EasyConect discovery and transport contracts', () => {
    const adapter =
        new EasyConectWindowsBluetoothAdapter({
            transport:
                new FakeWindowsBluetoothTransport()
        });

    assert.equal(
        validateEasyConectDiscovery(
            adapter
        ),
        true
    );

    assert.equal(
        validateEasyConectTransport(
            adapter
        ),
        true
    );
});

test('Windows Bluetooth adapter maps platform devices to canonical EasyConect devices', async () => {
    const transport =
        new FakeWindowsBluetoothTransport();

    transport.devices = [
        {
            id:
                'COM7',
            label:
                'HC-06',
            pnpId:
                'platform-private',
            address:
                'platform-private'
        },
        {
            id:
                'COM11',
            label:
                'EasyMaker-37'
        }
    ];

    const adapter =
        new EasyConectWindowsBluetoothAdapter({
            transport
        });

    assert.deepEqual(
        await adapter.listDevices(),
        [
            {
                deviceId:
                    'COM7',
                name:
                    'HC-06'
            },
            {
                deviceId:
                    'COM11',
                name:
                    'EasyMaker-37'
            }
        ]
    );
});

test('Windows Bluetooth adapter preserves the opaque device id when connecting', async () => {
    const transport =
        new FakeWindowsBluetoothTransport();

    const adapter =
        new EasyConectWindowsBluetoothAdapter({
            transport
        });

    assert.equal(
        await adapter.connect({
            deviceId:
                'opaque-windows-device'
        }),
        true
    );

    assert.deepEqual(
        transport.connectCalls,
        [{
            deviceId:
                'opaque-windows-device'
        }]
    );
});

test('Windows Bluetooth adapter forwards raw writes without interpreting protocol bytes', async () => {
    const transport =
        new FakeWindowsBluetoothTransport();

    const adapter =
        new EasyConectWindowsBluetoothAdapter({
            transport
        });

    const bytes =
        new Uint8Array([
            0x45,
            0x42,
            0x01,
            0x03
        ]);

    await adapter.write(
        bytes
    );

    assert.deepEqual(
        transport.writes,
        [
            bytes
        ]
    );
});

test('Windows Bluetooth adapter forwards transport data error and disconnect events', () => {
    const transport =
        new FakeWindowsBluetoothTransport();

    const adapter =
        new EasyConectWindowsBluetoothAdapter({
            transport
        });

    const data = [];
    const errors = [];
    const disconnects = [];

    adapter.onData(
        bytes => {
            data.push(
                bytes
            );
        }
    );

    adapter.onError(
        error => {
            errors.push(
                error
            );
        }
    );

    adapter.onDisconnect(
        () => {
            disconnects.push(
                true
            );
        }
    );

    const bytes =
        new Uint8Array([
            1,
            2,
            3
        ]);

    const error =
        new Error(
            'native transport error'
        );

    transport.emitData(
        bytes
    );

    transport.emitError(
        error
    );

    transport.emitDisconnect();

    assert.deepEqual(
        data,
        [
            bytes
        ]
    );

    assert.deepEqual(
        errors,
        [
            error
        ]
    );

    assert.deepEqual(
        disconnects,
        [
            true
        ]
    );
});

test('Windows Bluetooth adapter delegates explicit disconnect', async () => {
    const transport =
        new FakeWindowsBluetoothTransport();

    const adapter =
        new EasyConectWindowsBluetoothAdapter({
            transport
        });

    assert.equal(
        await adapter.disconnect(),
        true
    );

    assert.equal(
        transport.disconnectCalls,
        1
    );
});

test('Windows Bluetooth adapter rejects an invalid underlying transport', () => {
    assert.throws(
        () =>
            new EasyConectWindowsBluetoothAdapter({
                transport: {}
            }),
        /transport method connect must be a function/i
    );
});

test('Windows Bluetooth adapter requires platform device discovery', () => {
    const transport =
        new FakeWindowsBluetoothTransport();

    transport.listDevices =
        null;

    assert.throws(
        () =>
            new EasyConectWindowsBluetoothAdapter({
                transport
            }),
        /listDevices must be a function/i
    );
});
