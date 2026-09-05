const test = require('node:test');
const assert = require('node:assert/strict');
const {Buffer} = require('buffer');

const {
    ControllerConnectivityClient
} = require('../src/controller-connectivity-client');

const controllerCore = require('..');

const {
    EBCP_CONTRACT,
    encodeFrame,
    decodeFrame
} = require('@easymaker/easyblox-connectivity-core');

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

test('Controller Core exposes the connectivity client from its public API', () => {
    assert.equal(
        controllerCore.ControllerConnectivityClient,
        ControllerConnectivityClient
    );
});

test('Controller Connectivity Client requires a transport writer', () => {
    assert.throws(
        () => new ControllerConnectivityClient({
            write: null
        }),
        /write must be a function/i
    );
});

test('Controller Connectivity Client sends TEXT on the hidden canonical channel', () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const sequence = client.sendText('frente');

    assert.equal(sequence, 1);
    assert.equal(writes.length, 1);

    assert.deepEqual(
        decodeFrame(writes[0]),
        {
            version: EBCP_CONTRACT.version,
            type: TEXT,
            sequence: 1,
            channel: '1',
            payload: 'frente'
        }
    );
});

test('Controller Connectivity Client sends NUMBER on the hidden canonical channel', () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const sequence = client.sendNumber(12.5);

    assert.equal(sequence, 1);
    assert.equal(writes.length, 1);

    assert.deepEqual(
        decodeFrame(writes[0]),
        {
            version: EBCP_CONTRACT.version,
            type: NUMBER,
            sequence: 1,
            channel: '1',
            payload: 12.5
        }
    );
});

test('Controller Connectivity Client receives TEXT without exposing EBCP metadata', async () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const receivedText = client.waitText();

    client.receive(encodeFrame({
        type: TEXT,
        sequence: 7,
        channel: '1',
        payload: 'ligado'
    }));

    assert.equal(
        await receivedText,
        'ligado'
    );

    assert.equal(
        decodeFrame(writes[0]).type,
        0x80
    );
});

test('Controller Connectivity Client receives NUMBER without exposing EBCP metadata', async () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const receivedNumber = client.waitNumber();

    client.receive(encodeFrame({
        type: NUMBER,
        sequence: 9,
        channel: '1',
        payload: 27.5
    }));

    assert.equal(
        await receivedNumber,
        27.5
    );

    assert.equal(
        decodeFrame(writes[0]).type,
        0x80
    );
});

test('Controller Connectivity Client starts an EBCP session without exposing protocol details', async () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const ready = client.startSession();

    assert.equal(
        writes.length,
        1
    );

    const hello = decodeFrame(writes[0]);

    assert.equal(
        hello.type,
        0x81
    );

    assert.equal(
        hello.sequence,
        0
    );

    assert.equal(
        hello.channel,
        ''
    );

    client.receive(encodeFrame({
        type: 0x82,
        sequence: 0,
        channel: '',
        payload: Buffer.alloc(0)
    }));

    await ready;
});
