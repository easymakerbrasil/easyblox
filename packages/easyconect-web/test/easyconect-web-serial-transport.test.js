const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_CONNECTION_STATES,
    EasyConectConnection,
    validateEasyConectTransport
} = require(
    '@easymaker/easyconect-core'
);

const {
    EASYCONECT_WEB_SERIAL_DEVICE_ID,
    EasyConectWebSerialTransport
} = require('../src');

const EBCP_HELLO_FRAME =
    new Uint8Array([
        0x45,
        0x42,
        0x01,
        0x81,
        0x00,
        0x00,
        0x00,
        0x80
    ]);

const EBCP_HELLO_ACK_FRAME =
    new Uint8Array([
        0x45,
        0x42,
        0x01,
        0x82,
        0x00,
        0x00,
        0x00,
        0x83
    ]);

const flushAsyncWork =
    () =>
        new Promise(
            resolve =>
                setImmediate(
                    resolve
                )
        );

class FakeSerialPort {
    constructor () {
        this.openCalls = [];
        this.closeCalls = 0;
        this.writes = [];

        this._pendingRead = null;
        this._queuedReads = [];

        this.readable = {
            getReader:
                () => ({
                    read:
                        () =>
                            this._read(),

                    cancel:
                        () => {
                            this._finishReadLoop();
                            return Promise.resolve();
                        },

                    releaseLock:
                        () => {}
                })
        };

        this.writable = {
            getWriter:
                () => ({
                    write:
                        bytes => {
                            this.writes.push(
                                new Uint8Array(
                                    bytes
                                )
                            );

                            return Promise.resolve();
                        },

                    releaseLock:
                        () => {}
                })
        };
    }

    async open (options) {
        this.openCalls.push({
            ...options
        });
    }

    async close () {
        this.closeCalls += 1;
    }

    emitData (bytes) {
        this._resolveRead({
            value:
                new Uint8Array(
                    bytes
                ),

            done:
                false
        });
    }

    emitDisconnect () {
        this._resolveRead({
            value:
                undefined,

            done:
                true
        });
    }

    _read () {
        if (
            this._queuedReads.length >
            0
        ) {
            return Promise.resolve(
                this._queuedReads.shift()
            );
        }

        return new Promise(
            resolve => {
                this._pendingRead =
                    resolve;
            }
        );
    }

    _resolveRead (result) {
        if (this._pendingRead) {
            const resolve =
                this._pendingRead;

            this._pendingRead =
                null;

            resolve(result);
            return;
        }

        this._queuedReads.push(
            result
        );
    }

    _finishReadLoop () {
        this._resolveRead({
            value:
                undefined,

            done:
                true
        });
    }
}

class FakeSerial {
    constructor (port) {
        this.port = port;
        this.requestPortCalls = [];
    }

    async requestPort (...args) {
        this.requestPortCalls.push(
            args
        );

        return this.port;
    }
}

test('Web Serial transport exposes the canonical browser-selected device id', () => {
    assert.equal(
        EASYCONECT_WEB_SERIAL_DEVICE_ID,
        'browser-selected-port'
    );
});

test('Web Serial transport satisfies the canonical EasyConect transport contract', () => {
    const transport =
        new EasyConectWebSerialTransport({
            serial:
                new FakeSerial(
                    new FakeSerialPort()
                )
        });

    assert.equal(
        validateEasyConectTransport(
            transport
        ),
        true
    );
});

test('Web Serial transport rejects environments without Web Serial', () => {
    assert.throws(
        () =>
            new EasyConectWebSerialTransport({
                serial:
                    null
            }),
        /Web Serial is not available/i
    );
});

