const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    convertPictoBloxProjectStructural
} = require('..');

const MATRIX_BINARY =
    '0000000011111111101010100101010110000001000000010001100001111110';

const MATRIX_HEX =
    '00FFAA558101187E';

test(
    'structural converter transforms PictoBlox matrix block and its visible shadow',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        matrix: {
                            opcode:
                                'displayModule_displayMatrix',
                            next:
                                'afterMatrix',
                            parent:
                                null,
                            inputs: {
                                MATRIX: [
                                    1,
                                    'matrixShadow'
                                ]
                            },
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true,
                            x:
                                120,
                            y:
                                80
                        },

                        matrixShadow: {
                            opcode:
                                'matrix2',
                            next:
                                null,
                            parent:
                                'matrix',
                            inputs: {},
                            fields: {
                                MATRIX: [
                                    MATRIX_BINARY,
                                    null
                                ]
                            },
                            shadow:
                                true,
                            topLevel:
                                false
                        },

                        afterMatrix: {
                            opcode:
                                'motion_movesteps',
                            next:
                                null,
                            parent:
                                'matrix',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
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
            convertPictoBloxProjectStructural(
                project
            );

        assert.deepEqual(
            project,
            original,
            'source project remains untouched'
        );

        const blocks =
            result
                .project
                .targets[0]
                .blocks;

        assert.equal(
            blocks.matrix.opcode,
            'displays_matrixWrite'
        );

        assert.deepEqual(
            blocks.matrix.inputs,
            {
                MATRIX: [
                    1,
                    'matrixShadow'
                ]
            }
        );

        assert.equal(
            blocks.matrix.next,
            'afterMatrix'
        );

        assert.equal(
            blocks.matrix.parent,
            null
        );

        assert.equal(
            blocks.matrix.topLevel,
            true
        );

        assert.equal(
            blocks.matrix.x,
            120
        );

        assert.equal(
            blocks.matrix.y,
            80
        );

        assert.equal(
            blocks.matrixShadow.opcode,
            'easyblox_matrix_8x8'
        );

        assert.deepEqual(
            blocks.matrixShadow.fields,
            {
                MATRIX: [
                    MATRIX_HEX,
                    null
                ]
            }
        );

        assert.equal(
            blocks.matrixShadow.parent,
            'matrix'
        );

        assert.equal(
            blocks.matrixShadow.shadow,
            true
        );

        assert.equal(
            result.report
                .structuralConvertedBlockCount,
            1
        );

        assert.equal(
            result.report
                .structuralDeferredBlockCount,
            0
        );

        assert.deepEqual(
            result.report
                .converted[0]
                .shadowBlockIds,
            [
                'matrixShadow'
            ]
        );
    }
);

