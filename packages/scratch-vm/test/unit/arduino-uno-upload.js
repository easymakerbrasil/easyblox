const tap = require('tap');

const Blocks = require('../../src/engine/blocks');
const Runtime = require('../../src/engine/runtime');

const UploadProgramExtractor = require('../../src/upload/upload-program-extractor');
const ArduinoUnoGenerator = require('../../src/upload/arduino-uno-generator');

const UploadContextValidator =
    require('../../src/upload/upload-context-validator');

const InternalIdentifierAllocator =
    require('../../src/upload/internal-identifier-allocator');

const UploadTypeValidator =
    require('../../src/upload/upload-type-validator');

const ArduinoUnoBoardProfile =
    require('../../src/upload/board-profiles/arduino-uno-board-profile');

const UploadResourceValidator =
    require('../../src/upload/upload-resource-validator');

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

const createNumberShadow = (
    id,
    parent,
    value,
    opcode = 'math_number'
) => ({
    id,
    opcode,
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

const createExtensionMenuShadow = (
    id,
    parent,
    opcode,
    fieldName,
    value
) => ({
    id,
    opcode,
    next: null,
    parent,
    inputs: {},
    fields: {
        [fieldName]: {
            name: fieldName,
            value: String(value)
        }
    },
    topLevel: false,
    shadow: true
});

tap.test('Arduino UNO Upload extracts Scratch text as TextLiteral expression', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'text_literal',
            opcode: 'text',
            next: null,
            parent: null,
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'Olá'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const blocks = runtime.targets[0].blocks;

    t.same(
        extractor._extractExpression(
            blocks,
            'text_literal'
        ),
        {
            type: 'TextLiteral',
            value: 'Olá'
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts real extension menu shadows', t => {
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
                    block: 'pin_menu',
                    shadow: 'pin_menu'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'value_menu',
                    shadow: 'value_menu'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'pin_menu',
            'digital_write',
            'arduinoUno_menu_digitalPins',
            'digitalPins',
            13
        ),
        createExtensionMenuShadow(
            'value_menu',
            'digital_write',
            'arduinoUno_menu_digitalValues',
            'digitalValues',
            1
        )
    ]);

    tap.test('Arduino UNO Upload extracts real math_whole_number REPEAT shadow', t => {
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
            createNumberShadow(
                'repeat_times',
                'repeat',
                10,
                'math_whole_number'
            )
        ]);

        const extractor = new UploadProgramExtractor(runtime);

        t.same(extractor.extract(), {
            setup: [{
                type: 'Repeat',
                times: 10,
                body: []
            }],
            loop: []
        });

        t.end();
    });

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        loop: []
    });

    t.end();
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

