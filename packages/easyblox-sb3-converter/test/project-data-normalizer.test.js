const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    normalizePictoBloxProjectData
} = require(
    '../src/project-data-normalizer'
);

test(
    'project data normalizer restores the canonical Scratch scalar default for PictoBlox one-item variable descriptors',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    variables: {
                        missingValue: [
                            'COR'
                        ],

                        numberValue: [
                            'CONTADOR',
                            5
                        ],

                        stringValue: [
                            'TEXTO',
                            'ok'
                        ],

                        booleanValue: [
                            'ATIVO',
                            true
                        ],

                        cloudValue: [
                            'NUVEM',
                            1,
                            true
                        ]
                    },

                    lists: {
                        items: [
                            'ITENS',
                            [
                                1,
                                'dois',
                                true
                            ]
                        ]
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
            normalizePictoBloxProjectData(
                project
            );

        assert.deepEqual(
            project,
            original,
            'normalizer does not mutate the source project'
        );

        assert.deepEqual(
            result.project
                .targets[0]
                .variables
                .missingValue,
            [
                'COR',
                0
            ]
        );

        assert.deepEqual(
            result.project
                .targets[0]
                .variables
                .numberValue,
            [
                'CONTADOR',
                5
            ]
        );

        assert.deepEqual(
            result.project
                .targets[0]
                .variables
                .stringValue,
            [
                'TEXTO',
                'ok'
            ]
        );

        assert.deepEqual(
            result.project
                .targets[0]
                .variables
                .booleanValue,
            [
                'ATIVO',
                true
            ]
        );

        assert.deepEqual(
            result.project
                .targets[0]
                .variables
                .cloudValue,
            [
                'NUVEM',
                1,
                true
            ]
        );

        assert.equal(
            result.report
                .normalizedVariableCount,
            1
        );

        assert.equal(
            result.report
                .deferredCount,
            0
        );

        assert.deepEqual(
            result.report
                .normalizedVariables,
            [
                {
                    targetIndex:
                        0,

                    targetName:
                        'Stage',

                    id:
                        'missingValue',

                    name:
                        'COR',

                    defaultValue:
                        0
                }
            ]
        );
    }
);

test(
    'project data normalizer defers unknown variable and list shapes instead of inventing values',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    variables: {
                        complexValue: [
                            'OBJETO',
                            {
                                x:
                                    1
                            }
                        ],

                        invalidName: [
                            123
                        ]
                    },

                    lists: {
                        invalidItems: [
                            'ITENS',
                            [
                                1,
                                {
                                    x:
                                        2
                                }
                            ]
                        ]
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
            normalizePictoBloxProjectData(
                project
            );

        assert.deepEqual(
            project,
            original
        );

        assert.deepEqual(
            result.project,
            original,
            'unknown shapes remain untouched for explicit review'
        );

        assert.equal(
            result.report
                .normalizedVariableCount,
            0
        );

        assert.equal(
            result.report
                .deferredCount,
            3
        );

        assert.deepEqual(
            result.report
                .deferred
                .map(
                    record =>
                        record.reason
                ),
            [
                'unsupported-variable-descriptor',
                'unsupported-variable-descriptor',
                'unsupported-list-descriptor'
            ]
        );
    }
);
