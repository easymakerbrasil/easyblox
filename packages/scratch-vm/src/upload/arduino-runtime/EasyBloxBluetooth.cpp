#include "EasyBloxBluetooth.h"
#include "EasyBloxConfig.h"
#include <SoftwareSerial.h>

constexpr uint8_t EASYBLOX_EBCP_MAGIC_0 = 0x45;
constexpr uint8_t EASYBLOX_EBCP_MAGIC_1 = 0x42;
constexpr uint8_t EASYBLOX_EBCP_VERSION = 0x01;
constexpr uint8_t EASYBLOX_EBCP_TYPE_TEXT = 0x01;
constexpr uint8_t EASYBLOX_EBCP_TYPE_NUMBER = 0x02;
constexpr uint8_t EASYBLOX_EBCP_TYPE_BOOLEAN = 0x03;
constexpr uint8_t EASYBLOX_EBCP_ACK = 0x80;
constexpr uint8_t EASYBLOX_EBCP_HELLO = 0x81;
constexpr uint8_t EASYBLOX_EBCP_HELLO_ACK = 0x82;
constexpr uint8_t EASYBLOX_EBCP_PING = 0x83;
constexpr uint8_t EASYBLOX_EBCP_PONG = 0x84;
constexpr uint8_t EASYBLOX_EBCP_MAX_CHANNEL_BYTES = 16;
constexpr uint8_t EASYBLOX_EBCP_MAX_PAYLOAD_BYTES = 32;
constexpr uint8_t EASYBLOX_EBCP_MAX_FRAME_BYTES = 56;
const char EASYBLOX_BT_CHANNEL[] = EASYBLOX_BT_CHANNEL_VALUE;

const char EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL[] =
    EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL[] =
    EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_SLIDER_CHANNEL[] =
    EASYBLOX_CONTROLS_SLIDER_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_BUTTON_CHANNEL[] =
    EASYBLOX_CONTROLS_BUTTON_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_SWITCH_CHANNEL[] =
    EASYBLOX_CONTROLS_SWITCH_CHANNEL_VALUE;

constexpr uint8_t EASYBLOX_GAMEPAD_BUTTON_COUNT = 8;

SoftwareSerial easybloxBtSerial(2, 3);

extern void easybloxUserLoop();

void easybloxBtBegin() {
    easybloxBtSerial.begin(9600);
    easybloxBtSerial.listen();
}

uint8_t easybloxBtNextSequence = 1;
uint8_t easybloxBtLastReceivedSequence = 0;
String easybloxBtReceivedText = "";
float easybloxBtReceivedNumber = 0.0f;
bool easybloxBtTextReady = false;
bool easybloxBtNumberReady = false;

bool easybloxBtGamepadState[
    EASYBLOX_GAMEPAD_BUTTON_COUNT
] = {};


float easybloxBtControlsJoystickX = 0.0f;
float easybloxBtControlsJoystickY = 0.0f;
float easybloxBtControlsSlider = 0.0f;
bool easybloxBtControlsButton = false;
bool easybloxBtControlsSwitch = false;

uint8_t easybloxBtRxBuffer[EASYBLOX_EBCP_MAX_FRAME_BYTES] = {};
uint8_t easybloxBtRxLength = 0;

uint8_t easybloxBtTakeSequence() {
    const uint8_t sequence = easybloxBtNextSequence;

    ++easybloxBtNextSequence;

    if (easybloxBtNextSequence == 0) {
        easybloxBtNextSequence = 1;
    }

    return sequence;
}

void easybloxBtWriteChecksummed(uint8_t value, uint8_t &checksum) {
    easybloxBtSerial.write(value);
    checksum ^= value;
}

void easybloxBtSendFrame(
    uint8_t type,
    uint8_t sequence,
    const String &channel,
    const uint8_t *payload,
    uint8_t payloadLength
) {
    uint8_t channelLength = static_cast<uint8_t>(channel.length());

    if (channelLength > EASYBLOX_EBCP_MAX_CHANNEL_BYTES) {
        channelLength = EASYBLOX_EBCP_MAX_CHANNEL_BYTES;
    }

    if (payloadLength > EASYBLOX_EBCP_MAX_PAYLOAD_BYTES) {
        payloadLength = EASYBLOX_EBCP_MAX_PAYLOAD_BYTES;
    }

    uint8_t checksum = 0;

    easybloxBtSerial.write(EASYBLOX_EBCP_MAGIC_0);
    easybloxBtSerial.write(EASYBLOX_EBCP_MAGIC_1);

    easybloxBtWriteChecksummed(EASYBLOX_EBCP_VERSION, checksum);
    easybloxBtWriteChecksummed(type, checksum);
    easybloxBtWriteChecksummed(sequence, checksum);
    easybloxBtWriteChecksummed(channelLength, checksum);
    easybloxBtWriteChecksummed(payloadLength, checksum);

    for (uint8_t index = 0; index < channelLength; ++index) {
        easybloxBtWriteChecksummed(
            static_cast<uint8_t>(channel[index]),
            checksum
        );
    }

    for (uint8_t index = 0; index < payloadLength; ++index) {
        easybloxBtWriteChecksummed(payload[index], checksum);
    }

    easybloxBtSerial.write(checksum);
}

