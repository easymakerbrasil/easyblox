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
