const fs = require('fs');
const path = require('path');
const tap = require('tap');

const ArduinoUnoPeripheral =
    require('../../src/extensions/scratch3_arduino_uno/peripheral');

const {
    COMMANDS,
    MAX_PAYLOAD_LENGTH,
    RESPONSES,
    STAGE_FIRMWARE_COMPATIBILITY_VERSION
} = require('../../src/extensions/scratch3_arduino_uno/protocol');

class MockRuntime {
    constructor () {
        this.peripheralExtensions = {};
        this.peripheralCapabilities = {};
    }

    registerPeripheralExtension (
        extensionId,
        extension,
        capabilities = []
    ) {
        this.peripheralExtensions[extensionId] = extension;
        this.peripheralCapabilities[extensionId] =
            Array.from(capabilities);
    }
}

tap.test(
    'Arduino UNO registers the neutral Bluetooth serial capability',
    t => {
        const runtime = new MockRuntime();
        const peripheral =
            new ArduinoUnoPeripheral(runtime);

        t.equal(
            runtime.peripheralExtensions.arduinoUno,
            peripheral
        );

        t.same(
            runtime.peripheralCapabilities.arduinoUno,
            [
                'bluetoothSerial'
            ]
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Stage reserves protocol values for Bluetooth serial transport',
    t => {
        t.equal(
            COMMANDS.BT_SERIAL_INIT,
            0x26
        );

        t.equal(
            COMMANDS.BT_SERIAL_WRITE,
            0x27
        );

        t.equal(
            RESPONSES.BT_SERIAL_DATA,
            0x97
        );

        t.equal(
            STAGE_FIRMWARE_COMPATIBILITY_VERSION,
            0x02,
            'Bluetooth transport requires Stage firmware compatibility v2'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Stage initializes Bluetooth serial transport explicitly',
    async t => {
        const runtime = new MockRuntime();
        const peripheral =
            new ArduinoUnoPeripheral(runtime);

        const sent = [];

        peripheral._stageConnected = true;

        peripheral._sendCommandWithAck = (
            command,
            payload = []
        ) => {
            sent.push({
                command,
                payload: Array.from(payload)
            });

            return Promise.resolve(0x40);
        };

        const sequence =
            await peripheral.initBluetoothSerial();

        t.equal(sequence, 0x40);

        t.same(sent, [{
            command: COMMANDS.BT_SERIAL_INIT,
            payload: []
        }]);
    }
);

tap.test(
    'Arduino UNO Stage writes a Bluetooth serial transport chunk',
    t => {
        const runtime = new MockRuntime();
        const peripheral =
            new ArduinoUnoPeripheral(runtime);

        const sent = [];

        peripheral._stageConnected = true;

        peripheral._sendCommand = (
            command,
            payload
        ) => {
            sent.push({
                command,
                payload: Array.from(payload)
            });

            return 0x41;
        };

        const sequence =
            peripheral.writeBluetoothSerial(
                Uint8Array.from([
                    0x45,
                    0x42,
                    0x01,
                    0x81
                ])
            );

        t.equal(sequence, 0x41);

        t.same(sent, [{
            command: COMMANDS.BT_SERIAL_WRITE,
            payload: [
                0x45,
                0x42,
                0x01,
                0x81
            ]
        }]);

        t.end();
    }
);

tap.test(
    'Arduino UNO Stage rejects unavailable or invalid Bluetooth serial writes',
    t => {
        const runtime = new MockRuntime();
        const peripheral =
            new ArduinoUnoPeripheral(runtime);

        let sendCount = 0;

        peripheral._sendCommand = () => {
            sendCount++;
            return 0x42;
        };

        t.equal(
            peripheral.writeBluetoothSerial(
                Uint8Array.from([0x45])
            ),
            null,
            'transport is unavailable before Stage handshake'
        );

        peripheral._stageConnected = true;

        t.equal(
            peripheral.writeBluetoothSerial(
                new Uint8Array(0)
            ),
            null,
            'empty transport chunks are rejected'
        );

        t.equal(
            peripheral.writeBluetoothSerial(
                new Uint8Array(
                    MAX_PAYLOAD_LENGTH + 1
                )
            ),
            null,
            'chunks larger than the Stage payload are rejected'
        );

        t.equal(
            sendCount,
            0,
            'invalid writes never reach the Stage command layer'
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Stage forwards asynchronous Bluetooth serial data',
    t => {
        const runtime = new MockRuntime();
        const peripheral =
            new ArduinoUnoPeripheral(runtime);

        const received = [];

        peripheral.onBluetoothSerialData(
            data => {
                received.push(
                    Array.from(data)
                );
            }
        );

        peripheral._handleFrame({
            version: 0x01,
            sequence: 0,
            command: RESPONSES.BT_SERIAL_DATA,
            payload: Uint8Array.from([
                0x45,
                0x42,
                0x01,
                0x01
            ])
        });

        t.same(received, [[
            0x45,
            0x42,
            0x01,
            0x01
        ]]);

        t.end();
    }
);

tap.test(
    'Arduino UNO Stage Bluetooth callback can be removed',
    t => {
        const runtime = new MockRuntime();
        const peripheral =
            new ArduinoUnoPeripheral(runtime);

        let receiveCount = 0;

        peripheral.onBluetoothSerialData(() => {
            receiveCount++;
        });

        peripheral.onBluetoothSerialData(null);

        peripheral._handleFrame({
            version: 0x01,
            sequence: 0,
            command: RESPONSES.BT_SERIAL_DATA,
            payload: Uint8Array.from([
                0x45
            ])
        });

        t.equal(receiveCount, 0);

        t.end();
    }
);

tap.test(
    'Arduino UNO Stage firmware defines the Bluetooth serial byte bridge',
    t => {
        const firmwarePath = path.resolve(
            __dirname,
            '../../firmware/arduino-uno/stage/stage.ino'
        );

        const firmware =
            fs.readFileSync(
                firmwarePath,
                'utf8'
            );

        t.match(
            firmware,
            /#include\s+<SoftwareSerial\.h>/,
            'firmware includes SoftwareSerial'
        );

        t.match(
            firmware,
            /STAGE_FIRMWARE_COMPATIBILITY_VERSION\s*=\s*0x02/,
            'firmware declares compatibility version 2'
        );

        t.match(
            firmware,
            /COMMAND_BT_SERIAL_INIT\s*=\s*0x26/,
            'firmware declares Bluetooth init command'
        );

        t.match(
            firmware,
            /COMMAND_BT_SERIAL_WRITE\s*=\s*0x27/,
            'firmware declares Bluetooth write command'
        );

        t.match(
            firmware,
            /RESPONSE_BT_SERIAL_DATA\s*=\s*0x97/,
            'firmware declares asynchronous Bluetooth data response'
        );

        t.match(
            firmware,
            /BT_SERIAL_RX_PIN\s*=\s*2/,
            'Bluetooth RX is fixed to D2'
        );

        t.match(
            firmware,
            /BT_SERIAL_TX_PIN\s*=\s*3/,
            'Bluetooth TX is fixed to D3'
        );

        t.match(
            firmware,
            /BT_SERIAL_BAUD_RATE\s*=\s*9600/,
            'Bluetooth UART is fixed to 9600 baud'
        );

        t.match(
            firmware,
            /static\s+SoftwareSerial\s+\w+\s*\(\s*BT_SERIAL_RX_PIN\s*,\s*BT_SERIAL_TX_PIN\s*\)/,
            'SoftwareSerial is constructed lazily on first Bluetooth initialization'
        );

        t.match(
            firmware,
            /\.begin\(\s*BT_SERIAL_BAUD_RATE\s*\)/,
            'Bluetooth UART starts only through explicit initialization'
        );

        t.match(
            firmware,
            /command\s*==\s*COMMAND_BT_SERIAL_INIT/,
            'Stage dispatcher handles Bluetooth initialization'
        );

        t.match(
            firmware,
            /command\s*==\s*COMMAND_BT_SERIAL_WRITE/,
            'Stage dispatcher handles Bluetooth transport writes'
        );

        t.match(
            firmware,
            /RESPONSE_BT_SERIAL_DATA/,
            'firmware can emit Bluetooth transport data'
        );

        t.end();
    }
);
