const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EasyConectGamepadSession,
    getEasyConectWireChannel
} = require('../src');

const BOOLEAN =
    EBCP_CONTRACT
        .messageTypes
        .BOOLEAN;

class FakeConnection {
    constructor () {
        this.sendCalls = [];
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
}

test(
    'EasyConect Gamepad session is exported by the public Core API',
    () => {
        assert.equal(
            typeof EasyConectGamepadSession,
            'function'
        );
    }
);

test(
    'EasyConect Gamepad session requires a connection with send',
    () => {
        assert.throws(
            () =>
                new EasyConectGamepadSession(),
            /connection/i
        );

        assert.throws(
            () =>
                new EasyConectGamepadSession({
                    connection: {}
                }),
            /send/i
        );
    }
);

test(
    'EasyConect Gamepad starts every canonical button released',
    () => {
        const gamepad =
            new EasyConectGamepadSession({
                connection:
                    new FakeConnection()
            });

        for (
            const signalId of
            Object.values(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
            )
        ) {
            assert.equal(
                gamepad.getButtonPressed(
                    signalId
                ),
                false
            );
        }
    }
);

test(
    'EasyConect Gamepad sends every canonical button as BOOLEAN on its wire channel',
    async () => {
        const connection =
            new FakeConnection();

        const gamepad =
            new EasyConectGamepadSession({
                connection
            });

        for (
            const signalId of
            Object.values(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
            )
        ) {
            await gamepad.setButtonPressed(
                signalId,
                true
            );

            assert.equal(
                gamepad.getButtonPressed(
                    signalId
                ),
                true
            );

            await gamepad.setButtonPressed(
                signalId,
                false
            );

            assert.equal(
                gamepad.getButtonPressed(
                    signalId
                ),
                false
            );
        }

        const expectedCalls = [];

        for (
            const signalId of
            Object.values(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
            )
        ) {
            expectedCalls.push(
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            signalId
                        ),
                    payload:
                        true
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            signalId
                        ),
                    payload:
                        false
                }
            );
        }

        assert.deepEqual(
            connection.sendCalls,
            expectedCalls
        );
    }
);

test(
    'EasyConect Gamepad suppresses repeated button states',
    async () => {
        const connection =
            new FakeConnection();

        const gamepad =
            new EasyConectGamepadSession({
                connection
            });

        const signalId =
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_BOTTOM;

        await gamepad.setButtonPressed(
            signalId,
            true
        );

        await gamepad.setButtonPressed(
            signalId,
            true
        );

        await gamepad.setButtonPressed(
            signalId,
            false
        );

        await gamepad.setButtonPressed(
            signalId,
            false
        );

        assert.deepEqual(
            connection.sendCalls,
            [
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            signalId
                        ),
                    payload:
                        true
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            signalId
                        ),
                    payload:
                        false
                }
            ]
        );
    }
);

test(
    'EasyConect Gamepad rejects unknown signals and non-boolean states',
    async () => {
        const gamepad =
            new EasyConectGamepadSession({
                connection:
                    new FakeConnection()
            });

        await assert.rejects(
            gamepad.setButtonPressed(
                'gamepad.unknown',
                true
            ),
            /gamepad.*signal/i
        );

        await assert.rejects(
            gamepad.setButtonPressed(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_UP,
                1
            ),
            /boolean/i
        );

        assert.throws(
            () =>
                gamepad.getButtonPressed(
                    'gamepad.unknown'
                ),
            /gamepad.*signal/i
        );
    }
);

test(
    'EasyConect Gamepad does not commit a state whose send failed',
    async () => {
        const connection =
            new FakeConnection();

        const gamepad =
            new EasyConectGamepadSession({
                connection
            });

        const signalId =
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_RIGHT;

        connection.sendError =
            new Error(
                'transport failure'
            );

        await assert.rejects(
            gamepad.setButtonPressed(
                signalId,
                true
            ),
            /transport failure/i
        );

        assert.equal(
            gamepad.getButtonPressed(
                signalId
            ),
            false
        );
    }
);
