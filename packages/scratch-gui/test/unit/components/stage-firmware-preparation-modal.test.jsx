import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import StageFirmwarePreparationModal
    from '../../../src/components/stage-firmware-preparation-modal/stage-firmware-preparation-modal';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

describe('StageFirmwarePreparationModal', () => {
    const title = 'Preparar Modo Palco?';
    const warning = 'Para continuar, o EasyBlox precisa preparar a placa. ' +
        'Esse processo substituirá o programa que está gravado nela atualmente.';

    test.each([
        ['legacy', 'A preparação do Modo Palco desta placa precisa ser atualizada.'],
        ['incompatible', 'A preparação do Modo Palco desta placa não é compatível com esta versão do EasyBlox.'],
        ['unidentified', 'O EasyBlox não conseguiu confirmar se esta placa está pronta para o Modo Palco.']
    ])('shows the visible contract for %s', (issue, message) => {
        const onConfirm = jest.fn();
        const onCancel = jest.fn();
        renderWithIntl(
            <StageFirmwarePreparationModal
                issue={issue}
                onCancel={onCancel}
                onConfirm={onConfirm}
            />,
            {locale: 'pt-br'}
        );

        const dialog = screen.getByRole('dialog', {name: title});
        expect(screen.getByText(title)).toBeVisible();
        expect(screen.getByText(message)).toBeVisible();
        expect(screen.getByText(warning)).toBeVisible();
        expect(dialog).not.toHaveTextContent(
            /Arduino UNO|firmware|flash|sketch|bootloader|handshake|0x03|porta serial|Arduino CLI/i
        );

        const cancel = screen.getByRole('button', {name: 'Cancelar'});
        const confirm = screen.getByRole('button', {name: 'Preparar Modo Palco'});
        expect(cancel.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(cancel).toHaveFocus();

        fireEvent.click(confirm);
        fireEvent.click(confirm);
        fireEvent.click(cancel);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    test.each([
        ['Cancelar', false],
        ['Close', false],
        ['Escape', true]
    ])('%s cancels instead of preparing', (label, isEscape) => {
        const onCancel = jest.fn();
        const onConfirm = jest.fn();
        renderWithIntl(
            <StageFirmwarePreparationModal
                issue="unidentified"
                onCancel={onCancel}
                onConfirm={onConfirm}
            />,
            {locale: 'pt-br'}
        );

        if (isEscape) {
            fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape', keyCode: 27});
        } else {
            fireEvent.click(screen.getByRole('button', {name: label}));
        }
        fireEvent.click(screen.getByRole('button', {name: 'Preparar Modo Palco'}));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
