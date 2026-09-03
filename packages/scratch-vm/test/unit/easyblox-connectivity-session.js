const tap = require('tap');

const {
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

const {
    EBCP_CONTROL_TYPES,
    encodeFrame
} = require('../../src/connectivity/easyblox-connectivity-protocol');

const {
    EasyBloxConnectivityRuntime
} = require('../../src/connectivity/easyblox-connectivity-runtime');

const {
    EasyBloxConnectivitySession
} = require('../../src/connectivity/easyblox-connectivity-session');

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;

const createSession = () => {
    const runtime = new EasyBloxConnectivityRuntime();
    const writes = [];

    const session = new EasyBloxConnectivitySession({
        runtime,
        write: bytes => {
            writes.push(Buffer.from(bytes));
        }
    });

    return {
        runtime,
        session,
        writes
    };
};

const createTextFrame = (
    sequence = 0x2A,
    channel = 'cmd',
    payload = 'go'
) => encodeFrame({
    type: TEXT,
    sequence,
    channel,
    payload
});

const createAckFrame = sequence => encodeFrame({
    type: EBCP_CONTROL_TYPES.ACK,
    sequence: 0,
    channel: '',
    payload: Buffer.from([sequence])
});

const createHelloFrame = () => encodeFrame({
    type: EBCP_CONTROL_TYPES.HELLO,
    sequence: 0,
    channel: '',
    payload: Buffer.alloc(0)
});

const createHelloAckFrame = () => encodeFrame({
    type: EBCP_CONTROL_TYPES.HELLO_ACK,
    sequence: 0,
    channel: '',
    payload: Buffer.alloc(0)
});

tap.test(
    'EBCP session delivers an application frame and ACKs its sequence',
    async t => {
        const {
            runtime,
            session,
            writes
        } = createSession();

        session.push(createTextFrame());

        const message = await runtime.waitFor(
            TEXT,
            'cmd'
        );

        t.equal(message.payload, 'go');

        t.equal(
            writes.length,
            1,
            'one ACK is written'
        );

        t.same(
            writes[0],
            createAckFrame(0x2A),
            'ACK contains the received application sequence'
        );
    }
);

tap.test(
    'EBCP session re-ACKs a duplicate without delivering it twice',
    async t => {
        const {
            runtime,
            session,
            writes
        } = createSession();

        const frame = createTextFrame(
            0x31,
            'cmd',
            'once'
        );

        session.push(frame);
        session.push(frame);

        const firstMessage = await runtime.waitFor(
            TEXT,
            'cmd'
        );

        t.equal(firstMessage.payload, 'once');

        t.equal(
            writes.length,
            2,
            'both original and retransmission are ACKed'
        );

        t.same(writes[0], createAckFrame(0x31));
        t.same(writes[1], createAckFrame(0x31));

        let duplicateDelivered = false;

        runtime.waitFor(
            TEXT,
            'cmd'
        ).then(() => {
            duplicateDelivered = true;
        });

        await Promise.resolve();

        t.equal(
            duplicateDelivered,
            false,
            'duplicate is not delivered a second time'
        );
    }
);

tap.test(
    'EBCP HELLO starts a new session and replies with HELLO_ACK',
    async t => {
        const {
            runtime,
            session,
            writes
        } = createSession();

        const applicationFrame = createTextFrame(
            0x44,
            'session',
            'value'
        );

        session.push(applicationFrame);

        const firstMessage = await runtime.waitFor(
            TEXT,
            'session'
        );

        t.equal(firstMessage.payload, 'value');
        t.equal(runtime.sessionGeneration, 0);

        session.push(createHelloFrame());

        t.equal(
            runtime.sessionGeneration,
            1,
            'HELLO advances the session generation'
        );

        session.push(applicationFrame);

        const secondMessage = await runtime.waitFor(
            TEXT,
            'session'
        );

        t.equal(
            secondMessage.payload,
            'value',
            'same application sequence is accepted in the new session'
        );

        t.equal(writes.length, 3);
        t.same(writes[0], createAckFrame(0x44));
        t.same(writes[1], createHelloAckFrame());
        t.same(writes[2], createAckFrame(0x44));
    }
);

tap.test(
    'EBCP HELLO_ACK is a session boundary without another control reply',
    t => {
        const {
            runtime,
            session,
            writes
        } = createSession();

        session.push(createHelloAckFrame());

        t.equal(
            runtime.sessionGeneration,
            1
        );

        t.equal(
            writes.length,
            0,
            'HELLO_ACK is not answered recursively'
        );

        t.end();
    }
);

tap.test(
    'EBCP session consumes ACK control frames outside the application runtime',
    t => {
        const received = [];
        const writes = [];

        const session = new EasyBloxConnectivitySession({
            runtime: {
                receive: message => {
                    received.push(message);
                }
            },
            write: bytes => {
                writes.push(Buffer.from(bytes));
            }
        });

        session.push(createAckFrame(0x2A));

        t.equal(
            received.length,
            0,
            'ACK does not reach the application runtime'
        );

        t.equal(
            writes.length,
            0,
            'ACK does not produce another ACK'
        );

        t.end();
    }
);

tap.test(
    'EBCP session drops an invalid checksum without delivery or ACK',
    t => {
        const received = [];
        const writes = [];

        const session = new EasyBloxConnectivitySession({
            runtime: {
                receive: message => {
                    received.push(message);
                }
            },
            write: bytes => {
                writes.push(Buffer.from(bytes));
            }
        });

        const invalidFrame = Buffer.from(
            createTextFrame(
                0x52,
                'cmd',
                'invalid'
            )
        );

        invalidFrame[invalidFrame.length - 1] ^= 0xFF;

        session.push(invalidFrame);

        t.equal(
            received.length,
            0,
            'invalid frame is not delivered'
        );

        t.equal(
            writes.length,
            0,
            'invalid frame is not acknowledged'
        );

        t.end();
    }
);

tap.test(
    'EBCP session reassembles an application frame from transport chunks',
    async t => {
        const {
            runtime,
            session,
            writes
        } = createSession();

        const frame = createTextFrame(
            0x55,
            'chunk',
            'fragmented'
        );

        session.push(
            frame.subarray(0, 5)
        );

        t.equal(
            writes.length,
            0,
            'incomplete frame produces no response'
        );

        session.push(
            frame.subarray(5)
        );

        const message = await runtime.waitFor(
            TEXT,
            'chunk'
        );

        t.equal(
            message.payload,
            'fragmented'
        );

        t.equal(writes.length, 1);
        t.same(writes[0], createAckFrame(0x55));
    }
);
