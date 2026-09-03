const tap = require('tap');

const {
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

const {
    EBCP_CONTROL_TYPES,
    encodeFrame,
    decodeFrame,
    EasyBloxConnectivityParser
} = require('../../src/connectivity/easyblox-connectivity-protocol');

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

tap.test('EBCP v1 assigns the canonical control message opcodes', t => {
    t.same(EBCP_CONTROL_TYPES, {
        ACK: 0x80,
        HELLO: 0x81,
        HELLO_ACK: 0x82
    });

    t.end();
});

tap.test('EBCP v1 encodes the canonical TEXT golden frame', t => {
    const frame = encodeFrame({
        type: TEXT,
        sequence: 0x2A,
        channel: 'cmd',
        payload: 'go'
    });

    t.same(
        frame,
        Buffer.from([
            0x45, 0x42,
            0x01,
            0x01,
            0x2A,
            0x03,
            0x02,
            0x63, 0x6D, 0x64,
            0x67, 0x6F,
            0x49
        ])
    );

    t.end();
});

tap.test('EBCP v1 decodes the canonical TEXT golden frame', t => {
    const decoded = decodeFrame(Buffer.from([
        0x45, 0x42,
        0x01,
        0x01,
        0x2A,
        0x03,
        0x02,
        0x63, 0x6D, 0x64,
        0x67, 0x6F,
        0x49
    ]));

    t.same(decoded, {
        version: 0x01,
        type: TEXT,
        sequence: 0x2A,
        channel: 'cmd',
        payload: 'go'
    });

    t.end();
});

tap.test('EBCP v1 encodes NUMBER as little-endian IEEE-754 binary32', t => {
    const frame = encodeFrame({
        type: NUMBER,
        sequence: 0x07,
        channel: 'joyX',
        payload: -0.75
    });

    t.same(
        frame,
        Buffer.from([
            0x45, 0x42,
            0x01,
            0x02,
            0x07,
            0x04,
            0x04,
            0x6A, 0x6F, 0x79, 0x58,
            0x00, 0x00, 0x40, 0xBF,
            0xDF
        ])
    );

    const decoded = decodeFrame(frame);

    t.equal(decoded.version, 0x01);
    t.equal(decoded.type, NUMBER);
    t.equal(decoded.sequence, 0x07);
    t.equal(decoded.channel, 'joyX');
    t.equal(decoded.payload, -0.75);

    t.end();
});

tap.test('EBCP v1 supports UTF-8 TEXT while enforcing the payload limit in bytes', t => {
    const accepted = 'á'.repeat(16);

    const frame = encodeFrame({
        type: TEXT,
        sequence: 1,
        channel: 'texto',
        payload: accepted
    });

    const decoded = decodeFrame(frame);

    t.equal(Buffer.byteLength(accepted, 'utf8'), 32);
    t.equal(decoded.payload, accepted);

    t.throws(() => encodeFrame({
        type: TEXT,
        sequence: 2,
        channel: 'texto',
        payload: 'á'.repeat(17)
    }));

    t.end();
});

tap.test('EBCP v1 enforces the canonical channel identifier contract', t => {
    const valid = encodeFrame({
        type: TEXT,
        sequence: 1,
        channel: 'motor_A-1.2',
        payload: 'ok'
    });

    t.ok(Buffer.isBuffer(valid));

    t.throws(() => encodeFrame({
        type: TEXT,
        sequence: 1,
        channel: '',
        payload: 'ok'
    }));

    t.throws(() => encodeFrame({
        type: TEXT,
        sequence: 1,
        channel: 'canal com espaço',
        payload: 'ok'
    }));

    t.throws(() => encodeFrame({
        type: TEXT,
        sequence: 1,
        channel: 'canal_com_acentó',
        payload: 'ok'
    }));

    t.throws(() => encodeFrame({
        type: TEXT,
        sequence: 1,
        channel: 'abcdefghijklmnopq',
        payload: 'ok'
    }));

    t.end();
});

tap.test('EBCP v1 validates sequence and NUMBER values', t => {
    t.throws(() => encodeFrame({
        type: NUMBER,
        sequence: -1,
        channel: 'valor',
        payload: 1
    }));

    t.throws(() => encodeFrame({
        type: NUMBER,
        sequence: 256,
        channel: 'valor',
        payload: 1
    }));

    t.throws(() => encodeFrame({
        type: NUMBER,
        sequence: 1.5,
        channel: 'valor',
        payload: 1
    }));

    t.throws(() => encodeFrame({
        type: NUMBER,
        sequence: 1,
        channel: 'valor',
        payload: NaN
    }));

    t.throws(() => encodeFrame({
        type: NUMBER,
        sequence: 1,
        channel: 'valor',
        payload: Infinity
    }));

    t.end();
});

tap.test('EBCP v1 supports a maximum 56-byte frame', t => {
    const frame = encodeFrame({
        type: TEXT,
        sequence: 0xFF,
        channel: 'abcdefghijklmnop',
        payload: 'x'.repeat(32)
    });

    t.equal(frame.length, EBCP_CONTRACT.maxFrameBytes);
    t.equal(frame.length, 56);

    t.end();
});

tap.test('EBCP v1 rejects invalid magic, version, size and checksum', t => {
    const valid = encodeFrame({
        type: TEXT,
        sequence: 1,
        channel: 'cmd',
        payload: 'go'
    });

    const invalidMagic = Buffer.from(valid);
    invalidMagic[0] = 0x00;
    t.throws(() => decodeFrame(invalidMagic));

    const invalidVersion = Buffer.from(valid);
    invalidVersion[2] = 0x02;
    t.throws(() => decodeFrame(invalidVersion));

    const invalidSize = valid.subarray(0, valid.length - 1);
    t.throws(() => decodeFrame(invalidSize));

    const invalidChecksum = Buffer.from(valid);
    invalidChecksum[invalidChecksum.length - 1] ^= 0xFF;
    t.throws(() => decodeFrame(invalidChecksum));

    t.end();
});

tap.test('EBCP v1 encodes ACK with the acknowledged sequence in its payload', t => {
    const frame = encodeFrame({
        type: EBCP_CONTROL_TYPES.ACK,
        sequence: 0,
        channel: '',
        payload: Buffer.from([0x2A])
    });

    t.same(
        frame,
        Buffer.from([
            0x45, 0x42,
            0x01,
            0x80,
            0x00,
            0x00,
            0x01,
            0x2A,
            0xAA
        ])
    );

    const decoded = decodeFrame(frame);

    t.equal(decoded.type, EBCP_CONTROL_TYPES.ACK);
    t.equal(decoded.sequence, 0);
    t.equal(decoded.channel, '');
    t.same(decoded.payload, Buffer.from([0x2A]));

    t.end();
});

tap.test('EBCP v1 supports zero-payload HELLO and HELLO_ACK control frames', t => {
    for (const type of [
        EBCP_CONTROL_TYPES.HELLO,
        EBCP_CONTROL_TYPES.HELLO_ACK
    ]) {
        const frame = encodeFrame({
            type,
            sequence: 0,
            channel: '',
            payload: Buffer.alloc(0)
        });

        const decoded = decodeFrame(frame);

        t.equal(decoded.type, type);
        t.equal(decoded.sequence, 0);
        t.equal(decoded.channel, '');
        t.same(decoded.payload, Buffer.alloc(0));
    }

    t.end();
});

tap.test('EBCP parser accepts a frame arriving one byte at a time', t => {
    const parser = new EasyBloxConnectivityParser();

    const frame = encodeFrame({
        type: TEXT,
        sequence: 9,
        channel: 'cmd',
        payload: 'frente'
    });

    const received = [];

    for (const byte of frame) {
        received.push(...parser.push(Buffer.from([byte])));
    }

    t.same(received, [{
        version: 0x01,
        type: TEXT,
        sequence: 9,
        channel: 'cmd',
        payload: 'frente'
    }]);

    t.end();
});

tap.test('EBCP parser emits consecutive frames from a single chunk', t => {
    const parser = new EasyBloxConnectivityParser();

    const first = encodeFrame({
        type: TEXT,
        sequence: 10,
        channel: 'cmd',
        payload: 'frente'
    });

    const second = encodeFrame({
        type: NUMBER,
        sequence: 11,
        channel: 'speed',
        payload: 75
    });

    const received = parser.push(Buffer.concat([
        first,
        second
    ]));

    t.equal(received.length, 2);

    t.same(received[0], {
        version: 0x01,
        type: TEXT,
        sequence: 10,
        channel: 'cmd',
        payload: 'frente'
    });

    t.equal(received[1].version, 0x01);
    t.equal(received[1].type, NUMBER);
    t.equal(received[1].sequence, 11);
    t.equal(received[1].channel, 'speed');
    t.equal(received[1].payload, 75);

    t.end();
});

tap.test('EBCP parser ignores garbage before a valid magic sequence', t => {
    const parser = new EasyBloxConnectivityParser();

    const valid = encodeFrame({
        type: TEXT,
        sequence: 12,
        channel: 'cmd',
        payload: 'stop'
    });

    const received = parser.push(Buffer.concat([
        Buffer.from([
            0x00,
            0x12,
            0x45,
            0x00,
            0x99,
            0x42
        ]),
        valid
    ]));

    t.same(received, [{
        version: 0x01,
        type: TEXT,
        sequence: 12,
        channel: 'cmd',
        payload: 'stop'
    }]);

    t.end();
});

tap.test('EBCP parser discards a bad checksum and resynchronizes on the next valid frame', t => {
    const parser = new EasyBloxConnectivityParser();

    const corrupted = encodeFrame({
        type: TEXT,
        sequence: 13,
        channel: 'cmd',
        payload: 'bad'
    });

    corrupted[corrupted.length - 1] ^= 0xFF;

    const valid = encodeFrame({
        type: TEXT,
        sequence: 14,
        channel: 'cmd',
        payload: 'good'
    });

    const received = parser.push(Buffer.concat([
        corrupted,
        valid
    ]));

    t.same(received, [{
        version: 0x01,
        type: TEXT,
        sequence: 14,
        channel: 'cmd',
        payload: 'good'
    }]);

    t.end();
});

tap.test('EBCP parser rejects impossible lengths and resynchronizes on the next frame', t => {
    const parser = new EasyBloxConnectivityParser();

    const impossibleHeader = Buffer.from([
        0x45, 0x42,
        0x01,
        0x01,
        0x20,
        0xFF,
        0xFF
    ]);

    const valid = encodeFrame({
        type: TEXT,
        sequence: 15,
        channel: 'cmd',
        payload: 'recovered'
    });

    const received = parser.push(Buffer.concat([
        impossibleHeader,
        valid
    ]));

    t.same(received, [{
        version: 0x01,
        type: TEXT,
        sequence: 15,
        channel: 'cmd',
        payload: 'recovered'
    }]);

    t.end();
});

tap.test('EBCP parser preserves a split magic sequence across chunks', t => {
    const parser = new EasyBloxConnectivityParser();

    const valid = encodeFrame({
        type: TEXT,
        sequence: 16,
        channel: 'cmd',
        payload: 'split'
    });

    t.same(parser.push(Buffer.from([
        0x00,
        0x99,
        0x45
    ])), []);

    t.same(parser.push(valid.subarray(1)), [{
        version: 0x01,
        type: TEXT,
        sequence: 16,
        channel: 'cmd',
        payload: 'split'
    }]);

    t.end();
});

tap.test('EBCP parser rejects an unsupported version and resynchronizes on the next frame', t => {
    const parser = new EasyBloxConnectivityParser();

    const unsupportedHeader = Buffer.from([
        0x45, 0x42,
        0x02,
        0x01,
        0x01,
        0x01,
        0x01
    ]);

    const valid = encodeFrame({
        type: TEXT,
        sequence: 17,
        channel: 'cmd',
        payload: 'version'
    });

    const received = parser.push(Buffer.concat([
        unsupportedHeader,
        valid
    ]));

    t.same(received, [{
        version: 0x01,
        type: TEXT,
        sequence: 17,
        channel: 'cmd',
        payload: 'version'
    }]);

    t.end();
});

tap.test('EBCP parser validates its input and ignores an empty chunk', t => {
    const parser = new EasyBloxConnectivityParser();

    t.throws(() => parser.push('not-a-buffer'));
    t.same(parser.push(Buffer.alloc(0)), []);

    t.end();
});

tap.test('EBCP parser abandons a plausible truncated frame when a complete valid frame follows it', t => {
    const parser = new EasyBloxConnectivityParser();

    const truncated = Buffer.from([
        0x45, 0x42,
        0x01,
        0x01,
        0x20,
        0x01,
        0x20,
        0x63
    ]);

    const valid = encodeFrame({
        type: TEXT,
        sequence: 18,
        channel: 'cmd',
        payload: 'recovered'
    });

    const received = parser.push(Buffer.concat([
        truncated,
        valid
    ]));

    t.same(received, [{
        version: 0x01,
        type: TEXT,
        sequence: 18,
        channel: 'cmd',
        payload: 'recovered'
    }]);

    t.end();
});
