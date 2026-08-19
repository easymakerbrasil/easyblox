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
    t.equal(info.blocks.length, 7);

    const servoBlock = info.blocks[4];

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

test('Actuators expose configured motor blocks and motor menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    const motorConfigureBlock = info.blocks[0];
    const motorWriteBlock = info.blocks[1];
    const motorStopBlock = info.blocks[2];

    t.equal(
        motorConfigureBlock.opcode,
        'motorConfigure'
    );

    t.equal(
        motorConfigureBlock.text,
        'configurar motor [MOTOR] IN1 [IN1] IN2 [IN2] PWM [PWM]'
    );

    t.equal(
        motorConfigureBlock.arguments.MOTOR.defaultValue,
        '1'
    );

    t.equal(
        motorConfigureBlock.arguments.IN1.defaultValue,
        2
    );

    t.equal(
        motorConfigureBlock.arguments.IN2.defaultValue,
        4
    );

    t.equal(
        motorConfigureBlock.arguments.PWM.defaultValue,
        3
    );

    t.equal(
        motorWriteBlock.opcode,
        'motorWrite'
    );

    t.equal(
        motorWriteBlock.text,
        'girar motor [MOTOR] sentido [DIRECTION] velocidade [SPEED] %'
    );

    t.equal(
        motorWriteBlock.arguments.MOTOR.defaultValue,
        '1'
    );

    t.equal(
        motorWriteBlock.arguments.SPEED.type,
        ArgumentType.MOTOR_SPEED
    );

    t.equal(
        motorWriteBlock.arguments.SPEED.defaultValue,
        100
    );

    t.equal(
        motorStopBlock.opcode,
        'motorStop'
    );

    t.equal(
        motorStopBlock.text,
        'parar motor [MOTOR]'
    );

    t.equal(
        motorStopBlock.arguments.MOTOR.defaultValue,
        '1'
    );

    t.same(
        info.menus.motorNumbers.items,
        [
            {text: '1', value: '1'},
            {text: '2', value: '2'}
        ]
    );

    t.same(
        info.menus.motorDirections.items,
        [
            {text: 'frente', value: '0'},
            {text: 'trás', value: '1'}
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

    t.notOk(
        info.menus.motorStopModes,
        'stop mode menu is no longer exposed'
    );

    t.end();
});

test('Actuators expose relay block and relay menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);
    const info = extension.getInfo();

    const relayBlock = info.blocks[6];

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

test('Actuators initialize the two motor profiles with EasyMaker defaults', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    t.same(
        extension._motors,
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

test('Actuators configure one motor locally and preserve configuration on invalid input', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    const result = extension.motorConfigure({
        MOTOR: '2',
        IN1: '9',
        IN2: '10',
        PWM: '11'
    });

    t.equal(
        result,
        undefined,
        'configuration block returns undefined'
    );

    t.same(
        extension._motors[2],
        {
            in1Pin: 9,
            in2Pin: 10,
            pwmPin: 11
        }
    );

    extension.motorConfigure({
        MOTOR: '2',
        IN1: '9',
        IN2: '9',
        PWM: '11'
    });

    t.same(
        extension._motors[2],
        {
            in1Pin: 9,
            in2Pin: 10,
            pwmPin: 11
        },
        'invalid configuration does not overwrite the previous profile'
    );

    t.end();
});

test('Actuators normalize motor speed percentage and use configured motor profiles', t => {
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

    const motor1Result = extension.motorWrite({
        MOTOR: '1',
        DIRECTION: '0',
        SPEED: '100'
    });

    extension.motorWrite({
        MOTOR: '2',
        DIRECTION: '1',
        SPEED: '50'
    });

    extension.motorWrite({
        MOTOR: '1',
        DIRECTION: '0',
        SPEED: '-10'
    });

    extension.motorWrite({
        MOTOR: '1',
        DIRECTION: '0',
        SPEED: '120'
    });

    t.equal(
        motor1Result,
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
                speed: 255
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
                speed: 0
            },
            {
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3,
                direction: 0,
                speed: 255
            }
        ]
    );

    t.end();
});

test('Actuators stop configured motors using coast mode', t => {
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

    const motor1Result = extension.motorStop({
        MOTOR: '1'
    });

    extension.motorStop({
        MOTOR: '2'
    });

    t.equal(
        motor1Result,
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
                stopMode: 0
            }
        ]
    );

    t.end();
});

test('Actuators reject invalid motor numbers for write and stop', t => {
    const calls = [];

    const sharedPeripheral = {
        motorWrite: (...args) => {
            calls.push({
                method: 'write',
                args
            });
            return 42;
        },
        motorStop: (...args) => {
            calls.push({
                method: 'stop',
                args
            });
            return 43;
        }
    };

    const runtime = {
        getPeripheralExtension: () => sharedPeripheral
    };

    const extension = new Scratch3ActuatorsBlocks(runtime);

    t.equal(
        extension.motorWrite({
            MOTOR: '3',
            DIRECTION: '0',
            SPEED: '100'
        }),
        null
    );

    t.equal(
        extension.motorWrite({
            MOTOR: '1',
            DIRECTION: '2',
            SPEED: '100'
        }),
        null
    );

    t.equal(
        extension.motorStop({
            MOTOR: '0'
        }),
        null
    );

    t.same(
        calls,
        [],
        'invalid motor commands never reach the peripheral'
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
