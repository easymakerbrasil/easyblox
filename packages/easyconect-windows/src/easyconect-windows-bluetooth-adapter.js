const {
    createEasyConectDevice,
    validateEasyConectTransport
} = require(
    '@easymaker/easyconect-core'
);

const {
    BluetoothSerialTransport,
    SerialPortAdapter,
    WindowsBluetoothDeviceNameResolver
} = require(
    '@easymaker/easyblox-windows-bluetooth'
);

const createDefaultTransport =
    () =>
        new BluetoothSerialTransport({
            serialAdapter:
                new SerialPortAdapter(),
            deviceNameResolver:
                new WindowsBluetoothDeviceNameResolver()
        });

class EasyConectWindowsBluetoothAdapter {
    constructor ({
        transport =
            createDefaultTransport()
    } = {}) {
        validateEasyConectTransport(
            transport
        );

        if (
            typeof transport.listDevices !==
                'function'
        ) {
            throw new Error(
                'EasyConect Windows Bluetooth transport listDevices must be a function'
            );
        }

        this._transport =
            transport;
    }

    async listDevices () {
        const devices =
            await this._transport
                .listDevices();

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

    connect ({
        deviceId
    }) {
        return this._transport.connect({
            deviceId
        });
    }

    disconnect () {
        return this._transport
            .disconnect();
    }

    write (bytes) {
        return this._transport.write(
            bytes
        );
    }

    onData (listener) {
        return this._transport.onData(
            listener
        );
    }

    onError (listener) {
        return this._transport.onError(
            listener
        );
    }

    onDisconnect (listener) {
        return this._transport
            .onDisconnect(
                listener
            );
    }
}

module.exports = {
    EasyConectWindowsBluetoothAdapter
};
