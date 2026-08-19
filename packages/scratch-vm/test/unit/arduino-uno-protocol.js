const tap = require('tap');

const {
    COMMANDS,
    LCD_MODES,
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

tap.test('encodes PWM_WRITE payload', t => {
    const frame = encodeFrame(
        0x2D,
        COMMANDS.PWM_WRITE,
        [3, 128]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x2D);
    t.equal(frame[4], COMMANDS.PWM_WRITE);
    t.equal(frame[5], 2);
    t.equal(frame[6], 3);
    t.equal(frame[7], 128);

    t.equal(
        frame[8],
        calculateChecksum(frame.subarray(2, 8))
    );

    t.end();
});

tap.test('encodes TONE_START payload', t => {
    const frame = encodeFrame(
        0x2E,
        COMMANDS.TONE_START,
        [6, 0xB8, 0x01]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x2E);
    t.equal(frame[4], COMMANDS.TONE_START);
    t.equal(frame[5], 3);
    t.equal(frame[6], 6);
    t.equal(frame[7], 0xB8);
    t.equal(frame[8], 0x01);

    t.equal(
        frame[9],
        calculateChecksum(frame.subarray(2, 9))
    );

    t.end();
});

tap.test('encodes TONE_STOP payload', t => {
    const frame = encodeFrame(
        0x2F,
        COMMANDS.TONE_STOP,
        [6]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x2F);
    t.equal(frame[4], COMMANDS.TONE_STOP);
    t.equal(frame[5], 1);
    t.equal(frame[6], 6);

    t.equal(
        frame[7],
        calculateChecksum(frame.subarray(2, 7))
    );

    t.end();
});

tap.test('encodes SERVO_WRITE payload', t => {
    const frame = encodeFrame(
        0x30,
        COMMANDS.SERVO_WRITE,
        [5, 90]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x30);
    t.equal(frame[4], COMMANDS.SERVO_WRITE);
    t.equal(frame[5], 2);
    t.equal(frame[6], 5);
    t.equal(frame[7], 90);

    t.equal(
        frame[8],
        calculateChecksum(frame.subarray(2, 8))
    );

    t.end();
});

tap.test('encodes MOTOR_WRITE payload', t => {
    const frame = encodeFrame(
        0x31,
        COMMANDS.MOTOR_WRITE,
        [7, 8, 5, 0x00, 128]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x31);
    t.equal(frame[4], COMMANDS.MOTOR_WRITE);
    t.equal(frame[5], 5);
    t.equal(frame[6], 7);
    t.equal(frame[7], 8);
    t.equal(frame[8], 5);
    t.equal(frame[9], 0x00);
    t.equal(frame[10], 128);

    t.equal(
        frame[11],
        calculateChecksum(frame.subarray(2, 11))
    );

    t.end();
});

tap.test('encodes MOTOR_STOP payload', t => {
    const frame = encodeFrame(
        0x32,
        COMMANDS.MOTOR_STOP,
        [7, 8, 5, 0x01]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x32);
    t.equal(frame[4], COMMANDS.MOTOR_STOP);
    t.equal(frame[5], 4);
    t.equal(frame[6], 7);
    t.equal(frame[7], 8);
    t.equal(frame[8], 5);
    t.equal(frame[9], 0x01);

    t.equal(
        frame[10],
        calculateChecksum(frame.subarray(2, 10))
    );

    t.end();
});

tap.test('encodes RELAY_WRITE payload', t => {
    const frame = encodeFrame(
        0x33,
        COMMANDS.RELAY_WRITE,
        [12, 0x01]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x33);
    t.equal(frame[4], COMMANDS.RELAY_WRITE);
    t.equal(frame[5], 2);
    t.equal(frame[6], 12);
    t.equal(frame[7], 0x01);

    t.equal(
        frame[8],
        calculateChecksum(frame.subarray(2, 8))
    );

    t.end();
});

tap.test('encodes ULTRASONIC_READ payload', t => {
    const frame = encodeFrame(
        0x34,
        COMMANDS.ULTRASONIC_READ,
        [16, 17]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x34);
    t.equal(frame[4], COMMANDS.ULTRASONIC_READ);
    t.equal(frame[5], 2);
    t.equal(frame[6], 16);
    t.equal(frame[7], 17);

    t.equal(
        frame[8],
        calculateChecksum(frame.subarray(2, 8))
    );

    t.end();
});

tap.test('encodes DHT_READ payload', t => {
    const frame = encodeFrame(
        0x35,
        COMMANDS.DHT_READ,
        [12, 0]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x35);
    t.equal(frame[4], COMMANDS.DHT_READ);
    t.equal(frame[5], 2);
    t.equal(frame[6], 12);
    t.equal(frame[7], 0);

    t.equal(
        frame[8],
        calculateChecksum(frame.subarray(2, 8))
    );

    t.end();
});

tap.test('encodes LCD_INIT payload', t => {
    const frame = encodeFrame(
        0x40,
        COMMANDS.LCD_INIT
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x40);
    t.equal(frame[4], COMMANDS.LCD_INIT);
    t.equal(frame[5], 0);

    t.equal(
        frame[6],
        calculateChecksum(frame.subarray(2, 6))
    );

    t.end();
});

tap.test('encodes LCD_WRITE payload', t => {
    const frame = encodeFrame(
        0x41,
        COMMANDS.LCD_WRITE,
        [
            0x00,
            0x00,
            0x45,
            0x61,
            0x73,
            0x79,
            0x42,
            0x6C,
            0x6F,
            0x78
        ]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x41);
    t.equal(frame[4], COMMANDS.LCD_WRITE);
    t.equal(frame[5], 10);

    t.equal(frame[6], 0x00);
    t.equal(frame[7], 0x00);
    t.equal(frame[8], 0x45);
    t.equal(frame[9], 0x61);
    t.equal(frame[10], 0x73);
    t.equal(frame[11], 0x79);
    t.equal(frame[12], 0x42);
    t.equal(frame[13], 0x6C);
    t.equal(frame[14], 0x6F);
    t.equal(frame[15], 0x78);

    t.equal(
        frame[16],
        calculateChecksum(frame.subarray(2, 16))
    );

    t.end();
});

tap.test('encodes LCD_CLEAR payload', t => {
    const frame = encodeFrame(
        0x42,
        COMMANDS.LCD_CLEAR
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x42);
    t.equal(frame[4], COMMANDS.LCD_CLEAR);
    t.equal(frame[5], 0);

    t.equal(
        frame[6],
        calculateChecksum(frame.subarray(2, 6))
    );

    t.end();
});

tap.test('encodes LCD_MODE payload', t => {
    const frame = encodeFrame(
        0x43,
        COMMANDS.LCD_MODE,
        [LCD_MODES.BLINK_ON]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x43);
    t.equal(frame[4], COMMANDS.LCD_MODE);
    t.equal(frame[5], 1);
    t.equal(frame[6], LCD_MODES.BLINK_ON);

    t.equal(
        frame[7],
        calculateChecksum(frame.subarray(2, 7))
    );

    t.end();
});

tap.test('defines LCD mode values', t => {
    t.equal(LCD_MODES.BLINK_ON, 0x00);
    t.equal(LCD_MODES.BLINK_OFF, 0x01);
    t.equal(LCD_MODES.CURSOR_ON, 0x02);
    t.equal(LCD_MODES.CURSOR_OFF, 0x03);
    t.equal(LCD_MODES.DISPLAY_ON, 0x04);
    t.equal(LCD_MODES.DISPLAY_OFF, 0x05);
    t.equal(LCD_MODES.AUTOSCROLL_ON, 0x06);
    t.equal(LCD_MODES.AUTOSCROLL_OFF, 0x07);
    t.equal(LCD_MODES.SCROLL_LEFT, 0x08);
    t.equal(LCD_MODES.SCROLL_RIGHT, 0x09);

    t.end();
});

tap.test('defines matrix command values', t => {
    t.equal(COMMANDS.MATRIX_WRITE, 0x20);
    t.equal(COMMANDS.MATRIX_BRIGHTNESS, 0x21);

    t.end();
});

tap.test('defines TM1637 command value', t => {
    t.equal(COMMANDS.TM1637_WRITE, 0x22);

    t.end();
});

tap.test('encodes MATRIX_WRITE payload', t => {
    const frame = encodeFrame(
        0x44,
        COMMANDS.MATRIX_WRITE,
        [
            11,
            10,
            13,
            0x00,
            0x66,
            0xFF,
            0xFF,
            0x7E,
            0x3C,
            0x18,
            0x00
        ]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x44);
    t.equal(frame[4], 0x20);
    t.equal(frame[5], 11);

    t.equal(frame[6], 11);
    t.equal(frame[7], 10);
    t.equal(frame[8], 13);
    t.equal(frame[9], 0x00);
    t.equal(frame[10], 0x66);
    t.equal(frame[11], 0xFF);
    t.equal(frame[12], 0xFF);
    t.equal(frame[13], 0x7E);
    t.equal(frame[14], 0x3C);
    t.equal(frame[15], 0x18);
    t.equal(frame[16], 0x00);

    t.equal(
        frame[17],
        calculateChecksum(frame.subarray(2, 17))
    );

    t.end();
});

tap.test('encodes MATRIX_BRIGHTNESS payload', t => {
    const frame = encodeFrame(
        0x45,
        COMMANDS.MATRIX_BRIGHTNESS,
        [
            11,
            10,
            13,
            100
        ]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x45);
    t.equal(frame[4], 0x21);
    t.equal(frame[5], 4);

    t.equal(frame[6], 11);
    t.equal(frame[7], 10);
    t.equal(frame[8], 13);
    t.equal(frame[9], 100);

    t.equal(
        frame[10],
        calculateChecksum(frame.subarray(2, 10))
    );

    t.end();
});

tap.test('encodes TM1637_WRITE payload', t => {
    const frame = encodeFrame(
        0x46,
        COMMANDS.TM1637_WRITE,
        [
            3,
            5,
            0x06,
            0x5B,
            0x4F,
            0x66
        ]
    );

    t.equal(frame[0], 0xFF);
    t.equal(frame[1], 0x55);
    t.equal(frame[2], PROTOCOL_VERSION);
    t.equal(frame[3], 0x46);
    t.equal(frame[4], 0x22);
    t.equal(frame[5], 6);

    t.equal(frame[6], 3);
    t.equal(frame[7], 5);
    t.equal(frame[8], 0x06);
    t.equal(frame[9], 0x5B);
    t.equal(frame[10], 0x4F);
    t.equal(frame[11], 0x66);

    t.equal(
        frame[12],
        calculateChecksum(frame.subarray(2, 12))
    );

    t.end();
});
