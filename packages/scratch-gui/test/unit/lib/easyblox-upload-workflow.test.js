import {
    EasyBloxUploadWorkflowError,
    runEasyBloxUpload
} from '../../../src/lib/easyblox-upload-workflow';

const BOARD = {
    extensionId:
        'arduinoUno',
    name:
        'Arduino UNO'
};

const CODE =
    'void setup() {}\nvoid loop() {}\n';

const USB_INFO = {
    peripheralId:
        'web-serial-1',
    usbVendorId:
        0x1A86,
    usbProductId:
        0x7523
};

const createClient =
    function () {
        return {
            build:
                jest.fn()
                    .mockResolvedValue({
                        buildId:
                            'build-1'
                    }),
            upload:
                jest.fn()
                    .mockResolvedValue({
                        port:
                            'COM11'
                    }),
            discard:
                jest.fn()
                    .mockResolvedValue({
                        cleaned: true
                    })
        };
    };

describe(
    'EasyBlox upload workflow',
    () => {
        test('builds before disconnecting and uploads only after the port is released', async () => {
            const order = [];

            const client =
                createClient();

            client.build.mockImplementation(
                () => {
                    order.push('build');

                    return Promise.resolve({
                        buildId:
                            'build-1'
                    });
                }
            );

            client.upload.mockImplementation(
                () => {
                    order.push('upload');

                    return Promise.resolve({
                        port:
                            'COM11'
                    });
                }
            );

            const vm = {
                getPeripheralConnectionInfo:
                    jest.fn()
                        .mockReturnValue(
                            USB_INFO
                        ),
                getPeripheralIsConnected:
                    jest.fn()
                        .mockReturnValue(
                            true
                        ),
                disconnectPeripheral:
                    jest.fn()
                        .mockImplementation(
                            () => {
                                order.push(
                                    'disconnect'
                                );

                                return Promise.resolve(
                                    true
                                );
                            }
                        )
            };

            const statuses = [];

            const result =
                await runEasyBloxUpload({
                    vm,
                    board:
                        BOARD,
                    boardId:
                        'arduino-uno',
                    boardName:
                        'Arduino UNO',
                    code:
                        CODE,
                    client,
                    onStatus:
                        function (status) {
                            statuses.push(
                                status.state
                            );
                        }
                });

            expect(order)
                .toEqual([
                    'build',
                    'disconnect',
                    'upload'
                ]);

            expect(statuses)
                .toEqual([
                    'building',
                    'preparing',
                    'uploading',
                    'success'
                ]);

            expect(result.portHint)
                .toEqual({
                    usbVendorId:
                        0x1A86,
                    usbProductId:
                        0x7523
                });
        });

        test('forwards build support files without interpreting them', async () => {
            const client =
                createClient();

            const supportFiles = [
                {
                    name:
                        'EasyBlox.h',
                    content:
                        '#pragma once\n'
                },
                {
                    name:
                        'EasyBloxBluetooth.cpp',
                    content:
                        'void easybloxBluetoothRuntime() {}\n'
                }
            ];

            const vm = {
                getPeripheralConnectionInfo:
                    jest.fn()
                        .mockReturnValue(
                            USB_INFO
                        ),
                getPeripheralIsConnected:
                    jest.fn()
                        .mockReturnValue(
                            false
                        ),
                disconnectPeripheral:
                    jest.fn()
            };

            await runEasyBloxUpload({
                vm,
                board:
                    BOARD,
                boardId:
                    'arduino-uno',
                boardName:
                    'Arduino UNO',
                code:
                    CODE,
                supportFiles,
                client
            });

            expect(client.build)
                .toHaveBeenCalledWith({
                    boardId:
                        'arduino-uno',
                    code:
                        CODE,
                    supportFiles
                });
        });

        test('does not disconnect the board when compilation fails', async () => {
            const client =
                createClient();

            client.build.mockRejectedValue({
                code:
                    'BUILD_FAILED'
            });

            const vm = {
                getPeripheralConnectionInfo:
                    jest.fn()
                        .mockReturnValue(
                            USB_INFO
                        ),
                getPeripheralIsConnected:
                    jest.fn()
                        .mockReturnValue(
                            true
                        ),
                disconnectPeripheral:
                    jest.fn()
            };

            await expect(
                runEasyBloxUpload({
                    vm,
                    board:
                        BOARD,
                    boardId:
                        'arduino-uno',
                    boardName:
                        'Arduino UNO',
                    code:
                        CODE,
                    client
                })
            ).rejects.toMatchObject({
                code:
                    'BUILD_FAILED'
            });

            expect(
                vm.disconnectPeripheral
            ).not.toHaveBeenCalled();
        });

        test('cleans the compiled artifact when the serial port cannot be released', async () => {
            const client =
                createClient();

            const vm = {
                getPeripheralConnectionInfo:
                    jest.fn()
                        .mockReturnValue(
                            USB_INFO
                        ),
                getPeripheralIsConnected:
                    jest.fn()
                        .mockReturnValue(
                            true
                        ),
                disconnectPeripheral:
                    jest.fn()
                        .mockResolvedValue(
                            false
                        )
            };

            await expect(
                runEasyBloxUpload({
                    vm,
                    board:
                        BOARD,
                    boardId:
                        'arduino-uno',
                    boardName:
                        'Arduino UNO',
                    code:
                        CODE,
                    client
                })
            ).rejects.toBeInstanceOf(
                EasyBloxUploadWorkflowError
            );

            expect(client.upload)
                .not.toHaveBeenCalled();

            expect(client.discard)
                .toHaveBeenCalledWith(
                    'build-1'
                );
        });

        test('reuses a cached USB hint for later uploads while Stage is disconnected', async () => {
            const client =
                createClient();

            const vm = {
                getPeripheralConnectionInfo:
                    jest.fn()
                        .mockReturnValue(
                            null
                        ),
                getPeripheralIsConnected:
                    jest.fn()
                        .mockReturnValue(
                            false
                        ),
                disconnectPeripheral:
                    jest.fn()
            };

            await runEasyBloxUpload({
                vm,
                board:
                    BOARD,
                boardId:
                    'arduino-uno',
                boardName:
                    'Arduino UNO',
                code:
                    CODE,
                cachedPortHint: {
                    usbVendorId:
                        0x1A86,
                    usbProductId:
                        0x7523
                },
                client
            });

            expect(
                vm.disconnectPeripheral
            ).not.toHaveBeenCalled();

            expect(client.upload)
                .toHaveBeenCalledWith({
                    buildId:
                        'build-1',
                    portHint: {
                        usbVendorId:
                            0x1A86,
                        usbProductId:
                            0x7523
                    }
                });
        });
    }
);
