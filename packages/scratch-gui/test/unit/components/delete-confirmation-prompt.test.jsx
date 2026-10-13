import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import ptBrMessages from 'scratch-l10n/editor/interface/pt-br.json';
import DeleteConfirmationPrompt from '../../../src/components/delete-confirmation-prompt/delete-confirmation-prompt';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

describe('DeleteConfirmationPrompt', () => {
    const renderPrompt = function () {
        const callbacks = {onOk: jest.fn(), onCancel: jest.fn()};
        renderWithIntl(
            <DeleteConfirmationPrompt
                {...callbacks}
                entityType="SPRITE"
                modalPosition="right"
                relativeElemRef={document.createElement('div')}
            />,
            {locale: 'pt-br', messages: ptBrMessages}
        );
        return callbacks;
    };

    test('uses local Portuguese labels with the installed Portuguese catalogue', () => {
        renderPrompt();
        expect(screen.getByRole('button', {name: 'Sim'})).toBeVisible();
        expect(screen.getByRole('button', {name: 'Não'})).toBeVisible();
        expect(screen.queryByRole('button', {name: 'yes'})).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'no'})).not.toBeInTheDocument();
        expect(screen.getByText('Tem certeza que deseja remover este ator?')).toBeVisible();
    });

    test.each([
        ['Sim', 'onOk', 'onCancel'],
        ['Não', 'onCancel', 'onOk']
    ])('%s preserves the original callback', (label, callback, otherCallback) => {
        const callbacks = renderPrompt();
        fireEvent.click(screen.getByRole('button', {name: label}));
        expect(callbacks[callback]).toHaveBeenCalledTimes(1);
        expect(callbacks[otherCallback]).not.toHaveBeenCalled();
    });
});
