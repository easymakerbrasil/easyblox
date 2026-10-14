import React from 'react';
import ReactModal from 'react-modal';
import {cleanup, fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutEasyBloxModal from '../../../src/components/about-easyblox-modal/about-easyblox-modal.jsx';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

describe('AboutEasyBloxModal', () => {
    let appElement;
    beforeEach(() => {
        appElement = document.createElement('div');
        document.body.appendChild(appElement);
        ReactModal.setAppElement(appElement);
    });
    afterEach(() => {
        cleanup();
        appElement.remove();
    });
    const renderModal = function (result = {status: 'loading'}, onClose = jest.fn()) {
        return renderWithIntl(<AboutEasyBloxModal
            result={result}
            onClose={onClose}
        />, {locale: 'pt-br'});
    };

    test('shows official identity, announces status and initially focuses Fechar', () => {
        renderModal();
        expect(screen.getByRole('dialog', {name: 'Sobre o EasyBlox'})).toBeVisible();
        expect(screen.getByRole('img', {name: 'EasyBlox'})).toHaveAttribute('src', 'test-file-stub');
        expect(screen.getByText('EasyMaker Robótica Educacional')).toBeVisible();
        expect(screen.getByRole('status')).toHaveTextContent('Consultando versão do Desktop…');
        expect(screen.getByRole('button', {name: 'Fechar'})).toHaveFocus();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
    test('shows the received product name and complete long version', () => {
        const version = '123.456.789-release.candidate.with.long.metadata+build.123456789';
        renderModal({status: 'available',
            appInfo: {
                productName: 'EasyBlox Desktop', version, platform: 'win32', isPackaged: true
            }});
        expect(screen.getByText('EasyBlox Desktop')).toBeVisible();
        expect(screen.getByRole('status')).toHaveTextContent(`Versão ${version}`);
        expect(screen.queryByText('win32')).not.toBeInTheDocument();
    });
    const checkUnavailable = function (reason) {
        renderModal({status: 'unavailable', reason});
        expect(screen.getByRole('status')).toHaveTextContent(reason === 'bridge-absent' ?
            'Versão do Desktop indisponível neste navegador.' :
            'Não foi possível consultar a versão do Desktop.');
        expect(screen.queryByText(/0\.4\.1|0\.5\.0/)).not.toBeInTheDocument();
    };
    test.each(['bridge-absent', 'invalid-bridge', 'invalid-response', 'ipc-error', 'timeout'])(
        'shows unavailability without a fictitious version: %s', checkUnavailable
    );
    const checkClose = function (method) {
        const onClose = jest.fn();
        renderModal({status: 'loading'}, onClose);
        if (method === 'overlay') {
            fireEvent.click(screen.getByRole('dialog').parentElement);
        } else if (method === 'Escape') {
            fireEvent.keyDown(screen.getByRole('dialog'), {key: method, keyCode: 27});
        } else if (method === 'Enter' || method === ' ') {
            fireEvent.keyDown(screen.getByRole('button', {name: 'Close'}), {key: method});
        } else {
            fireEvent.click(screen.getByRole('button', {name: method}));
        }
        fireEvent.click(screen.getByRole('button', {name: 'Fechar'}));
        expect(onClose).toHaveBeenCalledTimes(1);
    };
    test.each(['Fechar', 'Close', 'Escape', 'Enter', ' ', 'overlay'])(
        'closes once through %s', checkClose
    );
    test('wraps Tab and Shift+Tab using the existing Modal focus trap', () => {
        const width = jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
        const height = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100);
        try {
            renderModal();
            const close = screen.getByRole('button', {name: 'Fechar'});
            const x = screen.getByRole('button', {name: 'Close'});
            fireEvent.keyDown(close, {key: 'Tab', keyCode: 9});
            expect(x).toHaveFocus();
            fireEvent.keyDown(x, {key: 'Tab', keyCode: 9, shiftKey: true});
            expect(close).toHaveFocus();
        } finally {
            width.mockRestore();
            height.mockRestore();
        }
    });
    test('blocks project shortcuts only while mounted without blocking accessibility keys', () => {
        const listener = jest.fn();
        const view = renderModal();
        document.addEventListener('keydown', listener);
        try {
            for (const key of ['n', 'o', 's']) {
                fireEvent.keyDown(document, {key, ctrlKey: true});
                fireEvent.keyDown(document, {key, metaKey: true});
            }
            expect(listener).not.toHaveBeenCalled();
            fireEvent.keyDown(document, {key: 'ArrowDown'});
            expect(listener).toHaveBeenCalledTimes(1);
            view.unmount();
            fireEvent.keyDown(document, {key: 'n', ctrlKey: true});
            expect(listener).toHaveBeenCalledTimes(2);
        } finally {
            document.removeEventListener('keydown', listener);
        }
    });
});
