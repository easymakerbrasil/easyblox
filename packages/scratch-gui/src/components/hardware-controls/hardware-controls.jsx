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
    uploading: 'Enviando programa...',
    restoring: 'Preparando Modo Palco...',
    error: 'Erro de conexão. Tentar novamente'
};

const HardwareControls = ({
    connectionState,
    selectedBoard,
    onConnect,
    onDisconnect,
    onPrepareStageFirmware,
    onSelectBoard,
    stageFirmwareIssue
}) => {
    const connectionButtonRef = React.useRef(null);
    const [disconnectPromptOpen, setDisconnectPromptOpen] = React.useState(false);
    const [
        stageFirmwarePromptOpen,
        setStageFirmwarePromptOpen
    ] = React.useState(Boolean(stageFirmwareIssue));

    React.useEffect(() => {
        setStageFirmwarePromptOpen(
            Boolean(stageFirmwareIssue)
        );
    }, [stageFirmwareIssue]);

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

    const stageFirmwarePrompt =
        stageFirmwareIssue === 'legacy' ?
            {
                message:
                    'O firmware do Modo Palco precisa ser atualizado.',
                actionLabel:
                    'Atualizar para o Modo Palco'
            } :
            stageFirmwareIssue === 'incompatible' ?
                {
                    message:
                        'A versão do firmware do Modo Palco não é compatível.',
                    actionLabel:
                        'Atualizar para o Modo Palco'
                } :
                stageFirmwareIssue === 'unidentified' ?
                    {
                        message:
                            'O firmware do Modo Palco não foi identificado.',
                        actionLabel:
                            'Preparar para o Modo Palco'
                    } :
                    null;

    const connectionVisualState =
        connectionState === 'uploading' ||
        connectionState === 'restoring' ?
            'connecting' :
            connectionState;

    const handleDisconnectCancel = () => {
        setDisconnectPromptOpen(false);
    };

    const handleDisconnectConfirm = () => {
        setDisconnectPromptOpen(false);
        onDisconnect();
    };

    const handleStageFirmwareCancel = () => {
        setStageFirmwarePromptOpen(false);
    };

    const handleStageFirmwareConfirm = () => {
        setStageFirmwarePromptOpen(false);
        onPrepareStageFirmware();
    };

    const handleConnectionClick = React.useCallback(() => {
        if (stageFirmwareIssue) {
            setStageFirmwarePromptOpen(true);
            return;
        }

        if (connectionState === 'connected') {
            setDisconnectPromptOpen(true);
            return;
        }

        if (
            connectionState !== 'connecting' &&
            connectionState !== 'uploading' &&
            connectionState !== 'restoring'
        ) {
            onConnect();
        }
    }, [
        connectionState,
        onConnect,
        stageFirmwareIssue
    ]);

    return (
        <div className={styles.hardwareControls}>
            <span className={styles.boardLabel}>
                Placa
            </span>

            <button
                aria-label={boardAriaLabel}
                aria-pressed={Boolean(board)}
                className={styles.boardButton}
                onClick={onSelectBoard}
                type="button"
            >
                {boardLabel}
            </button>

            <button
                aria-label={connectionLabel}
                className={`${styles.connectionButton} ${styles[connectionVisualState]}`}
                disabled={
                    connectionState === 'connecting' ||
                    connectionState === 'uploading' ||
                    connectionState === 'restoring'
                }
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

            <ConfirmationPrompt
                align={PopupAlign.CENTER}
                cancelButtonConfig={{
                    label: 'Cancelar',
                    onClick: handleStageFirmwareCancel
                }}
                confirmButtonConfig={{
                    className: styles.disconnectConfirmButton,
                    label:
                        stageFirmwarePrompt ?
                            stageFirmwarePrompt.actionLabel :
                            'Preparar para o Modo Palco',
                    onClick: handleStageFirmwareConfirm
                }}
                isOpen={
                    stageFirmwarePromptOpen &&
                    Boolean(stageFirmwarePrompt)
                }
                layoutConfig={{
                    modalWidth: 320
                }}
                message={
                    stageFirmwarePrompt ?
                        stageFirmwarePrompt.message :
                        ''
                }
                relativeElementRef={connectionButtonRef}
                side={PopupSide.DOWN}
                title="Modo Palco"
            />

        </div>
    );
};

HardwareControls.propTypes = {
    connectionState: PropTypes.oneOf([
        'disconnected',
        'connecting',
        'connected',
        'uploading',
        'error',
        'restoring'
    ]),
    onConnect: PropTypes.func,
    onDisconnect: PropTypes.func,
    onPrepareStageFirmware: PropTypes.func,
    onSelectBoard: PropTypes.func,
    selectedBoard: PropTypes.string,
    stageFirmwareIssue: PropTypes.oneOf([
        'legacy',
        'incompatible',
        'unidentified'
    ])
};

HardwareControls.defaultProps = {
    connectionState: 'disconnected',
    onConnect: () => {},
    onDisconnect: () => {},
    onPrepareStageFirmware: () => {},
    onSelectBoard: () => {},
    selectedBoard: null,
    stageFirmwareIssue: null
};

export default HardwareControls;
