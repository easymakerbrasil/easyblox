const {Buffer} = require('buffer');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT,
    EBCP_CONTROL_TYPES,
    encodeFrame,
    decodeFrame
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_CONNECTION_STATES,
    EasyConectConnection
} = require('../src');

const BOOLEAN_TYPE =
    EBCP_CONTRACT
        .messageTypes
        .BOOLEAN;

const CHANNEL =
    'gamepad.dpad.up';

const createDeferred =
    () => {
        let resolve;
        let reject;

        const promise =
            new Promise(
                (
                    promiseResolve,
                    promiseReject
                ) => {
                    resolve =
                        promiseResolve;

                    reject =
                        promiseReject;
                }
            );

        return {
            promise,
            resolve,
            reject
        };
    };

const flushMicrotasks =
    async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    };

const createControlFrame =
    type =>
        encodeFrame({
            type,
            sequence: 0,
            channel: '',
            payload:
                Buffer.alloc(0)
        });

class FakeTransport {
    constructor () {
        this.events = [];
        this.connectCalls = [];
        this.disconnectCalls = 0;
        this.writes = [];

        this._dataListeners = [];
        this._errorListeners = [];
        this._disconnectListeners = [];

        this._nextWriteDeferred = null;
        this._nextWriteError = null;
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

    async connect ({deviceId}) {
        this.events.push(
            'transport-connect'
        );

        this.connectCalls.push({
            deviceId
        });
    }

    async disconnect () {
        this.events.push(
            'transport-disconnect'
        );

        this.disconnectCalls += 1;

        return true;
    }

    write (bytes) {
        const payload =
            new Uint8Array(
                bytes
            );

        this.events.push(
            'transport-write'
        );

        this.writes.push(
            payload
        );

        if (this._nextWriteError) {
            const error =
                this._nextWriteError;

            this._nextWriteError =
                null;

            return Promise.reject(
                error
            );
        }

        if (this._nextWriteDeferred) {
            const deferred =
                this._nextWriteDeferred;

            this._nextWriteDeferred =
                null;

            return deferred.promise;
        }

        return Promise.resolve();
    }

    deferNextWrite () {
        const deferred =
            createDeferred();

        this._nextWriteDeferred =
            deferred;

        return deferred;
    }

    failNextWrite (error) {
        this._nextWriteError =
            error;
    }

    emitData (bytes) {
        for (
            const listener of
            this._dataListeners
        ) {
            listener(
                new Uint8Array(
                    bytes
                )
            );
        }
    }

    emitError (error) {
        for (
            const listener of
            this._errorListeners
        ) {
            listener(
                error
            );
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

const connectReady =
    async (
        connection,
        transport
    ) => {
        const connecting =
            connection.connect({
                deviceId:
                    'opaque-device-1'
            });

        await flushMicrotasks();

        assert.equal(
            transport.writes.length,
            1
        );

        assert.equal(
            decodeFrame(
                Buffer.from(
                    transport.writes[0]
                )
            ).type,
            EBCP_CONTROL_TYPES
                .HELLO
        );

        transport.emitData(
            createControlFrame(
                EBCP_CONTROL_TYPES
                    .HELLO_ACK
            )
        );

        await connecting;
    };

test('EasyConect connection requires the canonical transport contract', () => {
    assert.throws(
        () =>
            new EasyConectConnection({
                transport: {}
            }),
        /transport method connect must be a function/i
    );
});

test('EasyConect connects the transport before starting the EBCP handshake', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    const connecting =
        connection.connect({
            deviceId:
                'opaque-device-1'
        });

    assert.deepEqual(
        transport.events,
        [
            'transport-connect'
        ]
    );

    await flushMicrotasks();

    assert.deepEqual(
        transport.events,
        [
            'transport-connect',
            'transport-write'
        ]
    );

    assert.deepEqual(
        transport.connectCalls,
        [{
            deviceId:
                'opaque-device-1'
        }]
    );

    const hello =
        decodeFrame(
            Buffer.from(
                transport.writes[0]
            )
        );

    assert.equal(
        hello.type,
        EBCP_CONTROL_TYPES
            .HELLO
    );

    transport.emitData(
        createControlFrame(
            EBCP_CONTROL_TYPES
                .HELLO_ACK
        )
    );

    await connecting;
});

test('EasyConect forwards transport bytes through EBCP runtime and writes ACK bytes back', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    await connectReady(
        connection,
        transport
    );

    const waiting =
        connection.waitFor(
            BOOLEAN_TYPE,
            CHANNEL
        );

    transport.emitData(
        encodeFrame({
            type:
                BOOLEAN_TYPE,
            sequence:
                7,
            channel:
                CHANNEL,
            payload:
                true
        })
    );

    const message =
        await waiting;

    assert.equal(
        message.payload,
        true
    );

    await flushMicrotasks();

    assert.equal(
        transport.writes.length,
        2
    );

    const ack =
        decodeFrame(
            Buffer.from(
                transport.writes[1]
            )
        );

    assert.equal(
        ack.type,
        EBCP_CONTROL_TYPES
            .ACK
    );

    assert.deepEqual(
        ack.payload,
        Buffer.from([
            7
        ])
    );
});

test('EasyConect serializes asynchronous transport writes', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    await connectReady(
        connection,
        transport
    );

    const firstWrite =
        transport.deferNextWrite();

    const first =
        connection.send(
            BOOLEAN_TYPE,
            CHANNEL,
            true
        );

    const second =
        connection.send(
            BOOLEAN_TYPE,
            CHANNEL,
            false
        );

    await flushMicrotasks();

    assert.equal(
        transport.writes.length,
        2
    );

    assert.equal(
        decodeFrame(
            Buffer.from(
                transport.writes[1]
            )
        ).sequence,
        1
    );

    firstWrite.resolve();

    assert.equal(
        await first,
        1
    );

    assert.equal(
        await second,
        2
    );

    assert.equal(
        transport.writes.length,
        3
    );

    assert.equal(
        decodeFrame(
            Buffer.from(
                transport.writes[2]
            )
        ).sequence,
        2
    );
});

test('EasyConect rejects connection and disconnects transport when HELLO write fails', async () => {
    const transport =
        new FakeTransport();

    transport.failNextWrite(
        new Error(
            'physical write failed'
        )
    );

    const connection =
        new EasyConectConnection({
            transport
        });

    await assert.rejects(
        connection.connect({
            deviceId:
                'opaque-device-1'
        }),
        /physical write failed/i
    );

    assert.equal(
        transport.disconnectCalls,
        1
    );
});

test('EasyConect rejects connection when transport disconnects during handshake', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    const connecting =
        connection.connect({
            deviceId:
                'opaque-device-1'
        });

    await flushMicrotasks();

    transport.emitDisconnect();

    await assert.rejects(
        connecting,
        /transport disconnected during connection/i
    );

    assert.equal(
        transport.disconnectCalls,
        1
    );
});

