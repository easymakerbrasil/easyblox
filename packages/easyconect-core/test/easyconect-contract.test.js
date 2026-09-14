const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_GAMEPAD_MODULE
} = require('../src');

test('EasyConect exposes the canonical signal vocabulary', () => {
    assert.deepEqual(
        EASYCONECT_SIGNAL_TYPES,
        {
            BOOLEAN: 'boolean',
            NUMBER: 'number',
            TEXT: 'text'
        }
    );

    assert.deepEqual(
        EASYCONECT_SIGNAL_DIRECTIONS,
        {
            INPUT: 'input',
            OUTPUT: 'output'
        }
    );
});

test('EasyConect exposes Gamepad as a stable module identity', () => {
    assert.equal(
        EASYCONECT_MODULE_IDS.GAMEPAD,
        'gamepad'
    );
});

test('EasyConect Gamepad exposes exactly the eight canonical v1 signal ids', () => {
    assert.deepEqual(
        EASYCONECT_GAMEPAD_SIGNAL_IDS,
        {
            DPAD_UP: 'gamepad.dpad.up',
            DPAD_DOWN: 'gamepad.dpad.down',
            DPAD_LEFT: 'gamepad.dpad.left',
            DPAD_RIGHT: 'gamepad.dpad.right',
            ACTION_TOP: 'gamepad.action.top',
            ACTION_LEFT: 'gamepad.action.left',
            ACTION_BOTTOM: 'gamepad.action.bottom',
            ACTION_RIGHT: 'gamepad.action.right'
        }
    );
});

test('EasyConect Gamepad defines eight independent boolean input signals', () => {
    assert.deepEqual(
        EASYCONECT_GAMEPAD_MODULE,
        {
            id: 'gamepad',
            signals: [
                {
                    id: 'gamepad.dpad.up',
                    type: 'boolean',
                    direction: 'input'
                },
                {
                    id: 'gamepad.dpad.down',
                    type: 'boolean',
                    direction: 'input'
                },
                {
                    id: 'gamepad.dpad.left',
                    type: 'boolean',
                    direction: 'input'
                },
                {
                    id: 'gamepad.dpad.right',
                    type: 'boolean',
                    direction: 'input'
                },
                {
                    id: 'gamepad.action.top',
                    type: 'boolean',
                    direction: 'input'
                },
                {
                    id: 'gamepad.action.left',
                    type: 'boolean',
                    direction: 'input'
                },
                {
                    id: 'gamepad.action.bottom',
                    type: 'boolean',
                    direction: 'input'
                },
                {
                    id: 'gamepad.action.right',
                    type: 'boolean',
                    direction: 'input'
                }
            ]
        }
    );
});

test('EasyConect Gamepad contract contains no presentation-specific symbols or labels', () => {
    for (
        const signal of
        EASYCONECT_GAMEPAD_MODULE.signals
    ) {
        assert.equal(
            Object.prototype.hasOwnProperty.call(
                signal,
                'label'
            ),
            false
        );

        assert.equal(
            Object.prototype.hasOwnProperty.call(
                signal,
                'symbol'
            ),
            false
        );
    }
});

test('EasyConect canonical Gamepad contract is immutable', () => {
    assert.equal(
        Object.isFrozen(
            EASYCONECT_GAMEPAD_MODULE
        ),
        true
    );

    assert.equal(
        Object.isFrozen(
            EASYCONECT_GAMEPAD_MODULE.signals
        ),
        true
    );

    for (
        const signal of
        EASYCONECT_GAMEPAD_MODULE.signals
    ) {
        assert.equal(
            Object.isFrozen(signal),
            true
        );
    }
});
