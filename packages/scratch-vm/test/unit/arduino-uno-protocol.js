const tap = require('tap');

const {
    COMMANDS,
    PROTOCOL_VERSION,
    RESPONSES,
    StageProtocolParser,
    calculateChecksum,
    encodeFrame
} = require('../../src/extensions/scratch3_arduino_uno/protocol');

tap.test('calculates XOR checksum', t => {
    t.equal(
        calculateChecksum(new Uint8Array([0x01, 0x02, 0x03])),
        0x00
    );

    t.equal(
        calculateChecksum(new Uint8Array([0x01, 0x10, 0x02, 0x0D])),
        0x1E
    );

    t.end();
});

tap.test('encodes PING frame', t => {
    const frame = encodeFrame(
        0x01,
        COMMANDS.PING
    );

    t.same(
        Array.from(frame),
        [
            0xFF,
            0x55,
            PROTOCOL_VERSION,
            0x01,
            COMMANDS.PING,
            0x00,
            0x01
        ]
    );

    t.end();
});

tap.test('encodes DIGITAL_WRITE payload', t => {
    const frame = encodeFrame(
        0x2A,
        COMMANDS.DIGITAL_WRITE,
        [13, 1]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x2A);
    t.equal(frame[4], COMMANDS.DIGITAL_WRITE);
    t.equal(frame[5], 2);
    t.equal(frame[6], 13);
    t.equal(frame[7], 1);

    t.equal(
        frame[8],
        calculateChecksum(frame.subarray(2, 8))
    );

    t.end();
});

tap.test('parses a complete frame', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    parser.push(
        encodeFrame(
            0x03,
            RESPONSES.PONG,
            [0x42]
        )
    );

    t.equal(frames.length, 1);
    t.equal(frames[0].version, PROTOCOL_VERSION);
    t.equal(frames[0].sequence, 0x03);
    t.equal(frames[0].command, RESPONSES.PONG);

    t.same(
        Array.from(frames[0].payload),
        [0x42]
    );

    t.end();
});

tap.test('parses a frame received in chunks', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    const frame = encodeFrame(
        0x04,
        RESPONSES.ACK,
        [0x10]
    );

    parser.push(frame.subarray(0, 2));

    t.equal(frames.length, 0);

    parser.push(frame.subarray(2, 5));

    t.equal(frames.length, 0);

    parser.push(frame.subarray(5));

    t.equal(frames.length, 1);
    t.equal(frames[0].sequence, 0x04);
    t.equal(frames[0].command, RESPONSES.ACK);

    t.same(
        Array.from(frames[0].payload),
        [0x10]
    );

    t.end();
});

tap.test('parses consecutive frames from one serial chunk', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    const first = encodeFrame(
        0x01,
        RESPONSES.PONG
    );

    const second = encodeFrame(
        0x02,
        RESPONSES.ACK,
        [COMMANDS.DIGITAL_WRITE]
    );

    const combined = new Uint8Array(
        first.length + second.length
    );

    combined.set(first, 0);
    combined.set(second, first.length);

    parser.push(combined);

    t.equal(frames.length, 2);
    t.equal(frames[0].command, RESPONSES.PONG);
    t.equal(frames[1].command, RESPONSES.ACK);

    t.end();
});

tap.test('ignores noise before a valid frame', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    const validFrame = encodeFrame(
        0x05,
        RESPONSES.PONG
    );

    const data = new Uint8Array(
        3 + validFrame.length
    );

    data.set([0x00, 0x12, 0x34], 0);
    data.set(validFrame, 3);

    parser.push(data);

    t.equal(frames.length, 1);
    t.equal(frames[0].sequence, 0x05);

    t.end();
});

tap.test('rejects a frame with invalid checksum and recovers', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    const invalidFrame = encodeFrame(
        0x06,
        RESPONSES.PONG
    );

    invalidFrame[invalidFrame.length - 1] ^= 0xFF;

    const validFrame = encodeFrame(
        0x07,
        RESPONSES.PONG
    );

    const combined = new Uint8Array(
        invalidFrame.length + validFrame.length
    );

    combined.set(invalidFrame, 0);
    combined.set(validFrame, invalidFrame.length);

    parser.push(combined);

    t.equal(frames.length, 1);
    t.equal(frames[0].sequence, 0x07);

    t.end();
});

tap.test('reset discards an incomplete frame', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    const frame = encodeFrame(
        0x08,
        RESPONSES.PONG
    );

    parser.push(frame.subarray(0, 4));
    parser.reset();
    parser.push(frame.subarray(4));

    t.equal(frames.length, 0);

    parser.push(frame);

    t.equal(frames.length, 1);
    t.equal(frames[0].sequence, 0x08);

    t.end();
});

tap.test('encodes DIGITAL_READ payload', t => {
    const frame = encodeFrame(
        0x2B,
        COMMANDS.DIGITAL_READ,
        [2]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x2B);
    t.equal(frame[4], COMMANDS.DIGITAL_READ);
    t.equal(frame[5], 1);
    t.equal(frame[6], 2);

    t.equal(
        frame[7],
        calculateChecksum(frame.subarray(2, 7))
    );

    t.end();
});

tap.test('parses DIGITAL_READ response', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    parser.push(
        encodeFrame(
            0x2B,
            RESPONSES.DIGITAL_READ,
            [2, 1]
        )
    );

    t.equal(frames.length, 1);
    t.equal(frames[0].sequence, 0x2B);
    t.equal(frames[0].command, RESPONSES.DIGITAL_READ);

    t.same(
        Array.from(frames[0].payload),
        [2, 1]
    );

    t.end();
});

tap.test('encodes ANALOG_READ payload', t => {
    const frame = encodeFrame(
        0x2C,
        COMMANDS.ANALOG_READ,
        [14]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x2C);
    t.equal(frame[4], COMMANDS.ANALOG_READ);
    t.equal(frame[5], 1);
    t.equal(frame[6], 14);

    t.equal(
        frame[7],
        calculateChecksum(frame.subarray(2, 7))
    );

    t.end();
});

tap.test('parses ANALOG_READ response', t => {
    const frames = [];

    const parser = new StageProtocolParser(frame => {
        frames.push(frame);
    });

    parser.push(
        encodeFrame(
            0x2C,
            RESPONSES.ANALOG_READ,
            [14, 0x03, 0xFF]
        )
    );

    t.equal(frames.length, 1);
    t.equal(frames[0].sequence, 0x2C);
    t.equal(frames[0].command, RESPONSES.ANALOG_READ);

    t.same(
        Array.from(frames[0].payload),
        [14, 0x03, 0xFF]
    );

    t.end();
});
