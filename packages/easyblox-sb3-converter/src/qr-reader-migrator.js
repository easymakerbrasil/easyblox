const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const SOURCE_VIDEO_OPCODE =
    'qrCodeScanner_toggleStageVideoFeed';

const SOURCE_ANALYSE_OPCODE =
    'qrCodeScanner_analyseImage';

const SOURCE_BOUNDING_BOX_OPCODE =
    'qrCodeScanner_drawBoundingBox';

const TARGET_START_READER_OPCODE =
    'easybloxQr_startReader';

const TARGET_SET_BOUNDARY_OPCODE =
    'easybloxQr_setBoundary';

const CAMERA_NORMAL =
    'cameraNormal';

const CAMERA_MIRRORED =
    'cameraMirrored';

const BOUNDARY_ON =
    'on';

const BOUNDARY_OFF =
    'off';

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

const getFieldValue =
    (
        block,
        fieldName
    ) => {
        if (
            !isBlockObject(
                block
            ) ||
            !block.fields ||
            !Object.prototype
                .hasOwnProperty.call(
                    block.fields,
                    fieldName
                )
        ) {
            return undefined;
        }

        const field =
            block.fields[
                fieldName
            ];

        if (
            !Array.isArray(
                field
            ) ||
            field.length ===
                0
        ) {
            return undefined;
        }

        return field[0];
    };

const getReaderSource =
    videoState => {
        if (
            videoState ===
                'on'
        ) {
            return CAMERA_NORMAL;
        }

        if (
            videoState ===
                'onFlipped'
        ) {
            return CAMERA_MIRRORED;
        }

        return null;
    };

const findReaderBootstrap =
    (
        blocks,
        analyseBlockId
    ) => {
        const analyseBlock =
            blocks[
                analyseBlockId
            ];

        if (
            !isBlockObject(
                analyseBlock
            )
        ) {
            return null;
        }

        let currentId =
            analyseBlock.parent;

        let passedForever =
            false;

        const visited =
            new Set();

        while (
            typeof currentId ===
                'string' &&
            currentId.length >
                0 &&
            !visited.has(
                currentId
            )
        ) {
            visited.add(
                currentId
            );

            const currentBlock =
                blocks[
                    currentId
                ];

            if (
                !isBlockObject(
                    currentBlock
                )
            ) {
                return null;
            }

            if (
                currentBlock.opcode ===
                    'control_forever'
            ) {
                passedForever =
                    true;
            }

            if (
                passedForever &&
                currentBlock.opcode ===
                    SOURCE_VIDEO_OPCODE
            ) {
                const videoState =
                    getFieldValue(
                        currentBlock,
                        'VIDEO_STATE'
                    );

                const readerSource =
                    getReaderSource(
                        videoState
                    );

                if (readerSource) {
                    return {
                        blockId:
                            currentId,

                        readerSource
                    };
                }
            }

            currentId =
                currentBlock.parent;
        }

        return null;
    };

const findAdjacentBoundingBox =
    (
        blocks,
        analyseBlockId
    ) => {
        const analyseBlock =
            blocks[
                analyseBlockId
            ];

        if (
            !isBlockObject(
                analyseBlock
            )
        ) {
            return {
                ok: false,
                reason:
                    'missing-analyse-block'
            };
        }

        const beforeId =
            typeof analyseBlock.parent ===
                'string' &&
            isBlockObject(
                blocks[
                    analyseBlock.parent
                ]
            ) &&
            blocks[
                analyseBlock.parent
            ].opcode ===
                SOURCE_BOUNDING_BOX_OPCODE &&
            blocks[
                analyseBlock.parent
            ].next ===
                analyseBlockId ?
                analyseBlock.parent :
                null;

        const afterId =
            typeof analyseBlock.next ===
                'string' &&
            isBlockObject(
                blocks[
                    analyseBlock.next
                ]
            ) &&
            blocks[
                analyseBlock.next
            ].opcode ===
                SOURCE_BOUNDING_BOX_OPCODE &&
            blocks[
                analyseBlock.next
            ].parent ===
                analyseBlockId ?
                analyseBlock.next :
                null;

        if (
            beforeId &&
            afterId
        ) {
            return {
                ok: false,
                reason:
                    'ambiguous-bounding-box'
            };
        }

        if (beforeId) {
            return {
                ok: true,
                blockId:
                    beforeId,
                position:
                    'before'
            };
        }

        if (afterId) {
            return {
                ok: true,
                blockId:
                    afterId,
                position:
                    'after'
            };
        }

        return {
            ok: true,
            blockId:
                null,
            position:
                null
        };
    };

