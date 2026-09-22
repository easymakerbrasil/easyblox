const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS
} = require('./easyconect-contract');

const {
    getEasyConectWireChannel
} = require('./easyconect-wire-contract');

const BOOLEAN =
    EBCP_CONTRACT
        .messageTypes
        .BOOLEAN;

const GAMEPAD_SIGNAL_IDS =
    Object.freeze(
        Object.values(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
        )
    );

class EasyConectGamepadSession {
    constructor (options = {}) {
        const connection =
            options.connection;

        if (
            !connection ||
            typeof connection !==
                'object'
        ) {
            throw new Error(
                'EasyConect Gamepad connection must be an object'
            );
        }

        if (
            typeof connection.send !==
                'function'
        ) {
            throw new Error(
                'EasyConect Gamepad connection send must be a function'
            );
        }

        this._connection =
            connection;

        this._buttonStates =
            new Map(
                GAMEPAD_SIGNAL_IDS.map(
                    signalId => [
                        signalId,
                        false
                    ]
                )
            );
    }

    getButtonPressed (signalId) {
        this._validateSignalId(
            signalId
        );

        return this._buttonStates.get(
            signalId
        );
    }

    async setButtonPressed (
        signalId,
        state
    ) {
        this._validateSignalId(
            signalId
        );

        if (
            typeof state !==
                'boolean'
        ) {
            throw new Error(
                'EasyConect Gamepad button state must be boolean'
            );
        }

        if (
            this._buttonStates.get(
                signalId
            ) === state
        ) {
            return false;
        }

        await this._connection.send(
            BOOLEAN,
            getEasyConectWireChannel(
                signalId
            ),
            state
        );

        this._buttonStates.set(
            signalId,
            state
        );

        return true;
    }

    _validateSignalId (signalId) {
        if (
            !this._buttonStates.has(
                signalId
            )
        ) {
            throw new Error(
                'Unknown EasyConect Gamepad signal id'
            );
        }
    }
}

module.exports = {
    EasyConectGamepadSession
};
