const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    COMPATIBILITY_STATUSES,
    aggregateProjectCorpus,
    createPictoBloxMappingCatalog,
    createPictoBloxUnsupportedCatalog
} = require('..');

test(
    'PictoBlox unsupported catalog exposes the validated current conversion gaps',
    () => {
        const catalog =
            createPictoBloxUnsupportedCatalog();

        assert.equal(
            catalog.totalUnsupportedCount,
            6
        );

        assert.deepEqual(
            catalog.entries.map(
                entry =>
                    entry.opcode
            ),
            [
                'displayModule_initialiseI2CDisplay',
                'displayModule_setCursor',
                'displayModule_write',
                'qrCodeScanner_analyseImage',
                'qrCodeScanner_drawBoundingBox',
                'qrCodeScanner_toggleStageVideoFeed'
            ]
        );

        const lcdOpcodes =
            new Set([
                'displayModule_initialiseI2CDisplay',
                'displayModule_setCursor',
                'displayModule_write'
            ]);

        catalog.entries.forEach(
            entry => {
                assert.equal(
                    entry.status,
                    COMPATIBILITY_STATUSES
                        .UNSUPPORTED
                );

                if (
                    lcdOpcodes.has(
                        entry.opcode
                    )
                ) {
                    assert.deepEqual(
                        entry.sourceBoards,
                        [
                            'Arduino Uno'
                        ]
                    );
                } else {
                    assert.equal(
                        entry.sourceBoards,
                        undefined
                    );
                }

                assert.equal(
                    entry.targetOpcode,
                    undefined
                );

                assert.equal(
                    entry.transform,
                    undefined
                );

                assert.equal(
                    typeof entry.note,
                    'string'
                );

                assert.equal(
                    entry.note.length >
                        0,
                    true
                );
            }
        );
    }
);

test(
    'PictoBlox unsupported commands remain disjoint from production mappings',
    () => {
        const mappings =
            createPictoBloxMappingCatalog();

        const unsupported =
            createPictoBloxUnsupportedCatalog();

        const mappedOpcodes =
            new Set(
                mappings.entries.map(
                    entry =>
                        entry.opcode
                )
            );

        unsupported.entries.forEach(
            entry => {
                assert.equal(
                    mappedOpcodes.has(
                        entry.opcode
                    ),
                    false
                );
            }
        );
    }
);

test(
    'PictoBlox unsupported QR commands remain board neutral',
    () => {
        const unsupported =
            createPictoBloxUnsupportedCatalog();

        const qrOpcodes = [
            'qrCodeScanner_analyseImage',
            'qrCodeScanner_drawBoundingBox',
            'qrCodeScanner_toggleStageVideoFeed'
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
                                qrOpcodes.map(
                                    (
                                        opcode,
                                        index
                                    ) => [
                                        `qr${
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
                            'none.sb3',
                        project:
                            createProject(
                                'None'
                            )
                    },
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
                unsupported.entries
            );

        assert.deepEqual(
            result.compatibility
                .unsupported,
            {
                blockCount:
                    9,
                projectCount:
                    3,
                uniqueOpcodeCount:
                    3
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    0,
                projectCount:
                    0,
                uniqueOpcodeCount:
                    0
            }
        );

        result.functionalOpcodes
            .forEach(
                record => {
                    assert.equal(
                        record.status,
                        'unsupported'
                    );

                    assert.equal(
                        record.sourceBoards,
                        undefined
                    );

                    assert.equal(
                        typeof record.note,
                        'string'
                    );
                }
            );
    }
);


test(
    'PictoBlox unsupported LCD gaps remain Arduino Uno specific',
    () => {
        const unsupported =
            createPictoBloxUnsupportedCatalog();

        const lcdOpcodes = [
            'displayModule_initialiseI2CDisplay',
            'displayModule_setCursor',
            'displayModule_write'
        ];

        const createProject =
            boardSelected => ({
                boardSelected,
                targets: [
                    {
                        name:
                            'Tobi',
                        blocks:
                            Object.fromEntries(
                                lcdOpcodes.map(
                                    (
                                        opcode,
                                        index
                                    ) => [
                                        `lcd${
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
                unsupported.entries
            );

        assert.deepEqual(
            result.compatibility
                .unsupported,
            {
                blockCount:
                    3,
                projectCount:
                    1,
                uniqueOpcodeCount:
                    3
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    3,
                projectCount:
                    1,
                uniqueOpcodeCount:
                    3
            }
        );

        const unsupportedRecords =
            result.functionalOpcodes
                .filter(
                    record =>
                        record.status ===
                            'unsupported'
                );

        assert.equal(
            unsupportedRecords.length,
            3
        );

        unsupportedRecords.forEach(
            record => {
                assert.deepEqual(
                    record.sourceBoards,
                    [
                        'Arduino Uno'
                    ]
                );

                assert.equal(
                    typeof record.note,
                    'string'
                );
            }
        );
    }
);
