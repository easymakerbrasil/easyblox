const tap = require('tap');

const Blocks = require('../../src/engine/blocks');
const Runtime = require('../../src/engine/runtime');

const {
    CONNECTIVITY_RESOURCES
} = require('../../src/connectivity/easyblox-connectivity-contract');

const UploadProgramExtractor =
    require('../../src/upload/upload-program-extractor');

const UploadTypeValidator =
    require('../../src/upload/upload-type-validator');

const SOFTWARE_UART_D2_D3 =
    CONNECTIVITY_RESOURCES.SOFTWARE_UART_D2_D3;

const createRuntimeWithBlocks = blockDefinitions => {
    const runtime = new Runtime();
    const blocks = new Blocks(runtime);

    blockDefinitions.forEach(block =>
        blocks.createBlock(block)
    );

    runtime.targets = [{
        isOriginal: true,
        blocks
    }];

    return runtime;
};

const createUploadHat = (next = null) => ({
    id: 'upload_hat',
    opcode: 'arduinoUno_whenArduinoUnoStart',
    next,
    parent: null,
    inputs: {},
    fields: {},
    topLevel: true,
    shadow: false
});

const createTextShadow = (
    id,
    parent,
    value
) => ({
    id,
    opcode: 'text',
    next: null,
    parent,
    inputs: {},
    fields: {
        TEXT: {
            name: 'TEXT',
            value: String(value)
        }
    },
    topLevel: false,
    shadow: true
});

const createNumberShadow = (
    id,
    parent,
    value
) => ({
    id,
    opcode: 'math_number',
    next: null,
    parent,
    inputs: {},
    fields: {
        NUM: {
            name: 'NUM',
            value: String(value)
        }
    },
    topLevel: false,
    shadow: true
});

