const DEFAULT_RECONNECT_DELAY = 1000;

const emitState = function (
    onState,
    state,
    baudRate
) {
    if (typeof onState === 'function') {
        onState({
            state,
            baudRate
        });
    }
};

const wait = delay => new Promise(resolve => {
    setTimeout(resolve, delay);
});

/**
 * Reconnect the browser-owned Web Serial peripheral after native Upload so
 * the uploaded sketch can be observed as raw Serial Monitor traffic.
 *
 * @param {object} options Monitor startup options.
 * @param {object} options.vm Scratch VM.
 * @param {object} options.board Selected board metadata.
 * @param {?string} options.peripheralId Browser-owned Web Serial id.
 * @param {?object} options.serialConfig Validated Upload Serial configuration.
 * @param {number} [options.reconnectDelay] Delay after native upload.
 * @param {?Function} [options.onState] Monitor-state callback.
 * @returns {Promise<object>} Monitor startup result.
 */
export const startEasyBloxSerialMonitor =
    async function ({
        vm,
        board,
        peripheralId,
        serialConfig,
        reconnectDelay = DEFAULT_RECONNECT_DELAY,
        onState = null
    }) {
        if (
            !serialConfig ||
            !Number.isInteger(serialConfig.baudRate) ||
            serialConfig.baudRate <= 0
        ) {
            emitState(
                onState,
                'unavailable',
                null
            );

            return {
                started: false,
                reason: 'serial-not-configured'
            };
        }

        const baudRate = serialConfig.baudRate;

        if (!peripheralId) {
            emitState(
                onState,
                'connection-required',
                baudRate
            );

            return {
                started: false,
                reason: 'peripheral-id-required'
            };
        }

        if (
            !vm ||
            !board ||
            !board.extensionId ||
            typeof vm.connectPeripheralSerialMonitor !==
                'function'
        ) {
            emitState(
                onState,
                'error',
                baudRate
            );

            return {
                started: false,
                reason: 'monitor-unavailable'
            };
        }

        emitState(
            onState,
            'connecting',
            baudRate
        );

        if (reconnectDelay > 0) {
            await wait(reconnectDelay);
        }

        const accepted =
            vm.connectPeripheralSerialMonitor(
                board.extensionId,
                peripheralId,
                baudRate
            );

        if (!accepted) {
            emitState(
                onState,
                'error',
                baudRate
            );

            return {
                started: false,
                reason: 'connection-rejected'
            };
        }

        return {
            started: true,
            baudRate
        };
    };

export default startEasyBloxSerialMonitor;
