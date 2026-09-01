import {runEasyBloxUpload} from '../../../src/lib/easyblox-upload-workflow';

describe('EasyBlox Upload workflow Serial Monitor handoff', () => {
    test('preserves the Web Serial peripheral id before native upload releases the port', async () => {
        const nativeUploadResult = {
            uploaded: true
        };

        const vm = {
            getPeripheralConnectionInfo: jest.fn().mockReturnValue({
                peripheralId: 'web-serial-1',
                usbVendorId: 0x1A86,
                usbProductId: 0x7523
            }),
            getPeripheralIsConnected: jest.fn().mockReturnValue(true),
            disconnectPeripheral: jest.fn().mockResolvedValue(true)
        };

        const client = {
            build: jest.fn().mockResolvedValue({
                buildId: 'build-1'
            }),
            upload: jest.fn().mockResolvedValue(
                nativeUploadResult
            ),
            discard: jest.fn().mockResolvedValue()
        };

        const uploadResult = await runEasyBloxUpload({
            vm,
            board: {
                extensionId: 'arduinoUno'
            },
            boardId: 'arduino-uno',
            boardName: 'Arduino UNO',
            code: 'void setup() {}\nvoid loop() {}\n',
            cachedPortHint: null,
            client,
            onStatus: jest.fn()
        });

        expect(uploadResult.result).toBe(
            nativeUploadResult
        );

        expect(uploadResult.peripheralId).toBe(
            'web-serial-1'
        );

        expect(uploadResult.portHint).toEqual(
            expect.objectContaining({
                usbVendorId: 0x1A86,
                usbProductId: 0x7523
            })
        );

        expect(
            vm.disconnectPeripheral
        ).toHaveBeenCalledWith('arduinoUno');
    });

    test('keeps peripheral id null when upload uses only a cached native port hint', async () => {
        const vm = {
            getPeripheralConnectionInfo: jest.fn().mockReturnValue(null),
            getPeripheralIsConnected: jest.fn().mockReturnValue(false),
            disconnectPeripheral: jest.fn()
        };

        const client = {
            build: jest.fn().mockResolvedValue({
                buildId: 'build-2'
            }),
            upload: jest.fn().mockResolvedValue({
                uploaded: true
            }),
            discard: jest.fn().mockResolvedValue()
        };

        const uploadResult = await runEasyBloxUpload({
            vm,
            board: {
                extensionId: 'arduinoUno'
            },
            boardId: 'arduino-uno',
            boardName: 'Arduino UNO',
            code: 'void setup() {}\nvoid loop() {}\n',
            cachedPortHint: {
                usbVendorId: 0x1A86,
                usbProductId: 0x7523
            },
            client,
            onStatus: jest.fn()
        });

        expect(uploadResult.peripheralId).toBeNull();

        expect(
            vm.disconnectPeripheral
        ).not.toHaveBeenCalled();
    });
});
