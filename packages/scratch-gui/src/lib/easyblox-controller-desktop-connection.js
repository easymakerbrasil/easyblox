import {
    ControllerConnectivityClient
} from '@easymaker/easyblox-controller-core';

import EasyBloxControllerDesktopTransport
    from './easyblox-controller-desktop-transport';

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
                if (
                    this._state ===
                        'disconnected'
                ) {
                    return;
                }

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
    }

    disconnect () {
        if (
            this._state ===
                'disconnected'
        ) {
            return false;
        }

        this._client = null;
        this._setState(
            'disconnected'
        );

        this._transport.disconnect();

        return true;
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
