const tap = require('tap');

const ExtensionManager = require('../../src/extension-support/extension-manager');

const test = tap.test;

test('Serial is an Arduino UNO companion extension', t => {
    const manager = Object.create(ExtensionManager.prototype);

    t.same(
        manager.getExtensionDependencies('serial'),
        ['arduinoUno'],
        'Serial depends on Arduino UNO'
    );

    t.same(
        manager.getExtensionCompanions('arduinoUno'),
        ['actuators', 'sensors', 'displays', 'serial'],
        'Arduino UNO exposes Serial as a companion'
    );

    t.end();
});

test('Serial is available as a built-in extension', t => {
    const manager = Object.create(ExtensionManager.prototype);

    manager.runtime = {};
    manager._loadedExtensions = new Map([
        ['arduinoUno', 'internal.arduinoUno']
    ]);

    let registeredExtensionId = null;

    manager._registerInternalExtension = extension => {
        registeredExtensionId = extension.getInfo().id;
        return 'internal.serial';
    };

    manager.loadExtensionIdSync('serial');

    t.equal(
        registeredExtensionId,
        'serial',
        'Serial built-in extension is instantiated and registered'
    );

    t.equal(
        manager.isExtensionLoaded('serial'),
        true,
        'Serial is marked as loaded'
    );

    t.end();
});
