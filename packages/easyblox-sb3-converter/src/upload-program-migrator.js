const SOURCE_BOARD_ARDUINO_UNO =
    'Arduino Uno';

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
            typeof convertedProject
                .boardSelected ===
                'string' ?
                convertedProject
                    .boardSelected
                    .trim() :
                null;

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

                deferred:
                    []
            }
        };
    };

module.exports = {
    migratePictoBloxProjectStructure
};
