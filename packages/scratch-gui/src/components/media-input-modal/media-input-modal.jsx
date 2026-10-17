import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';

import MediaInputInventory from '../../lib/media-input-inventory';
import {getMediaInputPreferences} from '../../lib/media-input-preferences';
import Modal from '../modal/modal.jsx';
import styles from './media-input-modal.css';

const messages = defineMessages({
    title: {
        id: 'gui.mediaInput.title',
        defaultMessage: 'Câmera e microfone',
        description: 'Camera and microphone settings title'
    },
    camera: {
        id: 'gui.mediaInput.camera',
        defaultMessage: 'Câmera',
        description: 'Camera input label'
    },
    microphone: {
        id: 'gui.mediaInput.microphone',
        defaultMessage: 'Microfone',
        description: 'Microphone input label'
    },
    systemDefault: {
        id: 'gui.mediaInput.systemDefault',
        defaultMessage: 'Padrão do sistema',
        description: 'Default media input device'
    },
    refresh: {
        id: 'gui.mediaInput.refresh',
        defaultMessage: 'Atualizar lista',
        description: 'Refresh available media input devices'
    },
    done: {
        id: 'gui.mediaInput.done',
        defaultMessage: 'Concluído',
        description: 'Close media input settings'
    },
    information: {
        id: 'gui.mediaInput.information',
        defaultMessage: 'As alterações serão aplicadas na próxima utilização do dispositivo.',
        description: 'When a media input preference takes effect'
    },
    loading: {
        id: 'gui.mediaInput.loading',
        defaultMessage: 'Consultando dispositivos disponíveis…',
        description: 'Media device enumeration in progress'
    },
    unsupported: {
        id: 'gui.mediaInput.unsupported',
        defaultMessage: 'A consulta de dispositivos não está disponível neste ambiente.',
        description: 'Media device enumeration unsupported'
    },
    enumerationError: {
        id: 'gui.mediaInput.enumerationError',
        defaultMessage: 'Não foi possível consultar os dispositivos. ' +
            'Verifique as permissões e tente atualizar a lista.',
        description: 'Media device enumeration failed'
    },
    limited: {
        id: 'gui.mediaInput.limited',
        defaultMessage: 'Alguns dispositivos podem não aparecer até que o sistema conceda as permissões necessárias.',
        description: 'Media device information might be limited'
    },
    unavailable: {
        id: 'gui.mediaInput.unavailable',
        defaultMessage: 'O dispositivo selecionado não aparece na lista atual. A preferência foi preservada.',
        description: 'Previously selected device not listed'
    },
    unnamedCamera: {
        id: 'gui.mediaInput.unnamedCamera',
        defaultMessage: 'Câmera {number}',
        description: 'Fallback label for an unnamed camera'
    },
    unnamedMicrophone: {
        id: 'gui.mediaInput.unnamedMicrophone',
        defaultMessage: 'Microfone {number}',
        description: 'Fallback label for an unnamed microphone'
    },
    persistenceUnavailable: {
        id: 'gui.mediaInput.persistenceUnavailable',
        defaultMessage: 'Não foi possível salvar a preferência permanentemente neste ambiente.',
        description: 'Media preference storage unavailable'
    }
});

