import {ExtensionLibrary} from '../../../src/containers/extension-library.jsx';

describe('ExtensionLibrary active extensions', () => {
    const createProps = overrides => ({
        activeExtensionIds: [],
        intl: {
            formatMessage: jest.fn(message =>
                message.defaultMessage || message.id
            )
        },
        onCategorySelected: jest.fn(),
        onExtensionRemove: jest.fn(),
        onRequestClose: jest.fn(),
        vm: {
            extensionManager: {
                isExtensionLoaded: jest.fn(),
                loadExtensionURL: jest.fn()
            }
        },
        ...overrides
    });

    test('marks only active extensions as removable', () => {
        const instance = new ExtensionLibrary(createProps({
            activeExtensionIds: ['translate']
        }));

        const libraryElement = instance.render();

        expect(
            libraryElement.props.isItemRemovable({
                extensionId: 'translate'
            })
        ).toBe(true);

        expect(
            libraryElement.props.isItemRemovable({
                extensionId: 'music'
            })
        ).toBe(false);
    });

    test('removes an active extension by its extension id', () => {
        const onExtensionRemove = jest.fn();

        const instance = new ExtensionLibrary(createProps({
            activeExtensionIds: ['translate'],
            onExtensionRemove
        }));

        instance.handleItemRemove({
            extensionId: 'translate'
        });

        expect(onExtensionRemove).toHaveBeenCalledTimes(1);
        expect(onExtensionRemove).toHaveBeenCalledWith('translate');
    });

    test('activates an extension when it is selected', () => {
        const onCategorySelected = jest.fn();
        const onExtensionActivate = jest.fn();

        const props = createProps({
            onCategorySelected,
            onExtensionActivate
        });

        props.vm.extensionManager.isExtensionLoaded
            .mockReturnValue(true);

        const instance = new ExtensionLibrary(props);

        instance.handleItemSelect({
            extensionId: 'translate'
        });

        expect(onExtensionActivate).toHaveBeenCalledTimes(1);
        expect(onExtensionActivate).toHaveBeenCalledWith('translate');

        expect(onCategorySelected).toHaveBeenCalledTimes(1);
        expect(onCategorySelected).toHaveBeenCalledWith('translate');
    });

    test('disables board-capability extensions when no board is selected', () => {
        const instance =
            new ExtensionLibrary(
                createProps({})
            );

        const libraryElement =
            instance.render();

        const easybloxBt =
            libraryElement.props.data.find(
                item =>
                    item.extensionId ===
                    'easybloxBt'
            );

        const easybloxQr =
            libraryElement.props.data.find(
                item =>
                    item.extensionId ===
                    'easybloxQr'
            );

        expect(easybloxBt.disabled).toBe(true);
        expect(easybloxBt.disabledMessage).toBe(
            'Selecione uma placa para usar esta extensão'
        );

        expect(easybloxQr.disabled).toBe(false);
        expect(easybloxQr.disabledMessage).toBeNull();
    });

    test.each([
        'arduino-uno',
        'easymaker',
        'easymaker-connection',
        'easyduino-proto'
    ])(
        'enables EasyBlox BT for Bluetooth-capable board %s',
        activeBoardId => {
            const instance =
                new ExtensionLibrary(
                    createProps({
                        activeBoardId
                    })
                );

            const libraryElement =
                instance.render();

            const easybloxBt =
                libraryElement.props.data.find(
                    item =>
                        item.extensionId ===
                        'easybloxBt'
                );

            expect(easybloxBt.disabled).toBe(false);
            expect(easybloxBt.disabledMessage).toBeNull();
        }
    );

    test('disables EasyBlox BT for EasyDuino Jr', () => {
        const instance =
            new ExtensionLibrary(
                createProps({
                    activeBoardId:
                        'easyduino-jr'
                })
            );

        const libraryElement =
            instance.render();

        const easybloxBt =
            libraryElement.props.data.find(
                item =>
                    item.extensionId ===
                    'easybloxBt'
            );

        expect(easybloxBt.disabled).toBe(true);
        expect(easybloxBt.disabledMessage).toBe(
            'Esta extensão não é compatível com a placa selecionada'
        );
    });
});
