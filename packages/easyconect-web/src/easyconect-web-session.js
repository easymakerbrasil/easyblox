const {
    EasyConectControlsSession,
    EasyConectGamepadSession,
    EasyConectMotorsServoSession,
    EasyConectOutputsSession,
    EasyConectTerminalSession
} = require(
    '@easymaker/easyconect-core'
);

const {
    EasyConectWebClient
} = require(
    './easyconect-web-client'
);

const createDisconnectedState =
    errorCode => ({
        status:
            'disconnected',
        errorCode:
            errorCode || null
    });

class EasyConectWebSession {
    constructor (options = {}) {
        this._client =
            options.client ||
            new EasyConectWebClient();

        this._controlsSessionFactory =
            options.controlsSessionFactory ||
            (
                connection =>
                    new EasyConectControlsSession({
                        connection
                    })
            );

        this._motorsServoSessionFactory =
            options.motorsServoSessionFactory ||
            (
                connection =>
                    new EasyConectMotorsServoSession({
                        connection
                    })
            );

        this._gamepadSessionFactory =
            options.gamepadSessionFactory ||
            (
                connection =>
                    new EasyConectGamepadSession({
                        connection
                    })
            );

        this._terminalSessionFactory =
            options.terminalSessionFactory ||
            (
                connection =>
                    new EasyConectTerminalSession({
                        connection
                    })
            );

        this._outputsSessionFactory =
            options.outputsSessionFactory ||
            (
                connection =>
                    new EasyConectOutputsSession({
                        connection
                    })
            );

        this._state =
            createDisconnectedState(
                null
            );

        this._stateListeners =
            new Set();

        this._controlsSession =
            null;

        this._motorsServoSession =
            null;

        this._gamepadSession =
            null;

        this._terminalSession =
            null;

        this._outputsSession =
            null;

        this._connectionGeneration =
            0;

        this._pendingConnectPromise =
            null;

        this._unsubscribeDisconnect =
            this._client
                .onDisconnect(
                    () => {
                        this._handleUnexpectedDisconnect();
                    }
                );
    }

    getState () {
        return {
            status:
                this._state.status,
            errorCode:
                this._state.errorCode
        };
    }

    getControlsSession () {
        return this._controlsSession;
    }

    getMotorsServoSession () {
        return this._motorsServoSession;
    }

    getGamepadSession () {
        return this._gamepadSession;
    }

    getTerminalSession () {
        return this._terminalSession;
    }

    getOutputsSession () {
        return this._outputsSession;
    }

    onStateChange (listener) {
        if (
            typeof listener !==
                'function'
        ) {
            throw new Error(
                'EasyConect Web state listener must be a function'
            );
        }

        this._stateListeners.add(
            listener
        );

        return () => {
            this._stateListeners.delete(
                listener
            );
        };
    }

    async connect () {
        if (
            this._state.status ===
                'connected'
        ) {
            return true;
        }

        if (
            this._state.status ===
                'connecting' ||
            this._state.status ===
                'disconnecting'
        ) {
            return false;
        }

        const generation =
            this._connectionGeneration +
            1;

        this._connectionGeneration =
            generation;

        this._clearModuleSessions();

        this._setState({
            status:
                'connecting',
            errorCode:
                null
        });

        let connectPromise =
            null;

        try {
            connectPromise =
                Promise.resolve(
                    this._client
                        .connect()
                );

            this._pendingConnectPromise =
                connectPromise;

            await connectPromise;
        } catch (error) {
            if (
                generation !==
                    this._connectionGeneration
            ) {
                return false;
            }

            this._setState({
                status:
                    'error',
                errorCode:
                    'connection-failed'
            });

            return false;
        } finally {
            if (
                this._pendingConnectPromise ===
                    connectPromise
            ) {
                this._pendingConnectPromise =
                    null;
            }
        }

        if (
            generation !==
                this._connectionGeneration
        ) {
            return false;
        }

        this._createModuleSessions(
            generation
        );

        this._setState({
            status:
                'connected',
            errorCode:
                null
        });

        return true;
    }

    async disconnect () {
        const wasActive =
            this._state.status !==
                'disconnected' ||
            this._controlsSession !==
                null ||
            this._motorsServoSession !==
                null ||
            this._gamepadSession !==
                null ||
            this._terminalSession !==
                null ||
            this._outputsSession !==
                null;

        const pendingConnectPromise =
            this._pendingConnectPromise;

        this._connectionGeneration += 1;

        this._clearModuleSessions();

        if (!wasActive) {
            return false;
        }

        this._setState({
            status:
                'disconnecting',
            errorCode:
                null
        });

        const disconnected =
            await this._disconnectClient(
                pendingConnectPromise
            );

        this._setState(
            createDisconnectedState(
                null
            )
        );

        return Boolean(
            disconnected ||
            wasActive
        );
    }

