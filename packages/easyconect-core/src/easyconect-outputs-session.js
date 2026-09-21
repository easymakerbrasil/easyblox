const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_OUTPUTS_SIGNAL_IDS
} = require('./easyconect-contract');

const {
    getEasyConectWireChannel
} = require('./easyconect-wire-contract');

const BOOLEAN =
    EBCP_CONTRACT
        .messageTypes
        .BOOLEAN;

const INDICATOR_CHANNEL =
    getEasyConectWireChannel(
        EASYCONECT_OUTPUTS_SIGNAL_IDS
            .INDICATOR
    );

class EasyConectOutputsSession {
    constructor (options = {}) {
        const connection =
            options.connection;

        if (
            !connection ||
            typeof connection !==
                'object'
        ) {
            throw new Error(
                'EasyConect Outputs connection must be an object'
            );
        }

        if (
            typeof connection.waitFor !==
                'function'
        ) {
            throw new Error(
                'EasyConect Outputs connection waitFor must be a function'
            );
        }

        this._connection =
            connection;

        this._indicator =
            false;

        this._indicatorListeners =
            new Set();
    }

    getIndicator () {
        return this._indicator;
    }

    onIndicatorChange (listener) {
        if (
            typeof listener !==
            'function'
        ) {
            throw new Error(
                'EasyConect Outputs indicator listener must be a function'
            );
        }

        this._indicatorListeners.add(
            listener
        );

        return () => {
            this._indicatorListeners.delete(
                listener
            );
        };
    }

    async waitForIndicator () {
        const message =
            await this._connection
                .waitFor(
                    BOOLEAN,
                    INDICATOR_CHANNEL
                );

        this._indicator =
            message.payload === true;

        this._notifyIndicatorChange();

        return this._indicator;
    }

    _notifyIndicatorChange () {
        for (
            const listener of
            [...this._indicatorListeners]
        ) {
            try {
                listener(
                    this._indicator
                );
            } catch (error) {
                // Observer failures must not control Outputs semantics.
            }
        }
    }
}

module.exports = {
    EasyConectOutputsSession
};
