const tap = require('tap');

const Blocks = require('../../src/engine/blocks');
const Runtime = require('../../src/engine/runtime');

const UploadProgramExtractor = require('../../src/upload/upload-program-extractor');
const ArduinoUnoGenerator = require('../../src/upload/arduino-uno-generator');

const UploadContextValidator =
    require('../../src/upload/upload-context-validator');

const InternalIdentifierAllocator =
    require('../../src/upload/internal-identifier-allocator');

const createRuntimeWithBlocks = blockDefinitions => {
    const runtime = new Runtime();
    const blocks = new Blocks(runtime);

    blockDefinitions.forEach(block => blocks.createBlock(block));

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

const createNumberShadow = (id, parent, value) => ({
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

tap.test('Arduino UNO Upload extracts an empty entry point', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat()
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const ir = extractor.extract();

    t.same(ir, {
        setup: [],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts DIGITAL_WRITE into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('digital_write'),
        {
            id: 'digital_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pin_13',
                    shadow: 'pin_13'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'value_high',
                    shadow: 'value_high'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('pin_13', 'digital_write', 13),
        createNumberShadow('value_high', 'digital_write', 1)
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO generator creates an empty deterministic sketch', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator infers and deduplicates OUTPUT pinMode', t => {
    const generator = new ArduinoUnoGenerator();

    const ir = {
        setup: [
            {
                type: 'DigitalWrite',
                pin: 13,
                value: true
            },
            {
                type: 'DigitalWrite',
                pin: 13,
                value: false
            }
        ],
        loop: []
    };

    const code = generator.generate(ir);

    t.equal(code, [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '    digitalWrite(13, HIGH);',
        '    digitalWrite(13, LOW);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.equal(
        code.match(/pinMode\(13, OUTPUT\);/g).length,
        1,
        'pinMode should be emitted exactly once'
    );

    t.equal(
        generator.generate(ir),
        code,
        'generation should be deterministic'
    );

    t.end();
});

tap.test('Arduino UNO Upload rejects multiple entry points', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat(),
        {
            id: 'upload_hat_2',
            opcode: 'arduinoUno_whenArduinoUnoStart',
            next: null,
            parent: null,
            inputs: {},
            fields: {},
            topLevel: true,
            shadow: false
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.throws(
        () => extractor.extract(),
        /multiple entry points/
    );

    t.end();
});

tap.test('Arduino UNO Upload ignores loose unreachable Upload blocks', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat(),
        {
            id: 'loose_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: null,
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'loose_pin',
                    shadow: 'loose_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'loose_value',
                    shadow: 'loose_value'
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        createNumberShadow('loose_pin', 'loose_write', 13),
        createNumberShadow('loose_value', 'loose_write', 1)
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const ir = extractor.extract();

    t.same(ir, {
        setup: [],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload rejects reachable Stage-only blocks', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('stage_only'),
        {
            id: 'stage_only',
            opcode: 'motion_movesteps',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.throws(
        () => extractor.extract(),
        /Unsupported Arduino UNO Upload opcode: motion_movesteps/
    );

    t.end();
});

tap.test('Arduino UNO Upload rejects projects without an entry point', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'stage_script',
            opcode: 'event_whenflagclicked',
            next: null,
            parent: null,
            inputs: {},
            fields: {},
            topLevel: true,
            shadow: false
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.throws(
        () => extractor.extract(),
        /entry point not found/
    );

    t.end();
});

tap.test('Arduino UNO Upload ignores independent Stage scripts', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat(),
        {
            id: 'stage_script',
            opcode: 'event_whenflagclicked',
            next: 'stage_motion',
            parent: null,
            inputs: {},
            fields: {},
            topLevel: true,
            shadow: false
        },
        {
            id: 'stage_motion',
            opcode: 'motion_movesteps',
            next: null,
            parent: 'stage_script',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload finds its entry point in any original target', t => {
    const runtime = new Runtime();

    const firstTargetBlocks = new Blocks(runtime);
    firstTargetBlocks.createBlock({
        id: 'stage_script',
        opcode: 'event_whenflagclicked',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false
    });

    const secondTargetBlocks = new Blocks(runtime);
    secondTargetBlocks.createBlock(createUploadHat());

    runtime.targets = [
        {
            isOriginal: true,
            blocks: firstTargetBlocks
        },
        {
            isOriginal: true,
            blocks: secondTargetBlocks
        }
    ];

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload ignores entry points belonging to clones', t => {
    const runtime = new Runtime();

    const originalBlocks = new Blocks(runtime);
    originalBlocks.createBlock(createUploadHat());

    const cloneBlocks = new Blocks(runtime);
    cloneBlocks.createBlock({
        id: 'clone_upload_hat',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false
    });

    runtime.targets = [
        {
            isOriginal: true,
            blocks: originalBlocks
        },
        {
            isOriginal: false,
            blocks: cloneBlocks
        }
    ];

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload rejects invalid DIGITAL_WRITE literal values', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('digital_write'),
        {
            id: 'digital_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pin_13',
                    shadow: 'pin_13'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'invalid_value',
                    shadow: 'invalid_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('pin_13', 'digital_write', 13),
        createNumberShadow('invalid_value', 'digital_write', 2)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.throws(
        () => extractor.extract(),
        /Invalid digital value VALUE/
    );

    t.end();
});

tap.test('Arduino UNO Upload maps main-chain FOREVER body to loop', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('setup_write'),
        {
            id: 'setup_write',
            opcode: 'arduinoUno_digitalWrite',
            next: 'forever',
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'setup_pin',
                    shadow: 'setup_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'setup_value',
                    shadow: 'setup_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('setup_pin', 'setup_write', 13),
        createNumberShadow('setup_value', 'setup_write', 1),
        {
            id: 'forever',
            opcode: 'control_forever',
            next: null,
            parent: 'setup_write',
            inputs: {
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'loop_write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'loop_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'forever',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'loop_pin',
                    shadow: 'loop_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'loop_value',
                    shadow: 'loop_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('loop_pin', 'loop_write', 13),
        createNumberShadow('loop_value', 'loop_write', 0)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        loop: [{
            type: 'DigitalWrite',
            pin: 13,
            value: false
        }]
    });

    t.end();
});
tap.test('Arduino UNO generator keeps loop code separate and initializes its resources in setup', t => {
    const generator = new ArduinoUnoGenerator();

    const ir = {
        setup: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        loop: [{
            type: 'DigitalWrite',
            pin: 13,
            value: false
        }]
    };

    const code = generator.generate(ir);

    t.equal(code, [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '    digitalWrite(13, HIGH);',
        '}',
        '',
        'void loop() {',
        '    digitalWrite(13, LOW);',
        '}',
        ''
    ].join('\n'));

    t.equal(
        code.match(/pinMode\(13, OUTPUT\);/g).length,
        1,
        'loop resources should be initialized exactly once in setup'
    );

    t.end();
});

tap.test('Arduino UNO Upload accepts an empty main-chain FOREVER', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('forever'),
        {
            id: 'forever',
            opcode: 'control_forever',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload marks code after main-chain FOREVER as unreachable', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('forever'),
        {
            id: 'forever',
            opcode: 'control_forever',
            next: 'unreachable_write',
            parent: 'upload_hat',
            inputs: {
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'loop_write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'loop_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'forever',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'loop_pin',
                    shadow: 'loop_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'loop_value',
                    shadow: 'loop_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('loop_pin', 'loop_write', 13),
        createNumberShadow('loop_value', 'loop_write', 1),
        {
            id: 'unreachable_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'forever',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'unreachable_pin',
                    shadow: 'unreachable_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'unreachable_value',
                    shadow: 'unreachable_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'unreachable_pin',
            'unreachable_write',
            12
        ),
        createNumberShadow(
            'unreachable_value',
            'unreachable_write',
            1
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [],
        loop: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        unreachable: [{
            type: 'UnreachableCode',
            reason: 'AfterInfiniteLoop'
        }]
    });

    t.end();
});

tap.test('Arduino UNO Upload context validator accepts reachable IR', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        loop: [{
            type: 'DigitalWrite',
            pin: 13,
            value: false
        }]
    };

    t.doesNotThrow(() => validator.validate(ir));

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects code after FOREVER', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [],
        loop: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        unreachable: [{
            type: 'UnreachableCode',
            reason: 'AfterInfiniteLoop'
        }]
    };

    t.throws(
        () => validator.validate(ir),
        /Arduino UNO Upload contains unreachable code after infinite loop/
    );

    t.end();
});

tap.test('Arduino UNO Upload rejects extracted code after main-chain FOREVER through context validation', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('forever'),
        {
            id: 'forever',
            opcode: 'control_forever',
            next: 'unreachable_write',
            parent: 'upload_hat',
            inputs: {
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'loop_write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'loop_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'forever',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'loop_pin',
                    shadow: 'loop_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'loop_value',
                    shadow: 'loop_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('loop_pin', 'loop_write', 13),
        createNumberShadow('loop_value', 'loop_write', 1),
        {
            id: 'unreachable_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'forever',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'unreachable_pin',
                    shadow: 'unreachable_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'unreachable_value',
                    shadow: 'unreachable_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'unreachable_pin',
            'unreachable_write',
            12
        ),
        createNumberShadow(
            'unreachable_value',
            'unreachable_write',
            1
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadContextValidator();

    const ir = extractor.extract();

    t.throws(
        () => validator.validate(ir),
        /Arduino UNO Upload contains unreachable code after infinite loop/
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts REPEAT into structured IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('repeat'),
        {
            id: 'repeat',
            opcode: 'control_repeat',
            next: null,
            parent: 'upload_hat',
            inputs: {
                TIMES: {
                    name: 'TIMES',
                    block: 'repeat_times',
                    shadow: 'repeat_times'
                },
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'repeat_write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('repeat_times', 'repeat', 3),
        {
            id: 'repeat_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'repeat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'repeat_pin',
                    shadow: 'repeat_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'repeat_value',
                    shadow: 'repeat_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('repeat_pin', 'repeat_write', 13),
        createNumberShadow('repeat_value', 'repeat_write', 1)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Repeat',
            times: 3,
            body: [{
                type: 'DigitalWrite',
                pin: 13,
                value: true
            }]
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload accepts zero REPEAT iterations', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('repeat'),
        {
            id: 'repeat',
            opcode: 'control_repeat',
            next: null,
            parent: 'upload_hat',
            inputs: {
                TIMES: {
                    name: 'TIMES',
                    block: 'repeat_times',
                    shadow: 'repeat_times'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('repeat_times', 'repeat', 0)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Repeat',
            times: 0,
            body: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload rejects fractional REPEAT iterations', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('repeat'),
        {
            id: 'repeat',
            opcode: 'control_repeat',
            next: null,
            parent: 'upload_hat',
            inputs: {
                TIMES: {
                    name: 'TIMES',
                    block: 'repeat_times',
                    shadow: 'repeat_times'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('repeat_times', 'repeat', 2.5)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.throws(
        () => extractor.extract(),
        /Invalid repeat count TIMES/
    );

    t.end();
});

tap.test('Arduino UNO Upload rejects negative REPEAT iterations', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('repeat'),
        {
            id: 'repeat',
            opcode: 'control_repeat',
            next: null,
            parent: 'upload_hat',
            inputs: {
                TIMES: {
                    name: 'TIMES',
                    block: 'repeat_times',
                    shadow: 'repeat_times'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('repeat_times', 'repeat', -1)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.throws(
        () => extractor.extract(),
        /Invalid repeat count TIMES/
    );

    t.end();
});

tap.test('Arduino UNO generator emits REPEAT with an internal loop identifier', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: 3,
            body: [{
                type: 'DigitalWrite',
                pin: 13,
                value: true
            }]
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '    for (int easyblox_repeat_index_0 = 0; easyblox_repeat_index_0 < 3; ++easyblox_repeat_index_0) {',
        '        digitalWrite(13, HIGH);',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO internal identifier allocator avoids reserved names', t => {
    const allocator = new InternalIdentifierAllocator([
        'easyblox_repeat_index_0'
    ]);

    t.equal(
        allocator.allocate('easyblox_repeat_index'),
        'easyblox_repeat_index_1'
    );

    t.equal(
        allocator.allocate('easyblox_repeat_index'),
        'easyblox_repeat_index_2'
    );

    t.throws(
        () => allocator.allocate('_reserved'),
        /Invalid internal identifier base/
    );

    t.end();
});

tap.test('Arduino UNO generator emits nested REPEAT with unique internal identifiers', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: 2,
            body: [{
                type: 'Repeat',
                times: 3,
                body: [{
                    type: 'DigitalWrite',
                    pin: 13,
                    value: true
                }]
            }]
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '    for (int easyblox_repeat_index_0 = 0; easyblox_repeat_index_0 < 2; ++easyblox_repeat_index_0) {',
        '        for (int easyblox_repeat_index_1 = 0; easyblox_repeat_index_1 < 3; ++easyblox_repeat_index_1) {',
        '            digitalWrite(13, HIGH);',
        '        }',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.equal(
        code.match(/pinMode\(13, OUTPUT\);/g).length,
        1,
        'nested repeat resources should be initialized exactly once'
    );

    t.end();
});

tap.test('Arduino UNO Upload supports REPEAT inside main FOREVER loop', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('forever'),
        {
            id: 'forever',
            opcode: 'control_forever',
            next: null,
            parent: 'upload_hat',
            inputs: {
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'repeat',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'repeat',
            opcode: 'control_repeat',
            next: null,
            parent: 'forever',
            inputs: {
                TIMES: {
                    name: 'TIMES',
                    block: 'repeat_times',
                    shadow: 'repeat_times'
                },
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'loop_write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('repeat_times', 'repeat', 2),
        {
            id: 'loop_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'repeat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'loop_pin',
                    shadow: 'loop_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'loop_value',
                    shadow: 'loop_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('loop_pin', 'loop_write', 13),
        createNumberShadow('loop_value', 'loop_write', 1)
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [],
        loop: [{
            type: 'Repeat',
            times: 2,
            body: [{
                type: 'DigitalWrite',
                pin: 13,
                value: true
            }]
        }]
    });

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '}',
        '',
        'void loop() {',
        '    for (int easyblox_repeat_index_0 = 0; easyblox_repeat_index_0 < 2; ++easyblox_repeat_index_0) {',
        '        digitalWrite(13, HIGH);',
        '    }',
        '}',
        ''
    ].join('\n'));

    t.end();
});
