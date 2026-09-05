const BLUETOOTH_BAUD_RATE = 9600;

class BluetoothSerialTransport {
    constructor ({serialAdapter}) {
        if (
            !serialAdapter ||
            typeof serialAdapter.list !== 'function' ||
            typeof serialAdapter.createPort !== 'function'
        ) {
            throw new Error(
                'Bluetooth serial transport requires a serial adapter'
            );
        }

        this._serialAdapter = serialAdapter;
        this._port = null;
        this._portHandlers = null;
        this._state = 'disconnected';
        this._dataListeners = [];
        this._errorListeners = [];
    }

    async listDevices () {
        const ports =
            await this._serialAdapter.list();

        return ports.map(port => ({
            id: port.path,
            label: port.label || port.path
        }));
    }

    getState () {
        return this._state;
    }

    onData (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'Bluetooth serial data listener must be a function'
            );
        }

        this._dataListeners.push(listener);
    }

    onError (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'Bluetooth serial error listener must be a function'
            );
        }

        this._errorListeners.push(listener);
    }

    async connect ({deviceId}) {
        if (
            typeof deviceId !== 'string' ||
            deviceId.length === 0
        ) {
            throw new Error(
                'Bluetooth serial deviceId must be a non-empty string'
            );
        }

        if (this._port) {
            throw new Error(
                'Bluetooth serial transport is already connected'
            );
        }

        this._state = 'connecting';

        const port =
            this._serialAdapter.createPort({
                path: deviceId,
                baudRate: BLUETOOTH_BAUD_RATE
            });

        const handlers = {
            data: bytes => {
                this._handleData(bytes);
            },

            close: () => {
                this._handleClose(port);
            },

            error: error => {
                this._handleError(error);
            }
        };

        this._port = port;
        this._portHandlers = handlers;

        port.on(
            'data',
            handlers.data
        );

        port.on(
            'close',
            handlers.close
        );

        port.on(
            'error',
            handlers.error
        );

        try {
            await new Promise((resolve, reject) => {
                port.open(error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        } catch (error) {
            this._detachPortListeners(
                port,
                handlers
            );

            if (this._port === port) {
                this._port = null;
                this._portHandlers = null;
            }

            this._state = 'disconnected';
            throw error;
        }

        if (this._port !== port) {
            throw new Error(
                'Bluetooth serial port closed while connecting'
            );
        }

        this._state = 'connected';
    }

    async write (bytes) {
        if (
            !this._port ||
            this._state !== 'connected'
        ) {
            throw new Error(
                'Bluetooth serial transport is not connected'
            );
        }

        const payload = Buffer.from(bytes);

        await new Promise((resolve, reject) => {
            this._port.write(
                payload,
                error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );
        });
    }

    async disconnect () {
        if (!this._port) {
            return false;
        }

        const port = this._port;
        const handlers = this._portHandlers;

        this._port = null;
        this._portHandlers = null;
        this._state = 'disconnecting';

        try {
            await new Promise((resolve, reject) => {
                port.close(error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        } finally {
            this._detachPortListeners(
                port,
                handlers
            );

            this._state = 'disconnected';
        }

        return true;
    }

    _handleData (bytes) {
        const payload = Buffer.from(bytes);

        for (const listener of [
            ...this._dataListeners
        ]) {
            listener(payload);
        }
    }

    _handleError (error) {
        for (const listener of [
            ...this._errorListeners
        ]) {
            listener(error);
        }
    }

    _handleClose (port) {
        if (this._port !== port) {
            return;
        }

        this._detachPortListeners(
            port,
            this._portHandlers
        );

        this._port = null;
        this._portHandlers = null;
        this._state = 'disconnected';
    }

    _detachPortListeners (
        port,
        handlers
    ) {
        if (!handlers) {
            return;
        }

        port.removeListener(
            'data',
            handlers.data
        );

        port.removeListener(
            'close',
            handlers.close
        );

        port.removeListener(
            'error',
            handlers.error
        );
    }
}

module.exports = BluetoothSerialTransport;