void easybloxBtSendText(const String &channel, const String &value) {
    uint8_t payloadLength = static_cast<uint8_t>(value.length());

    if (payloadLength > EASYBLOX_EBCP_MAX_PAYLOAD_BYTES) {
        payloadLength = EASYBLOX_EBCP_MAX_PAYLOAD_BYTES;
    }

    uint8_t payload[EASYBLOX_EBCP_MAX_PAYLOAD_BYTES] = {};

    for (uint8_t index = 0; index < payloadLength; ++index) {
        payload[index] = static_cast<uint8_t>(value[index]);
    }

    easybloxBtSendFrame(
        EASYBLOX_EBCP_TYPE_TEXT,
        easybloxBtTakeSequence(),
        channel,
        payload,
        payloadLength
    );
}

void easybloxBtSendNumber(const String &channel, double value) {
    union {
        float number;
        uint8_t bytes[4];
    } payload;

    payload.number = static_cast<float>(value);

    easybloxBtSendFrame(
        EASYBLOX_EBCP_TYPE_NUMBER,
        easybloxBtTakeSequence(),
        channel,
        payload.bytes,
        4
    );
}

void easybloxBtSendAck(uint8_t acknowledgedSequence) {
    const uint8_t payload[] = {
        acknowledgedSequence
    };

    easybloxBtSendFrame(
        EASYBLOX_EBCP_ACK,
        0,
        "",
        payload,
        1
    );
}

void easybloxBtSendHelloAck() {
    easybloxBtSendFrame(
        EASYBLOX_EBCP_HELLO_ACK,
        0,
        "",
        0,
        0
    );
}

void easybloxBtSendPong() {
    easybloxBtSendFrame(
        EASYBLOX_EBCP_PONG,
        0,
        "",
        0,
        0
    );
}

void easybloxBtResetReceive(uint8_t possibleMagic = 0) {
    easybloxBtRxLength = 0;

    if (possibleMagic == EASYBLOX_EBCP_MAGIC_0) {
        easybloxBtRxBuffer[0] = possibleMagic;
        easybloxBtRxLength = 1;
    }
}

void easybloxBtResetGamepadState() {
    for (
        uint8_t index = 0;
        index < EASYBLOX_GAMEPAD_BUTTON_COUNT;
        ++index
    ) {
        easybloxBtGamepadState[index] = false;
    }
}

void easybloxBtResetControlsState() {
    easybloxBtControlsJoystickX = 0.0f;
    easybloxBtControlsJoystickY = 0.0f;
    easybloxBtControlsSlider = 0.0f;
    easybloxBtControlsButton = false;
    easybloxBtControlsSwitch = false;
}

int8_t easybloxBtGamepadIndexForChannel(
    const String &channel
) {
    if (channel == EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadUp
        );
    }

    if (channel == EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadDown
        );
    }

    if (channel == EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadLeft
        );
    }

    if (channel == EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadRight
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionTop
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionLeft
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionBottom
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionRight
        );
    }

    return -1;
}

