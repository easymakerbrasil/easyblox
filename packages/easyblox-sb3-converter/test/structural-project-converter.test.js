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
