import {defineMessages} from 'react-intl';

export const stagePreparationMessages = defineMessages({
    restoring: {
        id: 'gui.stagePreparation.restoring',
        defaultMessage: 'Preparando a placa para o Modo Palco...',
        description: 'Public Stage preparation status'
    },
    reconnecting: {
        id: 'gui.stagePreparation.reconnecting',
        defaultMessage: 'Restaurando a comunicação com a placa...',
        description: 'Public Stage preparation status'
    },
    ready: {
        id: 'gui.stagePreparation.ready',
        defaultMessage: 'Placa pronta no Modo Palco.',
        description: 'Public Stage preparation status'
    },
    connectionRequired: {
        id: 'gui.stagePreparation.connectionRequired',
        defaultMessage: 'Conecte a placa ao EasyBlox para preparar o Modo Palco.',
        description: 'Public Stage preparation status'
    },
    portReleaseFailed: {
        id: 'gui.stagePreparation.portReleaseFailed',
        defaultMessage: 'Não foi possível liberar a conexão com a placa. ' +
            'Desconecte e reconecte o cabo USB e tente novamente.',
        description: 'Public Stage preparation status'
    },
    serviceUnavailable: {
        id: 'gui.stagePreparation.serviceUnavailable',
        defaultMessage: 'A preparação de placas não está disponível no EasyBlox neste momento. Tente novamente.',
        description: 'Public Stage preparation status'
    },
    toolchainNotFound: {
        id: 'gui.stagePreparation.toolchainNotFound',
        defaultMessage: 'Os recursos necessários para preparar o Modo Palco não estão disponíveis neste computador.',
        description: 'Public Stage preparation status'
    },
    firmwareNotFound: {
        id: 'gui.stagePreparation.firmwareNotFound',
        defaultMessage: 'Os recursos do Modo Palco não estão disponíveis neste computador.',
        description: 'Public Stage preparation status'
    },
    firmwareInvalid: {
        id: 'gui.stagePreparation.firmwareInvalid',
        defaultMessage: 'Os recursos do Modo Palco não puderam ser utilizados.',
        description: 'Public Stage preparation status'
    },
    defaultError: {
        id: 'gui.stagePreparation.defaultError',
        defaultMessage: 'Não foi possível preparar a placa para o Modo Palco.',
        description: 'Public Stage preparation status'
    },
    portNotFound: {
        id: 'gui.stagePreparation.portNotFound',
        defaultMessage: 'A placa não foi encontrada. Verifique o cabo USB e tente novamente.',
        description: 'Public Stage preparation status'
    },
    portAmbiguous: {
        id: 'gui.stagePreparation.portAmbiguous',
        defaultMessage: 'Há mais de uma placa USB que o EasyBlox não conseguiu distinguir. ' +
            'Deixe conectada apenas a placa que deseja usar.',
        description: 'Public Stage preparation status'
    },
    portBusy: {
        id: 'gui.stagePreparation.portBusy',
        defaultMessage: 'A conexão com a placa está ocupada. Feche outros programas que possam estar usando a placa.',
        description: 'Public Stage preparation status'
    },
    boardNotResponding: {
        id: 'gui.stagePreparation.boardNotResponding',
        defaultMessage: 'A placa não respondeu durante a preparação do Modo Palco.',
        description: 'Public Stage preparation status'
    },
    handshakeFailed: {
        id: 'gui.stagePreparation.handshakeFailed',
        defaultMessage: 'A placa foi preparada, mas o EasyBlox não conseguiu confirmar a comunicação no Modo Palco.',
        description: 'Public Stage preparation status'
    },
    reconnectFailed: {
        id: 'gui.stagePreparation.reconnectFailed',
        defaultMessage: 'A placa foi preparada, mas o EasyBlox não conseguiu restabelecer a comunicação.',
        description: 'Public Stage preparation status'
    }
});

export const stagePreparationErrorMessages = Object.freeze(Object.assign(Object.create(null), {
    BOARD_CONNECTION_REQUIRED: stagePreparationMessages.connectionRequired,
    PORT_RELEASE_FAILED: stagePreparationMessages.portReleaseFailed,
    HARDWARE_SERVICE_UNAVAILABLE: stagePreparationMessages.serviceUnavailable,
    TOOLCHAIN_NOT_FOUND: stagePreparationMessages.toolchainNotFound,
    STAGE_FIRMWARE_NOT_FOUND: stagePreparationMessages.firmwareNotFound,
    STAGE_FIRMWARE_INVALID: stagePreparationMessages.firmwareInvalid,
    BUILD_FAILED: stagePreparationMessages.defaultError,
    PORT_NOT_FOUND: stagePreparationMessages.portNotFound,
    PORT_AMBIGUOUS: stagePreparationMessages.portAmbiguous,
    PORT_BUSY: stagePreparationMessages.portBusy,
    BOARD_NOT_RESPONDING: stagePreparationMessages.boardNotResponding,
    UPLOAD_FAILED: stagePreparationMessages.defaultError,
    STAGE_HANDSHAKE_FAILED: stagePreparationMessages.handshakeFailed,
    STAGE_RECONNECT_FAILED: stagePreparationMessages.reconnectFailed,
    DEFAULT: stagePreparationMessages.defaultError
}));

export const getStagePreparationErrorMessage = function (code) {
    return stagePreparationErrorMessages[code] || stagePreparationErrorMessages.DEFAULT;
};
