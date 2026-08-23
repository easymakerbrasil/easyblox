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

test('VirtualMachine rejects Arduino UNO Upload resource conflicts', t => {
    const vm = new VirtualMachine();

    vm.runtime = createRuntimeWithBlocks([
        createUploadHat('servo_write'),
        {
            id: 'servo_write',
            opcode: 'actuators_servoWrite',
            next: 'pwm_write',
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
        createNumberShadow(
            'servo_angle',
            'servo_write',
            90,
            'easyblox_servo_angle'
        ),
        {
            id: 'pwm_write',
            opcode: 'arduinoUno_pwmWrite',
            next: null,
            parent: 'servo_write',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pwm_pin',
                    shadow: 'pwm_pin'
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
            'pwm_pin',
            'pwm_write',
            'arduinoUno_menu_pwmPins',
            'pwmPins',
            5
        ),
        createNumberShadow(
            'pwm_value',
            'pwm_write',
            128,
            'easyblox_pwm_value'
        )
    ]);

    t.throws(
        () => vm.generateArduinoUnoUploadCode(),
        /Servo and PWM cannot use the same pin/
    );

    t.end();
});
