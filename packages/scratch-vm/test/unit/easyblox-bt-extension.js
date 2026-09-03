const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');

const {
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

const {
    EBCP_CONTROL_TYPES
} = require('../../src/connectivity/easyblox-connectivity-protocol');

const Scratch3EasyBloxBtBlocks =
    require('../../src/extensions/scratch3_easyblox_bt');

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

const createExtension = () =>
    new Scratch3EasyBloxBtBlocks({});

const createDeferred = () => {
    let resolve;

    const promise = new Promise(resolvePromise => {
        resolve = resolvePromise;
    });

    return {
        promise,
        resolve
    };
};

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

tap.test(
    'EasyBlox BT received reporters expose canonical defaults before any Stage wait',
    t => {
        const extension = createExtension();
        const thread = {};

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            ''
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            0
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Stage waitText blocks for TEXT on the requested channel and stores it for that thread',
    async t => {
        const extension = createExtension();
        const thread = {};
        const deferred = createDeferred();
        const calls = [];

        extension._connectivityRuntime = {
            waitFor: (type, channel) => {
                calls.push({
                    type,
                    channel
                });

                return deferred.promise;
            }
        };

        const wait = extension.waitText(
            {
                CHANNEL: 'cmd'
            },
            {
                thread
            }
        );

        t.ok(
            wait &&
            typeof wait.then === 'function',
            'waitText returns the connectivity wait Promise'
        );

        t.same(
            calls,
            [
                {
                    type: TEXT,
                    channel: 'cmd'
                }
            ]
        );

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            '',
            'text is unchanged while the wait is pending'
        );

        deferred.resolve({
            type: TEXT,
            sequence: 1,
            channel: 'cmd',
            payload: 'ligar'
        });

        await wait;

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            'ligar'
        );
    }
);

tap.test(
    'EasyBlox BT Stage waitNumber blocks for NUMBER on the requested channel and stores it for that thread',
    async t => {
        const extension = createExtension();
        const thread = {};
        const deferred = createDeferred();
        const calls = [];

        extension._connectivityRuntime = {
            waitFor: (type, channel) => {
                calls.push({
                    type,
                    channel
                });

                return deferred.promise;
            }
        };

        const wait = extension.waitNumber(
            {
                CHANNEL: 'valor'
            },
            {
                thread
            }
        );

        t.ok(
            wait &&
            typeof wait.then === 'function',
            'waitNumber returns the connectivity wait Promise'
        );

        t.same(
            calls,
            [
                {
                    type: NUMBER,
                    channel: 'valor'
                }
            ]
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            0,
            'number is unchanged while the wait is pending'
        );

        deferred.resolve({
            type: NUMBER,
            sequence: 2,
            channel: 'valor',
            payload: 42.5
        });

        await wait;

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            42.5
        );
    }
);

tap.test(
    'EasyBlox BT Stage keeps received values isolated by Scratch thread and message type',
    async t => {
        const extension = createExtension();
        const threadA = {};
        const threadB = {};

        extension._connectivityRuntime = {
            waitFor: (type, channel) => {
                if (
                    type === TEXT &&
                    channel === 'a'
                ) {
                    return Promise.resolve({
                        type: TEXT,
                        sequence: 1,
                        channel,
                        payload: 'texto A'
                    });
                }

                if (
                    type === TEXT &&
                    channel === 'b'
                ) {
                    return Promise.resolve({
                        type: TEXT,
                        sequence: 2,
                        channel,
                        payload: 'texto B'
                    });
                }

                return Promise.resolve({
                    type: NUMBER,
                    sequence: 3,
                    channel,
                    payload: 99
                });
            }
        };

        await extension.waitText(
            {
                CHANNEL: 'a'
            },
            {
                thread: threadA
            }
        );

        await extension.waitText(
            {
                CHANNEL: 'b'
            },
            {
                thread: threadB
            }
        );

        await extension.waitNumber(
            {
                CHANNEL: 'valor'
            },
            {
                thread: threadA
            }
        );

        t.equal(
            extension.receivedText(
                {},
                {thread: threadA}
            ),
            'texto A'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread: threadA}
            ),
            99
        );

        t.equal(
            extension.receivedText(
                {},
                {thread: threadB}
            ),
            'texto B'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread: threadB}
            ),
            0,
            'thread B does not inherit thread A number'
        );
    }
);

tap.test(
    'EasyBlox BT Stage resets thread-local received values when the connectivity session changes',
    async t => {
        const extension = createExtension();
        const thread = {};

        extension._connectivityRuntime.receive({
            type: TEXT,
            sequence: 1,
            channel: 'cmd',
            payload: 'ligar'
        });

        await extension.waitText(
            {
                CHANNEL: 'cmd'
            },
            {
                thread
            }
        );

        extension._connectivityRuntime.receive({
            type: NUMBER,
            sequence: 2,
            channel: 'valor',
            payload: 42
        });

        await extension.waitNumber(
            {
                CHANNEL: 'valor'
            },
            {
                thread
            }
        );

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            'ligar'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            42
        );

        extension._connectivityRuntime.receive({
            type: EBCP_CONTROL_TYPES.HELLO,
            sequence: 0,
            channel: '',
            payload: Buffer.alloc(0)
        });

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            '',
            'HELLO invalidates text received in the previous session'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            0,
            'HELLO invalidates number received in the previous session'
        );

        extension._connectivityRuntime.receive({
            type: TEXT,
            sequence: 1,
            channel: 'cmd',
            payload: 'novo texto'
        });

        await extension.waitText(
            {
                CHANNEL: 'cmd'
            },
            {
                thread
            }
        );

        extension._connectivityRuntime.receive({
            type: NUMBER,
            sequence: 2,
            channel: 'valor',
            payload: 99
        });

        await extension.waitNumber(
            {
                CHANNEL: 'valor'
            },
            {
                thread
            }
        );

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            'novo texto'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            99
        );

        extension._connectivityRuntime.receive({
            type: EBCP_CONTROL_TYPES.HELLO_ACK,
            sequence: 0,
            channel: '',
            payload: Buffer.alloc(0)
        });

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            '',
            'HELLO_ACK invalidates text from the previous session'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            0,
            'HELLO_ACK invalidates number from the previous session'
        );
    }
);
