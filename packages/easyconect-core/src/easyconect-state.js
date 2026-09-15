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

        if (
            signalContract.type ===
                EASYCONECT_SIGNAL_TYPES
                    .NUMBER
        ) {
            return 0;
        }

        throw new Error(
            `Unsupported EasyConect signal type: ${signalContract.type}`
        );
    };

const createDefaultSignalValues =
    () => {
        const values =
            new Map();

        for (
            const moduleContract of
            EASYCONECT_MODULES
        ) {
            for (
                const signalContract of
                moduleContract.signals
            ) {
                values.set(
                    signalContract.id,
                    getDefaultSignalValue(
                        signalContract
                    )
                );
            }
        }

        return values;
    };

class EasyConectState {
    constructor () {
        this._values =
            createDefaultSignalValues();
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

    reset () {
        this._values =
            createDefaultSignalValues();
    }

    applySnapshot (snapshot) {
        if (
            !snapshot ||
            typeof snapshot !==
                'object' ||
            Array.isArray(snapshot)
        ) {
            throw new Error(
                'EasyConect snapshot must be an object'
            );
        }

        if (
            !snapshot.values ||
            typeof snapshot.values !==
                'object' ||
            Array.isArray(
                snapshot.values
            )
        ) {
            throw new Error(
                'EasyConect snapshot values must be an object'
            );
        }

        const providedSignalIds =
            Object.keys(
                snapshot.values
            );

        for (
            const signalId of
            providedSignalIds
        ) {
            if (
                !getEasyConectSignalContract(
                    signalId
                )
            ) {
                throw new Error(
                    `Unknown EasyConect snapshot signal: ${signalId}`
                );
            }
        }

        const nextValues =
            new Map();

        for (
            const signalId of
            this._values.keys()
        ) {
            if (
                !Object.prototype
                    .hasOwnProperty
                    .call(
                        snapshot.values,
                        signalId
                    )
            ) {
                throw new Error(
                    `Missing EasyConect snapshot signal: ${signalId}`
                );
            }

            const value =
                snapshot.values[
                    signalId
                ];

            validateEasyConectSignalValue(
                signalId,
                value
            );

            nextValues.set(
                signalId,
                value
            );
        }

        this._values =
            nextValues;
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
