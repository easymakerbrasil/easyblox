import {EventEmitter} from 'events';

import {
    EasyBloxStageFirmwareWorkflowError,
    runEasyBloxStageFirmwareRestore
} from '../../../src/lib/easyblox-stage-firmware-workflow';

const BOARD = {
    boardId: 'arduino-uno',
    extensionId: 'arduinoUno'
};

const PORT_HINT = {
    usbVendorId: 0x1A86,
    usbProductId: 0x7523
};

describe('EasyBlox Stage firmware workflow', () => {
    test('releases Web Serial, restores firmware, reconnects and waits for Stage PONG', async () => {
        const vm = new EventEmitter();
        const calls = [];
        let physicallyConnected = true;

        vm.getPeripheralConnectionInfo =
            jest.fn(() => (
                physicallyConnected ?
                    {
                        peripheralId: 'web-serial-1',
                        ...PORT_HINT
                    } :
                    null
            ));

        vm.getPeripheralIsConnected =
            jest.fn(
                () =>
                    physicallyConnected
            );

        vm.disconnectPeripheral =
            jest.fn(() => {
                calls.push('disconnect');
                physicallyConnected = false;
                return true;
            });

        vm.connectPeripheral =
            jest.fn(
                (extensionId, peripheralId) => {
                    calls.push('connect');

                    expect(extensionId)
                        .toBe('arduinoUno');

                    expect(peripheralId)
                        .toBe('web-serial-1');

                    physicallyConnected = true;

                    setTimeout(() => {
                        vm.emit(
                            'PERIPHERAL_STAGE_READY',
                            {
                                extensionId:
                                    'arduinoUno'
                            }
                        );
                    }, 0);
                }
            );

        const client = {
            restoreStageFirmware:
                jest.fn(request => {
                    calls.push('restore');

                    expect(
                        physicallyConnected
                    ).toBe(false);

                    expect(request)
                        .toEqual({
                            boardId:
                                'arduino-uno',
                            portHint:
                                PORT_HINT
                        });

                    return {
                        ok: true
                    };
                })
        };

        const statuses = [];

        const result =
            await runEasyBloxStageFirmwareRestore({
                vm,
                board: BOARD,
                boardId:
                    'arduino-uno',
                client,
                onStatus:
                    status =>
                        statuses.push(
                            status.state
                        ),
                rebootDelayMs: 0,
                handshakeTimeoutMs: 100
            });

        expect(calls)
            .toEqual([
                'disconnect',
                'restore',
                'connect'
            ]);

        expect(statuses)
            .toEqual([
                'restoring-stage',
                'reconnecting-stage',
                'stage-ready'
            ]);

        expect(result.portHint)
            .toEqual(PORT_HINT);

        expect(result.peripheralId)
            .toBe('web-serial-1');
    });

    test('restores Stage after Upload when Web Serial is already released', async () => {
        const vm = new EventEmitter();

        vm.getPeripheralConnectionInfo =
            jest.fn(() => null);

        vm.getPeripheralIsConnected =
            jest.fn(() => false);

        vm.disconnectPeripheral =
            jest.fn();

        vm.connectPeripheral =
            jest.fn(() => {
                setTimeout(() => {
                    vm.emit(
                        'PERIPHERAL_STAGE_READY',
                        {
                            extensionId:
                                'arduinoUno'
                        }
                    );
                }, 0);
            });

        const client = {
            restoreStageFirmware:
                jest.fn(() => ({
                    ok: true
                }))
        };

        await runEasyBloxStageFirmwareRestore({
            vm,
            board: BOARD,
            boardId:
                'arduino-uno',
            cachedPortHint:
                PORT_HINT,
            peripheralId:
                'web-serial-1',
            client,
            rebootDelayMs: 0,
            handshakeTimeoutMs: 100
        });

        expect(
            vm.disconnectPeripheral
        ).not.toHaveBeenCalled();

        expect(
            client.restoreStageFirmware
        ).toHaveBeenCalledWith({
            boardId:
                'arduino-uno',
            portHint:
                PORT_HINT
        });

        expect(
            vm.connectPeripheral
        ).toHaveBeenCalledWith(
            'arduinoUno',
            'web-serial-1'
        );
    });

    test('reports a terminal Stage handshake failure after firmware restoration', async () => {
        const vm = new EventEmitter();

        vm.getPeripheralConnectionInfo =
            jest.fn(() => null);

        vm.getPeripheralIsConnected =
            jest.fn(() => false);

        vm.connectPeripheral =
            jest.fn(() => {
                setTimeout(() => {
                    vm.emit(
                        'PERIPHERAL_STAGE_HANDSHAKE_FAILED',
                        {
                            extensionId:
                                'arduinoUno'
                        }
                    );
                }, 0);
            });

        const client = {
            restoreStageFirmware:
                jest.fn(() => ({
                    ok: true
                }))
        };

        await expect(
            runEasyBloxStageFirmwareRestore({
                vm,
                board: BOARD,
                boardId:
                    'arduino-uno',
                cachedPortHint:
                    PORT_HINT,
                peripheralId:
                    'web-serial-1',
                client,
                rebootDelayMs: 0,
                handshakeTimeoutMs: 100
            })
        ).rejects.toEqual(
            expect.objectContaining({
                name:
                    'EasyBloxStageFirmwareWorkflowError',
                code:
                    'STAGE_HANDSHAKE_FAILED'
            })
        );

        expect(
            EasyBloxStageFirmwareWorkflowError
        ).toBeDefined();
    });
});
