const EBCP_CONTRACT = Object.freeze({
    magic: Object.freeze([
        0x45,
        0x42
    ]),
    version: 0x01,

    maxChannelBytes: 16,
    maxPayloadBytes: 32,
    maxFrameBytes: 56,

    checksum: 'xor',

    messageTypes: Object.freeze({
        TEXT: 0x01,
        NUMBER: 0x02,
        BOOLEAN: 0x03
    }),

    textEncoding: 'utf8',
    numberEncoding: 'ieee754-binary32',
    numberPayloadBytes: 4,

    controlTypeRange: Object.freeze({
        min: 0x80,
        max: 0xFF
    }),
    acknowledgement: 'stop-and-wait',
    handshake: true,

    channelMinBytes: 1,
    channelMaxBytes: 16,
    channelPattern: '^[A-Za-z0-9_.-]{1,16}$'
});

module.exports = {
    EBCP_CONTRACT
};
