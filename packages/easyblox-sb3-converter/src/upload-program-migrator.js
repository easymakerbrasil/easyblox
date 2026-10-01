const {
    createEasyBloxSupportCatalog
} = require(
    '@easymaker/easyblox-pictoblox-analyzer'
);

const SOURCE_BOARD_ARDUINO_UNO =
    'Arduino Uno';

const SOURCE_BOARD_NONE =
    'None';

const TARGET_BOARD_ARDUINO_UNO =
    'arduino-uno';

const UPLOAD_ENTRY_OPCODE =
    'arduinoUno_whenArduinoUnoStart';

const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const normalizePictoBloxSourceBoard =
    boardSelected => {
        if (
            typeof boardSelected !==
                'string'
        ) {
            return null;
        }

        const normalized =
            boardSelected.trim();

        if (
            normalized.length ===
                0 ||
            normalized ===
                SOURCE_BOARD_NONE
        ) {
            return null;
        }

        return normalized;
    };

let easyBloxSupportMetadata =
    null;

const getEasyBloxSupportMetadata =
    () => {
        if (
            easyBloxSupportMetadata
        ) {
            return easyBloxSupportMetadata;
        }

        const supportCatalog =
            createEasyBloxSupportCatalog();

        const supportedOpcodes =
            new Set();

        const extensionByOpcode =
            new Map();

        supportCatalog.entries
            .forEach(
                entry => {
                    supportedOpcodes.add(
                        entry.opcode
                    );

                    if (
                        typeof entry.extensionId ===
                            'string' &&
                        entry.extensionId.length >
                            0
                    ) {
                        extensionByOpcode.set(
                            entry.opcode,
                            entry.extensionId
                        );
                    }
                }
            );

        easyBloxSupportMetadata = {
            supportedOpcodes,
            extensionByOpcode
        };

        return easyBloxSupportMetadata;
    };

