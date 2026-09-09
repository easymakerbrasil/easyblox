const easybloxConnectivityContract =
    require(
        '../connectivity/easyblox-connectivity-contract'
    );

const {
    EASYBLOX_ARDUINO_RUNTIME_SOURCES
} = require(
    './generated/easyblox-arduino-runtime-files'
);

const CONTROLLER_BINDING_CHANNEL_PATTERN =
    /^C1\.[0-9A-F]{8}$/;

const EASYBLOX_BT_INTERNAL_IDENTIFIERS = Object.freeze([
    'EasyBloxBluetooth',
    'EasyBloxBT',
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
    'EASYBLOX_CONTROLLER_BINDING_COUNT',
    'EASYBLOX_CONTROLLER_BINDING_CHANNELS',
    'easybloxBtSerial',
    'easybloxBtNextSequence',
    'easybloxBtLastReceivedSequence',
    'easybloxBtReceivedText',
    'easybloxBtReceivedNumber',
    'easybloxBtTextReady',
    'easybloxBtNumberReady',
    'easybloxBtBindingNumberValues',
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
    'easybloxBtFindControllerBinding',
    'easybloxBtResetControllerBindings',
    'easybloxBtProcessFrame',
    'easybloxBtPushByte',
    'easybloxBtPoll',
    'easybloxBtWaitText',
    'easybloxBtWaitNumber',
    'easybloxControllerBindingNumber',
    'easybloxControllerBindingBoolean',
    'easybloxUserLoop'
]);

const runtimeFileNames = [
    'EasyBlox.h',
    'EasyBloxBluetooth.h',
    'EasyBloxBluetooth.cpp'
];

const normalizeControllerBindingChannels =
    options => {
        if (
            options &&
            Object.prototype.hasOwnProperty.call(
                options,
                'controllerBindingChannels'
            ) &&
            !Array.isArray(
                options.controllerBindingChannels
            )
        ) {
            throw new Error(
                'Controller Binding channels must be an array'
            );
        }

        const channels =
            options &&
            Array.isArray(
                options.controllerBindingChannels
            ) ?
                options.controllerBindingChannels :
                [];

        if (
            channels.length >
            255
        ) {
            throw new Error(
                'Controller Binding channel count exceeds 255'
            );
        }

        const seen =
            new Set();

        return channels.map(
            channel => {
                if (
                    typeof channel !==
                        'string' ||
                    !CONTROLLER_BINDING_CHANNEL_PATTERN.test(
                        channel
                    )
                ) {
                    throw new Error(
                        `Invalid Controller Binding channel: ${channel}`
                    );
                }

                if (
                    seen.has(
                        channel
                    )
                ) {
                    throw new Error(
                        `Duplicate Controller Binding channel: ${channel}`
                    );
                }

                seen.add(
                    channel
                );

                return channel;
            }
        );
    };

const getEasyBloxBtConfigContent =
    (options = {}) => {
        const channel =
            String(
                easybloxConnectivityContract
                    .EASYBLOX_BT_CHANNEL
            );

        const controllerBindingChannels =
            normalizeControllerBindingChannels(
                options
            );

        const controllerBindingValues =
            controllerBindingChannels.length >
                0 ?
                controllerBindingChannels.map(
                    bindingChannel =>
                        `    ${JSON.stringify(bindingChannel)}`
                ) :
                [
                    '    ""'
                ];

        return [
            '#pragma once',
            '',
            `#define EASYBLOX_BT_CHANNEL_VALUE ${
                JSON.stringify(channel)
            }`,
            '',
            '#define EASYBLOX_CONTROLLER_BINDING_COUNT ' +
                controllerBindingChannels.length,
            '',
            'static const char * const ' +
                'EASYBLOX_CONTROLLER_BINDING_CHANNELS[',
            '    EASYBLOX_CONTROLLER_BINDING_COUNT > 0 ?',
            '        EASYBLOX_CONTROLLER_BINDING_COUNT :',
            '        1',
            '] = {',
            controllerBindingValues.join(',\n'),
            '};',
            ''
        ].join('\n');
    };

const getEasyBloxBtSupportFiles =
    (options = {}) => {
        const supportFiles = [];

        for (
            const name of
                runtimeFileNames
        ) {
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
                getEasyBloxBtConfigContent(
                    options
                )
        });

        return supportFiles;
    };

module.exports = {
    EASYBLOX_BT_INTERNAL_IDENTIFIERS,
    getEasyBloxBtSupportFiles
};
