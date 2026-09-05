const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ControllerState,
    CONTROLLER_MODES
} = require('../src/controller-state');

test('Controller State exposes exactly edit and run modes', () => {
    assert.deepEqual(
        Object.values(CONTROLLER_MODES).sort(),
        [
            'edit',
            'run'
        ]
    );
});

test('Controller State starts in edit mode', () => {
    const state = new ControllerState();

    assert.equal(
        state.getMode(),
        CONTROLLER_MODES.EDIT
    );
});

test('Controller State changes between approved modes', () => {
    const state = new ControllerState();

    state.setMode(CONTROLLER_MODES.RUN);

    assert.equal(
        state.getMode(),
        CONTROLLER_MODES.RUN
    );

    state.setMode(CONTROLLER_MODES.EDIT);

    assert.equal(
        state.getMode(),
        CONTROLLER_MODES.EDIT
    );
});

test('Controller State rejects unsupported modes', () => {
    const state = new ControllerState();

    assert.throws(
        () => state.setMode('preview'),
        /unsupported controller mode/i
    );

    assert.equal(
        state.getMode(),
        CONTROLLER_MODES.EDIT
    );
});
