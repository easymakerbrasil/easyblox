const Serial = require('../../io/serial');

const {
    COMMANDS,
    RESPONSES,
    StageProtocolParser,
    encodeFrame
} = require('./protocol');

const EXTENSION_ID = 'arduinoUno';
const DEFAULT_BAUD_RATE = 115200;
const STAGE_HANDSHAKE_INITIAL_DELAY = 500;
const STAGE_HANDSHAKE_RETRY_DELAY = 500;
const STAGE_HANDSHAKE_MAX_ATTEMPTS = 6;

/**
 * Arduino UNO hardware peripheral.
 *
 * Owns the board-facing serial connection, Stage protocol parser and
 * board-specific connection state.
 */
class ArduinoUnoPeripheral {
    /**
     * @param {Runtime} runtime Scratch runtime.
     */
    constructor (runtime) {
        this._runtime = runtime;

        this._serial = null;

        this._serialOptions = {
            baudRate: DEFAULT_BAUD_RATE
        };

        this._parser = new StageProtocolParser(
            this._handleFrame.bind(this)
        );

        this._nextSequence = 1;
        this._pingSequence = null;
        this._pendingDigitalReads = new Map();
        this._stageConnected = false;
        this._handshakeTimer = null;
        this._handshakeAttempts = 0;

        this._runtime.registerPeripheralExtension(
            EXTENSION_ID,
            this
        );
    }

    /**
     * Create the shared Serial layer when it is first needed.
     * @returns {Serial} Serial communication instance.
     */
    _getSerial () {
        if (!this._serial) {
            this._serial = new Serial(
                this._runtime,
                EXTENSION_ID,
                this._serialOptions,
                this._handleConnect.bind(this),
                this._reset.bind(this),
                this._handleData.bind(this)
            );
        }

        return this._serial;
    }

    /**
     * Scan or request a serial port from the active platform transport.
     * @returns {void}
     */
    scan () {
        this._getSerial().scan();
    }

    /**
     * Connect to the selected serial port.
     * @param {string} peripheralId Platform-specific serial peripheral id.
     * @returns {void}
     */
    connect (peripheralId) {
        this._getSerial().connect(peripheralId);
    }

    /**
     * Disconnect from the Arduino UNO.
     * @returns {void}
     */
    disconnect () {
        this._reset();

        if (this._serial) {
            this._serial.disconnect();
        }
    }

    /**
     * @returns {boolean} Whether the physical serial connection is active.
     */
    isConnected () {
        return this._serial ? this._serial.isConnected() : false;
    }

    /**
     * @returns {boolean} Whether the EasyBlox Stage protocol handshake succeeded.
     */
    isStageConnected () {
        return this._stageConnected;
    }

    /**
     * Set an Arduino UNO digital output pin HIGH or LOW in Stage mode.
     * @param {number} pin Arduino digital pin, from D2 to D13 or A0 to A5.
     * @param {number} value Digital value: 0 for LOW or 1 for HIGH.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    digitalWrite (pin, value) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            pin < 2 ||
            pin > 19 ||
            (value !== 0 && value !== 1)
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.DIGITAL_WRITE,
            [pin, value]
        );
    }

    /**
     * Read an Arduino UNO digital input pin in Stage mode.
     * @param {number} pin Arduino digital pin, from D2 to D13 or A0 to A5.
     * @returns {?Promise<number>} Promise resolved with 0 or 1, or null when unavailable.
     */
    digitalRead (pin) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            pin < 2 ||
            pin > 19
        ) {
            return null;
        }

        const sequence = this._sendCommand(
            COMMANDS.DIGITAL_READ,
            [pin]
        );

        if (sequence === null) {
            return null;
        }

        return new Promise(resolve => {
            this._pendingDigitalReads.set(
                sequence,
                {
                    pin,
                    resolve
                }
            );
        });
    }

    /**
     * Called when the physical serial connection succeeds.
     * Starts the EasyBlox Stage protocol handshake.
     * @returns {void}
     */
    _handleConnect () {
        this._reset();

        this._scheduleHandshake(
            STAGE_HANDSHAKE_INITIAL_DELAY
        );
    }

    /**
     * Schedule a Stage protocol handshake attempt.
     * Arduino UNO boards can reset when the serial port opens, so the
     * handshake is retried while the board bootloader is finishing.
     * @param {number} delay Delay before the attempt, in milliseconds.
     * @returns {void}
     */
    _scheduleHandshake (delay) {
        this._handshakeTimer = setTimeout(() => {
            this._handshakeTimer = null;

            if (!this.isConnected() || this._stageConnected) {
                return;
            }

            this._handshakeAttempts++;

            this._pingSequence = this._sendCommand(
                COMMANDS.PING
            );

            if (
                this._handshakeAttempts <
                STAGE_HANDSHAKE_MAX_ATTEMPTS
            ) {
                this._scheduleHandshake(
                    STAGE_HANDSHAKE_RETRY_DELAY
                );
            }
        }, delay);
    }

    /**
     * Receive raw bytes from the Serial layer.
     * @param {Uint8Array} data Received serial bytes.
     * @returns {void}
     */
    _handleData (data) {
        this._parser.push(data);
    }

    /**
     * Handle a valid EasyBlox Stage protocol frame.
     * @param {object} frame Decoded protocol frame.
     * @returns {void}
     */
    _handleFrame (frame) {
        if (
            frame.command === RESPONSES.PONG &&
            frame.sequence === this._pingSequence
        ) {
            this._stageConnected = true;

            if (this._handshakeTimer) {
                clearTimeout(this._handshakeTimer);
                this._handshakeTimer = null;
            }

            return;
        }

        if (frame.command === RESPONSES.DIGITAL_READ) {
            const pendingRead =
                this._pendingDigitalReads.get(frame.sequence);

            if (
                !pendingRead ||
                frame.payload.length !== 2 ||
                frame.payload[0] !== pendingRead.pin ||
                (frame.payload[1] !== 0 && frame.payload[1] !== 1)
            ) {
                return;
            }

            this._pendingDigitalReads.delete(frame.sequence);

            pendingRead.resolve(
                frame.payload[1]
            );
        }
    }

    /**
     * Send a Stage protocol command.
     * @param {number} command Protocol command.
     * @param {Uint8Array|Array<number>} payload Command payload.
     * @returns {?number} Sequence number or null when serial is unavailable.
     */
    _sendCommand (command, payload = []) {
        if (!this._serial || !this._serial.isConnected()) {
            return null;
        }

        const sequence = this._nextSequence;

        this._nextSequence++;

        if (this._nextSequence > 0xFF) {
            this._nextSequence = 1;
        }

        const frame = encodeFrame(
            sequence,
            command,
            payload
        );

        this._serial.write(frame);

        return sequence;
    }

    /**
     * Reset board-specific Stage protocol state.
     * @returns {void}
     */
    _reset () {
        if (this._handshakeTimer) {
            clearTimeout(this._handshakeTimer);
            this._handshakeTimer = null;
        }

        this._parser.reset();
        for (const pendingRead of this._pendingDigitalReads.values()) {
            pendingRead.resolve(null);
        }

        this._pendingDigitalReads.clear();
        this._nextSequence = 1;
        this._pingSequence = null;
        this._stageConnected = false;
        this._handshakeAttempts = 0;
    }
}

module.exports = ArduinoUnoPeripheral;
