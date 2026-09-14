const {
    EASYCONECT_SIGNAL_TYPES
} = require('./easyconect-contract');

const {
    EASYCONECT_MODULES,
    getEasyConectSignalContract,
    validateEasyConectSignalValue
} = require('./easyconect-registry');

const getDefaultSignalValue =
    signalContract => {
        if (
            signalContract.type ===
                EASYCONECT_SIGNAL_TYPES
                    .BOOLEAN
        ) {
            return false;
        }

        throw new Error(
            `Unsupported EasyConect signal type: ${signalContract.type}`
        );
    };

class EasyConectState {
    constructor () {
        this._values = new Map();

        for (
            const moduleContract of
            EASYCONECT_MODULES
        ) {
            for (
                const signalContract of
                moduleContract.signals
            ) {
                this._values.set(
                    signalContract.id,
                    getDefaultSignalValue(
                        signalContract
                    )
                );
            }
        }
    }

    getSignalValue (signalId) {
        const signalContract =
            getEasyConectSignalContract(
                signalId
            );

        if (!signalContract) {
            throw new Error(
                `Unknown EasyConect signal id: ${signalId}`
            );
        }

        return this._values.get(
            signalId
        );
    }

    setSignalValue (
        signalId,
        value
    ) {
        validateEasyConectSignalValue(
            signalId,
            value
        );

        this._values.set(
            signalId,
            value
        );

        return value;
    }

    getSnapshot () {
        const values = {};

        for (
            const [
                signalId,
                value
            ] of this._values
        ) {
            values[signalId] =
                value;
        }

        return Object.freeze({
            values:
                Object.freeze(
                    values
                )
        });
    }
}

module.exports = {
    EasyConectState
};
