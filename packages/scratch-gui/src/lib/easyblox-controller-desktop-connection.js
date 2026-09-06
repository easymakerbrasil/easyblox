import {
    ControllerConnectivityClient
} from '@easymaker/easyblox-controller-core';

import EasyBloxControllerDesktopTransport
    from './easyblox-controller-desktop-transport';

const DEFAULT_LIVENESS_INTERVAL_MS =
    2000;
const DEFAULT_LIVENESS_TIMEOUT_MS =
    3000;

class EasyBloxControllerDesktopConnection {
    constructor (options = {}) {
        this._transport =
            options.transport ||
            new EasyBloxControllerDesktopTransport();

        this._ConnectivityClientClass =
            options.ConnectivityClientClass ||
            ControllerConnectivityClient;

        this._client = null;
        this._state = 'disconnected';
        this._stateListeners = [];
        this._disconnectListeners = [];

        this._livenessIntervalMs =
            Number.isFinite(
                options.livenessIntervalMs
            ) &&
            options.livenessIntervalMs > 0 ?
                options.livenessIntervalMs :
                DEFAULT_LIVENESS_INTERVAL_MS;

        this._livenessTimeoutMs =
            Number.isFinite(
                options.livenessTimeoutMs
            ) &&
            options.livenessTimeoutMs > 0 ?
                options.livenessTimeoutMs :
                DEFAULT_LIVENESS_TIMEOUT_MS;

        this._livenessTimer = null;
        this._livenessTimeoutTimer = null;
        this._probeInFlight = false;

        this._transport.onData(
            bytes => {
                if (!this._client) {
                    return;
                }

                this._client.receive(
                    bytes
                );
            }
        );

        this._transport.onDisconnect(
            () => {
                this._handleUnexpectedDisconnect();
            }
        );
    }

    getState () {
        return this._state;
    }

    onStateChange (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'Controller Desktop state listener must be a function'
            );
        }

        this._stateListeners.push(
            listener
        );
    }

    onDisconnect (listener) {
        if (typeof listener !== 'function') {
            throw new Error(
                'Controller Desktop disconnect listener must be a function'
            );
        }

        this._disconnectListeners.push(
            listener
        );
    }

    async connect ({deviceId}) {
        if (
            this._state !==
                'disconnected'
        ) {
            throw new Error(
                'Controller Desktop is already connecting or connected'
            );
        }

        this._setState(
            'connecting'
        );

        const client =
            new this._ConnectivityClientClass({
                write: bytes =>
                    this._transport.write(
                        bytes
                    )
            });

        this._client = client;

        try {
            await this._transport.connect({
                deviceId
            });
        } catch (error) {
            this._client = null;
            this._setState(
                'disconnected'
            );

            throw new Error(
                'Controller Bluetooth connection failed'
            );
        }

        try {
            await client.startSession();
        } catch (error) {
            this._client = null;
            this._setState(
                'disconnected'
            );

            this._transport.disconnect();

            throw new Error(
                'Controller Bluetooth session failed'
            );
        }

        this._setState(
            'connected'
        );

        this._startLivenessWatch();
    }

    disconnect () {
        if (
            this._state ===
                'disconnected'
        ) {
            return false;
        }

        this._stopLivenessWatch();

        this._client = null;
        this._setState(
            'disconnected'
        );

        this._transport.disconnect();

        return true;
    }

    _startLivenessWatch () {
        this._stopLivenessWatch();

        this._livenessTimer =
            setInterval(
                () => {
                    this._probeLiveness();
                },
                this._livenessIntervalMs
            );
    }

    _stopLivenessWatch () {
        if (
            this._livenessTimer !==
                null
        ) {
            clearInterval(
                this._livenessTimer
            );

            this._livenessTimer =
                null;
        }

        if (
            this._livenessTimeoutTimer !==
                null
        ) {
            clearTimeout(
                this._livenessTimeoutTimer
            );

            this._livenessTimeoutTimer =
                null;
        }

        this._probeInFlight =
            false;
    }

    _probeLiveness () {
        if (
            this._state !==
                'connected' ||
            !this._client ||
            this._probeInFlight
        ) {
            return;
        }

        const client =
            this._client;

        this._probeInFlight =
            true;

        let probe;

        try {
            probe =
                client.probe();
        } catch (error) {
            this._handleLivenessFailure(
                client
            );

            return;
        }

        this._livenessTimeoutTimer =
            setTimeout(
                () => {
                    this._livenessTimeoutTimer =
                        null;

                    if (
                        this._state !==
                            'connected' ||
                        this._client !==
                            client ||
                        !this._probeInFlight
                    ) {
                        return;
                    }

                    this._handleLivenessFailure(
                        client
                    );
                },
                this._livenessTimeoutMs
            );

        Promise.resolve(
            probe
        ).then(
            () => {
                if (
                    this._state !==
                        'connected' ||
                    this._client !==
                        client ||
                    !this._probeInFlight
                ) {
                    return;
                }

                if (
                    this._livenessTimeoutTimer !==
                        null
                ) {
                    clearTimeout(
                        this._livenessTimeoutTimer
                    );

                    this._livenessTimeoutTimer =
                        null;
                }

                this._probeInFlight =
                    false;
            },
            () => {
                this._handleLivenessFailure(
                    client
                );
            }
        );
    }

    _handleLivenessFailure (
        client
    ) {
        if (
            this._state !==
                'connected' ||
            this._client !==
                client
        ) {
            return;
        }

        this._handleUnexpectedDisconnect();

        this._transport.disconnect();
    }

    _handleUnexpectedDisconnect () {
        if (
            this._state ===
                'disconnected'
        ) {
            return;
        }

        this._stopLivenessWatch();

        this._client = null;

        this._setState(
            'disconnected'
        );

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

    _setState (state) {
        if (this._state === state) {
            return;
        }

        this._state = state;

        for (
            const listener of
                [...this._stateListeners]
        ) {
            listener(state);
        }
    }
}

export default EasyBloxControllerDesktopConnection;
