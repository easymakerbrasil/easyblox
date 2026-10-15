const {
    EasyBloxConnectivityRuntime
} = require('./easyblox-connectivity-runtime');

const {
    EasyBloxConnectivitySession
} = require('./easyblox-connectivity-session');

const REQUIRED_BOARD_CAPABILITY =
    'bluetoothSerial';

const STAGE_TRANSPORT_CHUNK_BYTES = 32;

const connectivityByRuntime =
    new WeakMap();

/**
 * Shared Stage EBCP connectivity owned by one Scratch runtime.
 *
 * This layer owns the single Bluetooth Serial receive callback and the
 * single EBCP runtime/session used by Stage consumers such as EasyBlox BT
 * and EasyConect.
 */
class EasyBloxStageConnectivity {
    /**
     * @param {object} runtime Scratch runtime.
     */
    constructor (runtime) {
        this.runtime = runtime;

        this._connectivityRuntime =
            new EasyBloxConnectivityRuntime();

        this._connectivitySession = null;
        this._bluetoothSerialProvider = null;
        this._contextGeneration = 0;
        this._sessionGeneration = 0;
        this._observedSessionGeneration = 0;
        this._pendingOperations = new Map();

        if (
            this.runtime &&
            typeof this.runtime.on === 'function'
        ) {
            this.runtime.on(
                'PROJECT_STOP_ALL',
                () => {
                    this._connectivityRuntime
                        .clearWaiters();
                    this._cancelPendingOperations(true);
                }
            );
            this.runtime.on('EASYBLOX_SELECTED_BOARD_CHANGED', () => {
                if (!this._isBluetoothAllowed()) {
                    this._invalidateContext();
                }
            });
            this.runtime.on('RUNTIME_DISPOSED', () => this._invalidateContext());
        }
    }

    /**
     * Current EBCP session generation.
     * @returns {number} session generation.
     */
    get sessionGeneration () {
        const current = this._connectivityRuntime.sessionGeneration;
        this._sessionGeneration += current - this._observedSessionGeneration;
        this._observedSessionGeneration = current;
        return this._sessionGeneration;
    }

    get contextGeneration () {
        return this._contextGeneration;
    }

    _isBluetoothAllowed () {
        return !this.runtime || typeof this.runtime.isEasyBloxBoardCapabilityAllowed !== 'function' ||
            this.runtime.isEasyBloxBoardCapabilityAllowed(REQUIRED_BOARD_CAPABILITY);
    }

    _cancelPendingOperations (waitersOnly = false) {
        for (const [cancel, isWaiter] of this._pendingOperations) {
            if (!waitersOnly || isWaiter) {
                cancel();
            }
        }
    }

    _invalidateContext () {
        this._contextGeneration++;
        this._sessionGeneration = this.sessionGeneration + 1;
        this._observedSessionGeneration = 0;
        this._cancelPendingOperations();
        this._connectivityRuntime.clearWaiters();
        if (this._bluetoothSerialProvider) {
            this._bluetoothSerialProvider.onBluetoothSerialData(null);
        }
        this._bluetoothSerialProvider = null;
        this._connectivitySession = null;
        this._connectivityRuntime = new EasyBloxConnectivityRuntime();
    }

    _trackOperation (operation, generation, isWaiter = false) {
        return new Promise((resolve, reject) => {
            const cancel = () => {
                this._pendingOperations.delete(cancel);
                resolve(null);
            };
            this._pendingOperations.set(cancel, isWaiter);
            Promise.resolve(operation).then(result => {
                this._pendingOperations.delete(cancel);
                resolve(generation === this._contextGeneration && this._isBluetoothAllowed() ? result : null);
            }, error => {
                this._pendingOperations.delete(cancel);
                reject(error);
            });
        });
    }

    /**
     * Write one complete EBCP frame through the Stage Bluetooth transport.
     * Stage transport payloads are limited to 32 bytes.
     * @param {Uint8Array} data Complete EBCP frame.
     * @returns {?number} last Stage sequence written, or null.
     * @private
     */
    _writeStageTransport (data) {
        const provider = this._bluetoothSerialProvider;
        const generation = this._contextGeneration;
        if (!provider || !this._isBluetoothAllowed()) {
            return null;
        }

        let lastSequence = null;

        for (
            let offset = 0;
            offset < data.length;
            offset += STAGE_TRANSPORT_CHUNK_BYTES
        ) {
            const chunk =
                data.subarray(
                    offset,
                    Math.min(
                        offset +
                            STAGE_TRANSPORT_CHUNK_BYTES,
                        data.length
                    )
                );

            if (generation !== this._contextGeneration || !this._isBluetoothAllowed()) {
                return null;
            }

            lastSequence =
                provider
                    .writeBluetoothSerial(
                        Uint8Array.from(chunk)
                    );

            if (lastSequence === null) {
                return null;
            }
        }

        return lastSequence;
    }

