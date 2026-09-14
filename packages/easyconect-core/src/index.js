const {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_GAMEPAD_MODULE
} = require('./easyconect-contract');

const {
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue
} = require('./easyconect-registry');

const {
    EasyConectState
} = require('./easyconect-state');

module.exports = {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_GAMEPAD_MODULE,
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue,
    EasyConectState
};
