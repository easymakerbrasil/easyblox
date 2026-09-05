const test = require('node:test');
const assert = require('node:assert/strict');

const connectivity = require('..');

const {
    EBCP_CONTRACT,
    EBCP_CONTROL_TYPES,
    encodeFrame,
    decodeFrame,
    EasyBloxConnectivityParser,
    EasyBloxConnectivityRuntime,
    EasyBloxConnectivitySession
} = connectivity;

test('Connectivity Core exposes the transport-neutral EBCP public API', () => {
    assert.equal(typeof EBCP_CONTRACT, 'object');
    assert.equal(typeof EBCP_CONTROL_TYPES, 'object');

    assert.equal(typeof encodeFrame, 'function');
    assert.equal(typeof decodeFrame, 'function');

    assert.equal(
        typeof EasyBloxConnectivityParser,
        'function'
    );

    assert.equal(
        typeof EasyBloxConnectivityRuntime,
        'function'
    );

    assert.equal(
        typeof EasyBloxConnectivitySession,
        'function'
    );
});

test('Connectivity Core preserves the canonical EBCP v1 contract', () => {
    assert.deepEqual(
        EBCP_CONTRACT.magic,
        [
            0x45,
            0x42
        ]
    );

    assert.equal(EBCP_CONTRACT.version, 0x01);
    assert.equal(EBCP_CONTRACT.maxChannelBytes, 16);
    assert.equal(EBCP_CONTRACT.maxPayloadBytes, 32);
    assert.equal(EBCP_CONTRACT.maxFrameBytes, 56);

    assert.deepEqual(
        EBCP_CONTRACT.messageTypes,
        {
            TEXT: 0x01,
            NUMBER: 0x02,
            BOOLEAN: 0x03
        }
    );
});

test('Connectivity Core does not expose board or transport-specific contracts', () => {
    assert.equal(
        connectivity.CONNECTIVITY_RESOURCES,
        undefined
    );

    assert.equal(
        connectivity.BLUETOOTH_SERIAL_CONTRACT,
        undefined
    );

    assert.equal(
        connectivity.EASYBLOX_BT_CHANNEL,
        undefined
    );
});
