import PropTypes from 'prop-types';
import React, {useCallback, useRef} from 'react';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';

import Modal from '../modal/modal.jsx';
import sharedMessages from '../../lib/shared-messages';
import styles from './stage-firmware-preparation-modal.css';

const messages = defineMessages({
    title: {
        id: 'gui.stageFirmwarePreparation.title',
        defaultMessage: 'Preparar Modo Palco?',
        description: 'Title for confirming preparation of the board for Stage mode'
    },
    legacy: {
        id: 'gui.stageFirmwarePreparation.legacy',
        defaultMessage: 'A preparação do Modo Palco desta placa precisa ser atualizada.',
        description: 'Explanation when the board has an older Stage preparation'
    },
    incompatible: {
        id: 'gui.stageFirmwarePreparation.incompatible',
        defaultMessage: 'A preparação do Modo Palco desta placa não é compatível com esta versão do EasyBlox.',
        description: 'Explanation when the board preparation is incompatible with EasyBlox'
    },
    unidentified: {
        id: 'gui.stageFirmwarePreparation.unidentified',
        defaultMessage: 'O EasyBlox não conseguiu confirmar se esta placa está pronta para o Modo Palco.',
        description: 'Explanation when EasyBlox cannot confirm that the board is ready for Stage mode'
    },
    warning: {
        id: 'gui.stageFirmwarePreparation.warning',
        defaultMessage: 'Para continuar, o EasyBlox precisa preparar a placa. ' +
            'Esse processo substituirá o programa que está gravado nela atualmente.',
        description: 'Warning that preparing Stage mode replaces the program stored on the board'
    },
    action: {
        id: 'gui.stageFirmwarePreparation.action',
        defaultMessage: 'Preparar Modo Palco',
        description: 'Action to confirm preparation of the board for Stage mode'
    }
});

const StageFirmwarePreparationModal = ({issue, onConfirm, onCancel}) => {
    const intl = useIntl();
    const decided = useRef(false);

    const handleConfirm = useCallback(() => {
        if (decided.current) return;
        decided.current = true;
        onConfirm();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        if (decided.current) return;
        decided.current = true;
        onCancel();
    }, [onCancel]);

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={intl.formatMessage(messages.title)}
            headerClassName={styles.header}
            onRequestClose={handleCancel}
        >
            <div className={styles.body}>
                <p className={styles.message}>
                    <FormattedMessage {...messages[issue]} />
                </p>
                <p className={styles.warning}>
                    <FormattedMessage {...messages.warning} />
                </p>
                <div className={styles.actions}>
                    <button
                        autoFocus
                        className={styles.cancelButton}
                        type="button"
                        onClick={handleCancel}
                    >
                        <FormattedMessage {...sharedMessages.projectReplacementCancel} />
                    </button>
                    <button
                        className={styles.confirmButton}
                        type="button"
                        onClick={handleConfirm}
                    >
                        <FormattedMessage {...messages.action} />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

StageFirmwarePreparationModal.propTypes = {
    issue: PropTypes.oneOf(['legacy', 'incompatible', 'unidentified']).isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default StageFirmwarePreparationModal;
