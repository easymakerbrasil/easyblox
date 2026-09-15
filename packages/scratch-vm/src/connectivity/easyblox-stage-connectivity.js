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

        if (
            this.runtime &&
            typeof this.runtime.on === 'function'
        ) {
            this.runtime.on(
                'PROJECT_STOP_ALL',
                () => {
                    this._connectivityRuntime
                        .clearWaiters();
                }
            );
        }
    }

    /**
     * Current EBCP session generation.
     * @returns {number} session generation.
     */
    get sessionGeneration () {
        return this._connectivityRuntime
            .sessionGeneration;
    }

    /**
     * Write one complete EBCP frame through the Stage Bluetooth transport.
     * Stage transport payloads are limited to 32 bytes.
     * @param {Uint8Array} data Complete EBCP frame.
     * @returns {?number} last Stage sequence written, or null.
     * @private
     */
    _writeStageTransport (data) {
        if (!this._bluetoothSerialProvider) {
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

            lastSequence =
                this._bluetoothSerialProvider
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

        this._bluetoothSerialProvider = provider;

        const session =
            new EasyBloxConnectivitySession({
                runtime:
                    this._connectivityRuntime,
                write: data =>
                    this._writeStageTransport(
                        data
                    )
            });

        this._connectivitySession = session;

        provider.onBluetoothSerialData(
            data => {
                if (
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

        return provider.initBluetoothSerial();
    }

    /**
     * Send one EBCP application message through the shared Stage session.
     * @param {number} type EBCP message type.
     * @param {string} channel EBCP channel.
     * @param {*} payload application payload.
     * @returns {?number} EBCP sequence, or null before initialization.
     */
    send (type, channel, payload) {
        if (!this._connectivitySession) {
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
     * @returns {Promise<object>} matching message.
     */
    waitFor (type, channel) {
        return this._connectivityRuntime.waitFor(
            type,
            channel
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
