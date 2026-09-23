import extensionLibraryContent
    from '../../../src/lib/libraries/extensions';

describe('EasyBlox QR extension library entry', () => {
    test('exposes the canonical QR Code extension card', () => {
        const easybloxQr =
            extensionLibraryContent.find(
                item =>
                    item.extensionId ===
                    'easybloxQr'
            );

        expect(easybloxQr).toBeDefined();

        expect(easybloxQr).toMatchObject({
            name: 'QR Code',
            extensionId: 'easybloxQr',
            featured: true,
            disabled: false
        });

        expect(
            easybloxQr.iconURL
        ).toBeDefined();

        expect(
            easybloxQr.insetIconURL
        ).toBeDefined();
    });

    test('does not require a board, Bluetooth or Internet', () => {
        const easybloxQr =
            extensionLibraryContent.find(
                item =>
                    item.extensionId ===
                    'easybloxQr'
            );

        expect(easybloxQr).toBeDefined();

        expect(
            easybloxQr.launchPeripheralConnectionFlow
        ).toBeUndefined();

        expect(
            easybloxQr.bluetoothRequired
        ).toBeUndefined();

        expect(
            easybloxQr.internetConnectionRequired
        ).toBeUndefined();
    });
});
