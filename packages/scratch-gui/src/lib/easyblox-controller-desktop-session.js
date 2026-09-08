import EasyBloxControllerDesktopConnection
    from './easyblox-controller-desktop-connection';
import EasyBloxHardwareServiceClient
    from './easyblox-hardware-service-client';

const createInitialState = () => ({
    status:
        'disconnected',
    devices: [],
    connectedDeviceLabel:
        null,
    errorCode:
        null
});

const getFriendlyDeviceLabel =
    device => {
        const label =
            device &&
            typeof device.label ===
                'string' ?
                device.label.trim() :
                '';

        return (
            label ||
            'Dispositivo Bluetooth'
        );
    };

class EasyBloxControllerDesktopSession {
    constructor (options = {}) {
        this._hardwareServiceClient =
            options.hardwareServiceClient ||
            new EasyBloxHardwareServiceClient();

        this._connection =
            options.connection ||
            new EasyBloxControllerDesktopConnection();

        this._state =
            createInitialState();

        this._deviceIds =
            new Map();

        this._stateListeners = [];

        this._connection.onDisconnect(
            () => {
                if (
                    this._state.status !==
                        'connected'
                ) {
                    return;
                }

                this._deviceIds.clear();

                this._setState({
                    status:
                        'disconnected',
                    devices: [],
                    errorCode:
                        'connection-lost'
                });
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
            connectedDeviceLabel:
                this._state
                    .connectedDeviceLabel,
            errorCode:
                this._state.errorCode
        };
    }

    onStateChange (listener) {
        if (
            typeof listener !==
                'function'
        ) {
            throw new Error(
                'Controller Desktop session state listener must be a function'
            );
        }

        this._stateListeners.push(
            listener
        );

        return () => {
            this._stateListeners =
                this._stateListeners
                    .filter(
                        registeredListener =>
                            registeredListener !==
                            listener
                    );
        };
    }

    async connect () {
        if (
            this._state.status ===
                'discovering' ||
            this._state.status ===
                'connecting' ||
            this._state.status ===
                'connected'
        ) {
            return false;
        }

        this._deviceIds.clear();

        this._setState({
            status:
                'discovering',
            devices: [],
            errorCode:
                null
        });

        let response;

        try {
            response =
                await this
                    ._hardwareServiceClient
                    .listBluetoothDevices();
        } catch (error) {
            this._setState({
                status:
                    'error',
                devices: [],
                errorCode:
                    'discovery-failed'
            });

            return false;
        }

        const devices =
            response &&
            Array.isArray(
                response.devices
            ) ?
                response.devices.filter(
                    device =>
                        device &&
                        typeof device.id ===
                            'string' &&
                        device.id.length > 0
                ) :
                [];

        if (
            devices.length === 0
        ) {
            this._setState({
                status:
                    'no-devices',
                devices: [],
                errorCode:
                    null
            });

            return false;
        }

        if (
            devices.length === 1
        ) {
            return this._connectDevice(
                devices[0].id,
                getFriendlyDeviceLabel(
                    devices[0]
                )
            );
        }

        const publicDevices =
            devices.map(
                (device, index) => {
                    const key =
                        `device-${index + 1}`;

                    this._deviceIds.set(
                        key,
                        device.id
                    );

                    return {
                        key,
                        label:
                            getFriendlyDeviceLabel(
                                device
                            )
                    };
                }
            );

        this._setState({
            status:
                'selecting',
            devices:
                publicDevices,
            errorCode:
                null
        });

        return true;
    }

    async selectDevice (key) {
        if (
            this._state.status !==
                'selecting'
        ) {
            return false;
        }

        const deviceId =
            this._deviceIds.get(
                key
            );

        const publicDevice =
            this._state.devices.find(
                device =>
                    device.key ===
                    key
            );

        if (
            !deviceId ||
            !publicDevice
        ) {
            return false;
        }

        return this._connectDevice(
            deviceId,
            publicDevice.label
        );
    }

    disconnect () {
        const disconnected =
            this._connection
                .disconnect();

        this._deviceIds.clear();

        this._setState(
            createInitialState()
        );

        return disconnected;
    }

    async _connectDevice (
        deviceId,
        deviceLabel
    ) {
        this._deviceIds.clear();

        this._setState({
            status:
                'connecting',
            devices: [],
            errorCode:
                null
        });

        try {
            await this._connection
                .connect({
                    deviceId
                });
        } catch (error) {
            this._setState({
                status:
                    'error',
                devices: [],
                errorCode:
                    'connection-failed'
            });

            return false;
        }

        this._setState({
            status:
                'connected',
            devices: [],
            connectedDeviceLabel:
                deviceLabel,
            errorCode:
                null
        });

        return true;
    }

    _setState (state) {
        this._state = {
            connectedDeviceLabel:
                null,
            ...state
        };

        const publicState =
            this.getState();

        for (
            const listener of
                [...this._stateListeners]
        ) {
            listener(
                publicState
            );
        }
    }
}

export default EasyBloxControllerDesktopSession;
