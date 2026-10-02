const {
    EasyConectConnection
} = require(
    '@easymaker/easyconect-core'
);

const {
    EASYCONECT_WEB_SERIAL_DEVICE_ID,
    EasyConectWebSerialTransport
} = require(
    './easyconect-web-serial-transport'
);

class EasyConectWebClient {
    constructor (options = {}) {
        if (options.connection) {
            this._connection =
                options.connection;

            return;
        }

        const transport =
            options.transport ||
            new EasyConectWebSerialTransport(
                options.transportOptions ||
                    {}
            );

        this._connection =
            new EasyConectConnection({
                transport,
                handshakeTimeoutMs:
                    options.handshakeTimeoutMs
            });
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

    connect () {
        return this._connection
            .connect({
                deviceId:
                    EASYCONECT_WEB_SERIAL_DEVICE_ID
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

module.exports = {
    EasyConectWebClient
};
