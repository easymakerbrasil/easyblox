const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    COMPATIBILITY_STATUSES,
    aggregateProjectCorpus,
    createProjectSignature
} = require('..');

const createProjectA =
    () => ({
        targets: [
            {
                name:
                    'Sprite1',
                blocks: {
                    move1: {
                        opcode:
                            'motion_movesteps',
                        shadow:
                            false
                    },
                    move2: {
                        opcode:
                            'motion_movesteps',
                        shadow:
                            false
                    },
                    unknown: {
                        opcode:
                            'picto_unknown',
                        shadow:
                            false
                    },
                    costume: {
                        opcode:
                            'looks_costume',
                        shadow:
                            true
                    }
                }
            }
        ],
        extensions: [
            'extA'
        ]
    });

const createProjectB =
    () => ({
        targets: [
            {
                name:
                    'Stage',
                isStage:
                    true,
                blocks: {
                    wait: {
                        opcode:
                            'control_wait',
                        shadow:
                            false
                    },
                    mapped: {
                        opcode:
                            'picto_mappable',
                        shadow:
                            false
                    },
                    slider: {
                        opcode:
                            'math_slider_0_100',
                        shadow:
                            true
                    }
                }
            }
        ],
        extensions: [
            'extA',
            'extB'
        ]
    });

const catalog = [
    {
        opcode:
            'motion_movesteps',
        status:
            COMPATIBILITY_STATUSES
                .SUPPORTED
    },
    {
        opcode:
            'control_wait',
        status:
            COMPATIBILITY_STATUSES
                .SUPPORTED
    },
    {
        opcode:
            'picto_mappable',
        status:
            COMPATIBILITY_STATUSES
                .MAPPABLE,
        targetOpcode:
            'easyblox_mapped'
    }
];

test(
    'corpus aggregator combines project frequency compatibility shadows extensions and duplicates',
    () => {
        const projectA =
            createProjectA();

        const result =
            aggregateProjectCorpus(
                [
                    {
                        id:
                            'A.sb3',
                        project:
                            projectA
                    },
                    {
                        id:
                            'A-copy.sb3',
                        project:
                            JSON.parse(
                                JSON.stringify(
                                    projectA
                                )
                            )
                    },
                    {
                        id:
                            'B.sb3',
                        project:
                            createProjectB()
                    },
                    {
                        id:
                            'Broken.sb3',
                        project:
                            {}
                    }
                ],
                catalog
            );

        assert.deepEqual(
            result.summary,
            {
                projectCount:
                    4,
                analyzedProjectCount:
                    3,
                failedProjectCount:
                    1,
                blockCount:
                    11,
                functionalBlockCount:
                    8,
                shadowBlockCount:
                    3,
                uniqueFunctionalOpcodeCount:
                    4,
                uniqueShadowOpcodeCount:
                    2,
                declaredExtensionCount:
                    2,
                distinctProjectJsonCount:
                    2,
                duplicateGroupCount:
                    1
            }
        );

        assert.deepEqual(
            result.compatibility,
            {
                supported: {
                    blockCount:
                        5,
                    projectCount:
                        3,
                    uniqueOpcodeCount:
                        2
                },
                mappable: {
                    blockCount:
                        1,
                    projectCount:
                        1,
                    uniqueOpcodeCount:
                        1
                },
                unsupported: {
                    blockCount:
                        0,
                    projectCount:
                        0,
                    uniqueOpcodeCount:
                        0
                },
                unknown: {
                    blockCount:
                        2,
                    projectCount:
                        2,
                    uniqueOpcodeCount:
                        1
                }
            }
        );

        assert.deepEqual(
            result.functionalOpcodes,
            [
                {
                    opcode:
                        'motion_movesteps',
                    namespace:
                        'motion',
                    status:
                        'supported',
                    blockCount:
                        4,
                    projectIds:
                        [
                            'A-copy.sb3',
                            'A.sb3'
                        ],
                    projectCount:
                        2
                },
                {
                    opcode:
                        'picto_unknown',
                    namespace:
                        'picto',
                    status:
                        'unknown',
                    blockCount:
                        2,
                    projectIds:
                        [
                            'A-copy.sb3',
                            'A.sb3'
                        ],
                    projectCount:
                        2
                },
                {
                    opcode:
                        'control_wait',
                    namespace:
                        'control',
                    status:
                        'supported',
                    blockCount:
                        1,
                    projectIds:
                        [
                            'B.sb3'
                        ],
                    projectCount:
                        1
                },
                {
                    opcode:
                        'picto_mappable',
                    namespace:
                        'picto',
                    status:
                        'mappable',
                    blockCount:
                        1,
                    projectIds:
                        [
                            'B.sb3'
                        ],
                    projectCount:
                        1,
                    targetOpcode:
                        'easyblox_mapped'
                }
            ]
        );

        assert.deepEqual(
            result.shadowOpcodes,
            [
                {
                    opcode:
                        'looks_costume',
                    namespace:
                        'looks',
                    blockCount:
                        2,
                    projectIds:
                        [
                            'A-copy.sb3',
                            'A.sb3'
                        ],
                    projectCount:
                        2
                },
                {
                    opcode:
                        'math_slider_0_100',
                    namespace:
                        'math',
                    blockCount:
                        1,
                    projectIds:
                        [
                            'B.sb3'
                        ],
                    projectCount:
                        1
                }
            ]
        );

        assert.deepEqual(
            result.extensions,
            [
                {
                    extensionId:
                        'extA',
                    projectCount:
                        3,
                    projectIds:
                        [
                            'A-copy.sb3',
                            'A.sb3',
                            'B.sb3'
                        ]
                },
                {
                    extensionId:
                        'extB',
                    projectCount:
                        1,
                    projectIds:
                        [
                            'B.sb3'
                        ]
                }
            ]
        );

        assert.equal(
            result.duplicateGroups.length,
            1
        );

        assert.deepEqual(
            result.duplicateGroups[0]
                .projectIds,
            [
                'A-copy.sb3',
                'A.sb3'
            ]
        );

        assert.deepEqual(
            result.errors,
            [
                {
                    id:
                        'Broken.sb3',
                    error:
                        'PictoBlox project inventory requires a targets array'
                }
            ]
        );
    }
);

test(
    'corpus aggregator preserves deterministic project signatures',
    () => {
        const project =
            createProjectA();

        assert.equal(
            createProjectSignature(
                project
            ),
            createProjectSignature(
                JSON.parse(
                    JSON.stringify(
                        project
                    )
                )
            )
        );

        assert.notEqual(
            createProjectSignature(
                project
            ),
            createProjectSignature(
                createProjectB()
            )
        );
    }
);

test(
    'corpus aggregator rejects invalid corpus structure and duplicate project ids',
    () => {
        assert.throws(
            () =>
                aggregateProjectCorpus(
                    null
                ),
            /array of entries/
        );

        assert.throws(
            () =>
                aggregateProjectCorpus([
                    {
                        id:
                            ''
                    }
                ]),
            /non-empty id/
        );

        assert.throws(
            () =>
                aggregateProjectCorpus([
                    {
                        id:
                            'same.sb3',
                        project:
                            createProjectA()
                    },
                    {
                        id:
                            'same.sb3',
                        project:
                            createProjectB()
                    }
                ]),
            /Duplicate corpus project id/
        );
    }
);
