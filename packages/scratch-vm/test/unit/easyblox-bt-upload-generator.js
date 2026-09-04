const tap = require('tap');

const ArduinoUnoGenerator =
    require('../../src/upload/arduino-uno-generator');

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
    'EasyBlox BT Upload generator references the encapsulated runtime only when used',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type:
                            'EasyBloxBtInit'
                    }
                ])
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'Bluetooth Upload references the EasyBlox Arduino runtime'
        );

        t.match(
            sketch,
            /easybloxBtBegin\s*\(\s*\)\s*;/,
            'explicit init delegates Bluetooth startup to the runtime library'
        );

        t.notMatch(
            sketch,
            /#include <SoftwareSerial\.h>/,
            'pedagogical sketch does not expose SoftwareSerial'
        );

        t.notMatch(
            sketch,
            /SoftwareSerial\s+easybloxBtSerial/,
            'pedagogical sketch does not expose the D2/D3 transport implementation'
        );

        const plainSketch =
            generator.generate(
                createIr()
            );

        t.notMatch(
            plainSketch,
            /#include "EasyBlox\.h"/,
            'ordinary sketches do not gain the EasyBlox runtime dependency'
        );

        t.equal(
            plainSketch.includes(
                'easybloxBt'
            ),
            false,
            'ordinary sketches do not gain EasyBlox BT calls'
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

        t.notMatch(
            sketch,
            /easybloxBtNextSequence/,
            'application sequence state stays inside the runtime support files'
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
    'EasyBlox BT Upload generator keeps EBCP implementation outside the pedagogical sketch',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type:
                            'EasyBloxBtInit'
                    }
                ])
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'Bluetooth sketch references the EasyBlox runtime'
        );

        t.notMatch(
            sketch,
            /EASYBLOX_EBCP_MAGIC_0/,
            'magic bytes are not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /EASYBLOX_EBCP_TYPE_TEXT/,
            'EBCP type constants are not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /easybloxBtRxBuffer/,
            'receive parser state is not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /easybloxBtPoll\s*\(/,
            'receive poller implementation is not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /easybloxBtSendAck\s*\(/,
            'ACK implementation is not exposed in the sketch'
        );

        t.end();
    }
);