tap.test('Arduino UNO Upload treats projects without an entry point as an empty program', t => {
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

    t.same(extractor.extract(), {
        setup: [],
        loop: []
    });

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

tap.test('Arduino UNO BoardProfile defines default motor profiles', t => {
    t.same(
        ArduinoUnoBoardProfile.motors,
        {
            1: {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3
            },
            2: {
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects invalid motor PWM pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 2
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor PWM pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported Serial baud rate', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'SerialBegin',
            baud: 12345
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial baud rate is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported Serial baud rate', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'SerialBegin',
            baud: 9600
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts valid motor PWM pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects invalid motor IN1 pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 1,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor IN1 pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects invalid motor IN2 pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 1,
            pwmPin: 3
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor IN2 pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects equal motor IN1 and IN2 pins', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 2,
            pwmPin: 3
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor pins must be different/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects equal motor IN1 and PWM pins', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 3,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor pins must be different/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects equal motor IN2 and PWM pins', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 3,
            pwmPin: 3
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor pins must be different/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported motor number', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 3,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects duplicate MotorConfigure', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 7,
            in2Pin: 8,
            pwmPin: 5
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor can only be configured once/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts one configuration per motor', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorConfigure',
            motor: 2,
            in1Pin: 7,
            in2Pin: 8,
            pwmPin: 5
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo and Tone on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 6,
            angle: 90
        }, {
            type: 'ToneStart',
            pin: 6,
            frequency: 440
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Tone and Servo on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 440
        }, {
            type: 'ServoWrite',
            pin: 6,
            angle: 90
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo and Tone conflict inside Repeat', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 6,
            angle: 90
        }, {
            type: 'Repeat',
            times: 10,
            body: [{
                type: 'ToneStart',
                pin: 6,
                frequency: 440
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo and Tone conflict inside If', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 6,
            angle: 90
        }, {
            type: 'If',
            condition: {
                type: 'BooleanLiteral',
                value: true
            },
            body: [{
                type: 'ToneStart',
                pin: 6,
                frequency: 440
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo and Tone conflict inside IfElse', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 6,
            angle: 90
        }, {
            type: 'IfElse',
            condition: {
                type: 'BooleanLiteral',
                value: true
            },
            thenBody: [{
                type: 'ToneStart',
                pin: 6,
                frequency: 440
            }],
            elseBody: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo and Tone conflict inside IfElse else branch', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 6,
            angle: 90
        }, {
            type: 'IfElse',
            condition: {
                type: 'BooleanLiteral',
                value: false
            },
            thenBody: [],
            elseBody: [{
                type: 'ToneStart',
                pin: 6,
                frequency: 440
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines PWM pins', t => {
    t.same(
        ArduinoUnoBoardProfile.pwmPins,
        [3, 5, 6, 9, 10, 11]
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines analog pins', t => {
    t.same(
        ArduinoUnoBoardProfile.analogPins,
        [14, 15, 16, 17, 18, 19]
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines Servo pins', t => {
    t.same(
        ArduinoUnoBoardProfile.servoPins,
        [3, 5, 6, 9, 10, 11]
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines Servo angle range', t => {
    t.same(
        ArduinoUnoBoardProfile.servoAngleRange,
        {
            min: 0,
            max: 180
        }
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines Servo PWM conflict pins', t => {
    t.same(
        ArduinoUnoBoardProfile.servoPwmConflictPins,
        [9, 10]
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo with PWM on Timer1 conflict pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }, {
            type: 'PwmWrite',
            pin: 9,
            value: 128
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo cannot be used with PWM on the selected pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo with PWM on second Timer1 conflict pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }, {
            type: 'PwmWrite',
            pin: 10,
            value: 128
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo cannot be used with PWM on the selected pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts Servo with PWM outside Timer1 conflict pins', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }, {
            type: 'PwmWrite',
            pin: 6,
            value: 128
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported PWM pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'PwmWrite',
            pin: 2,
            value: 128
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /PWM pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported PWM pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'PwmWrite',
            pin: 6,
            value: 128
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines Tone pins', t => {
    t.same(
        ArduinoUnoBoardProfile.tonePins,
        [3, 5, 6, 9, 10, 11]
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines Tone frequency range', t => {
    t.same(
        ArduinoUnoBoardProfile.toneFrequencyRange,
        {
            min: 1,
            max: 65535
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Tone frequency below range', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 0
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Tone frequency is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Tone frequency above range', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 65536
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Tone frequency is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts Tone minimum frequency', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 1
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts Tone maximum frequency', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 65535
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported ToneStop pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStop',
            pin: 2
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Tone pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported ToneStop pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStop',
            pin: 6
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Motor and PWM on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }, {
            type: 'PwmWrite',
            pin: 3,
            value: 128
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor and PWM cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo and PWM on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }, {
            type: 'PwmWrite',
            pin: 5,
            value: 128
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo and PWM cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Relay and PWM on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'RelayWrite',
            pin: 6,
            state: true
        }, {
            type: 'PwmWrite',
            pin: 6,
            value: 128
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Relay and PWM cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported DigitalWrite pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'DigitalWrite',
            pin: 1,
            value: true
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /DigitalWrite pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported DigitalWrite pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'DigitalWrite',
            pin: 13,
            value: true
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported DigitalRead pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'If',
            condition: {
                type: 'DigitalReadExpression',
                pin: 1
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /DigitalRead pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported DigitalRead pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'If',
            condition: {
                type: 'DigitalReadExpression',
                pin: 2
            },
            body: []
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported AnalogRead pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'If',
            condition: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'AnalogReadExpression',
                    pin: 13
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 500
                }
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /AnalogRead pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported AnalogRead pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'If',
            condition: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'AnalogReadExpression',
                    pin: 14
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 500
                }
            },
            body: []
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects DigitalWrite and Servo on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'DigitalWrite',
            pin: 5,
            value: true
        }, {
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /DigitalWrite and Servo cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects DigitalRead and Servo on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }, {
            type: 'If',
            condition: {
                type: 'DigitalReadExpression',
                pin: 5
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /DigitalRead and Servo cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported Tone pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 2,
            frequency: 440
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Tone pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported Tone pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 440
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported Servo pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 2,
            angle: 90
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported Servo pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo angle above range', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 181
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo angle is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo angle below range', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: -1
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Servo angle is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts Servo minimum angle', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 0
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts Servo maximum angle', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 180
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported Relay pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'RelayWrite',
            pin: 1,
            state: true
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Relay pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts supported Relay pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'RelayWrite',
            pin: 12,
            state: true
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Relay and Servo on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }, {
            type: 'RelayWrite',
            pin: 5,
            state: true
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Relay and Servo cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Servo and Relay on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'RelayWrite',
            pin: 5,
            state: true
        }, {
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Relay and Servo cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Relay and Tone on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 440
        }, {
            type: 'RelayWrite',
            pin: 6,
            state: true
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Relay and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Tone and Relay on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'RelayWrite',
            pin: 6,
            state: true
        }, {
            type: 'ToneStart',
            pin: 6,
            frequency: 440
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Relay and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Motor and Servo on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 5
        }, {
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor and Servo cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects default Motor and Servo on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }, {
            type: 'ServoWrite',
            pin: 3,
            angle: 90
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor and Servo cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects default MotorStop and Servo on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorStop',
            motor: 1
        }, {
            type: 'ServoWrite',
            pin: 3,
            angle: 90
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor and Servo cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Motor and Tone on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }, {
            type: 'ToneStart',
            pin: 3,
            frequency: 440
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor and Tone cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects Motor and Relay on the same pin', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }, {
            type: 'RelayWrite',
            pin: 3,
            state: true
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor and Relay cannot use the same pin/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects overlapping motor configurations', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorConfigure',
            motor: 2,
            in1Pin: 2,
            in2Pin: 8,
            pwmPin: 5
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motors cannot share pins/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects overlap between configured and default motors', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 7,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorWrite',
            motor: 2,
            direction: 0,
            speedPercent: 75
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motors cannot share pins/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported MotorWrite motor', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorWrite',
            motor: 3,
            direction: 0,
            speedPercent: 75
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported MotorStop motor', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorStop',
            motor: 3
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator accepts both default motors', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }, {
            type: 'MotorWrite',
            motor: 2,
            direction: 1,
            speedPercent: 50
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO BoardProfile defines digital-capable pins', t => {
    t.same(
        ArduinoUnoBoardProfile.digitalPins,
        [
            2, 3, 4, 5, 6, 7, 8, 9,
            10, 11, 12, 13,
            14, 15, 16, 17, 18, 19
        ]
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects MotorConfigure inside REPEAT', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: 1,
            body: [{
                type: 'MotorConfigure',
                motor: 1,
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor configuration must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator accepts MotorConfigure directly in setup', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects MotorConfigure in loop', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [],
        loop: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }]
    };

    t.throws(
        () => validator.validate(ir),
        /Motor configuration must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects MotorConfigure inside IF', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'If',
            condition: {
                type: 'BooleanLiteral',
                value: true
            },
            body: [{
                type: 'MotorConfigure',
                motor: 1,
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor configuration must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects MotorConfigure inside IF ELSE', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'IfElse',
            condition: {
                type: 'BooleanLiteral',
                value: true
            },
            thenBody: [{
                type: 'MotorConfigure',
                motor: 1,
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3
            }],
            elseBody: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Motor configuration must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects SerialBegin inside REPEAT', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: 1,
            body: [{
                type: 'SerialBegin',
                baud: 9600
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial initialization must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects SerialBegin in loop', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [],
        loop: [{
            type: 'SerialBegin',
            baud: 9600
        }]
    };

    t.throws(
        () => validator.validate(ir),
        /Serial initialization must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator accepts SerialBegin directly in setup', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'SerialBegin',
            baud: 9600
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects SerialBegin inside IF', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'If',
            condition: {
                type: 'BooleanLiteral',
                value: true
            },
            body: [{
                type: 'SerialBegin',
                baud: 9600
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial initialization must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects SerialBegin inside IF ELSE', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'IfElse',
            condition: {
                type: 'BooleanLiteral',
                value: true
            },
            thenBody: [{
                type: 'SerialBegin',
                baud: 9600
            }],
            elseBody: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial initialization must be declared directly in Arduino UNO setup/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects duplicate SerialBegin', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [
            {
                type: 'SerialBegin',
                baud: 9600
            },
            {
                type: 'SerialBegin',
                baud: 9600
            }
        ],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial can only be initialized once/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects SerialWrite without SerialBegin', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'SerialWrite',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial must be initialized before use/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator rejects SerialWriteLine without SerialBegin', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial must be initialized before use/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator accepts SerialWrite after SerialBegin', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [
            {
                type: 'SerialBegin',
                baud: 9600
            },
            {
                type: 'SerialWrite',
                value: {
                    type: 'TextLiteral',
                    value: 'Olá'
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
});

tap.test('Arduino UNO Upload context validator rejects SerialWrite before SerialBegin', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [
            {
                type: 'SerialWrite',
                value: {
                    type: 'TextLiteral',
                    value: 'Olá'
                }
            },
            {
                type: 'SerialBegin',
                baud: 9600
            }
        ],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial must be initialized before use/
    );

    t.end();
});

tap.test('Arduino UNO Upload context validator accepts SerialWrite in loop after setup initialization', t => {
    const validator = new UploadContextValidator();

    const ir = {
        setup: [{
            type: 'SerialBegin',
            baud: 9600
        }],
        loop: [{
            type: 'SerialWrite',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }]
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts MotorConfigure into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('motor_configure'),
        {
            id: 'motor_configure',
            opcode: 'actuators_motorConfigure',
            next: null,
            parent: 'upload_hat',
            inputs: {
                MOTOR: {
                    name: 'MOTOR',
                    block: 'motor_number',
                    shadow: 'motor_number'
                },
                IN1: {
                    name: 'IN1',
                    block: 'motor_in1',
                    shadow: 'motor_in1'
                },
                IN2: {
                    name: 'IN2',
                    block: 'motor_in2',
                    shadow: 'motor_in2'
                },
                PWM: {
                    name: 'PWM',
                    block: 'motor_pwm',
                    shadow: 'motor_pwm'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'motor_number',
            'motor_configure',
            'actuators_menu_motorNumbers',
            'motorNumbers',
            1
        ),
        createExtensionMenuShadow(
            'motor_in1',
            'motor_configure',
            'actuators_menu_motorDigitalPins',
            'motorDigitalPins',
            2
        ),
        createExtensionMenuShadow(
            'motor_in2',
            'motor_configure',
            'actuators_menu_motorDigitalPins',
            'motorDigitalPins',
            4
        ),
        createExtensionMenuShadow(
            'motor_pwm',
            'motor_configure',
            'actuators_menu_motorPwmPins',
            'motorPwmPins',
            3
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts SerialBegin into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('serial_begin'),
        {
            id: 'serial_begin',
            opcode: 'serial_serialBegin',
            next: null,
            parent: 'upload_hat',
            inputs: {
                BAUD: {
                    name: 'BAUD',
                    block: 'serial_baud',
                    shadow: 'serial_baud'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'serial_baud',
            'serial_begin',
            'serial_menu_baudRates',
            'baudRates',
            9600
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'SerialBegin',
            baud: 9600
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts SerialWrite into semantic IR', t => {
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
                    block: 'serial_text',
                    shadow: 'serial_text'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_text',
            opcode: 'text',
            next: null,
            parent: 'serial_write',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'Olá'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'SerialWrite',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts SerialWriteLine into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('serial_write_line'),
        {
            id: 'serial_write_line',
            opcode: 'serial_serialWriteLine',
            next: null,
            parent: 'upload_hat',
            inputs: {
                TEXT: {
                    name: 'TEXT',
                    block: 'serial_line_text',
                    shadow: 'serial_line_text'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_line_text',
            opcode: 'text',
            next: null,
            parent: 'serial_write_line',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'Olá'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts MotorConfigure statement', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts SerialBegin statement', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'SerialBegin',
            baud: 9600
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts SerialWrite with TEXT', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'SerialWrite',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts SerialWriteLine with TEXT', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects SerialWriteLine without TEXT', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'IntegerLiteral',
                value: 42
            }
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial write value must be Texto/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects SerialWrite without TEXT', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'SerialWrite',
            value: {
                type: 'IntegerLiteral',
                value: 42
            }
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Serial write value must be Texto/
    );

    t.end();
});

tap.test('Arduino UNO Upload generates declarative MotorConfigure C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }],
        loop: []
    });

    t.equal(code, [
        'const int MOTOR1_IN1 = 2;',
        'const int MOTOR1_IN2 = 4;',
        'const int MOTOR1_PWM = 3;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates SerialBegin C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialBegin',
            baud: 9600
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    Serial.begin(9600);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates SerialWrite C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWrite',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    Serial.print("Olá");',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates SerialWriteLine C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'TextLiteral',
                value: 'Olá'
            }
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    Serial.println("Olá");',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates MotorConfigure from Scratch blocks end to end', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('motor_configure'),
        {
            id: 'motor_configure',
            opcode: 'actuators_motorConfigure',
            next: null,
            parent: 'upload_hat',
            inputs: {
                MOTOR: {
                    name: 'MOTOR',
                    block: 'motor_number',
                    shadow: 'motor_number'
                },
                IN1: {
                    name: 'IN1',
                    block: 'motor_in1',
                    shadow: 'motor_in1'
                },
                IN2: {
                    name: 'IN2',
                    block: 'motor_in2',
                    shadow: 'motor_in2'
                },
                PWM: {
                    name: 'PWM',
                    block: 'motor_pwm',
                    shadow: 'motor_pwm'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'motor_number',
            'motor_configure',
            'actuators_menu_motorNumbers',
            'motorNumbers',
            1
        ),
        createExtensionMenuShadow(
            'motor_in1',
            'motor_configure',
            'actuators_menu_motorDigitalPins',
            'motorDigitalPins',
            2
        ),
        createExtensionMenuShadow(
            'motor_in2',
            'motor_configure',
            'actuators_menu_motorDigitalPins',
            'motorDigitalPins',
            4
        ),
        createExtensionMenuShadow(
            'motor_pwm',
            'motor_configure',
            'actuators_menu_motorPwmPins',
            'motorPwmPins',
            3
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const contextValidator = new UploadContextValidator();
    const typeValidator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    contextValidator.validate(ir);
    typeValidator.validate(ir);

    t.equal(generator.generate(ir), [
        'const int MOTOR1_IN1 = 2;',
        'const int MOTOR1_IN2 = 4;',
        'const int MOTOR1_PWM = 3;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates SerialWrite from Scratch blocks end to end', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('serial_begin'),
        {
            id: 'serial_begin',
            opcode: 'serial_serialBegin',
            next: 'serial_write',
            parent: 'upload_hat',
            inputs: {
                BAUD: {
                    name: 'BAUD',
                    block: 'serial_baud',
                    shadow: 'serial_baud'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'serial_baud',
            'serial_begin',
            'serial_menu_baudRates',
            'baudRates',
            9600
        ),
        {
            id: 'serial_write',
            opcode: 'serial_serialWrite',
            next: null,
            parent: 'serial_begin',
            inputs: {
                TEXT: {
                    name: 'TEXT',
                    block: 'serial_text',
                    shadow: 'serial_text'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_text',
            opcode: 'text',
            next: null,
            parent: 'serial_write',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'Olá'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const contextValidator = new UploadContextValidator();
    const typeValidator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    contextValidator.validate(ir);
    typeValidator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    Serial.begin(9600);',
        '    Serial.print("Olá");',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates SerialWriteLine from Scratch blocks end to end', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('serial_begin'),
        {
            id: 'serial_begin',
            opcode: 'serial_serialBegin',
            next: 'serial_write_line',
            parent: 'upload_hat',
            inputs: {
                BAUD: {
                    name: 'BAUD',
                    block: 'serial_baud',
                    shadow: 'serial_baud'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'serial_baud',
            'serial_begin',
            'serial_menu_baudRates',
            'baudRates',
            9600
        ),
        {
            id: 'serial_write_line',
            opcode: 'serial_serialWriteLine',
            next: null,
            parent: 'serial_begin',
            inputs: {
                TEXT: {
                    name: 'TEXT',
                    block: 'serial_line_text',
                    shadow: 'serial_line_text'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_line_text',
            opcode: 'text',
            next: null,
            parent: 'serial_write_line',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'Olá'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const contextValidator = new UploadContextValidator();
    const typeValidator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    contextValidator.validate(ir);
    typeValidator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    Serial.begin(9600);',
        '    Serial.println("Olá");',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates operator_join from Scratch blocks end to end', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('serial_begin'),
        {
            id: 'serial_begin',
            opcode: 'serial_serialBegin',
            next: 'serial_write_line',
            parent: 'upload_hat',
            inputs: {
                BAUD: {
                    name: 'BAUD',
                    block: 'serial_baud',
                    shadow: 'serial_baud'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'serial_baud',
            'serial_begin',
            'serial_menu_baudRates',
            'baudRates',
            9600
        ),
        {
            id: 'serial_write_line',
            opcode: 'serial_serialWriteLine',
            next: null,
            parent: 'serial_begin',
            inputs: {
                TEXT: {
                    name: 'TEXT',
                    block: 'join',
                    shadow: 'serial_line_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_line_shadow',
            opcode: 'text',
            next: null,
            parent: 'serial_write_line',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: ''
                }
            },
            topLevel: false,
            shadow: true
        },
        {
            id: 'join',
            opcode: 'operator_join',
            next: null,
            parent: 'serial_write_line',
            inputs: {
                STRING1: {
                    name: 'STRING1',
                    block: 'join_left',
                    shadow: 'join_left'
                },
                STRING2: {
                    name: 'STRING2',
                    block: 'join_right',
                    shadow: 'join_right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'join_left',
            opcode: 'text',
            next: null,
            parent: 'join',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'A temperatura é: '
                }
            },
            topLevel: false,
            shadow: true
        },
        createNumberShadow(
            'join_right',
            'join',
            27
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const contextValidator = new UploadContextValidator();
    const typeValidator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    contextValidator.validate(ir);
    typeValidator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    Serial.begin(9600);',
        '    Serial.println((String("A temperatura é: ") + String(27)));',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload extracts MotorWrite into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('motor_write'),
        {
            id: 'motor_write',
            opcode: 'actuators_motorWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                MOTOR: {
                    name: 'MOTOR',
                    block: 'motor_number',
                    shadow: 'motor_number'
                },
                DIRECTION: {
                    name: 'DIRECTION',
                    block: 'motor_direction',
                    shadow: 'motor_direction'
                },
                SPEED: {
                    name: 'SPEED',
                    block: 'motor_speed',
                    shadow: 'motor_speed'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'motor_number',
            'motor_write',
            'actuators_menu_motorNumbers',
            'motorNumbers',
            1
        ),
        createExtensionMenuShadow(
            'motor_direction',
            'motor_write',
            'actuators_menu_motorDirections',
            'motorDirections',
            0
        ),
        {
            id: 'motor_speed',
            opcode: 'easyblox_motor_speed',
            next: null,
            parent: 'motor_write',
            inputs: {},
            fields: {
                NUM: {
                    name: 'NUM',
                    value: 75
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts MotorWrite statement', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload generates MotorWrite forward C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 75
        }],
        loop: []
    });

    t.equal(code, [
        'const int MOTOR1_IN1 = 2;',
        'const int MOTOR1_IN2 = 4;',
        'const int MOTOR1_PWM = 3;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '    analogWrite(MOTOR1_PWM, 0);',
        '    digitalWrite(MOTOR1_IN1, HIGH);',
        '    digitalWrite(MOTOR1_IN2, LOW);',
        '    analogWrite(MOTOR1_PWM, 191);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload uses default motor profile without MotorConfigure', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 100
        }],
        loop: []
    });

    t.equal(code, [
        'const int MOTOR1_IN1 = 2;',
        'const int MOTOR1_IN2 = 4;',
        'const int MOTOR1_PWM = 3;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '    analogWrite(MOTOR1_PWM, 0);',
        '    digitalWrite(MOTOR1_IN1, HIGH);',
        '    digitalWrite(MOTOR1_IN2, LOW);',
        '    analogWrite(MOTOR1_PWM, 255);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload overrides default motor profile with MotorConfigure', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 7,
            in2Pin: 8,
            pwmPin: 6
        }, {
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 100
        }],
        loop: []
    });

    t.equal(code, [
        'const int MOTOR1_IN1 = 7;',
        'const int MOTOR1_IN2 = 8;',
        'const int MOTOR1_PWM = 6;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '    analogWrite(MOTOR1_PWM, 0);',
        '    digitalWrite(MOTOR1_IN1, HIGH);',
        '    digitalWrite(MOTOR1_IN2, LOW);',
        '    analogWrite(MOTOR1_PWM, 255);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates MotorWrite reverse C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorWrite',
            motor: 1,
            direction: 1,
            speedPercent: 50
        }],
        loop: []
    });

    t.equal(code, [
        'const int MOTOR1_IN1 = 2;',
        'const int MOTOR1_IN2 = 4;',
        'const int MOTOR1_PWM = 3;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '    analogWrite(MOTOR1_PWM, 0);',
        '    digitalWrite(MOTOR1_IN1, LOW);',
        '    digitalWrite(MOTOR1_IN2, HIGH);',
        '    analogWrite(MOTOR1_PWM, 128);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates stopped MotorWrite when speed is zero', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorWrite',
            motor: 1,
            direction: 0,
            speedPercent: 0
        }],
        loop: []
    });

    t.equal(code, [
        'const int MOTOR1_IN1 = 2;',
        'const int MOTOR1_IN2 = 4;',
        'const int MOTOR1_PWM = 3;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '    analogWrite(MOTOR1_PWM, 0);',
        '    digitalWrite(MOTOR1_IN1, LOW);',
        '    digitalWrite(MOTOR1_IN2, LOW);',
        '    analogWrite(MOTOR1_PWM, 0);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload extracts MotorStop into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('motor_stop'),
        {
            id: 'motor_stop',
            opcode: 'actuators_motorStop',
            next: null,
            parent: 'upload_hat',
            inputs: {
                MOTOR: {
                    name: 'MOTOR',
                    block: 'motor_number',
                    shadow: 'motor_number'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'motor_number',
            'motor_stop',
            'actuators_menu_motorNumbers',
            'motorNumbers',
            1
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'MotorStop',
            motor: 1
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts MotorStop statement', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'MotorStop',
            motor: 1
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload generates MotorStop coast C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'MotorConfigure',
            motor: 1,
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }, {
            type: 'MotorStop',
            motor: 1
        }],
        loop: []
    });

    t.equal(code, [
        'const int MOTOR1_IN1 = 2;',
        'const int MOTOR1_IN2 = 4;',
        'const int MOTOR1_PWM = 3;',
        '',
        'void setup() {',
        '    pinMode(MOTOR1_IN1, OUTPUT);',
        '    pinMode(MOTOR1_IN2, OUTPUT);',
        '    pinMode(MOTOR1_PWM, OUTPUT);',
        '    analogWrite(MOTOR1_PWM, 0);',
        '    digitalWrite(MOTOR1_IN1, LOW);',
        '    digitalWrite(MOTOR1_IN2, LOW);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload extracts ServoWrite into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('servo_write'),
        {
            id: 'servo_write',
            opcode: 'actuators_servoWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'servo_pin',
                    shadow: 'servo_pin'
                },
                ANGLE: {
                    name: 'ANGLE',
                    block: 'servo_angle',
                    shadow: 'servo_angle'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'servo_pin',
            'servo_write',
            'actuators_menu_servoPins',
            'servoPins',
            5
        ),
        {
            id: 'servo_angle',
            opcode: 'easyblox_servo_angle',
            next: null,
            parent: 'servo_write',
            inputs: {},
            fields: {
                NUM: {
                    name: 'NUM',
                    value: 90
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts ServoWrite statement', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload generates ServoWrite C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }],
        loop: []
    });

    t.equal(code, [
        '#include <Servo.h>',
        '',
        'Servo servo5;',
        '',
        'void setup() {',
        '    if (!servo5.attached()) {',
        '        servo5.attach(5);',
        '    }',
        '    servo5.write(90);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload extracts RelayWrite into semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('relay_write'),
        {
            id: 'relay_write',
            opcode: 'actuators_relayWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'relay_pin',
                    shadow: 'relay_pin'
                },
                STATE: {
                    name: 'STATE',
                    block: 'relay_state',
                    shadow: 'relay_state'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'relay_pin',
            'relay_write',
            'actuators_menu_relayPins',
            'relayPins',
            12
        ),
        createExtensionMenuShadow(
            'relay_state',
            'relay_write',
            'actuators_menu_relayStates',
            'relayStates',
            1
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'RelayWrite',
            pin: 12,
            state: true
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts RelayWrite statement', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'RelayWrite',
            pin: 12,
            state: true
        }],
        loop: []
    };

    t.equal(
        validator.validate(ir),
        ir
    );

    t.end();
});

tap.test('Arduino UNO Upload generates RelayWrite C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'RelayWrite',
            pin: 12,
            state: true
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    pinMode(12, OUTPUT);',
        '    digitalWrite(12, HIGH);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates RelayWrite LOW state C++', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'RelayWrite',
            pin: 12,
            state: false
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    pinMode(12, OUTPUT);',
        '    digitalWrite(12, LOW);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload deduplicates Servo instance on the same pin', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'ServoWrite',
            pin: 5,
            angle: 90
        }, {
            type: 'ServoWrite',
            pin: 5,
            angle: 45
        }],
        loop: []
    });

    t.equal(code, [
        '#include <Servo.h>',
        '',
        'Servo servo5;',
        '',
        'void setup() {',
        '    if (!servo5.attached()) {',
        '        servo5.attach(5);',
        '    }',
        '    servo5.write(90);',
        '    if (!servo5.attached()) {',
        '        servo5.attach(5);',
        '    }',
        '    servo5.write(45);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

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
        '    for (int i = 0; i < 3; ++i) {',
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
        '    for (int i = 0; i < 2; ++i) {',
        '        for (int j = 0; j < 3; ++j) {',
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
        '    for (int i = 0; i < 2; ++i) {',
        '        digitalWrite(13, HIGH);',
        '    }',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts INTEGER addition as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Add',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    };

    t.doesNotThrow(() => validator.validate(ir));

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects DECIMAL expression as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Add',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 2.5
                }
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Repeat count must be Número inteiro/
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_add as typed expression IR', t => {
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
                    block: 'add',
                    shadow: 'repeat_times_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'add',
            opcode: 'operator_add',
            next: null,
            parent: 'repeat',
            inputs: {
                NUM1: {
                    name: 'NUM1',
                    block: 'left',
                    shadow: 'left'
                },
                NUM2: {
                    name: 'NUM2',
                    block: 'right',
                    shadow: 'right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left', 'add', 1),
        createNumberShadow('right', 'add', 2),
        createNumberShadow(
            'repeat_times_shadow',
            'repeat',
            10
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Add',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_join as typed text expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'join',
            opcode: 'operator_join',
            next: null,
            parent: null,
            inputs: {
                STRING1: {
                    name: 'STRING1',
                    block: 'left_text',
                    shadow: 'left_text'
                },
                STRING2: {
                    name: 'STRING2',
                    block: 'right_number',
                    shadow: 'right_number'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'left_text',
            opcode: 'text',
            next: null,
            parent: 'join',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'A temperatura é: '
                }
            },
            topLevel: false,
            shadow: true
        },
        createNumberShadow(
            'right_number',
            'join',
            27
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const blocks = runtime.targets[0].blocks;

    t.same(
        extractor._extractExpression(
            blocks,
            'join'
        ),
        {
            type: 'BinaryExpression',
            operator: 'Join',
            left: {
                type: 'TextLiteral',
                value: 'A temperatura é: '
            },
            right: {
                type: 'IntegerLiteral',
                value: 27
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_length as unary text expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'length',
            opcode: 'operator_length',
            next: null,
            parent: null,
            inputs: {
                STRING: {
                    name: 'STRING',
                    block: 'text_value',
                    shadow: 'text_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'text_value',
            opcode: 'text',
            next: null,
            parent: 'length',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'EasyBlox'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const blocks = runtime.targets[0].blocks;

    t.same(
        extractor._extractExpression(
            blocks,
            'length'
        ),
        {
            type: 'UnaryExpression',
            operator: 'Length',
            operand: {
                type: 'TextLiteral',
                value: 'EasyBlox'
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_letter_of as indexed text expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'letter_of',
            opcode: 'operator_letter_of',
            next: null,
            parent: null,
            inputs: {
                LETTER: {
                    name: 'LETTER',
                    block: 'letter_index',
                    shadow: 'letter_index'
                },
                STRING: {
                    name: 'STRING',
                    block: 'text_value',
                    shadow: 'text_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'letter_index',
            'letter_of',
            2
        ),
        {
            id: 'text_value',
            opcode: 'text',
            next: null,
            parent: 'letter_of',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'EasyBlox'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const blocks = runtime.targets[0].blocks;

    t.same(
        extractor._extractExpression(
            blocks,
            'letter_of'
        ),
        {
            type: 'BinaryExpression',
            operator: 'LetterOf',
            left: {
                type: 'IntegerLiteral',
                value: 2
            },
            right: {
                type: 'TextLiteral',
                value: 'EasyBlox'
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload generates operator_letter_of from Scratch blocks end to end', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('serial_begin'),
        {
            id: 'serial_begin',
            opcode: 'serial_serialBegin',
            next: 'serial_write_line',
            parent: 'upload_hat',
            inputs: {
                BAUD: {
                    name: 'BAUD',
                    block: 'serial_baud',
                    shadow: 'serial_baud'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'serial_baud',
            'serial_begin',
            'serial_menu_baudRates',
            'baudRates',
            9600
        ),
        {
            id: 'serial_write_line',
            opcode: 'serial_serialWriteLine',
            next: null,
            parent: 'serial_begin',
            inputs: {
                TEXT: {
                    name: 'TEXT',
                    block: 'letter_of',
                    shadow: 'serial_line_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_line_shadow',
            opcode: 'text',
            next: null,
            parent: 'serial_write_line',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: ''
                }
            },
            topLevel: false,
            shadow: true
        },
        {
            id: 'letter_of',
            opcode: 'operator_letter_of',
            next: null,
            parent: 'serial_write_line',
            inputs: {
                LETTER: {
                    name: 'LETTER',
                    block: 'letter_index',
                    shadow: 'letter_index'
                },
                STRING: {
                    name: 'STRING',
                    block: 'text_value',
                    shadow: 'text_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'letter_index',
            'letter_of',
            2
        ),
        {
            id: 'text_value',
            opcode: 'text',
            next: null,
            parent: 'letter_of',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'EasyBlox'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const contextValidator = new UploadContextValidator();
    const typeValidator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    contextValidator.validate(ir);
    typeValidator.validate(ir);

    const code = generator.generate(ir);

    t.match(
        code,
        /Serial\.println\(unicodeLetterOf\(String\("EasyBlox"\), 2\)\);/
    );

    t.end();
});

tap.test('Arduino UNO Upload generates operator_length from Scratch blocks end to end', t => {
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
                    block: 'length',
                    shadow: 'repeat_times_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'length',
            opcode: 'operator_length',
            next: null,
            parent: 'repeat',
            inputs: {
                STRING: {
                    name: 'STRING',
                    block: 'text_value',
                    shadow: 'text_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'text_value',
            opcode: 'text',
            next: null,
            parent: 'length',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'Olá'
                }
            },
            topLevel: false,
            shadow: true
        },
        createNumberShadow(
            'repeat_times_shadow',
            'repeat',
            10
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const contextValidator = new UploadContextValidator();
    const typeValidator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    contextValidator.validate(ir);
    typeValidator.validate(ir);

    t.equal(generator.generate(ir), [
        'size_t unicodeStringLength(const String &value) {',
        '    size_t length = 0;',
        '    size_t index = 0;',
        '',
        '    while (index < value.length()) {',
        '        const unsigned char current = static_cast<unsigned char>(value[index]);',
        '',
        '        if ((current & 0xF8) == 0xF0) {',
        '            ++length;',
        '            index += 4;',
        '        } else if ((current & 0xF0) == 0xE0) {',
        '            ++length;',
        '            index += 3;',
        '        } else if ((current & 0xE0) == 0xC0) {',
        '            ++length;',
        '            index += 2;',
        '        } else {',
        '            ++length;',
        '            ++index;',
        '        }',
        '    }',
        '',
        '    return length;',
        '}',
        '',
        'void setup() {',
        '    for (int i = 0; i < unicodeStringLength(String("Olá")); ++i) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload accepts extracted INTEGER addition as REPEAT count', t => {
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
                    block: 'add',
                    shadow: 'repeat_times_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'add',
            opcode: 'operator_add',
            next: null,
            parent: 'repeat',
            inputs: {
                NUM1: {
                    name: 'NUM1',
                    block: 'left',
                    shadow: 'left'
                },
                NUM2: {
                    name: 'NUM2',
                    block: 'right',
                    shadow: 'right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left', 'add', 1),
        createNumberShadow('right', 'add', 2),
        createNumberShadow(
            'repeat_times_shadow',
            'repeat',
            10
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();

    const ir = extractor.extract();

    t.doesNotThrow(() => validator.validate(ir));

    t.end();
});

tap.test('Arduino UNO Upload rejects extracted DECIMAL addition as REPEAT count', t => {
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
                    block: 'add',
                    shadow: 'repeat_times_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'add',
            opcode: 'operator_add',
            next: null,
            parent: 'repeat',
            inputs: {
                NUM1: {
                    name: 'NUM1',
                    block: 'left',
                    shadow: 'left'
                },
                NUM2: {
                    name: 'NUM2',
                    block: 'right',
                    shadow: 'right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left', 'add', 1),
        createNumberShadow('right', 'add', 2.5),
        createNumberShadow(
            'repeat_times_shadow',
            'repeat',
            10
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();

    const ir = extractor.extract();

    t.throws(
        () => validator.validate(ir),
        /Repeat count must be Número inteiro/
    );

    t.end();
});

tap.test('Arduino UNO generator emits INTEGER addition expression in REPEAT count', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Add',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
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
        '    for (int i = 0; i < (1 + 2); ++i) {',
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

tap.test('Arduino UNO Upload generates REPEAT from extracted INTEGER addition end to end', t => {
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
                    block: 'add',
                    shadow: 'repeat_times_shadow'
                },
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'add',
            opcode: 'operator_add',
            next: null,
            parent: 'repeat',
            inputs: {
                NUM1: {
                    name: 'NUM1',
                    block: 'left',
                    shadow: 'left'
                },
                NUM2: {
                    name: 'NUM2',
                    block: 'right',
                    shadow: 'right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left', 'add', 1),
        createNumberShadow('right', 'add', 2),
        createNumberShadow(
            'repeat_times_shadow',
            'repeat',
            10
        ),
        {
            id: 'write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'repeat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pin',
                    shadow: 'pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'value',
                    shadow: 'value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('pin', 'write', 13),
        createNumberShadow('value', 'write', 1)
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '    for (int i = 0; i < (1 + 2); ++i) {',
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

tap.test('Arduino UNO Upload extracts operator_subtract as expression IR', t => {
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
                    block: 'subtract',
                    shadow: 'repeat_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'subtract',
            opcode: 'operator_subtract',
            next: null,
            parent: 'repeat',
            inputs: {
                NUM1: {
                    name: 'NUM1',
                    block: 'left',
                    shadow: 'left'
                },
                NUM2: {
                    name: 'NUM2',
                    block: 'right',
                    shadow: 'right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left', 'subtract', 5),
        createNumberShadow('right', 'subtract', 2),
        createNumberShadow('repeat_shadow', 'repeat', 10)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Subtract',
                left: {
                    type: 'IntegerLiteral',
                    value: 5
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_multiply as expression IR', t => {
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
                    block: 'multiply',
                    shadow: 'repeat_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'multiply',
            opcode: 'operator_multiply',
            next: null,
            parent: 'repeat',
            inputs: {
                NUM1: {
                    name: 'NUM1',
                    block: 'left',
                    shadow: 'left'
                },
                NUM2: {
                    name: 'NUM2',
                    block: 'right',
                    shadow: 'right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left', 'multiply', 2),
        createNumberShadow('right', 'multiply', 3),
        createNumberShadow('repeat_shadow', 'repeat', 10)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Multiply',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 3
                }
            },
            body: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts INTEGER subtraction as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Subtract',
                left: {
                    type: 'IntegerLiteral',
                    value: 5
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    };

    t.doesNotThrow(() => validator.validate(ir));

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects DECIMAL subtraction as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Subtract',
                left: {
                    type: 'DecimalLiteral',
                    value: 5.5
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Repeat count must be Número inteiro/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts INTEGER multiplication as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Multiply',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 3
                }
            },
            body: []
        }],
        loop: []
    };

    t.doesNotThrow(() => validator.validate(ir));

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects DECIMAL multiplication as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Multiply',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 3.5
                }
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Repeat count must be Número inteiro/
    );

    t.end();
});

tap.test('Arduino UNO generator emits subtraction expression', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Subtract',
                left: {
                    type: 'IntegerLiteral',
                    value: 5
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    });

    t.match(
        code,
        /i < \(5 - 2\)/
    );

    t.end();
});

tap.test('Arduino UNO generator emits multiplication expression', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Multiply',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 3
                }
            },
            body: []
        }],
        loop: []
    });

    t.match(
        code,
        /i < \(2 \* 3\)/
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_divide as expression IR', t => {
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
                    block: 'divide',
                    shadow: 'repeat_shadow'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'divide',
            opcode: 'operator_divide',
            next: null,
            parent: 'repeat',
            inputs: {
                NUM1: {
                    name: 'NUM1',
                    block: 'left',
                    shadow: 'left'
                },
                NUM2: {
                    name: 'NUM2',
                    block: 'right',
                    shadow: 'right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left', 'divide', 5),
        createNumberShadow('right', 'divide', 2),
        createNumberShadow('repeat_shadow', 'repeat', 10)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Divide',
                left: {
                    type: 'IntegerLiteral',
                    value: 5
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects INTEGER division as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Divide',
                left: {
                    type: 'IntegerLiteral',
                    value: 6
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 3
                }
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Repeat count must be Número inteiro/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects mixed division as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Divide',
                left: {
                    type: 'IntegerLiteral',
                    value: 5
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 2.5
                }
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Repeat count must be Número inteiro/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects DECIMAL division as REPEAT count', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Repeat',
            times: {
                type: 'BinaryExpression',
                operator: 'Divide',
                left: {
                    type: 'DecimalLiteral',
                    value: 5.5
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 2.5
                }
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Repeat count must be Número inteiro/
    );

    t.end();
});

tap.test('Arduino UNO generator emits TextLiteral as C++ string literal', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'TextLiteral',
            value: 'Olá'
        }),
        '"Olá"'
    );

    t.end();
});

tap.test('Arduino UNO generator escapes TextLiteral for C++ safely', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'TextLiteral',
            value: 'Ele disse "Olá"\\Arduino\nLinha 2'
        }),
        '"Ele disse \\"Olá\\"\\\\Arduino\\nLinha 2"'
    );

    t.end();
});

tap.test('Arduino UNO generator emits LetterOf using Unicode-aware helper', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'LetterOf',
            left: {
                type: 'IntegerLiteral',
                value: 2
            },
            right: {
                type: 'TextLiteral',
                value: 'EasyBlox'
            }
        }),
        'unicodeLetterOf(String("EasyBlox"), 2)'
    );

    t.end();
});

tap.test('Arduino UNO generator emits Join as Arduino String concatenation', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Join',
            left: {
                type: 'TextLiteral',
                value: 'A temperatura é: '
            },
            right: {
                type: 'IntegerLiteral',
                value: 27
            }
        }),
        '(String("A temperatura é: ") + String(27))'
    );

    t.end();
});

tap.test('Arduino UNO generator emits Join Boolean as true or false text', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Join',
            left: {
                type: 'TextLiteral',
                value: 'Sensor ativo: '
            },
            right: {
                type: 'BooleanLiteral',
                value: true
            }
        }),
        '(String("Sensor ativo: ") + String(true ? "true" : "false"))'
    );

    t.end();
});

tap.test('Arduino UNO generator emits Join dynamic Boolean as true or false text', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Join',
            left: {
                type: 'TextLiteral',
                value: 'Comparação: '
            },
            right: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }),
        '(String("Comparação: ") + String((1 < 2) ? "true" : "false"))'
    );

    t.end();
});

tap.test('Arduino UNO generator emits DecimalLiteral Join with Arduino String', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Join',
            left: {
                type: 'TextLiteral',
                value: 'Temperatura: '
            },
            right: {
                type: 'DecimalLiteral',
                value: 27.5
            }
        }),
        '(String("Temperatura: ") + String(27.5))'
    );

    t.end();
});

tap.test('Arduino UNO generator preserves decimal semantics for INTEGER division', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Divide',
            left: {
                type: 'IntegerLiteral',
                value: 5
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        }),
        '(static_cast<double>(5) / static_cast<double>(2))'
    );

    t.end();
});

tap.test('Arduino UNO generator preserves decimal semantics when both division operands are INTEGER expressions', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Divide',
            left: {
                type: 'BinaryExpression',
                operator: 'Add',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 4
                }
            },
            right: {
                type: 'BinaryExpression',
                operator: 'Add',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 1
                }
            }
        }),
        '(static_cast<double>((1 + 4)) / static_cast<double>((1 + 1)))'
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_lt as expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'less_than',
            opcode: 'operator_lt',
            next: null,
            parent: null,
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'less_than_left',
                    shadow: 'less_than_left'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'less_than_right',
                    shadow: 'less_than_right'
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        createNumberShadow(
            'less_than_left',
            'less_than',
            1
        ),
        createNumberShadow(
            'less_than_right',
            'less_than',
            2
        )
    ]);

    const blocks = runtime.targets[0].blocks;
    const extractor = new UploadProgramExtractor(runtime);

    t.same(
        extractor._extractExpression(
            blocks,
            'less_than'
        ),
        {
            type: 'BinaryExpression',
            operator: 'LessThan',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers TEXT for TextLiteral', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'TextLiteral',
        value: 'Olá'
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.TEXT
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers TEXT for TEXT Join INTEGER', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'Join',
        left: {
            type: 'TextLiteral',
            value: 'A temperatura é: '
        },
        right: {
            type: 'IntegerLiteral',
            value: 27
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.TEXT
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers INTEGER for TEXT Length', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'UnaryExpression',
        operator: 'Length',
        operand: {
            type: 'TextLiteral',
            value: 'EasyBlox'
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.INTEGER
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers TEXT for INTEGER LetterOf TEXT', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'LetterOf',
        left: {
            type: 'IntegerLiteral',
            value: 2
        },
        right: {
            type: 'TextLiteral',
            value: 'EasyBlox'
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.TEXT
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts DECIMAL LetterOf index', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'LetterOf',
        left: {
            type: 'DecimalLiteral',
            value: 2.5
        },
        right: {
            type: 'TextLiteral',
            value: 'EasyBlox'
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.TEXT
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects TEXT LetterOf index', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator.validate({
            setup: [{
                type: 'SerialWriteLine',
                value: {
                    type: 'BinaryExpression',
                    operator: 'LetterOf',
                    left: {
                        type: 'TextLiteral',
                        value: '2'
                    },
                    right: {
                        type: 'TextLiteral',
                        value: 'EasyBlox'
                    }
                }
            }],
            loop: []
        }),
        /LetterOf index must be numeric/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for INTEGER LessThan INTEGER', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'LessThan',
        left: {
            type: 'IntegerLiteral',
            value: 1
        },
        right: {
            type: 'IntegerLiteral',
            value: 2
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for INTEGER LessThan DECIMAL', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'LessThan',
        left: {
            type: 'IntegerLiteral',
            value: 1
        },
        right: {
            type: 'DecimalLiteral',
            value: 2.5
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for DECIMAL LessThan INTEGER', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'LessThan',
        left: {
            type: 'DecimalLiteral',
            value: 1.5
        },
        right: {
            type: 'IntegerLiteral',
            value: 2
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for DECIMAL LessThan DECIMAL', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'LessThan',
        left: {
            type: 'DecimalLiteral',
            value: 1.5
        },
        right: {
            type: 'DecimalLiteral',
            value: 2.5
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO generator emits LessThan expression', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'LessThan',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        }),
        '(1 < 2)'
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_equals as expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'equals',
            opcode: 'operator_equals',
            next: null,
            parent: null,
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'equals_left',
                    shadow: 'equals_left'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'equals_right',
                    shadow: 'equals_right'
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        createNumberShadow(
            'equals_left',
            'equals',
            1
        ),
        createNumberShadow(
            'equals_right',
            'equals',
            1
        )
    ]);

    const blocks = runtime.targets[0].blocks;
    const extractor = new UploadProgramExtractor(runtime);

    t.same(
        extractor._extractExpression(
            blocks,
            'equals'
        ),
        {
            type: 'BinaryExpression',
            operator: 'Equals',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'IntegerLiteral',
                value: 1
            }
        }
    );

    t.end();
});


tap.test('Arduino UNO Upload type validator infers BOOLEAN for INTEGER Equals INTEGER', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'Equals',
        left: {
            type: 'IntegerLiteral',
            value: 1
        },
        right: {
            type: 'IntegerLiteral',
            value: 1
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for INTEGER Equals DECIMAL', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'Equals',
        left: {
            type: 'IntegerLiteral',
            value: 1
        },
        right: {
            type: 'DecimalLiteral',
            value: 1.0
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for DECIMAL Equals INTEGER', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'Equals',
        left: {
            type: 'DecimalLiteral',
            value: 1.5
        },
        right: {
            type: 'IntegerLiteral',
            value: 1
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for DECIMAL Equals DECIMAL', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'Equals',
        left: {
            type: 'DecimalLiteral',
            value: 1.5
        },
        right: {
            type: 'DecimalLiteral',
            value: 1.5
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO generator emits Equals expression', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Equals',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'IntegerLiteral',
                value: 1
            }
        }),
        '(1 == 1)'
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_gt as expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'greater_than',
            opcode: 'operator_gt',
            next: null,
            parent: null,
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'greater_than_left',
                    shadow: 'greater_than_left'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'greater_than_right',
                    shadow: 'greater_than_right'
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        createNumberShadow(
            'greater_than_left',
            'greater_than',
            2
        ),
        createNumberShadow(
            'greater_than_right',
            'greater_than',
            1
        )
    ]);

    const blocks = runtime.targets[0].blocks;
    const extractor = new UploadProgramExtractor(runtime);

    t.same(
        extractor._extractExpression(
            blocks,
            'greater_than'
        ),
        {
            type: 'BinaryExpression',
            operator: 'GreaterThan',
            left: {
                type: 'IntegerLiteral',
                value: 2
            },
            right: {
                type: 'IntegerLiteral',
                value: 1
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for INTEGER GreaterThan INTEGER', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'GreaterThan',
        left: {
            type: 'IntegerLiteral',
            value: 2
        },
        right: {
            type: 'IntegerLiteral',
            value: 1
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for INTEGER GreaterThan DECIMAL', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'GreaterThan',
        left: {
            type: 'IntegerLiteral',
            value: 2
        },
        right: {
            type: 'DecimalLiteral',
            value: 1.5
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for DECIMAL GreaterThan INTEGER', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'GreaterThan',
        left: {
            type: 'DecimalLiteral',
            value: 2.5
        },
        right: {
            type: 'IntegerLiteral',
            value: 1
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for DECIMAL GreaterThan DECIMAL', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'GreaterThan',
        left: {
            type: 'DecimalLiteral',
            value: 2.5
        },
        right: {
            type: 'DecimalLiteral',
            value: 1.5
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO generator emits GreaterThan expression', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'GreaterThan',
            left: {
                type: 'IntegerLiteral',
                value: 2
            },
            right: {
                type: 'IntegerLiteral',
                value: 1
            }
        }),
        '(2 > 1)'
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_and as expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'and_expression',
            opcode: 'operator_and',
            next: null,
            parent: null,
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'and_left',
                    shadow: null
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'and_right',
                    shadow: null
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        {
            id: 'and_left',
            opcode: 'operator_lt',
            next: null,
            parent: 'and_expression',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'and_left_1',
                    shadow: 'and_left_1'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'and_left_2',
                    shadow: 'and_left_2'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'and_left_1',
            'and_left',
            1
        ),
        createNumberShadow(
            'and_left_2',
            'and_left',
            2
        ),
        {
            id: 'and_right',
            opcode: 'operator_gt',
            next: null,
            parent: 'and_expression',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'and_right_1',
                    shadow: 'and_right_1'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'and_right_2',
                    shadow: 'and_right_2'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'and_right_1',
            'and_right',
            3
        ),
        createNumberShadow(
            'and_right_2',
            'and_right',
            2
        )
    ]);

    const blocks = runtime.targets[0].blocks;
    const extractor = new UploadProgramExtractor(runtime);

    t.same(
        extractor._extractExpression(
            blocks,
            'and_expression'
        ),
        {
            type: 'BinaryExpression',
            operator: 'And',
            left: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            right: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 3
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for BOOLEAN And BOOLEAN', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'And',
        left: {
            type: 'BinaryExpression',
            operator: 'LessThan',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        },
        right: {
            type: 'BinaryExpression',
            operator: 'GreaterThan',
            left: {
                type: 'IntegerLiteral',
                value: 3
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects INTEGER left operand for And', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator._inferExpressionType({
            type: 'BinaryExpression',
            operator: 'And',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }),
        /And operands must be boolean/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects INTEGER right operand for And', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator._inferExpressionType({
            type: 'BinaryExpression',
            operator: 'And',
            left: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            right: {
                type: 'IntegerLiteral',
                value: 1
            }
        }),
        /And operands must be boolean/
    );

    t.end();
});

tap.test('Arduino UNO generator emits And expression', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'And',
            left: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            right: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 3
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }),
        '((1 < 2) && (3 > 2))'
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_or as expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'or_expression',
            opcode: 'operator_or',
            next: null,
            parent: null,
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'or_left',
                    shadow: null
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'or_right',
                    shadow: null
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        {
            id: 'or_left',
            opcode: 'operator_lt',
            next: null,
            parent: 'or_expression',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'or_left_1',
                    shadow: 'or_left_1'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'or_left_2',
                    shadow: 'or_left_2'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'or_left_1',
            'or_left',
            1
        ),
        createNumberShadow(
            'or_left_2',
            'or_left',
            2
        ),
        {
            id: 'or_right',
            opcode: 'operator_gt',
            next: null,
            parent: 'or_expression',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'or_right_1',
                    shadow: 'or_right_1'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'or_right_2',
                    shadow: 'or_right_2'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'or_right_1',
            'or_right',
            3
        ),
        createNumberShadow(
            'or_right_2',
            'or_right',
            2
        )
    ]);

    const blocks = runtime.targets[0].blocks;
    const extractor = new UploadProgramExtractor(runtime);

    t.same(
        extractor._extractExpression(
            blocks,
            'or_expression'
        ),
        {
            type: 'BinaryExpression',
            operator: 'Or',
            left: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            right: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 3
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for BOOLEAN Or BOOLEAN', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'BinaryExpression',
        operator: 'Or',
        left: {
            type: 'BinaryExpression',
            operator: 'LessThan',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        },
        right: {
            type: 'BinaryExpression',
            operator: 'GreaterThan',
            left: {
                type: 'IntegerLiteral',
                value: 3
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects INTEGER left operand for Or', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator._inferExpressionType({
            type: 'BinaryExpression',
            operator: 'Or',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }),
        /Or operands must be boolean/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects INTEGER right operand for Or', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator._inferExpressionType({
            type: 'BinaryExpression',
            operator: 'Or',
            left: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            right: {
                type: 'IntegerLiteral',
                value: 1
            }
        }),
        /Or operands must be boolean/
    );

    t.end();
});

tap.test('Arduino UNO generator emits Or expression', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'BinaryExpression',
            operator: 'Or',
            left: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            right: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 3
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }),
        '((1 < 2) || (3 > 2))'
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts operator_not as unary expression IR', t => {
    const runtime = createRuntimeWithBlocks([
        {
            id: 'not_expression',
            opcode: 'operator_not',
            next: null,
            parent: null,
            inputs: {
                OPERAND: {
                    name: 'OPERAND',
                    block: 'not_operand',
                    shadow: null
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        {
            id: 'not_operand',
            opcode: 'operator_lt',
            next: null,
            parent: 'not_expression',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'not_left',
                    shadow: 'not_left'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'not_right',
                    shadow: 'not_right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'not_left',
            'not_operand',
            1
        ),
        createNumberShadow(
            'not_right',
            'not_operand',
            2
        )
    ]);

    const blocks = runtime.targets[0].blocks;
    const extractor = new UploadProgramExtractor(runtime);

    t.same(
        extractor._extractExpression(
            blocks,
            'not_expression'
        ),
        {
            type: 'UnaryExpression',
            operator: 'Not',
            operand: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator infers BOOLEAN for Not BOOLEAN', t => {
    const validator = new UploadTypeValidator();

    const type = validator._inferExpressionType({
        type: 'UnaryExpression',
        operator: 'Not',
        operand: {
            type: 'BinaryExpression',
            operator: 'LessThan',
            left: {
                type: 'IntegerLiteral',
                value: 1
            },
            right: {
                type: 'IntegerLiteral',
                value: 2
            }
        }
    });

    t.equal(
        type,
        UploadTypeValidator.VALUE_TYPES.BOOLEAN
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects INTEGER operand for Not', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator._inferExpressionType({
            type: 'UnaryExpression',
            operator: 'Not',
            operand: {
                type: 'IntegerLiteral',
                value: 1
            }
        }),
        /Not operand must be boolean/
    );

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects DECIMAL operand for Not', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator._inferExpressionType({
            type: 'UnaryExpression',
            operator: 'Not',
            operand: {
                type: 'DecimalLiteral',
                value: 1.5
            }
        }),
        /Not operand must be boolean/
    );

    t.end();
});

tap.test('Arduino UNO generator emits Not expression', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'UnaryExpression',
            operator: 'Not',
            operand: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }),
        '(!(1 < 2))'
    );

    t.end();
});

tap.test('Arduino UNO generator emits Length using Unicode string length', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'UnaryExpression',
            operator: 'Length',
            operand: {
                type: 'TextLiteral',
                value: 'EasyBlox'
            }
        }),
        'unicodeStringLength(String("EasyBlox"))'
    );

    t.end();
});

tap.test('Arduino UNO generator preserves Boolean text semantics in Length', t => {
    const generator = new ArduinoUnoGenerator();

    t.equal(
        generator._generateExpression({
            type: 'UnaryExpression',
            operator: 'Length',
            operand: {
                type: 'BooleanLiteral',
                value: true
            }
        }),
        'unicodeStringLength(String(true ? "true" : "false"))'
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts control_if into If semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_block'),
        {
            id: 'if_block',
            opcode: 'control_if',
            next: null,
            parent: 'upload_hat',
            inputs: {
                CONDITION: {
                    name: 'CONDITION',
                    block: 'condition_lt',
                    shadow: null
                },
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'digital_write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'condition_lt',
            opcode: 'operator_lt',
            next: null,
            parent: 'if_block',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'left_1',
                    shadow: 'left_1'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'right_2',
                    shadow: 'right_2'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left_1', 'condition_lt', 1),
        createNumberShadow('right_2', 'condition_lt', 2),
        {
            id: 'digital_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'if_block',
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
            type: 'If',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
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

tap.test('Arduino UNO Upload extracts empty control_if condition as false BooleanLiteral', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_block'),
        {
            id: 'if_block',
            opcode: 'control_if',
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
        setup: [{
            type: 'If',
            condition: {
                type: 'BooleanLiteral',
                value: false
            },
            body: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts empty control_if_else condition as false BooleanLiteral', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_else_block'),
        {
            id: 'if_else_block',
            opcode: 'control_if_else',
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
        setup: [{
            type: 'IfElse',
            condition: {
                type: 'BooleanLiteral',
                value: false
            },
            thenBody: [],
            elseBody: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts control_wait_until into WaitUntil semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('wait_until_block'),
        {
            id: 'wait_until_block',
            opcode: 'control_wait_until',
            next: null,
            parent: 'upload_hat',
            inputs: {
                CONDITION: {
                    name: 'CONDITION',
                    block: 'condition_lt',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'condition_lt',
            opcode: 'operator_lt',
            next: null,
            parent: 'wait_until_block',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'left_1',
                    shadow: 'left_1'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'right_2',
                    shadow: 'right_2'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left_1', 'condition_lt', 1),
        createNumberShadow('right_2', 'condition_lt', 2)
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'WaitUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts empty control_wait_until condition as false BooleanLiteral', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('wait_until_block'),
        {
            id: 'wait_until_block',
            opcode: 'control_wait_until',
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
        setup: [{
            type: 'WaitUntil',
            condition: {
                type: 'BooleanLiteral',
                value: false
            }
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator recognizes BooleanLiteral as BOOLEAN', t => {
    const validator = new UploadTypeValidator();

    t.doesNotThrow(() => validator.validate({
        setup: [{
            type: 'If',
            condition: {
                type: 'BooleanLiteral',
                value: false
            },
            body: []
        }],
        loop: []
    }));

    t.end();
});

tap.test('Arduino UNO Upload accepts BOOLEAN WaitUntil condition', t => {
    const validator = new UploadTypeValidator();

    t.doesNotThrow(() => validator.validate({
        setup: [{
            type: 'WaitUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }],
        loop: []
    }));

    t.end();
});

tap.test('Arduino UNO Upload rejects INTEGER used directly as WaitUntil condition', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator.validate({
            setup: [{
                type: 'WaitUntil',
                condition: {
                    type: 'IntegerLiteral',
                    value: 1
                }
            }],
            loop: []
        }),
        /WaitUntil condition must be Boolean/
    );

    t.end();
});

tap.test('Arduino UNO generator emits WaitUntil as negated while statement', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'WaitUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    while (!(1 < 2)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator collects digital input used by WaitUntil condition', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'WaitUntil',
            condition: {
                type: 'DigitalReadExpression',
                pin: 2
            }
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    pinMode(2, INPUT);',
        '    while (!(digitalRead(2) == HIGH)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator collects timer used by WaitUntil condition', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'WaitUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'TimerReadExpression'
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 1.5
                }
            }
        }],
        loop: []
    });

    t.equal(code, [
        'unsigned long easyblox_timer_reset_at = 0;',
        '',
        'void setup() {',
        '    while (!(((millis() - easyblox_timer_reset_at) / 1000.0) > 1.5)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported DigitalRead pin in WaitUntil condition', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'WaitUntil',
            condition: {
                type: 'DigitalReadExpression',
                pin: 1
            }
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /DigitalRead pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator rejects unsupported DigitalRead pin in RepeatUntil condition', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'DigitalReadExpression',
                pin: 1
            },
            body: []
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /DigitalRead pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload resource validator validates RepeatUntil body recursively', t => {
    const validator = new UploadResourceValidator(
        ArduinoUnoBoardProfile
    );

    const ir = {
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: [{
                type: 'If',
                condition: {
                    type: 'DigitalReadExpression',
                    pin: 1
                },
                body: []
            }]
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /DigitalRead pin is not supported by the selected board/
    );

    t.end();
});

tap.test('Arduino UNO Upload extracts control_repeat_until into RepeatUntil semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('repeat_until_block'),
        {
            id: 'repeat_until_block',
            opcode: 'control_repeat_until',
            next: null,
            parent: 'upload_hat',
            inputs: {
                CONDITION: {
                    name: 'CONDITION',
                    block: 'condition_lt',
                    shadow: null
                },
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'digital_write',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'condition_lt',
            opcode: 'operator_lt',
            next: null,
            parent: 'repeat_until_block',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'left_1',
                    shadow: 'left_1'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'right_2',
                    shadow: 'right_2'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow('left_1', 'condition_lt', 1),
        createNumberShadow('right_2', 'condition_lt', 2),
        {
            id: 'digital_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'repeat_until_block',
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

    t.same(extractor.extract(), {
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
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

tap.test('Arduino UNO Upload extracts empty control_repeat_until condition as false BooleanLiteral', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('repeat_until_block'),
        {
            id: 'repeat_until_block',
            opcode: 'control_repeat_until',
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
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'BooleanLiteral',
                value: false
            },
            body: []
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload accepts BOOLEAN RepeatUntil condition', t => {
    const validator = new UploadTypeValidator();

    t.doesNotThrow(() => validator.validate({
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: [{
                type: 'DigitalWrite',
                pin: 13,
                value: true
            }]
        }],
        loop: []
    }));

    t.end();
});

tap.test('Arduino UNO Upload rejects INTEGER used directly as RepeatUntil condition', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator.validate({
            setup: [{
                type: 'RepeatUntil',
                condition: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                body: []
            }],
            loop: []
        }),
        /RepeatUntil condition must be Boolean/
    );

    t.end();
});

tap.test('Arduino UNO Upload validates RepeatUntil body recursively', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator.validate({
            setup: [{
                type: 'RepeatUntil',
                condition: {
                    type: 'BinaryExpression',
                    operator: 'LessThan',
                    left: {
                        type: 'IntegerLiteral',
                        value: 1
                    },
                    right: {
                        type: 'IntegerLiteral',
                        value: 2
                    }
                },
                body: [{
                    type: 'Wait',
                    duration: {
                        type: 'BinaryExpression',
                        operator: 'LessThan',
                        left: {
                            type: 'IntegerLiteral',
                            value: 1
                        },
                        right: {
                            type: 'IntegerLiteral',
                            value: 2
                        }
                    }
                }]
            }],
            loop: []
        }),
        /Wait duration must be numeric/
    );

    t.end();
});

tap.test('Arduino UNO generator emits RepeatUntil as negated while statement', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
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
        '    while (!(1 < 2)) {',
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

tap.test('Arduino UNO generator collects digital input used by RepeatUntil condition', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'DigitalReadExpression',
                pin: 2
            },
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
        '    pinMode(2, INPUT);',
        '    pinMode(13, OUTPUT);',
        '    while (!(digitalRead(2) == HIGH)) {',
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

tap.test('Arduino UNO generator emits timer support for TimerReadExpression in RepeatUntil condition', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'RepeatUntil',
            condition: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'TimerReadExpression'
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 1.5
                }
            },
            body: []
        }],
        loop: []
    });

    t.equal(code, [
        'unsigned long easyblox_timer_reset_at = 0;',
        '',
        'void setup() {',
        '    while (!(((millis() - easyblox_timer_reset_at) / 1000.0) > 1.5)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates timer reset', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('timer_reset'),
        {
            id: 'timer_reset',
            opcode: 'arduinoUno_timerReset',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'TimerReset'
        }],
        loop: []
    });

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'unsigned long easyblox_timer_reset_at = 0;',
        '',
        'void setup() {',
        '    easyblox_timer_reset_at = millis();',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates timer read expression', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_block'),
        {
            id: 'if_block',
            opcode: 'control_if',
            next: null,
            parent: 'upload_hat',
            inputs: {
                CONDITION: {
                    name: 'CONDITION',
                    block: 'greater_than',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'greater_than',
            opcode: 'operator_gt',
            next: null,
            parent: 'if_block',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'timer_read',
                    shadow: null
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'threshold',
                    shadow: 'threshold'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'timer_read',
            opcode: 'arduinoUno_timerRead',
            next: null,
            parent: 'greater_than',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'threshold',
            'greater_than',
            1.5
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'If',
            condition: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'TimerReadExpression'
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 1.5
                }
            },
            body: []
        }],
        loop: []
    });

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'unsigned long easyblox_timer_reset_at = 0;',
        '',
        'void setup() {',
        '    if ((((millis() - easyblox_timer_reset_at) / 1000.0) > 1.5)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates tone stop', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('tone_stop'),
        {
            id: 'tone_stop',
            opcode: 'arduinoUno_toneStop',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'tone_pin_menu',
                    shadow: 'tone_pin_menu'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'tone_pin_menu',
            'tone_stop',
            'arduinoUno_menu_pwmPins',
            'pwmPins',
            6
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'ToneStop',
            pin: 6
        }],
        loop: []
    });

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    noTone(6);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates tone start', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('tone_start'),
        {
            id: 'tone_start',
            opcode: 'arduinoUno_toneStart',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'tone_pin_menu',
                    shadow: 'tone_pin_menu'
                },
                FREQUENCY: {
                    name: 'FREQUENCY',
                    block: 'tone_frequency',
                    shadow: 'tone_frequency'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'tone_pin_menu',
            'tone_start',
            'arduinoUno_menu_pwmPins',
            'pwmPins',
            6
        ),
        createNumberShadow(
            'tone_frequency',
            'tone_start',
            440
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'ToneStart',
            pin: 6,
            frequency: 440
        }],
        loop: []
    });

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    tone(6, 440);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates PWM write', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('pwm_write'),
        {
            id: 'pwm_write',
            opcode: 'arduinoUno_pwmWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pwm_pin_menu',
                    shadow: 'pwm_pin_menu'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'pwm_value',
                    shadow: 'pwm_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'pwm_pin_menu',
            'pwm_write',
            'arduinoUno_menu_pwmPins',
            'pwmPins',
            3
        ),
        createNumberShadow(
            'pwm_value',
            'pwm_write',
            128,
            'easyblox_pwm_value'
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'PwmWrite',
            pin: 3,
            value: 128
        }],
        loop: []
    });

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    pinMode(3, OUTPUT);',
        '    analogWrite(3, 128);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates analogRead numeric expression', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_block'),
        {
            id: 'if_block',
            opcode: 'control_if',
            next: null,
            parent: 'upload_hat',
            inputs: {
                CONDITION: {
                    name: 'CONDITION',
                    block: 'greater_than',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'greater_than',
            opcode: 'operator_gt',
            next: null,
            parent: 'if_block',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'analog_read',
                    shadow: null
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'threshold',
                    shadow: 'threshold'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'analog_read',
            opcode: 'arduinoUno_analogRead',
            next: null,
            parent: 'greater_than',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'analog_pin_menu',
                    shadow: 'analog_pin_menu'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'analog_pin_menu',
            'analog_read',
            'arduinoUno_menu_analogPins',
            'analogPins',
            14
        ),
        createNumberShadow(
            'threshold',
            'greater_than',
            500
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'If',
            condition: {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: {
                    type: 'AnalogReadExpression',
                    pin: 14
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 500
                }
            },
            body: []
        }],
        loop: []
    });

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    if ((analogRead(A0) > 500)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates digitalRead boolean condition', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_block'),
        {
            id: 'if_block',
            opcode: 'control_if',
            next: null,
            parent: 'upload_hat',
            inputs: {
                CONDITION: {
                    name: 'CONDITION',
                    block: 'digital_read',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'digital_read',
            opcode: 'arduinoUno_digitalRead',
            next: null,
            parent: 'if_block',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pin_menu',
                    shadow: 'pin_menu'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'pin_menu',
            'digital_read',
            'arduinoUno_menu_digitalPins',
            'digitalPins',
            2
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const validator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'If',
            condition: {
                type: 'DigitalReadExpression',
                pin: 2
            },
            body: []
        }],
        loop: []
    });

    validator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    pinMode(2, INPUT);',
        '    if ((digitalRead(2) == HIGH)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates empty If condition as false end to end', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_block'),
        {
            id: 'if_block',
            opcode: 'control_if',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        }
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const contextValidator = new UploadContextValidator();
    const typeValidator = new UploadTypeValidator();
    const generator = new ArduinoUnoGenerator();

    const ir = extractor.extract();

    contextValidator.validate(ir);
    typeValidator.validate(ir);

    t.equal(generator.generate(ir), [
        'void setup() {',
        '    if (false) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO Upload generates remaining empty control conditions as false end to end', t => {
    const cases = [{
        firstBlockId: 'if_else_block',
        block: {
            id: 'if_else_block',
            opcode: 'control_if_else',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        },
        expectedCode: [
            'void setup() {',
            '    if (false) {',
            '    } else {',
            '    }',
            '}',
            '',
            'void loop() {',
            '}',
            ''
        ].join('\n')
    }, {
        firstBlockId: 'wait_until_block',
        block: {
            id: 'wait_until_block',
            opcode: 'control_wait_until',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        },
        expectedCode: [
            'void setup() {',
            '    while (!false) {',
            '    }',
            '}',
            '',
            'void loop() {',
            '}',
            ''
        ].join('\n')
    }, {
        firstBlockId: 'repeat_until_block',
        block: {
            id: 'repeat_until_block',
            opcode: 'control_repeat_until',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            topLevel: false,
            shadow: false
        },
        expectedCode: [
            'void setup() {',
            '    while (!false) {',
            '    }',
            '}',
            '',
            'void loop() {',
            '}',
            ''
        ].join('\n')
    }];

    const generatedCodes = cases.map(testCase => {
        const runtime = createRuntimeWithBlocks([
            createUploadHat(testCase.firstBlockId),
            testCase.block
        ]);

        const extractor = new UploadProgramExtractor(runtime);
        const contextValidator = new UploadContextValidator();
        const typeValidator = new UploadTypeValidator();
        const generator = new ArduinoUnoGenerator();

        const ir = extractor.extract();

        contextValidator.validate(ir);
        typeValidator.validate(ir);

        return generator.generate(ir);
    });

    t.same(
        generatedCodes,
        cases.map(testCase => testCase.expectedCode)
    );

    t.end();
});

tap.test('Arduino UNO Upload rejects INTEGER used directly as If condition', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator.validate({
            setup: [{
                type: 'If',
                condition: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                body: [{
                    type: 'DigitalWrite',
                    pin: 13,
                    value: true
                }]
            }],
            loop: []
        }),
        /If condition must be Boolean/
    );

    t.end();
});

