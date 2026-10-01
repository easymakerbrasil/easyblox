const {
    createEasyBloxSupportCatalog,
    createPictoBloxMappingCatalog
} = require(
    '@easymaker/easyblox-pictoblox-analyzer/src/browser'
);

const {
    normalizeProjectExtensions
} = require('./upload-program-migrator');

const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

let safeSerializedOpcodeSet =
    null;

const getSafeSerializedOpcodeSet =
    () => {
        if (safeSerializedOpcodeSet) {
            return safeSerializedOpcodeSet;
        }

        const supportCatalog =
            createEasyBloxSupportCatalog();

        safeSerializedOpcodeSet =
            new Set([
                ...supportCatalog
                    .entries
                    .map(
                        entry =>
                            entry.opcode
                    ),

                ...supportCatalog
                    .serializedAuxiliaryEntries
                    .map(
                        entry =>
                            entry.opcode
                    )
            ]);

        const mappingCatalog =
            createPictoBloxMappingCatalog();

        mappingCatalog.entries
            .forEach(
                entry => {
                    if (
                        !entry.transform ||
                        !Array.isArray(
                            entry.transform
                                .arguments
                        )
                    ) {
                        return;
                    }

                    entry.transform
                        .arguments
                        .forEach(
                            argument => {
                                const shadowTransform =
                                    argument &&
                                    argument
                                        .shadowTransform;

                                if (
                                    shadowTransform &&
                                    typeof shadowTransform
                                        .targetOpcode ===
                                        'string' &&
                                    shadowTransform
                                        .targetOpcode
                                        .length >
                                        0
                                ) {
                                    safeSerializedOpcodeSet
                                        .add(
                                            shadowTransform
                                                .targetOpcode
                                        );
                                }
                            }
                        );
                }
            );

        return safeSerializedOpcodeSet;
    };

const isBlockObject =
    block =>
        Boolean(
            block &&
            typeof block ===
                'object' &&
            !Array.isArray(
                block
            )
        );

const getReferencedBlockIds =
    input => {
        if (
            !Array.isArray(
                input
            )
        ) {
            return [];
        }

        return input
            .slice(1)
            .filter(
                descriptor =>
                    typeof descriptor ===
                        'string' &&
                    descriptor.length >
                        0
            );
    };

const collectReachableBlockIds =
    (
        blocks,
        rootBlockId
    ) => {
        const visited =
            new Set();

        const visit =
            blockId => {
                if (
                    visited.has(
                        blockId
                    ) ||
                    !Object.prototype
                        .hasOwnProperty.call(
                            blocks,
                            blockId
                        )
                ) {
                    return;
                }

                const block =
                    blocks[
                        blockId
                    ];

                if (
                    !isBlockObject(
                        block
                    )
                ) {
                    return;
                }

                visited.add(
                    blockId
                );

                if (
                    block.inputs &&
                    typeof block.inputs ===
                        'object' &&
                    !Array.isArray(
                        block.inputs
                    )
                ) {
                    Object.values(
                        block.inputs
                    ).forEach(
                        input => {
                            getReferencedBlockIds(
                                input
                            ).forEach(
                                visit
                            );
                        }
                    );
                }

                if (
                    typeof block.next ===
                        'string' &&
                    block.next.length >
                        0
                ) {
                    visit(
                        block.next
                    );
                }
            };

        visit(
            rootBlockId
        );

        return Array.from(
            visited
        );
    };

const getUnsafeBlocks =
    (
        blocks,
        blockIds
    ) => {
        const safeSerializedOpcodes =
            getSafeSerializedOpcodeSet();

        return blockIds
            .filter(
                blockId => {
                    const block =
                        blocks[
                            blockId
                        ];

                    return (
                        !isBlockObject(
                            block
                        ) ||
                        typeof block.opcode !==
                            'string' ||
                        !safeSerializedOpcodes.has(
                            block.opcode
                        )
                    );
                }
            )
            .map(
                blockId => {
                    const block =
                        blocks[
                            blockId
                        ];

                    return {
                        blockId,

                        opcode:
                            isBlockObject(
                                block
                            ) &&
                            typeof block.opcode ===
                                'string' ?
                                block.opcode :
                                null
                    };
                }
            );
    };

