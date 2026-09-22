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

const EASYCONECT_CONNECTION_STATES =
    Object.freeze({
        DISCONNECTED:
            'disconnected',
        CONNECTING:
            'connecting',
        CONNECTED:
            'connected',
        DISCONNECTING:
            'disconnecting'
    });

const DEFAULT_HANDSHAKE_TIMEOUT_MS =
    10000;


class EasyConectConnection {
    constructor ({
        transport,
        handshakeTimeoutMs =
            DEFAULT_HANDSHAKE_TIMEOUT_MS
    } = {}) {
        validateEasyConectTransport(
            transport
        );

        this._transport =
            transport;

        this._handshakeTimeoutMs =
            handshakeTimeoutMs;

        this._runtime =
            null;

        this._session =
            null;

        this._state =
            EASYCONECT_CONNECTION_STATES
                .DISCONNECTED;

        this._writeChain =
            Promise.resolve();

        this._lastWritePromise =
            Promise.resolve();

        this._connectionFailureReject =
            null;

        this._connectionAbortError =
            null;

        this._stateListeners =
            new Set();

        this._errorListeners =
            new Set();

        this._disconnectListeners =
            new Set();

        this._waiterRejectors =
            new Set();

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

    getState () {
        return this._state;
    }

    onStateChange (listener) {
        if (
            typeof listener !==
                'function'
        ) {
            throw new Error(
                'EasyConect state listener must be a function'
            );
        }

        this._stateListeners.add(
            listener
        );

        return () =>
            this._stateListeners.delete(
                listener
            );
    }

    onError (listener) {
        if (
            typeof listener !==
                'function'
        ) {
            throw new Error(
                'EasyConect error listener must be a function'
            );
        }

        this._errorListeners.add(
            listener
        );

        return () =>
            this._errorListeners.delete(
                listener
            );
    }

    onDisconnect (listener) {
        if (
            typeof listener !==
                'function'
        ) {
            throw new Error(
                'EasyConect disconnect listener must be a function'
            );
        }

        this._disconnectListeners.add(
            listener
        );

        return () =>
            this._disconnectListeners.delete(
                listener
            );
    }

    async connect ({
        deviceId
    } = {}) {
        validateEasyConectDeviceId(
            deviceId
        );

        if (
            this._state !==
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTED
        ) {
            throw new Error(
                'EasyConect connection is already active'
            );
        }

        this._setState(
            EASYCONECT_CONNECTION_STATES
                .CONNECTING
        );

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

        let handshakeTimeoutId =
            null;

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

            const handshakeTimeout =
                new Promise(
                    (
                        resolve,
                        reject
                    ) => {
                        handshakeTimeoutId =
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            'EasyConect handshake timed out'
                                        )
                                    ),
                                this._handshakeTimeoutMs
                            );
                    }
                );

            await Promise.race([
                Promise.all([
                    helloWrite,
                    sessionReady
                ]),
                connectionFailure,
                handshakeTimeout
            ]);

            this._setState(
                EASYCONECT_CONNECTION_STATES
                    .CONNECTED
            );
        } catch (error) {
            const isExplicitAbort =
                error ===
                this._connectionAbortError;

            this._resetProtocol(
                error
            );

            if (!isExplicitAbort) {
                this._setState(
                    EASYCONECT_CONNECTION_STATES
                        .DISCONNECTED
                );

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
            }

            throw error;
        } finally {
            if (
                handshakeTimeoutId !==
                null
            ) {
                clearTimeout(
                    handshakeTimeoutId
                );

                handshakeTimeoutId =
                    null;
            }

            this._connectionFailureReject =
                null;

            this._connectionAbortError =
                null;
        }
    }

    async disconnect () {
        if (
            this._state ===
                EASYCONECT_CONNECTION_STATES
                    .CONNECTING
        ) {
            const abortError =
                new Error(
                    'EasyConect connection closed'
                );

            this._connectionAbortError =
                abortError;

            this._setState(
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTING
            );

            if (this._connectionFailureReject) {
                this._connectionFailureReject(
                    abortError
                );
            }

            try {
                await Promise.resolve(
                    this._transport.disconnect()
                );
            } finally {
                this._setState(
                    EASYCONECT_CONNECTION_STATES
                        .DISCONNECTED
                );
            }

            return true;
        }

        if (
            this._state !==
                EASYCONECT_CONNECTION_STATES
                    .CONNECTED
        ) {
            return false;
        }

        this._setState(
            EASYCONECT_CONNECTION_STATES
                .DISCONNECTING
        );

        this._resetProtocol(
            new Error(
                'EasyConect connection closed'
            )
        );

        try {
            await Promise.resolve(
                this._transport.disconnect()
            );
        } finally {
            this._setState(
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTED
            );
        }

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

        const runtimeWait =
            this._runtime.waitFor(
                type,
                channel
            );

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const rejectWaiter =
                    error => {
                        this._waiterRejectors
                            .delete(
                                rejectWaiter
                            );

                        reject(
                            error
                        );
                    };

                this._waiterRejectors.add(
                    rejectWaiter
                );

                runtimeWait.then(
                    message => {
                        this._waiterRejectors
                            .delete(
                                rejectWaiter
                            );

                        resolve(
                            message
                        );
                    },
                    error => {
                        this._waiterRejectors
                            .delete(
                                rejectWaiter
                            );

                        reject(
                            error
                        );
                    }
                );
            }
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
        const normalizedError =
            error instanceof Error ?
                error :
                new Error(
                    'EasyConect transport error'
                );

        this._notifyListeners(
            this._errorListeners,
            normalizedError
        );

        if (
            this._state ===
                EASYCONECT_CONNECTION_STATES
                    .CONNECTING &&
            this._connectionFailureReject
        ) {
            this._connectionFailureReject(
                normalizedError
            );
        }
    }

    _handleTransportDisconnect () {
        if (
            this._state ===
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTED
        ) {
            return;
        }

        if (
            this._state ===
                EASYCONECT_CONNECTION_STATES
                    .CONNECTING
        ) {
            const error =
                new Error(
                    'EasyConect transport disconnected during connection'
                );

            if (
                this._connectionFailureReject
            ) {
                this._connectionFailureReject(
                    error
                );
            }

            this._resetProtocol(
                error
            );

            this._setState(
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTED
            );

            return;
        }

        if (
            this._state ===
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTING
        ) {
            this._resetProtocol(
                new Error(
                    'EasyConect connection closed'
                )
            );

            this._setState(
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTED
            );

            return;
        }

        const error =
            new Error(
                'EasyConect connection lost'
            );

        this._resetProtocol(
            error
        );

        this._setState(
            EASYCONECT_CONNECTION_STATES
                .DISCONNECTED
        );

        this._notifyListeners(
            this._disconnectListeners
        );
    }

    _assertActive () {
        if (
            this._state !==
                EASYCONECT_CONNECTION_STATES
                    .CONNECTED ||
            !this._session ||
            !this._runtime
        ) {
            throw new Error(
                'EasyConect protocol operation requires an active connection'
            );
        }
    }

    _setState (state) {
        if (
            this._state ===
                state
        ) {
            return;
        }

        this._state =
            state;

            this._notifyListeners(
                this._stateListeners,
                state
            );
        }

        _notifyListeners (
            listeners,
            ...args
        ) {
            for (
                const listener of
                [...listeners]
            ) {
                try {
                    listener(
                        ...args
                    );
                } catch (error) {
                    // Observer failures must not control connection lifecycle.
                }
            }
        }

        _resetProtocol (
        waiterError =
            new Error(
                'EasyConect connection closed'
            )
    ) {
        if (this._runtime) {
            this._runtime
                .clearWaiters();
        }

        for (
            const rejectWaiter of
            [...this._waiterRejectors]
        ) {
            rejectWaiter(
                waiterError
            );
        }

        this._waiterRejectors.clear();

        this._runtime =
            null;

        this._session =
            null;

        this._writeChain =
            Promise.resolve();

        this._lastWritePromise =
            Promise.resolve();
    }
}

module.exports = {
    EASYCONECT_CONNECTION_STATES,
    EasyConectConnection
};
