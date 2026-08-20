const tap = require('tap');

const Blocks = require('../../src/engine/blocks');
const Runtime = require('../../src/engine/runtime');

const UploadProgramExtractor = require('../../src/upload/upload-program-extractor');
const ArduinoUnoGenerator = require('../../src/upload/arduino-uno-generator');

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
