const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    createPictoBloxConversionPlan
} = require('..');

test(
    'conversion plan separates supported mappable unsupported and unknown blocks without mutating the project',
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
                        supported: {
                            opcode:
                                'motion_movesteps',
                            shadow:
                                false
                        },

                        mappable: {
                            opcode:
                                'actuators_setServo',
                            shadow:
                                false,
                            fields: {
                                SERVO_CHANNEL: [
                                    '9',
                                    null
                                ]
                            },
                            inputs: {
                                ANGLE: [
                                    1,
                                    [
                                        4,
                                        '90'
                                    ]
                                ]
                            }
                        },

                        unsupported: {
                            opcode:
                                'displayModule_write',
                            shadow:
                                false
                        },

                        unknown: {
                            opcode:
                                'pictoUnknown_read',
                            shadow:
                                false
                        },

                        shadow: {
                            opcode:
                                'math_number',
                            shadow:
                                true,
                            fields: {
                                NUM: [
                                    '90',
                                    null
                                ]
                            }
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

        const plan =
            createPictoBloxConversionPlan(
                project
            );

        assert.deepEqual(
            project,
            original
        );

        assert.deepEqual(
            plan.source,
            {
                boardSelected:
                    'Arduino Uno',
                declaredExtensions: [
                    'actuators',
                    'displayModule'
                ]
            }
        );

        assert.deepEqual(
            plan.counts,
            {
                serializedBlocks:
                    5,
                functionalBlocks:
                    4,
                shadowBlocks:
                    1
            }
        );

        assert.equal(
            plan.compatibility
                .supported
                .blockCount,
            1
        );

        assert.equal(
            plan.compatibility
                .mappable
                .blockCount,
            1
        );

        assert.equal(
            plan.compatibility
                .unsupported
                .blockCount,
            1
        );

        assert.equal(
            plan.compatibility
                .unknown
                .blockCount,
            1
        );

        assert.equal(
            plan.convertibleBlockCount,
            2
        );

        assert.equal(
            plan.reviewBlockCount,
            2
        );

        assert.equal(
            plan.requiresReview,
            true
        );

        const servo =
            plan.entries.find(
                entry =>
                    entry.opcode ===
                    'actuators_setServo'
            );

        assert.equal(
            servo.status,
            'mappable'
        );

        assert.equal(
            servo.targetOpcode,
            'actuators_servoWrite'
        );

        assert.ok(
            servo.transform
        );

        const lcdWrite =
            plan.entries.find(
                entry =>
                    entry.opcode ===
                    'displayModule_write'
            );

        assert.equal(
            lcdWrite.status,
            'unsupported'
        );

        assert.equal(
            typeof lcdWrite.note,
            'string'
        );

        assert.ok(
            lcdWrite.note.length >
                0
        );
    }
);
