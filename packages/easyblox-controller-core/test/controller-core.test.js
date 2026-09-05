const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ControllerModel,
    CONTROLLER_COMPONENT_TYPES,
    ControllerState,
    CONTROLLER_MODES,
    ControllerEvents
} = require('..');

test('Controller Core exposes its approved public API from the package entry point', () => {
    assert.equal(
        typeof ControllerModel,
        'function'
    );

    assert.equal(
        typeof ControllerState,
        'function'
    );

    assert.equal(
        typeof ControllerEvents,
        'function'
    );

    assert.deepEqual(
        Object.values(CONTROLLER_COMPONENT_TYPES).sort(),
        [
            'button',
            'gamepad',
            'indicator',
            'joystick',
            'serial',
            'slider',
            'toggle'
        ]
    );

    assert.deepEqual(
        Object.values(CONTROLLER_MODES).sort(),
        [
            'edit',
            'run'
        ]
    );
});
