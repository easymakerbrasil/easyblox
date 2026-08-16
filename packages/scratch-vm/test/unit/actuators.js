const tap = require('tap');

const ArgumentType = require('../../src/extension-support/argument-type');
const Scratch3ActuatorsBlocks = require('../../src/extensions/scratch3_actuators');

const test = tap.test;

test('Actuators reuse the registered Arduino UNO peripheral', t => {
    const sharedPeripheral = {};

    const runtime = {
        getPeripheralExtension: extensionId => {
            t.equal(
                extensionId,
                'arduinoUno',
                'actuators request the Arduino UNO peripheral'
            );

            return sharedPeripheral;
        }
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    t.equal(
        extension._peripheral,
        sharedPeripheral,
        'actuators reuse the registered Arduino UNO peripheral instance'
    );

    t.end();
});

test('Actuators expose the servo block and supported servo pins', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    t.equal(info.id, 'actuators');
    t.equal(info.name, 'Atuadores');
    t.equal(info.blocks.length, 1);

    const servoBlock = info.blocks[0];

    t.equal(servoBlock.opcode, 'servoWrite');
    t.equal(
        servoBlock.text,
        'mover servo no pino [PIN] para [ANGLE] graus'
    );

    t.equal(
        servoBlock.arguments.PIN.defaultValue,
        5
    );

    t.equal(
        servoBlock.arguments.ANGLE.defaultValue,
        90
    );

    t.equal(
        servoBlock.arguments.ANGLE.type,
        ArgumentType.SERVO_ANGLE
    );

    t.same(
        info.menus.servoPins.items,
        [
            {text: 'D3', value: '3'},
            {text: 'D5', value: '5'},
            {text: 'D6', value: '6'},
            {text: 'D9', value: '9'},
            {text: 'D10', value: '10'},
            {text: 'D11', value: '11'}
        ]
    );

    t.end();
});

test('Actuators delegate servo writes to the shared peripheral', t => {
    const calls = [];

    const sharedPeripheral = {
        servoWrite: (pin, angle) => {
            calls.push({
                pin,
                angle
            });

            return 42;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const result = extension.servoWrite({
        PIN: '5',
        ANGLE: '90'
    });

    t.equal(
        result,
        42,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                pin: 5,
                angle: 90
            }
        ],
        'delegates numeric pin and angle to the shared peripheral'
    );

    t.end();
});

test('Actuators normalize servo angles to integer values from 0 to 180', t => {
    const calls = [];

    const sharedPeripheral = {
        servoWrite: (pin, angle) => {
            calls.push({
                pin,
                angle
            });

            return 1;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    extension.servoWrite({
        PIN: '3',
        ANGLE: '-10'
    });

    extension.servoWrite({
        PIN: '5',
        ANGLE: '190'
    });

    extension.servoWrite({
        PIN: '6',
        ANGLE: '90.6'
    });

    t.same(
        calls,
        [
            {
                pin: 3,
                angle: 0
            },
            {
                pin: 5,
                angle: 180
            },
            {
                pin: 6,
                angle: 91
            }
        ]
    );

    t.end();
});
