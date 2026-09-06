const {Buffer} = require('buffer');

const {
    EBCP_CONTRACT
} = require('./ebcp-contract');

const EBCP_CONTROL_TYPES = Object.freeze({
    ACK: 0x80,
    HELLO: 0x81,
    HELLO_ACK: 0x82,
    PING: 0x83,
    PONG: 0x84
});

const FRAME_HEADER_BYTES = 7;
const FRAME_FIXED_BYTES = 8;

const CHANNEL_PATTERN = new RegExp(EBCP_CONTRACT.channelPattern);
const MAGIC = Buffer.from(EBCP_CONTRACT.magic);

const _calculateChecksum = frame => {
    let checksum = 0;

    for (let index = 2; index < frame.length - 1; index++) {
        checksum ^= frame[index];
    }

    return checksum;
};

const _isControlType = type =>
    type === EBCP_CONTROL_TYPES.ACK ||
    type === EBCP_CONTROL_TYPES.HELLO ||
    type === EBCP_CONTROL_TYPES.HELLO_ACK ||
    type === EBCP_CONTROL_TYPES.PING ||
    type === EBCP_CONTROL_TYPES.PONG;

const _isSupportedType = type =>
    type === EBCP_CONTRACT.messageTypes.TEXT ||
    type === EBCP_CONTRACT.messageTypes.NUMBER ||
    _isControlType(type);

const _validateSequence = sequence => {
    if (!Number.isInteger(sequence) || sequence < 0 || sequence > 0xFF) {
        throw new Error('EBCP sequence must be an integer from 0 to 255');
    }
};

const _validatePublicChannel = channel => {
    if (typeof channel !== 'string') {
        throw new Error('EBCP channel must be a string');
    }

    const byteLength = Buffer.byteLength(channel, 'utf8');

    if (
        byteLength < EBCP_CONTRACT.channelMinBytes ||
        byteLength > EBCP_CONTRACT.channelMaxBytes ||
        !CHANNEL_PATTERN.test(channel)
    ) {
        throw new Error('Invalid EBCP channel');
    }
};

const _validateControlChannel = channel => {
    if (channel !== '') {
        throw new Error('EBCP control frames must use an empty channel');
    }
};

const _encodeTextPayload = payload => {
    if (typeof payload !== 'string') {
        throw new Error('EBCP TEXT payload must be a string');
    }

    const encoded = Buffer.from(payload, EBCP_CONTRACT.textEncoding);

    if (encoded.length > EBCP_CONTRACT.maxPayloadBytes) {
        throw new Error('EBCP TEXT payload exceeds the maximum size');
    }

    return encoded;
};

const _encodeNumberPayload = payload => {
    if (typeof payload !== 'number' || !Number.isFinite(payload)) {
        throw new Error('EBCP NUMBER payload must be a finite number');
    }

    const encoded = Buffer.alloc(EBCP_CONTRACT.numberPayloadBytes);
    encoded.writeFloatLE(payload, 0);

    return encoded;
};

const _encodeControlPayload = (type, payload) => {
    if (!Buffer.isBuffer(payload)) {
        throw new Error('EBCP control payload must be a Buffer');
    }

    if (payload.length > EBCP_CONTRACT.maxPayloadBytes) {
        throw new Error('EBCP control payload exceeds the maximum size');
    }

    if (type === EBCP_CONTROL_TYPES.ACK && payload.length !== 1) {
        throw new Error('EBCP ACK payload must contain one sequence byte');
    }

    if (
        (
            type === EBCP_CONTROL_TYPES.HELLO ||
            type === EBCP_CONTROL_TYPES.HELLO_ACK ||
            type === EBCP_CONTROL_TYPES.PING ||
            type === EBCP_CONTROL_TYPES.PONG
        ) &&
        payload.length !== 0
    ) {
        throw new Error(
            'EBCP zero-payload control frame must be empty'
        );
    }

    return Buffer.from(payload);
};

