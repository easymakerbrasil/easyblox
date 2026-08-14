const START_BYTE_1 = 0xFF;
const START_BYTE_2 = 0x55;
const PROTOCOL_VERSION = 0x01;
const MAX_PAYLOAD_LENGTH = 32;

const COMMANDS = Object.freeze({
    PING: 0x01,
    DIGITAL_WRITE: 0x10,
    DIGITAL_READ: 0x11
});

const RESPONSES = Object.freeze({
    ACK: 0x80,
    PONG: 0x81,
    DIGITAL_READ: 0x91,
    ERROR: 0xFF
});

/**
 * Calculate the EasyBlox Stage protocol checksum.
 * @param {Uint8Array|Array<number>} bytes Bytes to include.
 * @returns {number} XOR checksum.
 */
const calculateChecksum = bytes => {
    let checksum = 0;

    for (const byte of bytes) {
        checksum ^= byte;
    }

    return checksum & 0xFF;
};

/**
 * Encode an EasyBlox Stage protocol frame.
 * @param {number} sequence Request sequence number.
 * @param {number} command Protocol command.
 * @param {Uint8Array|Array<number>} payload Command payload.
 * @returns {Uint8Array} Encoded frame.
 */
const encodeFrame = (sequence, command, payload = []) => {
    const payloadBytes = payload instanceof Uint8Array ?
        payload :
        Uint8Array.from(payload);

    if (payloadBytes.length > MAX_PAYLOAD_LENGTH) {
        throw new RangeError('EasyBlox Stage protocol payload is too large');
    }

    const frame = new Uint8Array(7 + payloadBytes.length);

    frame[0] = START_BYTE_1;
    frame[1] = START_BYTE_2;
    frame[2] = PROTOCOL_VERSION;
    frame[3] = sequence & 0xFF;
    frame[4] = command & 0xFF;
    frame[5] = payloadBytes.length;

    frame.set(payloadBytes, 6);

    frame[frame.length - 1] = calculateChecksum(
        frame.subarray(2, frame.length - 1)
    );

    return frame;
};

/**
 * Streaming parser for EasyBlox Stage protocol frames.
 */
class StageProtocolParser {
    /**
     * @param {Function} frameCallback Called for each valid frame.
     */
    constructor (frameCallback) {
        this._frameCallback = frameCallback;
        this._buffer = [];
    }

    /**
     * Add bytes received from the serial transport.
     * @param {Uint8Array} data Received bytes.
     * @returns {void}
     */
    push (data) {
        for (const byte of data) {
            this._buffer.push(byte);
        }

        this._process();
    }

    /**
     * Clear buffered protocol data.
     * @returns {void}
     */
    reset () {
        this._buffer = [];
    }

    /**
     * Process all complete frames currently available.
     * @returns {void}
     */
    _process () {
        while (this._buffer.length >= 2) {
            if (
                this._buffer[0] !== START_BYTE_1 ||
                this._buffer[1] !== START_BYTE_2
            ) {
                this._buffer.shift();
                continue;
            }

            if (this._buffer.length < 6) {
                return;
            }

            const payloadLength = this._buffer[5];

            if (payloadLength > MAX_PAYLOAD_LENGTH) {
                this._buffer.shift();
                continue;
            }

            const frameLength = 7 + payloadLength;

            if (this._buffer.length < frameLength) {
                return;
            }

            const frame = this._buffer.slice(0, frameLength);
            const receivedChecksum = frame[frameLength - 1];

            const expectedChecksum = calculateChecksum(
                frame.slice(2, frameLength - 1)
            );

            if (
                frame[2] !== PROTOCOL_VERSION ||
                receivedChecksum !== expectedChecksum
            ) {
                this._buffer.shift();
                continue;
            }

            this._buffer.splice(0, frameLength);

            if (this._frameCallback) {
                this._frameCallback({
                    version: frame[2],
                    sequence: frame[3],
                    command: frame[4],
                    payload: Uint8Array.from(
                        frame.slice(6, frameLength - 1)
                    )
                });
            }
        }
    }
}

module.exports = {
    COMMANDS,
    MAX_PAYLOAD_LENGTH,
    PROTOCOL_VERSION,
    RESPONSES,
    START_BYTE_1,
    START_BYTE_2,
    StageProtocolParser,
    calculateChecksum,
    encodeFrame
};
