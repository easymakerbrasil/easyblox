const BluetoothSerialTransport =
    require('./bluetooth-serial-transport');

const SerialPortAdapter =
    require('./serial-port-adapter');

const {
    WindowsBluetoothDeviceNameResolver,
    extractRemoteBluetoothAddress
} = require(
    './windows-bluetooth-device-name-resolver'
);

module.exports = {
    BluetoothSerialTransport,
    SerialPortAdapter,
    WindowsBluetoothDeviceNameResolver,
    extractRemoteBluetoothAddress
};
