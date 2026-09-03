import {
    createEasyBloxConnectionChecker,
    EASYBLOX_EXECUTION_MODE_DISABLED_REASON,
    EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
} from '../../../src/lib/easyblox-connection-checker';

describe('EasyBlox connection checker', () => {
    let ScratchBlocks;
    let BaseConnectionChecker;
    let baseCanConnectWithReason;

    beforeEach(() => {
        baseCanConnectWithReason = jest.fn().mockReturnValue(0);

        BaseConnectionChecker = class {
            canConnectWithReason (a, b, isDragging, optDistance) {
                return baseCanConnectWithReason(
                    a,
                    b,
                    isDragging,
                    optDistance
                );
            }
        };

        ScratchBlocks = {
            Connection: {
                CAN_CONNECT: 0,
                REASON_CHECKS_FAILED: 4
            },
            registry: {
                Type: {
                    CONNECTION_CHECKER: 'connectionChecker'
                },
                DEFAULT: 'default',
                getClass: jest.fn().mockReturnValue(BaseConnectionChecker)
            }
        };
    });

    const makeConnection = block => ({
        getSourceBlock: jest.fn().mockReturnValue(block)
    });

    test('preserves the Scratch connection checker result', () => {
        baseCanConnectWithReason.mockReturnValue(7);

        const EasyBloxConnectionChecker =
            createEasyBloxConnectionChecker(ScratchBlocks);
        const checker = new EasyBloxConnectionChecker();

        const connectionA = makeConnection({
            hasDisabledReason: jest.fn().mockReturnValue(false)
        });
        const connectionB = makeConnection({
            hasDisabledReason: jest.fn().mockReturnValue(false)
        });

        const result = checker.canConnectWithReason(
            connectionA,
            connectionB,
            true,
            20
        );

        expect(result).toBe(7);
        expect(baseCanConnectWithReason).toHaveBeenCalledWith(
            connectionA,
            connectionB,
            true,
            20
        );
    });

    test('rejects a new connection when a block is disabled by execution mode', () => {
        const EasyBloxConnectionChecker =
            createEasyBloxConnectionChecker(ScratchBlocks);
        const checker = new EasyBloxConnectionChecker();

        const incompatibleBlock = {
            hasDisabledReason: jest.fn(reason =>
                reason === EASYBLOX_EXECUTION_MODE_DISABLED_REASON
            )
        };
        const compatibleBlock = {
            hasDisabledReason: jest.fn().mockReturnValue(false)
        };

        const result = checker.canConnectWithReason(
            makeConnection(incompatibleBlock),
            makeConnection(compatibleBlock),
            true,
            20
        );

        expect(result).toBe(
            ScratchBlocks.Connection.REASON_CHECKS_FAILED
        );
        expect(incompatibleBlock.hasDisabledReason).toHaveBeenCalledWith(
            EASYBLOX_EXECUTION_MODE_DISABLED_REASON
        );
    });

    test('rejects a new connection when a block is disabled by board capability', () => {
        const EasyBloxConnectionChecker =
            createEasyBloxConnectionChecker(ScratchBlocks);
        const checker = new EasyBloxConnectionChecker();

        const incompatibleBlock = {
            hasDisabledReason: jest.fn(reason =>
                reason ===
                EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
            )
        };
        const compatibleBlock = {
            hasDisabledReason: jest.fn().mockReturnValue(false)
        };

        const result = checker.canConnectWithReason(
            makeConnection(incompatibleBlock),
            makeConnection(compatibleBlock),
            true,
            20
        );

        expect(result).toBe(
            ScratchBlocks.Connection.REASON_CHECKS_FAILED
        );

        expect(
            incompatibleBlock.hasDisabledReason
        ).toHaveBeenCalledWith(
            EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
        );
    });

    test('does not reject a connection for unrelated disabled reasons', () => {
        const EasyBloxConnectionChecker =
            createEasyBloxConnectionChecker(ScratchBlocks);
        const checker = new EasyBloxConnectionChecker();

        const disabledForAnotherReason = {
            isEnabled: jest.fn().mockReturnValue(false),
            hasDisabledReason: jest.fn().mockReturnValue(false)
        };
        const compatibleBlock = {
            hasDisabledReason: jest.fn().mockReturnValue(false)
        };

        const result = checker.canConnectWithReason(
            makeConnection(disabledForAnotherReason),
            makeConnection(compatibleBlock),
            true,
            20
        );

        expect(result).toBe(ScratchBlocks.Connection.CAN_CONNECT);
        expect(disabledForAnotherReason.hasDisabledReason)
            .toHaveBeenCalledWith(
                EASYBLOX_EXECUTION_MODE_DISABLED_REASON
            );
    });
});
