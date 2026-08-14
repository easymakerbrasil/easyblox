/**
 * Web Serial implementation of the EasyBlox serial transport contract.
 */
class WebSerialTransport {
    constructor () {
        this._serial = typeof navigator === 'undefined' ? null : navigator.serial;

        this._ports = new Map();
        this._portIds = new WeakMap();
        this._nextPortId = 1;

        this._port = null;
        this._reader = null;
        this._readLoopPromise = null;
        this._reading = false;

        this._onData = null;
        this._onClose = null;
        this._onError = null;

        this._handleDisconnect = this._handleDisconnect.bind(this);

        if (this._serial && typeof this._serial.addEventListener === 'function') {
            this._serial.addEventListener('disconnect', this._handleDisconnect);
        }
    }

    setOnData (callback) {
        this._onData = callback;
    }

    setOnClose (callback) {
        this._onClose = callback;
    }

    setOnError (callback) {
        this._onError = callback;
    }

    /**
     * Ask the browser to present its serial-port picker.
     * @returns {Promise<?object>} Selected peripheral metadata or null when cancelled.
     */
    async requestPort () {
        if (!this._serial || typeof this._serial.requestPort !== 'function') {
            throw new Error('Web Serial is unavailable');
        }

        let port;

        try {
            port = await this._serial.requestPort();
        } catch (error) {
            if (error && error.name === 'NotFoundError') {
                return null;
            }
            throw error;
        }

        return this._rememberPort(port);
    }

    /**
     * Open a previously selected SerialPort.
     * @param {string} peripheralId EasyBlox identifier assigned to the SerialPort.
     * @param {object} options Web Serial open options.
     * @returns {Promise<void>}
     */
    async open (peripheralId, options) {
        const port = this._ports.get(peripheralId);

        if (!port) {
            throw new Error(`Unknown serial peripheral: ${peripheralId}`);
        }

        await port.open(options);

        this._port = port;
        this._reading = true;
        this._readLoopPromise = this._readLoop(port);
    }

    /**
     * Close the active SerialPort.
     * @returns {Promise<void>}
     */
    async close () {
        const port = this._port;

        if (!port) return;

        this._reading = false;
        this._port = null;

        if (this._reader) {
            try {
                await this._reader.cancel();
            } catch (error) {
                // The stream may already be closed after a physical disconnect.
            }
        }

        if (this._readLoopPromise) {
            try {
                await this._readLoopPromise;
            } catch (error) {
                // Read-loop errors are handled inside the loop.
            }
        }

        await port.close();

        this._reader = null;
        this._readLoopPromise = null;
    }

    /**
     * Write raw bytes to the active SerialPort.
     * @param {Uint8Array} data Bytes to write.
     * @returns {Promise<void>}
     */
    async write (data) {
        if (!this._port || !this._port.writable) {
            throw new Error('Serial port is not writable');
        }

        const writer = this._port.writable.getWriter();

        try {
            await writer.write(data);
        } finally {
            writer.releaseLock();
        }
    }

    /**
     * Store a browser SerialPort behind an EasyBlox peripheral id.
     * @param {SerialPort} port Browser SerialPort.
     * @returns {object} Peripheral metadata.
     */
    _rememberPort (port) {
        let peripheralId = this._portIds.get(port);

        if (!peripheralId) {
            peripheralId = `web-serial-${this._nextPortId++}`;
            this._portIds.set(port, peripheralId);
            this._ports.set(peripheralId, port);
        }

        const info = typeof port.getInfo === 'function' ? port.getInfo() : {};

        return {
            peripheralId,
            name: this._getPortName(info)
        };
    }

    /**
     * Create a useful display name from Web Serial metadata.
     * @param {object} info SerialPort information.
     * @returns {string} Port display name.
     */
    _getPortName (info) {
        if (typeof info.usbVendorId === 'number') {
            const vendor = info.usbVendorId.toString(16)
                .padStart(4, '0')
                .toUpperCase();

            let product = '----';

            if (typeof info.usbProductId === 'number') {
                product = info.usbProductId.toString(16)
                    .padStart(4, '0')
                    .toUpperCase();
            }

            return `USB Serial (${vendor}:${product})`;
        }

        return 'Porta serial';
    }

    /**
     * Continuously receive Uint8Array chunks from the active SerialPort.
     * @param {SerialPort} port Active browser SerialPort.
     * @returns {Promise<void>}
     */
    async _readLoop (port) {
        let streamEnded = false;

        while (this._reading && this._port === port && port.readable && !streamEnded) {
            const reader = port.readable.getReader();
            this._reader = reader;

            try {
                while (this._reading) {
                    const {value, done} = await reader.read();

                    if (done) {
                        streamEnded = true;
                        break;
                    }

                    if (value && this._onData) {
                        this._onData(value);
                    }
                }
            } catch (error) {
                if (this._reading && port.readable && this._onError) {
                    this._onError(error);
                }
            } finally {
                reader.releaseLock();

                if (this._reader === reader) {
                    this._reader = null;
                }
            }
        }

        if (this._reading && this._port === port && (streamEnded || !port.readable)) {
            this._notifyUnexpectedClose();
        }
    }

    /**
     * Handle a Web Serial physical disconnect event.
     * @param {Event} event Web Serial disconnect event.
     * @returns {void}
     */
    _handleDisconnect (event) {
        if (event.target === this._port) {
            this._notifyUnexpectedClose();
        }
    }

    /**
     * Notify the shared Serial layer once when the active port disappears.
     * @returns {void}
     */
    _notifyUnexpectedClose () {
        if (!this._port) return;

        this._reading = false;
        this._port = null;

        if (this._onClose) {
            this._onClose();
        }
    }
}

export default WebSerialTransport;