tap.test('Arduino UNO generator emits If statement from semantic IR', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'If',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            body: []
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    if ((1 < 2)) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator emits false for BooleanLiteral condition', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'If',
            condition: {
                type: 'BooleanLiteral',
                value: false
            },
            body: []
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    if (false) {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator infers OUTPUT pinMode inside If body', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'If',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
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
        '    if ((1 < 2)) {',
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

tap.test('Arduino UNO Upload extracts control_if_else into IfElse semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('if_else_block'),
        {
            id: 'if_else_block',
            opcode: 'control_if_else',
            next: null,
            parent: 'upload_hat',
            inputs: {
                CONDITION: {
                    name: 'CONDITION',
                    block: 'condition_lt',
                    shadow: null
                },
                SUBSTACK: {
                    name: 'SUBSTACK',
                    block: 'digital_write_then',
                    shadow: null
                },
                SUBSTACK2: {
                    name: 'SUBSTACK2',
                    block: 'digital_write_else',
                    shadow: null
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'condition_lt',
            opcode: 'operator_lt',
            next: null,
            parent: 'if_else_block',
            inputs: {
                OPERAND1: {
                    name: 'OPERAND1',
                    block: 'condition_left',
                    shadow: 'condition_left'
                },
                OPERAND2: {
                    name: 'OPERAND2',
                    block: 'condition_right',
                    shadow: 'condition_right'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'condition_left',
            'condition_lt',
            1
        ),
        createNumberShadow(
            'condition_right',
            'condition_lt',
            2
        ),
        {
            id: 'digital_write_then',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'if_else_block',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'then_pin',
                    shadow: 'then_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'then_value',
                    shadow: 'then_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'then_pin',
            'digital_write_then',
            13
        ),
        createNumberShadow(
            'then_value',
            'digital_write_then',
            1
        ),
        {
            id: 'digital_write_else',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'if_else_block',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'else_pin',
                    shadow: 'else_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'else_value',
                    shadow: 'else_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'else_pin',
            'digital_write_else',
            12
        ),
        createNumberShadow(
            'else_value',
            'digital_write_else',
            0
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);
    const ir = extractor.extract();

    t.same(ir, {
        setup: [{
            type: 'IfElse',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            thenBody: [{
                type: 'DigitalWrite',
                pin: 13,
                value: true
            }],
            elseBody: [{
                type: 'DigitalWrite',
                pin: 12,
                value: false
            }]
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts control_wait into Wait semantic IR', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('wait_block'),
        {
            id: 'wait_block',
            opcode: 'control_wait',
            next: null,
            parent: 'upload_hat',
            inputs: {
                DURATION: {
                    name: 'DURATION',
                    block: 'wait_duration',
                    shadow: 'wait_duration'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'wait_duration',
            'wait_block',
            1.5
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Wait',
            duration: {
                type: 'DecimalLiteral',
                value: 1.5
            }
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload extracts EasyBlox non-negative Wait literal', t => {
    const runtime = createRuntimeWithBlocks([
        createUploadHat('wait_block'),
        {
            id: 'wait_block',
            opcode: 'control_wait',
            next: null,
            parent: 'upload_hat',
            inputs: {
                DURATION: {
                    name: 'DURATION',
                    block: 'wait_duration',
                    shadow: 'wait_duration'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'wait_duration',
            'wait_block',
            1.5,
            'easyblox_nonnegative_number'
        )
    ]);

    const extractor = new UploadProgramExtractor(runtime);

    t.same(extractor.extract(), {
        setup: [{
            type: 'Wait',
            duration: {
                type: 'DecimalLiteral',
                value: 1.5
            }
        }],
        loop: []
    });

    t.end();
});

tap.test('Arduino UNO Upload type validator accepts DECIMAL Wait duration', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Wait',
            duration: {
                type: 'DecimalLiteral',
                value: 1.5
            }
        }],
        loop: []
    };

    t.doesNotThrow(() => validator.validate(ir));

    t.end();
});

tap.test('Arduino UNO Upload type validator rejects BOOLEAN Wait duration', t => {
    const validator = new UploadTypeValidator();

    const ir = {
        setup: [{
            type: 'Wait',
            duration: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            }
        }],
        loop: []
    };

    t.throws(
        () => validator.validate(ir),
        /Wait duration must be numeric/
    );

    t.end();
});

tap.test('Arduino UNO generator emits delay for Wait duration in seconds', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Wait',
            duration: {
                type: 'DecimalLiteral',
                value: 1.5
            }
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    delay(1500);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator preserves numeric expression in Wait duration', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Wait',
            duration: {
                type: 'BinaryExpression',
                operator: 'Add',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'DecimalLiteral',
                    value: 0.5
                }
            }
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    {',
        '        float waitSeconds_0 = (1 + 0.5);',
        '        if (waitSeconds_0 < 0) {',
        '            waitSeconds_0 = 0;',
        '        }',
        '        delay(waitSeconds_0 * 1000);',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator emits Unicode-aware letter support when required', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'TextLiteral',
                    value: 'EasyBlox'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /String unicodeLetterOf\(const String &value, double letter\) \{/
    );

    t.end();
});

tap.test('Arduino UNO generator emits string length dependency for LetterOf', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'TextLiteral',
                    value: 'EasyBlox'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /size_t unicodeStringLength\(const String &value\) \{/
    );

    t.end();
});

tap.test('Arduino UNO generator converts LetterOf index from Scratch one-based indexing', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'TextLiteral',
                    value: 'EasyBlox'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /const double index = letter - 1;/
    );

    t.end();
});

tap.test('Arduino UNO generator truncates positive decimal LetterOf index like Scratch', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'DecimalLiteral',
                    value: 2.5
                },
                right: {
                    type: 'TextLiteral',
                    value: 'EasyBlox'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /const size_t characterIndex = static_cast<size_t>\(index\);/
    );

    t.end();
});

tap.test('Arduino UNO generator returns selected ASCII character for LetterOf', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'TextLiteral',
                    value: 'EasyBlox'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /size_t byteLength = 1;/
    );

    t.end();
});

tap.test('Arduino UNO generator maps LetterOf character index to UTF-8 byte position', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 4
                },
                right: {
                    type: 'TextLiteral',
                    value: 'Olá!'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /size_t byteIndex = 0;\n    size_t characterPosition = 0;/
    );

    t.end();
});

