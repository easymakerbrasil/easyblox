const tap = require('tap');

const {
    EBCP_CONTRACT,
    EBCP_CONTROL_TYPES,
    encodeFrame
} = require('@easymaker/easyblox-connectivity-core');

const {
    getEasyBloxStageConnectivity
} = require(
    '../../src/connectivity/easyblox-stage-connectivity'
);

const TEXT =
    EBCP_CONTRACT.messageTypes.TEXT;

tap.test(
    'Stage connectivity is shared per Scratch runtime',
    t => {
        const runtimeA = {
            on: () => {}
        };

        const runtimeB = {
            on: () => {}
        };

        const first =
            getEasyBloxStageConnectivity(
                runtimeA
            );

        const second =
            getEasyBloxStageConnectivity(
                runtimeA
            );

        const other =
            getEasyBloxStageConnectivity(
                runtimeB
            );

        t.equal(
            first,
            second,
            'the same Scratch runtime owns one connectivity service'
        );

        t.not(
            first,
            other,
            'different Scratch runtimes remain isolated'
        );

        t.end();
    }
);

tap.test(
    'Stage connectivity installs one Bluetooth receive callback for a shared provider',
    async t => {
        const order = [];
        let callback = null;
        let callbackInstallCount = 0;
        let initializationCount = 0;

        const provider = {
            onBluetoothSerialData: handler => {
                callbackInstallCount++;
                callback = handler;
                order.push('callback');
            },

            initBluetoothSerial: () => {
                initializationCount++;
                order.push('init');

                return Promise.resolve(
                    0x40
                );
            },

            writeBluetoothSerial: () =>
                0x41
        };

        const runtime = {
            on: () => {},

            getPeripheralExtensionByCapability:
                capability => {
                    t.equal(
                        capability,
                        'bluetoothSerial'
                    );

                    return provider;
                }
        };

        const connectivity =
            getEasyBloxStageConnectivity(
                runtime
            );

        t.equal(
            await connectivity
                .initializeBluetoothSerial(),
            0x40
        );

        t.equal(
            await connectivity
                .initializeBluetoothSerial(),
            0x40
        );

        t.equal(
            callbackInstallCount,
            1,
            'the provider receive callback is installed only once'
        );

        t.equal(
            initializationCount,
            2,
            'explicit initialization still reaches the board each time'
        );

        t.same(
            order,
            [
                'callback',
                'init',
                'init'
            ],
            'the receive callback exists before physical initialization'
        );

        t.type(
            callback,
            'function'
        );
    }
);

tap.test(
    'Stage connectivity routes incoming EBCP data and ACK through the shared session',
    async t => {
        let bluetoothDataCallback = null;
        const writes = [];

        const provider = {
            onBluetoothSerialData: callback => {
                bluetoothDataCallback =
                    callback;
            },

            initBluetoothSerial: () =>
                Promise.resolve(0x40),

            writeBluetoothSerial: data => {
                writes.push(
                    Buffer.from(data)
                );

                return 0x41;
            }
        };

        const runtime = {
            on: () => {},

            getPeripheralExtensionByCapability:
                () => provider
        };

        const connectivity =
            getEasyBloxStageConnectivity(
                runtime
            );

        await connectivity
            .initializeBluetoothSerial();

        const wait =
            connectivity.waitFor(
                TEXT,
                '1'
            );

        bluetoothDataCallback(
            encodeFrame({
                type: TEXT,
                sequence: 0x21,
                channel: '1',
                payload: 'ligar'
            })
        );

        const message = await wait;

        t.equal(
            message.payload,
            'ligar'
        );

        t.same(
            writes[0],
            encodeFrame({
                type:
                    EBCP_CONTROL_TYPES.ACK,
                sequence: 0,
                channel: '',
                payload: Buffer.from([
                    0x21
                ])
            }),
            'one canonical ACK is returned through the shared provider'
        );
    }
);

tap.test(
    'Stage connectivity rejects an invalid runtime owner',
    t => {
        t.throws(
            () =>
                getEasyBloxStageConnectivity(
                    null
                ),
            /requires a Scratch runtime/
        );

        t.end();
    }
);
