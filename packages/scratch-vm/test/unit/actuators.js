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
    t.equal(info.color1, '#2E7D32');
    t.equal(info.color2, '#1B5E20');
    t.equal(info.color3, '#124116');
    t.equal(info.blocks.length, 4);

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

test('Actuators expose motor blocks and motor menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    const motorWriteBlock = info.blocks[1];
    const motorStopBlock = info.blocks[2];

    t.equal(motorWriteBlock.opcode, 'motorWrite');
    t.equal(
        motorWriteBlock.arguments.SPEED.type,
        ArgumentType.MOTOR_SPEED
    );
    t.equal(
        motorWriteBlock.arguments.SPEED.defaultValue,
        100
    );
    t.equal(
        motorWriteBlock.arguments.IN1.defaultValue,
        2
    );
    t.equal(
        motorWriteBlock.arguments.IN2.defaultValue,
        4
    );
    t.equal(
        motorWriteBlock.arguments.PWM.defaultValue,
        3
    );

    t.equal(motorStopBlock.opcode, 'motorStop');
    t.equal(
        motorStopBlock.arguments.STOP_MODE.defaultValue,
        '0'
    );

    t.same(
        info.menus.motorDirections.items,
        [
            {text: 'frente', value: '0'},
            {text: 'trás', value: '1'}
        ]
    );

    t.same(
        info.menus.motorStopModes.items,
        [
            {text: 'livre', value: '0'},
            {text: 'frear', value: '1'}
        ]
    );

    t.same(
        info.menus.motorDigitalPins.items,
        [
            {text: 'D2', value: '2'},
            {text: 'D3', value: '3'},
            {text: 'D4', value: '4'},
            {text: 'D5', value: '5'},
            {text: 'D6', value: '6'},
            {text: 'D7', value: '7'},
            {text: 'D8', value: '8'},
            {text: 'D9', value: '9'},
            {text: 'D10', value: '10'},
            {text: 'D11', value: '11'},
            {text: 'D12', value: '12'},
            {text: 'D13', value: '13'},
            {text: 'A0', value: '14'},
            {text: 'A1', value: '15'},
            {text: 'A2', value: '16'},
            {text: 'A3', value: '17'},
            {text: 'A4', value: '18'},
            {text: 'A5', value: '19'}
        ]
    );

    t.same(
        info.menus.motorPwmPins.items,
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

test('Actuators expose relay block and relay menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    const relayBlock = info.blocks[3];

    t.equal(relayBlock.opcode, 'relayWrite');

    t.equal(
        relayBlock.text,
        'definir relé no pino [PIN] como [STATE]'
    );

    t.equal(
        relayBlock.arguments.PIN.defaultValue,
        12
    );

    t.equal(
        relayBlock.arguments.STATE.defaultValue,
        '1'
    );

    t.same(
        info.menus.relayStates.items,
        [
            {text: 'ligado', value: '1'},
            {text: 'desligado', value: '0'}
        ]
    );

    t.same(
        info.menus.relayPins.items,
        [
            {text: 'D2', value: '2'},
            {text: 'D3', value: '3'},
            {text: 'D4', value: '4'},
            {text: 'D5', value: '5'},
            {text: 'D6', value: '6'},
            {text: 'D7', value: '7'},
            {text: 'D8', value: '8'},
            {text: 'D9', value: '9'},
            {text: 'D10', value: '10'},
            {text: 'D11', value: '11'},
            {text: 'D12', value: '12'},
            {text: 'D13', value: '13'},
            {text: 'A0', value: '14'},
            {text: 'A1', value: '15'},
            {text: 'A2', value: '16'},
            {text: 'A3', value: '17'},
            {text: 'A4', value: '18'},
            {text: 'A5', value: '19'}
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

test('Actuators normalize motor speed percentage and delegate motor writes', t => {
    const calls = [];

    const sharedPeripheral = {
        motorWrite: (in1Pin, in2Pin, pwmPin, direction, speed) => {
            calls.push({
                in1Pin,
                in2Pin,
                pwmPin,
                direction,
                speed
            });

            return 42;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const lowResult = extension.motorWrite({
        IN1: '2',
        IN2: '4',
        PWM: '3',
        DIRECTION: '0',
        SPEED: '0'
    });

    extension.motorWrite({
        IN1: '7',
        IN2: '8',
        PWM: '5',
        DIRECTION: '1',
        SPEED: '50'
    });

    extension.motorWrite({
        IN1: '2',
        IN2: '4',
        PWM: '3',
        DIRECTION: '0',
        SPEED: '100'
    });

    extension.motorWrite({
        IN1: '2',
        IN2: '4',
        PWM: '3',
        DIRECTION: '0',
        SPEED: '-10'
    });

    extension.motorWrite({
        IN1: '2',
        IN2: '4',
        PWM: '3',
        DIRECTION: '0',
        SPEED: '120'
    });

    t.equal(
        lowResult,
        42,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 0
            },
            {
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5,
                direction: 1,
                speed: 128
            },
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 255
            },
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 0
            },
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 255
            },
        ]
    );

    t.end();
});

test('Actuators delegate motor stop modes to the shared peripheral', t => {
    const calls = [];

    const sharedPeripheral = {
        motorStop: (in1Pin, in2Pin, pwmPin, stopMode) => {
            calls.push({
                in1Pin,
                in2Pin,
                pwmPin,
                stopMode
            });

            return 43;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const coastResult = extension.motorStop({
        IN1: '2',
        IN2: '4',
        PWM: '3',
        STOP_MODE: '0'
    });

    extension.motorStop({
        IN1: '7',
        IN2: '8',
        PWM: '5',
        STOP_MODE: '1'
    });

    t.equal(
        coastResult,
        43,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                stopMode: 0
            },
            {
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5,
                stopMode: 1
            }
        ]
    );

    t.end();
});

test('Actuators delegate relay states to the shared peripheral', t => {
    const calls = [];

    const sharedPeripheral = {
        relayWrite: (pin, state) => {
            calls.push({
                pin,
                state
            });

            return 44;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const onResult = extension.relayWrite({
        PIN: '12',
        STATE: '1'
    });

    extension.relayWrite({
        PIN: '2',
        STATE: '0'
    });

    t.equal(
        onResult,
        44,
        'returns the shared peripheral command result'
    );

    t.same(
        calls,
        [
            {
                pin: 12,
                state: 1
            },
            {
                pin: 2,
                state: 0
            }
        ]
    );

    t.end();
});
