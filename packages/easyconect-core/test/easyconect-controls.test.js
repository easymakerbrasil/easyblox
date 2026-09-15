const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EasyConectState,
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_MODULE,
    EASYCONECT_CONTROLS_SIGNAL_IDS,
    EASYCONECT_CONTROLS_MODULE,
    EASYCONECT_MODULES,
    EASYCONECT_SIGNAL_WIRE_CHANNELS,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue,
    getEasyConectWireChannel,
    getEasyConectSignalIdForWireChannel
} = require('../src');

test(
    'EasyConect exposes Controls as a stable module identity',
    () => {
        assert.equal(
            EASYCONECT_MODULE_IDS.CONTROLS,
            'controls'
        );

        assert.deepEqual(
            EASYCONECT_CONTROLS_SIGNAL_IDS,
            {
                JOYSTICK_X:
                    'controls.joystick.x',
                JOYSTICK_Y:
                    'controls.joystick.y',
                SLIDER:
                    'controls.slider',
                BUTTON:
                    'controls.button',
                SWITCH:
                    'controls.switch'
            }
        );
    }
);

test(
    'EasyConect Controls exposes the five canonical v1 input signals',
    () => {
        assert.deepEqual(
            EASYCONECT_CONTROLS_MODULE,
            {
                id: 'controls',
                signals: [
                    {
                        id:
                            'controls.joystick.x',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .NUMBER,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT,
                        minimum: -100,
                        maximum: 100
                    },
                    {
                        id:
                            'controls.joystick.y',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .NUMBER,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT,
                        minimum: -100,
                        maximum: 100
                    },
                    {
                        id:
                            'controls.slider',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .NUMBER,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT,
                        minimum: 0,
                        maximum: 100
                    },
                    {
                        id:
                            'controls.button',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .BOOLEAN,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT
                    },
                    {
                        id:
                            'controls.switch',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .BOOLEAN,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT
                    }
                ]
            }
        );
    }
);

test(
    'EasyConect canonical Controls contract is immutable',
    () => {
        assert.equal(
            Object.isFrozen(
                EASYCONECT_CONTROLS_MODULE
            ),
            true
        );

        assert.equal(
            Object.isFrozen(
                EASYCONECT_CONTROLS_MODULE
                    .signals
            ),
            true
        );

        for (
            const signal of
            EASYCONECT_CONTROLS_MODULE
                .signals
        ) {
            assert.equal(
                Object.isFrozen(signal),
                true
            );
        }
    }
);

test(
    'EasyConect registry includes and resolves canonical Controls signals',
    () => {
        assert.deepEqual(
            EASYCONECT_MODULES,
            [
                EASYCONECT_GAMEPAD_MODULE,
                EASYCONECT_CONTROLS_MODULE
            ]
        );

        assert.equal(
            getEasyConectModuleContract(
                'controls'
            ),
            EASYCONECT_CONTROLS_MODULE
        );

        for (
            const signalId of
            Object.values(
                EASYCONECT_CONTROLS_SIGNAL_IDS
            )
        ) {
            const signal =
                getEasyConectSignalContract(
                    signalId
                );

            assert.ok(signal);

            assert.equal(
                signal.id,
                signalId
            );

            assert.equal(
                EASYCONECT_CONTROLS_MODULE
                    .signals
                    .includes(signal),
                true
            );
        }
    }
);

test(
    'EasyConect accepts canonical Controls numeric and boolean values',
    () => {
        const validNumbers = [
            [
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_X,
                [-100, 0, 100]
            ],
            [
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_Y,
                [-100, 0, 100]
            ],
            [
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SLIDER,
                [0, 50, 100]
            ]
        ];

        for (
            const [
                signalId,
                values
            ] of validNumbers
        ) {
            for (const value of values) {
                assert.equal(
                    validateEasyConectSignalValue(
                        signalId,
                        value
                    ),
                    true
                );
            }
        }

        for (
            const signalId of [
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .BUTTON,
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SWITCH
            ]
        ) {
            assert.equal(
                validateEasyConectSignalValue(
                    signalId,
                    true
                ),
                true
            );

            assert.equal(
                validateEasyConectSignalValue(
                    signalId,
                    false
                ),
                true
            );
        }
    }
);

test(
    'EasyConect rejects invalid Controls numeric values',
    () => {
        const invalidNumbers = [
            NaN,
            Infinity,
            -Infinity,
            '0',
            null,
            undefined,
            {}
        ];

        for (const value of invalidNumbers) {
            assert.throws(
                () =>
                    validateEasyConectSignalValue(
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_X,
                        value
                    ),
                /requires a finite number/i
            );
        }

        for (
            const value of [
                -101,
                101
            ]
        ) {
            assert.throws(
                () =>
                    validateEasyConectSignalValue(
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_X,
                        value
                    ),
                /between -100 and 100/i
            );
        }

        for (
            const value of [
                -1,
                101
            ]
        ) {
            assert.throws(
                () =>
                    validateEasyConectSignalValue(
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .SLIDER,
                        value
                    ),
                /between 0 and 100/i
            );
        }
    }
);

test(
    'EasyConect state manages Controls values and canonical defaults',
    () => {
        const state =
            new EasyConectState();

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_X
            ),
            0
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_Y
            ),
            0
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SLIDER
            ),
            0
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .BUTTON
            ),
            false
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SWITCH
            ),
            false
        );

        state.setSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_X,
            -35
        );

        state.setSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .SLIDER,
            75
        );

        state.setSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .BUTTON,
            true
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_X
            ),
            -35
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SLIDER
            ),
            75
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .BUTTON
            ),
            true
        );

        state.reset();

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_X
            ),
            0
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SLIDER
            ),
            0
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .BUTTON
            ),
            false
        );
    }
);

test(
    'EasyConect Controls exposes canonical EBCP-safe wire channels',
    () => {
        const expectedChannels = {
            [EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_X]:
                'ct.jx',
            [EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_Y]:
                'ct.jy',
            [EASYCONECT_CONTROLS_SIGNAL_IDS
                .SLIDER]:
                'ct.sl',
            [EASYCONECT_CONTROLS_SIGNAL_IDS
                .BUTTON]:
                'ct.bt',
            [EASYCONECT_CONTROLS_SIGNAL_IDS
                .SWITCH]:
                'ct.sw'
        };

        for (
            const [
                signalId,
                channel
            ] of Object.entries(
                expectedChannels
            )
        ) {
            assert.equal(
                EASYCONECT_SIGNAL_WIRE_CHANNELS[
                    signalId
                ],
                channel
            );

            assert.equal(
                getEasyConectWireChannel(
                    signalId
                ),
                channel
            );

            assert.equal(
                getEasyConectSignalIdForWireChannel(
                    channel
                ),
                signalId
            );

            assert.match(
                channel,
                /^[A-Za-z0-9_.-]{1,16}$/
            );
        }

        const allChannels =
            Object.values(
                EASYCONECT_SIGNAL_WIRE_CHANNELS
            );

        assert.equal(
            new Set(allChannels).size,
            allChannels.length,
            'every EasyConect wire channel is unique'
        );
    }
);
