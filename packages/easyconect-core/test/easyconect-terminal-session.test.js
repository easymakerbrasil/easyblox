const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_TERMINAL_CHANNEL,
    EASYCONECT_TERMINAL_MESSAGE_TYPES,
    EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS,
    EasyConectTerminalSession
} = require('../src');

const TEXT =
    EBCP_CONTRACT
        .messageTypes
        .TEXT;

const NUMBER =
    EBCP_CONTRACT
        .messageTypes
        .NUMBER;

class FakeConnection {
    constructor () {
        this.sendCalls = [];
        this.waitForCalls = [];
        this.waitForResults = [];
        this.sendError = null;
    }

    async send (
        type,
        channel,
        payload
    ) {
        if (this.sendError) {
            throw this.sendError;
        }

        this.sendCalls.push({
            type,
            channel,
            payload
        });

        return this.sendCalls.length;
    }

    waitFor (
        type,
        channel
    ) {
        this.waitForCalls.push({
            type,
            channel
        });

        const result =
            this.waitForResults.shift();

        if (result instanceof Error) {
            return Promise.reject(
                result
            );
        }

        return Promise.resolve(
            result
        );
    }
}

test(
    'EasyConect Terminal session requires the canonical connection operations',
    () => {
        assert.throws(
            () =>
                new EasyConectTerminalSession(),
            /connection must be an object/i
        );

        assert.throws(
            () =>
                new EasyConectTerminalSession({
                    connection: {
                        send () {}
                    }
                }),
            /waitFor must be a function/i
        );
    }
);

test(
    'EasyConect Terminal session exposes canonical message vocabulary',
    () => {
        assert.deepEqual(
            EASYCONECT_TERMINAL_MESSAGE_TYPES,
            {
                TEXT: 'text',
                NUMBER: 'number'
            }
        );

        assert.deepEqual(
            EASYCONECT_TERMINAL_MESSAGE_DIRECTIONS,
            {
                INCOMING: 'incoming',
                OUTGOING: 'outgoing'
            }
        );
    }
);

test(
    'EasyConect Terminal sends TEXT on the canonical Terminal channel',
    async () => {
        const connection =
            new FakeConnection();

        const terminal =
            new EasyConectTerminalSession({
                connection
            });

        assert.equal(
            await terminal.sendText(
                'Olá'
            ),
            1
        );

        assert.deepEqual(
            connection.sendCalls,
            [{
                type: TEXT,
                channel:
                    EASYCONECT_TERMINAL_CHANNEL,
                payload: 'Olá'
            }]
        );

        assert.deepEqual(
            terminal.getHistory(),
            [{
                direction: 'outgoing',
                type: 'text',
                payload: 'Olá'
            }]
        );
    }
);

test(
    'EasyConect Terminal sends NUMBER on the canonical Terminal channel',
    async () => {
        const connection =
            new FakeConnection();

        const terminal =
            new EasyConectTerminalSession({
                connection
            });

        assert.equal(
            await terminal.sendNumber(
                42.5
            ),
            1
        );

        assert.deepEqual(
            connection.sendCalls,
            [{
                type: NUMBER,
                channel:
                    EASYCONECT_TERMINAL_CHANNEL,
                payload: 42.5
            }]
        );

        assert.deepEqual(
            terminal.getHistory(),
            [{
                direction: 'outgoing',
                type: 'number',
                payload: 42.5
            }]
        );
    }
);

test(
    'EasyConect Terminal consumes incoming TEXT independently',
    async () => {
        const connection =
            new FakeConnection();

        connection.waitForResults.push({
            type: TEXT,
            sequence: 7,
            channel:
                EASYCONECT_TERMINAL_CHANNEL,
            payload: 'Arduino'
        });

        const terminal =
            new EasyConectTerminalSession({
                connection
            });

        assert.equal(
            await terminal.waitForText(),
            'Arduino'
        );

        assert.deepEqual(
            connection.waitForCalls,
            [{
                type: TEXT,
                channel:
                    EASYCONECT_TERMINAL_CHANNEL
            }]
        );

        assert.deepEqual(
            terminal.getHistory(),
            [{
                direction: 'incoming',
                type: 'text',
                payload: 'Arduino'
            }]
        );
    }
);

test(
    'EasyConect Terminal consumes incoming NUMBER independently',
    async () => {
        const connection =
            new FakeConnection();

        connection.waitForResults.push({
            type: NUMBER,
            sequence: 8,
            channel:
                EASYCONECT_TERMINAL_CHANNEL,
            payload: 123.5
        });

        const terminal =
            new EasyConectTerminalSession({
                connection
            });

        assert.equal(
            await terminal.waitForNumber(),
            123.5
        );

        assert.deepEqual(
            connection.waitForCalls,
            [{
                type: NUMBER,
                channel:
                    EASYCONECT_TERMINAL_CHANNEL
            }]
        );

        assert.deepEqual(
            terminal.getHistory(),
            [{
                direction: 'incoming',
                type: 'number',
                payload: 123.5
            }]
        );
    }
);

test(
    'EasyConect Terminal history is session-local immutable output',
    async () => {
        const connection =
            new FakeConnection();

        connection.waitForResults.push({
            type: TEXT,
            sequence: 3,
            channel:
                EASYCONECT_TERMINAL_CHANNEL,
            payload: 'recebido'
        });

        const terminal =
            new EasyConectTerminalSession({
                connection
            });

        await terminal.sendText(
            'enviado'
        );

        await terminal.waitForText();

        const history =
            terminal.getHistory();

        assert.deepEqual(
            history,
            [
                {
                    direction: 'outgoing',
                    type: 'text',
                    payload: 'enviado'
                },
                {
                    direction: 'incoming',
                    type: 'text',
                    payload: 'recebido'
                }
            ]
        );

        assert.equal(
            Object.isFrozen(history),
            true
        );

        for (const entry of history) {
            assert.equal(
                Object.isFrozen(entry),
                true
            );
        }
    }
);

test(
    'EasyConect Terminal notifies history observers and can clear the session history',
    async () => {
        const connection =
            new FakeConnection();

        const terminal =
            new EasyConectTerminalSession({
                connection
            });

        const snapshots = [];

        const unsubscribe =
            terminal.onHistoryChange(
                history => {
                    snapshots.push(
                        history
                    );
                }
            );

        await terminal.sendNumber(
            10
        );

        terminal.clearHistory();

        unsubscribe();

        await terminal.sendNumber(
            20
        );

        assert.equal(
            snapshots.length,
            2
        );

        assert.deepEqual(
            snapshots[0],
            [{
                direction: 'outgoing',
                type: 'number',
                payload: 10
            }]
        );

        assert.deepEqual(
            snapshots[1],
            []
        );

        assert.deepEqual(
            terminal.getHistory(),
            [{
                direction: 'outgoing',
                type: 'number',
                payload: 20
            }]
        );
    }
);

test(
    'EasyConect Terminal does not record failed sends and isolates observer failures',
    async () => {
        const connection =
            new FakeConnection();

        const terminal =
            new EasyConectTerminalSession({
                connection
            });

        terminal.onHistoryChange(
            () => {
                throw new Error(
                    'observer failure'
                );
            }
        );

        await terminal.sendText(
            'válido'
        );

        connection.sendError =
            new Error(
                'transport write failed'
            );

        await assert.rejects(
            terminal.sendText(
                'falhou'
            ),
            /transport write failed/i
        );

        assert.deepEqual(
            terminal.getHistory(),
            [{
                direction: 'outgoing',
                type: 'text',
                payload: 'válido'
            }]
        );
    }
);
