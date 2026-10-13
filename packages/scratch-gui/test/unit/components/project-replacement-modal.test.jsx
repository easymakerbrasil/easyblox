import React from 'react';
import {fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectReplacementModal from '../../../src/components/project-replacement-modal/project-replacement-modal';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

describe('ProjectReplacementModal', () => {
    const message = 'O projeto atual será substituído. Salve-o antes de continuar se quiser manter suas alterações.';

    test.each([
        ['open', 'Abrir outro projeto?', 'Abrir projeto'],
        ['import', 'Importar outro projeto?', 'Importar projeto'],
        ['new', 'Criar novo projeto?', 'Criar novo projeto']
    ])('shows the visible contract for %s', (operation, title, action) => {
        const onConfirm = jest.fn();
        renderWithIntl(
            <ProjectReplacementModal
                isOpen
                operation={operation}
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />,
            {locale: 'pt-br'}
        );
        expect(screen.getByRole('dialog', {name: title})).toBeInTheDocument();
        expect(screen.getByText(title)).toBeVisible();
        expect(screen.getByText(message)).toBeVisible();
        const cancel = screen.getByRole('button', {name: 'Cancelar'});
        const confirm = screen.getByRole('button', {name: action});
        expect(cancel.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        fireEvent.click(confirm);
        fireEvent.click(confirm);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test.each(['Cancelar', 'Close', 'Escape'])('%s cancels instead of confirming', label => {
        const onCancel = jest.fn();
        const onConfirm = jest.fn();
        renderWithIntl(
            <ProjectReplacementModal
                isOpen
                operation="open"
                onCancel={onCancel}
                onConfirm={onConfirm}
            />
        );
        if (label === 'Escape') {
            fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape', keyCode: 27});
        } else {
            fireEvent.click(screen.getByRole('button', {name: label}));
        }
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    test('is absent when closed', () => {
        renderWithIntl(
            <ProjectReplacementModal
                isOpen={false}
                operation="new"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('blocks project shortcuts only while open and releases them on close', () => {
        const onShortcut = jest.fn();
        const props = {operation: 'open', onCancel: jest.fn(), onConfirm: jest.fn()};
        const {rerender} = renderWithIntl(
            <ProjectReplacementModal
                {...props}
                isOpen
            />
        );
        document.addEventListener('keydown', onShortcut);
        try {
            fireEvent.keyDown(document, {key: 'n', ctrlKey: true});
            fireEvent.keyDown(document, {key: 'o', ctrlKey: true});
            fireEvent.keyDown(document, {key: 'N', metaKey: true});
            expect(onShortcut).not.toHaveBeenCalled();
            rerender(
                <React.Fragment />
            );
            fireEvent.keyDown(document, {key: 'n', ctrlKey: true});
            expect(onShortcut).toHaveBeenCalledTimes(1);
        } finally {
            document.removeEventListener('keydown', onShortcut);
        }
    });
});
