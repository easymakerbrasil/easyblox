const tap = require('tap');

const ArduinoUnoGenerator =
    require('../../src/upload/arduino-uno-generator');

const easybloxConnectivityContract =
    require('../../src/connectivity/easyblox-connectivity-contract');

const {
    EASYBLOX_BT_CHANNEL
} = easybloxConnectivityContract;

const createIr = (
    setup = [],
    loop = []
) => ({
    globals: {
        variables: [],
        lists: []
    },
    procedures: [],
    setup,
    loop
});

const fixedChannel = {
    type: 'TextLiteral',
    value: '1'
};

tap.test(
    'EasyBlox BT Arduino runtime derives the hidden channel from the canonical connectivity contract',
    t => {
        const runtimePath = require.resolve(
            '../../src/upload/easyblox-bt-arduino-runtime'
        );

        const originalChannel =
            easybloxConnectivityContract.EASYBLOX_BT_CHANNEL;

        try {
            easybloxConnectivityContract.EASYBLOX_BT_CHANNEL =
                'test-channel';

            delete require.cache[runtimePath];

            const {
                getEasyBloxBtRuntimeLines
            } = require(runtimePath);

            const runtime =
                getEasyBloxBtRuntimeLines().join('\n');

            t.match(
                runtime,
                /const char EASYBLOX_BT_CHANNEL\[\] = "test-channel";/,
                'generated runtime follows the canonical channel value'
            );
        } finally {
            easybloxConnectivityContract.EASYBLOX_BT_CHANNEL =
                originalChannel;

            delete require.cache[runtimePath];
        }

        t.end();
    }
);

tap.test(
    'EasyBlox BT internal identifiers are reserved only when Bluetooth is used',
    t => {
        const plainGenerator =
            new ArduinoUnoGenerator();

        plainGenerator._initializeDataSymbols(
            [{
                id: 'student_serial',
                name: 'SoftwareSerial'
            }],
            [],
            [],
            false
        );

        t.equal(
            plainGenerator._variablesById
                .get('student_serial')
                .identifier,
            'SoftwareSerial',
            'Bluetooth-only identifiers remain available in a non-Bluetooth sketch'
        );

        const bluetoothGenerator =
            new ArduinoUnoGenerator();

        bluetoothGenerator._initializeDataSymbols(
            [{
                id: 'student_serial',
                name: 'SoftwareSerial'
            }],
            [],
            [],
            true
        );

        t.not(
            bluetoothGenerator._variablesById
                .get('student_serial')
                .identifier,
            'SoftwareSerial',
            'Bluetooth runtime reserves SoftwareSerial when Bluetooth is used'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator emits the fixed D2/D3 SoftwareSerial transport only when used',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch = generator.generate(
            createIr([
                {
                    type: 'EasyBloxBtInit'
                }
            ])
        );

        t.match(
            sketch,
            /#include <SoftwareSerial\.h>/,
            'Bluetooth Upload contributes SoftwareSerial dependency'
        );

        t.match(
            sketch,
            /SoftwareSerial\s+easybloxBtSerial\s*\(\s*2\s*,\s*3\s*\)\s*;/,
            'Bluetooth Upload owns the canonical RX D2 / TX D3 UART'
        );

        t.match(
            sketch,
            /easybloxBtSerial\.begin\s*\(\s*9600\s*\)\s*;/,
            'explicit init starts HC-05/HC-06 UART at 9600 baud'
        );

        const plainSketch =
            generator.generate(
                createIr()
            );

        t.equal(
            plainSketch.includes(
                'SoftwareSerial'
            ),
            false,
            'ordinary sketches do not gain the Bluetooth dependency'
        );

        t.equal(
            plainSketch.includes(
                'easybloxBt'
            ),
            false,
            'ordinary sketches do not gain EBCP Bluetooth helpers'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator emits TEXT and NUMBER sends on the fixed internal channel',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch = generator.generate(
            createIr([
                {
                    type: 'EasyBloxBtSendText',
                    value: {
                        type: 'TextLiteral',
                        value: 'ligar'
                    },
                    channel: fixedChannel
                },
                {
                    type: 'EasyBloxBtSendNumber',
                    value: {
                        type: 'DecimalLiteral',
                        value: 42.5
                    },
                    channel: fixedChannel
                }
            ])
        );

        t.match(
            sketch,
            /easybloxBtSendText\s*\(\s*"1"\s*,\s*"ligar"\s*\)\s*;/,
            'TEXT statement uses the fixed EBCP channel'
        );

        t.match(
            sketch,
            /easybloxBtSendNumber\s*\(\s*"1"\s*,\s*42\.5\s*\)\s*;/,
            'NUMBER statement uses the fixed EBCP channel'
        );

        t.match(
            sketch,
            /easybloxBtNextSequence/,
            'generated runtime owns an application sequence counter'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator emits sequential TEXT and NUMBER waits',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch = generator.generate(
            createIr([
                {
                    type: 'EasyBloxBtWaitText',
                    channel: fixedChannel
                },
                {
                    type: 'EasyBloxBtWaitNumber',
                    channel: fixedChannel
                }
            ])
        );

        t.match(
            sketch,
            /easybloxBtWaitText\s*\(\s*"1"\s*\)\s*;/,
            'TEXT wait blocks sequentially on the fixed channel'
        );

        t.match(
            sketch,
            /easybloxBtWaitNumber\s*\(\s*"1"\s*\)\s*;/,
            'NUMBER wait blocks sequentially on the fixed channel'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator maps received reporters to typed runtime state',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        t.equal(
            generator._generateExpression({
                type:
                    'EasyBloxBtReceivedTextExpression'
            }),
            'easybloxBtReceivedText',
            'received TEXT reporter reads the TEXT runtime state'
        );

        t.equal(
            generator._generateExpression({
                type:
                    'EasyBloxBtReceivedNumberExpression'
            }),
            'easybloxBtReceivedNumber',
            'received NUMBER reporter reads the numeric runtime state'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator contributes the canonical EBCP receive runtime',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch = generator.generate(
            createIr([
                {
                    type: 'EasyBloxBtInit'
                }
            ])
        );

        t.match(
            sketch,
            new RegExp(
                `EASYBLOX_BT_CHANNEL\\[\\]\\s*=\\s*"${
                    EASYBLOX_BT_CHANNEL
                }"`
            ),
            'generated Arduino runtime uses the canonical hidden Bluetooth channel'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_MAGIC_0\s*=\s*0x45/,
            'generated EBCP runtime uses magic byte 0x45'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_MAGIC_1\s*=\s*0x42/,
            'generated EBCP runtime uses magic byte 0x42'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_VERSION\s*=\s*0x01/,
            'generated EBCP runtime uses protocol version 1'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_TYPE_TEXT\s*=\s*0x01/,
            'generated runtime recognizes TEXT'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_TYPE_NUMBER\s*=\s*0x02/,
            'generated runtime recognizes NUMBER'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_ACK\s*=\s*0x80/,
            'generated runtime can ACK application frames'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_HELLO\s*=\s*0x81/,
            'generated runtime recognizes HELLO'
        );

        t.match(
            sketch,
            /EASYBLOX_EBCP_HELLO_ACK\s*=\s*0x82/,
            'generated runtime can answer HELLO'
        );

        t.match(
            sketch,
            /easybloxBtPoll\s*\(\s*\)/,
            'generated runtime has an incremental receive poller'
        );

        t.match(
            sketch,
            /easybloxBtSendAck\s*\(/,
            'generated runtime has an ACK helper'
        );

        t.end();
    }
);
