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