const cloneBlockSubset =
    (
        blocks,
        blockIds
    ) => {
        const subset = {};

        blockIds.forEach(
            blockId => {
                if (
                    Object.prototype
                        .hasOwnProperty.call(
                            blocks,
                            blockId
                        )
                ) {
                    subset[
                        blockId
                    ] =
                        cloneJson(
                            blocks[
                                blockId
                            ]
                        );
                }
            }
        );

        return subset;
    };

const collectCommentSnapshot =
    (
        target,
        blocks,
        blockIds
    ) => {
        const comments =
            target &&
            target.comments &&
            typeof target.comments ===
                'object' &&
            !Array.isArray(
                target.comments
            ) ?
                target.comments :
                {};

        const blockIdSet =
            new Set(
                blockIds
            );

        const commentIds =
            new Set();

        Object.entries(
            comments
        ).forEach(
            ([
                commentId,
                comment
            ]) => {
                if (
                    comment &&
                    typeof comment ===
                        'object' &&
                    blockIdSet.has(
                        comment.blockId
                    )
                ) {
                    commentIds.add(
                        commentId
                    );
                }
            }
        );

        blockIds.forEach(
            blockId => {
                const block =
                    blocks[
                        blockId
                    ];

                if (
                    isBlockObject(
                        block
                    ) &&
                    typeof block.comment ===
                        'string' &&
                    block.comment.length >
                        0
                ) {
                    commentIds.add(
                        block.comment
                    );
                }
            }
        );

        const snapshot = {};

        Array.from(
            commentIds
        )
            .sort()
            .forEach(
                commentId => {
                    if (
                        Object.prototype
                            .hasOwnProperty.call(
                                comments,
                                commentId
                            )
                    ) {
                        snapshot[
                            commentId
                        ] =
                            cloneJson(
                                comments[
                                    commentId
                                ]
                            );
                    }
                }
            );

        return {
            commentIds:
                Array.from(
                    commentIds
                ).sort(),

            comments:
                snapshot
        };
    };

const quarantineTargetScripts =
    (
        target,
        targetIndex
    ) => {
        if (
            !target ||
            !target.blocks ||
            typeof target.blocks !==
                'object' ||
            Array.isArray(
                target.blocks
            )
        ) {
            return [];
        }

        const blocks =
            target.blocks;

        const coveredBlockIds =
            new Set();

        const candidates = [];

        Object.keys(
            blocks
        )
            .sort()
            .forEach(
                rootBlockId => {
                    if (
                        coveredBlockIds.has(
                            rootBlockId
                        )
                    ) {
                        return;
                    }

                    const rootBlock =
                        blocks[
                            rootBlockId
                        ];

                    if (
                        !isBlockObject(
                            rootBlock
                        ) ||
                        rootBlock.shadow ===
                            true ||
                        rootBlock.topLevel !==
                            true
                    ) {
                        return;
                    }

                    const blockIds =
                        collectReachableBlockIds(
                            blocks,
                            rootBlockId
                        );

                    blockIds.forEach(
                        blockId => {
                            coveredBlockIds.add(
                                blockId
                            );
                        }
                    );

                    const unsafeBlocks =
                        getUnsafeBlocks(
                            blocks,
                            blockIds
                        );

                    if (
                        unsafeBlocks.length >
                            0
                    ) {
                        candidates.push({
                            kind:
                                'script',

                            rootBlockId,

                            blockIds,

                            unsafeBlocks
                        });
                    }
                }
            );

        const orphanBlockIds =
            Object.keys(
                blocks
            )
                .filter(
                    blockId =>
                        !coveredBlockIds.has(
                            blockId
                        )
                )
                .sort();

        const unsafeOrphanBlocks =
            getUnsafeBlocks(
                blocks,
                orphanBlockIds
            );

        if (
            unsafeOrphanBlocks.length >
                0
        ) {
            candidates.push({
                kind:
                    'orphan-fragment',

                rootBlockId:
                    null,

                blockIds:
                    orphanBlockIds,

                unsafeBlocks:
                    unsafeOrphanBlocks
            });
        }

        const quarantined = [];

        const blockIdsToRemove =
            new Set();

        const commentIdsToRemove =
            new Set();

        candidates.forEach(
            candidate => {
                const commentSnapshot =
                    collectCommentSnapshot(
                        target,
                        blocks,
                        candidate.blockIds
                    );

                candidate.blockIds
                    .forEach(
                        blockId => {
                            blockIdsToRemove.add(
                                blockId
                            );
                        }
                    );

                commentSnapshot
                    .commentIds
                    .forEach(
                        commentId => {
                            commentIdsToRemove.add(
                                commentId
                            );
                        }
                    );

                quarantined.push({
                    domain:
                        'stage',

                    kind:
                        candidate.kind,

                    targetIndex,

                    targetName:
                        target.name ||
                        null,

                    rootBlockId:
                        candidate
                            .rootBlockId,

                    unsafeBlocks:
                        candidate
                            .unsafeBlocks,

                    blocks:
                        cloneBlockSubset(
                            blocks,
                            candidate.blockIds
                        ),

                    comments:
                        commentSnapshot
                            .comments
                });
            }
        );

        blockIdsToRemove
            .forEach(
                blockId => {
                    delete blocks[
                        blockId
                    ];
                }
            );

        if (
            target.comments &&
            typeof target.comments ===
                'object' &&
            !Array.isArray(
                target.comments
            )
        ) {
            commentIdsToRemove
                .forEach(
                    commentId => {
                        delete target.comments[
                            commentId
                        ];
                    }
                );
        }

        return quarantined;
    };