test('Web Serial transport requests a browser-selected port and opens it at HC-05 HC-06 baud', async () => {
    const port =
        new FakeSerialPort();

    const serial =
        new FakeSerial(
            port
        );

    const transport =
        new EasyConectWebSerialTransport({
            serial
        });

    await transport.connect({
        deviceId:
            EASYCONECT_WEB_SERIAL_DEVICE_ID
    });

    assert.equal(
        serial.requestPortCalls.length,
        1
    );

    assert.deepEqual(
        serial.requestPortCalls[0],
        []
    );

    assert.deepEqual(
        port.openCalls,
        [{
            baudRate:
                9600
        }]
    );
});

test('Web Serial transport forwards raw writes without interpreting EBCP bytes', async () => {
    const port =
        new FakeSerialPort();

    const transport =
        new EasyConectWebSerialTransport({
            serial:
                new FakeSerial(
                    port
                )
        });

    await transport.connect({
        deviceId:
            EASYCONECT_WEB_SERIAL_DEVICE_ID
    });

    const bytes =
        new Uint8Array([
            0x45,
            0x42,
            0x01,
            0x03
        ]);

    await transport.write(
        bytes
    );

    assert.deepEqual(
        port.writes,
        [
            bytes
        ]
    );
});

test('Web Serial transport forwards incoming serial bytes without interpreting them', async () => {
    const port =
        new FakeSerialPort();

    const transport =
        new EasyConectWebSerialTransport({
            serial:
                new FakeSerial(
                    port
                )
        });

    const received = [];

    transport.onData(
        bytes => {
            received.push(
                bytes
            );
        }
    );

    await transport.connect({
        deviceId:
            EASYCONECT_WEB_SERIAL_DEVICE_ID
    });

    port.emitData([
        0x10,
        0x20,
        0x30
    ]);

    await flushAsyncWork();

    assert.deepEqual(
        received,
        [
            new Uint8Array([
                0x10,
                0x20,
                0x30
            ])
        ]
    );

    await transport.disconnect();
});

test('Web Serial transport reports an unexpected serial loss', async () => {
    const port =
        new FakeSerialPort();

    const transport =
        new EasyConectWebSerialTransport({
            serial:
                new FakeSerial(
                    port
                )
        });

    const disconnects = [];

    transport.onDisconnect(
        () => {
            disconnects.push(
                true
            );
        }
    );

    await transport.connect({
        deviceId:
            EASYCONECT_WEB_SERIAL_DEVICE_ID
    });

    port.emitDisconnect();

    await flushAsyncWork();

    assert.deepEqual(
        disconnects,
        [
            true
        ]
    );
});

test('Web Serial transport disconnects intentionally without reporting a physical loss', async () => {
    const port =
        new FakeSerialPort();

    const transport =
        new EasyConectWebSerialTransport({
            serial:
                new FakeSerial(
                    port
                )
        });

    const disconnects = [];

    transport.onDisconnect(
        () => {
            disconnects.push(
                true
            );
        }
    );

    await transport.connect({
        deviceId:
            EASYCONECT_WEB_SERIAL_DEVICE_ID
    });

    assert.equal(
        await transport.disconnect(),
        true
    );

    assert.equal(
        port.closeCalls,
        1
    );

    assert.deepEqual(
        disconnects,
        []
    );
});

test('Web Serial transport composes with EasyConectConnection through the EBCP handshake', async () => {
    const port =
        new FakeSerialPort();

    const transport =
        new EasyConectWebSerialTransport({
            serial:
                new FakeSerial(
                    port
                )
        });

    const connection =
        new EasyConectConnection({
            transport
        });

    const connecting =
        connection.connect({
            deviceId:
                EASYCONECT_WEB_SERIAL_DEVICE_ID
        });

    await flushAsyncWork();

    assert.equal(
        port.writes.length,
        1
    );

    assert.deepEqual(
        port.writes[0],
        EBCP_HELLO_FRAME
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .CONNECTING
    );

    port.emitData(
        EBCP_HELLO_ACK_FRAME
    );

    await connecting;

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .CONNECTED
    );

    assert.equal(
        await connection.disconnect(),
        true
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .DISCONNECTED
    );
});
