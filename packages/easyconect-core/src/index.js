const {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_GAMEPAD_MODULE
} = require('./easyconect-contract');

const {
    EASYCONECT_SIGNAL_WIRE_CHANNELS,
    getEasyConectWireChannel,
    getEasyConectSignalIdForWireChannel
} = require('./easyconect-wire-contract');

const {
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue
} = require('./easyconect-registry');

const {
    EasyConectState
} = require('./easyconect-state');

const {
    EASYCONECT_TRANSPORT_METHODS,
    validateEasyConectTransport,
    validateEasyConectDeviceId
} = require('./easyconect-transport');

const {
    EASYCONECT_DISCOVERY_METHODS,
    validateEasyConectDiscovery,
    createEasyConectDevice
} = require('./easyconect-discovery');

const {
    EASYCONECT_CONNECTION_STATES,
    EasyConectConnection
} = require('./easyconect-connection');

module.exports = {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_GAMEPAD_MODULE,
    EASYCONECT_SIGNAL_WIRE_CHANNELS,
    getEasyConectWireChannel,
    getEasyConectSignalIdForWireChannel,
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue,
    EasyConectState,
    EASYCONECT_TRANSPORT_METHODS,
    validateEasyConectTransport,
    validateEasyConectDeviceId,
    EASYCONECT_DISCOVERY_METHODS,
    validateEasyConectDiscovery,
    createEasyConectDevice,
    EASYCONECT_CONNECTION_STATES,
    EasyConectConnection
};
