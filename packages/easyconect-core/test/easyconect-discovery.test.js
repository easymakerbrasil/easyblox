const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_DISCOVERY_METHODS,
    validateEasyConectDiscovery,
    createEasyConectDevice
} = require('../src');

const createValidDiscovery =
    () => ({
        listDevices:
            async () => []
    });

test('EasyConect exposes the canonical discovery methods', () => {
    assert.deepEqual(
        EASYCONECT_DISCOVERY_METHODS,
        [
            'listDevices'
        ]
    );

    assert.equal(
        Object.isFrozen(
            EASYCONECT_DISCOVERY_METHODS
        ),
        true
    );
});

test('EasyConect accepts a complete discovery adapter and ignores platform-specific extras', () => {
    const discovery =
        createValidDiscovery();

    discovery.startScan =
        async () => {};

    assert.equal(
        validateEasyConectDiscovery(
            discovery
        ),
        true
    );
});

test('EasyConect rejects malformed discovery containers', () => {
    const invalidDiscoveries = [
        null,
        undefined,
        [],
        'discovery',
        42
    ];

    for (
        const discovery of
        invalidDiscoveries
    ) {
        assert.throws(
            () =>
                validateEasyConectDiscovery(
                    discovery
                ),
            /discovery must be an object/i
        );
    }
});

test('EasyConect requires listDevices to be a function', () => {
    const missing = {};

    assert.throws(
        () =>
            validateEasyConectDiscovery(
                missing
            ),
        /discovery method listDevices must be a function/i
    );

    const invalid = {
        listDevices:
            true
    };

    assert.throws(
        () =>
            validateEasyConectDiscovery(
                invalid
            ),
        /discovery method listDevices must be a function/i
    );
});

test('EasyConect creates a canonical device from opaque identity and public name', () => {
    const device =
        createEasyConectDevice({
            deviceId:
                'platform:opaque:42',
            name:
                'EasyMaker-37'
        });

    assert.deepEqual(
        device,
        {
            deviceId:
                'platform:opaque:42',
            name:
                'EasyMaker-37'
        }
    );

    assert.equal(
        Object.isFrozen(
            device
        ),
        true
    );
});

test('EasyConect device creation strips platform-specific metadata', () => {
    const device =
        createEasyConectDevice({
            deviceId:
                'COM12',
            name:
                'HC-06',
            path:
                'COM12',
            pnpId:
                'BTHENUM\\example',
            address:
                '001122334455'
        });

    assert.deepEqual(
        Object.keys(
            device
        ),
        [
            'deviceId',
            'name'
        ]
    );

    assert.equal(
        device.path,
        undefined
    );

    assert.equal(
        device.pnpId,
        undefined
    );

    assert.equal(
        device.address,
        undefined
    );
});

test('EasyConect rejects malformed device containers', () => {
    const invalidDevices = [
        null,
        undefined,
        [],
        'device',
        42
    ];

    for (
        const device of
        invalidDevices
    ) {
        assert.throws(
            () =>
                createEasyConectDevice(
                    device
                ),
            /device must be an object/i
        );
    }
});

test('EasyConect device requires a valid opaque device id', () => {
    assert.throws(
        () =>
            createEasyConectDevice({
                deviceId:
                    '',
                name:
                    'EasyMaker-37'
            }),
        /device id must be a non-empty string/i
    );
});

test('EasyConect device requires a non-empty public name', () => {
    const invalidNames = [
        null,
        undefined,
        '',
        '   ',
        42
    ];

    for (
        const name of
        invalidNames
    ) {
        assert.throws(
            () =>
                createEasyConectDevice({
                    deviceId:
                        'device-1',
                    name
                }),
            /device name must be a non-empty string/i
        );
    }
});