tap.test('Arduino UNO generator handles two-byte UTF-8 character in LetterOf', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'TextLiteral',
                    value: 'áA'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /else if \(\(current & 0xE0\) == 0xC0\) \{\n            byteIndex \+= 2;\n            \+\+characterPosition;/
    );

    t.match(
        code,
        /else if \(\(current & 0xE0\) == 0xC0\) \{\n        byteLength = 2;/
    );

    t.end();
});

tap.test('Arduino UNO generator advances one LetterOf character for three-byte UTF-8', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'TextLiteral',
                    value: '€A'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /else if \(\(current & 0xF0\) == 0xE0\) \{\n            byteIndex \+= 3;\n            \+\+characterPosition;/
    );

    t.end();
});

tap.test('Arduino UNO generator advances one LetterOf character for four-byte UTF-8', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 2
                },
                right: {
                    type: 'TextLiteral',
                    value: '😄A'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /if \(\(current & 0xF8\) == 0xF0\) \{\n            byteIndex \+= 4;\n            \+\+characterPosition;/
    );

    t.end();
});

tap.test('Arduino UNO generator returns complete four-byte UTF-8 character for LetterOf', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'TextLiteral',
                    value: '😄'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /if \(\(current & 0xF8\) == 0xF0\) \{\n        byteLength = 4;/
    );

    t.end();
});

