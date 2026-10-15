import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import BoardSelectionModal from '../../../src/components/board-selection-modal/board-selection-modal';
import * as boardLibrary from '../../../src/lib/libraries/extensions/index.jsx';

describe('BoardSelectionModal', () => {
    test('shows the board selection interface', () => {
        render(
            <BoardSelectionModal
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        expect(
            screen.getByText('Selecione uma placa')
        ).toBeInTheDocument();

        expect(
            screen.getByText('Escolha a placa que deseja programar.')
        ).toBeInTheDocument();

        expect(screen.getAllByRole('button')
            .filter(({dataset}) => dataset.boardId)
            .map(({dataset}) => dataset.boardId)).toEqual([
            'arduino-uno', 'easymaker', 'easyduino-jr', 'easyduino-proto',
            'easymaker-connection', 'easyduino-connection'
        ]);

        expect(
            screen.getByRole('button', {
                name: 'Arduino UNO'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyMaker'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyMaker Connection'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyDuino Proto'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyDuino Jr'
            })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('button', {
                name: 'micro:bit'
            })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', {
                name: 'LEGO MINDSTORMS EV3'
            })
        ).not.toBeInTheDocument();
    });

    const checkFutureBoards = function (requiredMode) {
        render(
            <BoardSelectionModal
                requiredMode={requiredMode}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        expect(
            screen.getByRole(
                'button',
                {
                    name:
                        'Arduino UNO'
                }
            )
        ).toBeEnabled();

        expect(
            screen.getByRole(
                'button',
                {
                    name:
                        'EasyMaker'
                }
            )
        ).toBeEnabled();

        ['EasyDuino Proto', 'EasyDuino Jr'].forEach(name => {
            expect(screen.getByRole('button', {name})).toBeEnabled();
            expect(screen.getByRole('button', {name})).not.toHaveTextContent('BREVE');
        });

        [
            'EasyMaker Connection',
            'EasyDuino Connection'
        ].forEach(name => {
            expect(
                screen.getByRole(
                    'button',
                    {
                        name
                    }
                )
            ).toBeDisabled();
        });

        expect(
            screen.getAllByText(
                'BREVE'
            )
        ).toHaveLength(2);
    };
    test.each([null, 'stage', 'upload'])(
        'keeps both future boards disabled with BREVE in mode %s', checkFutureBoards
    );

    test('uses direct board selection instead of a combobox', () => {
        render(
            <BoardSelectionModal
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        expect(
            screen.queryByRole('combobox')
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('button', {
                name: 'Continuar'
            })
        ).not.toBeInTheDocument();
    });

    test.each([
        ['Arduino UNO', 'arduino-uno'],
        ['EasyMaker', 'easymaker'],
        ['EasyDuino Proto', 'easyduino-proto'],
        ['EasyDuino Jr', 'easyduino-jr']
    ])('selects %s directly from its card', (name, boardId) => {
        const onConfirm = jest.fn();

        render(
            <BoardSelectionModal
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name
            })
        );

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith(boardId);
    });

    const checkFutureSelection = function (name) {
        const onConfirm =
            jest.fn();

        render(
            <BoardSelectionModal
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />
        );

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name
                }
            )
        );

        expect(
            onConfirm
        ).not.toHaveBeenCalled();
    };
    test.each(['EasyMaker Connection', 'EasyDuino Connection'])(
        'does not select future board %s', checkFutureSelection
    );

    test('skips both future cards during keyboard navigation', async () => {
        const user = userEvent.setup();
        const onConfirm = jest.fn();
        // React Modal checks layout dimensions when finding tabbable elements; jsdom has no layout.
        const width = jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1);
        const height = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1);
        try {
            render(<BoardSelectionModal
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />);
            screen.getByRole('button', {name: 'Arduino UNO'}).focus();
            for (const name of ['EasyMaker', 'EasyDuino Jr', 'EasyDuino Proto']) {
                await user.tab();
                expect(screen.getByRole('button', {name})).toHaveFocus();
            }
            await user.keyboard('{Enter}');
            expect(onConfirm).toHaveBeenCalledTimes(1);
            expect(onConfirm).toHaveBeenCalledWith('easyduino-proto');
            await user.tab();
            expect(screen.getByRole('button', {name: 'EasyMaker Connection'})).not.toHaveFocus();
            expect(screen.getByRole('button', {name: 'EasyDuino Connection'})).not.toHaveFocus();
        } finally {
            width.mockRestore();
            height.mockRestore();
        }
    });

    test('still filters available boards by mode while displaying future boards without a backend', () => {
        const boards = boardLibrary.getVisibleBoards();
        const spy = jest.spyOn(boardLibrary, 'getVisibleBoards').mockReturnValue([
            {...boards[0], supportedModes: ['stage']},
            boardLibrary.getBoardById('easyduino-connection')
        ]);
        try {
            render(<BoardSelectionModal
                requiredMode="upload"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />);
            expect(screen.queryByRole('button', {name: 'Arduino UNO'})).not.toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'EasyDuino Connection'})).toBeDisabled();
        } finally {
            spy.mockRestore();
        }
    });

    test('shows only boards compatible with the required mode', () => {
        render(
            <BoardSelectionModal
                requiredMode="upload"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Arduino UNO'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyMaker'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyMaker Connection'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyDuino Proto'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'EasyDuino Jr'
            })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('button', {
                name: 'micro:bit'
            })
        ).not.toBeInTheDocument();
    });

    const checkBoardMode = function (name, boardId, requiredMode) {
        const onConfirm = jest.fn();
        render(<BoardSelectionModal
            requiredMode={requiredMode}
            onCancel={jest.fn()}
            onConfirm={onConfirm}
        />);
        const board = screen.getByRole('button', {name});
        expect(board).toBeEnabled();
        expect(board).not.toHaveTextContent('BREVE');
        fireEvent.click(board);
        expect(onConfirm).toHaveBeenCalledWith(boardId);
    };
    test.each([
        ['EasyDuino Proto', 'easyduino-proto', 'stage'],
        ['EasyDuino Proto', 'easyduino-proto', 'upload'],
        ['EasyDuino Jr', 'easyduino-jr', 'stage'],
        ['EasyDuino Jr', 'easyduino-jr', 'upload']
    ])('allows %s (%s) selection in %s', checkBoardMode);

    test('allows closing without selecting a board', () => {
        const onCancel = jest.fn();

        render(
            <BoardSelectionModal
                onCancel={onCancel}
                onConfirm={jest.fn()}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Close'
            })
        );

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('shows the remove option when a board is selected', () => {
        render(
            <BoardSelectionModal
                selectedBoard="arduino-uno"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                onRemove={jest.fn()}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Remover placa selecionada'
            })
        ).toBeInTheDocument();
    });

    test('removes the selected board through the remove option', () => {
        const onRemove = jest.fn();

        render(
            <BoardSelectionModal
                selectedBoard="arduino-uno"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                onRemove={onRemove}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remover placa selecionada'
            })
        );

        expect(onRemove).toHaveBeenCalledTimes(1);
    });
});
