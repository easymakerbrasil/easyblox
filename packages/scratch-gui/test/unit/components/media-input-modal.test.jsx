import React from 'react';
import ReactModal from 'react-modal';
import {cleanup, fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import MediaInputModal from '../../../src/components/media-input-modal/media-input-modal.jsx';
import MediaInputInventory from '../../../src/lib/media-input-inventory';
import {getMediaInputPreferences} from '../../../src/lib/media-input-preferences';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

jest.mock('../../../src/lib/media-input-inventory', () => jest.fn());

jest.mock('../../../src/lib/media-input-preferences', () => ({
    getMediaInputPreferences: jest.fn()
}));

describe('MediaInputModal', () => {
    let appElement;
    let preferences;
    let inventory;
    let preferenceSnapshot;
    let inventorySnapshot;
    let cameraOptions;
    let microphoneOptions;

    const renderModal = function (onClose = jest.fn()) {
        renderWithIntl(
            <MediaInputModal onClose={onClose} />,
            {locale: 'pt-br'}
        );
        return onClose;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        appElement = document.createElement('div');
        document.body.appendChild(appElement);
        ReactModal.setAppElement(appElement);

        preferenceSnapshot = {
            cameraDeviceId: null,
            microphoneDeviceId: null,
            persistence: 'available'
        };

        inventorySnapshot = {
            status: 'ready',
            visibility: {
                camera: 'not-confirmed-complete',
                microphone: 'not-confirmed-complete'
            }
        };

        cameraOptions = [
            {deviceId: null, label: '', isSystemDefault: true},
            {deviceId: 'cam-1', label: 'Câmera de teste', isSystemDefault: false}
        ];

        microphoneOptions = [
            {deviceId: null, label: '', isSystemDefault: true},
            {deviceId: 'mic-1', label: 'Microfone de teste', isSystemDefault: false}
        ];

        preferences = {
            getSnapshot: jest.fn(() => preferenceSnapshot),
            subscribe: jest.fn(() => jest.fn()),
            setPreferredDeviceId: jest.fn()
        };

        inventory = {
            getSnapshot: jest.fn(() => inventorySnapshot),
            subscribe: jest.fn(() => jest.fn()),
            getOptions: jest.fn(kind => (
                kind === 'camera' ? cameraOptions : microphoneOptions
            )),
            refresh: jest.fn(),
            dispose: jest.fn()
        };

        getMediaInputPreferences.mockReturnValue(preferences);
        MediaInputInventory.mockImplementation(() => inventory);
    });

    afterEach(() => {
        cleanup();
        appElement.remove();
    });

    test('shows available camera and microphone options', () => {
        renderModal();

        expect(screen.getByRole('dialog', {
            name: 'Câmera e microfone'
        })).toBeVisible();

        expect(screen.getByRole('combobox', {
            name: 'Câmera'
        })).toHaveValue('');

        expect(screen.getByRole('combobox', {
            name: 'Microfone'
        })).toHaveValue('');

        expect(screen.getByRole('option', {
            name: 'Câmera de teste'
        })).toBeInTheDocument();

        expect(screen.getByRole('option', {
            name: 'Microfone de teste'
        })).toBeInTheDocument();
    });

    test('saves selected input IDs and supports system default', () => {
        renderModal();

        fireEvent.change(screen.getByRole('combobox', {
            name: 'Câmera'
        }), {
            target: {value: 'cam-1'}
        });

        expect(preferences.setPreferredDeviceId)
            .toHaveBeenCalledWith('camera', 'cam-1');

        fireEvent.change(screen.getByRole('combobox', {
            name: 'Microfone'
        }), {
            target: {value: 'mic-1'}
        });

        expect(preferences.setPreferredDeviceId)
            .toHaveBeenCalledWith('microphone', 'mic-1');

        fireEvent.change(screen.getByRole('combobox', {
            name: 'Câmera'
        }), {
            target: {value: ''}
        });

        expect(preferences.setPreferredDeviceId)
            .toHaveBeenCalledWith('camera', null);
    });

    test('refreshes the inventory without changing preferences', () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', {
            name: 'Atualizar lista'
        }));

        expect(inventory.refresh).toHaveBeenCalledTimes(1);
        expect(preferences.setPreferredDeviceId).not.toHaveBeenCalled();
    });

    test('disables refresh while enumeration is loading', () => {
        inventorySnapshot.status = 'loading';

        renderModal();

        expect(screen.getByRole('button', {
            name: 'Atualizar lista'
        })).toBeDisabled();

        expect(screen.getByText(
            'Consultando dispositivos disponíveis…'
        )).toBeInTheDocument();
    });

    test('shows an error when enumeration fails', () => {
        inventorySnapshot.status = 'error';

        renderModal();

        expect(screen.getByText(
            /Não foi possível consultar os dispositivos/
        )).toBeInTheDocument();

        expect(screen.getByRole('button', {
            name: 'Atualizar lista'
        })).toBeEnabled();
    });

    test('shows unsupported enumeration feedback', () => {
        inventorySnapshot.status = 'unsupported';

        renderModal();

        expect(screen.getByText(
            /A consulta de dispositivos não está disponível/
        )).toBeInTheDocument();
    });

    test('preserves a previously selected device not in the list', () => {
        preferenceSnapshot.cameraDeviceId = 'cam-saved';

        renderModal();

        expect(screen.getByRole('combobox', {
            name: 'Câmera'
        })).toHaveValue('cam-saved');

        expect(screen.getByRole('option', {
            name: /O dispositivo selecionado não aparece/
        })).toBeInTheDocument();

        expect(preferences.setPreferredDeviceId).not.toHaveBeenCalled();
    });

    test('shows feedback when persistence is unavailable', () => {
        preferenceSnapshot.persistence = 'unavailable';

        renderModal();

        expect(screen.getByText(
            /Não foi possível salvar a preferência permanentemente/
        )).toBeInTheDocument();
    });

    test('unsubscribes and disposes inventory when closed', () => {
        const unsubscribePreferences = jest.fn();
        const unsubscribeInventory = jest.fn();
        const onClose = jest.fn();

        preferences.subscribe.mockReturnValue(unsubscribePreferences);
        inventory.subscribe.mockReturnValue(unsubscribeInventory);

        const {unmount} = renderWithIntl(
            <MediaInputModal onClose={onClose} />,
            {locale: 'pt-br'}
        );

        fireEvent.click(screen.getByRole('button', {
            name: 'Concluído'
        }));

        expect(onClose).toHaveBeenCalledTimes(1);

        unmount();

        expect(unsubscribePreferences).toHaveBeenCalledTimes(1);
        expect(unsubscribeInventory).toHaveBeenCalledTimes(1);
        expect(inventory.dispose).toHaveBeenCalledTimes(1);
    });
});