tap.test('Arduino UNO generator returns complete UTF-8 character for LetterOf', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 3
                },
                right: {
                    type: 'TextLiteral',
                    value: 'Olá'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /return value\.substring\(byteIndex, byteIndex \+ byteLength\);/
    );

    t.end();
});

tap.test('Arduino UNO generator returns empty LetterOf for index below Scratch range', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 0
                },
                right: {
                    type: 'TextLiteral',
                    value: 'EasyBlox'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /if \(index < 0\) \{\n        return "";\n    \}/
    );

    t.end();
});

tap.test('Arduino UNO generator returns empty LetterOf for index above Scratch range', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'SerialWriteLine',
            value: {
                type: 'BinaryExpression',
                operator: 'LetterOf',
                left: {
                    type: 'IntegerLiteral',
                    value: 9
                },
                right: {
                    type: 'TextLiteral',
                    value: 'EasyBlox'
                }
            }
        }],
        loop: []
    });

    t.match(
        code,
        /if \(index >= unicodeStringLength\(value\)\) \{\n        return "";\n    \}/
    );

    t.end();
});

tap.test('Arduino UNO generator emits Unicode string length support when required', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: {
                type: 'UnaryExpression',
                operator: 'Length',
                operand: {
                    type: 'TextLiteral',
                    value: 'Olá'
                }
            },
            body: []
        }],
        loop: []
    });

    t.match(
        code,
        /size_t unicodeStringLength\(const String &value\) \{/
    );

    t.end();
});

