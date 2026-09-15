const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EasyConectState,
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_MODULE,
    EASYCONECT_CONTROLS_MODULE,
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
    EASYCONECT_MOTORS_SERVO_MODULE,
    EASYCONECT_MODULES,
    EASYCONECT_SIGNAL_WIRE_CHANNELS,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue,
    getEasyConectWireChannel,
    getEasyConectSignalIdForWireChannel
} = require('../src');

test(
    'EasyConect exposes Motors & Servo as a stable module identity',
    () => {
        assert.equal(
            EASYCONECT_MODULE_IDS.MOTORS_SERVO,
            'motorsServo'
        );

        assert.deepEqual(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
            {
                MOTOR_1:
                    'motorsServo.motor1',
                MOTOR_2:
                    'motorsServo.motor2',
                SERVO_1:
                    'motorsServo.servo1',
                SERVO_2:
                    'motorsServo.servo2',
                SERVO_3:
                    'motorsServo.servo3',
                SERVO_4:
                    'motorsServo.servo4'
            }
        );
    }
);

test(
    'EasyConect Motors & Servo exposes the six canonical v1 input signals',
    () => {
        assert.deepEqual(
            EASYCONECT_MOTORS_SERVO_MODULE,
            {
                id: 'motorsServo',
                signals: [
                    {
                        id:
                            'motorsServo.motor1',
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
                            'motorsServo.motor2',
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
                            'motorsServo.servo1',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .NUMBER,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT,
                        minimum: 0,
                        maximum: 180
                    },
                    {
                        id:
                            'motorsServo.servo2',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .NUMBER,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT,
                        minimum: 0,
                        maximum: 180
                    },
                    {
                        id:
                            'motorsServo.servo3',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .NUMBER,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT,
                        minimum: 0,
                        maximum: 180
                    },
                    {
                        id:
                            'motorsServo.servo4',
                        type:
                            EASYCONECT_SIGNAL_TYPES
                                .NUMBER,
                        direction:
                            EASYCONECT_SIGNAL_DIRECTIONS
                                .INPUT,
                        minimum: 0,
                        maximum: 180
                    }
                ]
            }
        );
    }
);

test(
    'EasyConect canonical Motors & Servo contract is immutable',
    () => {
        assert.equal(
            Object.isFrozen(
                EASYCONECT_MOTORS_SERVO_MODULE
            ),
            true
        );

        assert.equal(
            Object.isFrozen(
                EASYCONECT_MOTORS_SERVO_MODULE
                    .signals
            ),
            true
        );

        for (
            const signal of
            EASYCONECT_MOTORS_SERVO_MODULE
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
    'EasyConect registry includes and resolves canonical Motors & Servo signals',
    () => {
        assert.deepEqual(
            EASYCONECT_MODULES,
            [
                EASYCONECT_GAMEPAD_MODULE,
                EASYCONECT_CONTROLS_MODULE,
                EASYCONECT_MOTORS_SERVO_MODULE
            ]
        );

        assert.equal(
            getEasyConectModuleContract(
                'motorsServo'
            ),
            EASYCONECT_MOTORS_SERVO_MODULE
        );

        for (
            const signalId of
            Object.values(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
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
                EASYCONECT_MOTORS_SERVO_MODULE
                    .signals
                    .includes(signal),
                true
            );
        }
    }
);

test(
    'EasyConect accepts canonical Motors & Servo numeric values',
    () => {
        const validValues = [
            [
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                [-100, -1, 0, 1, 100]
            ],
            [
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2,
                [-100, 0, 100]
            ],
            [
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                [0, 90, 180]
            ],
            [
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_2,
                [0, 90, 180]
            ],
            [
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_3,
                [0, 90, 180]
            ],
            [
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_4,
                [0, 90, 180]
            ]
        ];

        for (
            const [
                signalId,
                values
            ] of validValues
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
    }
);

test(
    'EasyConect rejects invalid Motors & Servo numeric values',
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
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .MOTOR_1,
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
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .MOTOR_1,
                        value
                    ),
                /between -100 and 100/i
            );
        }

        for (
            const value of [
                -1,
                181
            ]
        ) {
            assert.throws(
                () =>
                    validateEasyConectSignalValue(
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .SERVO_1,
                        value
                    ),
                /between 0 and 180/i
            );
        }
    }
);

test(
    'EasyConect state manages Motors & Servo values and canonical defaults',
    () => {
        const state =
            new EasyConectState();

        for (
            const signalId of
            Object.values(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            )
        ) {
            assert.equal(
                state.getSignalValue(
                    signalId
                ),
                0
            );
        }

        state.setSignalValue(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_1,
            -35
        );

        state.setSignalValue(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_2,
            80
        );

        state.setSignalValue(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_4,
            135
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ),
            -35
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2
            ),
            80
        );

        assert.equal(
            state.getSignalValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_4
            ),
            135
        );

        state.reset();

        for (
            const signalId of
            Object.values(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            )
        ) {
            assert.equal(
                state.getSignalValue(
                    signalId
                ),
                0
            );
        }
    }
);

test(
    'EasyConect Motors & Servo exposes canonical EBCP-safe wire channels',
    () => {
        const expectedChannels = {
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_1]:
                'ms.m1',
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_2]:
                'ms.m2',
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_1]:
                'ms.s1',
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_2]:
                'ms.s2',
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_3]:
                'ms.s3',
            [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_4]:
                'ms.s4'
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

            assert.ok(
                Buffer.byteLength(
                    channel,
                    'utf8'
                ) <= 16
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
