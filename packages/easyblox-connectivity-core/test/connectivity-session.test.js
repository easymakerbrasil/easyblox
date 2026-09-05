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
