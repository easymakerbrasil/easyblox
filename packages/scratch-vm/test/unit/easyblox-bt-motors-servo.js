const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');

const {
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
    getEasyConectWireChannel
} = require('@easymaker/easyconect-core');

const {
    EBCP_CONTRACT,
    encodeFrame
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const Scratch3EasyBloxBtBlocks =
    require('../../src/extensions/scratch3_easyblox_bt');

const NUMBER =
    EBCP_CONTRACT.messageTypes.NUMBER;

const createExtension = () =>
    new Scratch3EasyBloxBtBlocks({});

const createStageHarness = () => {
    const runtimeHandlers =
        new Map();

    const motorCalls = [];
    const servoCalls = [];

    let receiveBluetoothData = null;
    let initCount = 0;

    const bluetoothProvider = {
        onBluetoothSerialData: callback => {
            receiveBluetoothData =
                callback;
        },

        initBluetoothSerial: () => {
            initCount++;

            return Promise.resolve(
                0x40
            );
        },

        writeBluetoothSerial: () =>
            0x41
    };

    const actuatorPeripheral = {
        motorWrite: (
            in1Pin,
            in2Pin,
            pwmPin,
            direction,
            speed
        ) => {
            motorCalls.push({
                in1Pin,
                in2Pin,
                pwmPin,
                direction,
                speed
            });

            return 0x50;
        },

        servoWrite: (
            pin,
            angle
        ) => {
            servoCalls.push({
                pin,
                angle
            });

            return 0x51;
        }
    };

    Object.assign(
        bluetoothProvider,
        actuatorPeripheral
    );

    const runtime = {
        on: (
            event,
            handler
        ) => {
            const handlers =
                runtimeHandlers.get(
                    event
                ) || [];

            handlers.push(handler);

            runtimeHandlers.set(
                event,
                handlers
            );
        },

        getPeripheralExtensionByCapability:
            capability =>
                capability ===
                    'bluetoothSerial' ?
                    bluetoothProvider :
                    null,

    };

    return {
        extension:
            new Scratch3EasyBloxBtBlocks(
                runtime
            ),

        motorCalls,
        servoCalls,

        receive: data => {
            receiveBluetoothData(data);
        },

        getInitCount: () =>
            initCount,

        stopProject: () => {
            for (
                const handler of
                runtimeHandlers.get(
                    'PROJECT_STOP_ALL'
                ) || []
            ) {
                handler();
            }
        }
    };
};

tap.test(
    'EasyBlox BT exposes Motors & Servo as two remote actuator commands',
    t => {
        const info =
            createExtension().getInfo();

        const labels =
            info.blocks
                .filter(
                    block =>
                        block !== '---' &&
                        block.blockType ===
                            BlockType.LABEL
                )
                .map(
                    block => block.text
                );

        t.same(
            labels,
            [
                'Comunicação',
                'Gamepad',
                'Controles',
                'Motores e Servos'
            ]
        );

        const blocks =
            info.blocks.filter(
                block =>
                    block !== '---' &&
                    (
                        block.opcode ===
                            'motorsServoMotorControl' ||
                        block.opcode ===
                            'motorsServoServoControl'
                    )
            );

        t.same(
            blocks.map(
                block => block.opcode
            ),
            [
                'motorsServoMotorControl',
                'motorsServoServoControl'
            ]
        );

        t.equal(
            blocks.length,
            2
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT exposes canonical remote motor command metadata',
    t => {
        const info =
            createExtension().getInfo();

        const block =
            info.blocks.find(
                candidate =>
                    candidate !== '---' &&
                    candidate.opcode ===
                        'motorsServoMotorControl'
            );

        t.ok(
            block,
            'remote motor command exists'
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
            block.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            block.text,
            'controlar motor [MOTOR] IN1 [IN1] IN2 [IN2] PWM [PWM] pelo EasyConect'
        );

        t.equal(
            block.arguments.MOTOR.type,
            ArgumentType.STRING
        );

        t.equal(
            block.arguments.MOTOR.menu,
            'motorsServoMotors'
        );

        t.equal(
            block.arguments.MOTOR.defaultValue,
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_1
        );

        t.equal(
            block.arguments.IN1.menu,
            'motorsServoDigitalPins'
        );

        t.equal(
            block.arguments.IN1.defaultValue,
            7
        );

        t.equal(
            block.arguments.IN2.menu,
            'motorsServoDigitalPins'
        );

        t.equal(
            block.arguments.IN2.defaultValue,
            8
        );

        t.equal(
            block.arguments.PWM.menu,
            'motorsServoPwmPins'
        );

        t.equal(
            block.arguments.PWM.defaultValue,
            5
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT exposes canonical remote servo command metadata',
    t => {
        const info =
            createExtension().getInfo();

        const block =
            info.blocks.find(
                candidate =>
                    candidate !== '---' &&
                    candidate.opcode ===
                        'motorsServoServoControl'
            );

        t.ok(
            block,
            'remote servo command exists'
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
            block.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            block.text,
            'controlar servo [SERVO] no pino [PIN] pelo EasyConect'
        );

        t.equal(
            block.arguments.SERVO.type,
            ArgumentType.STRING
        );

        t.equal(
            block.arguments.SERVO.menu,
            'motorsServoServos'
        );

        t.equal(
            block.arguments.SERVO.defaultValue,
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_1
        );

        t.equal(
            block.arguments.PIN.menu,
            'motorsServoServoPins'
        );

        t.equal(
            block.arguments.PIN.defaultValue,
            5
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT remote actuator menus reserve Bluetooth D2 D3 resources',
    t => {
        const menus =
            createExtension()
                .getInfo()
                .menus;

        t.same(
            menus.motorsServoMotors,
            {
                acceptReporters: false,
                items: [
                    {
                        text: '1',
                        value:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .MOTOR_1
                    },
                    {
                        text: '2',
                        value:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .MOTOR_2
                    }
                ]
            }
        );

        t.same(
            menus.motorsServoServos,
            {
                acceptReporters: false,
                items: [
                    {
                        text: '1',
                        value:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_1
                    },
                    {
                        text: '2',
                        value:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_2
                    },
                    {
                        text: '3',
                        value:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_3
                    },
                    {
                        text: '4',
                        value:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_4
                    }
                ]
            }
        );

        t.same(
            menus.motorsServoDigitalPins.items,
            [
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
            menus.motorsServoPwmPins.items,
            [
                {text: 'D5', value: '5'},
                {text: 'D6', value: '6'},
                {text: 'D9', value: '9'},
                {text: 'D10', value: '10'},
                {text: 'D11', value: '11'}
            ]
        );

        t.same(
            menus.motorsServoServoPins.items,
            [
                {text: 'D5', value: '5'},
                {text: 'D9', value: '9'},
                {text: 'D10', value: '10'},
                {text: 'D11', value: '11'}
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT remote actuator reuses the active neutral Bluetooth provider',
    async t => {
        let receiveBluetoothData = null;

        const motorCalls = [];

        const provider = {
            onBluetoothSerialData: callback => {
                receiveBluetoothData =
                    callback;
            },

            initBluetoothSerial: () =>
                Promise.resolve(
                    0x40
                ),

            writeBluetoothSerial: () =>
                0x41,

            motorWrite: (
                in1Pin,
                in2Pin,
                pwmPin,
                direction,
                speed
            ) => {
                motorCalls.push({
                    in1Pin,
                    in2Pin,
                    pwmPin,
                    direction,
                    speed
                });

                return 0x50;
            }
        };

        const runtime = {
            on: () => {},

            getPeripheralExtensionByCapability:
                capability => {
                    t.equal(
                        capability,
                        'bluetoothSerial',
                        'remote actuator resolves through the neutral board capability'
                    );

                    return provider;
                }
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(
                runtime
            );

        extension
            .motorsServoMotorControl({
                MOTOR:
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_1,
                IN1: '4',
                IN2: '7',
                PWM: '5'
            });

        await Promise.resolve();

        t.type(
            receiveBluetoothData,
            'function',
            'Bluetooth provider owns the shared Stage receive callback'
        );

        receiveBluetoothData(
            encodeFrame({
                type: NUMBER,
                sequence: 1,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .MOTOR_1
                    ),
                payload: 80
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.same(
            motorCalls,
            [
                {
                    in1Pin: 4,
                    in2Pin: 7,
                    pwmPin: 5,
                    direction: 0,
                    speed: 204
                }
            ],
            'remote actuator drives the same active capability provider'
        );
    }
);

tap.test(
    'EasyBlox BT remote motor command drives the bound motor from Bluetooth state',
    async t => {
        const harness =
            createStageHarness();

        harness.extension
            .motorsServoMotorControl({
                MOTOR:
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_1,
                IN1: '7',
                IN2: '8',
                PWM: '5'
            });

        await Promise.resolve();

        t.equal(
            harness.getInitCount(),
            1,
            'remote motor command initializes Bluetooth automatically'
        );

        harness.receive(
            encodeFrame({
                type: NUMBER,
                sequence: 1,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .MOTOR_1
                    ),
                payload: -50
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.same(
            harness.motorCalls,
            [
                {
                    in1Pin: 7,
                    in2Pin: 8,
                    pwmPin: 5,
                    direction: 1,
                    speed: 128
                }
            ],
            'negative 50 percent becomes reverse PWM 128'
        );

        harness.receive(
            encodeFrame({
                type: NUMBER,
                sequence: 2,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .MOTOR_1
                    ),
                payload: 100
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.same(
            harness.motorCalls[1],
            {
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5,
                direction: 0,
                speed: 255
            },
            'positive 100 percent becomes forward PWM 255'
        );
    }
);

tap.test(
    'EasyBlox BT remote servo command drives the bound servo from Bluetooth state',
    async t => {
        const harness =
            createStageHarness();

        harness.extension
            .motorsServoServoControl({
                SERVO:
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .SERVO_1,
                PIN: '5'
            });

        await Promise.resolve();

        harness.receive(
            encodeFrame({
                type: NUMBER,
                sequence: 1,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                            .SERVO_1
                    ),
                payload: 135
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.same(
            harness.servoCalls,
            [
                {
                    pin: 5,
                    angle: 135
                }
            ]
        );
    }
);

tap.test(
    'EasyBlox BT remote actuator commands reject invalid physical bindings',
    async t => {
        const harness =
            createStageHarness();

        harness.extension
            .motorsServoMotorControl({
                MOTOR:
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_1,
                IN1: '2',
                IN2: '8',
                PWM: '5'
            });

        harness.extension
            .motorsServoMotorControl({
                MOTOR:
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_2,
                IN1: '7',
                IN2: '7',
                PWM: '5'
            });

        harness.extension
        .motorsServoServoControl({
            SERVO:
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1,
            PIN: '3'
        });

        harness.extension
            .motorsServoServoControl({
                SERVO:
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .SERVO_2,
                PIN: '6'
            });

        await Promise.resolve();

        t.equal(
            harness.getInitCount(),
            0,
            'invalid physical bindings do not initialize Bluetooth'
        );

        t.same(
            harness.motorCalls,
            [],
            'Bluetooth-reserved or conflicting motor pins are never driven'
        );

        t.same(
            harness.servoCalls,
            [],
            'Bluetooth-reserved or unsupported servo pins are never driven'
        );
    }
);
