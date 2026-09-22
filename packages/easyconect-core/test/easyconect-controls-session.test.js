const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EasyConectControlsSession,
    EASYCONECT_CONTROLS_SIGNAL_IDS,
    getEasyConectWireChannel
} = require('../src');

const NUMBER =
    EBCP_CONTRACT
        .messageTypes
        .NUMBER;

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
    'EasyConect Controls session is exported by the public Core API',
    () => {
        assert.equal(
            typeof EasyConectControlsSession,
            'function'
        );
    }
);

test(
    'EasyConect Controls session requires a connection with send',
    () => {
        assert.throws(
            () =>
                new EasyConectControlsSession(),
            /connection/i
        );

        assert.throws(
            () =>
                new EasyConectControlsSession({
                    connection: {}
                }),
            /send/i
        );
    }
);

test(
    'EasyConect Controls starts with canonical neutral values',
    () => {
        const controls =
            new EasyConectControlsSession({
                connection:
                    new FakeConnection()
            });

        assert.deepEqual(
            controls.getJoystickPosition(),
            {
                x: 0,
                y: 0
            }
        );

        assert.equal(
            controls.getSliderValue(),
            0
        );

        assert.equal(
            controls.getButtonPressed(),
            false
        );

        assert.equal(
            controls.getSwitchOn(),
            false
        );
    }
);

test(
    'EasyConect Controls sends joystick and slider as NUMBER on canonical channels',
    async () => {
        const connection =
            new FakeConnection();

        const controls =
            new EasyConectControlsSession({
                connection
            });

        await controls.setJoystickPosition(
            -35,
            70
        );

        await controls.setSliderValue(
            65
        );

        assert.deepEqual(
            connection.sendCalls,
            [
                {
                    type:
                        NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .JOYSTICK_X
                        ),
                    payload:
                        -35
                },
                {
                    type:
                        NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .JOYSTICK_Y
                        ),
                    payload:
                        70
                },
                {
                    type:
                        NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .SLIDER
                        ),
                    payload:
                        65
                }
            ]
        );

        assert.deepEqual(
            controls.getJoystickPosition(),
            {
                x: -35,
                y: 70
            }
        );

        assert.equal(
            controls.getSliderValue(),
            65
        );
    }
);

test(
    'EasyConect Controls sends button and switch as BOOLEAN on canonical channels',
    async () => {
        const connection =
            new FakeConnection();

        const controls =
            new EasyConectControlsSession({
                connection
            });

        await controls.setButtonPressed(
            true
        );

        await controls.setButtonPressed(
            false
        );

        await controls.setSwitchOn(
            true
        );

        assert.deepEqual(
            connection.sendCalls,
            [
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .BUTTON
                        ),
                    payload:
                        true
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .BUTTON
                        ),
                    payload:
                        false
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .SWITCH
                        ),
                    payload:
                        true
                }
            ]
        );

        assert.equal(
            controls.getButtonPressed(),
            false
        );

        assert.equal(
            controls.getSwitchOn(),
            true
        );
    }
);

test(
    'EasyConect Controls suppresses repeated values and sends only changed joystick axes',
    async () => {
        const connection =
            new FakeConnection();

        const controls =
            new EasyConectControlsSession({
                connection
            });

        assert.equal(
            await controls.setJoystickPosition(
                0,
                0
            ),
            false
        );

        assert.equal(
            await controls.setSliderValue(
                0
            ),
            false
        );

        assert.equal(
            await controls.setButtonPressed(
                false
            ),
            false
        );

        assert.equal(
            await controls.setSwitchOn(
                false
            ),
            false
        );

        await controls.setJoystickPosition(
            20,
            30
        );

        connection.sendCalls = [];

        await controls.setJoystickPosition(
            20,
            45
        );

        await controls.setSliderValue(
            40
        );

        await controls.setSliderValue(
            40
        );

        await controls.setButtonPressed(
            true
        );

        await controls.setButtonPressed(
            true
        );

        await controls.setSwitchOn(
            true
        );

        await controls.setSwitchOn(
            true
        );

        assert.deepEqual(
            connection.sendCalls,
            [
                {
                    type:
                        NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .JOYSTICK_Y
                        ),
                    payload:
                        45
                },
                {
                    type:
                        NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .SLIDER
                        ),
                    payload:
                        40
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .BUTTON
                        ),
                    payload:
                        true
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_CONTROLS_SIGNAL_IDS
                                .SWITCH
                        ),
                    payload:
                        true
                }
            ]
        );
    }
);

test(
    'EasyConect Controls rejects invalid values without changing local state',
    async () => {
        const controls =
            new EasyConectControlsSession({
                connection:
                    new FakeConnection()
            });

        await assert.rejects(
            controls.setJoystickPosition(
                -101,
                0
            ),
            /between -100 and 100/i
        );

        await assert.rejects(
            controls.setSliderValue(
                101
            ),
            /between 0 and 100/i
        );

        await assert.rejects(
            controls.setButtonPressed(
                1
            ),
            /boolean/i
        );

        await assert.rejects(
            controls.setSwitchOn(
                'true'
            ),
            /boolean/i
        );

        assert.deepEqual(
            controls.getJoystickPosition(),
            {
                x: 0,
                y: 0
            }
        );

        assert.equal(
            controls.getSliderValue(),
            0
        );

        assert.equal(
            controls.getButtonPressed(),
            false
        );

        assert.equal(
            controls.getSwitchOn(),
            false
        );
    }
);

test(
    'EasyConect Controls does not commit a value whose send failed',
    async () => {
        const connection =
            new FakeConnection();

        const controls =
            new EasyConectControlsSession({
                connection
            });

        connection.sendError =
            new Error(
                'send failed'
            );

        await assert.rejects(
            controls.setSliderValue(
                50
            ),
            /send failed/i
        );

        await assert.rejects(
            controls.setButtonPressed(
                true
            ),
            /send failed/i
        );

        assert.equal(
            controls.getSliderValue(),
            0
        );

        assert.equal(
            controls.getButtonPressed(),
            false
        );
    }
);
