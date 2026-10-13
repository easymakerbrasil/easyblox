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
                            status
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
                {state: 'restoring-stage', message: 'Preparando a placa para o Modo Palco...'},
                {state: 'reconnecting-stage', message: 'Restaurando a comunicação com a placa...'},
                {state: 'stage-ready', message: 'Placa pronta no Modo Palco.'}
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

describe('Stage preparation public errors', () => {
    const cases = [
        ['BOARD_CONNECTION_REQUIRED', 'Conecte a placa ao EasyBlox para preparar o Modo Palco.'],
        ['PORT_RELEASE_FAILED', 'Não foi possível liberar a conexão com a placa. ' +
            'Desconecte e reconecte o cabo USB e tente novamente.'],
        ['HARDWARE_SERVICE_UNAVAILABLE',
            'A preparação de placas não está disponível no EasyBlox neste momento. Tente novamente.'],
        ['TOOLCHAIN_NOT_FOUND',
            'Os recursos necessários para preparar o Modo Palco não estão disponíveis neste computador.'],
        ['STAGE_FIRMWARE_NOT_FOUND', 'Os recursos do Modo Palco não estão disponíveis neste computador.'],
        ['STAGE_FIRMWARE_INVALID', 'Os recursos do Modo Palco não puderam ser utilizados.'],
        ['BUILD_FAILED', 'Não foi possível preparar a placa para o Modo Palco.'],
        ['PORT_NOT_FOUND', 'A placa não foi encontrada. Verifique o cabo USB e tente novamente.'],
        ['PORT_AMBIGUOUS', 'Há mais de uma placa USB que o EasyBlox não conseguiu distinguir. ' +
            'Deixe conectada apenas a placa que deseja usar.'],
        ['PORT_BUSY', 'A conexão com a placa está ocupada. Feche outros programas que possam estar usando a placa.'],
        ['BOARD_NOT_RESPONDING', 'A placa não respondeu durante a preparação do Modo Palco.'],
        ['UPLOAD_FAILED', 'Não foi possível preparar a placa para o Modo Palco.'],
        ['STAGE_HANDSHAKE_FAILED',
            'A placa foi preparada, mas o EasyBlox não conseguiu confirmar a comunicação no Modo Palco.'],
        ['STAGE_RECONNECT_FAILED', 'A placa foi preparada, mas o EasyBlox não conseguiu restabelecer a comunicação.'],
        ['DEFAULT', 'Não foi possível preparar a placa para o Modo Palco.'],
        ['UNRECOGNIZED', 'Não foi possível preparar a placa para o Modo Palco.'],
        ['toString', 'Não foi possível preparar a placa para o Modo Palco.']
    ];

    test.each(cases)('%s keeps diagnostics internal', async (code, message) => {
        const error = Object.assign(new Error('Arduino CLI C:/private/cache FQBN 0x03'), {
            code, stdout: 'private stdout', stderr: 'private stderr'
        });
        const onStatus = jest.fn();
        await expect(runEasyBloxStageFirmwareRestore({
            vm: {getPeripheralIsConnected: () => false},
            board: BOARD,
            boardId: 'arduino-uno',
            cachedPortHint: PORT_HINT,
            peripheralId: 'web-serial-1',
            client: {restoreStageFirmware: () => Promise.reject(error)},
            onStatus
        })).rejects.toMatchObject({code, cause: error});
        expect(onStatus).toHaveBeenLastCalledWith({state: 'error', code, message});
    });

    test('does not publish raw messages from workflow errors or change their rejection identity', async () => {
        const error = new EasyBloxStageFirmwareWorkflowError('UPLOAD_FAILED', 'C:/private Arduino CLI');
        const onStatus = jest.fn();
        await expect(runEasyBloxStageFirmwareRestore({
            vm: {getPeripheralIsConnected: () => false},
            board: BOARD,
            boardId: 'arduino-uno',
            cachedPortHint: PORT_HINT,
            peripheralId: 'web-serial-1',
            client: {restoreStageFirmware: () => Promise.reject(error)},
            onStatus
        })).rejects.toBe(error);
        expect(onStatus).toHaveBeenLastCalledWith({
            state: 'error', code: 'UPLOAD_FAILED', message: 'Não foi possível preparar a placa para o Modo Palco.'
        });
    });

    test.each([
        ['PERIPHERAL_STAGE_HANDSHAKE_FAILED', 'STAGE_HANDSHAKE_FAILED',
            'A placa foi preparada, mas o EasyBlox não conseguiu confirmar a comunicação no Modo Palco.'],
        ['PERIPHERAL_REQUEST_ERROR', 'STAGE_RECONNECT_FAILED',
            'A placa foi preparada, mas o EasyBlox não conseguiu restabelecer a comunicação.'],
        ['PERIPHERAL_CONNECTION_LOST_ERROR', 'STAGE_RECONNECT_FAILED',
            'A placa foi preparada, mas o EasyBlox não conseguiu restabelecer a comunicação.']
    ])('keeps specific public errors after writing: %s', async (event, code, message) => {
        const vm = new EventEmitter();
        vm.getPeripheralIsConnected = () => false;
        vm.connectPeripheral = () => vm.emit(event, {extensionId: 'arduinoUno', message: 'raw private failure'});
        const client = {restoreStageFirmware: jest.fn().mockResolvedValue({ok: true})};
        const onStatus = jest.fn();
        await expect(runEasyBloxStageFirmwareRestore({
            vm,
            board: BOARD,
            boardId: 'arduino-uno',
            cachedPortHint: PORT_HINT,
            peripheralId: 'serial-1',
            client,
            onStatus,
            rebootDelayMs: 0
        })).rejects.toMatchObject({code});
        expect(client.restoreStageFirmware).toHaveBeenCalledTimes(1);
        expect(onStatus.mock.calls.map(([status]) => status.state)).toEqual([
            'restoring-stage', 'reconnecting-stage', 'error'
        ]);
        expect(onStatus).toHaveBeenLastCalledWith({state: 'error', code, message});
        expect(vm.eventNames()).toEqual([]);
    });

    test('formats only controlled descriptors without changing internal rejection diagnostics', async () => {
        const onStatus = jest.fn();
        const formatMessage = jest.fn(({id}) => `translated:${id}`);
        await expect(runEasyBloxStageFirmwareRestore({
            vm: {getPeripheralIsConnected: () => false},
            board: BOARD,
            boardId: 'arduino-uno',
            cachedPortHint: PORT_HINT,
            peripheralId: 'serial-1',
            client: {restoreStageFirmware: () => Promise.reject(new Error('raw failure'))},
            onStatus,
            formatMessage
        })).rejects.toMatchObject({code: 'DEFAULT', message: 'Não foi possível preparar a placa para o Modo Palco.'});
        expect(onStatus).toHaveBeenLastCalledWith({
            state: 'error', code: 'DEFAULT', message: 'translated:gui.stagePreparation.defaultError'
        });
    });
});