test('EasyConect disconnects cleanly and disables protocol operations', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    await connectReady(
        connection,
        transport
    );

    assert.equal(
        await connection.disconnect(),
        true
    );

    assert.equal(
        transport.disconnectCalls,
        1
    );

    assert.equal(
        await connection.disconnect(),
        false
    );

    await assert.rejects(
        connection.send(
            BOOLEAN_TYPE,
            CHANNEL,
            true
        ),
        /requires an active connection/i
    );

    assert.throws(
        () =>
            connection.waitFor(
                BOOLEAN_TYPE,
                CHANNEL
            ),
        /requires an active connection/i
    );
});

test('EasyConect exposes canonical connection states and starts disconnected', () => {
    assert.deepEqual(
        EASYCONECT_CONNECTION_STATES,
        {
            DISCONNECTED:
                'disconnected',
            CONNECTING:
                'connecting',
            CONNECTED:
                'connected',
            DISCONNECTING:
                'disconnecting'
        }
    );

    assert.equal(
        Object.isFrozen(
            EASYCONECT_CONNECTION_STATES
        ),
        true
    );

    const connection =
        new EasyConectConnection({
            transport:
                new FakeTransport()
        });

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .DISCONNECTED
    );
});

test('EasyConect exposes the successful connection and explicit disconnect lifecycle', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    const states = [];
    const disconnects = [];

    connection.onStateChange(
        state => {
            states.push(
                state
            );
        }
    );

    connection.onDisconnect(
        () => {
            disconnects.push(
                'unexpected'
            );
        }
    );

    await connectReady(
        connection,
        transport
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .CONNECTED
    );

    await connection.disconnect();

    assert.deepEqual(
        states,
        [
            'connecting',
            'connected',
            'disconnecting',
            'disconnected'
        ]
    );

    assert.deepEqual(
        disconnects,
        []
    );
});

test('EasyConect reports an unexpected transport disconnect exactly once', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    const states = [];
    const disconnects = [];

    connection.onStateChange(
        state => {
            states.push(
                state
            );
        }
    );

    connection.onDisconnect(
        () => {
            disconnects.push(
                'lost'
            );
        }
    );

    await connectReady(
        connection,
        transport
    );

    const waiting =
        connection.waitFor(
            BOOLEAN_TYPE,
            CHANNEL
        );

    transport.emitDisconnect();

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .DISCONNECTED
    );

    assert.deepEqual(
        states,
        [
            'connecting',
            'connected',
            'disconnected'
        ]
    );

    assert.deepEqual(
        disconnects,
        [
            'lost'
        ]
    );

    await assert.rejects(
        waiting,
        /connection lost/i
    );

    transport.emitDisconnect();

    assert.deepEqual(
        disconnects,
        [
            'lost'
        ]
    );
});

