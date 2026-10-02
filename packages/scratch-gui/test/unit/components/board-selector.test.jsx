import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import BoardSelector from '../../../src/components/board-selector/board-selector';

describe('BoardSelector', () => {
    test('renders no board and Arduino UNO options', () => {
        render(
            <BoardSelector
                selectedBoard={null}
                onBoardChange={jest.fn()}
            />
        );

        expect(
            screen.getByRole('option', {
                name: 'Nenhuma placa'
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('option', {
                name: 'Arduino UNO'
            })
        ).toBeInTheDocument();
    });

    test('keeps future board options visible but disabled', () => {
        render(
            <BoardSelector
                selectedBoard={null}
                onBoardChange={jest.fn()}
            />
        );

        expect(
            screen.getByRole(
                'option',
                {
                    name:
                        'Arduino UNO'
                }
            )
        ).toBeEnabled();

        expect(
            screen.getByRole(
                'option',
                {
                    name:
                        'EasyMaker'
                }
            )
        ).toBeEnabled();

        [
            'EasyMaker Connection',
            'EasyDuino Proto',
            'EasyDuino Jr'
        ].forEach(name => {
            expect(
                screen.getByRole(
                    'option',
                    {
                        name
                    }
                )
            ).toBeDisabled();
        });
    });

    test('shows the selected board', () => {
        render(
            <BoardSelector
                selectedBoard="arduino-uno"
                onBoardChange={jest.fn()}
            />
        );

        expect(
            screen.getByRole('combobox')
        ).toHaveValue('arduino-uno');
    });

    test('requests a board change', () => {
        const onBoardChange = jest.fn();

        render(
            <BoardSelector
                selectedBoard={null}
                onBoardChange={onBoardChange}
            />
        );

        fireEvent.change(
            screen.getByRole('combobox'),
            {
                target: {
                    value: 'arduino-uno'
                }
            }
        );

        expect(onBoardChange).toHaveBeenCalledTimes(1);
        expect(onBoardChange).toHaveBeenCalledWith('arduino-uno');
    });
});
