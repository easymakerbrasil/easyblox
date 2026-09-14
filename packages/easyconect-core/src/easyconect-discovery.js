const {
    validateEasyConectDeviceId
} = require('./easyconect-transport');

const EASYCONECT_DISCOVERY_METHODS =
    Object.freeze([
        'listDevices'
    ]);

const validateEasyConectDiscovery =
    discovery => {
        if (
            !discovery ||
            typeof discovery !==
                'object' ||
            Array.isArray(
                discovery
            )
        ) {
            throw new Error(
                'EasyConect discovery must be an object'
            );
        }

        for (
            const methodName of
            EASYCONECT_DISCOVERY_METHODS
        ) {
            if (
                typeof discovery[
                    methodName
                ] !==
                    'function'
            ) {
                throw new Error(
                    `EasyConect discovery method ${methodName} must be a function`
                );
            }
        }

        return true;
    };

const createEasyConectDevice =
    device => {
        if (
            !device ||
            typeof device !==
                'object' ||
            Array.isArray(
                device
            )
        ) {
            throw new Error(
                'EasyConect device must be an object'
            );
        }

        validateEasyConectDeviceId(
            device.deviceId
        );

        if (
            typeof device.name !==
                'string' ||
            device.name.trim().length ===
                0
        ) {
            throw new Error(
                'EasyConect device name must be a non-empty string'
            );
        }

        return Object.freeze({
            deviceId:
                device.deviceId,
            name:
                device.name
        });
    };

module.exports = {
    EASYCONECT_DISCOVERY_METHODS,
    validateEasyConectDiscovery,
    createEasyConectDevice
};
