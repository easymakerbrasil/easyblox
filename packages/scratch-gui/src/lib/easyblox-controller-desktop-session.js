import EasyBloxControllerDesktopConnection
    from './easyblox-controller-desktop-connection';
import EasyBloxHardwareServiceClient
    from './easyblox-hardware-service-client';

const createInitialState = () => ({
    status:
        'disconnected',
    devices: [],
    errorCode:
        null
});

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
                devices[0].id
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
                            typeof device.label ===
                                'string' &&
                            device.label.length > 0 ?
                                device.label :
                                'Dispositivo Bluetooth'
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

        if (!deviceId) {
            return false;
        }

        return this._connectDevice(
            deviceId
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
        deviceId
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
            errorCode:
                null
        });

        return true;
    }

    _setState (state) {
        this._state = state;

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