const forEachProjectBlock =
    (
        project,
        callback
    ) => {
        const visitBlocks =
            blocks => {
                if (
                    !blocks ||
                    typeof blocks !==
                        'object' ||
                    Array.isArray(
                        blocks
                    )
                ) {
                    return;
                }

                Object.values(
                    blocks
                ).forEach(
                    block => {
                        if (
                            !block ||
                            typeof block !==
                                'object' ||
                            Array.isArray(
                                block
                            )
                        ) {
                            return;
                        }

                        callback(
                            block
                        );
                    }
                );
            };

        (
            Array.isArray(
                project.targets
            ) ?
                project.targets :
                []
        ).forEach(
            target => {
                if (target) {
                    visitBlocks(
                        target.blocks
                    );
                }
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

        Object.values(
            uploadPrograms
        ).forEach(
            program => {
                if (program) {
                    visitBlocks(
                        program.blocks
                    );
                }
            }
        );
    };

const cleanupUnsupportedMonitors =
    project => {
        if (
            !Array.isArray(
                project.monitors
            )
        ) {
            return {
                removedMonitorCount:
                    0,
                removedMonitors:
                    []
            };
        }

        const {
            supportedOpcodes
        } =
            getEasyBloxSupportMetadata();

        const retainedMonitors = [];
        const removedMonitors = [];

        project.monitors
            .forEach(
                (
                    monitor,
                    index
                ) => {
                    const opcode =
                        monitor &&
                        typeof monitor.opcode ===
                            'string' &&
                        monitor.opcode.length >
                            0 ?
                            monitor.opcode :
                            null;

                    if (
                        opcode &&
                        supportedOpcodes.has(
                            opcode
                        )
                    ) {
                        retainedMonitors.push(
                            monitor
                        );

                        return;
                    }

                    removedMonitors.push({
                        index,

                        reason:
                            opcode ?
                                'unsupported-monitor-opcode' :
                                'invalid-monitor-opcode',

                        monitor:
                            cloneJson(
                                monitor
                            )
                    });
                }
            );

        project.monitors =
            retainedMonitors;

        return {
            removedMonitorCount:
                removedMonitors.length,

            removedMonitors
        };
    };

const normalizeProjectExtensions =
    project => {
        const {
            extensionByOpcode
        } =
            getEasyBloxSupportMetadata();

        const extensionIds =
            new Set();

        const collectOpcode =
            opcode => {
                if (
                    typeof opcode !==
                        'string'
                ) {
                    return;
                }

                const extensionId =
                    extensionByOpcode.get(
                        opcode
                    );

                if (extensionId) {
                    extensionIds.add(
                        extensionId
                    );
                }
            };

        forEachProjectBlock(
            project,
            block => {
                collectOpcode(
                    block.opcode
                );
            }
        );

        if (
            Array.isArray(
                project.monitors
            )
        ) {
            project.monitors
                .forEach(
                    monitor => {
                        if (monitor) {
                            collectOpcode(
                                monitor.opcode
                            );
                        }
                    }
                );
        }

        project.extensions =
            Array.from(
                extensionIds
            ).sort();

        return [
            ...project.extensions
        ];
    };

const cleanupProjectMetadata =
    project => {
        const monitorCleanup =
            cleanupUnsupportedMonitors(
                project
            );

        const extensions =
            normalizeProjectExtensions(
                project
            );

        return {
            removedUploadCommentCount:
                0,

            removedUploadComments:
                [],

            removedMonitorCount:
                monitorCleanup
                    .removedMonitorCount,

            removedMonitors:
                monitorCleanup
                    .removedMonitors,

            extensions
        };
    };

const cleanupMigratedComments =
    (
        target,
        migratedBlocks,
        migratedBlockIds
    ) => {
        const migratedBlockIdSet =
            new Set(
                migratedBlockIds
            );

        const commentIds =
            new Set();

        const comments =
            target &&
            target.comments &&
            typeof target.comments ===
                'object' &&
            !Array.isArray(
                target.comments
            ) ?
                target.comments :
                null;

        if (comments) {
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
                        migratedBlockIdSet.has(
                            comment.blockId
                        )
                    ) {
                        commentIds.add(
                            commentId
                        );
                    }
                }
            );
        }

        migratedBlockIds
            .forEach(
                blockId => {
                    const block =
                        migratedBlocks[
                            blockId
                        ];

                    if (
                        !block ||
                        typeof block !==
                            'object'
                    ) {
                        return;
                    }

                    if (
                        typeof block.comment ===
                            'string' &&
                        block.comment.length >
                            0
                    ) {
                        commentIds.add(
                            block.comment
                        );
                    }

                    if (
                        Object.prototype
                            .hasOwnProperty.call(
                                block,
                                'comment'
                            )
                    ) {
                        delete block.comment;
                    }
                }
            );

        const removedUploadComments =
            Array.from(
                commentIds
            )
                .sort()
                .map(
                    commentId => {
                        let comment =
                            null;

                        if (
                            comments &&
                            Object.prototype
                                .hasOwnProperty.call(
                                    comments,
                                    commentId
                                )
                        ) {
                            comment =
                                cloneJson(
                                    comments[
                                        commentId
                                    ]
                                );

                            delete comments[
                                commentId
                            ];
                        }

                        return {
                            commentId,
                            comment
                        };
                    }
                );

        return {
            removedUploadCommentCount:
                removedUploadComments.length,

            removedUploadComments
        };
    };

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

