import EasyBloxHardwareServiceClient
    from '../../../src/lib/easyblox-hardware-service-client';

describe('EasyBloxHardwareServiceClient Stage firmware', () => {
    test('requests Stage firmware restoration using only the semantic board id and USB port hint', async () => {
        let requestUrl = null;
        let requestOptions = null;

        const fetchImpl =
            jest.fn(
                async (url, options) => {
                    requestUrl = url;
                    requestOptions = options;

                    return {
                        ok: true,
                        status: 200,
                        json:
                            async () => ({
                                ok: true,
                                boardId:
                                    'arduino-uno',
                                firmwareVersion:
                                    'stage-v1'
                            })
                    };
                }
            );

        const client =
            new EasyBloxHardwareServiceClient({
                fetchImpl
            });

        await client.restoreStageFirmware({
            boardId:
                'arduino-uno',

            portHint: {
                usbVendorId:
                    0x1A86,
                usbProductId:
                    0x7523
            }
        });

        expect(requestUrl)
            .toBe(
                'http://127.0.0.1:8602/v1/stage-firmware/restore'
            );

        expect(requestOptions.method)
            .toBe('POST');

        expect(
            JSON.parse(
                requestOptions.body
            )
        ).toEqual({
            boardId:
                'arduino-uno',

            portHint: {
                usbVendorId:
                    0x1A86,
                usbProductId:
                    0x7523
            }
        });

        expect(requestOptions.body)
            .not
            .toContain(
                'arduino:avr:uno'
            );

        expect(requestOptions.body)
            .not
            .toContain(
                '.ino'
            );
    });
});
