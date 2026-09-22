const DEFAULT_HARDWARE_SERVICE_URL =
    'ws://127.0.0.1:8602';
const EASYCONECT_WEBSOCKET_PATH =
    '/v1/bluetooth';
const EASYCONECT_WEBSOCKET_PROTOCOL =
    'easyconect-v1';

const DEFAULT_CONNECT_TIMEOUT_MS =
    10000;

class EasyConectWebSocketTransport {
    constructor (options = {}) {
        this._WebSocketClass =
            options.WebSocketClass ||
            (
                typeof WebSocket === 'undefined' ?
                    null :
                    WebSocket
            );

        if (!this._WebSocketClass) {
            throw new Error(
                'EasyConect Bluetooth WebSocket is not available'
            );
        }

        this._socket = null;
        this._state = 'disconnected';
        this._dataListeners = [];
        this._errorListeners = [];
        this._disconnectListeners = [];
        this._intentionalDisconnect = false;

        this._connectTimeoutMs =
            typeof options.connectTimeoutMs ===
                'number' ?
                options.connectTimeoutMs :
                DEFAULT_CONNECT_TIMEOUT_MS;
    }

    getState () {
        return this._state;
    }

    onData (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'EasyConect Bluetooth data listener must be a function'
            );
        }

        this._dataListeners.push(
            listener
        );
    }

    onError (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'EasyConect Bluetooth error listener must be a function'
            );
        }

        this._errorListeners.push(
            listener
        );
    }

    onDisconnect (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'EasyConect Bluetooth disconnect listener must be a function'
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
                'EasyConect Bluetooth deviceId must be a non-empty string'
            );
        }

        if (this._socket) {
            throw new Error(
                'EasyConect Bluetooth transport is already connected'
            );
        }

        const url =
            `${DEFAULT_HARDWARE_SERVICE_URL}` +
            `${EASYCONECT_WEBSOCKET_PATH}` +
            `?deviceId=${encodeURIComponent(deviceId)}`;

        const socket =
            new this._WebSocketClass(
                url,
                EASYCONECT_WEBSOCKET_PROTOCOL
            );

        socket.binaryType =
            'arraybuffer';

        this._socket = socket;
        this._state = 'connecting';
        this._intentionalDisconnect = false;

        return new Promise(
            (resolve, reject) => {
                let settled = false;
                let connectTimeoutId = null;

                const clearConnectTimeout =
                    () => {
                        if (
                            connectTimeoutId ===
                                null
                        ) {
                            return;
                        }

                        clearTimeout(
                            connectTimeoutId
                        );

                        connectTimeoutId =
                            null;
                    };

                const handleOpen = () => {
                    if (settled) {
                        return;
                    }

                    clearConnectTimeout();

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

                const handleError = event => {
                    if (
                        !this._socket ||
                        this._socket !== socket
                    ) {
                        return;
                    }

                    const transportError =
                        event &&
                        event.error instanceof Error ?
                            event.error :
                            new Error(
                                'EasyConect Bluetooth transport error'
                            );

                    if (!settled) {
                        clearConnectTimeout();

                        settled = true;

                        this._clearSocket(
                            socket
                        );

                        reject(
                            new Error(
                                'EasyConect Bluetooth connection failed'
                            )
                        );

                        return;
                    }

                    for (
                        const listener of
                        [...this._errorListeners]
                    ) {
                        listener(
                            transportError
                        );
                    }
                };

                const handleClose = () => {
                    const intentional =
                        this._intentionalDisconnect;

                    const wasConnecting =
                        !settled &&
                        this._state ===
                            'connecting';

                    clearConnectTimeout();

                    if (wasConnecting) {
                        settled = true;
                    }

                    this._clearSocket(
                        socket
                    );

                    if (wasConnecting) {
                        reject(
                            new Error(
                                'EasyConect Bluetooth connection failed'
                            )
                        );

                        return;
                    }

                    if (!intentional) {
                        for (
                            const listener of
                            [...this._disconnectListeners]
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

                connectTimeoutId =
                    setTimeout(
                        () => {
                            if (
                                settled ||
                                this._socket !==
                                    socket
                            ) {
                                return;
                            }

                            connectTimeoutId =
                                null;
                            settled = true;

                            this.disconnect();

                            reject(
                                new Error(
                                    'EasyConect Bluetooth connection timed out'
                                )
                            );
                        },
                        this._connectTimeoutMs
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
                'EasyConect Bluetooth transport is not connected'
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
            'EasyConect Bluetooth transport requires binary data'
        );
    }
}

export default EasyConectWebSocketTransport;
