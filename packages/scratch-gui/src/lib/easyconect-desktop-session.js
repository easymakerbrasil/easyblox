import {
    EasyConectControlsSession,
    EasyConectGamepadSession,
    EasyConectMotorsServoSession,
    EasyConectOutputsSession,
    EasyConectTerminalSession
} from '@easymaker/easyconect-core';

import EasyConectDesktopClient
    from './easyconect-desktop-client';

const createDisconnectedState =
    errorCode => ({
        status:
            'disconnected',
        devices: [],
        connectedDeviceName:
            null,
        errorCode:
            errorCode || null
    });

class EasyConectDesktopSession {
    constructor (options = {}) {
        this._client =
            options.client ||
            new EasyConectDesktopClient();

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

        this._gamepadSessionFactory =
            options.gamepadSessionFactory ||
            (
                connection =>
                    new EasyConectGamepadSession({
                        connection
                    })
            );

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

        this._state =
            createDisconnectedState(
                null
            );

        this._stateListeners =
            new Set();

        this._deviceChoices =
            new Map();

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
            devices:
                this._state.devices.map(
                    device => ({
                        ...device
                    })
                ),
            connectedDeviceName:
                this._state.connectedDeviceName,
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
                'EasyConect Desktop state listener must be a function'
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
                'discovering' ||
            this._state.status ===
                'connecting' ||
            this._state.status ===
                'disconnecting'
        ) {
            return false;
        }

        const generation =
            this._connectionGeneration;

        this._deviceChoices.clear();

        this._setState({
            status:
                'discovering',
            devices: [],
            connectedDeviceName:
                null,
            errorCode:
                null
        });

        let devices;

        try {
            devices =
                await this._client
                    .listDevices();
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
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    'discovery-failed'
            });

            return false;
        }

        if (
            generation !==
            this._connectionGeneration
        ) {
            return false;
        }

        if (
            !Array.isArray(devices) ||
            devices.length === 0
        ) {
            this._setState({
                status:
                    'no-devices',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    null
            });

            return false;
        }

        if (devices.length === 1) {
            return this._connectDevice(
                devices[0]
            );
        }

        const publicDevices =
            devices.map(
                (
                    device,
                    index
                ) => {
                    const key =
                        `device-${index + 1}`;

                    this._deviceChoices.set(
                        key,
                        device
                    );

                    return {
                        key,
                        label:
                            device.name
                    };
                }
            );

        this._setState({
            status:
                'selecting',
            devices:
                publicDevices,
            connectedDeviceName:
                null,
            errorCode:
                null
        });

        return false;
    }

    selectDevice (key) {
        if (
            this._state.status !==
                'selecting' ||
            typeof key !==
                'string' ||
            !this._deviceChoices.has(
                key
            )
        ) {
            return Promise.resolve(
                false
            );
        }

        const device =
            this._deviceChoices.get(
                key
            );

        return this._connectDevice(
            device
        );
    }

    async disconnect () {
        const wasActive =
            this._state.status !==
                'disconnected' ||
            this._terminalSession !==
                null ||
            this._outputsSession !==
                null ||
            this._gamepadSession !==
                null;

        const pendingConnectPromise =
            this._pendingConnectPromise;

        this._connectionGeneration += 1;
        this._controlsSession = null;
        this._motorsServoSession = null;
        this._terminalSession = null;
        this._outputsSession = null;
        this._gamepadSession = null;
        this._deviceChoices.clear();

        if (!wasActive) {
            return false;
        }

        this._setState({
            status:
                'disconnecting',
            devices: [],
            connectedDeviceName:
                null,
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
        this._controlsSession = null;
        this._terminalSession = null;
        this._outputsSession = null;
        this._gamepadSession = null;
        this._deviceChoices.clear();

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

    async _connectDevice (device) {
        const generation =
            this._connectionGeneration +
            1;

        this._connectionGeneration =
            generation;
        this._controlsSession = null;
        this._terminalSession = null;
        this._outputsSession = null;
        this._gamepadSession = null;
        this._deviceChoices.clear();

        this._setState({
            status:
                'connecting',
            devices: [],
            connectedDeviceName:
                null,
            errorCode:
                null
        });

        let connectPromise =
            null;

        try {
            connectPromise =
                Promise.resolve(
                    this._client
                        .connect({
                            deviceId:
                                device.deviceId
                        })
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
                devices: [],
                connectedDeviceName:
                    null,
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

        this._gamepadSession =
            this._gamepadSessionFactory(
                this._client
            );

        this._controlsSession =
            this._controlsSessionFactory(
                this._client
            );

        this._motorsServoSession =
            this._motorsServoSessionFactory(
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

        this._setState({
            status:
                'connected',
            devices: [],
            connectedDeviceName:
                device.name,
            errorCode:
                null
        });

        return true;
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
        this._controlsSession = null;
        this._motorsServoSession = null;
        this._terminalSession = null;
        this._outputsSession = null;
        this._gamepadSession = null;
        this._deviceChoices.clear();

        this._setState(
            createDisconnectedState(
                'connection-lost'
            )
        );
    }

    _setState (state) {
        this._state = {
            ...state,
            devices:
                state.devices.map(
                    device => ({
                        ...device
                    })
                )
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

export default EasyConectDesktopSession;
