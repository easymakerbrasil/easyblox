const EASYCONECT_WEB_SERIAL_DEVICE_ID =
    'browser-selected-port';

const DEFAULT_BAUD_RATE =
    9600;

class EasyConectWebSerialTransport {
    constructor (options = {}) {
        const hasSerialOption =
            Object.prototype
                .hasOwnProperty.call(
                    options,
                    'serial'
                );

        this._serial =
            hasSerialOption ?
                options.serial :
                (
                    typeof navigator !==
                        'undefined' ?
                        navigator.serial :
                        null
                );

        if (
            !this._serial ||
            typeof this._serial.requestPort !==
                'function'
        ) {
            throw new Error(
                'EasyConect Web Serial is not available'
            );
        }

        this._baudRate =
            typeof options.baudRate ===
                'number' ?
                options.baudRate :
                DEFAULT_BAUD_RATE;

        this._state =
            'disconnected';

        this._port =
            null;

        this._reader =
            null;

        this._writer =
            null;

        this._readLoopPromise =
            null;

        this._intentionalDisconnect =
            false;

        this._dataListeners =
            new Set();

        this._errorListeners =
            new Set();

        this._disconnectListeners =
            new Set();
    }

    getState () {
        return this._state;
    }

    onData (listener) {
        this._validateListener(
            listener,
            'data'
        );

        this._dataListeners.add(
            listener
        );

        return () => {
            this._dataListeners.delete(
                listener
            );
        };
    }

    onError (listener) {
        this._validateListener(
            listener,
            'error'
        );

        this._errorListeners.add(
            listener
        );

        return () => {
            this._errorListeners.delete(
                listener
            );
        };
    }

    onDisconnect (listener) {
        this._validateListener(
            listener,
            'disconnect'
        );

        this._disconnectListeners.add(
            listener
        );

        return () => {
            this._disconnectListeners.delete(
                listener
            );
        };
    }

    async connect ({
        deviceId
    } = {}) {
        if (
            deviceId !==
                EASYCONECT_WEB_SERIAL_DEVICE_ID
        ) {
            throw new Error(
                'EasyConect Web Serial requires the browser-selected device id'
            );
        }

        if (
            this._state !==
                'disconnected' ||
            this._port
        ) {
            throw new Error(
                'EasyConect Web Serial transport is already active'
            );
        }

        this._state =
            'connecting';

        this._intentionalDisconnect =
            false;

        let port =
            null;

        try {
            port =
                await this._serial
                    .requestPort();

            await port.open({
                baudRate:
                    this._baudRate
            });

            if (
                !port.readable ||
                typeof port.readable
                    .getReader !==
                    'function'
            ) {
                throw new Error(
                    'EasyConect Web Serial port is not readable'
                );
            }

            if (
                !port.writable ||
                typeof port.writable
                    .getWriter !==
                    'function'
            ) {
                throw new Error(
                    'EasyConect Web Serial port is not writable'
                );
            }

            const reader =
                port.readable
                    .getReader();

            const writer =
                port.writable
                    .getWriter();

            this._port =
                port;

            this._reader =
                reader;

            this._writer =
                writer;

            this._state =
                'connected';

            this._readLoopPromise =
                this._runReadLoop(
                    port,
                    reader
                );

            return true;
        } catch (error) {
            this._state =
                'disconnected';

            this._port =
                null;

            this._reader =
                null;

            this._writer =
                null;

            if (
                port &&
                typeof port.close ===
                    'function'
            ) {
                try {
                    await port.close();
                } catch (
                    closeError
                ) {
                    // Preserve the original connection failure.
                }
            }

            throw error;
        }
    }

    async write (bytes) {
        if (
            this._state !==
                'connected' ||
            !this._writer
        ) {
            throw new Error(
                'EasyConect Web Serial transport is not connected'
            );
        }

        const payload =
            this._toUint8Array(
                bytes
            );

        try {
            await this._writer
                .write(
                    payload
                );
        } catch (error) {
            this._notifyError(
                error
            );

            throw error;
        }

        return true;
    }