const collectOwnedBlockIds =
    (
        blocks,
        rootBlockId
    ) => {
        const visited =
            new Set();

        const orderedBlockIds = [];

        const visit =
            (
                blockId,
                expectedParent,
                isRoot
            ) => {
                if (
                    visited.has(
                        blockId
                    )
                ) {
                    return {
                        ok: true
                    };
                }

                if (
                    !Object.prototype
                        .hasOwnProperty.call(
                            blocks,
                            blockId
                        )
                ) {
                    return {
                        ok: false,
                        reason:
                            'missing-owned-block'
                    };
                }

                const block =
                    blocks[
                        blockId
                    ];

                if (
                    !block ||
                    typeof block !==
                        'object' ||
                    Array.isArray(
                        block
                    )
                ) {
                    return {
                        ok: false,
                        reason:
                            'invalid-owned-block'
                    };
                }

                if (isRoot) {
                    if (
                        block.parent !==
                            null
                    ) {
                        return {
                            ok: false,
                            reason:
                                'entry-point-parent-mismatch'
                        };
                    }

                    if (
                        block.topLevel !==
                            true
                    ) {
                        return {
                            ok: false,
                            reason:
                                'entry-point-not-top-level'
                        };
                    }
                } else if (
                    block.parent !==
                    expectedParent
                ) {
                    return {
                        ok: false,
                        reason:
                            'block-parent-mismatch'
                    };
                }

                visited.add(
                    blockId
                );

                orderedBlockIds.push(
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
                    for (
                        const input of
                            Object.values(
                                block.inputs
                            )
                    ) {
                        const referencedBlockIds =
                            getReferencedBlockIds(
                                input
                            );

                        for (
                            const referencedBlockId of
                                referencedBlockIds
                        ) {
                            const result =
                                visit(
                                    referencedBlockId,
                                    blockId,
                                    false
                                );

                            if (!result.ok) {
                                return result;
                            }
                        }
                    }
                }

                if (
                    block.next !==
                        null &&
                    typeof block.next !==
                        'undefined'
                ) {
                    if (
                        typeof block.next !==
                            'string' ||
                        block.next.length ===
                            0
                    ) {
                        return {
                            ok: false,
                            reason:
                                'invalid-next-reference'
                        };
                    }

                    const nextResult =
                        visit(
                            block.next,
                            blockId,
                            false
                        );

                    if (!nextResult.ok) {
                        return nextResult;
                    }
                }

                return {
                    ok: true
                };
            };

        const result =
            visit(
                rootBlockId,
                null,
                true
            );

        if (!result.ok) {
            return result;
        }

        return {
            ok: true,
            blockIds:
                orderedBlockIds
        };
    };

const findUploadEntryPoints =
    project => {
        const entryPoints = [];

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
                if (
                    !target ||
                    !target.blocks ||
                    typeof target.blocks !==
                        'object' ||
                    Array.isArray(
                        target.blocks
                    )
                ) {
                    return;
                }

                Object.entries(
                    target.blocks
                ).forEach(
                    ([
                        blockId,
                        block
                    ]) => {
                        if (
                            !block ||
                            typeof block !==
                                'object' ||
                            Array.isArray(
                                block
                            ) ||
                            block.shadow ===
                                true ||
                            block.opcode !==
                                UPLOAD_ENTRY_OPCODE
                        ) {
                            return;
                        }

                        entryPoints.push({
                            targetIndex,
                            blockId
                        });
                    }
                );
            }
        );

        return entryPoints;
    };

const setEasyBloxProjectContext =
    (
        project,
        selectedBoardId,
        programMode
    ) => {
        project.easybloxProject = {
            schemaVersion:
                1,

            selectedBoardId,

            programMode,

            qrCodes:
                [],

            qrOverlayPosition:
                'topRight'
        };
    };

