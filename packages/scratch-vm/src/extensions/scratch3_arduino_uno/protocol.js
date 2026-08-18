const START_BYTE_1 = 0xFF;
const START_BYTE_2 = 0x55;
const PROTOCOL_VERSION = 0x01;
const MAX_PAYLOAD_LENGTH = 32;

const COMMANDS = Object.freeze({
    PING: 0x01,
    DIGITAL_WRITE: 0x10,
    DIGITAL_READ: 0x11,
    ANALOG_READ: 0x12,
    PWM_WRITE: 0x13,
    TONE_START: 0x14,
    TONE_STOP: 0x15,
    SERVO_WRITE: 0x16,
    MOTOR_WRITE: 0x17,
    MOTOR_STOP: 0x18,
    RELAY_WRITE: 0x19,
    ULTRASONIC_READ: 0x1A,
    DHT_READ: 0x1B,
    LCD_INIT: 0x1C,
    LCD_WRITE: 0x1D,
    LCD_CLEAR: 0x1E,
    LCD_MODE: 0x1F,
    MATRIX_WRITE: 0x20,
    MATRIX_BRIGHTNESS: 0x21
});

const LCD_MODES = Object.freeze({
    BLINK_ON: 0x00,
    BLINK_OFF: 0x01,
    CURSOR_ON: 0x02,
    CURSOR_OFF: 0x03,
    DISPLAY_ON: 0x04,
    DISPLAY_OFF: 0x05,
    AUTOSCROLL_ON: 0x06,
    AUTOSCROLL_OFF: 0x07,
    SCROLL_LEFT: 0x08,
    SCROLL_RIGHT: 0x09
});

const RESPONSES = Object.freeze({
    ACK: 0x80,
    PONG: 0x81,
    DIGITAL_READ: 0x91,
    ANALOG_READ: 0x92,
    ULTRASONIC_READ: 0x93,
    DHT_READ: 0x94,
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
    LCD_MODES,
    MAX_PAYLOAD_LENGTH,
    PROTOCOL_VERSION,
    RESPONSES,
    START_BYTE_1,
    START_BYTE_2,
    StageProtocolParser,
    calculateChecksum,
    encodeFrame
};