tap.test(
    'EasyBlox BT Upload extracts sendText with the fixed EBCP channel and reserves the shared D2/D3 UART',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat('bt_send_text'),
            {
                id: 'bt_send_text',
                opcode: 'easybloxBt_sendText',
                next: null,
                parent: 'upload_hat',
                inputs: {
                    TEXT: {
                        name: 'TEXT',
                        block: 'bt_text',
                        shadow: 'bt_text'
                    }
                },
                fields: {},
                topLevel: false,
                shadow: false
            },
            createTextShadow(
                'bt_text',
                'bt_send_text',
                'Olá'
            )
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        t.same(
            extractor.extract(),
            {
                setup: [{
                    type: 'EasyBloxBtSendText',
                    value: {
                        type: 'TextLiteral',
                        value: 'Olá'
                    },
                    channel: {
                        type: 'TextLiteral',
                        value: '1'
                    }
                }],
                loop: [],
                resources: [
                    SOFTWARE_UART_D2_D3
                ]
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload extracts sendNumber with numeric expression IR',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat('bt_send_number'),
            {
                id: 'bt_send_number',
                opcode: 'easybloxBt_sendNumber',
                next: null,
                parent: 'upload_hat',
                inputs: {
                    NUMBER: {
                        name: 'NUMBER',
                        block: 'bt_number',
                        shadow: 'bt_number'
                    }
                },
                fields: {},
                topLevel: false,
                shadow: false
            },
            createNumberShadow(
                'bt_number',
                'bt_send_number',
                27.5
            ),
            createTextShadow(
                'bt_channel',
                'bt_send_number',
                'valor'
            )
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        t.same(
            extractor.extract(),
            {
                setup: [{
                    type: 'EasyBloxBtSendNumber',
                    value: {
                        type: 'DecimalLiteral',
                        value: 27.5
                    },
                    channel: {
                        type: 'TextLiteral',
                        value: '1'
                    }
                }],
                loop: [],
                resources: [
                    SOFTWARE_UART_D2_D3
                ]
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload deduplicates its logical UART resource',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat('bt_send_text'),
            {
                id: 'bt_send_text',
                opcode: 'easybloxBt_sendText',
                next: 'bt_send_number',
                parent: 'upload_hat',
                inputs: {
                    TEXT: {
                        name: 'TEXT',
                        block: 'bt_text',
                        shadow: 'bt_text'
                    }
                },
                fields: {},
                topLevel: false,
                shadow: false
            },
            createTextShadow(
                'bt_text',
                'bt_send_text',
                'Olá'
            ),
            createTextShadow(
                'bt_text_channel',
                'bt_send_text',
                'cmd'
            ),
            {
                id: 'bt_send_number',
                opcode: 'easybloxBt_sendNumber',
                next: null,
                parent: 'bt_send_text',
                inputs: {
                    NUMBER: {
                        name: 'NUMBER',
                        block: 'bt_number',
                        shadow: 'bt_number'
                    }
                },
                fields: {},
                topLevel: false,
                shadow: false
            },
            createNumberShadow(
                'bt_number',
                'bt_send_number',
                42
            )
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        const ir = extractor.extract();

        t.same(
            ir.resources,
            [
                SOFTWARE_UART_D2_D3
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload extracts receivedText as typed expression IR',
    t => {
        const runtime = createRuntimeWithBlocks([
            {
                id: 'received_text',
                opcode: 'easybloxBt_receivedText',
                next: null,
                parent: null,
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            }
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        const blocks =
            runtime.targets[0].blocks;

        t.same(
            extractor._extractExpression(
                blocks,
                'received_text'
            ),
            {
                type: 'EasyBloxBtReceivedTextExpression'
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload extracts receivedNumber as typed expression IR',
    t => {
        const runtime = createRuntimeWithBlocks([
            {
                id: 'received_number',
                opcode: 'easybloxBt_receivedNumber',
                next: null,
                parent: null,
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            }
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        const blocks =
            runtime.targets[0].blocks;

        t.same(
            extractor._extractExpression(
                blocks,
                'received_number'
            ),
            {
                type: 'EasyBloxBtReceivedNumberExpression'
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT received reporter use also reserves the shared D2/D3 UART',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat('serial_write'),
            {
                id: 'serial_write',
                opcode: 'serial_serialWrite',
                next: null,
                parent: 'upload_hat',
                inputs: {
                    TEXT: {
                        name: 'TEXT',
                        block: 'received_text',
                        shadow: null
                    }
                },
                fields: {},
                topLevel: false,
                shadow: false
            },
            {
                id: 'received_text',
                opcode: 'easybloxBt_receivedText',
                next: null,
                parent: 'serial_write',
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            }
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        const ir = extractor.extract();

        t.same(
            ir.resources,
            [
                SOFTWARE_UART_D2_D3
            ]
        );

        t.same(
            ir.setup,
            [{
                type: 'SerialWrite',
                value: {
                    type: 'EasyBloxBtReceivedTextExpression'
                }
            }]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload type validator accepts typed send statements',
    t => {
        const validator =
            new UploadTypeValidator();

        const ir = {
            setup: [
                {
                    type: 'EasyBloxBtInit'
                },
                {
                    type: 'EasyBloxBtSendText',
                    value: {
                        type: 'TextLiteral',
                        value: 'Olá'
                    },
                    channel: {
                        type: 'TextLiteral',
                        value: 'cmd'
                    }
                },
                {
                    type: 'EasyBloxBtSendNumber',
                    value: {
                        type: 'IntegerLiteral',
                        value: 42
                    },
                    channel: {
                        type: 'TextLiteral',
                        value: 'valor'
                    }
                },
                {
                    type: 'EasyBloxBtSendNumber',
                    value: {
                        type: 'DecimalLiteral',
                        value: 27.5
                    },
                    channel: {
                        type: 'TextLiteral',
                        value: 'valor'
                    }
                }
            ],
            loop: []
        };

        t.equal(
            validator.validate(ir),
            ir
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload type validator rejects incompatible send values',
    t => {
        const validator =
            new UploadTypeValidator();

        t.throws(
            () => validator.validate({
                setup: [
                    {
                        type: 'EasyBloxBtInit'
                    },
                    {
                        type: 'EasyBloxBtSendText',
                        value: {
                            type: 'IntegerLiteral',
                            value: 42
                        },
                        channel: {
                            type: 'TextLiteral',
                            value: 'cmd'
                        }
                    }
                ],
                loop: []
            }),
            /EasyBlox BT text value must be TEXT/
        );

        t.throws(
            () => validator.validate({
                setup: [
                    {
                        type: 'EasyBloxBtInit'
                    },
                    {
                        type: 'EasyBloxBtSendNumber',
                        value: {
                            type: 'TextLiteral',
                            value: '42'
                        },
                        channel: {
                            type: 'TextLiteral',
                            value: 'valor'
                        }
                    }
                ],
                loop: []
            }),
            /EasyBlox BT number value must be numeric/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload type validator requires TEXT send channels',
    t => {
        const validator =
            new UploadTypeValidator();

        t.throws(
            () => validator.validate({
                setup: [
                    {
                        type: 'EasyBloxBtInit'
                    },
                    {
                        type: 'EasyBloxBtSendText',
                        value: {
                            type: 'TextLiteral',
                            value: 'Olá'
                        },
                        channel: {
                            type: 'IntegerLiteral',
                            value: 1
                        }
                    }
                ],
                loop: []
            }),
            /EasyBlox BT channel must be TEXT/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload reporter types are TEXT and DECIMAL',
    t => {
        const validator =
            new UploadTypeValidator();

        const ir = {
            globals: {
                variables: [
                    {
                        id: 'text_value',
                        name: 'text_value',
                        valueType: 'TEXT',
                        initialValue: {
                            type: 'TextLiteral',
                            value: ''
                        }
                    },
                    {
                        id: 'number_value',
                        name: 'number_value',
                        valueType: 'DECIMAL',
                        initialValue: {
                            type: 'DecimalLiteral',
                            value: 0
                        }
                    }
                ],
                lists: []
            },
            setup: [
                {
                    type: 'EasyBloxBtInit'
                },
                {
                    type: 'VariableSet',
                    variableId: 'text_value',
                    value: {
                        type: 'EasyBloxBtReceivedTextExpression'
                    }
                },
                {
                    type: 'VariableSet',
                    variableId: 'number_value',
                    value: {
                        type: 'EasyBloxBtReceivedNumberExpression'
                    }
                }
            ],
            loop: []
        };

        t.equal(
            validator.validate(ir),
            ir
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload extracts explicit initialization',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat('bt_init'),
            {
                id: 'bt_init',
                opcode: 'easybloxBt_init',
                next: null,
                parent: 'upload_hat',
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            }
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        t.same(
            extractor.extract(),
            {
                setup: [{
                    type: 'EasyBloxBtInit'
                }],
                loop: [],
                resources: [
                    SOFTWARE_UART_D2_D3
                ]
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload extracts sequential text wait',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat('bt_init'),
            {
                id: 'bt_init',
                opcode: 'easybloxBt_init',
                next: 'bt_wait',
                parent: 'upload_hat',
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            },
            {
                id: 'bt_wait',
                opcode: 'easybloxBt_waitText',
                next: null,
                parent: 'bt_init',
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            }
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        t.same(
            extractor.extract(),
            {
                setup: [
                    {
                        type: 'EasyBloxBtInit'
                    },
                    {
                        type: 'EasyBloxBtWaitText',
                        channel: {
                            type: 'TextLiteral',
                            value: '1'
                        }
                    }
                ],
                loop: [],
                resources: [
                    SOFTWARE_UART_D2_D3
                ]
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload extracts sequential number wait',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat('bt_init'),
            {
                id: 'bt_init',
                opcode: 'easybloxBt_init',
                next: 'bt_wait',
                parent: 'upload_hat',
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            },
            {
                id: 'bt_wait',
                opcode: 'easybloxBt_waitNumber',
                next: null,
                parent: 'bt_init',
                inputs: {},
                fields: {},
                topLevel: false,
                shadow: false
            }
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        t.same(
            extractor.extract(),
            {
                setup: [
                    {
                        type: 'EasyBloxBtInit'
                    },
                    {
                        type: 'EasyBloxBtWaitNumber',
                        channel: {
                            type: 'TextLiteral',
                            value: '1'
                        }
                    }
                ],
                loop: [],
                resources: [
                    SOFTWARE_UART_D2_D3
                ]
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload type validator accepts initialized sequential use',
    t => {
        const validator =
            new UploadTypeValidator();

        const ir = {
            setup: [
                {
                    type: 'EasyBloxBtInit'
                },
                {
                    type: 'EasyBloxBtWaitText',
                    channel: {
                        type: 'TextLiteral',
                        value: 'cmd'
                    }
                },
                {
                    type: 'EasyBloxBtWaitNumber',
                    channel: {
                        type: 'TextLiteral',
                        value: 'valor'
                    }
                }
            ],
            loop: []
        };

        t.equal(
            validator.validate(ir),
            ir
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload wait channel must be TEXT',
    t => {
        const validator =
            new UploadTypeValidator();

        t.throws(
            () => validator.validate({
                setup: [
                    {
                        type: 'EasyBloxBtInit'
                    },
                    {
                        type: 'EasyBloxBtWaitText',
                        channel: {
                            type: 'IntegerLiteral',
                            value: 1
                        }
                    }
                ],
                loop: []
            }),
            /EasyBlox BT channel must be TEXT/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload requires initialization before Bluetooth use',
    t => {
        const validator =
            new UploadTypeValidator();

        t.throws(
            () => validator.validate({
                setup: [{
                    type: 'EasyBloxBtSendText',
                    value: {
                        type: 'TextLiteral',
                        value: 'Olá'
                    },
                    channel: {
                        type: 'TextLiteral',
                        value: 'cmd'
                    }
                }],
                loop: []
            }),
            /EasyBlox BT must be initialized before use/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload initialization is allowed only once',
    t => {
        const validator =
            new UploadTypeValidator();

        t.throws(
            () => validator.validate({
                setup: [
                    {
                        type: 'EasyBloxBtInit'
                    },
                    {
                        type: 'EasyBloxBtInit'
                    }
                ],
                loop: []
            }),
            /EasyBlox BT must be initialized only once/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload initialization belongs to setup',
    t => {
        const validator =
            new UploadTypeValidator();

        t.throws(
            () => validator.validate({
                setup: [],
                loop: [{
                    type: 'EasyBloxBtInit'
                }]
            }),
            /EasyBlox BT initialization must be in setup/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload no longer extracts parallel receive event hats',
    t => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat(),
            {
                id: 'legacy_bt_hat',
                opcode: 'easybloxBt_whenTextReceived',
                next: null,
                parent: null,
                inputs: {
                    CHANNEL: {
                        name: 'CHANNEL',
                        block: 'legacy_channel',
                        shadow: 'legacy_channel'
                    }
                },
                fields: {},
                topLevel: true,
                shadow: false
            },
            createTextShadow(
                'legacy_channel',
                'legacy_bt_hat',
                'cmd'
            )
        ]);

        const extractor =
            new UploadProgramExtractor(runtime);

        const ir = extractor.extract();

        t.equal(
            Object.prototype.hasOwnProperty.call(
                ir,
                'events'
            ),
            false
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload rejects legacy parallel event IR',
    t => {
        const validator =
            new UploadTypeValidator();

        t.throws(
            () => validator.validate({
                setup: [],
                loop: [],
                events: [{
                    type: 'EasyBloxBtMessageReceivedEvent',
                    messageType: 'TEXT',
                    channel: 'cmd',
                    body: []
                }]
            }),
            /EasyBlox BT parallel events are not supported/
        );

        t.end();
    }
);
