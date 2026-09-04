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
    EBCP_CONTROL_TYPES,
    encodeFrame
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
    'EasyBlox BT send text block exposes only the text payload',
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
            'enviar texto [TEXT]'
        );

        t.same(
            block.arguments,
            {
                TEXT: {
                    type: ArgumentType.STRING,
                    defaultValue: 'Olá'
                }
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT wait text block exposes no public arguments',
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
            'aguardar texto'
        );

        t.same(
            block.arguments || {},
            {}
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
    'EasyBlox BT send number block exposes only the numeric payload',
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
            'enviar número [NUMBER]'
        );

        t.same(
            block.arguments,
            {
                NUMBER: {
                    type: ArgumentType.NUMBER,
                    defaultValue: 0
                }
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT wait number block exposes no public arguments',
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
            'aguardar número'
        );

        t.same(
            block.arguments || {},
            {}
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
            'BAUD_RATE',
            'CHANNEL'
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
    'EasyBlox BT Stage discards pending TEXT and NUMBER waits when the project stops',
    async t => {
        let projectStopAllHandler = null;

        const runtime = {
            on: (eventName, handler) => {
                if (eventName === 'PROJECT_STOP_ALL') {
                    projectStopAllHandler = handler;
                }
            }
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(runtime);

        t.type(
            projectStopAllHandler,
            'function',
            'EasyBlox BT registers a PROJECT_STOP_ALL lifecycle handler'
        );

        if (typeof projectStopAllHandler !== 'function') {
            t.end();
            return;
        }

        const staleThread = {};

        extension.waitText(
            {},
            {
                thread: staleThread
            }
        );

        extension.waitNumber(
            {},
            {
                thread: staleThread
            }
        );

        projectStopAllHandler();

        const currentThread = {};

        const currentTextWait = extension.waitText(
            {},
            {
                thread: currentThread
            }
        );

        const currentNumberWait = extension.waitNumber(
            {},
            {
                thread: currentThread
            }
        );

        extension._connectivityRuntime.receive({
            type: TEXT,
            sequence: 1,
            channel: '1',
            payload: 'novo texto'
        });

        extension._connectivityRuntime.receive({
            type: NUMBER,
            sequence: 2,
            channel: '1',
            payload: 42.5
        });

        await Promise.all([
            currentTextWait,
            currentNumberWait
        ]);

        t.equal(
            extension.receivedText(
                {},
                {
                    thread: currentThread
                }
            ),
            'novo texto',
            'current TEXT wait receives the first future TEXT message'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {
                    thread: currentThread
                }
            ),
            42.5,
            'current NUMBER wait receives the first future NUMBER message'
        );
    }
);

tap.test(
    'EasyBlox BT Stage waitText uses the fixed EBCP channel and stores it for that thread',
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
            {},
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
                    channel: '1'
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
            channel: '1',
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
    'EasyBlox BT Stage waitNumber uses the fixed EBCP channel and stores it for that thread',
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
            {},
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
                    channel: '1'
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
            channel: '1',
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

        let textWaitCount = 0;

        extension._connectivityRuntime = {
            waitFor: (type, channel) => {
                t.equal(
                    channel,
                    '1',
                    'all waits use the fixed internal EBCP channel'
                );

                if (type === TEXT) {
                    textWaitCount++;

                    return Promise.resolve({
                        type: TEXT,
                        sequence: textWaitCount,
                        channel,
                        payload:
                            textWaitCount === 1 ?
                                'texto A' :
                                'texto B'
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
            {},
            {
                thread: threadA
            }
        );

        await extension.waitText(
            {},
            {
                thread: threadB
            }
        );

        await extension.waitNumber(
            {},
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
            channel: '1',
            payload: 'ligar'
        });

        await extension.waitText(
            {},
            {
                thread
            }
        );

        extension._connectivityRuntime.receive({
            type: NUMBER,
            sequence: 2,
            channel: '1',
            payload: 42
        });

        await extension.waitNumber(
            {},
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
            channel: '1',
            payload: 'novo texto'
        });

        await extension.waitText(
            {},
            {
                thread
            }
        );

        extension._connectivityRuntime.receive({
            type: NUMBER,
            sequence: 2,
            channel: '1',
            payload: 99
        });

        await extension.waitNumber(
            {},
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

tap.test(
    'EasyBlox BT Stage init is safe when no Bluetooth serial provider exists',
    t => {
        const runtime = {
            getPeripheralExtensionByCapability: capability => {
                t.equal(
                    capability,
                    'bluetoothSerial'
                );

                return null;
            }
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(runtime);

        t.equal(
            extension.init(),
            null
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Stage init rejects an incomplete Bluetooth serial provider',
    t => {
        const runtime = {
            getPeripheralExtensionByCapability: () => ({})
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(runtime);

        t.equal(
            extension.init(),
            null
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Stage reassembles EBCP when Bluetooth data arrives one byte at a time',
    async t => {
        const writes = [];

        let bluetoothDataCallback = null;

        const peripheral = {
            onBluetoothSerialData: callback => {
                bluetoothDataCallback = callback;
            },

            initBluetoothSerial: () =>
                Promise.resolve(0x40),

            writeBluetoothSerial: data => {
                writes.push(
                    Buffer.from(data)
                );

                return 0x41;
            },

            isConnected: () =>
                true
        };

        const runtime = {
            on: () => {},

            getPeripheralExtensionByCapability: () =>
                peripheral
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(runtime);

        await extension.init();

        t.type(
            bluetoothDataCallback,
            'function',
            'Bluetooth receive callback is installed'
        );

        const thread = {};

        const wait =
            extension.waitText(
                {},
                {
                    thread
                }
            );

        const frame =
            encodeFrame({
                type: TEXT,
                sequence: 0x40,
                channel: '1',
                payload: 'fragmentado'
            });

        for (const byte of frame) {
            bluetoothDataCallback(
                Uint8Array.from([
                    byte
                ])
            );
        }

        await wait;

        t.equal(
            extension.receivedText(
                {},
                {
                    thread
                }
            ),
            'fragmentado',
            'TEXT is reconstructed from one-byte Bluetooth chunks'
        );

        t.same(
            writes[0],
            encodeFrame({
                type: EBCP_CONTROL_TYPES.ACK,
                sequence: 0,
                channel: '',
                payload: Buffer.from([
                    0x40
                ])
            }),
            'reassembled TEXT is acknowledged'
        );
    }
);

tap.test(
    'EasyBlox BT Stage connects the neutral Bluetooth provider to the EBCP session',
    async t => {
        const order = [];
        const writes = [];

        let bluetoothDataCallback = null;
        let requestedCapability = null;

        const peripheral = {
            onBluetoothSerialData: callback => {
                order.push('callback');
                bluetoothDataCallback = callback;
            },

            initBluetoothSerial: () => {
                order.push('init');
                return Promise.resolve(0x40);
            },

            writeBluetoothSerial: data => {
                writes.push(
                    Buffer.from(data)
                );

                return 0x41;
            }
        };

        const runtime = {
            getPeripheralExtensionByCapability: capability => {
                requestedCapability = capability;
                return peripheral;
            }
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(runtime);

        const initialization =
            extension.init();

        t.type(
            initialization,
            Promise,
            'init returns the provider initialization Promise'
        );

        t.equal(
            await initialization,
            0x40
        );

        t.equal(
            requestedCapability,
            'bluetoothSerial',
            'provider is resolved by neutral capability'
        );

        t.same(
            order,
            [
                'callback',
                'init'
            ],
            'receive callback is installed before physical initialization'
        );

        t.type(
            bluetoothDataCallback,
            'function'
        );

        const thread = {};

        bluetoothDataCallback(
            encodeFrame({
                type: TEXT,
                sequence: 0x21,
                channel: '1',
                payload: 'ligar'
            })
        );

        await extension.waitText(
            {},
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

        t.same(
            writes[0],
            encodeFrame({
                type: EBCP_CONTROL_TYPES.ACK,
                sequence: 0,
                channel: '',
                payload: Buffer.from([
                    0x21
                ])
            }),
            'received TEXT is acknowledged through the same provider'
        );

        bluetoothDataCallback(
            encodeFrame({
                type: NUMBER,
                sequence: 0x22,
                channel: '1',
                payload: 42.5
            })
        );

        await extension.waitNumber(
            {},
            {
                thread
            }
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            42.5
        );

        t.same(
            writes[1],
            encodeFrame({
                type: EBCP_CONTROL_TYPES.ACK,
                sequence: 0,
                channel: '',
                payload: Buffer.from([
                    0x22
                ])
            }),
            'received NUMBER is acknowledged through the same provider'
        );

        bluetoothDataCallback(
            encodeFrame({
                type: EBCP_CONTROL_TYPES.HELLO,
                sequence: 0,
                channel: '',
                payload: Buffer.alloc(0)
            })
        );

        t.same(
            writes[2],
            encodeFrame({
                type: EBCP_CONTROL_TYPES.HELLO_ACK,
                sequence: 0,
                channel: '',
                payload: Buffer.alloc(0)
            }),
            'HELLO_ACK returns through the Bluetooth provider'
        );

        t.equal(
            extension.receivedText(
                {},
                {thread}
            ),
            '',
            'HELLO invalidates text from the previous connectivity session'
        );

        t.equal(
            extension.receivedNumber(
                {},
                {thread}
            ),
            0,
            'HELLO invalidates number from the previous connectivity session'
        );
    }
);