test('EasyConect rejects pending waiters when explicitly disconnected', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    await connectReady(
        connection,
        transport
    );

    const waiting =
        connection.waitFor(
            BOOLEAN_TYPE,
            CHANNEL
        );

    const waiterRejected =
        assert.rejects(
            waiting,
            /connection closed/i
        );

    await connection.disconnect();

    await waiterRejected;
});

test('EasyConect reports transport errors without declaring a disconnect', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    const errors = [];

    connection.onError(
        error => {
            errors.push(
                error
            );
        }
    );

    await connectReady(
        connection,
        transport
    );

    const error =
        new Error(
            'native transport error'
        );

    transport.emitError(
        error
    );

    assert.deepEqual(
        errors,
        [
            error
        ]
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .CONNECTED
    );
});

test('EasyConect reports asynchronous write errors without inventing a physical disconnect', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    const errors = [];

    connection.onError(
        error => {
            errors.push(
                error
            );
        }
    );

    await connectReady(
        connection,
        transport
    );

    const error =
        new Error(
            'physical write failed'
        );

    transport.failNextWrite(
        error
    );

    await assert.rejects(
        connection.send(
            BOOLEAN_TYPE,
            CHANNEL,
            true
        ),
        /physical write failed/i
    );

    assert.deepEqual(
        errors,
        [
            error
        ]
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .CONNECTED
    );
});

test('EasyConect lifecycle listeners validate inputs and return unsubscribe functions', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    assert.throws(
        () =>
            connection.onStateChange(
                null
            ),
        /state listener must be a function/i
    );

    assert.throws(
        () =>
            connection.onError(
                null
            ),
        /error listener must be a function/i
    );

    assert.throws(
        () =>
            connection.onDisconnect(
                null
            ),
        /disconnect listener must be a function/i
    );

    const states = [];
    const errors = [];
    const disconnects = [];

    const unsubscribeState =
        connection.onStateChange(
            state => {
                states.push(
                    state
                );
            }
        );

    const unsubscribeError =
        connection.onError(
            error => {
                errors.push(
                    error
                );
            }
        );

    const unsubscribeDisconnect =
        connection.onDisconnect(
            () => {
                disconnects.push(
                    'lost'
                );
            }
        );

    assert.equal(
        typeof unsubscribeState,
        'function'
    );

    assert.equal(
        typeof unsubscribeError,
        'function'
    );

    assert.equal(
        typeof unsubscribeDisconnect,
        'function'
    );

    unsubscribeState();
    unsubscribeError();
    unsubscribeDisconnect();

    await connectReady(
        connection,
        transport
    );

    transport.emitError(
        new Error(
            'ignored'
        )
    );

    transport.emitDisconnect();

    assert.deepEqual(
        states,
        []
    );

    assert.deepEqual(
        errors,
        []
    );

    assert.deepEqual(
        disconnects,
        []
    );
});

test('EasyConect isolates lifecycle observer failures from connection semantics', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    connection.onStateChange(
        () => {
            throw new Error(
                'state observer failed'
            );
        }
    );

    connection.onError(
        () => {
            throw new Error(
                'error observer failed'
            );
        }
    );

    connection.onDisconnect(
        () => {
            throw new Error(
                'disconnect observer failed'
            );
        }
    );

    await connectReady(
        connection,
        transport
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .CONNECTED
    );

    assert.doesNotThrow(
        () =>
            transport.emitError(
                new Error(
                    'native transport error'
                )
            )
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .CONNECTED
    );

    assert.doesNotThrow(
        () =>
            transport.emitDisconnect()
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .DISCONNECTED
    );
});

test('EasyConect returns to disconnected when the transport is lost during handshake', async () => {
    const transport =
        new FakeTransport();

    const connection =
        new EasyConectConnection({
            transport
        });

    const states = [];

    connection.onStateChange(
        state => {
            states.push(
                state
            );
        }
    );

    const connecting =
        connection.connect({
            deviceId:
                'opaque-device-1'
        });

    await flushMicrotasks();

    transport.emitDisconnect();

    await assert.rejects(
        connecting,
        /transport disconnected during connection/i
    );

    assert.equal(
        connection.getState(),
        EASYCONECT_CONNECTION_STATES
            .DISCONNECTED
    );

    assert.deepEqual(
        states,
        [
            'connecting',
            'disconnected'
        ]
    );
});