const quarantineUploadPrograms =
    project => {
        const uploadPrograms =
            project.easybloxUploadPrograms;

        if (
            !uploadPrograms ||
            typeof uploadPrograms !==
                'object' ||
            Array.isArray(
                uploadPrograms
            )
        ) {
            return [];
        }

        const quarantined = [];

        Object.keys(
            uploadPrograms
        )
            .sort()
            .forEach(
                boardId => {
                    const program =
                        uploadPrograms[
                            boardId
                        ];

                    const blocks =
                        program &&
                        program.blocks &&
                        typeof program.blocks ===
                            'object' &&
                        !Array.isArray(
                            program.blocks
                        ) ?
                            program.blocks :
                            {};

                    const blockIds =
                        Object.keys(
                            blocks
                        ).sort();

                    const unsafeBlocks =
                        getUnsafeBlocks(
                            blocks,
                            blockIds
                        );

                    if (
                        unsafeBlocks.length ===
                            0
                    ) {
                        return;
                    }

                    quarantined.push({
                        domain:
                            'upload',

                        boardId,

                        unsafeBlocks,

                        blocks:
                            cloneBlockSubset(
                                blocks,
                                blockIds
                            )
                    });

                    delete uploadPrograms[
                        boardId
                    ];

                    if (
                        project.easybloxProject &&
                        project
                            .easybloxProject
                            .programMode ===
                            'upload' &&
                        project
                            .easybloxProject
                            .selectedBoardId ===
                            boardId
                    ) {
                        project
                            .easybloxProject
                            .programMode =
                                'stage';
                    }
                }
            );

        if (
            Object.keys(
                uploadPrograms
            ).length ===
                0
        ) {
            delete project
                .easybloxUploadPrograms;
        }

        return quarantined;
    };

