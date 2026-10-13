import {
    stagePreparationMessages,
    stagePreparationErrorMessages,
    getStagePreparationErrorMessage
} from './easyblox-stage-firmware-messages';

const ERROR_MESSAGES = Object.freeze(Object.fromEntries(
    Object.entries(stagePreparationErrorMessages).map(([code, descriptor]) => [code, descriptor.defaultMessage])
));

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
            getStagePreparationErrorMessage(code).defaultMessage,
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
        formatMessage = function (descriptor) {
            return descriptor.defaultMessage;
        },
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
                formatMessage(stagePreparationMessages.restoring)
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
                formatMessage(stagePreparationMessages.reconnecting)
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
                formatMessage(stagePreparationMessages.ready)
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
                formatMessage(getStagePreparationErrorMessage(translated.code)),
                {
                    code:
                        translated.code
                }
            );

            throw translated;
        }
    };

export default runEasyBloxStageFirmwareRestore;
