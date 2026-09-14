const {Buffer} = require('buffer');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT,
    EBCP_CONTROL_TYPES,
    encodeFrame,
    decodeFrame,
    EasyBloxConnectivityRuntime,
    EasyBloxConnectivitySession
} = require('..');

const BOOLEAN_TYPE =
    EBCP_CONTRACT
        .messageTypes
        .BOOLEAN;

const CHANNEL =
    'gamepad.dpad.up';

test('EBCP v1 declares receipt ACK without automatic retransmission', () => {
    assert.equal(
        EBCP_CONTRACT
            .acknowledgement,
        'receipt-ack'
    );

    assert.equal(
        EBCP_CONTRACT
            .retransmission,
        'none'
    );

    assert.equal(
        EBCP_CONTRACT
            .duplicateSuppression,
        'last-sequence'
    );
});

test('EBCP session sends consecutive application frames without waiting for ACK', () => {
    const runtime =
        new EasyBloxConnectivityRuntime();

    const written = [];

    const session =
        new EasyBloxConnectivitySession({
            runtime,
            write: bytes => {
                written.push(
                    Buffer.from(bytes)
                );
            }
        });

    assert.equal(
        session.send(
            BOOLEAN_TYPE,
            CHANNEL,
            true
        ),
        1
    );

    assert.equal(
        session.send(
            BOOLEAN_TYPE,
            CHANNEL,
            false
        ),
        2
    );

    assert.equal(
        written.length,
        2
    );

    assert.equal(
        decodeFrame(
            written[0]
        ).sequence,
        1
    );

    assert.equal(
        decodeFrame(
            written[1]
        ).sequence,
        2
    );
});

test('EBCP session consumes ACK without writes or outgoing sequence changes', () => {
    const runtime =
        new EasyBloxConnectivityRuntime();

    const written = [];

    const session =
        new EasyBloxConnectivitySession({
            runtime,
            write: bytes => {
                written.push(
                    Buffer.from(bytes)
                );
            }
        });

    assert.equal(
        session.send(
            BOOLEAN_TYPE,
            CHANNEL,
            true
        ),
        1
    );

    assert.equal(
        written.length,
        1
    );

    session.push(
        encodeFrame({
            type:
                EBCP_CONTROL_TYPES
                    .ACK,
            sequence: 0,
            channel: '',
            payload:
                Buffer.from([
                    1
                ])
        })
    );

    assert.equal(
        written.length,
        1
    );

    assert.equal(
        session.send(
            BOOLEAN_TYPE,
            CHANNEL,
            false
        ),
        2
    );

    assert.equal(
        written.length,
        2
    );

    assert.equal(
        decodeFrame(
            written[1]
        ).sequence,
        2
    );
});
