const tap = require('tap');

const {
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

const {
    decodeFrame,
    encodeFrame
} = require('../../src/connectivity/easyblox-connectivity-protocol');

const {
    EasyBloxConnectivitySession
} = require('../../src/connectivity/easyblox-connectivity-session');

const Scratch3EasyBloxBtBlocks =
    require('../../src/extensions/scratch3_easyblox_bt');

const TEXT =
    EBCP_CONTRACT.messageTypes.TEXT;

const NUMBER =
    EBCP_CONTRACT.messageTypes.NUMBER;

tap.test(
    'EBCP session allocates outgoing application sequences from 1 through 255',
    t => {
        const writes = [];

        const session =
            new EasyBloxConnectivitySession({
                runtime: {
                    receive: () => {}
                },
                write: data => {
                    writes.push(
                        Buffer.from(data)
                    );
                }
            });

        for (let index = 0; index < 256; index++) {
            session.send(
                TEXT,
                'cmd',
                'x'
            );
        }

        t.equal(
            decodeFrame(writes[0]).sequence,
            1,
            'first outgoing application sequence is 1'
        );

        t.equal(
            decodeFrame(writes[254]).sequence,
            255,
            'application sequence reaches 255'
        );

        t.equal(
            decodeFrame(writes[255]).sequence,
            1,
            'application sequence wraps from 255 back to 1'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Stage sends are safe before transport initialization',
    t => {
        const extension =
            new Scratch3EasyBloxBtBlocks({});

        t.equal(
            extension.sendText({
                TEXT: 'ligar'
            }),
            null,
            'text send is unavailable before init'
        );

        t.equal(
            extension.sendNumber({
                NUMBER: 42
            }),
            null,
            'number send is unavailable before init'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Stage maps public sends to the fixed EBCP channel',
    async t => {
        const writes = [];

        const peripheral = {
            onBluetoothSerialData: () => {},

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
            getPeripheralExtensionByCapability: () =>
                peripheral
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(runtime);

        await extension.init();

        extension.sendText({
            TEXT: 'ligar'
        });

        extension.sendNumber({
            NUMBER: 42.5
        });

        t.equal(
            decodeFrame(writes[0]).channel,
            '1',
            'TEXT uses the fixed internal EBCP channel'
        );

        t.equal(
            decodeFrame(writes[1]).channel,
            '1',
            'NUMBER uses the fixed internal EBCP channel'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Stage encodes and fragments outgoing TEXT and NUMBER frames',
    async t => {
        const writes = [];

        const peripheral = {
            onBluetoothSerialData: () => {},

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
            getPeripheralExtensionByCapability: capability => {
                t.equal(
                    capability,
                    'bluetoothSerial'
                );

                return peripheral;
            }
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(runtime);

        await extension.init();

        const textPayload =
            'A'.repeat(
                EBCP_CONTRACT.maxPayloadBytes
            );

        const textSequence =
            extension.sendText({
                TEXT: textPayload
            });

        t.equal(
            textSequence,
            1,
            'first outgoing EasyBlox BT application message uses sequence 1'
        );

        t.equal(
            writes.length,
            2,
            'maximum TEXT frame is fragmented into two Stage chunks'
        );

        t.equal(
            writes[0].length,
            32,
            'first Stage transport chunk uses the maximum 32 bytes'
        );

        t.equal(
            writes[1].length,
            9,
            'remaining fixed-channel EBCP bytes are sent in the second chunk'
        );

        const expectedTextFrame =
            encodeFrame({
                type: TEXT,
                sequence: 1,
                channel: '1',
                payload: textPayload
            });

        t.equal(
            expectedTextFrame.length,
            41,
            'maximum EasyBlox BT TEXT payload uses a 41-byte fixed-channel frame'
        );

        t.same(
            Buffer.concat([
                writes[0],
                writes[1]
            ]),
            expectedTextFrame,
            'fragmentation preserves the exact encoded EBCP byte stream'
        );

        writes.length = 0;

        const numberSequence =
            extension.sendNumber({
                NUMBER: 42.5
            });

        t.equal(
            numberSequence,
            2,
            'outgoing sequence advances across message types'
        );

        t.equal(
            writes.length,
            1,
            'NUMBER frame fits in one Stage transport chunk'
        );

        t.same(
            writes[0],
            encodeFrame({
                type: NUMBER,
                sequence: 2,
                channel: '1',
                payload: 42.5
            }),
            'NUMBER is encoded as the canonical EBCP frame'
        );

        t.ok(
            writes[0].length <= 32,
            'every Stage Bluetooth write respects the transport payload limit'
        );
    }
);
