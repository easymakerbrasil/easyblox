const easybloxConnectivityContract =
    require(
        '../connectivity/easyblox-connectivity-contract'
    );

const {
    EASYBLOX_ARDUINO_RUNTIME_SOURCES
} = require(
    './generated/easyblox-arduino-runtime-files'
);

const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_CONTROLS_SIGNAL_IDS,
    getEasyConectWireChannel
} = require(
    '@easymaker/easyconect-core'
);

const EASYBLOX_BT_INTERNAL_IDENTIFIERS = Object.freeze([
    'EasyBloxBluetooth',
    'EasyBloxBT',
    'SoftwareSerial',
    'EASYBLOX_BT_CHANNEL',
    'EasyBloxGamepadButton',
    'EASYBLOX_GAMEPAD_BUTTON_COUNT',
    'EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL',
    'EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL',
    'EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL',
    'EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL',
    'EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL',
    'EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL',
    'EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL',
    'EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL',
    'easybloxBtGamepadState',
    'easybloxBtResetGamepadState',
    'easybloxBtGamepadIndexForChannel',
    'EasyBloxControlsJoystickAxis',
    'EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL',
    'EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL',
    'EASYBLOX_CONTROLS_SLIDER_CHANNEL',
    'EASYBLOX_CONTROLS_BUTTON_CHANNEL',
    'EASYBLOX_CONTROLS_SWITCH_CHANNEL',
    'easybloxBtControlsJoystickX',
    'easybloxBtControlsJoystickY',
    'easybloxBtControlsSlider',
    'easybloxBtControlsButton',
    'easybloxBtControlsSwitch',
    'easybloxBtResetControlsState',
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
    'easybloxBtWaitNumber',
    'easybloxUserLoop'
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

    const easyConectChannel =
        signalId => {
            const value =
                getEasyConectWireChannel(
                    signalId
                );

            if (!value) {
                throw new Error(
                    `Missing EasyConect wire channel: ${signalId}`
                );
            }

            return JSON.stringify(value);
        };

    return [
        '#pragma once',
        '',
        `#define EASYBLOX_BT_CHANNEL_VALUE ${
            JSON.stringify(channel)
        }`,
        `#define EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_UP
            )
        }`,
        `#define EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_DOWN
            )
        }`,
        `#define EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_LEFT
            )
        }`,
        `#define EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_RIGHT
            )
        }`,
        `#define EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_TOP
            )
        }`,
        `#define EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_LEFT
            )
        }`,
        `#define EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_BOTTOM
            )
        }`,
        `#define EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_RIGHT
            )
        }`,
        `#define EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_X
            )
        }`,
        `#define EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_Y
            )
        }`,
        `#define EASYBLOX_CONTROLS_SLIDER_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SLIDER
            )
        }`,
        `#define EASYBLOX_CONTROLS_BUTTON_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .BUTTON
            )
        }`,
        `#define EASYBLOX_CONTROLS_SWITCH_CHANNEL_VALUE ${
            easyConectChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SWITCH
            )
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
