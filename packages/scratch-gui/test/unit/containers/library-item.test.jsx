import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

import {LibraryItem} from '../../../src/containers/library-item.jsx';

describe('LibraryItem container remove action', () => {
    test('removes the item without selecting it', () => {
        const onRemove = jest.fn();
        const onSelect = jest.fn();

        renderWithIntl(
            <LibraryItem
                id="Traduzir"
                extensionId="translate"
                featured
                icons={{uri: 'translate.svg'}}
                name="Traduzir"
                platform="DESKTOP"
                onMouseEnter={jest.fn()}
                onMouseLeave={jest.fn()}
                onRemove={onRemove}
                onSelect={onSelect}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remover extensão'
            })
        );

        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onRemove).toHaveBeenCalledWith('Traduzir');
        expect(onSelect).not.toHaveBeenCalled();
    });

    test('forwards the disabled reason and prevents selection', () => {
        const onSelect = jest.fn();

        renderWithIntl(
            <LibraryItem
                disabled
                disabledMessage="Esta extensão não é compatível com a placa selecionada"
                id="EasyBlox BT"
                extensionId="easybloxBt"
                featured
                icons={{uri: 'easyblox-bt.svg'}}
                name="EasyBlox BT"
                platform="DESKTOP"
                onMouseEnter={jest.fn()}
                onMouseLeave={jest.fn()}
                onSelect={onSelect}
            />
        );

        expect(
            screen.getByText(
                'Esta extensão não é compatível com a placa selecionada'
            )
        ).toBeInTheDocument();

        fireEvent.click(
            screen
                .getByText('EasyBlox BT')
                .closest('button')
        );

        expect(onSelect).not.toHaveBeenCalled();
    });
});
