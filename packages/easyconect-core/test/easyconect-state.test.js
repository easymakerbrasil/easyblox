const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EasyConectState,
    EASYCONECT_GAMEPAD_SIGNAL_IDS
} = require('../src');

test('EasyConect state initializes every Gamepad signal as released', () => {
    const state =
        new EasyConectState();

    for (
        const signalId of
        Object.values(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
        )
    ) {
        assert.equal(
            state.getSignalValue(
                signalId
            ),
            false
        );
    }
});

test('EasyConect state updates independent Gamepad signals', () => {
    const state =
        new EasyConectState();

    state.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .DPAD_UP,
        true
    );

    state.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .DPAD_RIGHT,
        true
    );

    assert.equal(
        state.getSignalValue(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_UP
        ),
        true
    );

    assert.equal(
        state.getSignalValue(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_RIGHT
        ),
        true
    );

    assert.equal(
        state.getSignalValue(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_DOWN
        ),
        false
    );
});

test('EasyConect state validates values before changing state', () => {
    const state =
        new EasyConectState();

    const signalId =
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .ACTION_BOTTOM;

    assert.throws(
        () =>
            state.setSignalValue(
                signalId,
                1
            ),
        /requires a boolean value/i
    );

    assert.equal(
        state.getSignalValue(
            signalId
        ),
        false
    );
});

test('EasyConect state rejects unknown signal ids', () => {
    const state =
        new EasyConectState();

    assert.throws(
        () =>
            state.getSignalValue(
                'gamepad.unknown'
            ),
        /unknown easyconect signal id/i
    );

    assert.throws(
        () =>
            state.setSignalValue(
                'gamepad.unknown',
                true
            ),
        /unknown easyconect signal id/i
    );
});

test('EasyConect snapshot contains every current canonical signal value', () => {
    const state =
        new EasyConectState();

    state.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .ACTION_TOP,
        true
    );

    assert.deepEqual(
        state.getSnapshot(),
        {
            values: {
                'gamepad.dpad.up': false,
                'gamepad.dpad.down': false,
                'gamepad.dpad.left': false,
                'gamepad.dpad.right': false,
                'gamepad.action.top': true,
                'gamepad.action.left': false,
                'gamepad.action.bottom': false,
                'gamepad.action.right': false,
                'controls.joystick.x': 0,
                'controls.joystick.y': 0,
                'controls.slider': 0,
                'controls.button': false,
                'controls.switch': false,
                'motorsServo.motor1': 0,
                'motorsServo.motor2': 0,
                'motorsServo.servo1': 0,
                'motorsServo.servo2': 0,
                'motorsServo.servo3': 0,
                'motorsServo.servo4': 0
            }
        }
    );
});

test('EasyConect snapshots are immutable and detached from later state changes', () => {
    const state =
        new EasyConectState();

    const signalId =
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .ACTION_LEFT;

    const snapshot =
        state.getSnapshot();

    assert.equal(
        Object.isFrozen(snapshot),
        true
    );

    assert.equal(
        Object.isFrozen(
            snapshot.values
        ),
        true
    );

    state.setSignalValue(
        signalId,
        true
    );

    assert.equal(
        snapshot.values[signalId],
        false
    );

    assert.equal(
        state.getSnapshot()
            .values[signalId],
        true
    );
});