    /**
     * Attach the canonical Bluetooth Serial provider to one shared EBCP
     * session. Reusing the same provider does not replace its receive callback.
     * @param {object} provider Bluetooth Serial provider.
     * @returns {void}
     * @private
     */
    _attachProvider (provider) {
        if (
            this._bluetoothSerialProvider === provider &&
            this._connectivitySession
        ) {
            return;
        }

        if (this._bluetoothSerialProvider) {
            this._invalidateContext();
        }

        this._bluetoothSerialProvider = provider;
        const generation = this._contextGeneration;

        const session =
            new EasyBloxConnectivitySession({
                runtime:
                    this._connectivityRuntime,
                write: data => (generation === this._contextGeneration && this._isBluetoothAllowed() ?
                    this._writeStageTransport(data) : null)
            });

        this._connectivitySession = session;

        provider.onBluetoothSerialData(
            data => {
                if (
                    generation === this._contextGeneration && this._isBluetoothAllowed() &&
                    this._bluetoothSerialProvider ===
                        provider &&
                    this._connectivitySession ===
                        session
                ) {
                    session.push(data);
                }
            }
        );
    }

    /**
     * Initialize the canonical board-side Bluetooth Serial transport.
     *
     * Every explicit initialization still reaches the board. Only the
     * EBCP session and receive callback are shared.
     * @returns {?Promise<number>} provider initialization result,
     * or null when unavailable.
     */
    initializeBluetoothSerial () {
        if (
            !this._isBluetoothAllowed() ||
            !this.runtime ||
            typeof this.runtime
                .getPeripheralExtensionByCapability !==
                'function'
        ) {
            return null;
        }

        const provider =
            this.runtime
                .getPeripheralExtensionByCapability(
                    REQUIRED_BOARD_CAPABILITY
                );

        if (
            !provider ||
            typeof provider
                .onBluetoothSerialData !==
                'function' ||
            typeof provider
                .initBluetoothSerial !==
                'function' ||
            typeof provider
                .writeBluetoothSerial !==
                'function'
        ) {
            return null;
        }

        this._attachProvider(provider);

        const generation = this._contextGeneration;
        const initialization = provider.initBluetoothSerial();
        return initialization === null ? null : this._trackOperation(initialization, generation);
    }

    /**
     * Send one EBCP application message through the shared Stage session.
     * @param {number} type EBCP message type.
     * @param {string} channel EBCP channel.
     * @param {*} payload application payload.
     * @returns {?number} EBCP sequence, or null before initialization.
     */
    send (type, channel, payload) {
        if (!this._connectivitySession || !this._isBluetoothAllowed()) {
            return null;
        }

        return this._connectivitySession.send(
            type,
            channel,
            payload
        );
    }

    /**
     * Wait for the oldest matching EBCP application message.
     * @param {number} type EBCP message type.
     * @param {string} channel EBCP channel.
     * @returns {Promise<object|null>} matching message, or null on cancellation.
     */
    waitFor (type, channel) {
        if (!this._isBluetoothAllowed()) {
            return Promise.resolve(null);
        }
        return this._trackOperation(
            this._connectivityRuntime.waitFor(type, channel),
            this._contextGeneration,
            true
        );
    }
}

/**
 * Get the single Stage connectivity service owned by one Scratch runtime.
 * @param {object} runtime Scratch runtime.
 * @returns {EasyBloxStageConnectivity} shared connectivity service.
 */
const getEasyBloxStageConnectivity =
    runtime => {
        if (
            !runtime ||
            (
                typeof runtime !== 'object' &&
                typeof runtime !== 'function'
            )
        ) {
            throw new TypeError(
                'EasyBlox Stage connectivity requires a Scratch runtime'
            );
        }

        let connectivity =
            connectivityByRuntime.get(runtime);

        if (!connectivity) {
            connectivity =
                new EasyBloxStageConnectivity(
                    runtime
                );

            connectivityByRuntime.set(
                runtime,
                connectivity
            );
        }

        return connectivity;
    };

module.exports = {
    EasyBloxStageConnectivity,
    getEasyBloxStageConnectivity
};
