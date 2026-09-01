/**
 * Shared serial communication layer for hardware peripheral extensions.
 *
 * Platform-specific implementations are supplied through the Runtime serial
 * transport factory. This class contains no Web Serial, Electron, Node.js or
 * board-specific logic.
 */
class Serial {
    /**
     * @param {Runtime} runtime Runtime used for peripheral events.
     * @param {string} extensionId Extension using this serial connection.
     * @param {object} serialOptions Serial connection options, such as baudRate.
     * @param {?Function} connectCallback Called after a successful connection.
     * @param {?Function} resetCallback Called after an unexpected connection loss.
     * @param {?Function} dataCallback Called when bytes are received.
     */
    constructor (
        runtime,
        extensionId,
        serialOptions = {},
        connectCallback = null,
        resetCallback = null,
        dataCallback = null
    ) {
        this._runtime = runtime;
        this._extensionId = extensionId;
        this._serialOptions = serialOptions;
        this._connectCallback = connectCallback;
        this._resetCallback = resetCallback;
        this._dataCallback = dataCallback;

        this._availablePeripherals = {};
        this._connected = false;
        this._connectedPeripheral = null;
        this._writeQueue = Promise.resolve();

        this._transport = runtime.getSerialTransport();

        if (this._transport) {
            if (typeof this._transport.setOnData === 'function') {
                this._transport.setOnData(this._handleData.bind(this));
            }
            if (typeof this._transport.setOnClose === 'function') {
                this._transport.setOnClose(this.handleDisconnectError.bind(this));
            }
            if (typeof this._transport.setOnError === 'function') {
                this._transport.setOnError(this._handleRequestError.bind(this));
            }
        }
    }

    /**
     * Discover serial peripherals.
     *
     * A transport may expose requestPort() for an externally presented picker
     * or listPorts() for passive enumeration.
     * @returns {void}
     */
    scan () {
        this._availablePeripherals = {};

        if (!this._transport) {
            this._handleRequestError();
            return;
        }

        if (typeof this._transport.requestPort === 'function') {
            Promise.resolve(this._transport.requestPort(this._serialOptions))
                .then(peripheral => {
                    if (!peripheral) {
                        this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
                        return;
                    }

                    this._availablePeripherals[peripheral.peripheralId] = peripheral;
                    this._runtime.emit(
                        this._runtime.constructor.USER_PICKED_PERIPHERAL,
                        this._availablePeripherals
                    );
                })
                .catch(error => {
                    this._handleRequestError(error);
                });
            return;
        }

        if (typeof this._transport.listPorts === 'function') {
            Promise.resolve(this._transport.listPorts(this._serialOptions))
                .then(peripherals => {
                    for (const peripheral of peripherals || []) {
                        this._availablePeripherals[peripheral.peripheralId] = peripheral;
                    }

                    this._runtime.emit(
                        this._runtime.constructor.PERIPHERAL_LIST_UPDATE,
                        this._availablePeripherals
                    );
                })
                .catch(error => {
                    this._handleRequestError(error);
                });
            return;
        }

        this._handleRequestError();
    }

    /**
     * Connect to a previously discovered or selected serial peripheral.
     * @param {string} peripheralId Identifier understood by the platform transport.
     * @returns {void}
     */
    connect (peripheralId) {
        if (!this._transport || typeof this._transport.open !== 'function') {
            this._handleRequestError();
            return;
        }

        const peripheral =
            this._availablePeripherals[peripheralId] || {
                peripheralId
            };

        Promise.resolve(this._transport.open(peripheralId, this._serialOptions))
            .then(() => {
                this._connectedPeripheral = {
                    ...peripheral
                };
                this._connected = true;
                this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);

                if (this._connectCallback) {
                    this._connectCallback();
                }
            })
            .catch(error => {
                this._handleRequestError(error);
            });
    }

    /**
     * Disconnect the active serial peripheral.
     * Resolve only after the transport has finished releasing the port.
     * @returns {Promise<boolean>} True when the transport closed cleanly.
     */
    async disconnect () {
        return this._disconnect(true);
    }

    /**
     * Release the active serial transport.
     * @param {boolean} waitForWrites Whether queued writes must finish first.
     * @returns {Promise<boolean>} True when the transport closed cleanly.
     */
    async _disconnect (waitForWrites) {
        this._connected = false;

        let closedCleanly = true;

        if (waitForWrites) {
            try {
                await this._writeQueue;
            } catch (error) {
                // Write failures are handled by the serial connection-loss path.
            }
        }

        if (
            this._transport &&
            typeof this._transport.close === 'function'
        ) {
            try {
                await this._transport.close();
            } catch (error) {
                closedCleanly = false;
            }
        }

        this._connectedPeripheral = null;

        this._runtime.emit(
            this._runtime.constructor.PERIPHERAL_DISCONNECTED
        );

        return closedCleanly;
    }

    /**
     * @returns {boolean} Whether a serial peripheral is connected.
     */
    isConnected () {
        return this._connected;
    }

    /**
     * Return metadata for the currently selected serial peripheral.
     * @returns {?object} Peripheral metadata or null when disconnected.
     */
    getConnectedPeripheral () {
        return this._connectedPeripheral ?
            {
                ...this._connectedPeripheral
            } :
            null;
    }

    /**
     * Write raw bytes to the serial transport.
     * @param {Uint8Array} data Bytes to send.
     * @returns {?Promise} Transport write result.
     */
    write (data) {
        if (!this._connected || !this._transport || typeof this._transport.write !== 'function') {
            return null;
        }

        this._writeQueue = this._writeQueue
            .then(() => {
                if (
                    !this._connected ||
                    !this._transport ||
                    typeof this._transport.write !== 'function'
                ) {
                    return null;
                }

                return this._transport.write(data);
            })
            .catch(error =>
                this.handleDisconnectError(error)
            );

        return this._writeQueue;
    }

    /**
     * Handle bytes received from the platform transport.
     * @param {Uint8Array} data Received bytes.
     * @returns {void}
     */
    _handleData (data) {
        if (this._dataCallback) {
            this._dataCallback(data);
        }
    }

    /**
     * Handle an unexpected loss of the active serial connection.
     * @returns {Promise<void>} Resolves after the lost connection is released.
     */
    async handleDisconnectError () {
        if (!this._connected) return;

        await this._disconnect(false);

        if (this._resetCallback) {
            this._resetCallback();
        }

        this._runtime.emit(
            this._runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR,
            {
                message: 'Scratch lost connection to',
                extensionId: this._extensionId
            }
        );
    }

    /**
     * Handle a serial transport request error.
     * @returns {void}
     */
    _handleRequestError () {
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_REQUEST_ERROR, {
            message: 'Scratch could not access the serial peripheral',
            extensionId: this._extensionId
        });
    }
}

module.exports = Serial;