const migratePictoBloxProjectStructure =
    project => {
        const convertedProject =
            cloneJson(
                project
            );

        const sourceBoard =
            normalizePictoBloxSourceBoard(
                convertedProject
                    .boardSelected
            );

        if (
            sourceBoard &&
            sourceBoard !==
                SOURCE_BOARD_ARDUINO_UNO
        ) {
            return {
                project:
                    convertedProject,

                report: {
                    sourceBoard,

                    selectedBoardId:
                        null,

                    programMode:
                        null,

                    uploadProgramCreated:
                        false,

                    migratedBlockCount:
                        0,

                    migratedBlockIds:
                        [],

                    deferred: [
                        {
                            reason:
                                'unsupported-source-board'
                        }
                    ]
                }
            };
        }

        const selectedBoardId =
            sourceBoard ===
                SOURCE_BOARD_ARDUINO_UNO ?
                TARGET_BOARD_ARDUINO_UNO :
                null;

        if (
            Object.prototype
                .hasOwnProperty.call(
                    convertedProject,
                    'boardSelected'
                )
        ) {
            delete convertedProject
                .boardSelected;
        }

        const entryPoints =
            findUploadEntryPoints(
                convertedProject
            );

        if (
            selectedBoardId ===
                null ||
            entryPoints.length ===
                0
        ) {
            const metadataCleanup =
                cleanupProjectMetadata(
                    convertedProject
                );

            setEasyBloxProjectContext(
                convertedProject,
                selectedBoardId,
                'stage'
            );

            return {
                project:
                    convertedProject,

                report: {
                    sourceBoard,

                    selectedBoardId,

                    programMode:
                        'stage',

                    uploadProgramCreated:
                        false,

                    migratedBlockCount:
                        0,

                    migratedBlockIds:
                        [],

                    metadataCleanup,

                    deferred:
                        []
                }
            };
        }

        if (
            entryPoints.length >
                1
        ) {
            setEasyBloxProjectContext(
                convertedProject,
                selectedBoardId,
                'stage'
            );

            return {
                project:
                    convertedProject,

                report: {
                    sourceBoard,

                    selectedBoardId,

                    programMode:
                        'stage',

                    uploadProgramCreated:
                        false,

                    migratedBlockCount:
                        0,

                    migratedBlockIds:
                        [],

                    deferred: [
                        {
                            reason:
                                'multiple-upload-entry-points',

                            blockIds:
                                entryPoints.map(
                                    entryPoint =>
                                        entryPoint
                                            .blockId
                                )
                        }
                    ]
                }
            };
        }

        const entryPoint =
            entryPoints[0];

        const target =
            convertedProject
                .targets[
                entryPoint.targetIndex
            ];

        if (
            !target ||
            target.isStage !==
                true
        ) {
            setEasyBloxProjectContext(
                convertedProject,
                selectedBoardId,
                'stage'
            );

            return {
                project:
                    convertedProject,

                report: {
                    sourceBoard,

                    selectedBoardId,

                    programMode:
                        'stage',

                    uploadProgramCreated:
                        false,

                    migratedBlockCount:
                        0,

                    migratedBlockIds:
                        [],

                    deferred: [
                        {
                            reason:
                                'upload-entry-point-not-on-stage',

                            blockId:
                                entryPoint
                                    .blockId
                        }
                    ]
                }
            };
        }

        const collection =
            collectOwnedBlockIds(
                target.blocks,
                entryPoint.blockId
            );

        if (!collection.ok) {
            setEasyBloxProjectContext(
                convertedProject,
                selectedBoardId,
                'stage'
            );

            return {
                project:
                    convertedProject,

                report: {
                    sourceBoard,

                    selectedBoardId,

                    programMode:
                        'stage',

                    uploadProgramCreated:
                        false,

                    migratedBlockCount:
                        0,

                    migratedBlockIds:
                        [],

                    deferred: [
                        {
                            reason:
                                collection.reason,

                            blockId:
                                entryPoint
                                    .blockId
                        }
                    ]
                }
            };
        }

        const migratedBlocks = {};

        collection
            .blockIds
            .forEach(
                blockId => {
                    migratedBlocks[
                        blockId
                    ] =
                        cloneJson(
                            target.blocks[
                                blockId
                            ]
                        );
                }
            );

        const commentCleanup =
            cleanupMigratedComments(
                target,
                migratedBlocks,
                collection.blockIds
            );

        const metadataCleanup =
            cleanupProjectMetadata(
                convertedProject
            );

        metadataCleanup
            .removedUploadCommentCount =
                commentCleanup
                    .removedUploadCommentCount;

        metadataCleanup
            .removedUploadComments =
                commentCleanup
                    .removedUploadComments;

        collection
            .blockIds
            .forEach(
                blockId => {
                    delete target.blocks[
                        blockId
                    ];
                }
            );

        convertedProject
            .easybloxUploadPrograms = {
                [
                    TARGET_BOARD_ARDUINO_UNO
                ]: {
                    blocks:
                        migratedBlocks
                }
            };

        setEasyBloxProjectContext(
            convertedProject,
            selectedBoardId,
            'upload'
        );

        return {
            project:
                convertedProject,

            report: {
                sourceBoard,

                selectedBoardId,

                programMode:
                    'upload',

                uploadProgramCreated:
                    true,

                migratedEntryPointId:
                    entryPoint
                        .blockId,

                migratedBlockCount:
                    collection
                        .blockIds
                        .length,

                migratedBlockIds:
                    [
                        ...collection
                            .blockIds
                    ],

                metadataCleanup,

                deferred:
                    []
            }
        };
    };

module.exports = {
    migratePictoBloxProjectStructure,
    normalizeProjectExtensions
};
