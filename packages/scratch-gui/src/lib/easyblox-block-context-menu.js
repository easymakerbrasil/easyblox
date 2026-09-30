const DUPLICATE_SINGLE_BLOCK_MENU_ID =
    'easybloxDuplicateSingleBlock';

const countSerializedBlocks = state => {
    const counts = {};

    const visit = blockState => {
        if (
            !blockState ||
            typeof blockState.type !== 'string'
        ) {
            return;
        }

        counts[blockState.type] =
            (counts[blockState.type] || 0) + 1;

        if (blockState.inputs) {
            Object.values(
                blockState.inputs
            ).forEach(connection => {
                if (connection.shadow) {
                    visit(
                        connection.shadow
                    );
                }

                if (connection.block) {
                    visit(
                        connection.block
                    );
                }
            });
        }

        if (blockState.next) {
            if (blockState.next.shadow) {
                visit(
                    blockState.next.shadow
                );
            }

            if (blockState.next.block) {
                visit(
                    blockState.next.block
                );
            }
        }
    };

    visit(state);

    return counts;
};

const createSingleBlockCopyData = (
    ScratchBlocks,
    block
) => {
    const copyData =
        block.toCopyData(false);

    if (
        !copyData ||
        !copyData.blockState
    ) {
        return null;
    }

    const blockState =
        ScratchBlocks
            .scratchBlocksUtils
            .stripIds(
                copyData.blockState
            );

    delete blockState.next;

    if (blockState.inputs) {
        const shadowInputs = {};

        Object.keys(
            blockState.inputs
        ).forEach(inputName => {
            const connection =
                blockState.inputs[
                    inputName
                ];

            if (
                connection &&
                connection.shadow
            ) {
                shadowInputs[inputName] = {
                    shadow:
                        connection.shadow
                };
            }
        });

        if (
            Object.keys(
                shadowInputs
            ).length > 0
        ) {
            blockState.inputs =
                shadowInputs;
        } else {
            delete blockState.inputs;
        }
    }

    return {
        ...copyData,
        blockState,
        typeCounts:
            countSerializedBlocks(
                blockState
            )
    };
};

const registerEasyBloxBlockContextMenu =
    ScratchBlocks => {
        const registry =
            ScratchBlocks
                .ContextMenuRegistry
                .registry;

        if (
            registry.getItem(
                DUPLICATE_SINGLE_BLOCK_MENU_ID
            )
        ) {
            return;
        }

        const duplicateOption =
            registry.getItem(
                'blockDuplicate'
            );

        if (
            !duplicateOption ||
            typeof duplicateOption
                .preconditionFn !==
                'function'
        ) {
            return;
        }

        registry.register({
            displayText:
                () =>
                    'Duplicar apenas este bloco',

            preconditionFn: scope => {
                if (
                    scope.block &&
                    scope.block.type ===
                        'procedures_definition'
                ) {
                    return 'hidden';
                }

                return duplicateOption
                    .preconditionFn(
                        scope
                    );
            },

            callback: scope => {
                if (!scope.block) {
                    return;
                }

                const copyData =
                    createSingleBlockCopyData(
                        ScratchBlocks,
                        scope.block
                    );

                if (!copyData) {
                    return;
                }

                ScratchBlocks
                    .clipboard
                    .paste(
                        copyData,
                        scope.block.workspace
                    );
            },

            scopeType:
                duplicateOption.scopeType,

            id:
                DUPLICATE_SINGLE_BLOCK_MENU_ID,

            weight:
                duplicateOption.weight +
                0.5
        });
    };

export {
    DUPLICATE_SINGLE_BLOCK_MENU_ID,
    countSerializedBlocks,
    createSingleBlockCopyData,
    registerEasyBloxBlockContextMenu
};
