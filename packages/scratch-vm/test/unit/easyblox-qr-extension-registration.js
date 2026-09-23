const tap = require('tap');

const ExtensionManager =
    require('../../src/extension-support/extension-manager');

tap.test(
    'EasyBlox QR is registered as a neutral built-in extension',
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

        manager.loadExtensionIdSync('easybloxQr');

        t.same(
            registeredIds,
            [
                'easybloxQr'
            ],
            'loads only EasyBlox QR without an artificial board dependency'
        );

        t.equal(
            manager.isExtensionLoaded('easybloxQr'),
            true
        );

        t.same(
            manager.getExtensionDependencies('easybloxQr'),
            []
        );

        t.same(
            manager.getExtensionCompanions('easybloxQr'),
            []
        );

        t.end();
    }
);
