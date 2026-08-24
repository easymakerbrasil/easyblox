export const EASYBLOX_EXECUTION_MODE_DISABLED_REASON =
    'EASYBLOX_EXECUTION_MODE';

/**
 * Create an EasyBlox connection checker which preserves the Scratch
 * connection rules and additionally prevents new connections involving
 * blocks disabled because of the current execution mode.
 * @param {ScratchBlocks} ScratchBlocks - Scratch Blocks implementation.
 * @returns {Function} EasyBlox connection checker class.
 */
export const createEasyBloxConnectionChecker = ScratchBlocks => {
    const BaseConnectionChecker = ScratchBlocks.registry.getClass(
        ScratchBlocks.registry.Type.CONNECTION_CHECKER,
        ScratchBlocks.registry.DEFAULT,
        true
    );

    return class EasyBloxConnectionChecker extends BaseConnectionChecker {
        canConnectWithReason (a, b, isDragging, optDistance) {
            const baseReason = super.canConnectWithReason(
                a,
                b,
                isDragging,
                optDistance
            );

            if (baseReason !== ScratchBlocks.Connection.CAN_CONNECT) {
                return baseReason;
            }

            const sourceBlocks = [
                a && a.getSourceBlock(),
                b && b.getSourceBlock()
            ];

            const hasExecutionModeDisabledBlock = sourceBlocks.some(block =>
                block &&
                typeof block.hasDisabledReason === 'function' &&
                block.hasDisabledReason(
                    EASYBLOX_EXECUTION_MODE_DISABLED_REASON
                )
            );

            if (hasExecutionModeDisabledBlock) {
                return ScratchBlocks.Connection.REASON_CHECKS_FAILED;
            }

            return baseReason;
        }
    };
};

/**
 * Register the EasyBlox connection checker as the Scratch Blocks default.
 * Scratch Blocks inject replaces the plugins object supplied by the caller,
 * so the checker must also be available through the default registry entry.
 * @param {ScratchBlocks} ScratchBlocks - Scratch Blocks implementation.
 * @returns {Function} Registered EasyBlox connection checker class.
 */
export const registerEasyBloxConnectionChecker = ScratchBlocks => {
    const currentConnectionChecker = ScratchBlocks.registry.getClass(
        ScratchBlocks.registry.Type.CONNECTION_CHECKER,
        ScratchBlocks.registry.DEFAULT,
        true
    );

    if (currentConnectionChecker.isEasyBloxConnectionChecker) {
        return currentConnectionChecker;
    }

    const EasyBloxConnectionChecker =
        createEasyBloxConnectionChecker(ScratchBlocks);

    EasyBloxConnectionChecker.isEasyBloxConnectionChecker = true;

    ScratchBlocks.registry.register(
        ScratchBlocks.registry.Type.CONNECTION_CHECKER,
        ScratchBlocks.registry.DEFAULT,
        EasyBloxConnectionChecker,
        true
    );

    return EasyBloxConnectionChecker;
};
