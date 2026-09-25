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
    'PictoBlox unsupported catalog exposes the validated current QR conversion gaps',
    () => {
        const catalog =
            createPictoBloxUnsupportedCatalog();

        assert.equal(
            catalog.totalUnsupportedCount,
            3
        );

        assert.deepEqual(
            catalog.entries.map(
                entry =>
                    entry.opcode
            ),
            [
                'qrCodeScanner_analyseImage',
                'qrCodeScanner_drawBoundingBox',
                'qrCodeScanner_toggleStageVideoFeed'
            ]
        );

        catalog.entries.forEach(
            entry => {
                assert.equal(
                    entry.status,
                    COMPATIBILITY_STATUSES
                        .UNSUPPORTED
                );

                assert.equal(
                    entry.sourceBoards,
                    undefined
                );

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
    'PictoBlox unsupported QR commands remain disjoint from production mappings',
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
