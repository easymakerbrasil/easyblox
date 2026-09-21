const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_GAMEPAD_MODULE,
    EASYCONECT_CONTROLS_MODULE,
    EASYCONECT_MOTORS_SERVO_MODULE,
    EASYCONECT_OUTPUTS_MODULE,
    EASYCONECT_TERMINAL_MODULE,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue
} = require('../src');

test('EasyConect registry exposes the canonical module list', () => {
    assert.deepEqual(
        EASYCONECT_MODULES,
        [
            EASYCONECT_GAMEPAD_MODULE,
            EASYCONECT_CONTROLS_MODULE,
            EASYCONECT_MOTORS_SERVO_MODULE,
            EASYCONECT_OUTPUTS_MODULE,
            EASYCONECT_TERMINAL_MODULE
        ]
    );

    assert.equal(
        Object.isFrozen(
            EASYCONECT_MODULES
        ),
        true
    );
});

test('EasyConect registry resolves a module by its stable id', () => {
    assert.equal(
        getEasyConectModuleContract(
            'gamepad'
        ),
        EASYCONECT_GAMEPAD_MODULE
    );

    assert.equal(
        getEasyConectModuleContract(
            'missing-module'
        ),
        null
    );
});

test('EasyConect registry resolves every canonical Gamepad signal by id', () => {
    for (
        const signalId of
        Object.values(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
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
            EASYCONECT_GAMEPAD_MODULE
                .signals
                .includes(signal),
            true
        );
    }

    assert.equal(
        getEasyConectSignalContract(
            'gamepad.missing'
        ),
        null
    );
});

test('EasyConect accepts both boolean states for every Gamepad signal', () => {
    for (
        const signalId of
        Object.values(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
        )
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
});

test('EasyConect rejects non-boolean values for Gamepad signals', () => {
    const invalidValues = [
        0,
        1,
        'true',
        'false',
        null,
        undefined,
        {}
    ];

    for (const value of invalidValues) {
        assert.throws(
            () =>
                validateEasyConectSignalValue(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .DPAD_UP,
                    value
                ),
            /requires a boolean value/i
        );
    }
});

test('EasyConect rejects validation for an unknown signal id', () => {
    assert.throws(
        () =>
            validateEasyConectSignalValue(
                'gamepad.unknown',
                true
            ),
        /unknown easyconect signal id/i
    );
});