tap.test('Arduino UNO generator emits UTF-8 aware Unicode string length support', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: {
                type: 'UnaryExpression',
                operator: 'Length',
                operand: {
                    type: 'TextLiteral',
                    value: 'Olá'
                }
            },
            body: []
        }],
        loop: []
    });

    t.match(
        code,
        /if \(\(current & 0xF8\) == 0xF0\)/
    );

    t.end();
});

tap.test('Arduino UNO generator counts four-byte UTF-8 as one Unicode character', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: {
                type: 'UnaryExpression',
                operator: 'Length',
                operand: {
                    type: 'TextLiteral',
                    value: '😄'
                }
            },
            body: []
        }],
        loop: []
    });

    t.match(
        code,
        /if \(\(current & 0xF8\) == 0xF0\) \{\n            \+\+length;\n            index \+= 4;/
    );

    t.end();
});

tap.test('Arduino UNO generator collects timer support from Wait duration', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Wait',
            duration: {
                type: 'TimerReadExpression'
            }
        }],
        loop: []
    });

    t.match(
        code,
        /unsigned long easyblox_timer_reset_at = 0;/
    );

    t.end();
});

tap.test('Arduino UNO generator detects Wait nested inside Repeat', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Repeat',
            times: 2,
            body: [{
                type: 'Wait',
                duration: {
                    type: 'IntegerLiteral',
                    value: 1
                }
            }]
        }],
        loop: []
    });

    t.match(
        code,
        /delay\(1000\);/
    );

    t.notMatch(
        code,
        /easyblox_wait/
    );

    t.end();
});

