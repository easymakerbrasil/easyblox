const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EasyConectState,
    EASYCONECT_GAMEPAD_SIGNAL_IDS
} = require('../src');

test('EasyConect state resets every signal to its canonical default', () => {
    const state =
        new EasyConectState();

    state.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .DPAD_UP,
        true
    );

    state.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .ACTION_RIGHT,
        true
    );

    state.reset();

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

test('EasyConect state applies a complete canonical snapshot', () => {
    const source =
        new EasyConectState();

    source.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .DPAD_LEFT,
        true
    );

    source.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .ACTION_BOTTOM,
        true
    );

    const target =
        new EasyConectState();

    target.applySnapshot(
        source.getSnapshot()
    );

    assert.deepEqual(
        target.getSnapshot(),
        source.getSnapshot()
    );
});

test('EasyConect state rejects malformed snapshots', () => {
    const state =
        new EasyConectState();

    const invalidSnapshots = [
        null,
        undefined,
        [],
        'snapshot'
    ];

    for (
        const snapshot of
        invalidSnapshots
    ) {
        assert.throws(
            () =>
                state.applySnapshot(
                    snapshot
                ),
            /snapshot must be an object/i
        );
    }

    const invalidValues = [
        {},
        {
            values: null
        },
        {
            values: []
        }
    ];

    for (
        const snapshot of
        invalidValues
    ) {
        assert.throws(
            () =>
                state.applySnapshot(
                    snapshot
                ),
            /snapshot values must be an object/i
        );
    }
});

test('EasyConect state rejects incomplete snapshots', () => {
    const state =
        new EasyConectState();

    const values = {
        ...state.getSnapshot()
            .values
    };

    delete values[
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .DPAD_DOWN
    ];

    assert.throws(
        () =>
            state.applySnapshot({
                values
            }),
        /missing easyconect snapshot signal/i
    );
});

test('EasyConect state rejects snapshots with unknown signals', () => {
    const state =
        new EasyConectState();

    const values = {
        ...state.getSnapshot()
            .values,
        'gamepad.unknown': true
    };

    assert.throws(
        () =>
            state.applySnapshot({
                values
            }),
        /unknown easyconect snapshot signal/i
    );
});

test('EasyConect snapshot application is atomic and detached from its input', () => {
    const state =
        new EasyConectState();

    state.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .DPAD_UP,
        true
    );

    const before =
        state.getSnapshot();

    const invalidSnapshot = {
        values: {
            ...before.values,
            [EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_RIGHT]: 1
        }
    };

    assert.throws(
        () =>
            state.applySnapshot(
                invalidSnapshot
            ),
        /requires a boolean value/i
    );

    assert.deepEqual(
        state.getSnapshot(),
        before
    );

    const source =
        new EasyConectState();

    source.setSignalValue(
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .ACTION_TOP,
        true
    );

    const snapshot = {
        values: {
            ...source.getSnapshot()
                .values
        }
    };

    state.applySnapshot(
        snapshot
    );

    snapshot.values[
        EASYCONECT_GAMEPAD_SIGNAL_IDS
            .ACTION_TOP
    ] = false;

    assert.equal(
        state.getSignalValue(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_TOP
        ),
        true
    );
});