const findIncomingStackReferences =
    (
        blocks,
        referencedBlockId
    ) => {
        const references = [];

        Object.entries(
            blocks
        ).forEach(
            ([
                blockId,
                block
            ]) => {
                if (
                    !isBlockObject(
                        block
                    ) ||
                    blockId ===
                        referencedBlockId
                ) {
                    return;
                }

                if (
                    block.next ===
                        referencedBlockId
                ) {
                    references.push({
                        kind:
                            'next',

                        blockId
                    });
                }

                if (
                    !block.inputs ||
                    typeof block.inputs !==
                        'object' ||
                    Array.isArray(
                        block.inputs
                    )
                ) {
                    return;
                }

                Object.entries(
                    block.inputs
                ).forEach(
                    ([
                        inputName,
                        input
                    ]) => {
                        if (
                            Array.isArray(
                                input
                            ) &&
                            input[0] ===
                                2 &&
                            input[1] ===
                                referencedBlockId
                        ) {
                            references.push({
                                kind:
                                    'input',

                                blockId,

                                inputName
                            });
                        }
                    }
                );
            }
        );

        return references;
    };

const removeStackBlock =
    (
        blocks,
        blockId
    ) => {
        const block =
            blocks[
                blockId
            ];

        if (
            !isBlockObject(
                block
            )
        ) {
            return {
                ok: false,
                reason:
                    'missing-removal-block'
            };
        }

        const references =
            findIncomingStackReferences(
                blocks,
                blockId
            );

        if (
            references.length !==
                1
        ) {
            return {
                ok: false,
                reason:
                    'ambiguous-stack-reference'
            };
        }

        const reference =
            references[0];

        const owner =
            blocks[
                reference.blockId
            ];

        const successorId =
            typeof block.next ===
                'string' ?
                block.next :
                null;

        if (
            reference.kind ===
                'next'
        ) {
            owner.next =
                successorId;
        } else if (
            successorId
        ) {
            owner.inputs[
                reference.inputName
            ] = [
                2,
                successorId
            ];
        } else {
            delete owner.inputs[
                reference.inputName
            ];
        }

        if (
            successorId &&
            isBlockObject(
                blocks[
                    successorId
                ]
            )
        ) {
            blocks[
                successorId
            ].parent =
                reference.blockId;
        }

        delete blocks[
            blockId
        ];

        return {
            ok: true
        };
    };

const createDerivedBlockId =
    (
        blocks,
        sourceBlockId
    ) => {
        const baseId =
            `${sourceBlockId}__easybloxQrBoundary`;

        if (
            !Object.prototype
                .hasOwnProperty.call(
                    blocks,
                    baseId
                )
        ) {
            return baseId;
        }

        let suffix =
            2;

        while (
            Object.prototype
                .hasOwnProperty.call(
                    blocks,
                    `${baseId}_${suffix}`
                )
        ) {
            suffix++;
        }

        return `${baseId}_${suffix}`;
    };

const validateEmptyBlockArguments =
    (
        block,
        reason
    ) => {
        const inputCount =
            block.inputs &&
            typeof block.inputs ===
                'object' &&
            !Array.isArray(
                block.inputs
            ) ?
                Object.keys(
                    block.inputs
                ).length :
                0;

        if (
            inputCount >
                0
        ) {
            return {
                ok: false,
                reason
            };
        }

        return {
            ok: true
        };
    };

