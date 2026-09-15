const {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_GAMEPAD_MODULE,
    EASYCONECT_CONTROLS_MODULE,
    EASYCONECT_MOTORS_SERVO_MODULE
} = require('./easyconect-contract');

const EASYCONECT_MODULES =
    Object.freeze([
        EASYCONECT_GAMEPAD_MODULE,
        EASYCONECT_CONTROLS_MODULE,
        EASYCONECT_MOTORS_SERVO_MODULE
    ]);

const getEasyConectModuleContract =
    moduleId => {
        if (
            typeof moduleId !==
                'string' ||
            moduleId.length ===
                0
        ) {
            return null;
        }

        return EASYCONECT_MODULES
            .find(
                moduleContract =>
                    moduleContract.id ===
                        moduleId
            ) ||
            null;
    };

const getEasyConectSignalContract =
    signalId => {
        if (
            typeof signalId !==
                'string' ||
            signalId.length ===
                0
        ) {
            return null;
        }

        for (
            const moduleContract of
            EASYCONECT_MODULES
        ) {
            const signal =
                moduleContract.signals
                    .find(
                        signalContract =>
                            signalContract.id ===
                                signalId
                    );

            if (signal) {
                return signal;
            }
        }

        return null;
    };

const validateEasyConectSignalValue =
    (
        signalId,
        value
    ) => {
        const signalContract =
            getEasyConectSignalContract(
                signalId
            );

        if (!signalContract) {
            throw new Error(
                `Unknown EasyConect signal id: ${signalId}`
            );
        }

        if (
            signalContract.type ===
                EASYCONECT_SIGNAL_TYPES
                    .BOOLEAN
        ) {
            if (
                typeof value !==
                    'boolean'
            ) {
                throw new Error(
                    `EasyConect signal ${signalId} requires a boolean value`
                );
            }

            return true;
        }

        if (
            signalContract.type ===
                EASYCONECT_SIGNAL_TYPES
                    .NUMBER
        ) {
            if (
                typeof value !==
                    'number' ||
                !Number.isFinite(value)
            ) {
                throw new Error(
                    `EasyConect signal ${signalId} requires a finite number`
                );
            }

            if (
                value <
                    signalContract.minimum ||
                value >
                    signalContract.maximum
            ) {
                throw new Error(
                    `EasyConect signal ${signalId} requires a value between ${signalContract.minimum} and ${signalContract.maximum}`
                );
            }

            return true;
        }

        throw new Error(
            `Unsupported EasyConect signal type: ${signalContract.type}`
        );
    };

module.exports = {
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue
};
