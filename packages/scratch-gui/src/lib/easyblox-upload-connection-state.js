const PHYSICAL_AVAILABILITY_ERROR_CODES = new Set([
    'PORT_NOT_FOUND',
    'BOARD_NOT_RESPONDING'
]);

export const shouldIgnorePeripheralDisconnected =
    (
        uploadState,
        uploadOwnsSerialHandoff = false
    ) =>
        uploadOwnsSerialHandoff ||
        uploadState === 'preparing' ||
        uploadState === 'uploading';

export const resolveUploadConnectionState =
    (currentState, status = {}) => {
        switch (status.state) {
        case 'building':
            return currentState;

        case 'preparing':
        case 'uploading':
            return 'uploading';

        case 'success':
            return 'connected';

        case 'error':
            if (
                PHYSICAL_AVAILABILITY_ERROR_CODES.has(
                    status.code
                )
            ) {
                return 'error';
            }

            return currentState === 'uploading' ?
                'connected' :
                currentState;

        default:
            return currentState;
        }
    };
