const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    COMPATIBILITY_STATUSES,
    aggregateProjectCorpus,
    createCompatibilityCatalog,
    createEasyBloxSupportCatalog,
    createPictoBloxMappingCatalog
} = require('..');

test(
    'PictoBlox production mapping catalog exposes the validated Arduino Uno mappings',
    () => {
        const catalog =
            createPictoBloxMappingCatalog();

        assert.equal(
            catalog.totalMappingCount,
            5
        );

        assert.deepEqual(
            catalog.entries.map(
                entry =>
                    entry.opcode
            ),
            [
                'actuators_setServo',
                'arduinoUno_arduinoUnoStartUp',
                'arduinoUno_playTone',
                'arduinoUno_setPWM',
                'sensors_readUltrasonic'
            ]
        );

        catalog.entries
            .forEach(
                entry => {
                    assert.equal(
                        entry.status,
                        COMPATIBILITY_STATUSES
                            .MAPPABLE
                    );

                    assert.deepEqual(
                        entry.sourceBoards,
                        [
                            'Arduino Uno'
                        ]
                    );

                    assert.equal(
                        entry.transform.kind,
                        'block'
                    );
                }
            );

        const entriesByOpcode =
            new Map(
                catalog.entries.map(
                    entry => [
                        entry.opcode,
                        entry
                    ]
                )
            );

        assert.deepEqual(
            entriesByOpcode.get(
                'actuators_setServo'
            ).transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'PIN',
                        source:
                            'field',
                        sourceName:
                            'SERVO_CHANNEL'
                    },
                    {
                        target:
                            'ANGLE',
                        source:
                            'input',
                        sourceName:
                            'ANGLE'
                    }
                ]
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'arduinoUno_playTone'
            ).transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'PIN',
                        source:
                            'field',
                        sourceName:
                            'PIN'
                    },
                    {
                        target:
                            'NOTE',
                        source:
                            'field',
                        sourceName:
                            'NOTE'
                    },
                    {
                        target:
                            'DURATION',
                        source:
                            'field',
                        sourceName:
                            'BEATS'
                    }
                ]
            }
        );
    }
);

test(
    'PictoBlox production mapping targets exist in the real EasyBlox support catalog',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const supportCatalog =
            createEasyBloxSupportCatalog();

        const supportedOpcodes =
            new Set(
                supportCatalog.entries.map(
                    entry =>
                        entry.opcode
                )
            );

        mappingCatalog.entries
            .forEach(
                entry => {
                    assert.equal(
                        supportedOpcodes.has(
                            entry.targetOpcode
                        ),
                        true,
                        `Missing EasyBlox target opcode: ${
                            entry.targetOpcode
                        }`
                    );
                }
            );
    }
);

test(
    'PictoBlox production mappings remain board aware and preserve transform metadata in corpus aggregation',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const opcodes = [
            'arduinoUno_arduinoUnoStartUp',
            'actuators_setServo',
            'sensors_readUltrasonic',
            'arduinoUno_setPWM',
            'arduinoUno_playTone'
        ];

        const createProject =
            boardSelected => ({
                boardSelected,
                targets: [
                    {
                        name:
                            'Stage',
                        isStage:
                            true,
                        blocks:
                            Object.fromEntries(
                                opcodes.map(
                                    (
                                        opcode,
                                        index
                                    ) => [
                                        `block${
                                            index
                                        }`,
                                        {
                                            opcode,
                                            shadow:
                                                false
                                        }
                                    ]
                                )
                            )
                    }
                ]
            });

        const result =
            aggregateProjectCorpus(
                [
                    {
                        id:
                            'arduino.sb3',
                        project:
                            createProject(
                                'Arduino Uno'
                            )
                    },
                    {
                        id:
                            'esp32.sb3',
                        project:
                            createProject(
                                'ESP32'
                            )
                    }
                ],
                mappingCatalog.entries
            );

        assert.equal(
            result.summary
                .uniqueFunctionalOpcodeCount,
            5
        );

        assert.deepEqual(
            result.compatibility
                .mappable,
            {
                blockCount:
                    5,
                projectCount:
                    1,
                uniqueOpcodeCount:
                    5
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    5,
                projectCount:
                    1,
                uniqueOpcodeCount:
                    5
            }
        );

        const servo =
            result.functionalOpcodes
                .find(
                    entry =>
                        entry.opcode ===
                            'actuators_setServo' &&
                        entry.status ===
                            'mappable'
                );

        assert.equal(
            servo.targetOpcode,
            'actuators_servoWrite'
        );

        assert.deepEqual(
            servo.transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'PIN',
                        source:
                            'field',
                        sourceName:
                            'SERVO_CHANNEL'
                    },
                    {
                        target:
                            'ANGLE',
                        source:
                            'input',
                        sourceName:
                            'ANGLE'
                    }
                ]
            }
        );
    }
);

test(
    'compatibility catalog rejects invalid structured transforms',
    () => {
        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_missing_arguments',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block'
                        }
                    }
                ]),
            /transform arguments to be an array/
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_invalid_source',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'magic',
                                    sourceName:
                                        'VALUE'
                                }
                            ]
                        }
                    }
                ]),
            /Unsupported compatibility transform argument source/
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_duplicate_target',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'field',
                                    sourceName:
                                        'A'
                                },
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'input',
                                    sourceName:
                                        'B'
                                }
                            ]
                        }
                    }
                ]),
            /Duplicate compatibility transform target argument/
        );
    }
);
