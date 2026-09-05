import EasyBloxHardwareServiceClient, {
    EasyBloxHardwareServiceError
} from '../../../src/lib/easyblox-hardware-service-client';

const createResponse =
    function ({
        ok = true,
        status = 200,
        payload = null
    }) {
        return {
            ok,
            status,
            json:
                jest.fn()
                    .mockResolvedValue(
                        payload
                    )
        };
    };

describe(
    'EasyBloxHardwareServiceClient',
    () => {
        test('posts the canonical build request to the loopback service', async () => {
            const fetchImpl =
                jest.fn()
                    .mockResolvedValue(
                        createResponse({
                            status: 201,
                            payload: {
                                buildId:
                                    'build-1',
                                boardId:
                                    'arduino-uno'
                            }
                        })
                    );

            const client =
                new EasyBloxHardwareServiceClient({
                    fetchImpl
                });

            const result =
                await client.build({
                    boardId:
                        'arduino-uno',
                    code:
                        'void setup(){}',
                    supportFiles: [
                        {
                            name:
                                'EasyBlox.h',
                            content:
                                '#pragma once\n'
                        }
                    ]
                });

            expect(result.buildId)
                .toBe('build-1');

            expect(fetchImpl)
                .toHaveBeenCalledWith(
                    'http://127.0.0.1:8602/v1/build',
                    expect.objectContaining({
                        method:
                            'POST',
                        headers:
                            expect.objectContaining({
                                'Content-Type':
                                    'application/json',
                                'X-EasyBlox-Client':
                                    'scratch-gui'
                            })
                    })
                );

            const requestOptions =
                fetchImpl.mock.calls[0][1];

            expect(
                JSON.parse(
                    requestOptions.body
                )
            ).toEqual({
                boardId:
                    'arduino-uno',
                code:
                    'void setup(){}',
                supportFiles: [
                    {
                        name:
                            'EasyBlox.h',
                        content:
                            '#pragma once\n'
                    }
                ]
            });
        });

        test('lists Bluetooth devices through the canonical local service endpoint', async () => {
            const fetchImpl =
                jest.fn()
                    .mockResolvedValue(
                        createResponse({
                            payload: {
                                devices: [
                                    {
                                        id:
                                            'COM12',
                                        label:
                                            'HC-06'
                                    }
                                ]
                            }
                        })
                    );

            const client =
                new EasyBloxHardwareServiceClient({
                    fetchImpl
                });

            const result =
                await client
                    .listBluetoothDevices();

            expect(result)
                .toEqual({
                    devices: [
                        {
                            id:
                                'COM12',
                            label:
                                'HC-06'
                        }
                    ]
                });

            expect(fetchImpl)
                .toHaveBeenCalledWith(
                    'http://127.0.0.1:8602/v1/bluetooth/devices',
                    expect.objectContaining({
                        method:
                            'GET',
                        headers:
                            expect.objectContaining({
                                'X-EasyBlox-Client':
                                    'scratch-gui'
                            })
                    })
                );
        });

        test('preserves semantic service errors without exposing transport details', async () => {
            const fetchImpl =
                jest.fn()
                    .mockResolvedValue(
                        createResponse({
                            ok: false,
                            status: 409,
                            payload: {
                                error: {
                                    code:
                                        'PORT_BUSY',
                                    message:
                                        'The serial port is busy'
                                }
                            }
                        })
                    );

            const client =
                new EasyBloxHardwareServiceClient({
                    fetchImpl
                });

            await expect(
                client.upload({
                    buildId:
                        'build-1',
                    portHint: {
                        usbVendorId:
                            0x1A86,
                        usbProductId:
                            0x7523
                    }
                })
            ).rejects.toMatchObject({
                code:
                    'PORT_BUSY',
                status:
                    409
            });
        });

        test('translates a missing local service into a semantic error', async () => {
            const fetchImpl =
                jest.fn()
                    .mockRejectedValue(
                        new Error(
                            'ECONNREFUSED'
                        )
                    );

            const client =
                new EasyBloxHardwareServiceClient({
                    fetchImpl
                });

            let caught = null;

            try {
                await client.build({
                    boardId:
                        'arduino-uno',
                    code:
                        'void setup(){}'
                });
            } catch (error) {
                caught = error;
            }

            expect(caught)
                .toBeInstanceOf(
                    EasyBloxHardwareServiceError
                );

            expect(caught.code)
                .toBe(
                    'HARDWARE_SERVICE_UNAVAILABLE'
                );
        });

        test('discards an abandoned build explicitly', async () => {
            const fetchImpl =
                jest.fn()
                    .mockResolvedValue(
                        createResponse({
                            payload: {
                                cleaned: true
                            }
                        })
                    );

            const client =
                new EasyBloxHardwareServiceClient({
                    fetchImpl
                });

            await client.discard(
                'build-1'
            );

            expect(fetchImpl)
                .toHaveBeenCalledWith(
                    'http://127.0.0.1:8602/v1/build/build-1',
                    expect.objectContaining({
                        method:
                            'DELETE'
                    })
                );
        });
    }
);
