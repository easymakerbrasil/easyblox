const test = require('node:test');
const assert = require('node:assert/strict');

const {
    WindowsBluetoothDeviceNameResolver,
    extractRemoteBluetoothAddress
} = require(
    '../src/windows-bluetooth-device-name-resolver'
);

const REMOTE_PNP_ID =
    'BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0002\\7&14754451&0&00220401442C_C00000000';

const LOCAL_PNP_ID =
    'BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0000\\7&14754451&0&000000000000_00000002';

test(
    'Windows Bluetooth name resolver extracts the remote address from an SPP PnP id',
    () => {
        assert.equal(
            extractRemoteBluetoothAddress(
                REMOTE_PNP_ID
            ),
            '00220401442C'
        );

        assert.equal(
            extractRemoteBluetoothAddress(
                LOCAL_PNP_ID
            ),
            null
        );

        assert.equal(
            extractRemoteBluetoothAddress(
                'USB\\VID_1A86&PID_7523'
            ),
            null
        );
    }
);

test(
    'Windows Bluetooth name resolver returns the paired device friendly name',
    async () => {
        const calls = [];

        const resolver =
            new WindowsBluetoothDeviceNameResolver({
                processRunner:
                    async (
                        file,
                        args
                    ) => {
                        calls.push({
                            file,
                            args
                        });

                        return {
                            exitCode: 0,
                            stdout: [
                                '',
                                'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Enum\\BTHENUM\\DEV_00220401442C\\device-1',
                                '    FriendlyName    REG_SZ    EasyMaker-37',
                                '',
                                'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Enum\\BTHENUM\\DEV_00220401442C\\device-2',
                                '    FriendlyName    REG_SZ    EasyMaker-37',
                                ''
                            ].join(
                                '\r\n'
                            ),
                            stderr: ''
                        };
                    }
            });

        assert.equal(
            await resolver.resolve({
                pnpId:
                    REMOTE_PNP_ID
            }),
            'EasyMaker-37'
        );

        assert.deepEqual(
            calls,
            [
                {
                    file:
                        'reg.exe',
                    args: [
                        'query',
                        'HKLM\\SYSTEM\\CurrentControlSet\\Enum\\BTHENUM\\DEV_00220401442C',
                        '/s',
                        '/v',
                        'FriendlyName'
                    ]
                }
            ]
        );
    }
);

test(
    'Windows Bluetooth name resolver ignores local Bluetooth serial endpoints',
    async () => {
        let called =
            false;

        const resolver =
            new WindowsBluetoothDeviceNameResolver({
                processRunner:
                    async () => {
                        called =
                            true;

                        return {
                            stdout: ''
                        };
                    }
            });

        assert.equal(
            await resolver.resolve({
                pnpId:
                    LOCAL_PNP_ID
            }),
            null
        );

        assert.equal(
            called,
            false
        );
    }
);

test(
    'Windows Bluetooth name resolver fails softly when registry lookup is unavailable',
    async () => {
        const resolver =
            new WindowsBluetoothDeviceNameResolver({
                processRunner:
                    async () => {
                        throw new Error(
                            'Registry unavailable'
                        );
                    }
            });

        assert.equal(
            await resolver.resolve({
                pnpId:
                    REMOTE_PNP_ID
            }),
            null
        );
    }
);
