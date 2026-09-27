import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import LibraryItem from '../../../src/components/library-item/library-item.jsx';

const createProps = overrides => ({
    extensionId: 'translate',
    featured: true,
    name: 'Traduzir',
    onBlur: jest.fn(),
    onClick: jest.fn(),
    onFocus: jest.fn(),
    onKeyDown: jest.fn(),
    onMouseEnter: jest.fn(),
    onMouseLeave: jest.fn(),
    onPlay: jest.fn(),
    onStop: jest.fn(),
    ...overrides
});

describe('LibraryItem disabled state', () => {
    test('shows the supplied disabled reason instead of Coming Soon', () => {
        renderWithIntl(
            <LibraryItem
                {...createProps({
                    disabled: true,
                    disabledMessage:
                        'Esta extensão não é compatível com a placa selecionada'
                })}
            />
        );

        expect(
            screen.getByText(
                'Esta extensão não é compatível com a placa selecionada'
            )
        ).toBeInTheDocument();

        expect(
            screen.queryByText('Coming Soon')
        ).not.toBeInTheDocument();
    });

    test('keeps Coming Soon as the fallback for statically disabled items', () => {
        renderWithIntl(
            <LibraryItem
                {...createProps({
                    disabled: true
                })}
            />
        );

        expect(
            screen.getByText('Coming Soon')
        ).toBeInTheDocument();
    });
});

describe('LibraryItem removable action', () => {
    test('does not show a remove action by default', () => {
        renderWithIntl(
            <LibraryItem {...createProps()} />
        );

        expect(
            screen.queryByRole('button', {
                name: 'Remover extensão'
            })
        ).not.toBeInTheDocument();
    });

    test('shows a remove action when onRemove is provided', () => {
        renderWithIntl(
            <LibraryItem
                {...createProps({
                    onRemove: jest.fn()
                })}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Remover extensão'
            })
        ).toBeInTheDocument();
    });

    test('removes without triggering the main card action', () => {
        const onClick = jest.fn();
        const onRemove = jest.fn();

        renderWithIntl(
            <LibraryItem
                {...createProps({
                    onClick,
                    onRemove
                })}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remover extensão'
            })
        );

        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });
});