void easybloxBtProcessFrame() {
    if (easybloxBtRxLength < 8) {
        return;
    }

    if (easybloxBtRxBuffer[2] != EASYBLOX_EBCP_VERSION) {
        return;
    }

    const uint8_t type = easybloxBtRxBuffer[3];
    const uint8_t sequence = easybloxBtRxBuffer[4];
    const uint8_t channelLength = easybloxBtRxBuffer[5];
    const uint8_t payloadLength = easybloxBtRxBuffer[6];
    const uint8_t checksumIndex =
        static_cast<uint8_t>(7 + channelLength + payloadLength);

    uint8_t checksum = 0;

    for (uint8_t index = 2; index < checksumIndex; ++index) {
        checksum ^= easybloxBtRxBuffer[index];
    }

    if (checksum != easybloxBtRxBuffer[checksumIndex]) {
        return;
    }

    if (type == EASYBLOX_EBCP_PING) {
        easybloxBtSendPong();
        return;
    }

    if (type == EASYBLOX_EBCP_PONG) {
        return;
    }

    if (type == EASYBLOX_EBCP_HELLO) {
        easybloxBtLastReceivedSequence = 0;
        easybloxBtTextReady = false;
        easybloxBtNumberReady = false;
        easybloxBtResetGamepadState();
        easybloxBtResetControlsState();
        easybloxBtSendHelloAck();
        return;
    }

    if (type == EASYBLOX_EBCP_HELLO_ACK) {
        easybloxBtLastReceivedSequence = 0;
        easybloxBtTextReady = false;
        easybloxBtNumberReady = false;
        return;
    }

    if (type == EASYBLOX_EBCP_ACK) {
        return;
    }

    if (
        type != EASYBLOX_EBCP_TYPE_TEXT &&
        type != EASYBLOX_EBCP_TYPE_NUMBER &&
        type != EASYBLOX_EBCP_TYPE_BOOLEAN
    ) {
        return;
    }

    if (sequence == 0) {
        return;
    }

    if (
        type == EASYBLOX_EBCP_TYPE_NUMBER &&
        payloadLength != 4
    ) {
        return;
    }

    if (
        type == EASYBLOX_EBCP_TYPE_BOOLEAN &&
        payloadLength != 1
    ) {
        return;
    }

    const uint8_t payloadOffset =
        static_cast<uint8_t>(
            7 + channelLength
        );

    if (
        type == EASYBLOX_EBCP_TYPE_BOOLEAN &&
        easybloxBtRxBuffer[payloadOffset] > 1
    ) {
        return;
    }

    if (sequence == easybloxBtLastReceivedSequence) {
        easybloxBtSendAck(sequence);
        return;
    }

    easybloxBtLastReceivedSequence = sequence;
    easybloxBtSendAck(sequence);

    String channel;
    channel.reserve(channelLength);

    for (uint8_t index = 0; index < channelLength; ++index) {
        channel += static_cast<char>(
            easybloxBtRxBuffer[7 + index]
        );
    }

    if (type == EASYBLOX_EBCP_TYPE_BOOLEAN) {
        const bool value =
            easybloxBtRxBuffer[
                payloadOffset
            ] == 1;

        const int8_t gamepadIndex =
            easybloxBtGamepadIndexForChannel(
                channel
            );

        if (gamepadIndex >= 0) {
            easybloxBtGamepadState[
                static_cast<uint8_t>(
                    gamepadIndex
                )
            ] = value;

            return;
        }

        if (channel == EASYBLOX_CONTROLS_BUTTON_CHANNEL) {
            easybloxBtControlsButton = value;
            return;
        }

        if (channel == EASYBLOX_CONTROLS_SWITCH_CHANNEL) {
            easybloxBtControlsSwitch = value;
            return;
        }

        return;
    }

    if (type == EASYBLOX_EBCP_TYPE_NUMBER) {
        union {
            float number;
            uint8_t bytes[4];
        } value;

        for (uint8_t index = 0; index < 4; ++index) {
            value.bytes[index] =
                easybloxBtRxBuffer[payloadOffset + index];
        }

        if (
            channel ==
            EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL
        ) {
            easybloxBtControlsJoystickX =
                value.number;
            return;
        }

        if (
            channel ==
            EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL
        ) {
            easybloxBtControlsJoystickY =
                value.number;
            return;
        }

        if (
            channel ==
            EASYBLOX_CONTROLS_SLIDER_CHANNEL
        ) {
            easybloxBtControlsSlider =
                value.number;
            return;
        }

        if (channel != EASYBLOX_BT_CHANNEL) {
            return;
        }

        easybloxBtReceivedNumber = value.number;
        easybloxBtNumberReady = true;
        return;
    }

    if (channel != EASYBLOX_BT_CHANNEL) {
        return;
    }

    if (type == EASYBLOX_EBCP_TYPE_TEXT) {
        String value;
        value.reserve(payloadLength);

        for (uint8_t index = 0; index < payloadLength; ++index) {
            value += static_cast<char>(
                easybloxBtRxBuffer[payloadOffset + index]
            );
        }

        easybloxBtReceivedText = value;
        easybloxBtTextReady = true;
    }
}