    async disconnect () {
        if (
            !this._port &&
            this._state ===
                'disconnected'
        ) {
            return false;
        }

        const port =
            this._port;

        const reader =
            this._reader;

        const writer =
            this._writer;

        const readLoopPromise =
            this._readLoopPromise;

        this._intentionalDisconnect =
            true;

        this._state =
            'disconnecting';

        try {
            if (
                reader &&
                typeof reader.cancel ===
                    'function'
            ) {
                try {
                    await reader.cancel();
                } catch (error) {
                    // Continue cleanup after reader cancellation failure.
                }
            }

            if (readLoopPromise) {
                try {
                    await readLoopPromise;
                } catch (error) {
                    // The read loop reports transport errors itself.
                }
            }

            if (
                writer &&
                typeof writer.releaseLock ===
                    'function'
            ) {
                try {
                    writer.releaseLock();
                } catch (error) {
                    // Continue cleanup after writer release failure.
                }
            }

            if (
                port &&
                typeof port.close ===
                    'function'
            ) {
                await port.close();
            }
        } finally {
            this._port =
                null;

            this._reader =
                null;

            this._writer =
                null;

            this._readLoopPromise =
                null;

            this._state =
                'disconnected';

            this._intentionalDisconnect =
                false;
        }

        return true;
    }

    async _runReadLoop (
        port,
        reader
    ) {
        try {
            while (
                this._port ===
                    port
            ) {
                const {
                    value,
                    done
                } =
                    await reader.read();

                if (done) {
                    if (
                        !this._intentionalDisconnect &&
                        this._port ===
                            port
                    ) {
                        this._handleUnexpectedDisconnect(
                            port
                        );
                    }

                    return;
                }

                if (
                    !value ||
                    value.byteLength ===
                        0
                ) {
                    continue;
                }

                const bytes =
                    this._toUint8Array(
                        value
                    );

                for (
                    const listener of
                    [...this._dataListeners]
                ) {
                    listener(
                        bytes
                    );
                }
            }
        } catch (error) {
            if (
                !this._intentionalDisconnect &&
                this._port ===
                    port
            ) {
                this._notifyError(
                    error
                );

                this._handleUnexpectedDisconnect(
                    port
                );
            }
        } finally {
            if (
                typeof reader.releaseLock ===
                    'function'
            ) {
                try {
                    reader.releaseLock();
                } catch (error) {
                    // Reader cleanup must not change transport lifecycle.
                }
            }

            if (
                this._reader ===
                    reader
            ) {
                this._reader =
                    null;
            }
        }
    }

    _handleUnexpectedDisconnect (
        port
    ) {
        if (
            this._port !==
                port
        ) {
            return;
        }

        const writer =
            this._writer;

        this._port =
            null;

        this._reader =
            null;

        this._writer =
            null;

        this._readLoopPromise =
            null;

        this._state =
            'disconnected';

        if (
            writer &&
            typeof writer.releaseLock ===
                'function'
        ) {
            try {
                writer.releaseLock();
            } catch (error) {
                // Transport loss already owns lifecycle cleanup.
            }
        }

        for (
            const listener of
            [...this._disconnectListeners]
        ) {
            listener();
        }
    }

    _notifyError (error) {
        const normalizedError =
            error instanceof Error ?
                error :
                new Error(
                    'EasyConect Web Serial transport error'
                );

        for (
            const listener of
            [...this._errorListeners]
        ) {
            listener(
                normalizedError
            );
        }
    }

    _validateListener (
        listener,
        type
    ) {
        if (
            typeof listener !==
                'function'
        ) {
            throw new Error(
                `EasyConect Web Serial ${type} listener must be a function`
            );
        }
    }

    _toUint8Array (value) {
        if (
            value instanceof
                Uint8Array
        ) {
            return new Uint8Array(
                value
            );
        }

        if (
            value instanceof
                ArrayBuffer
        ) {
            return new Uint8Array(
                value
            );
        }

        if (
            ArrayBuffer.isView(
                value
            )
        ) {
            return new Uint8Array(
                value.buffer.slice(
                    value.byteOffset,
                    value.byteOffset +
                        value.byteLength
                )
            );
        }

        throw new Error(
            'EasyConect Web Serial transport requires binary data'
        );
    }
}

module.exports = {
    EASYCONECT_WEB_SERIAL_DEVICE_ID,
    EasyConectWebSerialTransport
};
