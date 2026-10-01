const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    migratePictoBloxQrReaderPatterns
} = require('..');

const createReaderProject =
    ({
        videoState =
            'on',

        withBoundingBox =
            true,

        bootstrapInputs =
            {}
    } = {}) => {
        const blocks = {
            flag: {
                opcode:
                    'event_whenflagclicked',
                next:
                    'video',
                parent:
                    null,
                inputs: {},
                fields: {},
                shadow:
                    false,
                topLevel:
                    true,
                x:
                    10,
                y:
                    20
            },

            video: {
                opcode:
                    'qrCodeScanner_toggleStageVideoFeed',
                next:
                    'forever',
                parent:
                    'flag',
                inputs:
                    bootstrapInputs,
                fields: {
                    VIDEO_STATE: [
                        videoState,
                        null
                    ]
                },
                shadow:
                    false,
                topLevel:
                    false
            },

            forever: {
                opcode:
                    'control_forever',
                next:
                    null,
                parent:
                    'video',
                inputs: {
                    SUBSTACK: [
                        2,
                        withBoundingBox ?
                            'analyse' :
                            'analyse'
                    ]
                },
                fields: {},
                shadow:
                    false,
                topLevel:
                    false
            },

            analyse: {
                opcode:
                    'qrCodeScanner_analyseImage',
                next:
                    withBoundingBox ?
                        'boundingBox' :
                        'after',
                parent:
                    'forever',
                inputs: {},
                fields: {},
                shadow:
                    false,
                topLevel:
                    false
            },

            after: {
                opcode:
                    'control_if',
                next:
                    null,
                parent:
                    withBoundingBox ?
                        'boundingBox' :
                        'analyse',
                inputs: {},
                fields: {},
                shadow:
                    false,
                topLevel:
                    false
            }
        };

        if (withBoundingBox) {
            blocks.boundingBox = {
                opcode:
                    'qrCodeScanner_drawBoundingBox',
                next:
                    'after',
                parent:
                    'analyse',
                inputs: {},
                fields: {},
                shadow:
                    false,
                topLevel:
                    false
            };
        }

        return {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    blocks
                }
            ]
        };
    };

test(
    'QR reader migrator converts normal camera reader, enables boundary and removes explicit analysis blocks',
    () => {
        const project =
            createReaderProject();

        const original =
            JSON.parse(
                JSON.stringify(
                    project
                )
            );

        const result =
            migratePictoBloxQrReaderPatterns(
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
            blocks.video.opcode,
            'easybloxQr_startReader'
        );

        assert.deepEqual(
            blocks.video.fields,
            {
                SOURCE: [
                    'cameraNormal',
                    null
                ]
            }
        );

        const boundaryBlockId =
            blocks.video.next;

        assert.equal(
            blocks[
                boundaryBlockId
            ].opcode,
            'easybloxQr_setBoundary'
        );

        assert.deepEqual(
            blocks[
                boundaryBlockId
            ].fields,
            {
                STATE: [
                    'on',
                    null
                ]
            }
        );

        assert.equal(
            blocks[
                boundaryBlockId
            ].next,
            'forever'
        );

        assert.equal(
            blocks.forever.parent,
            boundaryBlockId
        );

        assert.deepEqual(
            blocks.forever.inputs.SUBSTACK,
            [
                2,
                'after'
            ]
        );

        assert.equal(
            blocks.after.parent,
            'forever'
        );

        assert.equal(
            blocks.analyse,
            undefined
        );

        assert.equal(
            blocks.boundingBox,
            undefined
        );

        assert.equal(
            result.report
                .migratedReaderCount,
            1
        );

        assert.equal(
            result.report
                .resolvedReviewBlockCount,
            3
        );

        assert.equal(
            result.report
                .remainingVisualToggleCount,
            0
        );

        assert.deepEqual(
            result.report
                .deferred,
            []
        );
    }
);

test(
    'QR reader migrator preserves flipped camera semantics and explicitly disables absent boundary',
    () => {
        const project =
            createReaderProject({
                videoState:
                    'onFlipped',
                withBoundingBox:
                    false
            });

        const result =
            migratePictoBloxQrReaderPatterns(
                project
            );

        const blocks =
            result
                .project
                .targets[0]
                .blocks;

        assert.deepEqual(
            blocks.video.fields,
            {
                SOURCE: [
                    'cameraMirrored',
                    null
                ]
            }
        );

        const boundaryBlock =
            blocks[
                blocks.video.next
            ];

        assert.deepEqual(
            boundaryBlock.fields,
            {
                STATE: [
                    'off',
                    null
                ]
            }
        );

        assert.deepEqual(
            blocks.forever.inputs.SUBSTACK,
            [
                2,
                'after'
            ]
        );

        assert.equal(
            result.report
                .resolvedReviewBlockCount,
            2
        );
    }
);

test(
    'QR reader migrator leaves visual-only video controls untouched',
    () => {
        const project =
            createReaderProject();

        project
            .targets[0]
            .blocks
            .visualOff = {
                opcode:
                    'qrCodeScanner_toggleStageVideoFeed',
                next:
                    null,
                parent:
                    null,
                inputs: {},
                fields: {
                    VIDEO_STATE: [
                        'off',
                        null
                    ]
                },
                shadow:
                    false,
                topLevel:
                    true,
                x:
                    200,
                y:
                    100
            };

        const result =
            migratePictoBloxQrReaderPatterns(
                project
            );

        assert.equal(
            result
                .project
                .targets[0]
                .blocks
                .visualOff
                .opcode,
            'qrCodeScanner_toggleStageVideoFeed'
        );

        assert.equal(
            result.report
                .remainingVisualToggleCount,
            1
        );
    }
);

test(
    'QR reader migrator defers a reader bootstrap with unsupported serialized inputs',
    () => {
        const project =
            createReaderProject({
                bootstrapInputs: {
                    TRANSPARÊNCIA: [
                        1,
                        'invalidShadow'
                    ]
                }
            });

        project
            .targets[0]
            .blocks
            .invalidShadow = {
                opcode:
                    'matrixColour5x7Custom',
                next:
                    null,
                parent:
                    'video',
                inputs: {},
                fields: {
                    MATRIX: [
                        '',
                        null
                    ]
                },
                shadow:
                    true,
                topLevel:
                    false
            };

        const original =
            JSON.parse(
                JSON.stringify(
                    project
                )
            );

        const result =
            migratePictoBloxQrReaderPatterns(
                project
            );

        assert.deepEqual(
            result.project,
            original,
            'unsafe bootstrap is left unchanged'
        );

        assert.equal(
            result.report
                .migratedReaderCount,
            0
        );

        assert.equal(
            result.report
                .resolvedReviewBlockCount,
            0
        );

        assert.equal(
            result.report
                .remainingVisualToggleCount,
            1
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
                    analyseBlockId:
                        'analyse',
                    bootstrapBlockId:
                        'video',
                    reason:
                        'reader-bootstrap-has-inputs'
                }
            ]
        );
    }
);