const encodeFrame = ({
    type,
    sequence,
    channel,
    payload
}) => {
    if (!Number.isInteger(type) || type < 0 || type > 0xFF) {
        throw new Error('EBCP type must be a byte');
    }

    if (!_isSupportedType(type)) {
        throw new Error(`Unsupported EBCP message type: ${type}`);
    }

    _validateSequence(sequence);

    let channelBuffer;
    let payloadBuffer;

    if (type === EBCP_CONTRACT.messageTypes.TEXT) {
        _validatePublicChannel(channel);
        channelBuffer = Buffer.from(channel, 'ascii');
        payloadBuffer = _encodeTextPayload(payload);
    } else if (type === EBCP_CONTRACT.messageTypes.NUMBER) {
        _validatePublicChannel(channel);
        channelBuffer = Buffer.from(channel, 'ascii');
        payloadBuffer = _encodeNumberPayload(payload);
    } else {
        _validateControlChannel(channel);

        if (sequence !== 0) {
            throw new Error('EBCP control frame sequence must be zero');
        }

        channelBuffer = Buffer.alloc(0);
        payloadBuffer = _encodeControlPayload(type, payload);
    }

    const frameLength =
        FRAME_FIXED_BYTES +
        channelBuffer.length +
        payloadBuffer.length;

    if (frameLength > EBCP_CONTRACT.maxFrameBytes) {
        throw new Error('EBCP frame exceeds the maximum size');
    }

    const frame = Buffer.alloc(frameLength);

    frame[0] = EBCP_CONTRACT.magic[0];
    frame[1] = EBCP_CONTRACT.magic[1];
    frame[2] = EBCP_CONTRACT.version;
    frame[3] = type;
    frame[4] = sequence;
    frame[5] = channelBuffer.length;
    frame[6] = payloadBuffer.length;

    channelBuffer.copy(frame, FRAME_HEADER_BYTES);
    payloadBuffer.copy(
        frame,
        FRAME_HEADER_BYTES + channelBuffer.length
    );

    frame[frame.length - 1] = _calculateChecksum(frame);

    return frame;
};

const _validateFrameStructure = frame => {
    if (!Buffer.isBuffer(frame)) {
        throw new Error('EBCP frame must be a Buffer');
    }

    if (frame.length < FRAME_FIXED_BYTES) {
        throw new Error('EBCP frame is too short');
    }

    if (
        frame[0] !== EBCP_CONTRACT.magic[0] ||
        frame[1] !== EBCP_CONTRACT.magic[1]
    ) {
        throw new Error('Invalid EBCP magic');
    }

    if (frame[2] !== EBCP_CONTRACT.version) {
        throw new Error(`Unsupported EBCP version: ${frame[2]}`);
    }

    const channelLength = frame[5];
    const payloadLength = frame[6];

    if (channelLength > EBCP_CONTRACT.maxChannelBytes) {
        throw new Error('EBCP channel exceeds the maximum size');
    }

    if (payloadLength > EBCP_CONTRACT.maxPayloadBytes) {
        throw new Error('EBCP payload exceeds the maximum size');
    }

    const expectedLength =
        FRAME_FIXED_BYTES +
        channelLength +
        payloadLength;

    if (frame.length !== expectedLength) {
        throw new Error('Invalid EBCP frame size');
    }

    if (frame.length > EBCP_CONTRACT.maxFrameBytes) {
        throw new Error('EBCP frame exceeds the maximum size');
    }

    const expectedChecksum = _calculateChecksum(frame);
    const actualChecksum = frame[frame.length - 1];

    if (actualChecksum !== expectedChecksum) {
        throw new Error('Invalid EBCP checksum');
    }

    return {
        channelLength,
        payloadLength
    };
};

const decodeFrame = frame => {
    const {
        channelLength,
        payloadLength
    } = _validateFrameStructure(frame);

    const version = frame[2];
    const type = frame[3];
    const sequence = frame[4];

    if (!_isSupportedType(type)) {
        throw new Error(`Unsupported EBCP message type: ${type}`);
    }

    const channelStart = FRAME_HEADER_BYTES;
    const payloadStart = channelStart + channelLength;

    const channelBytes = frame.subarray(
        channelStart,
        payloadStart
    );

    const payloadBytes = frame.subarray(
        payloadStart,
        payloadStart + payloadLength
    );

    const channel = channelBytes.toString('utf8');

    if (type === EBCP_CONTRACT.messageTypes.TEXT) {
        _validatePublicChannel(channel);

        return {
            version,
            type,
            sequence,
            channel,
            payload: payloadBytes.toString(EBCP_CONTRACT.textEncoding)
        };
    }

    if (type === EBCP_CONTRACT.messageTypes.NUMBER) {
        _validatePublicChannel(channel);

        if (payloadBytes.length !== EBCP_CONTRACT.numberPayloadBytes) {
            throw new Error(
                `EBCP NUMBER payload must contain ${EBCP_CONTRACT.numberPayloadBytes} bytes`
            );
        }

        const payload = payloadBytes.readFloatLE(0);

        if (!Number.isFinite(payload)) {
            throw new Error('EBCP NUMBER payload must be finite');
        }

        return {
            version,
            type,
            sequence,
            channel,
            payload
        };
    }

    _validateControlChannel(channel);

    if (sequence !== 0) {
        throw new Error('EBCP control frame sequence must be zero');
    }

    if (
        type === EBCP_CONTROL_TYPES.ACK &&
        payloadBytes.length !== 1
    ) {
        throw new Error('EBCP ACK payload must contain one sequence byte');
    }

    if (
        (
            type === EBCP_CONTROL_TYPES.HELLO ||
            type === EBCP_CONTROL_TYPES.HELLO_ACK ||
            type === EBCP_CONTROL_TYPES.PING ||
            type === EBCP_CONTROL_TYPES.PONG
        ) &&
        payloadBytes.length !== 0
    ) {
        throw new Error(
            'EBCP zero-payload control frame must be empty'
        );
    }

    return {
        version,
        type,
        sequence,
        channel,
        payload: Buffer.from(payloadBytes)
    };
};