const migrateReaderCandidate =
    (
        blocks,
        analyseBlockId,
        bootstrap
    ) => {
        const analyseBlock =
            blocks[
                analyseBlockId
            ];

        const bootstrapBlock =
            blocks[
                bootstrap.blockId
            ];

        if (
            !isBlockObject(
                analyseBlock
            ) ||
            !isBlockObject(
                bootstrapBlock
            )
        ) {
            return {
                ok: false,
                reason:
                    'missing-reader-block'
            };
        }

        const bootstrapArguments =
            validateEmptyBlockArguments(
                bootstrapBlock,
                'reader-bootstrap-has-inputs'
            );

        if (
            !bootstrapArguments.ok
        ) {
            return bootstrapArguments;
        }

        const analyseArguments =
            validateEmptyBlockArguments(
                analyseBlock,
                'analyse-block-has-inputs'
            );

        if (
            !analyseArguments.ok
        ) {
            return analyseArguments;
        }

        const boundingBox =
            findAdjacentBoundingBox(
                blocks,
                analyseBlockId
            );

        if (
            !boundingBox.ok
        ) {
            return boundingBox;
        }

        if (
            boundingBox.blockId
        ) {
            const boundingBoxBlock =
                blocks[
                    boundingBox.blockId
                ];

            const boundingBoxArguments =
                validateEmptyBlockArguments(
                    boundingBoxBlock,
                    'bounding-box-has-inputs'
                );

            if (
                !boundingBoxArguments.ok
            ) {
                return boundingBoxArguments;
            }
        }

        const boundaryState =
            boundingBox.blockId ?
                BOUNDARY_ON :
                BOUNDARY_OFF;

        const boundaryBlockId =
            createDerivedBlockId(
                blocks,
                bootstrap.blockId
            );

        const originalNext =
            typeof bootstrapBlock.next ===
                'string' ?
                bootstrapBlock.next :
                null;

        bootstrapBlock.opcode =
            TARGET_START_READER_OPCODE;

        bootstrapBlock.inputs = {};

        bootstrapBlock.fields = {
            SOURCE: [
                bootstrap.readerSource,
                null
            ]
        };

        bootstrapBlock.next =
            boundaryBlockId;

        blocks[
            boundaryBlockId
        ] = {
            opcode:
                TARGET_SET_BOUNDARY_OPCODE,

            next:
                originalNext,

            parent:
                bootstrap.blockId,

            inputs: {},

            fields: {
                STATE: [
                    boundaryState,
                    null
                ]
            },

            shadow:
                false,

            topLevel:
                false
        };

        if (
            originalNext &&
            isBlockObject(
                blocks[
                    originalNext
                ]
            )
        ) {
            blocks[
                originalNext
            ].parent =
                boundaryBlockId;
        }

        const removalOrder = [];

        if (
            boundingBox.position ===
                'before'
        ) {
            removalOrder.push(
                boundingBox.blockId
            );
        }

        removalOrder.push(
            analyseBlockId
        );

        if (
            boundingBox.position ===
                'after'
        ) {
            removalOrder.push(
                boundingBox.blockId
            );
        }

        for (
            const removalBlockId
            of removalOrder
        ) {
            const removal =
                removeStackBlock(
                    blocks,
                    removalBlockId
                );

            if (
                !removal.ok
            ) {
                return removal;
            }
        }

        return {
            ok: true,

            boundaryBlockId,

            readerSource:
                bootstrap.readerSource,

            boundaryState,

            resolvedReviewBlockCount:
                2 +
                (
                    boundingBox.blockId ?
                        1 :
                        0
                ),

            removedBlockIds:
                removalOrder
        };
    };

const countRemainingVideoToggles =
    project => {
        let count =
            0;

        (
            Array.isArray(
                project.targets
            ) ?
                project.targets :
                []
        ).forEach(
            target => {
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

                Object.values(
                    blocks
                ).forEach(
                    block => {
                        if (
                            isBlockObject(
                                block
                            ) &&
                            block.opcode ===
                                SOURCE_VIDEO_OPCODE
                        ) {
                            count++;
                        }
                    }
                );
            }
        );

        return count;
    };

