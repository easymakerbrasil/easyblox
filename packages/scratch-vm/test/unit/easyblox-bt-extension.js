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

        t.equal(
            info.color1,
            '#0a3e91'
        );

        t.equal(
            info.color2,
            '#083477'
        );

        t.equal(
            info.color3,
            '#06285c'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT exposes exactly the seven canonical v1 blocks',
    t => {
        const blocks = getBlocks();

        t.same(
            blocks.map(block => block.opcode),
            [
                'init',
                'sendText',
                'waitText',
                'receivedText',
                'sendNumber',
                'waitNumber',
                'receivedNumber'
            ]
        );

        t.equal(
            blocks.length,
            7
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT init block explicitly initializes the transport',
    t => {
        const block = getBlock('init');

        t.ok(
            block,
            'init block must exist'
        );

        if (!block) {
            t.end();
            return;
        }

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
            'iniciar EasyBlox BT'
        );

        t.same(
            block.arguments || {},
            {}
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
    'EasyBlox BT wait text block exposes only a channel input',
    t => {
        const block = getBlock('waitText');

        t.ok(
            block,
            'waitText block must exist'
        );

        if (!block) {
            t.end();
            return;
        }

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
            'aguardar texto no canal [CHANNEL]'
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
    'EasyBlox BT wait number block exposes only a channel input',
    t => {
        const block = getBlock('waitNumber');

        t.ok(
            block,
            'waitNumber block must exist'
        );

        if (!block) {
            t.end();
            return;
        }

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
            'aguardar número no canal [CHANNEL]'
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

tap.test(
    'EasyBlox BT v1 exposes no extension HAT blocks',
    t => {
        for (const block of getBlocks()) {
            t.equal(
                block.blockType === BlockType.HAT,
                false,
                block.opcode
            );
        }

        t.end();
    }
);

tap.test(
    'every EasyBlox BT public opcode has a runtime method',
    t => {
        const extension = createExtension();

        for (const block of getBlocks()) {
            t.equal(
                typeof extension[block.opcode],
                'function',
                block.opcode
            );
        }

        t.end();
    }
);

tap.test(
    'all EasyBlox BT v1 blocks require Bluetooth Serial board capability',
    t => {
        for (const block of getBlocks()) {
            t.equal(
                block.requiredBoardCapability,
                'bluetoothSerial',
                block.opcode
            );
        }

        t.end();
    }
);
