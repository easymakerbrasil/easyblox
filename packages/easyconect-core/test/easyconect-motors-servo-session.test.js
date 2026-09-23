const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
    EasyConectMotorsServoSession,
    getEasyConectWireChannel
} = require('../src');

const createSession =
    (
        sendImplementation =
            () => Promise.resolve()
    ) => {
        const calls = [];

        const connection = {
            send:
                async (
                    type,
                    channel,
                    value
                ) => {
                    calls.push({
                        type,
                        channel,
                        value
                    });

                    return sendImplementation(
                        type,
                        channel,
                        value
                    );
                }
        };

        return {
            calls,
            connection,
            session:
                new EasyConectMotorsServoSession({
                    connection
                })
        };
    };

test(
    'EasyConect Motors Servo session is exported by the public Core API',
    () => {
        assert.equal(
            typeof EasyConectMotorsServoSession,
            'function'
        );
    }
);

test(
    'EasyConect Motors Servo session requires a connection with send',
    () => {
        assert.throws(
            () =>
                new EasyConectMotorsServoSession(),
            /connection/i
        );

        assert.throws(
            () =>
                new EasyConectMotorsServoSession({
                    connection: {}
                }),
            /send/i
        );
    }
);

test(
    'EasyConect Motors Servo starts every actuator at the canonical neutral value',
    () => {
        const {
            session
        } = createSession();

        assert.equal(
            session.getMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ),
            0
        );

        assert.equal(
            session.getMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2
            ),
            0
        );

        for (
            const signalId of
            [
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_2,
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_3,
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_4
            ]
        ) {
            assert.equal(
                session.getServoAngle(
                    signalId
                ),
                0
            );
        }
    }
);

test(
    'EasyConect Motors Servo sends signed motor commands as NUMBER on canonical channels',
    async () => {
        const {
            calls,
            session
        } = createSession();

        assert.equal(
            await session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                -50
            ),
            true
        );

        assert.equal(
            await session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2,
                100
            ),
            true
        );

        assert.deepEqual(
            calls,
            [
                {
                    type:
                        EBCP_CONTRACT
                            .messageTypes
                            .NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .MOTOR_1
                        ),
                    value:
                        -50
                },
                {
                    type:
                        EBCP_CONTRACT
                            .messageTypes
                            .NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .MOTOR_2
                        ),
                    value:
                        100
                }
            ]
        );

        assert.equal(
            session.getMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ),
            -50
        );

        assert.equal(
            session.getMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2
            ),
            100
        );
    }
);

test(
    'EasyConect Motors Servo sends Servo angles as NUMBER on canonical channels',
    async () => {
        const {
            calls,
            session
        } = createSession();

        await session.setServoAngle(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_1,
            45
        );

        await session.setServoAngle(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_4,
            180
        );

        assert.deepEqual(
            calls,
            [
                {
                    type:
                        EBCP_CONTRACT
                            .messageTypes
                            .NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_1
                        ),
                    value:
                        45
                },
                {
                    type:
                        EBCP_CONTRACT
                            .messageTypes
                            .NUMBER,
                    channel:
                        getEasyConectWireChannel(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_4
                        ),
                    value:
                        180
                }
            ]
        );
    }
);

test(
    'EasyConect Motors Servo suppresses repeated actuator values',
    async () => {
        const {
            calls,
            session
        } = createSession();

        assert.equal(
            await session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                0
            ),
            false
        );

        assert.equal(
            await session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                40
            ),
            true
        );

        assert.equal(
            await session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                40
            ),
            false
        );

        assert.equal(
            await session.setServoAngle(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                0
            ),
            false
        );

        assert.equal(
            await session.setServoAngle(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                90
            ),
            true
        );

        assert.equal(
            await session.setServoAngle(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                90
            ),
            false
        );

        assert.equal(
            calls.length,
            2
        );
    }
);

test(
    'EasyConect Motors Servo rejects wrong signal kinds and out of range values',
    async () => {
        const {
            session
        } = createSession();

        await assert.rejects(
            session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                20
            )
        );

        await assert.rejects(
            session.setServoAngle(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                20
            )
        );

        await assert.rejects(
            session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                101
            )
        );

        await assert.rejects(
            session.setServoAngle(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
                181
            )
        );

        assert.equal(
            session.getMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ),
            0
        );

        assert.equal(
            session.getServoAngle(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1
            ),
            0
        );
    }
);

test(
    'EasyConect Motors Servo does not commit an actuator value whose send failed',
    async () => {
        const {
            session
        } = createSession(
            () =>
                Promise.reject(
                    new Error(
                        'send failed'
                    )
                )
        );

        await assert.rejects(
            session.setMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1,
                75
            ),
            /send failed/
        );

        assert.equal(
            session.getMotorValue(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            ),
            0
        );
    }
);
