const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    quarantineUnsafeReviewContent
} = require('..');

test(
    'review quarantine removes an unsafe Stage script while preserving it for review',
    () => {
        const project = {
            extensions: [
                'actuators'
            ],

            monitors: [],

            easybloxProject: {
                schemaVersion:
                    1,
                selectedBoardId:
                    'arduino-uno',
                programMode:
                    'stage',
                qrCodes: [],
                qrOverlayPosition:
                    'topRight'
            },

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    comments: {
                        reviewComment: {
                            blockId:
                                'legacy',
                            text:
                                'Review me'
                        }
                    },

                    blocks: {
                        safeFlag: {
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

                        reviewFlag: {
                            opcode:
                                'event_whenflagclicked',
                            next:
                                'legacy',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        legacy: {
                            opcode:
                                'displayModule_write',
                            next:
                                null,
                            parent:
                                'reviewFlag',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                false,
                            comment:
                                'reviewComment'
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
            quarantineUnsafeReviewContent(
                project
            );

        assert.deepEqual(
            project,
            original,
            'source project remains untouched'
        );

        assert.ok(
            result.project
                .targets[0]
                .blocks
                .safeFlag
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .reviewFlag,
            undefined
        );

        assert.equal(
            result.project
                .targets[0]
                .blocks
                .legacy,
            undefined
        );

        assert.equal(
            result.project
                .targets[0]
                .comments
                .reviewComment,
            undefined
        );

        const review =
            result.project
                .easybloxProject
                .conversionReview;

        assert.equal(
            review.schemaVersion,
            1
        );

        assert.equal(
            review
                .quarantinedScripts
                .length,
            1
        );

        assert.ok(
            review
                .quarantinedScripts[0]
                .blocks
                .reviewFlag
        );

        assert.equal(
            review
                .quarantinedScripts[0]
                .blocks
                .legacy
                .opcode,
            'displayModule_write'
        );

        assert.equal(
            review
                .quarantinedScripts[0]
                .comments
                .reviewComment
                .text,
            'Review me'
        );

        assert.equal(
            result.report
                .quarantinedReviewBlockCount,
            1
        );

        assert.equal(
            result.report
                .remainingUnsafeBlockCount,
            0
        );

        assert.equal(
            result.report
                .isLoadSafe,
            true
        );
    }
);

test(
    'review quarantine removes an unsafe Upload program without partially executing it',
    () => {
        const project = {
            extensions: [
                'arduinoUno'
            ],

            monitors: [],

            easybloxProject: {
                schemaVersion:
                    1,
                selectedBoardId:
                    'arduino-uno',
                programMode:
                    'upload',
                qrCodes: [],
                qrOverlayPosition:
                    'topRight'
            },

            targets: [
                {
                    name:
                        'Stage',
                    isStage:
                        true,
                    blocks: {},
                    comments: {}
                }
            ],

            easybloxUploadPrograms: {
                'arduino-uno': {
                    blocks: {
                        uploadHat: {
                            opcode:
                                'arduinoUno_whenArduinoUnoStart',
                            next:
                                'legacy',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        legacy: {
                            opcode:
                                'pictoUnknown_read',
                            next:
                                null,
                            parent:
                                'uploadHat',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                false
                        }
                    }
                }
            }
        };

        const result =
            quarantineUnsafeReviewContent(
                project
            );

        assert.equal(
            result.project
                .easybloxUploadPrograms,
            undefined
        );

        assert.equal(
            result.project
                .easybloxProject
                .programMode,
            'stage'
        );

        const review =
            result.project
                .easybloxProject
                .conversionReview;

        assert.equal(
            review
                .quarantinedUploadPrograms
                .length,
            1
        );

        assert.equal(
            review
                .quarantinedUploadPrograms[0]
                .blocks
                .legacy
                .opcode,
            'pictoUnknown_read'
        );

        assert.equal(
            result.report
                .quarantinedUploadProgramCount,
            1
        );

        assert.equal(
            result.report
                .remainingUnsafeBlockCount,
            0
        );

        assert.equal(
            result.report
                .isLoadSafe,
            true
        );
    }
);

test(
    'review quarantine leaves fully supported projects active and unchanged',
    () => {
        const project = {
            extensions: [],

            monitors: [],

            easybloxProject: {
                schemaVersion:
                    1,
                selectedBoardId:
                    'arduino-uno',
                programMode:
                    'stage',
                qrCodes: [],
                qrOverlayPosition:
                    'topRight'
            },

            targets: [
                {
                    name:
                        'Stage',
                    isStage:
                        true,
                    comments: {},
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
                        }
                    }
                }
            ]
        };

        const result =
            quarantineUnsafeReviewContent(
                project
            );

        assert.ok(
            result.project
                .targets[0]
                .blocks
                .flag
        );

        assert.equal(
            result.project
                .easybloxProject
                .conversionReview,
            undefined
        );

        assert.equal(
            result.report
                .quarantinedReviewBlockCount,
            0
        );

        assert.equal(
            result.report
                .isLoadSafe,
            true
        );
    }
);

test(
    'review quarantine accepts canonical EasyBlox shadow opcodes declared by mapping transforms',
    () => {
        const project = {
            extensions: [
                'displays'
            ],

            monitors: [],

            easybloxProject: {
                schemaVersion:
                    1,
                selectedBoardId:
                    'arduino-uno',
                programMode:
                    'stage',
                qrCodes: [],
                qrOverlayPosition:
                    'topRight'
            },

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    comments: {},

                    blocks: {
                        matrix: {
                            opcode:
                                'displays_matrixWrite',
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
                                'easyblox_matrix_8x8',
                            next:
                                null,
                            parent:
                                'matrix',
                            inputs: {},
                            fields: {
                                MATRIX: [
                                    '00FFAA558101187E',
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
            quarantineUnsafeReviewContent(
                project
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
                .easybloxProject
                .conversionReview,
            undefined
        );

        assert.equal(
            result.report
                .quarantinedReviewBlockCount,
            0
        );

        assert.equal(
            result.report
                .remainingUnsafeBlockCount,
            0
        );

        assert.equal(
            result.report
                .isLoadSafe,
            true
        );
    }
);