class EasyBloxConnectivityParser {
    constructor () {
        this._buffer = Buffer.alloc(0);
    }

    push (chunk) {
        if (!Buffer.isBuffer(chunk)) {
            throw new Error('EBCP parser input must be a Buffer');
        }

        if (chunk.length === 0) {
            return [];
        }

        this._buffer = this._buffer.length === 0 ?
            Buffer.from(chunk) :
            Buffer.concat([
                this._buffer,
                chunk
            ]);

        const decodedFrames = [];

        while (this._buffer.length > 0) {
            const magicIndex = this._buffer.indexOf(MAGIC);

            if (magicIndex === -1) {
                this._preservePossibleMagicPrefix();
                break;
            }

            if (magicIndex > 0) {
                this._buffer = this._buffer.subarray(magicIndex);
            }

            if (this._buffer.length < FRAME_HEADER_BYTES) {
                break;
            }

            if (this._buffer[2] !== EBCP_CONTRACT.version) {
                this._discardCandidateByte();
                continue;
            }

            const channelLength = this._buffer[5];
            const payloadLength = this._buffer[6];

            if (
                channelLength > EBCP_CONTRACT.maxChannelBytes ||
                payloadLength > EBCP_CONTRACT.maxPayloadBytes
            ) {
                this._discardCandidateByte();
                continue;
            }

            const frameLength =
                FRAME_FIXED_BYTES +
                channelLength +
                payloadLength;

            if (frameLength > EBCP_CONTRACT.maxFrameBytes) {
                this._discardCandidateByte();
                continue;
            }

            if (this._buffer.length < frameLength) {
                const nextValidFrameIndex =
                    this._findNextCompleteValidFrameIndex();

                if (nextValidFrameIndex === -1) {
                    break;
                }

                this._buffer =
                    this._buffer.subarray(nextValidFrameIndex);
                continue;
            }

            const candidate = Buffer.from(
                this._buffer.subarray(0, frameLength)
            );

            try {
                decodedFrames.push(decodeFrame(candidate));
                this._buffer = this._buffer.subarray(frameLength);
            } catch (error) {
                this._discardCandidateByte();
            }
        }

        return decodedFrames;
    }

    _findNextCompleteValidFrameIndex () {
        let searchIndex = 1;

        while (searchIndex < this._buffer.length) {
            const magicIndex = this._buffer.indexOf(
                MAGIC,
                searchIndex
            );

            if (magicIndex === -1) {
                return -1;
            }

            const remainingLength =
                this._buffer.length - magicIndex;

            if (remainingLength < FRAME_HEADER_BYTES) {
                return -1;
            }

            if (
                this._buffer[magicIndex + 2] !==
                EBCP_CONTRACT.version
            ) {
                searchIndex = magicIndex + 1;
                continue;
            }

            const channelLength =
                this._buffer[magicIndex + 5];
            const payloadLength =
                this._buffer[magicIndex + 6];

            if (
                channelLength > EBCP_CONTRACT.maxChannelBytes ||
                payloadLength > EBCP_CONTRACT.maxPayloadBytes
            ) {
                searchIndex = magicIndex + 1;
                continue;
            }

            const frameLength =
                FRAME_FIXED_BYTES +
                channelLength +
                payloadLength;

            if (
                frameLength > EBCP_CONTRACT.maxFrameBytes ||
                remainingLength < frameLength
            ) {
                searchIndex = magicIndex + 1;
                continue;
            }

            const candidate = Buffer.from(
                this._buffer.subarray(
                    magicIndex,
                    magicIndex + frameLength
                )
            );

            try {
                decodeFrame(candidate);
                return magicIndex;
            } catch (error) {
                searchIndex = magicIndex + 1;
            }
        }

        return -1;
    }

    _discardCandidateByte () {
        this._buffer = this._buffer.subarray(1);
    }

    _preservePossibleMagicPrefix () {
        if (
            this._buffer.length > 0 &&
            this._buffer[this._buffer.length - 1] ===
                EBCP_CONTRACT.magic[0]
        ) {
            this._buffer = Buffer.from([
                EBCP_CONTRACT.magic[0]
            ]);
            return;
        }

        this._buffer = Buffer.alloc(0);
    }
}

module.exports = {
    EBCP_CONTROL_TYPES,
    encodeFrame,
    decodeFrame,
    EasyBloxConnectivityParser
};
