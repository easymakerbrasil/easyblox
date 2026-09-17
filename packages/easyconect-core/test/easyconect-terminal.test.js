const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_MODULE_IDS,
    EASYCONECT_TERMINAL_CHANNEL,
    EASYCONECT_TERMINAL_MODULE,
    EASYCONECT_MODULES,
    getEasyConectModuleContract,
    getEasyConectSignalIdForWireChannel
} = require('../src');

test(
    'EasyConect exposes Terminal as a stable module identity',
    () => {
        assert.equal(
            EASYCONECT_MODULE_IDS.TERMINAL,
            'terminal'
        );
    }
);

test(
    'EasyConect Terminal has no persistent signals',
    () => {
        assert.deepEqual(
            EASYCONECT_TERMINAL_MODULE,
            {
                id: 'terminal',
                signals: []
            }
        );
    }
);

test(
    'EasyConect Terminal uses the canonical fixed EBCP application channel',
    () => {
        assert.equal(
            EASYCONECT_TERMINAL_CHANNEL,
            '1'
        );

        assert.match(
            EASYCONECT_TERMINAL_CHANNEL,
            /^[A-Za-z0-9_.-]{1,16}$/
        );

        assert.ok(
            Buffer.byteLength(
                EASYCONECT_TERMINAL_CHANNEL,
                'utf8'
            ) <= 16
        );
    }
);

test(
    'EasyConect registry exposes Terminal without creating a signal wire mapping',
    () => {
        assert.equal(
            getEasyConectModuleContract(
                'terminal'
            ),
            EASYCONECT_TERMINAL_MODULE
        );

        assert.equal(
            EASYCONECT_MODULES.includes(
                EASYCONECT_TERMINAL_MODULE
            ),
            true
        );

        assert.equal(
            getEasyConectSignalIdForWireChannel(
                EASYCONECT_TERMINAL_CHANNEL
            ),
            null
        );
    }
);

test(
    'EasyConect Terminal contract is immutable',
    () => {
        assert.equal(
            Object.isFrozen(
                EASYCONECT_TERMINAL_MODULE
            ),
            true
        );

        assert.equal(
            Object.isFrozen(
                EASYCONECT_TERMINAL_MODULE.signals
            ),
            true
        );
    }
);
