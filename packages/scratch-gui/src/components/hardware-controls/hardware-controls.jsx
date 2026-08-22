import PropTypes from 'prop-types';
import React from 'react';
import styles from './hardware-controls.css';
import ConfirmationPrompt from '../confirmation-prompt/confirmation-prompt.jsx';
import {PopupAlign, PopupSide} from '../../lib/calculatePopupPosition.js';
import {getBoardById} from '../../lib/libraries/extensions/index.jsx';

const CONNECTION_LABELS = {
    disconnected: 'Conectar placa',
    connecting: 'Conectando...',
    connected: 'Desconectar placa',
    error: 'Erro de conexão. Tentar novamente'
};

const HardwareControls = ({
    connectionState,
    selectedBoard,
    onConnect,
    onDisconnect,
    onSelectBoard
}) => {
    const connectionButtonRef = React.useRef(null);
    const [disconnectPromptOpen, setDisconnectPromptOpen] = React.useState(false);

    const board = selectedBoard ?
        getBoardById(selectedBoard) :
        null;

    const boardLabel = board ?
        board.name :
        'Selecionar Placa';

    const boardAriaLabel = board ?
        'Alterar placa' :
        'Selecionar placa';

    const connectionLabel = CONNECTION_LABELS[connectionState];

    const handleDisconnectCancel = () => {
        setDisconnectPromptOpen(false);
    };

    const handleDisconnectConfirm = () => {
        setDisconnectPromptOpen(false);
        onDisconnect();
    };

    const handleConnectionClick = React.useCallback(() => {
        if (connectionState === 'connected') {
            setDisconnectPromptOpen(true);
            return;
        }

        if (connectionState !== 'connecting') {
            onConnect();
        }
    }, [connectionState, onConnect]);

    return (
        <div className={styles.hardwareControls}>
            <span className={styles.boardLabel}>
                Placa
            </span>

            <button
                aria-label={boardAriaLabel}
                className={styles.boardButton}
                onClick={onSelectBoard}
                type="button"
            >
                {boardLabel}
            </button>

            <button
                aria-label={connectionLabel}
                className={`${styles.connectionButton} ${styles[connectionState]}`}
                disabled={connectionState === 'connecting'}
                onClick={handleConnectionClick}
                ref={connectionButtonRef}
                title={connectionLabel}
                type="button"
            />

            <ConfirmationPrompt
                align={PopupAlign.CENTER}
                cancelButtonConfig={{
                    label: 'Cancelar',
                    onClick: handleDisconnectCancel
                }}
                confirmButtonConfig={{
                    className: styles.disconnectConfirmButton,
                    label: 'Desconectar',
                    onClick: handleDisconnectConfirm
                }}
                isOpen={disconnectPromptOpen}
                layoutConfig={{
                    modalWidth: 280
                }}
                message={`Desconectar ${boardLabel}?`}
                relativeElementRef={connectionButtonRef}
                side={PopupSide.DOWN}
                title="Desconectar placa"
            />

        </div>
    );
};

HardwareControls.propTypes = {
    connectionState: PropTypes.oneOf([
        'disconnected',
        'connecting',
        'connected',
        'error'
    ]),
    onConnect: PropTypes.func,
    onDisconnect: PropTypes.func,
    onSelectBoard: PropTypes.func,
    selectedBoard: PropTypes.string
};

HardwareControls.defaultProps = {
    connectionState: 'disconnected',
    onConnect: () => {},
    onDisconnect: () => {},
    onSelectBoard: () => {},
    selectedBoard: null
};

export default HardwareControls;
