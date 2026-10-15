const tap = require('tap');

const Runtime =
    require('../../src/engine/runtime');

tap.test(
    'Runtime resolves a registered peripheral by neutral capability',
    t => {
        const runtime = new Runtime();

        const legacyPeripheral = {};
        const bluetoothPeripheral = {};

        runtime.registerPeripheralExtension(
            'legacy',
            legacyPeripheral
        );

        runtime.registerPeripheralExtension(
            'bluetoothBoard',
            bluetoothPeripheral,
            [
                'bluetoothSerial'
            ]
        );

        t.equal(
            runtime.getPeripheralExtensionByCapability(
                'bluetoothSerial'
            ),
            bluetoothPeripheral,
            'returns the peripheral registered for the requested capability'
        );

        t.equal(
            runtime.getPeripheralExtensionByCapability(
                'wifi'
            ),
            null,
            'returns null when no peripheral provides the capability'
        );

        t.equal(
            runtime.getPeripheralExtension(
                'legacy'
            ),
            legacyPeripheral,
            'legacy id-based lookup remains compatible'
        );

        runtime.dispose();
        t.end();
    }
);

tap.test('Runtime denies only Bluetooth capability on EasyDuino Jr', t => {
    const runtime = new Runtime();
    t.teardown(() => runtime.dispose());
    const provider = {isConnected: () => true};
    runtime.registerPeripheralExtension('arduinoUno', provider, ['bluetoothSerial', 'wifi']);
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');

    t.equal(runtime.getEasyBloxSelectedBoardId(), 'easyduino-jr');
    t.equal(runtime.getPeripheralExtensionByCapability('bluetoothSerial'), null);
    t.equal(runtime.getPeripheralExtensionByCapability('wifi'), provider);
    t.equal(runtime.getPeripheralExtension('arduinoUno'), provider);
    t.same(runtime.peripheralExtensionCapabilities.arduinoUno, ['bluetoothSerial', 'wifi']);
    t.end();
});

tap.test('Runtime preserves Bluetooth resolution for compatible boards and legacy contexts', t => {
    const runtime = new Runtime();
    t.teardown(() => runtime.dispose());
    const fallback = {isConnected: () => false};
    const connected = {isConnected: () => true};
    runtime.registerPeripheralExtension('fallback', fallback, ['bluetoothSerial']);
    runtime.registerPeripheralExtension('connected', connected, ['bluetoothSerial']);

    for (const boardId of ['arduino-uno', 'easymaker', 'easyduino-proto', null]) {
        runtime.setEasyBloxSelectedBoardId('easyduino-jr');
        runtime.setEasyBloxSelectedBoardId(boardId);
        t.equal(runtime.getPeripheralExtensionByCapability('bluetoothSerial'), connected, String(boardId));
    }
    t.end();
});
