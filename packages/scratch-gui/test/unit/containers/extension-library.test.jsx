import {ExtensionLibrary} from '../../../src/containers/extension-library.jsx';

describe('ExtensionLibrary active extensions', () => {
    const createProps = overrides => ({
        activeExtensionIds: [],
        intl: {
            formatMessage: jest.fn(() => 'Extensões')
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
});