const collectRemainingUnsafeBlocks =
    project => {
        const remaining = [];

        (
            Array.isArray(
                project.targets
            ) ?
                project.targets :
                []
        ).forEach(
            (
                target,
                targetIndex
            ) => {
                const blocks =
                    target &&
                    target.blocks &&
                    typeof target.blocks ===
                        'object' &&
                    !Array.isArray(
                        target.blocks
                    ) ?
                        target.blocks :
                        {};

                getUnsafeBlocks(
                    blocks,
                    Object.keys(
                        blocks
                    )
                ).forEach(
                    record => {
                        remaining.push({
                            domain:
                                'stage',

                            targetIndex,

                            ...record
                        });
                    }
                );
            }
        );

        const uploadPrograms =
            project.easybloxUploadPrograms &&
            typeof project
                .easybloxUploadPrograms ===
                'object' &&
            !Array.isArray(
                project.easybloxUploadPrograms
            ) ?
                project
                    .easybloxUploadPrograms :
                {};

        Object.entries(
            uploadPrograms
        ).forEach(
            ([
                boardId,
                program
            ]) => {
                const blocks =
                    program &&
                    program.blocks &&
                    typeof program.blocks ===
                        'object' &&
                    !Array.isArray(
                        program.blocks
                    ) ?
                        program.blocks :
                        {};

                getUnsafeBlocks(
                    blocks,
                    Object.keys(
                        blocks
                    )
                ).forEach(
                    record => {
                        remaining.push({
                            domain:
                                'upload',

                            boardId,

                            ...record
                        });
                    }
                );
            }
        );

        return remaining;
    };

const quarantineUnsafeReviewContent =
    project => {
        const convertedProject =
            cloneJson(
                project
            );

        if (
            !convertedProject
                .easybloxProject ||
            typeof convertedProject
                .easybloxProject !==
                'object' ||
            Array.isArray(
                convertedProject
                    .easybloxProject
            )
        ) {
            return {
                project:
                    convertedProject,

                report: {
                    isLoadSafe:
                        false,

                    skippedReason:
                        'missing-easyblox-project-context',

                    quarantinedScriptCount:
                        0,

                    quarantinedUploadProgramCount:
                        0,

                    quarantinedBlockCount:
                        0,

                    quarantinedReviewBlockCount:
                        0,

                    remainingUnsafeBlockCount:
                        0,

                    remainingUnsafeBlocks:
                        []
                }
            };
        }

        const quarantinedScripts = [];

        (
            Array.isArray(
                convertedProject.targets
            ) ?
                convertedProject.targets :
                []
        ).forEach(
            (
                target,
                targetIndex
            ) => {
                quarantinedScripts.push(
                    ...quarantineTargetScripts(
                        target,
                        targetIndex
                    )
                );
            }
        );

        const quarantinedUploadPrograms =
            quarantineUploadPrograms(
                convertedProject
            );

        normalizeProjectExtensions(
            convertedProject
        );

        const remainingUnsafeBlocks =
            collectRemainingUnsafeBlocks(
                convertedProject
            );

        const quarantinedBlockCount =
            quarantinedScripts
                .reduce(
                    (
                        total,
                        record
                    ) =>
                        total +
                        Object.keys(
                            record.blocks
                        ).length,
                    0
                ) +
            quarantinedUploadPrograms
                .reduce(
                    (
                        total,
                        record
                    ) =>
                        total +
                        Object.keys(
                            record.blocks
                        ).length,
                    0
                );

        const quarantinedReviewBlockCount =
            quarantinedScripts
                .reduce(
                    (
                        total,
                        record
                    ) =>
                        total +
                        record
                            .unsafeBlocks
                            .length,
                    0
                ) +
            quarantinedUploadPrograms
                .reduce(
                    (
                        total,
                        record
                    ) =>
                        total +
                        record
                            .unsafeBlocks
                            .length,
                    0
                );

        if (
            quarantinedScripts.length >
                0 ||
            quarantinedUploadPrograms
                .length >
                0
        ) {
            convertedProject
                .easybloxProject
                .conversionReview = {
                    schemaVersion:
                        1,

                    quarantinedScripts,

                    quarantinedUploadPrograms
                };
        } else {
            delete convertedProject
                .easybloxProject
                .conversionReview;
        }

        return {
            project:
                convertedProject,

            report: {
                isLoadSafe:
                    remainingUnsafeBlocks
                        .length ===
                    0,

                skippedReason:
                    null,

                quarantinedScriptCount:
                    quarantinedScripts
                        .length,

                quarantinedUploadProgramCount:
                    quarantinedUploadPrograms
                        .length,

                quarantinedBlockCount,

                quarantinedReviewBlockCount,

                remainingUnsafeBlockCount:
                    remainingUnsafeBlocks
                        .length,

                remainingUnsafeBlocks
            }
        };
    };

module.exports = {
    quarantineUnsafeReviewContent
};
