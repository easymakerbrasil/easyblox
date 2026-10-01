const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    PROJECT_ORIGINS,
    analyzeExternalSb3Project,
    convertExternalSb3Project,
    detectSb3ProjectOrigin
} = require('..');

test(
    'conversion runner migrates a PictoBlox Arduino program into the canonical EasyBlox Upload backing store',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    blocks: {
                        flag: {
                            opcode:
                                'event_whenflagclicked',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        uploadHat: {
                            opcode:
                                'arduinoUno_arduinoUnoStartUp',
                            next:
                                'servo',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servo: {
                            opcode:
                                'actuators_setServo',
                            next:
                                null,
                            parent:
                                'uploadHat',
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
                                false
                        }
                    }
                }
            ]
        };

        const result =
            convertExternalSb3Project(
                project
            );

        assert.equal(
            result.canConvert,
            true
        );

        assert.ok(
            result.project
                .targets[0]
                .blocks
                .flag
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .uploadHat,
            undefined
        );

        const uploadBlocks =
            result.project
                .easybloxUploadPrograms[
                    'arduino-uno'
                ]
                .blocks;

        assert.equal(
            uploadBlocks
                .uploadHat
                .opcode,
            'arduinoUno_whenArduinoUnoStart'
        );

        assert.equal(
            uploadBlocks
                .servo
                .opcode,
            'actuators_servoWrite'
        );

        assert.deepEqual(
            result.project
                .easybloxProject,
            {
                schemaVersion:
                    1,
                selectedBoardId:
                    'arduino-uno',
                programMode:
                    'upload',
                qrCodes:
                    [],
                qrOverlayPosition:
                    'topRight'
            }
        );

        assert.equal(
            result.report
                .projectStructure
                .migratedBlockCount,
            2
        );

        assert.equal(
            result.report
                .deferredProjectStructureCount,
            0
        );

        assert.equal(
            result.report
                .requiresStructuralConversion,
            false
        );
    }
);

test(
    'conversion runner identifies PictoBlox from board metadata and applies simple mappings',
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
                                100,
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

        assert.equal(
            detectSb3ProjectOrigin(
                project
            ),
            PROJECT_ORIGINS
                .PICTOBLOX
        );

        const analysis =
            analyzeExternalSb3Project(
                project
            );

        assert.equal(
            analysis.origin,
            PROJECT_ORIGINS
                .PICTOBLOX
        );

        assert.equal(
            analysis.canConvert,
            true
        );

        assert.equal(
            analysis.plan
                .convertibleBlockCount,
            1
        );

        const result =
            convertExternalSb3Project(
                project
            );

        assert.deepEqual(
            project,
            original,
            'conversion runner does not mutate the source project'
        );

        assert.equal(
            result.canConvert,
            true
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .servo
                .opcode,
            'actuators_servoWrite'
        );

        assert.equal(
            result.report
                .processedBlockCount,
            1
        );

        assert.equal(
            result.report
                .convertedBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferredStructuralBlockCount,
            0
        );

        assert.equal(
            result.report
                .reviewBlockCount,
            0
        );

        assert.equal(
            result.report
                .requiresStructuralConversion,
            false
        );

        assert.equal(
            result.report
                .requiresReview,
            false
        );
    }
);

test(
    'conversion runner applies structural mappings while quarantining review items safely',
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
                                    '0000000011111111101010100101010110000001000000010001100001111110',
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
            convertExternalSb3Project(
                project
            );

        assert.deepEqual(
            project,
            original
        );

        assert.equal(
            result.canConvert,
            true
        );

        assert.equal(
            result.report
                .processedBlockCount,
            2
        );

        assert.equal(
            result.report
                .convertedBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferredStructuralBlockCount,
            0
        );

        assert.equal(
            result.report
                .reviewBlockCount,
            1
        );

        assert.equal(
            result.report
                .requiresStructuralConversion,
            false
        );

        assert.equal(
            result.report
                .requiresReview,
            true
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .matrix
                .opcode,
            'displays_matrixWrite'
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .matrixShadow
                .opcode,
            'easyblox_matrix_8x8'
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .matrixShadow
                .fields
                .MATRIX[0],
            '00FFAA558101187E'
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .unsupported,
            undefined,
            'unsupported PictoBlox block is removed from the active workspace'
        );

        assert.equal(
            result.report
                .isLoadSafe,
            true
        );

        assert.equal(
            result.report
                .safeLoad
                .quarantinedScriptCount,
            1
        );

        assert.equal(
            result.report
                .safeLoad
                .quarantinedReviewBlockCount,
            1
        );

        assert.deepEqual(
            result.project
                .easybloxProject
                .conversionReview
                .quarantinedScripts[0]
                .blocks
                .unsupported,
            original.targets[0]
                .blocks.unsupported,
            'unsupported block is preserved intact in conversion review metadata'
        );

        assert.equal(
            result.report
                .structuralMappings
                .convertedBlockCount,
            1
        );

        assert.equal(
            result.report
                .structuralMappings
                .deferredBlockCount,
            0
        );
    }
);

