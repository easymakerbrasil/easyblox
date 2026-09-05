const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');

const BluetoothSocketSession =
    require('../src/bluetooth-socket-session');

class FakeSocket extends EventEmitter {
    constructor () {
        super();

        this.sent = [];
        this.closed = [];
    }

    send (bytes) {
        this.sent.push(
            Buffer.from(bytes)
        );
    }

    close (code, reason) {
        this.closed.push({
            code,
            reason
        });
    }
}

class FakeTransport {
    constructor () {
        this.connectedDeviceId = null;
        this.writes = [];
        this.disconnectCalls = 0;

        this._dataListeners = [];
        this._errorListeners = [];
        this._disconnectListeners = [];
    }

    async connect ({deviceId}) {
        this.connectedDeviceId =
            deviceId;
    }

    async write (bytes) {
        this.writes.push(
            Buffer.from(bytes)
        );
    }

    async disconnect () {
        this.disconnectCalls += 1;
        this.connectedDeviceId = null;

        return true;
    }

    onData (listener) {
        this._dataListeners.push(
            listener
        );
    }

    onError (listener) {
        this._errorListeners.push(
            listener
        );
    }

    onDisconnect (listener) {
        this._disconnectListeners.push(
            listener
        );
    }

    emitData (bytes) {
        for (const listener of this._dataListeners) {
            listener(
                Buffer.from(bytes)
            );
        }
    }

    emitError (error) {
        for (const listener of this._errorListeners) {
            listener(error);
        }
    }

    emitDisconnect () {
        for (
            const listener of
                this._disconnectListeners
        ) {
            listener();
        }
    }
}

class DeferredConnectTransport extends FakeTransport {
    constructor () {
        super();

        this._connectReady =
            new Promise(resolve => {
                this._resolveConnect =
                    resolve;
            });
    }

    async connect ({deviceId}) {
        this.connectedDeviceId =
            deviceId;

        await this._connectReady;
    }

    resolveConnect () {
        this._resolveConnect();
    }
}

test('Bluetooth Socket Session connects the transport to the selected internal device', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new FakeTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    await session.start({
        deviceId: 'COM12'
    });

    assert.equal(
        transport.connectedDeviceId,
        'COM12'
    );
});

test('Bluetooth Socket Session buffers binary bytes until the serial transport finishes connecting', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new DeferredConnectTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    const starting =
        session.start({
            deviceId: 'COM12'
        });

    socket.emit(
        'message',
        Buffer.from([
            0x45,
            0x42,
            0x01
        ]),
        true
    );

    await Promise.resolve();

    assert.deepEqual(
        transport.writes,
        []
    );

    transport.resolveConnect();

    await starting;

    assert.deepEqual(
        transport.writes,
        [
            Buffer.from([
                0x45,
                0x42,
                0x01
            ])
        ]
    );
});

test('Bluetooth Socket Session forwards binary socket bytes to the serial transport', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new FakeTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    await session.start({
        deviceId: 'COM12'
    });

    socket.emit(
        'message',
        Buffer.from([
            0x45,
            0x42,
            0x01
        ]),
        true
    );

    await new Promise(resolve => {
        setImmediate(resolve);
    });

    assert.deepEqual(
        transport.writes,
        [
            Buffer.from([
                0x45,
                0x42,
                0x01
            ])
        ]
    );
});

test('Bluetooth Socket Session forwards serial bytes to the socket unchanged', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new FakeTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    await session.start({
        deviceId: 'COM12'
    });

    transport.emitData(
        Buffer.from([
            0x10,
            0x20,
            0x30
        ])
    );

    assert.deepEqual(
        socket.sent,
        [
            Buffer.from([
                0x10,
                0x20,
                0x30
            ])
        ]
    );
});

test('Bluetooth Socket Session disconnects serial transport when the socket closes', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new FakeTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    await session.start({
        deviceId: 'COM12'
    });

    socket.emit('close');

    await new Promise(resolve => {
        setImmediate(resolve);
    });

    assert.equal(
        transport.disconnectCalls,
        1
    );
});

test('Bluetooth Socket Session closes the socket when the physical Bluetooth link disappears', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new FakeTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    await session.start({
        deviceId: 'COM12'
    });

    transport.emitDisconnect();

    assert.deepEqual(
        socket.closed,
        [{
            code: 1011,
            reason:
                'Bluetooth connection lost'
        }]
    );
});

test('Bluetooth Socket Session closes the socket on a native transport error', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new FakeTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    await session.start({
        deviceId: 'COM12'
    });

    transport.emitError(
        new Error(
            'Native serial failure'
        )
    );

    assert.deepEqual(
        socket.closed,
        [{
            code: 1011,
            reason:
                'Bluetooth transport error'
        }]
    );
});

test('Bluetooth Socket Session rejects text messages instead of treating them as serial bytes', async () => {
    const socket =
        new FakeSocket();

    const transport =
        new FakeTransport();

    const session =
        new BluetoothSocketSession({
            socket,
            transport
        });

    await session.start({
        deviceId: 'COM12'
    });

    socket.emit(
        'message',
        Buffer.from(
            'not-binary'
        ),
        false
    );

    assert.deepEqual(
        transport.writes,
        []
    );

    assert.deepEqual(
        socket.closed,
        [{
            code: 1003,
            reason:
                'Binary messages required'
        }]
    );
});
