const {Buffer} = require('buffer');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT,
    encodeFrame,
    decodeFrame,
    EasyBloxConnectivityParser
} = require('..');

const TRUE_FRAME =
    Buffer.from([
        0x45,
        0x42,
        0x01,
        0x03,
        0x07,
        0x0F,
        0x01,
        0x67,
        0x61,
        0x6D,
        0x65,
        0x70,
        0x61,
        0x64,
        0x2E,
        0x64,
        0x70,
        0x61,
        0x64,
        0x2E,
        0x75,
        0x70,
        0x01,
        0x65
    ]);

const FALSE_FRAME =
    Buffer.from([
        0x45,
        0x42,
        0x01,
        0x03,
        0x07,
        0x0F,
        0x01,
        0x67,
        0x61,
        0x6D,
        0x65,
        0x70,
        0x61,
        0x64,
        0x2E,
        0x64,
        0x70,
        0x61,
        0x64,
        0x2E,
        0x75,
        0x70,
        0x00,
        0x64
    ]);

const createRawBooleanFrame =
    payloadBytes => {
        const channel =
            Buffer.from(
                'gamepad.dpad.up',
                'ascii'
            );

        const frame =
            Buffer.alloc(
                8 +
                channel.length +
                payloadBytes.length
            );

        frame[0] = 0x45;
        frame[1] = 0x42;
        frame[2] = 0x01;
        frame[3] = 0x03;
        frame[4] = 0x07;
        frame[5] = channel.length;
        frame[6] = payloadBytes.length;

        channel.copy(
            frame,
            7
        );

        Buffer.from(
            payloadBytes
        ).copy(
            frame,
            7 + channel.length
        );

        let checksum = 0;

        for (
            let index = 2;
            index < frame.length - 1;
            index++
        ) {
            checksum ^=
                frame[index];
        }

        frame[
            frame.length - 1
        ] = checksum;

        return frame;
    };

test('EBCP v1 defines the canonical BOOLEAN wire representation', () => {
    assert.equal(
        EBCP_CONTRACT
            .messageTypes
            .BOOLEAN,
        0x03
    );

    assert.equal(
        EBCP_CONTRACT
            .booleanEncoding,
        'uint8-0-or-1'
    );

    assert.equal(
        EBCP_CONTRACT
            .booleanPayloadBytes,
        1
    );

    assert.equal(
        EBCP_CONTRACT
            .booleanFalseByte,
        0x00
    );

    assert.equal(
        EBCP_CONTRACT
            .booleanTrueByte,
        0x01
    );
});

test('EBCP encodes BOOLEAN true and false as canonical golden frames', () => {
    assert.deepEqual(
        encodeFrame({
            type:
                EBCP_CONTRACT
                    .messageTypes
                    .BOOLEAN,
            sequence: 7,
            channel:
                'gamepad.dpad.up',
            payload: true
        }),
        TRUE_FRAME
    );

    assert.deepEqual(
        encodeFrame({
            type:
                EBCP_CONTRACT
                    .messageTypes
                    .BOOLEAN,
            sequence: 7,
            channel:
                'gamepad.dpad.up',
            payload: false
        }),
        FALSE_FRAME
    );
});

test('EBCP decodes canonical BOOLEAN golden frames', () => {
    assert.deepEqual(
        decodeFrame(
            TRUE_FRAME
        ),
        {
            version: 0x01,
            type: 0x03,
            sequence: 7,
            channel:
                'gamepad.dpad.up',
            payload: true
        }
    );

    assert.deepEqual(
        decodeFrame(
            FALSE_FRAME
        ),
        {
            version: 0x01,
            type: 0x03,
            sequence: 7,
            channel:
                'gamepad.dpad.up',
            payload: false
        }
    );
});

test('EBCP rejects non-boolean BOOLEAN payloads when encoding', () => {
    const invalidPayloads = [
        0,
        1,
        'true',
        null,
        undefined
    ];

    for (
        const payload of
        invalidPayloads
    ) {
        assert.throws(
            () =>
                encodeFrame({
                    type:
                        EBCP_CONTRACT
                            .messageTypes
                            .BOOLEAN,
                    sequence: 7,
                    channel:
                        'gamepad.dpad.up',
                    payload
                }),
            /boolean payload must be a boolean/i
        );
    }
});

test('EBCP rejects malformed BOOLEAN payload bytes when decoding', () => {
    assert.throws(
        () =>
            decodeFrame(
                createRawBooleanFrame(
                    []
                )
            ),
        /boolean payload must contain 1 byte/i
    );

    assert.throws(
        () =>
            decodeFrame(
                createRawBooleanFrame(
                    [
                        0x00,
                        0x01
                    ]
                )
            ),
        /boolean payload must contain 1 byte/i
    );

    assert.throws(
        () =>
            decodeFrame(
                createRawBooleanFrame(
                    [
                        0x02
                    ]
                )
            ),
        /boolean payload byte must be 0 or 1/i
    );
});

test('EBCP parser preserves BOOLEAN values across transport chunks', () => {
    const parser =
        new EasyBloxConnectivityParser();

    assert.deepEqual(
        parser.push(
            TRUE_FRAME.subarray(
                0,
                9
            )
        ),
        []
    );

    assert.deepEqual(
        parser.push(
            TRUE_FRAME.subarray(
                9
            )
        ),
        [{
            version: 0x01,
            type: 0x03,
            sequence: 7,
            channel:
                'gamepad.dpad.up',
            payload: true
        }]
    );
});
