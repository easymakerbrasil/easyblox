const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_TERMINAL_CHANNEL
} = require('./easyconect-contract');

const EASYCONECT_TERMINAL_MESSAGE_TYPES =
    Object.freeze({
        TEXT: 'text',
        NUMBER: 'number'
    });

const EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS =
    Object.freeze({
        INCOMING: 'incoming',
        OUTGOING: 'outgoing'
    });

const TEXT =
    EBCP_CONTRACT
        .messageTypes
        .TEXT;

const NUMBER =
    EBCP_CONTRACT
        .messageTypes
        .NUMBER;

const validateEasyConectTerminalConnection =
    connection => {
        if (
            !connection ||
            typeof connection !==
                'object' ||
            Array.isArray(
                connection
            )
        ) {
            throw new Error(
                'EasyConect Terminal connection must be an object'
            );
        }

        for (
            const method of
            [
                'send',
                'waitFor'
            ]
        ) {
            if (
                typeof connection[method] !==
                    'function'
            ) {
                throw new Error(
                    `EasyConect Terminal connection method ${method} must be a function`
                );
            }
        }

        return true;
    };

class EasyConectTerminalSession {
    constructor ({
        connection
    } = {}) {
        validateEasyConectTerminalConnection(
            connection
        );

        this._connection =
            connection;

        this._history = [];

        this._historyListeners =
            new Set();
    }

    getHistory () {
        return Object.freeze([
            ...this._history
        ]);
    }

    clearHistory () {
        this._history = [];

        this._notifyHistoryChange();
    }

    onHistoryChange (listener) {
        if (
            typeof listener !==
                'function'
        ) {
            throw new Error(
                'EasyConect Terminal history listener must be a function'
            );
        }

        this._historyListeners.add(
            listener
        );

        return () =>
            this._historyListeners.delete(
                listener
            );
    }

    async sendText (payload) {
        const sequence =
            await this._connection.send(
                TEXT,
                EASYCONECT_TERMINAL_CHANNEL,
                payload
            );

        this._appendHistoryEntry({
            direction:
                EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS
                    .OUTGOING,
            type:
                EASYCONECT_TERMINAL_MESSAGE_TYPES
                    .TEXT,
            payload
        });

        return sequence;
    }

    async sendNumber (payload) {
        const sequence =
            await this._connection.send(
                NUMBER,
                EASYCONECT_TERMINAL_CHANNEL,
                payload
            );

        this._appendHistoryEntry({
            direction:
                EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS
                    .OUTGOING,
            type:
                EASYCONECT_TERMINAL_MESSAGE_TYPES
                    .NUMBER,
            payload
        });

        return sequence;
    }

    async waitForText () {
        const message =
            await this._connection.waitFor(
                TEXT,
                EASYCONECT_TERMINAL_CHANNEL
            );

        this._appendHistoryEntry({
            direction:
                EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS
                    .INCOMING,
            type:
                EASYCONECT_TERMINAL_MESSAGE_TYPES
                    .TEXT,
            payload:
                message.payload
        });

        return message.payload;
    }

    async waitForNumber () {
        const message =
            await this._connection.waitFor(
                NUMBER,
                EASYCONECT_TERMINAL_CHANNEL
            );

        this._appendHistoryEntry({
            direction:
                EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS
                    .INCOMING,
            type:
                EASYCONECT_TERMINAL_MESSAGE_TYPES
                    .NUMBER,
            payload:
                message.payload
        });

        return message.payload;
    }

    _appendHistoryEntry ({
        direction,
        type,
        payload
    }) {
        const entry =
            Object.freeze({
                direction,
                type,
                payload
            });

        this._history.push(
            entry
        );

        this._notifyHistoryChange();

        return entry;
    }

    _notifyHistoryChange () {
        const history =
            this.getHistory();

        for (
            const listener of
            [...this._historyListeners]
        ) {
            try {
                listener(
                    history
                );
            } catch (error) {
                // Observer failures must not control Terminal semantics.
            }
        }
    }
}

module.exports = {
    EASYCONECT_TERMINAL_MESSAGE_TYPES,
    EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS,
    EasyConectTerminalSession
};
