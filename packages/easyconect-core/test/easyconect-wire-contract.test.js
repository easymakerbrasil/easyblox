const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_CONTROLS_SIGNAL_IDS,
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
    EASYCONECT_OUTPUTS_SIGNAL_IDS,
    EASYCONECT_SIGNAL_WIRE_CHANNELS,
    getEasyConectWireChannel,
    getEasyConectSignalIdForWireChannel
} = require('../src');

test(
    'EasyConect exposes canonical EBCP-safe wire channels',
    () => {
        assert.deepEqual(
            EASYCONECT_SIGNAL_WIRE_CHANNELS,
            {
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_UP]:
                    'gp.du',
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_DOWN]:
                    'gp.dd',
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_LEFT]:
                    'gp.dl',
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.DPAD_RIGHT]:
                    'gp.dr',
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_TOP]:
                    'gp.at',
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_LEFT]:
                    'gp.al',
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_BOTTOM]:
                    'gp.ab',
                [EASYCONECT_GAMEPAD_SIGNAL_IDS.ACTION_RIGHT]:
                    'gp.ar',
                [EASYCONECT_CONTROLS_SIGNAL_IDS.JOYSTICK_X]:
                    'ct.jx',
                [EASYCONECT_CONTROLS_SIGNAL_IDS.JOYSTICK_Y]:
                    'ct.jy',
                [EASYCONECT_CONTROLS_SIGNAL_IDS.SLIDER]:
                    'ct.sl',
                [EASYCONECT_CONTROLS_SIGNAL_IDS.BUTTON]:
                    'ct.bt',
                [EASYCONECT_CONTROLS_SIGNAL_IDS.SWITCH]:
                    'ct.sw',
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS.MOTOR_1]:
                    'ms.m1',
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS.MOTOR_2]:
                    'ms.m2',
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS.SERVO_1]:
                    'ms.s1',
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS.SERVO_2]:
                    'ms.s2',
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS.SERVO_3]:
                    'ms.s3',
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS.SERVO_4]:
                    'ms.s4',
                [EASYCONECT_OUTPUTS_SIGNAL_IDS.INDICATOR]:
                    'out.ind'
            }
        );

        assert.equal(
            Object.isFrozen(
                EASYCONECT_SIGNAL_WIRE_CHANNELS
            ),
            true
        );

        const channels =
            Object.values(
                EASYCONECT_SIGNAL_WIRE_CHANNELS
            );

        assert.equal(
            new Set(channels).size,
            channels.length
        );

        for (const channel of channels) {
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
    }
);

test(
    'EasyConect wire channels round-trip to canonical signal IDs',
    () => {
        for (
            const [
                signalId,
                channel
            ] of Object.entries(
                EASYCONECT_SIGNAL_WIRE_CHANNELS
            )
        ) {
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
        }
    }
);

test(
    'EasyConect wire contract rejects unknown signals and channels',
    () => {
        assert.equal(
            getEasyConectWireChannel(
                'gamepad.unknown'
            ),
            null
        );

        assert.equal(
            getEasyConectSignalIdForWireChannel(
                'gp.unknown'
            ),
            null
        );
    }
);