    dispose () {
        const pendingConnectPromise =
            this._pendingConnectPromise;

        this._connectionGeneration += 1;

        this._clearModuleSessions();

        this._disconnectClient(
            pendingConnectPromise
        );

        if (
            this._unsubscribeDisconnect
        ) {
            this._unsubscribeDisconnect();

            this._unsubscribeDisconnect =
                null;
        }

        this._stateListeners.clear();
    }

    _createModuleSessions (
        generation
    ) {
        this._controlsSession =
            this._controlsSessionFactory(
                this._client
            );

        this._motorsServoSession =
            this._motorsServoSessionFactory(
                this._client
            );

        this._gamepadSession =
            this._gamepadSessionFactory(
                this._client
            );

        const terminalSession =
            this._terminalSessionFactory(
                this._client
            );

        this._terminalSession =
            terminalSession;

        this._startTerminalReceivers(
            terminalSession,
            generation
        );

        const outputsSession =
            this._outputsSessionFactory(
                this._client
            );

        this._outputsSession =
            outputsSession;

        this._startOutputsReceiver(
            outputsSession,
            generation
        );
    }

    async _disconnectClient (
        pendingConnectPromise
    ) {
        let disconnected =
            false;

        try {
            disconnected =
                await this._client
                    .disconnect();
        } catch (error) {
            disconnected =
                false;
        }

        if (!pendingConnectPromise) {
            return disconnected;
        }

        try {
            await pendingConnectPromise;
        } catch (error) {
            return disconnected;
        }

        let lateDisconnected =
            false;

        try {
            lateDisconnected =
                await this._client
                    .disconnect();
        } catch (error) {
            lateDisconnected =
                false;
        }

        return Boolean(
            disconnected ||
            lateDisconnected
        );
    }

    _startTerminalReceivers (
        terminalSession,
        generation
    ) {
        this._consumeTerminal(
            terminalSession,
            generation,
            'waitForText'
        );

        this._consumeTerminal(
            terminalSession,
            generation,
            'waitForNumber'
        );
    }

    async _consumeTerminal (
        terminalSession,
        generation,
        methodName
    ) {
        if (
            !this._isCurrentTerminal(
                terminalSession,
                generation
            )
        ) {
            return;
        }

        try {
            await terminalSession[
                methodName
            ]();
        } catch (error) {
            return;
        }

        if (
            !this._isCurrentTerminal(
                terminalSession,
                generation
            )
        ) {
            return;
        }

        this._consumeTerminal(
            terminalSession,
            generation,
            methodName
        );
    }

    _isCurrentTerminal (
        terminalSession,
        generation
    ) {
        return (
            generation ===
                this._connectionGeneration &&
            terminalSession ===
                this._terminalSession
        );
    }

    _startOutputsReceiver (
        outputsSession,
        generation
    ) {
        this._consumeOutputs(
            outputsSession,
            generation
        );
    }

    async _consumeOutputs (
        outputsSession,
        generation
    ) {
        if (
            !this._isCurrentOutputs(
                outputsSession,
                generation
            )
        ) {
            return;
        }

        try {
            await outputsSession
                .waitForIndicator();
        } catch (error) {
            return;
        }

        if (
            !this._isCurrentOutputs(
                outputsSession,
                generation
            )
        ) {
            return;
        }

        this._consumeOutputs(
            outputsSession,
            generation
        );
    }

    _isCurrentOutputs (
        outputsSession,
        generation
    ) {
        return (
            generation ===
                this._connectionGeneration &&
            outputsSession ===
                this._outputsSession
        );
    }

    _handleUnexpectedDisconnect () {
        if (
            this._state.status !==
                'connected'
        ) {
            return;
        }

        this._connectionGeneration += 1;

        this._clearModuleSessions();

        this._setState(
            createDisconnectedState(
                'connection-lost'
            )
        );
    }

    _clearModuleSessions () {
        this._controlsSession =
            null;

        this._motorsServoSession =
            null;

        this._gamepadSession =
            null;

        this._terminalSession =
            null;

        this._outputsSession =
            null;
    }

    _setState (state) {
        this._state = {
            ...state
        };

        const publicState =
            this.getState();

        for (
            const listener of
            [...this._stateListeners]
        ) {
            try {
                listener(
                    publicState
                );
            } catch (error) {
                // Session observers cannot alter connection semantics.
            }
        }
    }
}

module.exports = {
    EasyConectWebSession
};
