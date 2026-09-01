const ERROR_MESSAGES = Object.freeze({
    BOARD_CONNECTION_REQUIRED:
        'Conecte a placa ao EasyBlox antes do primeiro envio.',
    PORT_RELEASE_FAILED:
        'Não foi possível liberar a conexão com a placa. Desconecte e tente novamente.',
    HARDWARE_SERVICE_UNAVAILABLE:
        'O serviço de gravação do EasyBlox não está disponível.',
    TOOLCHAIN_NOT_FOUND:
        'O ambiente de gravação do Arduino não foi encontrado neste computador.',
    BUILD_FAILED:
        'Não foi possível compilar o programa. Revise os blocos usados e tente novamente.',
    PORT_NOT_FOUND:
        'A placa não foi encontrada. Verifique o cabo USB e tente novamente.',
    PORT_AMBIGUOUS:
        'Há mais de uma placa USB igual conectada. Deixe apenas a placa que deseja programar.',
    PORT_BUSY:
        'A porta da placa está ocupada. Feche outros programas que possam estar usando o Arduino.',
    BOARD_NOT_RESPONDING:
        'A placa não respondeu à gravação. Verifique a conexão USB e tente novamente.',
    UPLOAD_FAILED:
        'Não foi possível enviar o programa para a placa.',
    DEFAULT:
        'Não foi possível concluir o envio para a placa.'
});

export class EasyBloxUploadWorkflowError extends Error {
    constructor (
        code,
        message,
        cause = null
    ) {
        super(message);

        this.name =
            'EasyBloxUploadWorkflowError';

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
                    connectionInfo
                        .usbVendorId,
                usbProductId:
                    connectionInfo
                        .usbProductId
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
            EasyBloxUploadWorkflowError
        ) {
            return error;
        }

        const code =
            error &&
            error.code ?
                error.code :
                'DEFAULT';

        return new EasyBloxUploadWorkflowError(
            code,
            ERROR_MESSAGES[code] ||
                ERROR_MESSAGES.DEFAULT,
            error
        );
    };

export const runEasyBloxUpload =
    async function ({
        vm,
        board,
        boardId,
        boardName,
        code,
        cachedPortHint,
        client,
        onStatus
    }) {
        let buildId = null;

        try {
            if (
                !board ||
                !board.extensionId ||
                !boardId ||
                typeof code !== 'string' ||
                code.trim().length === 0
            ) {
                throw new EasyBloxUploadWorkflowError(
                    'INVALID_UPLOAD_REQUEST',
                    ERROR_MESSAGES.DEFAULT
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

            if (!portHint) {
                throw new EasyBloxUploadWorkflowError(
                    'BOARD_CONNECTION_REQUIRED',
                    ERROR_MESSAGES
                        .BOARD_CONNECTION_REQUIRED
                );
            }

            emitStatus(
                onStatus,
                'building',
                'Compilando o programa...'
            );

            const build =
                await client.build({
                    boardId,
                    code
                });

            buildId =
                build.buildId;

            if (
                vm.getPeripheralIsConnected(
                    board.extensionId
                )
            ) {
                emitStatus(
                    onStatus,
                    'preparing',
                    'Preparando a placa...'
                );

                const released =
                    await vm.disconnectPeripheral(
                        board.extensionId
                    );

                if (!released) {
                    throw new EasyBloxUploadWorkflowError(
                        'PORT_RELEASE_FAILED',
                        ERROR_MESSAGES
                            .PORT_RELEASE_FAILED
                    );
                }
            }

            emitStatus(
                onStatus,
                'uploading',
                'Gravando na placa...'
            );

            const result =
                await client.upload({
                    buildId,
                    portHint
                });

            buildId = null;

            emitStatus(
                onStatus,
                'success',
                `Programa enviado para ${boardName || 'a placa'}.`
            );

            return {
                result,
                portHint
            };
        } catch (error) {
            if (buildId) {
                try {
                    await client.discard(
                        buildId
                    );
                } catch (cleanupError) {
                    // The service may already have cleaned the build after an upload attempt.
                }
            }

            const translated =
                translateError(error);

            emitStatus(
                onStatus,
                'error',
                translated.message,
                {
                    code: translated.code
                }
            );

            throw translated;
        }
    };

export default runEasyBloxUpload;
