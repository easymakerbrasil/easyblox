const test = require('node:test');
const assert = require('node:assert/strict');
const {Buffer} = require('buffer');

const {
    EBCP_CONTRACT,
    EBCP_CONTROL_TYPES,
    encodeFrame,
    decodeFrame,
    EasyBloxConnectivityRuntime,
    EasyBloxConnectivitySession
} = require('..');

const createControlFrame = type => encodeFrame({
    type,
    sequence: 0,
    channel: '',
    payload: Buffer.alloc(0)
});

test('EBCP session initiates HELLO and resolves after HELLO_ACK', async () => {
    const writes = [];
    const runtime = new EasyBloxConnectivityRuntime();

    const session = new EasyBloxConnectivitySession({
        runtime,
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const ready = session.start();

    assert.equal(
        writes.length,
        1
    );

    assert.deepEqual(
        decodeFrame(writes[0]),
        {
            version: EBCP_CONTRACT.version,
            type: EBCP_CONTROL_TYPES.HELLO,
            sequence: 0,
            channel: '',
            payload: Buffer.alloc(0)
        }
    );

    let resolved = false;

    ready.then(() => {
        resolved = true;
    });

    await Promise.resolve();

    assert.equal(
        resolved,
        false
    );

    session.push(
        createControlFrame(
            EBCP_CONTROL_TYPES.HELLO_ACK
        )
    );

    await ready;

    assert.equal(
        resolved,
        true
    );

    assert.equal(
        runtime.sessionGeneration,
        1
    );
});

test('EBCP session probes peer liveness with PING and resolves after PONG', async () => {
    const writes = [];
    const runtime =
        new EasyBloxConnectivityRuntime();

    const session =
        new EasyBloxConnectivitySession({
            runtime,
            write: frame => {
                writes.push(
                    Buffer.from(frame)
                );
            }
        });

    const probe =
        session.probe();

    assert.equal(
        writes.length,
        1
    );

    assert.equal(
        decodeFrame(
            writes[0]
        ).type,
        EBCP_CONTROL_TYPES.PING
    );

    let resolved = false;

    probe.then(() => {
        resolved = true;
    });

    await Promise.resolve();

    assert.equal(
        resolved,
        false
    );

    session.push(
        createControlFrame(
            EBCP_CONTROL_TYPES.PONG
        )
    );

    await probe;

    assert.equal(
        resolved,
        true
    );

    assert.equal(
        runtime.sessionGeneration,
        0
    );
});

test('EBCP session answers PING with PONG without changing application session state', () => {
    const writes = [];
    const runtime =
        new EasyBloxConnectivityRuntime();

    const session =
        new EasyBloxConnectivitySession({
            runtime,
            write: frame => {
                writes.push(
                    Buffer.from(frame)
                );
            }
        });

    session.push(
        createControlFrame(
            EBCP_CONTROL_TYPES.PING
        )
    );

    assert.equal(
        writes.length,
        1
    );

    assert.equal(
        decodeFrame(
            writes[0]
        ).type,
        EBCP_CONTROL_TYPES.PONG
    );

    assert.equal(
        runtime.sessionGeneration,
        0
    );
});
