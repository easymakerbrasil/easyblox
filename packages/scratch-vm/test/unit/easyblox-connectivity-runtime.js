const tap = require('tap');

const {
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

const {
    EBCP_CONTROL_TYPES
} = require('../../src/connectivity/easyblox-connectivity-protocol');

const {
    EasyBloxConnectivityRuntime
} = require('../../src/connectivity/easyblox-connectivity-runtime');

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;

const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

tap.test('connectivity runtime delivers a queued message to a later waiter', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'ligar'
    });

    const message = await runtime.waitFor(
        TEXT,
        'cmd'
    );

    t.same(message, {
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'ligar'
    });
});

tap.test('connectivity runtime preserves FIFO order for the same type and channel', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'primeiro'
    });

    runtime.receive({
        type: TEXT,
        sequence: 2,
        channel: 'cmd',
        payload: 'segundo'
    });

    const first = await runtime.waitFor(
        TEXT,
        'cmd'
    );

    const second = await runtime.waitFor(
        TEXT,
        'cmd'
    );

    t.equal(first.payload, 'primeiro');
    t.equal(second.payload, 'segundo');
});

tap.test('connectivity runtime consumes each queued message only once', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'uma vez'
    });

    const first = await runtime.waitFor(
        TEXT,
        'cmd'
    );

    t.equal(first.payload, 'uma vez');

    let secondResolved = false;

    const secondWait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        secondResolved = true;
        return message;
    });

    await Promise.resolve();

    t.equal(
        secondResolved,
        false,
        'consumed message is not delivered twice'
    );

    runtime.receive({
        type: TEXT,
        sequence: 2,
        channel: 'cmd',
        payload: 'nova'
    });

    const second = await secondWait;

    t.equal(second.payload, 'nova');
});

tap.test('connectivity runtime keeps message types independent on the same channel', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'valor',
        payload: 'texto'
    });

    runtime.receive({
        type: NUMBER,
        sequence: 2,
        channel: 'valor',
        payload: 42
    });

    const numberMessage = await runtime.waitFor(
        NUMBER,
        'valor'
    );

    const textMessage = await runtime.waitFor(
        TEXT,
        'valor'
    );

    t.equal(numberMessage.payload, 42);
    t.equal(textMessage.payload, 'texto');
});

tap.test('connectivity runtime keeps channels independent while preserving compatible FIFO order', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'a',
        payload: 'a1'
    });

    runtime.receive({
        type: TEXT,
        sequence: 2,
        channel: 'b',
        payload: 'b1'
    });

    runtime.receive({
        type: TEXT,
        sequence: 3,
        channel: 'a',
        payload: 'a2'
    });

    const b = await runtime.waitFor(
        TEXT,
        'b'
    );

    const firstA = await runtime.waitFor(
        TEXT,
        'a'
    );

    const secondA = await runtime.waitFor(
        TEXT,
        'a'
    );

    t.equal(b.payload, 'b1');
    t.equal(firstA.payload, 'a1');
    t.equal(secondA.payload, 'a2');
});

tap.test('connectivity runtime releases compatible waiters in FIFO order one at a time', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    let firstResolved = false;
    let secondResolved = false;

    const firstWait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        firstResolved = true;
        return message;
    });

    const secondWait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        secondResolved = true;
        return message;
    });

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'primeiro'
    });

    await Promise.resolve();

    t.equal(firstResolved, true);
    t.equal(
        secondResolved,
        false,
        'one message releases only one waiter'
    );

    runtime.receive({
        type: TEXT,
        sequence: 2,
        channel: 'cmd',
        payload: 'segundo'
    });

    const [
        first,
        second
    ] = await Promise.all([
        firstWait,
        secondWait
    ]);

    t.equal(first.payload, 'primeiro');
    t.equal(second.payload, 'segundo');
});

tap.test('connectivity runtime keeps at most four queued messages and drops the oldest', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    for (let sequence = 1; sequence <= 5; sequence++) {
        runtime.receive({
            type: TEXT,
            sequence,
            channel: 'cmd',
            payload: `m${sequence}`
        });
    }

    const received = [];

    for (let index = 0; index < 4; index++) {
        const message = await runtime.waitFor(
            TEXT,
            'cmd'
        );

        received.push(message.payload);
    }

    t.same(
        received,
        [
            'm2',
            'm3',
            'm4',
            'm5'
        ],
        'the fifth queued message evicts the globally oldest pending message'
    );
});

tap.test('connectivity runtime applies the four-message limit globally across channels', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'a',
        payload: 'a1'
    });

    runtime.receive({
        type: TEXT,
        sequence: 2,
        channel: 'b',
        payload: 'b1'
    });

    runtime.receive({
        type: TEXT,
        sequence: 3,
        channel: 'a',
        payload: 'a2'
    });

    runtime.receive({
        type: TEXT,
        sequence: 4,
        channel: 'b',
        payload: 'b2'
    });

    runtime.receive({
        type: TEXT,
        sequence: 5,
        channel: 'a',
        payload: 'a3'
    });

    const firstA = await runtime.waitFor(
        TEXT,
        'a'
    );

    const secondA = await runtime.waitFor(
        TEXT,
        'a'
    );

    const firstB = await runtime.waitFor(
        TEXT,
        'b'
    );

    const secondB = await runtime.waitFor(
        TEXT,
        'b'
    );

    t.equal(firstA.payload, 'a2');
    t.equal(secondA.payload, 'a3');
    t.equal(firstB.payload, 'b1');
    t.equal(secondB.payload, 'b2');
});

