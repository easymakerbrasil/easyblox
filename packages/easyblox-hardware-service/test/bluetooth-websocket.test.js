const test = require('node:test');
const assert = require('node:assert/strict');

const WebSocket = require('ws');

const {
    HardwareHttpServer
} = require('../src');

const ORIGIN =
    'http://localhost:8601';

const PROTOCOL =
    'easyblox-controller-v1';

class FakeBluetoothTransport {
    constructor () {
        this.connectedDeviceId = null;
        this.writes = [];
        this.disconnectCalls = 0;
        this._writeWaiters = [];

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

        const waiters =
            this._writeWaiters.splice(0);

        for (const resolve of waiters) {
            resolve();
        }
    }

    waitForWrite () {
        if (this.writes.length > 0) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            this._writeWaiters.push(
                resolve
            );
        });
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
        for (
            const listener of
                this._dataListeners
        ) {
            listener(
                Buffer.from(bytes)
            );
        }
    }
}

const startServer =
    async options => {
        const server =
            new HardwareHttpServer({
                ...options,
                port: 0
            });

        const address =
            await server.listen();

        return {
            server,
            port:
                address.port
        };
    };

const openBluetoothSocket = ({
    port,
    deviceId = 'COM12',
    origin = ORIGIN,
    protocol = PROTOCOL
}) => new Promise(
    (resolve, reject) => {
        const socket =
            new WebSocket(
                `ws://127.0.0.1:${port}/v1/bluetooth?deviceId=${encodeURIComponent(deviceId)}`,
                protocol,
                {
                    headers: {
                        Origin:
                            origin
                    }
                }
            );

        socket.once(
            'open',
            () => {
                resolve(socket);
            }
        );

        socket.once(
            'error',
            reject
        );
    }
);

const rejectedUpgrade = ({
    port,
    deviceId = 'COM12',
    origin = ORIGIN,
    protocol = PROTOCOL
}) => new Promise(
    (resolve, reject) => {
        const socket =
            new WebSocket(
                `ws://127.0.0.1:${port}/v1/bluetooth?deviceId=${encodeURIComponent(deviceId)}`,
                protocol,
                {
                    headers: {
                        Origin:
                            origin
                    }
                }
            );

        socket.once(
            'unexpected-response',
            (request, response) => {
                resolve(
                    response.statusCode
                );

                response.resume();
            }
        );

        socket.once(
            'open',
            () => {
                reject(
                    new Error(
                        'WebSocket unexpectedly opened'
                    )
                );
            }
        );

        socket.once(
            'error',
            () => {
                // Rejection may close the client after
                // unexpected-response.
            }
        );
    }
);

test('Hardware service upgrades an approved Bluetooth WebSocket and bridges binary bytes', async () => {
    const transports = [];

    const {
        server,
        port
    } = await startServer({
        bluetoothTransportFactory:
            () => {
                const transport =
                    new FakeBluetoothTransport();

                transports.push(
                    transport
                );

                return transport;
            }
    });

    let socket;

    try {
        socket =
            await openBluetoothSocket({
                port
            });

        assert.equal(
            socket.protocol,
            PROTOCOL
        );

        assert.equal(
            transports.length,
            1
        );

        assert.equal(
            transports[0]
                .connectedDeviceId,
            'COM12'
        );

        const forwardedToTransport =
            transports[0].waitForWrite();

        socket.send(
            Buffer.from([
                0x45,
                0x42,
                0x01
            ])
        );

        await forwardedToTransport;

        assert.deepEqual(
            transports[0].writes,
            [
                Buffer.from([
                    0x45,
                    0x42,
                    0x01
                ])
            ]
        );

        const received =
            new Promise(resolve => {
                socket.once(
                    'message',
                    (bytes, isBinary) => {
                        resolve({
                            bytes:
                                Buffer.from(
                                    bytes
                                ),
                            isBinary
                        });
                    }
                );
            });

        transports[0].emitData(
            Buffer.from([
                0x10,
                0x20,
                0x30
            ])
        );

        assert.deepEqual(
            await received,
            {
                bytes:
                    Buffer.from([
                        0x10,
                        0x20,
                        0x30
                    ]),
                isBinary: true
            }
        );
    } finally {
        if (socket) {
            socket.close();

            await new Promise(resolve => {
                socket.once(
                    'close',
                    resolve
                );
            });
        }

        await server.close();
    }
});

test('Hardware service rejects a Bluetooth WebSocket from an unapproved origin', async () => {
    let transportCreations = 0;

    const {
        server,
        port
    } = await startServer({
        bluetoothTransportFactory:
            () => {
                transportCreations += 1;

                return new FakeBluetoothTransport();
            }
    });

    try {
        assert.equal(
            await rejectedUpgrade({
                port,
                origin:
                    'https://example.com'
            }),
            403
        );

        assert.equal(
            transportCreations,
            0
        );
    } finally {
        await server.close();
    }
});

test('Hardware service rejects a Bluetooth WebSocket without a valid device id', async () => {
    const {
        server,
        port
    } = await startServer({
        bluetoothTransportFactory:
            () =>
                new FakeBluetoothTransport()
    });

    try {
        assert.equal(
            await rejectedUpgrade({
                port,
                deviceId: ''
            }),
            400
        );
    } finally {
        await server.close();
    }
});

test('Hardware service rejects a Bluetooth WebSocket without the Controller subprotocol', async () => {
    const {
        server,
        port
    } = await startServer({
        bluetoothTransportFactory:
            () =>
                new FakeBluetoothTransport()
    });

    try {
        assert.equal(
            await rejectedUpgrade({
                port,
                protocol:
                    'wrong-protocol'
            }),
            426
        );
    } finally {
        await server.close();
    }
});
