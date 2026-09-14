const {
    EasyBloxConnectivityRuntime,
    EasyBloxConnectivitySession
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    validateEasyConectTransport,
    validateEasyConectDeviceId
} = require('./easyconect-transport');

class EasyConectConnection {
    constructor ({
        transport
    } = {}) {
        validateEasyConectTransport(
            transport
        );

        this._transport =
            transport;

        this._runtime =
            null;

        this._session =
            null;

        this._connecting =
            false;

        this._connected =
            false;

        this._writeChain =
            Promise.resolve();

        this._lastWritePromise =
            Promise.resolve();

        this._connectionFailureReject =
            null;

        this._handleTransportData =
            this._handleTransportData
                .bind(this);

        this._handleTransportError =
            this._handleTransportError
                .bind(this);

        this._handleTransportDisconnect =
            this._handleTransportDisconnect
                .bind(this);

        this._transport.onData(
            this._handleTransportData
        );

        this._transport.onError(
            this._handleTransportError
        );

        this._transport.onDisconnect(
            this._handleTransportDisconnect
        );
    }

    async connect ({
        deviceId
    } = {}) {
        validateEasyConectDeviceId(
            deviceId
        );

        if (
            this._connecting ||
            this._connected
        ) {
            throw new Error(
                'EasyConect connection is already active'
            );
        }

        this._connecting =
            true;

        const connectionFailure =
            new Promise(
                (
                    resolve,
                    reject
                ) => {
                    this._connectionFailureReject =
                        reject;
                }
            );

        try {
            await Promise.race([
                Promise.resolve(
                    this._transport.connect({
                        deviceId
                    })
                ),
                connectionFailure
            ]);

            this._runtime =
                new EasyBloxConnectivityRuntime();

            this._writeChain =
                Promise.resolve();

            this._lastWritePromise =
                Promise.resolve();

            this._session =
                new EasyBloxConnectivitySession({
                    runtime:
                        this._runtime,
                    write:
                        bytes =>
                            this._queueWrite(
                                bytes
                            )
                });

            const sessionReady =
                this._session.start();

            const helloWrite =
                this._lastWritePromise;

            await Promise.race([
                Promise.all([
                    helloWrite,
                    sessionReady
                ]),
                connectionFailure
            ]);

            this._connected =
                true;
        } catch (error) {
            this._resetProtocol();

            try {
                await Promise.resolve(
                    this._transport
                        .disconnect()
                );
            } catch (
                disconnectError
            ) {
                // Preserve the original connection failure.
            }

            throw error;
        } finally {
            this._connecting =
                false;

            this._connectionFailureReject =
                null;
        }
    }

    async disconnect () {
        if (
            !this._connected &&
            !this._session
        ) {
            return false;
        }

        this._resetProtocol();

        await Promise.resolve(
            this._transport.disconnect()
        );

        return true;
    }

    async send (
        type,
        channel,
        payload
    ) {
        this._assertActive();

        const sequence =
            this._session.send(
                type,
                channel,
                payload
            );

        const write =
            this._lastWritePromise;

        await write;

        return sequence;
    }

    waitFor (
        type,
        channel
    ) {
        this._assertActive();

        return this._runtime.waitFor(
            type,
            channel
        );
    }

    _queueWrite (bytes) {
        const payload =
            new Uint8Array(
                bytes
            );

        const write =
            this._writeChain.then(
                () =>
                    this._transport.write(
                        payload
                    )
            );

        this._lastWritePromise =
            write;

        this._writeChain =
            write.catch(
                error => {
                    this._handleTransportError(
                        error
                    );
                }
            );

        return write;
    }

    _handleTransportData (bytes) {
        if (!this._session) {
            return;
        }

        this._session.push(
            bytes
        );
    }

    _handleTransportError (error) {
        if (
            this._connecting &&
            this._connectionFailureReject
        ) {
            this._connectionFailureReject(
                error instanceof Error ?
                    error :
                    new Error(
                        'EasyConect transport error'
                    )
            );
        }
    }

    _handleTransportDisconnect () {
        if (
            this._connecting &&
            this._connectionFailureReject
        ) {
            this._connectionFailureReject(
                new Error(
                    'EasyConect transport disconnected during connection'
                )
            );
        }

        this._resetProtocol();
    }

    _assertActive () {
        if (
            !this._connected ||
            !this._session ||
            !this._runtime
        ) {
            throw new Error(
                'EasyConect protocol operation requires an active connection'
            );
        }
    }

    _resetProtocol () {
        if (this._runtime) {
            this._runtime
                .clearWaiters();
        }

        this._runtime =
            null;

        this._session =
            null;

        this._connected =
            false;

        this._writeChain =
            Promise.resolve();

        this._lastWritePromise =
            Promise.resolve();
    }
}

module.exports = {
    EasyConectConnection
};
