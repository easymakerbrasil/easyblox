const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_TRANSPORT_METHODS,
    validateEasyConectTransport,
    validateEasyConectDeviceId
} = require('../src');

const createValidTransport =
    () => ({
        connect:
            async () => {},
        disconnect:
            async () => {},
        write:
            async () => {},
        onData:
            () => {},
        onError:
            () => {},
        onDisconnect:
            () => {}
    });

test('EasyConect exposes the canonical session transport methods', () => {
    assert.deepEqual(
        EASYCONECT_TRANSPORT_METHODS,
        [
            'connect',
            'disconnect',
            'write',
            'onData',
            'onError',
            'onDisconnect'
        ]
    );

    assert.equal(
        Object.isFrozen(
            EASYCONECT_TRANSPORT_METHODS
        ),
        true
    );
});

test('EasyConect accepts a complete transport and ignores adapter-specific extras', () => {
    const transport =
        createValidTransport();

    transport.listDevices =
        async () => [];

    transport.getState =
        () => 'connected';

    assert.equal(
        validateEasyConectTransport(
            transport
        ),
        true
    );
});

test('EasyConect rejects malformed transport containers', () => {
    const invalidTransports = [
        null,
        undefined,
        [],
        'transport',
        42
    ];

    for (
        const transport of
        invalidTransports
    ) {
        assert.throws(
            () =>
                validateEasyConectTransport(
                    transport
                ),
            /transport must be an object/i
        );
    }
});

test('EasyConect requires every canonical transport method to be a function', () => {
    for (
        const methodName of
        EASYCONECT_TRANSPORT_METHODS
    ) {
        const missing =
            createValidTransport();

        delete missing[
            methodName
        ];

        assert.throws(
            () =>
                validateEasyConectTransport(
                    missing
                ),
            new RegExp(
                `transport method ${methodName} must be a function`,
                'i'
            )
        );

        const invalid =
            createValidTransport();

        invalid[
            methodName
        ] = true;

        assert.throws(
            () =>
                validateEasyConectTransport(
                    invalid
                ),
            new RegExp(
                `transport method ${methodName} must be a function`,
                'i'
            )
        );
    }
});

test('EasyConect accepts any non-empty opaque device id without interpreting its format', () => {
    const deviceIds = [
        'device-1',
        'platform:opaque:42',
        'A/B_C-7',
        '001122334455'
    ];

    for (
        const deviceId of
        deviceIds
    ) {
        assert.equal(
            validateEasyConectDeviceId(
                deviceId
            ),
            true
        );
    }
});

test('EasyConect rejects missing or blank device ids', () => {
    const invalidDeviceIds = [
        null,
        undefined,
        '',
        '   ',
        42,
        {},
        []
    ];

    for (
        const deviceId of
        invalidDeviceIds
    ) {
        assert.throws(
            () =>
                validateEasyConectDeviceId(
                    deviceId
                ),
            /device id must be a non-empty string/i
        );
    }
});
