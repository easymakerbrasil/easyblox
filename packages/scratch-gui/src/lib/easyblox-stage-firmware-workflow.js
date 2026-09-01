const ERROR_MESSAGES = Object.freeze({
    BOARD_CONNECTION_REQUIRED:
        'Conecte o Arduino UNO ao EasyBlox para preparar o Modo Palco.',
    PORT_RELEASE_FAILED:
        'Não foi possível liberar a conexão com a placa. Desconecte e tente novamente.',
    HARDWARE_SERVICE_UNAVAILABLE:
        'O serviço de gravação do EasyBlox não está disponível.',
    TOOLCHAIN_NOT_FOUND:
        'O ambiente de gravação do Arduino não foi encontrado neste computador.',
    STAGE_FIRMWARE_NOT_FOUND:
        'O firmware do Modo Palco não foi encontrado.',
    STAGE_FIRMWARE_INVALID:
        'O firmware do Modo Palco não pôde ser utilizado.',
    BUILD_FAILED:
        'Não foi possível preparar o Arduino UNO para o Modo Palco.',
    PORT_NOT_FOUND:
        'A placa não foi encontrada. Verifique o cabo USB e tente novamente.',
    PORT_AMBIGUOUS:
        'Há mais de uma placa USB igual conectada. Deixe apenas a placa que deseja usar.',
    PORT_BUSY:
        'A porta da placa está ocupada. Feche outros programas que possam estar usando o Arduino.',
    BOARD_NOT_RESPONDING:
        'O Arduino UNO não respondeu durante a preparação do Modo Palco.',
    UPLOAD_FAILED:
        'Não foi possível preparar o Arduino UNO para o Modo Palco.',
    STAGE_HANDSHAKE_FAILED:
        'O Arduino UNO não respondeu ao Modo Palco após a preparação.',
    STAGE_RECONNECT_FAILED:
        'Não foi possível restaurar a comunicação com o Arduino UNO.',
    DEFAULT:
        'Não foi possível preparar o Arduino UNO para o Modo Palco.'
});

export class EasyBloxStageFirmwareWorkflowError extends Error {
    constructor (
        code,
        message,
        cause = null
    ) {
        super(message);

        this.name =
            'EasyBloxStageFirmwareWorkflowError';

        this.code = code;

        if (cause) {
            this.cause = cause;
        }
    }
}

const emitStatus = function (
    onStatus,
    state,
    message,
    details = {}
) {
    if (
        typeof onStatus ===
        'function'
    ) {
        onStatus({
            state,
            message,
            ...details
        });
    }
};

const createPortHint =
    function (
        connectionInfo,
        cachedPortHint
    ) {
        if (
            connectionInfo &&
            typeof connectionInfo.usbVendorId ===
                'number' &&
            typeof connectionInfo.usbProductId ===
                'number'
        ) {
            return {
                usbVendorId:
                    connectionInfo.usbVendorId,
                usbProductId:
                    connectionInfo.usbProductId
            };
        }

        if (
            cachedPortHint &&
            typeof cachedPortHint ===
                'object'
        ) {
            return {
                ...cachedPortHint
            };
        }

        return null;
    };

const translateError =
    function (error) {
        if (
            error instanceof
            EasyBloxStageFirmwareWorkflowError
        ) {
            return error;
        }

        const code =
            error &&
            error.code ?
                error.code :
                'DEFAULT';

        return new EasyBloxStageFirmwareWorkflowError(
            code,
            ERROR_MESSAGES[code] ||
                ERROR_MESSAGES.DEFAULT,
            error
        );
    };

const wait =
    milliseconds =>
        new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    milliseconds
                )
        );

