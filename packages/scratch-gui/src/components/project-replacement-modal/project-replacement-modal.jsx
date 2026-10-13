import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import Modal from '../modal/modal.jsx';
import sharedMessages from '../../lib/shared-messages';
import styles from './project-replacement-modal.css';

const titles = {
    open: sharedMessages.projectReplacementOpenTitle,
    import: sharedMessages.projectReplacementImportTitle,
    new: sharedMessages.projectReplacementNewTitle
};
const actions = {
    open: sharedMessages.projectReplacementOpenAction,
    import: sharedMessages.projectReplacementImportAction,
    new: sharedMessages.projectReplacementNewAction
};

const ProjectReplacementModal = ({isOpen, operation, onConfirm, onCancel}) => {
    const intl = useIntl();
    const decided = useRef(false);

    useEffect(() => {
        decided.current = false;
        if (!isOpen) return;

        // Document shortcuts must not start another replacement behind the modal.
        const handleProjectShortcut = function (event) {
            if ((event.ctrlKey || event.metaKey) && ['n', 'o'].includes(event.key.toLowerCase())) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        document.addEventListener('keydown', handleProjectShortcut, true);
        return () => document.removeEventListener('keydown', handleProjectShortcut, true);
    }, [isOpen]);

    const finish = useCallback(callback => {
        if (decided.current) return;
        decided.current = true;
        callback();
    }, []);
    const handleConfirm = useCallback(() => finish(onConfirm), [finish, onConfirm]);
    const handleCancel = useCallback(() => finish(onCancel), [finish, onCancel]);

    if (!isOpen) return null;

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={intl.formatMessage(titles[operation])}
            headerClassName={styles.header}
            onRequestClose={handleCancel}
        >
            <div className={styles.body}>
                <p className={styles.message}>
                    <FormattedMessage {...sharedMessages.projectReplacementWarning} />
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
                        <FormattedMessage {...actions[operation]} />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

ProjectReplacementModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    operation: PropTypes.oneOf(['open', 'import', 'new']).isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default ProjectReplacementModal;
