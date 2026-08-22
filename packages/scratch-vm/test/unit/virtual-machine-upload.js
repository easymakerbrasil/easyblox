const tap = require('tap');
const VirtualMachine = require('../../src/virtual-machine');
const Runtime = require('../../src/engine/runtime');
const Blocks = require('../../src/engine/blocks');

const test = tap.test;

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

test('VirtualMachine exposes Arduino UNO Upload code generation', t => {
    const vm = new VirtualMachine();

    t.type(
        vm.generateArduinoUnoUploadCode,
        'function'
    );

    t.end();
});

test('VirtualMachine generates Arduino UNO Upload C++ from current runtime', t => {
    const vm = new VirtualMachine();

    vm.runtime = createRuntimeWithBlocks([
        createUploadHat('digital_write'),
        {
            id: 'digital_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'upload_hat',
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
        createNumberShadow(
            'pin',
            'digital_write',
            13
        ),
        createNumberShadow(
            'value',
            'digital_write',
            1
        )
    ]);

    const code = vm.generateArduinoUnoUploadCode();

    t.equal(code, [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '    digitalWrite(13, HIGH);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});