tap.test('connectivity runtime does not queue the same application sequence twice', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'ligar'
    });

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'ligar'
    });

    const first = await runtime.waitFor(
        TEXT,
        'cmd'
    );

    t.equal(first.payload, 'ligar');

    let secondResolved = false;

    const secondWait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        secondResolved = true;
        return message;
    });

    await Promise.resolve();

    t.equal(
        secondResolved,
        false,
        'a retransmission is not queued as a second message'
    );

    runtime.receive({
        type: TEXT,
        sequence: 2,
        channel: 'cmd',
        payload: 'desligar'
    });

    const second = await secondWait;

    t.equal(second.payload, 'desligar');
});

tap.test('connectivity runtime does not release a second waiter for a retransmitted sequence', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    let firstResolved = false;
    let secondResolved = false;

    const firstWait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        firstResolved = true;
        return message;
    });

    const secondWait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        secondResolved = true;
        return message;
    });

    runtime.receive({
        type: TEXT,
        sequence: 10,
        channel: 'cmd',
        payload: 'primeiro'
    });

    await Promise.resolve();

    t.equal(firstResolved, true);
    t.equal(secondResolved, false);

    runtime.receive({
        type: TEXT,
        sequence: 10,
        channel: 'cmd',
        payload: 'primeiro'
    });

    await Promise.resolve();

    t.equal(
        secondResolved,
        false,
        'duplicate sequence does not release another waiter'
    );

    runtime.receive({
        type: TEXT,
        sequence: 11,
        channel: 'cmd',
        payload: 'segundo'
    });

    const [
        first,
        second
    ] = await Promise.all([
        firstWait,
        secondWait
    ]);

    t.equal(first.payload, 'primeiro');
    t.equal(second.payload, 'segundo');
});

tap.test('connectivity runtime deduplicates sequences globally and accepts sequence wraparound', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 255,
        channel: 'a',
        payload: 'ultimo'
    });

    runtime.receive({
        type: TEXT,
        sequence: 255,
        channel: 'b',
        payload: 'duplicado'
    });

    const last = await runtime.waitFor(
        TEXT,
        'a'
    );

    t.equal(last.payload, 'ultimo');

    let duplicateResolved = false;

    const duplicateWait = runtime.waitFor(
        TEXT,
        'b'
    ).then(message => {
        duplicateResolved = true;
        return message;
    });

    await Promise.resolve();

    t.equal(
        duplicateResolved,
        false,
        'sequence identity is connection-wide, not per channel'
    );

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'b',
        payload: 'novo ciclo'
    });

    const wrapped = await duplicateWait;

    t.equal(
        wrapped.payload,
        'novo ciclo',
        'sequence 1 is accepted after sequence 255'
    );
});

tap.test('connectivity runtime clears queued application messages on HELLO', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: TEXT,
        sequence: 7,
        channel: 'cmd',
        payload: 'antigo'
    });

    runtime.receive({
        type: EBCP_CONTROL_TYPES.HELLO,
        sequence: 0,
        channel: '',
        payload: Buffer.alloc(0)
    });

    let resolved = false;

    const wait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        resolved = true;
        return message;
    });

    await Promise.resolve();

    t.equal(
        resolved,
        false,
        'a message from the previous session is not delivered'
    );

    runtime.receive({
        type: TEXT,
        sequence: 7,
        channel: 'cmd',
        payload: 'novo'
    });

    const message = await wait;

    t.equal(
        message.payload,
        'novo',
        'the same application sequence is accepted in the new session'
    );
});

tap.test('connectivity runtime treats HELLO_ACK as a session boundary', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    runtime.receive({
        type: NUMBER,
        sequence: 12,
        channel: 'valor',
        payload: 10
    });

    runtime.receive({
        type: EBCP_CONTROL_TYPES.HELLO_ACK,
        sequence: 0,
        channel: '',
        payload: Buffer.alloc(0)
    });

    let resolved = false;

    const wait = runtime.waitFor(
        NUMBER,
        'valor'
    ).then(message => {
        resolved = true;
        return message;
    });

    await Promise.resolve();

    t.equal(
        resolved,
        false,
        'HELLO_ACK discards queued data from the previous session'
    );

    runtime.receive({
        type: NUMBER,
        sequence: 12,
        channel: 'valor',
        payload: 20
    });

    const message = await wait;

    t.equal(message.payload, 20);
});

tap.test('connectivity runtime keeps active waiters across a new session', async t => {
    const runtime = new EasyBloxConnectivityRuntime();

    let resolved = false;

    const wait = runtime.waitFor(
        TEXT,
        'cmd'
    ).then(message => {
        resolved = true;
        return message;
    });

    runtime.receive({
        type: EBCP_CONTROL_TYPES.HELLO,
        sequence: 0,
        channel: '',
        payload: Buffer.alloc(0)
    });

    await Promise.resolve();

    t.equal(
        resolved,
        false,
        'session reset does not cancel an active waiter'
    );

    runtime.receive({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'primeira mensagem'
    });

    const message = await wait;

    t.equal(message.payload, 'primeira mensagem');
});

tap.test('connectivity runtime advances its session generation on HELLO and HELLO_ACK', t => {
    const runtime = new EasyBloxConnectivityRuntime();

    t.equal(
        runtime.sessionGeneration,
        0,
        'the initial session generation is zero'
    );

    runtime.receive({
        type: EBCP_CONTROL_TYPES.HELLO,
        sequence: 0,
        channel: '',
        payload: Buffer.alloc(0)
    });

    t.equal(
        runtime.sessionGeneration,
        1,
        'HELLO starts a new session generation'
    );

    runtime.receive({
        type: EBCP_CONTROL_TYPES.HELLO_ACK,
        sequence: 0,
        channel: '',
        payload: Buffer.alloc(0)
    });

    t.equal(
        runtime.sessionGeneration,
        2,
        'HELLO_ACK starts another session generation'
    );

    t.end();
});
