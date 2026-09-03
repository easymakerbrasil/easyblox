const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');

const Scratch3EasyBloxBtBlocks =
    require('../../src/extensions/scratch3_easyblox_bt');

const createExtension = () =>
    new Scratch3EasyBloxBtBlocks({});

const getBlocks = () =>
    createExtension()
        .getInfo()
        .blocks
        .filter(block => block !== '---');

const getBlock = opcode =>
    getBlocks().find(block => block.opcode === opcode);

tap.test(
    'EasyBlox BT exposes its canonical extension identity',
    t => {
        const info = createExtension().getInfo();

        t.equal(
            info.id,
            'easybloxBt'
        );

        t.equal(
            info.name,
            'EasyBlox BT'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT exposes exactly the six canonical v1 blocks',
    t => {
        const blocks = getBlocks();

        t.same(
            blocks.map(block => block.opcode),
            [
                'sendText',
                'whenTextReceived',
                'receivedText',
                'sendNumber',
                'whenNumberReceived',
                'receivedNumber'
            ]
        );

        t.equal(
            blocks.length,
            6
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT send text block exposes only text and channel',
    t => {
        const block = getBlock('sendText');

        t.equal(
            block.blockType,
            BlockType.COMMAND
        );

        t.equal(
            block.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            block.text,
            'enviar texto [TEXT] no canal [CHANNEL]'
        );

        t.same(
            block.arguments,
            {
                TEXT: {
                    type: ArgumentType.STRING,
                    defaultValue: 'Olá'
                },
                CHANNEL: {
                    type: ArgumentType.STRING,
                    defaultValue: 'cmd'
                }
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT text receive hat exposes only a static channel input',
    t => {
        const block = getBlock('whenTextReceived');

        t.equal(
            block.blockType,
            BlockType.HAT
        );

        t.equal(
            block.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            block.text,
            'quando EasyBlox BT receber texto no canal [CHANNEL]'
        );

        t.same(
            block.arguments,
            {
                CHANNEL: {
                    type: ArgumentType.STRING,
                    defaultValue: 'cmd'
                }
            }
        );

        t.equal(
            block.isEdgeActivated,
            false
        );

        t.equal(
            block.shouldRestartExistingThreads,
            false
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT received text reporter is available in both execution modes',
    t => {
        const block = getBlock('receivedText');

        t.equal(
            block.blockType,
            BlockType.REPORTER
        );

        t.equal(
            block.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            block.text,
            'texto recebido'
        );

        t.same(
            block.arguments || {},
            {}
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT send number block exposes only number and channel',
    t => {
        const block = getBlock('sendNumber');

        t.equal(
            block.blockType,
            BlockType.COMMAND
        );

        t.equal(
            block.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            block.text,
            'enviar número [NUMBER] no canal [CHANNEL]'
        );

        t.same(
            block.arguments,
            {
                NUMBER: {
                    type: ArgumentType.NUMBER,
                    defaultValue: 0
                },
                CHANNEL: {
                    type: ArgumentType.STRING,
                    defaultValue: 'valor'
                }
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT number receive hat exposes only a static channel input',
    t => {
        const block = getBlock('whenNumberReceived');

        t.equal(
            block.blockType,
            BlockType.HAT
        );

        t.equal(
            block.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            block.text,
            'quando EasyBlox BT receber número no canal [CHANNEL]'
        );

        t.same(
            block.arguments,
            {
                CHANNEL: {
                    type: ArgumentType.STRING,
                    defaultValue: 'valor'
                }
            }
        );

        t.equal(
            block.isEdgeActivated,
            false
        );

        t.equal(
            block.shouldRestartExistingThreads,
            false
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT received number reporter is available in both execution modes',
    t => {
        const block = getBlock('receivedNumber');

        t.equal(
            block.blockType,
            BlockType.REPORTER
        );

        t.equal(
            block.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            block.text,
            'número recebido'
        );

        t.same(
            block.arguments || {},
            {}
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT never exposes RX TX pins or baud rate to the student',
    t => {
        const forbiddenArgumentNames = new Set([
            'RX',
            'TX',
            'RX_PIN',
            'TX_PIN',
            'PIN',
            'BAUD',
            'BAUD_RATE'
        ]);

        for (const block of getBlocks()) {
            const argumentNames =
                Object.keys(block.arguments || {});

            for (const argumentName of argumentNames) {
                t.notOk(
                    forbiddenArgumentNames.has(argumentName),
                    `${block.opcode} must not expose ${argumentName}`
                );
            }

            t.notMatch(
                block.text,
                /\b(?:RX|TX|baud|D2|D3|9600)\b/i,
                `${block.opcode} must hide the physical UART contract`
            );
        }

        t.end();
    }
);

tap.test(
    'all EasyBlox BT v1 blocks are explicitly BOTH',
    t => {
        for (const block of getBlocks()) {
            t.equal(
                block.executionMode,
                BlockExecutionMode.BOTH,
                block.opcode
            );
        }

        t.end();
    }
);
