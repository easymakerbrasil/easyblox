import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import BoardSelectionModal from '../../../src/components/board-selection-modal/board-selection-modal';

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

        expect(
            screen.getByRole('button', {
                name: 'Arduino UNO'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', {
                name: 'micro:bit'
            })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', {
                name: 'LEGO MINDSTORMS EV3'
            })
        ).not.toBeInTheDocument();
    });

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

    test('selects Arduino UNO directly from its card', () => {
        const onConfirm = jest.fn();

        render(
            <BoardSelectionModal
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Arduino UNO'
            })
        );

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('arduino-uno');
    });

    test('selects micro:bit directly from its card', () => {
        const onConfirm = jest.fn();

        render(
            <BoardSelectionModal
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'micro:bit'
            })
        );

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('microbit');
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
            screen.queryByRole('button', {
                name: 'micro:bit'
            })
        ).not.toBeInTheDocument();
    });

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
