const EASYCONECT_TRANSPORT_METHODS =
    Object.freeze([
        'connect',
        'disconnect',
        'write',
        'onData',
        'onError',
        'onDisconnect'
    ]);

const validateEasyConectTransport =
    transport => {
        if (
            !transport ||
            typeof transport !==
                'object' ||
            Array.isArray(
                transport
            )
        ) {
            throw new Error(
                'EasyConect transport must be an object'
            );
        }

        for (
            const methodName of
            EASYCONECT_TRANSPORT_METHODS
        ) {
            if (
                typeof transport[
                    methodName
                ] !==
                    'function'
            ) {
                throw new Error(
                    `EasyConect transport method ${methodName} must be a function`
                );
            }
        }

        return true;
    };

const validateEasyConectDeviceId =
    deviceId => {
        if (
            typeof deviceId !==
                'string' ||
            deviceId.trim().length ===
                0
        ) {
            throw new Error(
                'EasyConect device id must be a non-empty string'
            );
        }

        return true;
    };

module.exports = {
    EASYCONECT_TRANSPORT_METHODS,
    validateEasyConectTransport,
    validateEasyConectDeviceId
};
