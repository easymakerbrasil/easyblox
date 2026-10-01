const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    normalizeEasyBloxMenuShadows
} = require('..');

test(
    'canonical menu shadow normalizer materializes EasyBlox reporter menus from serialized fields',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        digitalRead: {
                            opcode:
                                'arduinoUno_digitalRead',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {
                                PIN: [
                                    '2',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        analogRead: {
                            opcode:
                                'arduinoUno_analogRead',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {
                                PIN: [
                                    '14',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        dht: {
                            opcode:
                                'sensors_dhtRead',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {
                                TYPE: [
                                    '0',
                                    null
                                ],
                                PIN: [
                                    '12',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        ultrasonic: {
                            opcode:
                                'sensors_ultrasonicRead',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {
                                TRIG: [
                                    '16',
                                    null
                                ],
                                ECHO: [
                                    '17',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        motorConfigure: {
                            opcode:
                                'actuators_motorConfigure',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {
                                MOTOR: [
                                    '1',
                                    null
                                ],
                                IN1: [
                                    '2',
                                    null
                                ],
                                IN2: [
                                    '4',
                                    null
                                ],
                                PWM: [
                                    '3',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        motorWrite: {
                            opcode:
                                'actuators_motorWrite',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {
                                SPEED: [
                                    1,
                                    [
                                        4,
                                        '91'
                                    ]
                                ]
                            },
                            fields: {
                                MOTOR: [
                                    '1',
                                    null
                                ],
                                DIRECTION: [
                                    '0',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servo: {
                            opcode:
                                'actuators_servoWrite',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {
                                ANGLE: [
                                    1,
                                    'servoAngle'
                                ]
                            },
                            fields: {
                                PIN: [
                                    '9',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servoAngle: {
                            opcode:
                                'easyblox_servo_angle',
                            next:
                                null,
                            parent:
                                'servo',
                            inputs: {},
                            fields: {
                                NUM: [
                                    '90',
                                    null
                                ]
                            },
                            shadow:
                                true,
                            topLevel:
                                false
                        }
                    }
                }
            ]
        };

        const original =
            JSON.parse(
                JSON.stringify(
                    project
                )
            );

        const result =
            normalizeEasyBloxMenuShadows(
                project
            );

        assert.deepEqual(
            project,
            original,
            'source project remains untouched'
        );

        const blocks =
            result.project
                .targets[0]
                .blocks;

        assert.deepEqual(
            blocks.digitalRead.inputs.PIN,
            [
                1,
                'digitalRead__easybloxMenu_PIN'
            ]
        );

        assert.deepEqual(
            blocks[
                'digitalRead__easybloxMenu_PIN'
            ],
            {
                opcode:
                    'arduinoUno_menu_digitalPins',

                next:
                    null,

                parent:
                    'digitalRead',

                inputs: {},

                fields: {
                    digitalPins: [
                        '2',
                        null
                    ]
                },

                shadow:
                    true,

                topLevel:
                    false
            }
        );

        assert.equal(
            blocks.digitalRead
                .fields.PIN,
            undefined
        );

        assert.equal(
            blocks[
                'analogRead__easybloxMenu_PIN'
            ].opcode,
            'arduinoUno_menu_analogPins'
        );

        assert.equal(
            blocks[
                'dht__easybloxMenu_TYPE'
            ].opcode,
            'sensors_menu_dhtTypes'
        );

        assert.equal(
            blocks[
                'dht__easybloxMenu_PIN'
            ].opcode,
            'sensors_menu_dhtPins'
        );

        assert.equal(
            blocks[
                'ultrasonic__easybloxMenu_TRIG'
            ].opcode,
            'sensors_menu_ultrasonicPins'
        );

        assert.equal(
            blocks[
                'ultrasonic__easybloxMenu_ECHO'
            ].opcode,
            'sensors_menu_ultrasonicPins'
        );

        assert.equal(
            blocks[
                'motorConfigure__easybloxMenu_MOTOR'
            ].opcode,
            'actuators_menu_motorNumbers'
        );

        assert.equal(
            blocks[
                'motorConfigure__easybloxMenu_IN1'
            ].opcode,
            'actuators_menu_motorDigitalPins'
        );

        assert.equal(
            blocks[
                'motorConfigure__easybloxMenu_IN2'
            ].opcode,
            'actuators_menu_motorDigitalPins'
        );

        assert.equal(
            blocks[
                'motorConfigure__easybloxMenu_PWM'
            ].opcode,
            'actuators_menu_motorPwmPins'
        );

        assert.equal(
            blocks[
                'motorWrite__easybloxMenu_MOTOR'
            ].opcode,
            'actuators_menu_motorNumbers'
        );

        assert.equal(
            blocks[
                'motorWrite__easybloxMenu_DIRECTION'
            ].opcode,
            'actuators_menu_motorDirections'
        );

        assert.equal(
            blocks[
                'servo__easybloxMenu_PIN'
            ].opcode,
            'actuators_menu_servoPins'
        );

        assert.deepEqual(
            blocks.servo.inputs.ANGLE,
            [
                1,
                'servoAngle'
            ],
            'existing reporter input remains untouched'
        );

        assert.equal(
            result.report
                .normalizedBlockCount,
            7
        );

        assert.equal(
            result.report
                .normalizedArgumentCount,
            13
        );

        assert.deepEqual(
            result.report.deferred,
            []
        );
    }
);

test(
    'canonical menu shadow normalizer preserves an already canonical menu input',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        read: {
                            opcode:
                                'arduinoUno_digitalRead',

                            next:
                                null,

                            parent:
                                null,

                            inputs: {
                                PIN: [
                                    1,
                                    'pinMenu'
                                ]
                            },

                            fields: {},

                            shadow:
                                false,

                            topLevel:
                                true
                        },

                        pinMenu: {
                            opcode:
                                'arduinoUno_menu_digitalPins',

                            next:
                                null,

                            parent:
                                'read',

                            inputs: {},

                            fields: {
                                digitalPins: [
                                    '2',
                                    null
                                ]
                            },

                            shadow:
                                true,

                            topLevel:
                                false
                        }
                    }
                }
            ]
        };

        const result =
            normalizeEasyBloxMenuShadows(
                project
            );

        assert.deepEqual(
            result.project,
            project
        );

        assert.equal(
            result.report
                .normalizedArgumentCount,
            0
        );

        assert.deepEqual(
            result.report.deferred,
            []
        );
    }
);
