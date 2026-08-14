const Serial = require('../../io/serial');

const EXTENSION_ID = 'arduinoUno';
const DEFAULT_BAUD_RATE = 115200;

/**
 * Arduino UNO hardware peripheral.
 *
 * Owns the board-facing serial connection and will later contain the Stage
 * protocol parser, board state and connection watchdog.
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
        if (this._serial) {
            this._serial.disconnect();
        }
    }

    /**
     * @returns {boolean} Whether the Arduino UNO serial connection is active.
     */
    isConnected () {
        return this._serial ? this._serial.isConnected() : false;
    }

    /**
     * Called when the physical serial connection succeeds.
     * Stage protocol initialization will be added here.
     * @returns {void}
     */
    _handleConnect () {
        // Stage Mode initialization will be implemented in the next layer.
    }

    /**
     * Receive raw bytes from the Serial layer.
     * Stage protocol parsing will be added here.
     * @param {Uint8Array} data Received serial bytes.
     * @returns {void}
     */
    _handleData (data) {
        void data;
    }

    /**
     * Reset board-specific runtime state after an unexpected disconnect.
     * @returns {void}
     */
    _reset () {
        // Board state will be reset here when Stage Mode state is introduced.
    }
}

module.exports = ArduinoUnoPeripheral;
