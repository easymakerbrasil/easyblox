const {
    EasyConectWebSession
} = require('../index');

const secureContextElement =
    document.getElementById(
        'secure-context'
    );

const webSerialElement =
    document.getElementById(
        'web-serial'
    );

const connectionStateElement =
    document.getElementById(
        'connection-state'
    );

const connectionButton =
    document.getElementById(
        'connection-button'
    );

const messageElement =
    document.getElementById(
        'message'
    );

let session =
    null;

const hasWebSerial =
    () =>
        typeof navigator !==
            'undefined' &&
        navigator.serial &&
        typeof navigator.serial
            .requestPort ===
            'function';

const renderState =
    state => {
        switch (state.status) {
        case 'connecting':
            connectionStateElement
                .textContent =
                    'Conectando...';

            connectionButton
                .textContent =
                    'Conectando...';

            connectionButton.disabled =
                true;

            return;

        case 'connected':
            connectionStateElement
                .textContent =
                    'Conectado';

            connectionButton
                .textContent =
                    'Desconectar';

            connectionButton.disabled =
                false;

            return;

        case 'disconnecting':
            connectionStateElement
                .textContent =
                    'Desconectando...';

            connectionButton
                .textContent =
                    'Desconectando...';

            connectionButton.disabled =
                true;

            return;

        case 'error':
            connectionStateElement
                .textContent =
                    'Erro';

            connectionButton
                .textContent =
                    'Conectar';

            connectionButton.disabled =
                false;

            return;

        default:
            connectionStateElement
                .textContent =
                    'Desconectado';

            connectionButton
                .textContent =
                    'Conectar';

            connectionButton.disabled =
                false;
        }
    };

const initialize =
    () => {
        secureContextElement.textContent =
            window.isSecureContext ?
                'Sim' :
                'Não';

        if (!hasWebSerial()) {
            webSerialElement.textContent =
                'Indisponível';

            connectionStateElement
                .textContent =
                    'Indisponível';

            messageElement.textContent =
                window.isSecureContext ?
                    'Este navegador não disponibiliza Web Serial.' :
                    'A página não está em um contexto seguro.';

            return;
        }

        webSerialElement.textContent =
            'Disponível';

        try {
            session =
                new EasyConectWebSession();

            session.onStateChange(
                renderState
            );

            renderState(
                session.getState()
            );

            messageElement.textContent =
                'Clique em Conectar e selecione o dispositivo Bluetooth Serial.';
        } catch (error) {
            connectionStateElement
                .textContent =
                    'Erro';

            messageElement.textContent =
                error instanceof Error ?
                    error.message :
                    'Falha ao inicializar o EasyConect Web.';

            return;
        }

        connectionButton.disabled =
            false;
    };

connectionButton.addEventListener(
    'click',
    async () => {
        if (!session) {
            return;
        }

        const state =
            session.getState();

        if (
            state.status ===
                'connected'
        ) {
            messageElement.textContent =
                'Encerrando conexão...';

            await session.disconnect();

            messageElement.textContent =
                'Conexão encerrada.';

            return;
        }

        messageElement.textContent =
            'Selecione o HC-05, HC-06 ou dispositivo EasyMaker no seletor do navegador.';

        const connected =
            await session.connect();

        const resultingState =
            session.getState();

        if (connected) {
            messageElement.textContent =
                'Handshake EBCP confirmado. Comunicação EasyConect ativa.';

            return;
        }

        if (
            resultingState.errorCode ===
                'connection-lost'
        ) {
            messageElement.textContent =
                'A conexão física foi perdida.';

            return;
        }

        messageElement.textContent =
            'Não foi possível concluir a conexão e o handshake EBCP.';
    }
);

window.addEventListener(
    'beforeunload',
    () => {
        if (session) {
            session.dispose();
        }
    }
);

const registerServiceWorker =
    async () => {
        if (
            !(
                'serviceWorker' in
                navigator
            )
        ) {
            return false;
        }

        try {
            await navigator
                .serviceWorker
                .register(
                    '/service-worker.js',
                    {
                        scope:
                            '/'
                    }
                );

            return true;
        } catch (error) {
            return false;
        }
    };

registerServiceWorker();

initialize();
