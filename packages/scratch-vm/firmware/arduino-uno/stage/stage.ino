#include <Arduino.h>

namespace EasyBloxStage {

constexpr uint8_t START_BYTE_1 = 0xFF;
constexpr uint8_t START_BYTE_2 = 0x55;
constexpr uint8_t PROTOCOL_VERSION = 0x01;

constexpr uint8_t MAX_PAYLOAD_LENGTH = 32;

constexpr uint8_t COMMAND_PING = 0x01;
constexpr uint8_t COMMAND_DIGITAL_WRITE = 0x10;
constexpr uint8_t COMMAND_DIGITAL_READ = 0x11;
constexpr uint8_t COMMAND_ANALOG_READ = 0x12;
constexpr uint8_t COMMAND_PWM_WRITE = 0x13;

constexpr uint8_t RESPONSE_ACK = 0x80;
constexpr uint8_t RESPONSE_PONG = 0x81;
constexpr uint8_t RESPONSE_DIGITAL_READ = 0x91;
constexpr uint8_t RESPONSE_ANALOG_READ = 0x92;
constexpr uint8_t RESPONSE_ERROR = 0xFF;

enum class ParserState : uint8_t {
    WaitStart1,
    WaitStart2,
    ReadVersion,
    ReadSequence,
    ReadCommand,
    ReadLength,
    ReadPayload,
    ReadChecksum
};

ParserState parserState = ParserState::WaitStart1;

uint8_t version = 0;
uint8_t sequence = 0;
uint8_t command = 0;
uint8_t payloadLength = 0;
uint8_t payloadIndex = 0;
uint8_t payload[MAX_PAYLOAD_LENGTH];
uint8_t checksum = 0;

void resetParser() {
    parserState = ParserState::WaitStart1;

    version = 0;
    sequence = 0;
    command = 0;
    payloadLength = 0;
    payloadIndex = 0;
    checksum = 0;
}

uint8_t calculateChecksum(
    uint8_t frameVersion,
    uint8_t frameSequence,
    uint8_t frameCommand,
    const uint8_t *framePayload,
    uint8_t framePayloadLength
) {
    uint8_t result = 0;

    result ^= frameVersion;
    result ^= frameSequence;
    result ^= frameCommand;
    result ^= framePayloadLength;

    for (uint8_t index = 0; index < framePayloadLength; index++) {
        result ^= framePayload[index];
    }

    return result;
}

void sendFrame(
    uint8_t frameSequence,
    uint8_t frameCommand,
    const uint8_t *framePayload = nullptr,
    uint8_t framePayloadLength = 0
) {
    Serial.write(START_BYTE_1);
    Serial.write(START_BYTE_2);
    Serial.write(PROTOCOL_VERSION);
    Serial.write(frameSequence);
    Serial.write(frameCommand);
    Serial.write(framePayloadLength);

    for (uint8_t index = 0; index < framePayloadLength; index++) {
        Serial.write(framePayload[index]);
    }

    Serial.write(
        calculateChecksum(
            PROTOCOL_VERSION,
            frameSequence,
            frameCommand,
            framePayload,
            framePayloadLength
        )
    );
}

void handleDigitalWrite() {
    if (payloadLength != 2) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];
    const uint8_t value = payload[1];

    if (
        pin < 2 ||
        pin > 19 ||
        value > 1
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(pin, OUTPUT);

    digitalWrite(
        pin,
        value == 0 ? LOW : HIGH
    );

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleDigitalRead() {
    if (payloadLength != 1) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];

    if (
        pin < 2 ||
        pin > 19
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(pin, INPUT);

    const uint8_t value =
        digitalRead(pin) == HIGH ? 1 : 0;

    const uint8_t responsePayload[] = {
        pin,
        value
    };

    sendFrame(
        sequence,
        RESPONSE_DIGITAL_READ,
        responsePayload,
        sizeof(responsePayload)
    );
}

void handleAnalogRead() {
    if (payloadLength != 1) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];

    if (
        pin < 14 ||
        pin > 19
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(pin, INPUT);
    digitalWrite(pin, LOW);

    const uint16_t value =
        static_cast<uint16_t>(analogRead(pin));

    const uint8_t responsePayload[] = {
        pin,
        static_cast<uint8_t>((value >> 8) & 0xFF),
        static_cast<uint8_t>(value & 0xFF)
    };

    sendFrame(
        sequence,
        RESPONSE_ANALOG_READ,
        responsePayload,
        sizeof(responsePayload)
    );
}

bool isPwmPin(uint8_t pin) {
    return (
        pin == 3 ||
        pin == 5 ||
        pin == 6 ||
        pin == 9 ||
        pin == 10 ||
        pin == 11
    );
}

void handlePwmWrite() {
    if (payloadLength != 2) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];
    const uint8_t value = payload[1];

    if (!isPwmPin(pin)) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(pin, OUTPUT);

    analogWrite(
        pin,
        value
    );

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleFrame() {
    if (command == COMMAND_PING) {
        sendFrame(
            sequence,
            RESPONSE_PONG
        );
        return;
    }

    if (command == COMMAND_DIGITAL_WRITE) {
        handleDigitalWrite();
        return;
    }

    if (command == COMMAND_DIGITAL_READ) {
        handleDigitalRead();
        return;
    }

    if (command == COMMAND_ANALOG_READ) {
        handleAnalogRead();
        return;
    }

    if (command == COMMAND_PWM_WRITE) {
        handlePwmWrite();
    }
}

void processByte(uint8_t value) {
    switch (parserState) {
        case ParserState::WaitStart1:
            if (value == START_BYTE_1) {
                parserState = ParserState::WaitStart2;
            }
            break;

        case ParserState::WaitStart2:
            if (value == START_BYTE_2) {
                parserState = ParserState::ReadVersion;
            } else if (value != START_BYTE_1) {
                parserState = ParserState::WaitStart1;
            }
            break;

        case ParserState::ReadVersion:
            version = value;
            checksum = value;
            parserState = ParserState::ReadSequence;
            break;

        case ParserState::ReadSequence:
            sequence = value;
            checksum ^= value;
            parserState = ParserState::ReadCommand;
            break;

        case ParserState::ReadCommand:
            command = value;
            checksum ^= value;
            parserState = ParserState::ReadLength;
            break;

        case ParserState::ReadLength:
            payloadLength = value;
            checksum ^= value;

            if (payloadLength > MAX_PAYLOAD_LENGTH) {
                resetParser();
                break;
            }

            payloadIndex = 0;

            parserState =
                payloadLength == 0
                    ? ParserState::ReadChecksum
                    : ParserState::ReadPayload;

            break;

        case ParserState::ReadPayload:
            payload[payloadIndex++] = value;
            checksum ^= value;

            if (payloadIndex >= payloadLength) {
                parserState = ParserState::ReadChecksum;
            }
            break;

        case ParserState::ReadChecksum:
            if (
                version == PROTOCOL_VERSION &&
                value == checksum
            ) {
                handleFrame();
            }

            resetParser();
            break;
    }
}

} // namespace EasyBloxStage

void setup() {
    Serial.begin(115200);
}

void loop() {
    while (Serial.available() > 0) {
        EasyBloxStage::processByte(
            static_cast<uint8_t>(Serial.read())
        );
    }
}
