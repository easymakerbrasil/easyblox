const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    createProjectInventory,
    getOpcodeNamespace
} = require('..');

test(
    'project inventory extracts canonical opcode namespaces',
    () => {
        assert.equal(
            getOpcodeNamespace(
                'motion_movesteps'
            ),
            'motion'
        );

        assert.equal(
            getOpcodeNamespace(
                'easybloxQr_showQrCode'
            ),
            'easybloxQr'
        );

        assert.equal(
            getOpcodeNamespace(
                'customOpcode'
            ),
            'customOpcode'
        );
    }
);

test(
    'project inventory scans Stage and sprite blocks deterministically',
    () => {
        const inventory =
            createProjectInventory({
                targets: [
                    {
                        name:
                            'Stage',
                        isStage:
                            true,
                        blocks: {
                            stageEvent: {
                                opcode:
                                    'event_whenflagclicked'
                            }
                        }
                    },
                    {
                        name:
                            'Whiz',
                        isStage:
                            false,
                        blocks: {
                            move1: {
                                opcode:
                                    'motion_movesteps'
                            },
                            move2: {
                                opcode:
                                    'motion_movesteps'
                            },
                            wait: {
                                opcode:
                                    'control_wait'
                            },
                            custom: {
                                opcode:
                                    'pictoSensor_read'
                            }
                        }
                    }
                ],
                extensions: [
                    'pictoSensor'
                ]
            });

        assert.equal(
            inventory.targetCount,
            2
        );

        assert.equal(
            inventory.blockCount,
            5
        );

        assert.equal(
            inventory.uniqueOpcodeCount,
            4
        );

        assert.deepEqual(
            inventory.declaredExtensions,
            [
                'pictoSensor'
            ]
        );

        assert.deepEqual(
            inventory.targets,
            [
                {
                    index: 0,
                    name: 'Stage',
                    isStage: true,
                    blockCount: 1,
                    uniqueOpcodeCount: 1
                },
                {
                    index: 1,
                    name: 'Whiz',
                    isStage: false,
                    blockCount: 4,
                    uniqueOpcodeCount: 3
                }
            ]
        );

        assert.deepEqual(
            inventory.opcodes,
            [
                {
                    opcode:
                        'control_wait',
                    namespace:
                        'control',
                    count:
                        1
                },
                {
                    opcode:
                        'event_whenflagclicked',
                    namespace:
                        'event',
                    count:
                        1
                },
                {
                    opcode:
                        'motion_movesteps',
                    namespace:
                        'motion',
                    count:
                        2
                },
                {
                    opcode:
                        'pictoSensor_read',
                    namespace:
                        'pictoSensor',
                    count:
                        1
                }
            ]
        );
    }
);

test(
    'project inventory separates functional blocks from serialized shadows',
    () => {
        const inventory =
            createProjectInventory({
                targets: [
                    {
                        name:
                            'Sprite1',
                        blocks: {
                            switchCostume: {
                                opcode:
                                    'looks_switchcostumeto',
                                shadow:
                                    false
                            },
                            costumeMenu: {
                                opcode:
                                    'looks_costume',
                                shadow:
                                    true,
                                parent:
                                    'switchCostume'
                            },
                            servo: {
                                opcode:
                                    'actuators_setServo',
                                shadow:
                                    false
                            },
                            servoAngle: {
                                opcode:
                                    'math_slider_0_180',
                                shadow:
                                    true,
                                parent:
                                    'servo'
                            },
                            startup: {
                                opcode:
                                    'arduinoUno_arduinoUnoStartUp',
                                shadow:
                                    false,
                                topLevel:
                                    true
                            }
                        }
                    }
                ]
            });

        assert.equal(
            inventory.blockCount,
            5
        );

        assert.equal(
            inventory.functionalBlockCount,
            3
        );

        assert.equal(
            inventory.shadowBlockCount,
            2
        );

        assert.equal(
            inventory.uniqueFunctionalOpcodeCount,
            3
        );

        assert.equal(
            inventory.uniqueShadowOpcodeCount,
            2
        );

        assert.deepEqual(
            inventory.functionalOpcodes,
            [
                {
                    opcode:
                        'actuators_setServo',
                    namespace:
                        'actuators',
                    count:
                        1
                },
                {
                    opcode:
                        'arduinoUno_arduinoUnoStartUp',
                    namespace:
                        'arduinoUno',
                    count:
                        1
                },
                {
                    opcode:
                        'looks_switchcostumeto',
                    namespace:
                        'looks',
                    count:
                        1
                }
            ]
        );

        assert.deepEqual(
            inventory.shadowOpcodes,
            [
                {
                    opcode:
                        'looks_costume',
                    namespace:
                        'looks',
                    count:
                        1
                },
                {
                    opcode:
                        'math_slider_0_180',
                    namespace:
                        'math',
                    count:
                        1
                }
            ]
        );
    }
);

test(
    'project inventory normalizes declared extensions',
    () => {
        const inventory =
            createProjectInventory({
                targets: [],
                extensions: [
                    'quarky',
                    'evive',
                    'quarky',
                    '',
                    null
                ]
            });

        assert.deepEqual(
            inventory.declaredExtensions,
            [
                'evive',
                'quarky'
            ]
        );
    }
);

test(
    'project inventory ignores malformed block records without losing the target',
    () => {
        const inventory =
            createProjectInventory({
                targets: [
                    {
                        name:
                            'Sprite1',
                        blocks: {
                            valid: {
                                opcode:
                                    'looks_say'
                            },
                            missingOpcode: {},
                            invalid:
                                null
                        }
                    }
                ]
            });

        assert.equal(
            inventory.targetCount,
            1
        );

        assert.equal(
            inventory.blockCount,
            1
        );

        assert.equal(
            inventory.targets[0]
                .blockCount,
            1
        );
    }
);

test(
    'project inventory rejects unusable project input',
    () => {
        assert.throws(
            () =>
                createProjectInventory(
                    null
                ),
            /project object/
        );

        assert.throws(
            () =>
                createProjectInventory(
                    {}
                ),
            /targets array/
        );
    }
);