const migratePictoBloxQrReaderPatterns =
    project => {
        const convertedProject =
            cloneJson(
                project
            );

        const migrated = [];
        const deferred = [];

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

                const analyseBlockIds =
                    Object.entries(
                        target.blocks
                    )
                        .filter(
                            ([
                                ,
                                block
                            ]) =>
                                isBlockObject(
                                    block
                                ) &&
                                block.opcode ===
                                    SOURCE_ANALYSE_OPCODE
                        )
                        .map(
                            ([
                                blockId
                            ]) =>
                                blockId
                        );

                const groups =
                    new Map();

                analyseBlockIds
                    .forEach(
                        analyseBlockId => {
                            const bootstrap =
                                findReaderBootstrap(
                                    target.blocks,
                                    analyseBlockId
                                );

                            if (!bootstrap) {
                                deferred.push({
                                    targetIndex,
                                    targetName:
                                        target.name ||
                                        null,
                                    analyseBlockId,
                                    reason:
                                        'reader-bootstrap-not-found'
                                });

                                return;
                            }

                            const current =
                                groups.get(
                                    bootstrap.blockId
                                ) ||
                                {
                                    bootstrap,
                                    analyseBlockIds:
                                        []
                                };

                            current
                                .analyseBlockIds
                                .push(
                                    analyseBlockId
                                );

                            groups.set(
                                bootstrap.blockId,
                                current
                            );
                        }
                    );

                groups.forEach(
                    group => {
                        if (
                            group
                                .analyseBlockIds
                                .length !==
                                1
                        ) {
                            group
                                .analyseBlockIds
                                .forEach(
                                    analyseBlockId => {
                                        deferred.push({
                                            targetIndex,
                                            targetName:
                                                target.name ||
                                                null,
                                            analyseBlockId,
                                            bootstrapBlockId:
                                                group
                                                    .bootstrap
                                                    .blockId,
                                            reason:
                                                'ambiguous-reader-analysis-count'
                                        });
                                    }
                                );

                            return;
                        }

                        const analyseBlockId =
                            group
                                .analyseBlockIds[0];

                        const candidateBlocks =
                            cloneJson(
                                target.blocks
                            );

                        const migration =
                            migrateReaderCandidate(
                                candidateBlocks,
                                analyseBlockId,
                                group.bootstrap
                            );

                        if (
                            !migration.ok
                        ) {
                            deferred.push({
                                targetIndex,
                                targetName:
                                    target.name ||
                                    null,
                                analyseBlockId,
                                bootstrapBlockId:
                                    group
                                        .bootstrap
                                        .blockId,
                                reason:
                                    migration.reason
                            });

                            return;
                        }

                        target.blocks =
                            candidateBlocks;

                        migrated.push({
                            targetIndex,
                            targetName:
                                target.name ||
                                null,

                            bootstrapBlockId:
                                group
                                    .bootstrap
                                    .blockId,

                            analyseBlockId,

                            boundaryBlockId:
                                migration
                                    .boundaryBlockId,

                            readerSource:
                                migration
                                    .readerSource,

                            boundaryState:
                                migration
                                    .boundaryState,

                            removedBlockIds:
                                migration
                                    .removedBlockIds,

                            resolvedReviewBlockCount:
                                migration
                                    .resolvedReviewBlockCount
                        });
                    }
                );
            }
        );

        const resolvedReviewBlockCount =
            migrated.reduce(
                (
                    total,
                    record
                ) =>
                    total +
                    record
                        .resolvedReviewBlockCount,
                0
            );

        return {
            project:
                convertedProject,

            report: {
                migratedReaderCount:
                    migrated.length,

                resolvedReviewBlockCount,

                remainingVisualToggleCount:
                    countRemainingVideoToggles(
                        convertedProject
                    ),

                migrated,

                deferred
            }
        };
    };

module.exports = {
    migratePictoBloxQrReaderPatterns
};
