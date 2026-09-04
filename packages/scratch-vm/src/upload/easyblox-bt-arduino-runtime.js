const easybloxConnectivityContract =
    require(
        '../connectivity/easyblox-connectivity-contract'
    );

const {
    EASYBLOX_ARDUINO_RUNTIME_SOURCES
} = require(
    './generated/easyblox-arduino-runtime-files'
);

const EASYBLOX_BT_INTERNAL_IDENTIFIERS = Object.freeze([
    'SoftwareSerial',
    'EASYBLOX_BT_CHANNEL',
    'EASYBLOX_EBCP_MAGIC_0',
    'EASYBLOX_EBCP_MAGIC_1',
    'EASYBLOX_EBCP_VERSION',
    'EASYBLOX_EBCP_TYPE_TEXT',
    'EASYBLOX_EBCP_TYPE_NUMBER',
    'EASYBLOX_EBCP_TYPE_BOOLEAN',
    'EASYBLOX_EBCP_ACK',
    'EASYBLOX_EBCP_HELLO',
    'EASYBLOX_EBCP_HELLO_ACK',
    'EASYBLOX_EBCP_MAX_CHANNEL_BYTES',
    'EASYBLOX_EBCP_MAX_PAYLOAD_BYTES',
    'EASYBLOX_EBCP_MAX_FRAME_BYTES',
    'easybloxBtSerial',
    'easybloxBtNextSequence',
    'easybloxBtLastReceivedSequence',
    'easybloxBtReceivedText',
    'easybloxBtReceivedNumber',
    'easybloxBtTextReady',
    'easybloxBtNumberReady',
    'easybloxBtRxBuffer',
    'easybloxBtRxLength',
    'easybloxBtBegin',
    'easybloxBtTakeSequence',
    'easybloxBtWriteChecksummed',
    'easybloxBtSendFrame',
    'easybloxBtSendText',
    'easybloxBtSendNumber',
    'easybloxBtSendAck',
    'easybloxBtSendHelloAck',
    'easybloxBtResetReceive',
    'easybloxBtProcessFrame',
    'easybloxBtPushByte',
    'easybloxBtPoll',
    'easybloxBtWaitText',
    'easybloxBtWaitNumber'
]);

const runtimeFileNames = [
    'EasyBlox.h',
    'EasyBloxBluetooth.h',
    'EasyBloxBluetooth.cpp'
];

const getEasyBloxBtConfigContent = () => {
    const channel =
        String(
            easybloxConnectivityContract
                .EASYBLOX_BT_CHANNEL
        );

    return [
        '#pragma once',
        '',
        `#define EASYBLOX_BT_CHANNEL_VALUE ${
            JSON.stringify(channel)
        }`,
        ''
    ].join('\n');
};

const getEasyBloxBtSupportFiles = () => {
    const supportFiles = [];

    for (const name of runtimeFileNames) {
        supportFiles.push({
            name,
            content:
                EASYBLOX_ARDUINO_RUNTIME_SOURCES[
                    name
                ]
        });
    }

    supportFiles.push({
        name:
            'EasyBloxConfig.h',
        content:
            getEasyBloxBtConfigContent()
    });

    return supportFiles;
};

module.exports = {
    EASYBLOX_BT_INTERNAL_IDENTIFIERS,
    getEasyBloxBtSupportFiles
};
