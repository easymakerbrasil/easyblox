const tap = require('tap');

const ExtensionManager =
    require('../../src/extension-support/extension-manager');

tap.test(
    'EasyBlox BT is registered as a neutral built-in extension',
    t => {
        const manager =
            Object.create(ExtensionManager.prototype);

        manager.runtime = {};
        manager._loadedExtensions = new Map();

        const registeredIds = [];

        manager._registerInternalExtension =
            extensionInstance => {
                const info =
                    extensionInstance.getInfo();

                registeredIds.push(info.id);

                return `extension_test_${info.id}`;
            };

        manager.loadExtensionIdSync('easybloxBt');

        t.same(
            registeredIds,
            [
                'easybloxBt'
            ],
            'loads only EasyBlox BT without an artificial board dependency'
        );

        t.equal(
            manager.isExtensionLoaded('easybloxBt'),
            true
        );

        t.same(
            manager.getExtensionDependencies('easybloxBt'),
            []
        );

        t.same(
            manager.getExtensionCompanions('easybloxBt'),
            []
        );

        t.end();
    }
);
