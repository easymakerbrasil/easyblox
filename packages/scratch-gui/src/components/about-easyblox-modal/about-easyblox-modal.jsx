import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';

import Modal from '../modal/modal.jsx';
import logo from '../menu-bar/easyblox-logo.svg';
import styles from './about-easyblox-modal.css';

const messages = defineMessages({
    title: {
        id: 'gui.aboutEasyBlox.title',
        defaultMessage: 'Sobre o EasyBlox',
        description: 'Title and settings action for EasyBlox application information'
    },
    institution: {
        id: 'gui.aboutEasyBlox.institution',
        defaultMessage: 'EasyMaker Robótica Educacional',
        description: 'Official institutional identity'
    },
    loading: {
        id: 'gui.aboutEasyBlox.loading',
        defaultMessage: 'Consultando versão do Desktop…',
        description: 'Desktop metadata query in progress'
    },
    browser: {
        id: 'gui.aboutEasyBlox.browser',
        defaultMessage: 'Versão do Desktop indisponível neste navegador.',
        description: 'Desktop bridge is not present in this browser'
    },
    unavailable: {
        id: 'gui.aboutEasyBlox.unavailable',
        defaultMessage: 'Não foi possível consultar a versão do Desktop.',
        description: 'Desktop metadata query failed'
    },
    version: {
        id: 'gui.aboutEasyBlox.version',
        defaultMessage: 'Versão {version}',
        description: 'Installed Desktop version returned by Electron'
    },
    close: {
        id: 'gui.aboutEasyBlox.close',
        defaultMessage: 'Fechar',
        description: 'Close application information'
    }
});

const AboutEasyBloxModal = ({result, onClose}) => {
    const intl = useIntl();
    const closed = useRef(false);
    const handleClose = useCallback(() => {
        if (closed.current) return;
        closed.current = true;
        onClose();
    }, [onClose]);

    useEffect(() => {
        const handleProjectShortcut = function (event) {
            if ((event.ctrlKey || event.metaKey) && !event.altKey &&
                ['n', 'o', 's'].includes(event.key.toLowerCase())) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        document.addEventListener('keydown', handleProjectShortcut, true);
        return () => document.removeEventListener('keydown', handleProjectShortcut, true);
    }, []);

    // The shared X is a focusable role=button element without native keyboard activation.
    const handleCloseKeyDown = useMemo(() => function (event) {
        if (['Enter', ' '].includes(event.key) && event.target.getAttribute('role') === 'button') {
            event.preventDefault();
            event.stopPropagation();
            handleClose();
        }
    }, [handleClose]);
    const available = result.status === 'available';
    const statusMessage = result.status === 'loading' ? messages.loading :
        (result.reason === 'bridge-absent' ? messages.browser : messages.unavailable);

    return (
        <div onKeyDownCapture={handleCloseKeyDown}>
            <Modal
                className={styles.modalContent}
                contentLabel={intl.formatMessage(messages.title)}
                headerClassName={styles.header}
                onRequestClose={handleClose}
            >
                <div className={styles.body}>
                    <img
                        className={styles.logo}
                        src={logo}
                        alt="EasyBlox"
                    />
                    <p className={styles.productName}>{available ? result.appInfo.productName : 'EasyBlox'}</p>
                    <p className={styles.institution}><FormattedMessage {...messages.institution} /></p>
                    <p
                        className={styles.status}
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {available ? <FormattedMessage
                            {...messages.version}
                            values={{version: result.appInfo.version}}
                        /> : <FormattedMessage {...statusMessage} />}
                    </p>
                </div>
                <div className={styles.actions}>
                    <button
                        autoFocus
                        className={styles.closeButton}
                        type="button"
                        onClick={handleClose}
                    >
                        <FormattedMessage {...messages.close} />
                    </button>
                </div>
            </Modal>
        </div>
    );
};

AboutEasyBloxModal.propTypes = {
    result: PropTypes.shape({
        status: PropTypes.oneOf(['loading', 'available', 'unavailable']).isRequired,
        reason: PropTypes.string,
        appInfo: PropTypes.shape({
            productName: PropTypes.string.isRequired,
            version: PropTypes.string.isRequired
        })
    }).isRequired,
    onClose: PropTypes.func.isRequired
};

export default AboutEasyBloxModal;