const waitForStageHandshake =
    function ({
        vm,
        extensionId,
        peripheralId,
        timeoutMs
    }) {
        return new Promise(
            (resolve, reject) => {
                let timeoutId = null;

                const matchesExtension =
                    data =>
                        !data ||
                        !data.extensionId ||
                        data.extensionId ===
                            extensionId;

                const cleanup = () => {
                    if (timeoutId) {
                        clearTimeout(
                            timeoutId
                        );
                    }

                    vm.removeListener(
                        'PERIPHERAL_STAGE_READY',
                        handleReady
                    );

                    vm.removeListener(
                        'PERIPHERAL_STAGE_HANDSHAKE_FAILED',
                        handleHandshakeFailed
                    );

                    vm.removeListener(
                        'PERIPHERAL_REQUEST_ERROR',
                        handleConnectionFailed
                    );

                    vm.removeListener(
                        'PERIPHERAL_CONNECTION_LOST_ERROR',
                        handleConnectionFailed
                    );
                };

                const succeed = () => {
                    cleanup();
                    resolve(true);
                };

                const fail =
                    error => {
                        cleanup();
                        reject(error);
                    };

                const handleReady =
                    data => {
                        if (
                            matchesExtension(
                                data
                            )
                        ) {
                            succeed();
                        }
                    };

                const handleHandshakeFailed =
                    data => {
                        if (
                            !matchesExtension(
                                data
                            )
                        ) {
                            return;
                        }

                        fail(
                            new EasyBloxStageFirmwareWorkflowError(
                                'STAGE_HANDSHAKE_FAILED',
                                ERROR_MESSAGES
                                    .STAGE_HANDSHAKE_FAILED
                            )
                        );
                    };

                const handleConnectionFailed =
                    data => {
                        if (
                            !matchesExtension(
                                data
                            )
                        ) {
                            return;
                        }

                        fail(
                            new EasyBloxStageFirmwareWorkflowError(
                                'STAGE_RECONNECT_FAILED',
                                ERROR_MESSAGES
                                    .STAGE_RECONNECT_FAILED
                            )
                        );
                    };

                vm.on(
                    'PERIPHERAL_STAGE_READY',
                    handleReady
                );

                vm.on(
                    'PERIPHERAL_STAGE_HANDSHAKE_FAILED',
                    handleHandshakeFailed
                );

                vm.on(
                    'PERIPHERAL_REQUEST_ERROR',
                    handleConnectionFailed
                );

                vm.on(
                    'PERIPHERAL_CONNECTION_LOST_ERROR',
                    handleConnectionFailed
                );

                timeoutId =
                    setTimeout(
                        () => {
                            fail(
                                new EasyBloxStageFirmwareWorkflowError(
                                    'STAGE_HANDSHAKE_FAILED',
                                    ERROR_MESSAGES
                                        .STAGE_HANDSHAKE_FAILED
                                )
                            );
                        },
                        timeoutMs
                    );

                try {
                    vm.connectPeripheral(
                        extensionId,
                        peripheralId
                    );
                } catch (error) {
                    fail(
                        new EasyBloxStageFirmwareWorkflowError(
                            'STAGE_RECONNECT_FAILED',
                            ERROR_MESSAGES
                                .STAGE_RECONNECT_FAILED,
                            error
                        )
                    );
                }
            }
        );
    };

export const runEasyBloxStageFirmwareRestore =
    async function ({
        vm,
        board,
        boardId,
        cachedPortHint,
        peripheralId,
        client,
        onStatus,
        rebootDelayMs = 1000,
        handshakeTimeoutMs = 5000
    }) {
        try {
            if (
                !board ||
                !board.extensionId ||
                !boardId ||
                !client
            ) {
                throw new EasyBloxStageFirmwareWorkflowError(
                    'BOARD_CONNECTION_REQUIRED',
                    ERROR_MESSAGES
                        .BOARD_CONNECTION_REQUIRED
                );
            }

            const connectionInfo =
                typeof vm
                    .getPeripheralConnectionInfo ===
                    'function' ?
                    vm.getPeripheralConnectionInfo(
                        board.extensionId
                    ) :
                    null;

            const portHint =
                createPortHint(
                    connectionInfo,
                    cachedPortHint
                );

            const reconnectPeripheralId =
                connectionInfo &&
                connectionInfo.peripheralId ?
                    connectionInfo.peripheralId :
                    peripheralId;

            if (
                !portHint ||
                !reconnectPeripheralId
            ) {
                throw new EasyBloxStageFirmwareWorkflowError(
                    'BOARD_CONNECTION_REQUIRED',
                    ERROR_MESSAGES
                        .BOARD_CONNECTION_REQUIRED
                );
            }

            emitStatus(
                onStatus,
                'restoring-stage',
                'Preparando Arduino UNO para o Modo Palco...'
            );

            if (
                vm.getPeripheralIsConnected(
                    board.extensionId
                )
            ) {
                const released =
                    await vm.disconnectPeripheral(
                        board.extensionId
                    );

                if (!released) {
                    throw new EasyBloxStageFirmwareWorkflowError(
                        'PORT_RELEASE_FAILED',
                        ERROR_MESSAGES
                            .PORT_RELEASE_FAILED
                    );
                }
            }

            const result =
                await client.restoreStageFirmware({
                    boardId,
                    portHint
                });

            emitStatus(
                onStatus,
                'reconnecting-stage',
                'Restaurando a comunicação com o Arduino UNO...'
            );

            await wait(
                rebootDelayMs
            );

            await waitForStageHandshake({
                vm,
                extensionId:
                    board.extensionId,
                peripheralId:
                    reconnectPeripheralId,
                timeoutMs:
                    handshakeTimeoutMs
            });

            emitStatus(
                onStatus,
                'stage-ready',
                'Arduino UNO pronto no Modo Palco.'
            );

            return {
                result,
                portHint,
                peripheralId:
                    reconnectPeripheralId
            };
        } catch (error) {
            const translated =
                translateError(
                    error
                );

            emitStatus(
                onStatus,
                'error',
                translated.message,
                {
                    code:
                        translated.code
                }
            );

            throw translated;
        }
    };

export default runEasyBloxStageFirmwareRestore;