test(
    'structural converter transforms the hidden matrix shadow without replacing an attached input block',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        matrix: {
                            opcode:
                                'displayModule_displayMatrix',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {
                                MATRIX: [
                                    3,
                                    'customMatrix',
                                    'matrixShadow'
                                ]
                            },
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        customMatrix: {
                            opcode:
                                'operator_join',
                            next:
                                null,
                            parent:
                                'matrix',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                false
                        },

                        matrixShadow: {
                            opcode:
                                'matrix2',
                            next:
                                null,
                            parent:
                                'matrix',
                            inputs: {},
                            fields: {
                                MATRIX: [
                                    MATRIX_BINARY,
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

        const originalCustom =
            JSON.parse(
                JSON.stringify(
                    project
                        .targets[0]
                        .blocks
                        .customMatrix
                )
            );

        const result =
            convertPictoBloxProjectStructural(
                project
            );

        const blocks =
            result
                .project
                .targets[0]
                .blocks;

        assert.deepEqual(
            blocks.matrix.inputs.MATRIX,
            [
                3,
                'customMatrix',
                'matrixShadow'
            ]
        );

        assert.deepEqual(
            blocks.customMatrix,
            originalCustom,
            'attached block is preserved'
        );

        assert.equal(
            blocks.matrixShadow.opcode,
            'easyblox_matrix_8x8'
        );

        assert.equal(
            blocks.matrixShadow
                .fields
                .MATRIX[0],
            MATRIX_HEX
        );

        assert.equal(
            result.report
                .structuralConvertedBlockCount,
            1
        );
    }
);

test(
    'structural converter defers a matrix mapping when its shadow reference is broken',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        matrix: {
                            opcode:
                                'displayModule_displayMatrix',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {
                                MATRIX: [
                                    1,
                                    'missingShadow'
                                ]
                            },
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
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
            convertPictoBloxProjectStructural(
                project
            );

        assert.deepEqual(
            result.project,
            original,
            'broken structural mapping remains intact'
        );

        assert.equal(
            result.report
                .structuralConvertedBlockCount,
            0
        );

        assert.equal(
            result.report
                .structuralDeferredBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'missing-shadow-block'
        );
    }
);

test(
    'structural converter defers malformed matrix payloads instead of inventing data',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        matrix: {
                            opcode:
                                'displayModule_displayMatrix',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {
                                MATRIX: [
                                    1,
                                    'matrixShadow'
                                ]
                            },
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        matrixShadow: {
                            opcode:
                                'matrix2',
                            next:
                                null,
                            parent:
                                'matrix',
                            inputs: {},
                            fields: {
                                MATRIX: [
                                    'not-a-64-bit-matrix',
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
            convertPictoBloxProjectStructural(
                project
            );

        assert.deepEqual(
            result.project,
            original
        );

        assert.equal(
            result.report
                .structuralConvertedBlockCount,
            0
        );

        assert.equal(
            result.report
                .structuralDeferredBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'invalid-shadow-value'
        );
    }
);

test(
    'structural converter maps typed numeric shadows and repairs uniquely referenced stale PictoBlox parent metadata',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        servo: {
                            opcode:
                                'actuators_setServo',
                            next:
                                'pwm',
                            parent:
                                null,
                            inputs: {
                                ANGLE: [
                                    3,
                                    [
                                        12,
                                        'ANGLE',
                                        'angleVariable'
                                    ],
                                    'servoShadow'
                                ]
                            },
                            fields: {
                                SERVO_CHANNEL: [
                                    '9',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servoShadow: {
                            opcode:
                                'math_slider_0_180',
                            next:
                                null,
                            parent:
                                null,
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
                                true,
                            x:
                                10,
                            y:
                                20
                        },

                        pwm: {
                            opcode:
                                'arduinoUno_setPWM',
                            next:
                                'motor',
                            parent:
                                'servo',
                            inputs: {
                                VALUE: [
                                    1,
                                    'pwmShadow'
                                ]
                            },
                            fields: {
                                PIN: [
                                    '3',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                false
                        },

                        pwmShadow: {
                            opcode:
                                'math_slider_0_255',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {
                                NUM: [
                                    '255',
                                    null
                                ]
                            },
                            shadow:
                                true,
                            topLevel:
                                true
                        },

                        motor: {
                            opcode:
                                'actuators_runMotor',
                            next:
                                null,
                            parent:
                                'pwm',
                            inputs: {
                                SPEED: [
                                    1,
                                    'motorShadow'
                                ]
                            },
                            fields: {
                                MOTOR: [
                                    '1',
                                    null
                                ],
                                DIRECTION: [
                                    '1',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                false
                        },

                        motorShadow: {
                            opcode:
                                'math_slider_0_100',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {
                                NUM: [
                                    '100',
                                    null
                                ]
                            },
                            shadow:
                                true,
                            topLevel:
                                true
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
            convertPictoBloxProjectStructural(
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

        assert.equal(
            blocks.servo.opcode,
            'actuators_servoWrite'
        );

        assert.deepEqual(
            blocks.servo.fields,
            {
                PIN: [
                    '9',
                    null
                ]
            }
        );

        assert.equal(
            blocks.servoShadow.opcode,
            'easyblox_servo_angle'
        );

        assert.deepEqual(
            blocks.servoShadow.fields,
            {
                NUM: [
                    '90',
                    null
                ]
            }
        );

        assert.equal(
            blocks.pwm.opcode,
            'arduinoUno_pwmWrite'
        );

        assert.equal(
            blocks.pwmShadow.opcode,
            'easyblox_pwm_value'
        );

        assert.equal(
            blocks.motor.opcode,
            'actuators_motorWrite'
        );

        assert.deepEqual(
            blocks.motor.fields,
            {
                MOTOR: [
                    '1',
                    null
                ],
                DIRECTION: [
                    '0',
                    null
                ]
            }
        );

        assert.equal(
            blocks.motorShadow.opcode,
            'easyblox_motor_speed'
        );

        [
            'servoShadow',
            'pwmShadow',
            'motorShadow'
        ].forEach(
            shadowId => {
                assert.equal(
                    blocks[shadowId]
                        .shadow,
                    true
                );

                assert.equal(
                    blocks[shadowId]
                        .topLevel,
                    false
                );
            }
        );

        assert.equal(
            blocks.servoShadow.parent,
            'servo'
        );

        assert.equal(
            blocks.pwmShadow.parent,
            'pwm'
        );

        assert.equal(
            blocks.motorShadow.parent,
            'motor'
        );

        assert.equal(
            blocks.servoShadow.x,
            undefined
        );

        assert.equal(
            blocks.servoShadow.y,
            undefined
        );

        assert.equal(
            result.report
                .structuralConvertedBlockCount,
            3
        );

        assert.equal(
            result.report
                .structuralDeferredBlockCount,
            0
        );
    }
);

test(
    'structural converter refuses to repair stale shadow metadata when the shadow has multiple reverse references',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        servo: {
                            opcode:
                                'actuators_setServo',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {
                                ANGLE: [
                                    1,
                                    'sharedShadow'
                                ]
                            },
                            fields: {
                                SERVO_CHANNEL: [
                                    '9',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        other: {
                            opcode:
                                'looks_say',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {
                                MESSAGE: [
                                    1,
                                    'sharedShadow'
                                ]
                            },
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        sharedShadow: {
                            opcode:
                                'math_slider_0_180',
                            next:
                                null,
                            parent:
                                null,
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
                                true
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
            convertPictoBloxProjectStructural(
                project
            );

        assert.deepEqual(
            result.project,
            original,
            'ambiguous stale shadow remains untouched'
        );

        assert.equal(
            result.report
                .structuralConvertedBlockCount,
            0
        );

        assert.equal(
            result.report
                .structuralDeferredBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'shadow-parent-mismatch'
        );
    }
);
