import {
    getVisibleBoards,
    getVisibleExtensions
} from '../../../src/lib/libraries/extensions';

describe('EasyBlox BT extension library registration', () => {
    test('exposes EasyBlox BT as a visible extension', () => {
        const easybloxBt =
            getVisibleExtensions().find(
                item =>
                    item.extensionId === 'easybloxBt'
            );

        expect(easybloxBt).toBeDefined();

        expect(easybloxBt).toMatchObject({
            extensionId: 'easybloxBt',
            name: 'EasyBlox BT',
            kind: 'extension',
            visible: true,
            featured: true,
            disabled: false
        });
    });

    test('does not classify EasyBlox BT as a board', () => {
        const easybloxBtBoard =
            getVisibleBoards().find(
                item =>
                    item.extensionId === 'easybloxBt'
            );

        expect(easybloxBtBoard).toBeUndefined();
    });

    test('does not launch host Bluetooth or network connection flows', () => {
        const easybloxBt =
            getVisibleExtensions().find(
                item =>
                    item.extensionId === 'easybloxBt'
            );

        expect(easybloxBt).toBeDefined();

        expect(
            easybloxBt.launchPeripheralConnectionFlow
        ).not.toBe(true);

        expect(
            easybloxBt.bluetoothRequired
        ).not.toBe(true);

        expect(
            easybloxBt.internetConnectionRequired
        ).not.toBe(true);
    });
});
