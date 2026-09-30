import {
    createSingleBlockCopyData,
    registerEasyBloxBlockContextMenu
} from '../../../src/lib/easyblox-block-context-menu';

describe('EasyBlox block context menu', () => {
    const createScratchBlocks =
        () => {
            const items = {
                blockDuplicate: {
                    preconditionFn:
                        jest.fn(() =>
                            'enabled'
                        ),
                    scopeType: 'block',
                    weight: 1
                }
            };

            return {
                scratchBlocksUtils: {
                    stripIds:
                        jest.fn(state =>
                            JSON.parse(
                                JSON.stringify(
                                    state
                                )
                            )
                        )
                },

                clipboard: {
                    paste: jest.fn()
                },

                ContextMenuRegistry: {
                    registry: {
                        getItem:
                            jest.fn(id =>
                                items[id] ||
                                null
                            ),

                        register:
                            jest.fn(item => {
                                items[item.id] =
                                    item;
                            })
                    }
                }
            };
        };

    test('duplicates only the selected block while preserving literal shadows', () => {
        const ScratchBlocks =
            createScratchBlocks();

        const workspace = {};

        const block = {
            workspace,

            toCopyData:
                jest.fn(() => ({
                    paster: 'block',

                    blockState: {
                        type:
                            'motion_movesteps',

                        fields: {
                            MODE:
                                'normal'
                        },

                        inputs: {
                            STEPS: {
                                shadow: {
                                    type:
                                        'math_number',

                                    fields: {
                                        NUM: 10
                                    }
                                },

                                block: {
                                    type:
                                        'operator_add'
                                }
                            },

                            SUBSTACK: {
                                block: {
                                    type:
                                        'motion_turnright'
                                }
                            }
                        },

                        next: {
                            block: {
                                type:
                                    'looks_say'
                            }
                        }
                    },

                    typeCounts: {
                        motion_movesteps: 1,
                        math_number: 1,
                        operator_add: 1,
                        motion_turnright: 1,
                        looks_say: 1
                    }
                }))
        };

        const result =
            createSingleBlockCopyData(
                ScratchBlocks,
                block
            );

        expect(
            block.toCopyData
        ).toHaveBeenCalledWith(
            false
        );

        expect(
            result.blockState
                .next
        ).toBeUndefined();

        expect(
            result.blockState.inputs
        ).toEqual({
            STEPS: {
                shadow: {
                    type:
                        'math_number',

                    fields: {
                        NUM: 10
                    }
                }
            }
        });

        expect(
            result.blockState.fields
        ).toEqual({
            MODE: 'normal'
        });

        expect(
            result.typeCounts
        ).toEqual({
            motion_movesteps: 1,
            math_number: 1
        });
    });

    test('registers the single-block duplicate action after the normal duplicate action', () => {
        const ScratchBlocks =
            createScratchBlocks();

        registerEasyBloxBlockContextMenu(
            ScratchBlocks
        );

        expect(
            ScratchBlocks
                .ContextMenuRegistry
                .registry
                .register
        ).toHaveBeenCalledTimes(
            1
        );

        const item =
            ScratchBlocks
                .ContextMenuRegistry
                .registry
                .register
                .mock.calls[0][0];

        expect(item).toMatchObject({
            id:
                'easybloxDuplicateSingleBlock',

            weight: 1.5
        });

        expect(
            item.displayText()
        ).toBe(
            'Duplicar apenas este bloco'
        );
    });

    test('does not expose single-block duplication for procedure definitions', () => {
        const ScratchBlocks =
            createScratchBlocks();

        registerEasyBloxBlockContextMenu(
            ScratchBlocks
        );

        const item =
            ScratchBlocks
                .ContextMenuRegistry
                .registry
                .register
                .mock.calls[0][0];

        expect(
            item.preconditionFn({
                block: {
                    type:
                        'procedures_definition'
                }
            })
        ).toBe(
            'hidden'
        );
    });

    test('pastes the reduced block copy into the same workspace', () => {
        const ScratchBlocks =
            createScratchBlocks();

        registerEasyBloxBlockContextMenu(
            ScratchBlocks
        );

        const item =
            ScratchBlocks
                .ContextMenuRegistry
                .registry
                .register
                .mock.calls[0][0];

        const workspace = {};

        const block = {
            type:
                'motion_movesteps',

            workspace,

            toCopyData:
                jest.fn(() => ({
                    paster: 'block',

                    blockState: {
                        type:
                            'motion_movesteps'
                    },

                    typeCounts: {
                        motion_movesteps: 1
                    }
                }))
        };

        item.callback({
            block
        });

        expect(
            ScratchBlocks
                .clipboard
                .paste
        ).toHaveBeenCalledTimes(
            1
        );

        expect(
            ScratchBlocks
                .clipboard
                .paste
                .mock.calls[0][1]
        ).toBe(
            workspace
        );
    });
});