void easybloxBtPushByte(uint8_t value) {
    if (easybloxBtRxLength == 0) {
        if (value == EASYBLOX_EBCP_MAGIC_0) {
            easybloxBtRxBuffer[0] = value;
            easybloxBtRxLength = 1;
        }

        return;
    }

    if (easybloxBtRxLength == 1) {
        if (value == EASYBLOX_EBCP_MAGIC_1) {
            easybloxBtRxBuffer[1] = value;
            easybloxBtRxLength = 2;
        } else if (value != EASYBLOX_EBCP_MAGIC_0) {
            easybloxBtRxLength = 0;
        }

        return;
    }

    if (easybloxBtRxLength >= EASYBLOX_EBCP_MAX_FRAME_BYTES) {
        easybloxBtResetReceive(value);
        return;
    }

    easybloxBtRxBuffer[easybloxBtRxLength++] = value;

    if (easybloxBtRxLength < 7) {
        return;
    }

    const uint8_t channelLength = easybloxBtRxBuffer[5];
    const uint8_t payloadLength = easybloxBtRxBuffer[6];

    if (
        channelLength > EASYBLOX_EBCP_MAX_CHANNEL_BYTES ||
        payloadLength > EASYBLOX_EBCP_MAX_PAYLOAD_BYTES
    ) {
        easybloxBtResetReceive(value);
        return;
    }

    const uint8_t expectedLength =
        static_cast<uint8_t>(8 + channelLength + payloadLength);

    if (easybloxBtRxLength == expectedLength) {
        easybloxBtProcessFrame();
        easybloxBtResetReceive();
    }
}

void easybloxBtPoll() {
    while (easybloxBtSerial.available() > 0) {
        const int value = easybloxBtSerial.read();

        if (value >= 0) {
            easybloxBtPushByte(static_cast<uint8_t>(value));
        }
    }
}

void easybloxDelay(unsigned long milliseconds) {
    const unsigned long startedAt =
        millis();

    while (
        static_cast<unsigned long>(
            millis() - startedAt
        ) < milliseconds
    ) {
        easybloxBtPoll();
        delay(1);
    }

    easybloxBtPoll();
}

void loop() {
    easybloxBtPoll();
    easybloxUserLoop();
}

void easybloxBtWaitText(const String &channel) {
    (void)channel;

    while (!easybloxBtTextReady) {
        easybloxBtPoll();
    }

    easybloxBtTextReady = false;
}

void easybloxBtWaitNumber(const String &channel) {
    (void)channel;

    while (!easybloxBtNumberReady) {
        easybloxBtPoll();
    }

    easybloxBtNumberReady = false;
}


void EasyBloxBluetooth::begin() {
    easybloxBtResetGamepadState();
    easybloxBtResetControlsState();
    easybloxBtBegin();
}

void EasyBloxBluetooth::sendText(
    const String &value
) {
    easybloxBtSendText(
        EASYBLOX_BT_CHANNEL,
        value
    );
}

void EasyBloxBluetooth::sendNumber(
    double value
) {
    easybloxBtSendNumber(
        EASYBLOX_BT_CHANNEL,
        value
    );
}

void EasyBloxBluetooth::waitText() {
    easybloxBtWaitText(
        EASYBLOX_BT_CHANNEL
    );
}

void EasyBloxBluetooth::waitNumber() {
    easybloxBtWaitNumber(
        EASYBLOX_BT_CHANNEL
    );
}

const String &EasyBloxBluetooth::receivedText() const {
    return easybloxBtReceivedText;
}

float EasyBloxBluetooth::receivedNumber() const {
    return easybloxBtReceivedNumber;
}

bool EasyBloxBluetooth::gamepadButtonPressed(
    EasyBloxGamepadButton button
) {
    easybloxBtPoll();

    const uint8_t index =
        static_cast<uint8_t>(
            button
        );

    if (
        index >=
        EASYBLOX_GAMEPAD_BUTTON_COUNT
    ) {
        return false;
    }

    return easybloxBtGamepadState[
        index
    ];
}

float EasyBloxBluetooth::controlsJoystickPosition(
    EasyBloxControlsJoystickAxis axis
) {
    easybloxBtPoll();

    if (
        axis ==
        EasyBloxControlsJoystickAxis::Vertical
    ) {
        return easybloxBtControlsJoystickY;
    }

    return easybloxBtControlsJoystickX;
}

float EasyBloxBluetooth::controlsSliderValue() {
    easybloxBtPoll();

    return easybloxBtControlsSlider;
}

bool EasyBloxBluetooth::controlsButtonPressed() {
    easybloxBtPoll();

    return easybloxBtControlsButton;
}

bool EasyBloxBluetooth::controlsSwitchOn() {
    easybloxBtPoll();

    return easybloxBtControlsSwitch;
}

EasyBloxBluetooth EasyBloxBT;
