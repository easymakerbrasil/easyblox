class BluetoothSocketSession {
    constructor ({
        socket,
        transport
    }) {
        if (
            !socket ||
            typeof socket.on !== 'function' ||
            typeof socket.send !== 'function' ||
            typeof socket.close !== 'function'
        ) {
            throw new Error(
                'Bluetooth socket session requires a socket'
            );
        }

        if (
            !transport ||
            typeof transport.connect !== 'function' ||
            typeof transport.disconnect !== 'function' ||
            typeof transport.write !== 'function' ||
            typeof transport.onData !== 'function' ||
            typeof transport.onError !== 'function' ||
            typeof transport.onDisconnect !== 'function'
        ) {
            throw new Error(
                'Bluetooth socket session requires a transport'
            );
        }

        this._socket = socket;
        this._transport = transport;
        this._socketClosed = false;
        this._transportReady = false;
        this._pendingWrites = [];
        this._writeChain = Promise.resolve();

        this._handleSocketMessage =
            this._handleSocketMessage.bind(this);

        this._handleSocketClose =
            this._handleSocketClose.bind(this);

        this._handleTransportData =
            this._handleTransportData.bind(this);

        this._handleTransportError =
            this._handleTransportError.bind(this);

        this._handleTransportDisconnect =
            this._handleTransportDisconnect.bind(this);
    }

    async start ({deviceId}) {
        this._socket.on(
            'message',
            this._handleSocketMessage
        );

        this._socket.on(
            'close',
            this._handleSocketClose
        );

        this._transport.onData(
            this._handleTransportData
        );

        this._transport.onError(
            this._handleTransportError
        );

        this._transport.onDisconnect(
            this._handleTransportDisconnect
        );

        await this._transport.connect({
            deviceId
        });

        this._transportReady = true;

        await this._drainPendingWrites();
    }

    _handleSocketMessage (
        bytes,
        isBinary
    ) {
        if (!isBinary) {
            this._closeSocket(
                1003,
                'Binary messages required'
            );

            return;
        }

        this._pendingWrites.push(
            Buffer.from(bytes)
        );

        this._drainPendingWrites()
            .catch(() => {
                this._closeSocket(
                    1011,
                    'Bluetooth transport error'
                );
            });
    }

    _drainPendingWrites () {
        if (
            !this._transportReady ||
            this._socketClosed
        ) {
            return this._writeChain;
        }

        while (
            this._pendingWrites.length > 0
        ) {
            const bytes =
                this._pendingWrites.shift();

            this._writeChain =
                this._writeChain.then(
                    () =>
                        this._transport.write(
                            bytes
                        )
                );
        }

        return this._writeChain;
    }

    _handleSocketClose () {
        this._socketClosed = true;
        this._transportReady = false;
        this._pendingWrites = [];

        Promise.resolve(
            this._transport.disconnect()
        ).catch(() => {
            // The socket is already closed.
        });
    }

    _handleTransportData (bytes) {
        if (this._socketClosed) {
            return;
        }

        this._socket.send(
            Buffer.from(bytes)
        );
    }

    _handleTransportError () {
        this._closeSocket(
            1011,
            'Bluetooth transport error'
        );
    }

    _handleTransportDisconnect () {
        this._transportReady = false;
        this._pendingWrites = [];

        this._closeSocket(
            1011,
            'Bluetooth connection lost'
        );
    }

    _closeSocket (
        code,
        reason
    ) {
        if (this._socketClosed) {
            return;
        }

        this._socketClosed = true;

        this._socket.close(
            code,
            reason
        );
    }
}

module.exports = BluetoothSocketSession;
