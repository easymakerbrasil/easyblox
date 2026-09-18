import {
    EasyConectConnection,
    createEasyConectDevice
} from '@easymaker/easyconect-core';

import EasyBloxHardwareServiceClient
    from './easyblox-hardware-service-client';
import EasyConectWebSocketTransport
    from './easyconect-websocket-transport';

class EasyConectDesktopClient {
    constructor (options = {}) {
        this._hardwareServiceClient =
            options.hardwareServiceClient ||
            new EasyBloxHardwareServiceClient();

        if (options.connection) {
            this._connection =
                options.connection;

            return;
        }

        const transport =
            options.transport ||
            new EasyConectWebSocketTransport();

        this._connection =
            new EasyConectConnection({
                transport
            });
    }

    async listDevices () {
        const response =
            await this
                ._hardwareServiceClient
                .listBluetoothDevices();

        const devices =
            response &&
            Array.isArray(
                response.devices
            ) ?
                response.devices :
                [];

        return devices.map(
            device =>
                createEasyConectDevice({
                    deviceId:
                        device.id,
                    name:
                        device.label
                })
        );
    }

    getState () {
        return this._connection
            .getState();
    }

    onStateChange (listener) {
        return this._connection
            .onStateChange(
                listener
            );
    }

    onError (listener) {
        return this._connection
            .onError(
                listener
            );
    }

    onDisconnect (listener) {
        return this._connection
            .onDisconnect(
                listener
            );
    }

    connect ({
        deviceId
    }) {
        return this._connection
            .connect({
                deviceId
            });
    }

    disconnect () {
        return this._connection
            .disconnect();
    }

    send (
        type,
        channel,
        payload
    ) {
        return this._connection
            .send(
                type,
                channel,
                payload
            );
    }

    waitFor (
        type,
        channel
    ) {
        return this._connection
            .waitFor(
                type,
                channel
            );
    }
}

export default EasyConectDesktopClient;
