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

const createBooleanMessage =
    (
        sequence,
        payload
    ) => ({
        version:
            EBCP_CONTRACT.version,
        type:
            BOOLEAN_TYPE,
        sequence,
        channel:
            CHANNEL,
        payload
    });

test('EBCP runtime retains BOOLEAN messages until a matching waiter consumes them', async () => {
    const runtime =
        new EasyBloxConnectivityRuntime();

    runtime.receive(
        createBooleanMessage(
            1,
            true
        )
    );

    assert.deepEqual(
        await runtime.waitFor(
            BOOLEAN_TYPE,
            CHANNEL
        ),
        createBooleanMessage(
            1,
            true
        )
    );
});

test('EBCP runtime delivers BOOLEAN messages directly to a pending waiter', async () => {
    const runtime =
        new EasyBloxConnectivityRuntime();

    const waiting =
        runtime.waitFor(
            BOOLEAN_TYPE,
            CHANNEL
        );

    runtime.receive(
        createBooleanMessage(
            2,
            false
        )
    );

    assert.deepEqual(
        await waiting,
        createBooleanMessage(
            2,
            false
        )
    );
});

test('EBCP runtime preserves FIFO order for BOOLEAN messages on the same channel', async () => {
    const runtime =
        new EasyBloxConnectivityRuntime();

    runtime.receive(
        createBooleanMessage(
            3,
            true
        )
    );

    runtime.receive(
        createBooleanMessage(
            4,
            false
        )
    );

    assert.equal(
        (
            await runtime.waitFor(
                BOOLEAN_TYPE,
                CHANNEL
            )
        ).payload,
        true
    );

    assert.equal(
        (
            await runtime.waitFor(
                BOOLEAN_TYPE,
                CHANNEL
            )
        ).payload,
        false
    );
});

test('EBCP session sends BOOLEAN through the transport-neutral writer', () => {
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

    assert.deepEqual(
        decodeFrame(
            written[0]
        ),
        createBooleanMessage(
            1,
            true
        )
    );
});

test('EBCP session delivers received BOOLEAN to runtime and ACKs its sequence', async () => {
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

    const waiting =
        runtime.waitFor(
            BOOLEAN_TYPE,
            CHANNEL
        );

    session.push(
        encodeFrame({
            type:
                BOOLEAN_TYPE,
            sequence: 7,
            channel:
                CHANNEL,
            payload: false
        })
    );

    assert.equal(
        (
            await waiting
        ).payload,
        false
    );

    assert.equal(
        written.length,
        1
    );

    const ack =
        decodeFrame(
            written[0]
        );

    assert.equal(
        ack.type,
        EBCP_CONTROL_TYPES.ACK
    );

    assert.equal(
        ack.sequence,
        0
    );

    assert.deepEqual(
        ack.payload,
        Buffer.from([
            7
        ])
    );
});

test('EBCP session ACKs duplicate BOOLEAN retransmissions without delivering them twice', async () => {
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

    const frame =
        encodeFrame({
            type:
                BOOLEAN_TYPE,
            sequence: 9,
            channel:
                CHANNEL,
            payload: true
        });

    session.push(frame);
    session.push(frame);

    assert.equal(
        (
            await runtime.waitFor(
                BOOLEAN_TYPE,
                CHANNEL
            )
        ).payload,
        true
    );

    assert.equal(
        written.length,
        2
    );

    for (
        const writtenFrame of
        written
    ) {
        const ack =
            decodeFrame(
                writtenFrame
            );

        assert.equal(
            ack.type,
            EBCP_CONTROL_TYPES.ACK
        );

        assert.deepEqual(
            ack.payload,
            Buffer.from([
                9
            ])
        );
    }
});
