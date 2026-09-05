const DEFAULT_HARDWARE_SERVICE_URL =
    'ws://127.0.0.1:8602';
const CONTROLLER_WEBSOCKET_PATH =
    '/v1/bluetooth';
const CONTROLLER_WEBSOCKET_PROTOCOL =
    'easyblox-controller-v1';

class EasyBloxControllerDesktopTransport {
    constructor (options = {}) {
        this._WebSocketClass =
            options.WebSocketClass ||
            (
                typeof WebSocket !== 'undefined' ?
                    WebSocket :
                    null
            );

        if (!this._WebSocketClass) {
            throw new Error(
                'Controller Bluetooth WebSocket is not available'
            );
        }

        this._socket = null;
        this._state = 'disconnected';
        this._dataListeners = [];
        this._disconnectListeners = [];
        this._intentionalDisconnect = false;
    }

    getState () {
        return this._state;
    }

    onData (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'Controller Bluetooth data listener must be a function'
            );
        }

        this._dataListeners.push(
            listener
        );
    }

    onDisconnect (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'Controller Bluetooth disconnect listener must be a function'
            );
        }

        this._disconnectListeners.push(
            listener
        );
    }

    connect ({deviceId}) {
        if (
            typeof deviceId !== 'string' ||
            deviceId.trim().length === 0
        ) {
            throw new Error(
                'Controller Bluetooth deviceId must be a non-empty string'
            );
        }

        if (this._socket) {
            throw new Error(
                'Controller Bluetooth transport is already connected'
            );
        }

        const url =
            `${DEFAULT_HARDWARE_SERVICE_URL}` +
            `${CONTROLLER_WEBSOCKET_PATH}` +
            `?deviceId=${encodeURIComponent(deviceId)}`;

        const socket =
            new this._WebSocketClass(
                url,
                CONTROLLER_WEBSOCKET_PROTOCOL
            );

        socket.binaryType =
            'arraybuffer';

        this._socket = socket;
        this._state = 'connecting';
        this._intentionalDisconnect = false;

        return new Promise(
            (resolve, reject) => {
                let settled = false;

                const handleOpen = () => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    this._state = 'connected';

                    resolve();
                };

                const handleMessage = event => {
                    if (
                        !this._socket ||
                        this._socket !== socket
                    ) {
                        return;
                    }

                    const bytes =
                        this._toUint8Array(
                            event.data
                        );

                    for (
                        const listener of
                            [...this._dataListeners]
                    ) {
                        listener(bytes);
                    }
                };

                const handleError = () => {
                    if (settled) {
                        return;
                    }

                    settled = true;

                    this._clearSocket(
                        socket
                    );

                    reject(
                        new Error(
                            'Controller Bluetooth connection failed'
                        )
                    );
                };

                const handleClose = () => {
                    const intentional =
                        this._intentionalDisconnect;

                    const wasConnecting =
                        !settled &&
                        this._state ===
                            'connecting';

                    if (wasConnecting) {
                        settled = true;
                    }

                    this._clearSocket(
                        socket
                    );

                    if (wasConnecting) {
                        reject(
                            new Error(
                                'Controller Bluetooth connection failed'
                            )
                        );

                        return;
                    }

                    if (!intentional) {
                        for (
                            const listener of
                                [
                                    ...this
                                        ._disconnectListeners
                                ]
                        ) {
                            listener();
                        }
                    }
                };

                socket.addEventListener(
                    'open',
                    handleOpen
                );

                socket.addEventListener(
                    'message',
                    handleMessage
                );

                socket.addEventListener(
                    'error',
                    handleError
                );

                socket.addEventListener(
                    'close',
                    handleClose
                );
            }
        );
    }

    write (bytes) {
        if (
            !this._socket ||
            this._state !== 'connected'
        ) {
            throw new Error(
                'Controller Bluetooth transport is not connected'
            );
        }

        this._socket.send(
            this._toUint8Array(bytes)
        );
    }

    disconnect () {
        if (!this._socket) {
            return false;
        }

        const socket =
            this._socket;

        this._intentionalDisconnect = true;
        this._state = 'disconnected';

        socket.close();

        if (this._socket === socket) {
            this._socket = null;
        }

        return true;
    }

    _clearSocket (socket) {
        if (this._socket !== socket) {
            return;
        }

        this._socket = null;
        this._state = 'disconnected';
    }

    _toUint8Array (value) {
        if (value instanceof Uint8Array) {
            return new Uint8Array(
                value
            );
        }

        if (value instanceof ArrayBuffer) {
            return new Uint8Array(
                value
            );
        }

        if (
            ArrayBuffer.isView(value)
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
            'Controller Bluetooth transport requires binary data'
        );
    }
}

export default EasyBloxControllerDesktopTransport;
