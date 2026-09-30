const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    convertPictoBloxProjectSimple
} = require('..');

test(
    'simple converter applies deterministic mappings while preserving block structure and source project',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            extensions: [
                'actuators',
                'displayModule'
            ],

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    blocks: {
                        servo: {
                            opcode:
                                'actuators_setServo',
                            next:
                                'relay',
                            parent:
                                null,
                            inputs: {
                                ANGLE: [
                                    1,
                                    [
                                        4,
                                        '90'
                                    ]
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
                                true,
                            x:
                                120,
                            y:
                                80,
                            comment:
                                'servo-comment'
                        },

                        relay: {
                            opcode:
                                'actuators_setRelay',
                            next:
                                'matrix',
                            parent:
                                'servo',
                            inputs: {},
                            fields: {
                                DIGITAL_PIN: [
                                    '12',
                                    null
                                ],
                                MODE: [
                                    'true',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                false
                        },

                        matrix: {
                            opcode:
                                'displayModule_displayMatrix',
                            next:
                                null,
                            parent:
                                'relay',
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
                                    '0000000000000000000000000000000000000000000000000000000000000000',
                                    null
                                ]
                            },
                            shadow:
                                true,
                            topLevel:
                                false
                        },

                        unsupported: {
                            opcode:
                                'displayModule_write',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true,
                            x:
                                300,
                            y:
                                100
                        },

                        unknown: {
                            opcode:
                                'pictoUnknown_read',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true,
                            x:
                                450,
                            y:
                                100
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
            convertPictoBloxProjectSimple(
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

        assert.deepEqual(
            blocks.servo.inputs,
            {
                ANGLE: [
                    1,
                    [
                        4,
                        '90'
                    ]
                ]
            }
        );

        assert.equal(
            blocks.servo.next,
            'relay'
        );

        assert.equal(
            blocks.servo.parent,
            null
        );

        assert.equal(
            blocks.servo.topLevel,
            true
        );

        assert.equal(
            blocks.servo.x,
            120
        );

        assert.equal(
            blocks.servo.y,
            80
        );

        assert.equal(
            blocks.servo.comment,
            'servo-comment'
        );

        assert.equal(
            blocks.relay.opcode,
            'actuators_relayWrite'
        );

        assert.deepEqual(
            blocks.relay.fields,
            {
                PIN: [
                    '12',
                    null
                ],
                STATE: [
                    '1',
                    null
                ]
            }
        );

        assert.equal(
            blocks.relay.parent,
            'servo'
        );

        assert.equal(
            blocks.relay.next,
            'matrix'
        );

        assert.deepEqual(
            blocks.matrix,
            original.targets[0]
                .blocks.matrix,
            'structural matrix mapping is deferred intact'
        );

        assert.deepEqual(
            blocks.matrixShadow,
            original.targets[0]
                .blocks.matrixShadow,
            'matrix shadow remains intact'
        );

        assert.deepEqual(
            blocks.unsupported,
            original.targets[0]
                .blocks.unsupported,
            'unsupported block remains intact'
        );

        assert.deepEqual(
            blocks.unknown,
            original.targets[0]
                .blocks.unknown,
            'unknown block remains intact'
        );

        assert.equal(
            result.report
                .convertedBlockCount,
            2
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            1
        );

        assert.deepEqual(
            result.report
                .converted
                .map(
                    record =>
                        record.blockId
                ),
            [
                'servo',
                'relay'
            ]
        );

        assert.deepEqual(
            result.report
                .deferred,
            [
                {
                    targetIndex:
                        0,
                    targetName:
                        'Stage',
                    blockId:
                        'matrix',
                    sourceOpcode:
                        'displayModule_displayMatrix',
                    targetOpcode:
                        'displays_matrixWrite',
                    reason:
                        'structural-shadow-transform'
                }
            ]
        );
    }
);

test(
    'simple converter respects board and source field restrictions',
    () => {
        const project = {
            boardSelected:
                'ESP32',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        servo: {
                            opcode:
                                'actuators_setServo',
                            inputs: {
                                ANGLE: [
                                    1,
                                    [
                                        4,
                                        '45'
                                    ]
                                ]
                            },
                            fields: {
                                SERVO_CHANNEL: [
                                    '9',
                                    null
                                ]
                            },
                            shadow:
                                false
                        }
                    }
                }
            ]
        };

        const result =
            convertPictoBloxProjectSimple(
                project
            );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .servo
                .opcode,
            'actuators_setServo'
        );

        assert.equal(
            result.report
                .convertedBlockCount,
            0
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            0
        );
    }
);

test(
    'simple converter never invents a value missing from a mapping value map',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        relay: {
                            opcode:
                                'actuators_setRelay',
                            inputs: {},
                            fields: {
                                DIGITAL_PIN: [
                                    '12',
                                    null
                                ],
                                MODE: [
                                    'unexpected',
                                    null
                                ]
                            },
                            shadow:
                                false
                        }
                    }
                }
            ]
        };

        const result =
            convertPictoBloxProjectSimple(
                project
            );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .relay
                .opcode,
            'actuators_setRelay'
        );

        assert.equal(
            result.report
                .convertedBlockCount,
            0
        );

        assert.deepEqual(
            result.report
                .deferred,
            [
                {
                    targetIndex:
                        0,
                    targetName:
                        'Stage',
                    blockId:
                        'relay',
                    sourceOpcode:
                        'actuators_setRelay',
                    targetOpcode:
                        'actuators_relayWrite',
                    reason:
                        'unmapped-field-value'
                }
            ]
        );
    }
);