const MediaInputModal = ({onClose}) => {
    const intl = useIntl();

    const [preferences] = useState(getMediaInputPreferences);
    const [inventory] = useState(() => new MediaInputInventory({preferences}));

    const [preferenceSnapshot, setPreferenceSnapshot] = useState(
        () => preferences.getSnapshot()
    );
    const [inventorySnapshot, setInventorySnapshot] = useState(
        () => inventory.getSnapshot()
    );

    useEffect(() => {
        const handlePreferences = function (snapshot) {
            setPreferenceSnapshot(snapshot);
        };

        const handleInventory = function (snapshot) {
            setInventorySnapshot(snapshot);
        };

        const unsubscribePreferences = preferences.subscribe(handlePreferences);
        const unsubscribeInventory = inventory.subscribe(handleInventory);

        setPreferenceSnapshot(preferences.getSnapshot());
        setInventorySnapshot(inventory.getSnapshot());

        return () => {
            unsubscribeInventory();
            unsubscribePreferences();
            inventory.dispose();
        };
    }, [preferences, inventory]);

    const handleCameraChange = useCallback(event => {
        preferences.setPreferredDeviceId(
            'camera',
            event.target.value === '' ? null : event.target.value
        );
    }, [preferences]);

    const handleMicrophoneChange = useCallback(event => {
        preferences.setPreferredDeviceId(
            'microphone',
            event.target.value === '' ? null : event.target.value
        );
    }, [preferences]);

    const handleRefresh = useCallback(() => {
        inventory.refresh();
    }, [inventory]);

    const cameraOptions = inventory.getOptions('camera');
    const microphoneOptions = inventory.getOptions('microphone');

    const cameraDeviceId = preferenceSnapshot.cameraDeviceId;
    const microphoneDeviceId = preferenceSnapshot.microphoneDeviceId;

    const cameraListed = cameraDeviceId === null ||
        cameraOptions.some(option => option.deviceId === cameraDeviceId);

    const microphoneListed = microphoneDeviceId === null ||
        microphoneOptions.some(option => option.deviceId === microphoneDeviceId);

    const isLoading = inventorySnapshot.status === 'loading';
    const isReady = inventorySnapshot.status === 'ready';
    const isUnsupported = inventorySnapshot.status === 'unsupported';
    const hasError = inventorySnapshot.status === 'error';

    const hasLimitedVisibility = isReady && (
        inventorySnapshot.visibility.camera === 'limited-or-empty' ||
        inventorySnapshot.visibility.microphone === 'limited-or-empty'
    );

    const selectedDeviceMissing = isReady &&
        (!cameraListed || !microphoneListed);

    const formatOption = function (option, kind, index) {
        if (option.isSystemDefault) {
            return intl.formatMessage(messages.systemDefault);
        }

        if (option.label) return option.label;

        const message = kind === 'camera' ?
            messages.unnamedCamera : messages.unnamedMicrophone;

        return intl.formatMessage(message, {number: index});
    };

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={intl.formatMessage(messages.title)}
            headerClassName={styles.header}
            onRequestClose={onClose}
        >
            <div className={styles.body}>
                <div className={styles.field}>
                    <label htmlFor="easyblox-camera-device">
                        {intl.formatMessage(messages.camera)}
                    </label>
                    <select
                        id="easyblox-camera-device"
                        value={cameraDeviceId === null ? '' : cameraDeviceId}
                        onChange={handleCameraChange}
                    >
                        {cameraOptions.map((option, index) => (
                            <option
                                key={option.deviceId === null ?
                                    'system-default' : `${option.deviceId}-${index}`}
                                value={option.deviceId === null ? '' : option.deviceId}
                            >
                                {formatOption(option, 'camera', index)}
                            </option>
                        ))}
                        {cameraDeviceId !== null && !cameraListed ? (
                            <option value={cameraDeviceId}>
                                {intl.formatMessage(messages.unavailable)}
                            </option>
                        ) : null}
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="easyblox-microphone-device">
                        {intl.formatMessage(messages.microphone)}
                    </label>
                    <select
                        id="easyblox-microphone-device"
                        value={microphoneDeviceId === null ? '' : microphoneDeviceId}
                        onChange={handleMicrophoneChange}
                    >
                        {microphoneOptions.map((option, index) => (
                            <option
                                key={option.deviceId === null ?
                                    'system-default' : `${option.deviceId}-${index}`}
                                value={option.deviceId === null ? '' : option.deviceId}
                            >
                                {formatOption(option, 'microphone', index)}
                            </option>
                        ))}
                        {microphoneDeviceId !== null && !microphoneListed ? (
                            <option value={microphoneDeviceId}>
                                {intl.formatMessage(messages.unavailable)}
                            </option>
                        ) : null}
                    </select>
                </div>

                <div
                    className={styles.information}
                    role="status"
                    aria-live="polite"
                >
                    {isLoading ? (
                        <p>{intl.formatMessage(messages.loading)}</p>
                    ) : null}

                    {isUnsupported ? (
                        <p>{intl.formatMessage(messages.unsupported)}</p>
                    ) : null}

                    {hasError ? (
                        <p>{intl.formatMessage(messages.enumerationError)}</p>
                    ) : null}

                    {hasLimitedVisibility ? (
                        <p>{intl.formatMessage(messages.limited)}</p>
                    ) : null}

                    {selectedDeviceMissing ? (
                        <p>{intl.formatMessage(messages.unavailable)}</p>
                    ) : null}

                    {preferenceSnapshot.persistence === 'available' ? null : (
                        <p>{intl.formatMessage(messages.persistenceUnavailable)}</p>
                    )}

                    <p>{intl.formatMessage(messages.information)}</p>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.refreshButton}
                    type="button"
                    disabled={isLoading}
                    onClick={handleRefresh}
                >
                    {intl.formatMessage(messages.refresh)}
                </button>

                <button
                    className={styles.doneButton}
                    type="button"
                    onClick={onClose}
                >
                    {intl.formatMessage(messages.done)}
                </button>
            </div>
        </Modal>
    );
};

MediaInputModal.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default MediaInputModal;
