const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_OUTPUTS_SIGNAL_IDS,
    EASYCONECT_OUTPUTS_MODULE,
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalContract,
    validateEasyConectSignalValue,
    getEasyConectWireChannel,
    getEasyConectSignalIdForWireChannel
} = require('../src');

test(
    'EasyConect exposes Outputs as a stable module identity',
    () => {
        assert.equal(
            EASYCONECT_MODULE_IDS.OUTPUTS,
            'outputs'
        );

        assert.equal(
            EASYCONECT_OUTPUTS_MODULE.id,
            'outputs'
        );
    }
);

test(
    'EasyConect Outputs exposes the canonical indicator signal',
    () => {
        assert.equal(
            EASYCONECT_OUTPUTS_SIGNAL_IDS.INDICATOR,
            'outputs.indicator'
        );

        assert.deepEqual(
            EASYCONECT_OUTPUTS_MODULE.signals,
            [
                {
                    id:
                        'outputs.indicator',
                    type:
                        EASYCONECT_SIGNAL_TYPES.BOOLEAN,
                    direction:
                        EASYCONECT_SIGNAL_DIRECTIONS.OUTPUT
                }
            ]
        );
    }
);

test(
    'EasyConect canonical Outputs contract is immutable',
    () => {
        assert.equal(
            Object.isFrozen(
                EASYCONECT_OUTPUTS_SIGNAL_IDS
            ),
            true
        );

        assert.equal(
            Object.isFrozen(
                EASYCONECT_OUTPUTS_MODULE
            ),
            true
        );

        assert.equal(
            Object.isFrozen(
                EASYCONECT_OUTPUTS_MODULE.signals
            ),
            true
        );

        assert.equal(
            Object.isFrozen(
                EASYCONECT_OUTPUTS_MODULE.signals[0]
            ),
            true
        );
    }
);

test(
    'EasyConect registry includes and resolves canonical Outputs signal',
    () => {
        assert.equal(
            EASYCONECT_MODULES.includes(
                EASYCONECT_OUTPUTS_MODULE
            ),
            true
        );

        assert.equal(
            getEasyConectModuleContract(
                EASYCONECT_MODULE_IDS.OUTPUTS
            ),
            EASYCONECT_OUTPUTS_MODULE
        );

        assert.equal(
            getEasyConectSignalContract(
                EASYCONECT_OUTPUTS_SIGNAL_IDS
                    .INDICATOR
            ),
            EASYCONECT_OUTPUTS_MODULE
                .signals[0]
        );
    }
);

test(
    'EasyConect accepts boolean Outputs indicator values',
    () => {
        assert.equal(
            validateEasyConectSignalValue(
                EASYCONECT_OUTPUTS_SIGNAL_IDS
                    .INDICATOR,
                false
            ),
            true
        );

        assert.equal(
            validateEasyConectSignalValue(
                EASYCONECT_OUTPUTS_SIGNAL_IDS
                    .INDICATOR,
                true
            ),
            true
        );
    }
);

test(
    'EasyConect rejects non-boolean Outputs indicator values',
    () => {
        assert.throws(
            () =>
                validateEasyConectSignalValue(
                    EASYCONECT_OUTPUTS_SIGNAL_IDS
                        .INDICATOR,
                    1
                ),
            /requires a boolean value/
        );

        assert.throws(
            () =>
                validateEasyConectSignalValue(
                    EASYCONECT_OUTPUTS_SIGNAL_IDS
                        .INDICATOR,
                    'true'
                ),
            /requires a boolean value/
        );
    }
);

test(
    'EasyConect Outputs exposes the canonical EBCP-safe wire channel',
    () => {
        assert.equal(
            getEasyConectWireChannel(
                EASYCONECT_OUTPUTS_SIGNAL_IDS
                    .INDICATOR
            ),
            'out.ind'
        );

        assert.equal(
            getEasyConectSignalIdForWireChannel(
                'out.ind'
            ),
            EASYCONECT_OUTPUTS_SIGNAL_IDS
                .INDICATOR
        );
    }
);