tap.test('Arduino UNO generator clamps negative literal Wait duration to zero milliseconds', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'Wait',
            duration: {
                type: 'DecimalLiteral',
                value: -1.5
            }
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    delay(0);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.notMatch(
        code,
        /easyblox_wait/
    );

    t.end();
});

tap.test('Arduino UNO Upload rejects INTEGER used directly as IfElse condition', t => {
    const validator = new UploadTypeValidator();

    t.throws(
        () => validator.validate({
            setup: [{
                type: 'IfElse',
                condition: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                thenBody: [{
                    type: 'DigitalWrite',
                    pin: 13,
                    value: true
                }],
                elseBody: [{
                    type: 'DigitalWrite',
                    pin: 12,
                    value: false
                }]
            }],
            loop: []
        }),
        /IfElse condition must be Boolean/
    );

    t.end();
});

tap.test('Arduino UNO generator emits IfElse statement from semantic IR', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'IfElse',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            thenBody: [],
            elseBody: []
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    if ((1 < 2)) {',
        '    } else {',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

tap.test('Arduino UNO generator infers OUTPUT pinMode inside both IfElse branches', t => {
    const generator = new ArduinoUnoGenerator();

    const code = generator.generate({
        setup: [{
            type: 'IfElse',
            condition: {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: {
                    type: 'IntegerLiteral',
                    value: 1
                },
                right: {
                    type: 'IntegerLiteral',
                    value: 2
                }
            },
            thenBody: [{
                type: 'DigitalWrite',
                pin: 13,
                value: true
            }],
            elseBody: [{
                type: 'DigitalWrite',
                pin: 12,
                value: false
            }]
        }],
        loop: []
    });

    t.equal(code, [
        'void setup() {',
        '    pinMode(12, OUTPUT);',
        '    pinMode(13, OUTPUT);',
        '    if ((1 < 2)) {',
        '        digitalWrite(13, HIGH);',
        '    } else {',
        '        digitalWrite(12, LOW);',
        '    }',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});
