const tap = require('tap');

const {
    CONNECTIVITY_RESOURCES,
    BLUETOOTH_SERIAL_CONTRACT,
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

tap.test('EasyBlox connectivity contract defines the canonical shared D2/D3 software UART resource', t => {
    t.equal(
        CONNECTIVITY_RESOURCES.SOFTWARE_UART_D2_D3,
        'SOFTWARE_UART_D2_D3'
    );

    t.end();
});

tap.test('EasyBlox Bluetooth serial contract fixes HC-05/HC-06 to D2/D3 at 9600 8N1', t => {
    t.same(
        BLUETOOTH_SERIAL_CONTRACT.modules,
        ['HC-05', 'HC-06']
    );

    t.equal(BLUETOOTH_SERIAL_CONTRACT.rxPin, 2);
    t.equal(BLUETOOTH_SERIAL_CONTRACT.txPin, 3);
    t.equal(BLUETOOTH_SERIAL_CONTRACT.baudRate, 9600);
    t.equal(BLUETOOTH_SERIAL_CONTRACT.dataBits, 8);
    t.equal(BLUETOOTH_SERIAL_CONTRACT.parity, 'none');
    t.equal(BLUETOOTH_SERIAL_CONTRACT.stopBits, 1);

    t.equal(
        BLUETOOTH_SERIAL_CONTRACT.resource,
        CONNECTIVITY_RESOURCES.SOFTWARE_UART_D2_D3
    );

    t.end();
});

tap.test('EBCP v1 defines its canonical framing limits', t => {
    t.same(EBCP_CONTRACT.magic, [0x45, 0x42]);
    t.equal(EBCP_CONTRACT.version, 0x01);

    t.equal(EBCP_CONTRACT.maxChannelBytes, 16);
    t.equal(EBCP_CONTRACT.maxPayloadBytes, 32);
    t.equal(EBCP_CONTRACT.maxFrameBytes, 56);

    t.equal(EBCP_CONTRACT.checksum, 'xor');

    t.end();
});

tap.test('EBCP v1 reserves typed application messages', t => {
    t.same(EBCP_CONTRACT.messageTypes, {
        TEXT: 0x01,
        NUMBER: 0x02,
        BOOLEAN: 0x03
    });

    t.equal(EBCP_CONTRACT.textEncoding, 'utf8');
    t.equal(EBCP_CONTRACT.numberEncoding, 'ieee754-binary32');
    t.equal(EBCP_CONTRACT.numberPayloadBytes, 4);

    t.end();
});

tap.test('EBCP v1 reserves the control message range for handshake and acknowledgement', t => {
    t.same(EBCP_CONTRACT.controlTypeRange, {
        min: 0x80,
        max: 0xFF
    });

    t.equal(EBCP_CONTRACT.acknowledgement, 'stop-and-wait');
    t.equal(EBCP_CONTRACT.handshake, true);

    t.end();
});

tap.test('EBCP v1 fixes the public channel identifier contract', t => {
    t.equal(EBCP_CONTRACT.channelMinBytes, 1);
    t.equal(EBCP_CONTRACT.channelMaxBytes, 16);
    t.equal(
        EBCP_CONTRACT.channelPattern,
        '^[A-Za-z0-9_.-]{1,16}$'
    );

    t.end();
});