test(
    'conversion runner preserves PictoBlox None as provenance while converting it to board-neutral EasyBlox Stage context',
    () => {
        const project = {
            boardSelected:
                'None',

            extensions: [
                'qrCodeScanner'
            ],

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    comments: {},

                    blocks: {
                        qrDetected: {
                            opcode:
                                'qrCodeScanner_isDetected',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        legacyVideo: {
                            opcode:
                                'qrCodeScanner_toggleStageVideoFeed',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
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

        assert.equal(
            detectSb3ProjectOrigin(
                project
            ),
            PROJECT_ORIGINS
                .PICTOBLOX
        );

        const result =
            convertExternalSb3Project(
                project
            );

        assert.equal(
            result.canConvert,
            true
        );

        assert.equal(
            result.report
                .plan
                .source
                .boardSelected,
            'None',
            'Analyzer provenance preserves the PictoBlox sentinel'
        );

        assert.equal(
            result.report
                .projectStructure
                .sourceBoard,
            null,
            'structural migration interprets None as no selected board'
        );

        assert.equal(
            result.report
                .deferredProjectStructureCount,
            0
        );

        assert.deepEqual(
            result.report
                .projectStructure
                .deferred,
            []
        );

        assert.deepEqual(
            result.project
                .easybloxProject
                .selectedBoardId,
            null
        );

        assert.equal(
            result.project
                .easybloxProject
                .programMode,
            'stage'
        );

        assert.equal(
            Object.prototype
                .hasOwnProperty.call(
                    result.project,
                    'boardSelected'
                ),
            false
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .qrDetected
                .opcode,
            'easybloxQr_isDetected'
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .legacyVideo,
            undefined
        );

        assert.equal(
            result.report
                .reviewBlockCount,
            1
        );

        assert.equal(
            result.report
                .safeLoad
                .quarantinedReviewBlockCount,
            1
        );

        assert.equal(
            result.report
                .safeLoad
                .remainingUnsafeBlockCount,
            0
        );

        assert.equal(
            result.report
                .isLoadSafe,
            true
        );

        assert.equal(
            result.project
                .easybloxProject
                .conversionReview
                .quarantinedScripts[0]
                .blocks
                .legacyVideo
                .opcode,
            'qrCodeScanner_toggleStageVideoFeed'
        );
    }
);

test(
    'conversion runner recognizes board-neutral PictoBlox mappings without board metadata',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        qr: {
                            opcode:
                                'qrCodeScanner_isDetected',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
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

        assert.equal(
            detectSb3ProjectOrigin(
                project
            ),
            PROJECT_ORIGINS
                .PICTOBLOX
        );

        const result =
            convertExternalSb3Project(
                project
            );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .qr
                .opcode,
            'easybloxQr_isDetected'
        );
    }
);

test(
    'conversion runner does not guess EasyBlox or ambiguous Scratch projects as PictoBlox',
    () => {
        const easyBloxProject = {
            easybloxProject: {
                schemaVersion:
                    1,
                selectedBoardId:
                    null,
                programMode:
                    'stage'
            },

            targets: []
        };

        const scratchLikeProject = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        motion: {
                            opcode:
                                'motion_movesteps',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
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

        assert.equal(
            detectSb3ProjectOrigin(
                easyBloxProject
            ),
            PROJECT_ORIGINS
                .EASYBLOX
        );

        assert.equal(
            detectSb3ProjectOrigin(
                scratchLikeProject
            ),
            PROJECT_ORIGINS
                .UNKNOWN
        );

        const easyBloxResult =
            convertExternalSb3Project(
                easyBloxProject
            );

        assert.deepEqual(
            easyBloxResult,
            {
                origin:
                    PROJECT_ORIGINS
                        .EASYBLOX,
                canConvert:
                    false,
                project:
                    null,
                report:
                    null
            }
        );

        const unknownResult =
            convertExternalSb3Project(
                scratchLikeProject
            );

        assert.deepEqual(
            unknownResult,
            {
                origin:
                    PROJECT_ORIGINS
                        .UNKNOWN,
                canConvert:
                    false,
                project:
                    null,
                report:
                    null
            }
        );
    }
);
