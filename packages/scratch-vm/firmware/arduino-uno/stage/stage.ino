#include <Arduino.h>
#include <Servo.h>
#include <Wire.h>

namespace EasyBloxStage {

constexpr uint8_t START_BYTE_1 = 0xFF;
constexpr uint8_t START_BYTE_2 = 0x55;
constexpr uint8_t PROTOCOL_VERSION = 0x01;
constexpr uint8_t STAGE_FIRMWARE_COMPATIBILITY_VERSION = 0x01;

constexpr uint8_t MAX_PAYLOAD_LENGTH = 32;

constexpr uint8_t COMMAND_PING = 0x01;
constexpr uint8_t COMMAND_DIGITAL_WRITE = 0x10;
constexpr uint8_t COMMAND_DIGITAL_READ = 0x11;
constexpr uint8_t COMMAND_ANALOG_READ = 0x12;
constexpr uint8_t COMMAND_PWM_WRITE = 0x13;
constexpr uint8_t COMMAND_TONE_START = 0x14;
constexpr uint8_t COMMAND_TONE_STOP = 0x15;
constexpr uint8_t COMMAND_SERVO_WRITE = 0x16;
constexpr uint8_t COMMAND_MOTOR_WRITE = 0x17;
constexpr uint8_t COMMAND_MOTOR_STOP = 0x18;
constexpr uint8_t COMMAND_RELAY_WRITE = 0x19;
constexpr uint8_t COMMAND_ULTRASONIC_READ = 0x1A;
constexpr uint8_t COMMAND_DHT_READ = 0x1B;
constexpr uint8_t COMMAND_LCD_INIT = 0x1C;
constexpr uint8_t COMMAND_LCD_WRITE = 0x1D;
constexpr uint8_t COMMAND_LCD_CLEAR = 0x1E;
constexpr uint8_t COMMAND_LCD_MODE = 0x1F;
constexpr uint8_t COMMAND_MATRIX_WRITE = 0x20;
constexpr uint8_t COMMAND_MATRIX_BRIGHTNESS = 0x21;
constexpr uint8_t COMMAND_TM1637_WRITE = 0x22;
constexpr uint8_t COMMAND_JOYSTICK_READ = 0x23;
constexpr uint8_t COMMAND_TIMER_READ = 0x24;
constexpr uint8_t COMMAND_TIMER_RESET = 0x25;

constexpr uint8_t RESPONSE_ACK = 0x80;
constexpr uint8_t RESPONSE_PONG = 0x81;
constexpr uint8_t RESPONSE_DIGITAL_READ = 0x91;
constexpr uint8_t RESPONSE_ANALOG_READ = 0x92;
constexpr uint8_t RESPONSE_ULTRASONIC_READ = 0x93;
constexpr uint8_t RESPONSE_DHT_READ = 0x94;
constexpr uint8_t RESPONSE_JOYSTICK_READ = 0x95;
constexpr uint8_t RESPONSE_TIMER_READ = 0x96;
constexpr uint8_t RESPONSE_ERROR = 0xFF;

constexpr uint8_t LCD_MODE_BLINK_ON = 0x00;
constexpr uint8_t LCD_MODE_BLINK_OFF = 0x01;
constexpr uint8_t LCD_MODE_CURSOR_ON = 0x02;
constexpr uint8_t LCD_MODE_CURSOR_OFF = 0x03;
constexpr uint8_t LCD_MODE_DISPLAY_ON = 0x04;
constexpr uint8_t LCD_MODE_DISPLAY_OFF = 0x05;
constexpr uint8_t LCD_MODE_AUTOSCROLL_ON = 0x06;
constexpr uint8_t LCD_MODE_AUTOSCROLL_OFF = 0x07;
constexpr uint8_t LCD_MODE_SCROLL_LEFT = 0x08;
constexpr uint8_t LCD_MODE_SCROLL_RIGHT = 0x09;

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
uint32_t timerResetAt = 0;

constexpr uint8_t NO_TONE_PIN = 0xFF;
uint8_t activeTonePin = NO_TONE_PIN;
uint32_t activeToneUntil = 0;

constexpr uint8_t NO_MATRIX_PIN = 0xFF;

constexpr uint8_t MAX7219_REGISTER_DECODE_MODE = 0x09;
constexpr uint8_t MAX7219_REGISTER_INTENSITY = 0x0A;
constexpr uint8_t MAX7219_REGISTER_SCAN_LIMIT = 0x0B;
constexpr uint8_t MAX7219_REGISTER_SHUTDOWN = 0x0C;
constexpr uint8_t MAX7219_REGISTER_DISPLAY_TEST = 0x0F;

constexpr uint8_t MAX7219_DEFAULT_INTENSITY = 0x0F;

constexpr uint8_t NO_TM1637_PIN = 0xFF;

constexpr uint8_t TM1637_DATA_COMMAND = 0x40;
constexpr uint8_t TM1637_ADDRESS_COMMAND = 0xC0;
constexpr uint8_t TM1637_DISPLAY_CONTROL = 0x8F;

constexpr unsigned int TM1637_BIT_DELAY_US = 5;

bool tm1637Initialized = false;
uint8_t tm1637ClkPin = NO_TM1637_PIN;
uint8_t tm1637DioPin = NO_TM1637_PIN;

bool matrixInitialized = false;
uint8_t matrixDinPin = NO_MATRIX_PIN;
uint8_t matrixCsPin = NO_MATRIX_PIN;
uint8_t matrixClkPin = NO_MATRIX_PIN;
uint8_t matrixIntensity = MAX7219_DEFAULT_INTENSITY;

constexpr uint8_t LCD_NO_ADDRESS = 0x00;
constexpr uint8_t LCD_ADDRESS_PRIMARY = 0x27;
constexpr uint8_t LCD_ADDRESS_SECONDARY = 0x3F;

constexpr uint8_t LCD_COLUMN_COUNT = 16;
constexpr uint8_t LCD_ROW_COUNT = 2;

constexpr uint8_t LCD_RS_MASK = 0x01;
constexpr uint8_t LCD_ENABLE_MASK = 0x04;
constexpr uint8_t LCD_BACKLIGHT_MASK = 0x08;

uint8_t lcdAddress = LCD_NO_ADDRESS;
bool lcdInitialized = false;

bool lcdDisplayEnabled = true;
bool lcdCursorEnabled = false;
bool lcdBlinkEnabled = false;
bool lcdAutoscrollEnabled = false;

bool isLcdI2cPin(uint8_t pin) {
    return (
        lcdInitialized &&
        (pin == 18 || pin == 19)
    );
}

bool isMatrixUsingLcdI2cPins() {
    return (
        matrixInitialized &&
        (
            matrixDinPin == 18 ||
            matrixDinPin == 19 ||
            matrixCsPin == 18 ||
            matrixCsPin == 19 ||
            matrixClkPin == 18 ||
            matrixClkPin == 19
        )
    );
}

bool isTm1637UsingLcdI2cPins() {
    return (
        tm1637Initialized &&
        (
            tm1637ClkPin == 18 ||
            tm1637ClkPin == 19 ||
            tm1637DioPin == 18 ||
            tm1637DioPin == 19
        )
    );
}

bool isMatrixUsingPin(uint8_t pin) {
    return (
        matrixInitialized &&
        (
            matrixDinPin == pin ||
            matrixCsPin == pin ||
            matrixClkPin == pin
        )
    );
}

bool isTm1637UsingPin(uint8_t pin) {
    return (
        tm1637Initialized &&
        (
            tm1637ClkPin == pin ||
            tm1637DioPin == pin
        )
    );
}

constexpr unsigned long DHT_CACHE_INTERVAL_MS = 2000UL;

constexpr uint8_t DHT_FIRST_PIN = 2;
constexpr uint8_t DHT_LAST_PIN = 13;
constexpr uint8_t DHT_PIN_COUNT =
    DHT_LAST_PIN - DHT_FIRST_PIN + 1;

struct DhtCacheEntry {
    uint8_t humidity;
    uint8_t temperature;
    unsigned long timestamp;
    bool valid;
};

DhtCacheEntry dhtCache[DHT_PIN_COUNT] = {};

constexpr uint8_t SERVO_PIN_COUNT = 6;

constexpr uint8_t SERVO_PINS[SERVO_PIN_COUNT] = {
    3,
    5,
    6,
    9,
    10,
    11
};

Servo servoSlots[SERVO_PIN_COUNT];

int8_t getServoSlotIndex(uint8_t pin) {
    for (uint8_t index = 0; index < SERVO_PIN_COUNT; index++) {
        if (SERVO_PINS[index] == pin) {
            return static_cast<int8_t>(index);
        }
    }

    return -1;
}

bool hasAttachedServo() {
    for (uint8_t index = 0; index < SERVO_PIN_COUNT; index++) {
        if (servoSlots[index].attached()) {
            return true;
        }
    }

    return false;
}

bool isServoAttachedOnPin(uint8_t pin) {
    const int8_t slotIndex =
        getServoSlotIndex(pin);

    return (
        slotIndex >= 0 &&
        servoSlots[slotIndex].attached()
    );
}

void writeMax7219Register(
    uint8_t dinPin,
    uint8_t csPin,
    uint8_t clkPin,
    uint8_t registerAddress,
    uint8_t value
) {
    digitalWrite(
        csPin,
        LOW
    );

    shiftOut(
        dinPin,
        clkPin,
        MSBFIRST,
        registerAddress
    );

    shiftOut(
        dinPin,
        clkPin,
        MSBFIRST,
        value
    );

    digitalWrite(
        csPin,
        HIGH
    );
}

void initializeMatrix(
    uint8_t dinPin,
    uint8_t csPin,
    uint8_t clkPin
) {
    pinMode(dinPin, OUTPUT);
    pinMode(csPin, OUTPUT);
    pinMode(clkPin, OUTPUT);

    digitalWrite(dinPin, LOW);
    digitalWrite(clkPin, LOW);
    digitalWrite(csPin, HIGH);

    writeMax7219Register(
        dinPin,
        csPin,
        clkPin,
        MAX7219_REGISTER_DISPLAY_TEST,
        0x00
    );

    writeMax7219Register(
        dinPin,
        csPin,
        clkPin,
        MAX7219_REGISTER_SHUTDOWN,
        0x00
    );

    writeMax7219Register(
        dinPin,
        csPin,
        clkPin,
        MAX7219_REGISTER_DECODE_MODE,
        0x00
    );

    writeMax7219Register(
        dinPin,
        csPin,
        clkPin,
        MAX7219_REGISTER_SCAN_LIMIT,
        0x07
    );

    writeMax7219Register(
        dinPin,
        csPin,
        clkPin,
        MAX7219_REGISTER_INTENSITY,
        matrixIntensity
    );

    for (uint8_t row = 1; row <= 8; row++) {
        writeMax7219Register(
            dinPin,
            csPin,
            clkPin,
            row,
            0x00
        );
    }

    writeMax7219Register(
        dinPin,
        csPin,
        clkPin,
        MAX7219_REGISTER_SHUTDOWN,
        0x01
    );

    matrixDinPin = dinPin;
    matrixCsPin = csPin;
    matrixClkPin = clkPin;
    matrixInitialized = true;
}

void tm1637Start(
    uint8_t clkPin,
    uint8_t dioPin
) {
    pinMode(clkPin, OUTPUT);
    pinMode(dioPin, OUTPUT);

    digitalWrite(clkPin, HIGH);
    digitalWrite(dioPin, HIGH);

    delayMicroseconds(TM1637_BIT_DELAY_US);

    digitalWrite(dioPin, LOW);

    delayMicroseconds(TM1637_BIT_DELAY_US);

    digitalWrite(clkPin, LOW);

    delayMicroseconds(TM1637_BIT_DELAY_US);
}

void tm1637Stop(
    uint8_t clkPin,
    uint8_t dioPin
) {
    pinMode(dioPin, OUTPUT);

    digitalWrite(clkPin, LOW);
    digitalWrite(dioPin, LOW);

    delayMicroseconds(TM1637_BIT_DELAY_US);

    digitalWrite(clkPin, HIGH);

    delayMicroseconds(TM1637_BIT_DELAY_US);

    digitalWrite(dioPin, HIGH);

    delayMicroseconds(TM1637_BIT_DELAY_US);
}

bool tm1637WriteByte(
    uint8_t clkPin,
    uint8_t dioPin,
    uint8_t value
) {
    pinMode(dioPin, OUTPUT);

    for (uint8_t bit = 0; bit < 8; bit++) {
        digitalWrite(clkPin, LOW);

        delayMicroseconds(TM1637_BIT_DELAY_US);

        digitalWrite(
            dioPin,
            (value & 0x01) ? HIGH : LOW
        );

        delayMicroseconds(TM1637_BIT_DELAY_US);

        digitalWrite(clkPin, HIGH);

        delayMicroseconds(TM1637_BIT_DELAY_US);

        value >>= 1;
    }

    digitalWrite(clkPin, LOW);

    pinMode(dioPin, INPUT_PULLUP);

    delayMicroseconds(TM1637_BIT_DELAY_US);

    digitalWrite(clkPin, HIGH);

    delayMicroseconds(TM1637_BIT_DELAY_US);

    const bool acknowledged =
        digitalRead(dioPin) == LOW;

    digitalWrite(clkPin, LOW);

    delayMicroseconds(TM1637_BIT_DELAY_US);

    pinMode(dioPin, OUTPUT);
    digitalWrite(dioPin, HIGH);

    return acknowledged;
}

bool tm1637WriteCommand(
    uint8_t clkPin,
    uint8_t dioPin,
    uint8_t value
) {
    tm1637Start(
        clkPin,
        dioPin
    );

    const bool acknowledged =
        tm1637WriteByte(
            clkPin,
            dioPin,
            value
        );

    tm1637Stop(
        clkPin,
        dioPin
    );

    return acknowledged;
}

bool writeTm1637Display(
    uint8_t clkPin,
    uint8_t dioPin,
    const uint8_t *segments
) {
    if (
        !tm1637WriteCommand(
            clkPin,
            dioPin,
            TM1637_DATA_COMMAND
        )
    ) {
        return false;
    }

    tm1637Start(
        clkPin,
        dioPin
    );

    if (
        !tm1637WriteByte(
            clkPin,
            dioPin,
            TM1637_ADDRESS_COMMAND
        )
    ) {
        tm1637Stop(
            clkPin,
            dioPin
        );

        return false;
    }

    for (uint8_t digit = 0; digit < 4; digit++) {
        if (
            !tm1637WriteByte(
                clkPin,
                dioPin,
                segments[digit]
            )
        ) {
            tm1637Stop(
                clkPin,
                dioPin
            );

            return false;
        }
    }

    tm1637Stop(
        clkPin,
        dioPin
    );

    if (
        !tm1637WriteCommand(
            clkPin,
            dioPin,
            TM1637_DISPLAY_CONTROL
        )
    ) {
        return false;
    }

    tm1637ClkPin = clkPin;
    tm1637DioPin = dioPin;
    tm1637Initialized = true;

    return true;
}

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
        value > 1 ||
        isLcdI2cPin(pin) ||
        isServoAttachedOnPin(pin)
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
        pin > 19 ||
        isLcdI2cPin(pin) ||
        isServoAttachedOnPin(pin)
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
        pin > 19 ||
        isLcdI2cPin(pin)
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

void handleJoystickRead() {
    if (payloadLength != 3) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t xPin = payload[0];
    const uint8_t yPin = payload[1];
    const uint8_t clickPin = payload[2];

    if (
        xPin < 14 ||
        xPin > 19 ||
        yPin < 14 ||
        yPin > 19 ||
        clickPin < 2 ||
        clickPin > 13 ||
        xPin == yPin ||
        isLcdI2cPin(xPin) ||
        isLcdI2cPin(yPin) ||
        isMatrixUsingPin(xPin) ||
        isMatrixUsingPin(yPin) ||
        isMatrixUsingPin(clickPin) ||
        isTm1637UsingPin(xPin) ||
        isTm1637UsingPin(yPin) ||
        isTm1637UsingPin(clickPin) ||
        isServoAttachedOnPin(clickPin) ||
        activeTonePin == clickPin
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(xPin, INPUT);
    digitalWrite(xPin, LOW);

    pinMode(yPin, INPUT);
    digitalWrite(yPin, LOW);

    pinMode(clickPin, INPUT_PULLUP);

    const uint16_t xValue =
        static_cast<uint16_t>(analogRead(xPin));

    const uint16_t yValue =
        static_cast<uint16_t>(analogRead(yPin));

    const uint8_t clicked =
        digitalRead(clickPin) == LOW ? 1 : 0;

    const uint8_t responsePayload[] = {
        xPin,
        yPin,
        clickPin,
        static_cast<uint8_t>((xValue >> 8) & 0xFF),
        static_cast<uint8_t>(xValue & 0xFF),
        static_cast<uint8_t>((yValue >> 8) & 0xFF),
        static_cast<uint8_t>(yValue & 0xFF),
        clicked
    };

    sendFrame(
        sequence,
        RESPONSE_JOYSTICK_READ,
        responsePayload,
        sizeof(responsePayload)
    );
}

void handleTimerRead() {
    if (payloadLength != 0) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint32_t elapsed =
        millis() - timerResetAt;

    const uint8_t responsePayload[] = {
        static_cast<uint8_t>(
            (elapsed >> 24) & 0xFF
        ),
        static_cast<uint8_t>(
            (elapsed >> 16) & 0xFF
        ),
        static_cast<uint8_t>(
            (elapsed >> 8) & 0xFF
        ),
        static_cast<uint8_t>(
            elapsed & 0xFF
        )
    };

    sendFrame(
        sequence,
        RESPONSE_TIMER_READ,
        responsePayload,
        sizeof(responsePayload)
    );
}

void handleTimerReset() {
    if (payloadLength != 0) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    timerResetAt = millis();

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

uint16_t measureDhtPulse(
    volatile uint8_t *inputRegister,
    uint8_t bitMask,
    bool level
) {
    const uint8_t expectedState =
        level ? bitMask : 0;

    const uint16_t maxCycles =
        static_cast<uint16_t>(
            microsecondsToClockCycles(1000)
        );

    uint16_t cycles = 0;

    while (
        (*inputRegister & bitMask) ==
        expectedState
    ) {
        cycles++;

        if (cycles >= maxCycles) {
            return 0;
        }
    }

    return cycles;
}

bool readDht11(
    uint8_t pin,
    uint8_t &humidity,
    uint8_t &temperature
) {
    uint8_t data[5] = {
        0,
        0,
        0,
        0,
        0
    };

    const uint8_t port =
        digitalPinToPort(pin);

    const uint8_t bitMask =
        digitalPinToBitMask(pin);

    if (port == NOT_A_PIN) {
        return false;
    }

    volatile uint8_t *inputRegister =
        portInputRegister(port);

    // Leave the bus idle before starting communication.
    pinMode(
        pin,
        INPUT_PULLUP
    );

    delay(1);

    // DHT11 start signal: LOW for at least 18 ms.
    pinMode(
        pin,
        OUTPUT
    );

    digitalWrite(
        pin,
        LOW
    );

    delay(20);

    // Release the bus and allow the DHT11 to take control.
    pinMode(
        pin,
        INPUT_PULLUP
    );

    delayMicroseconds(55);

    uint16_t lowCycles[40];
    uint16_t highCycles[40];

    bool timingValid = true;

    noInterrupts();

    // DHT11 response: ~80 us LOW followed by ~80 us HIGH.
    if (
        measureDhtPulse(
            inputRegister,
            bitMask,
            LOW
        ) == 0
    ) {
        timingValid = false;
    }

    if (
        timingValid &&
        measureDhtPulse(
            inputRegister,
            bitMask,
            HIGH
        ) == 0
    ) {
        timingValid = false;
    }

    // Read 40 data bits.
    if (timingValid) {
        for (
            uint8_t bitIndex = 0;
            bitIndex < 40;
            bitIndex++
        ) {
            lowCycles[bitIndex] =
                measureDhtPulse(
                    inputRegister,
                    bitMask,
                    LOW
                );

            highCycles[bitIndex] =
                measureDhtPulse(
                    inputRegister,
                    bitMask,
                    HIGH
                );

            if (
                lowCycles[bitIndex] == 0 ||
                highCycles[bitIndex] == 0
            ) {
                timingValid = false;
                break;
            }
        }
    }

    interrupts();

    if (!timingValid) {
        return false;
    }

    // A logical 1 has a HIGH period longer than the
    // approximately 50 us LOW period preceding it.
    for (
        uint8_t bitIndex = 0;
        bitIndex < 40;
        bitIndex++
    ) {
        data[bitIndex / 8] <<= 1;

        if (
            highCycles[bitIndex] >
            lowCycles[bitIndex]
        ) {
            data[bitIndex / 8] |= 1;
        }
    }

    const uint8_t expectedChecksum =
        static_cast<uint8_t>(
            data[0] +
            data[1] +
            data[2] +
            data[3]
        );

    if (expectedChecksum != data[4]) {
        return false;
    }

    humidity = data[0];
    temperature = data[2];

    return true;
}

void handleDhtRead() {
    if (payloadLength != 2) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];
    const uint8_t type = payload[1];

    if (
        pin < DHT_FIRST_PIN ||
        pin > DHT_LAST_PIN ||
        type > 1 ||
        isServoAttachedOnPin(pin) ||
        activeTonePin == pin
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    uint8_t humidity = 0;
    uint8_t temperature = 0;

    DhtCacheEntry &cache =
    dhtCache[pin - DHT_FIRST_PIN];

    if (
        cache.valid &&
        millis() - cache.timestamp < DHT_CACHE_INTERVAL_MS
    ) {
        humidity = cache.humidity;
        temperature = cache.temperature;
    } else {
        if (!readDht11(pin, humidity, temperature)) {
            cache.valid = false;

            sendFrame(
                sequence,
                RESPONSE_ERROR
            );
            return;
        }

        cache.humidity = humidity;
        cache.temperature = temperature;
        cache.timestamp = millis();
        cache.valid = true;
    }

    const uint16_t temperatureValue =
        static_cast<uint16_t>(temperature) * 100;

    const uint16_t humidityValue =
        static_cast<uint16_t>(humidity) * 100;

    const uint8_t responsePayload[] = {
        pin,
        static_cast<uint8_t>((temperatureValue >> 8) & 0xFF),
        static_cast<uint8_t>(temperatureValue & 0xFF),
        static_cast<uint8_t>((humidityValue >> 8) & 0xFF),
        static_cast<uint8_t>(humidityValue & 0xFF)
    };

    sendFrame(
        sequence,
        RESPONSE_DHT_READ,
        responsePayload,
        sizeof(responsePayload)
    );
}

void handleUltrasonicRead() {
    if (payloadLength != 2) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t trigPin = payload[0];
    const uint8_t echoPin = payload[1];

    if (
        trigPin < 2 ||
        trigPin > 19 ||
        echoPin < 2 ||
        echoPin > 19 ||
        trigPin == echoPin ||
        isLcdI2cPin(trigPin) ||
        isLcdI2cPin(echoPin) ||
        isServoAttachedOnPin(trigPin) ||
        isServoAttachedOnPin(echoPin) ||
        activeTonePin == trigPin ||
        activeTonePin == echoPin
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);

    digitalWrite(
        trigPin,
        LOW
    );

    delayMicroseconds(2);

    digitalWrite(
        trigPin,
        HIGH
    );

    delayMicroseconds(10);

    digitalWrite(
        trigPin,
        LOW
    );

    const unsigned long duration =
        pulseIn(
            echoPin,
            HIGH,
            30000UL
        );

    const uint16_t distanceMm =
        duration == 0 ?
        0 :
        static_cast<uint16_t>(
            (duration * 343UL) / 2000UL
        );

    const uint8_t responsePayload[] = {
        trigPin,
        echoPin,
        static_cast<uint8_t>((distanceMm >> 8) & 0xFF),
        static_cast<uint8_t>(distanceMm & 0xFF)
    };

    sendFrame(
        sequence,
        RESPONSE_ULTRASONIC_READ,
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

void refreshActiveToneState() {
    if (activeTonePin == NO_TONE_PIN) {
        return;
    }

    if (
        static_cast<int32_t>(
            millis() - activeToneUntil
        ) >= 0
    ) {
        activeTonePin = NO_TONE_PIN;
        activeToneUntil = 0;
    }
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

    if (
        !isPwmPin(pin) ||
        isServoAttachedOnPin(pin) ||
        (
            hasAttachedServo() &&
            (pin == 9 || pin == 10)
        ) ||
        (
            activeTonePin != NO_TONE_PIN &&
            (pin == 3 || pin == 11)
        )
    ) {
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

void handleToneStart() {
    if (payloadLength != 5) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];

    const uint16_t frequency =
        static_cast<uint16_t>(payload[1]) |
        (static_cast<uint16_t>(payload[2]) << 8);

    const uint16_t duration =
        static_cast<uint16_t>(payload[3]) |
        (static_cast<uint16_t>(payload[4]) << 8);

    if (
        pin < 2 ||
        pin > 19 ||
        frequency == 0 ||
        duration == 0 ||
        isServoAttachedOnPin(pin)
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    if (
        activeTonePin != NO_TONE_PIN &&
        activeTonePin != pin
    ) {
        noTone(activeTonePin);
    }

    tone(
        pin,
        frequency,
        duration
    );

    activeTonePin = pin;
    activeToneUntil =
        millis() +
        static_cast<uint32_t>(duration);

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleToneStop() {
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

    if (activeTonePin == pin) {
        noTone(pin);
        activeTonePin = NO_TONE_PIN;
        activeToneUntil = 0;
    }

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleServoWrite() {
    if (payloadLength != 2) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];
    const uint8_t angle = payload[1];

    const int8_t slotIndex =
        getServoSlotIndex(pin);

    if (
        slotIndex < 0 ||
        angle > 180 ||
        activeTonePin == pin
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    Servo &servo =
        servoSlots[slotIndex];

    if (!servo.attached()) {
        servo.attach(pin);
    }

    servo.write(angle);

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleMotorWrite() {
    if (payloadLength != 5) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t in1Pin = payload[0];
    const uint8_t in2Pin = payload[1];
    const uint8_t pwmPin = payload[2];
    const uint8_t direction = payload[3];
    const uint8_t speed = payload[4];

    if (
        in1Pin < 2 ||
        in1Pin > 19 ||
        in2Pin < 2 ||
        in2Pin > 19 ||
        !isPwmPin(pwmPin) ||
        in1Pin == in2Pin ||
        in1Pin == pwmPin ||
        in2Pin == pwmPin ||
        direction > 1 ||
        isLcdI2cPin(in1Pin) ||
        isLcdI2cPin(in2Pin) ||
        isServoAttachedOnPin(in1Pin) ||
        isServoAttachedOnPin(in2Pin) ||
        isServoAttachedOnPin(pwmPin) ||
        activeTonePin == in1Pin ||
        activeTonePin == in2Pin ||
        activeTonePin == pwmPin ||
        (
            activeTonePin != NO_TONE_PIN &&
            (pwmPin == 3 || pwmPin == 11)
        ) ||
        (
            hasAttachedServo() &&
            (pwmPin == 9 || pwmPin == 10)
        )
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(in1Pin, OUTPUT);
    pinMode(in2Pin, OUTPUT);
    pinMode(pwmPin, OUTPUT);

    analogWrite(
        pwmPin,
        0
    );

    if (speed == 0) {
        digitalWrite(in1Pin, LOW);
        digitalWrite(in2Pin, LOW);
    } else if (direction == 0) {
        digitalWrite(in1Pin, HIGH);
        digitalWrite(in2Pin, LOW);
    } else {
        digitalWrite(in1Pin, LOW);
        digitalWrite(in2Pin, HIGH);
    }

    analogWrite(
        pwmPin,
        speed
    );

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleMotorStop() {
    if (payloadLength != 4) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t in1Pin = payload[0];
    const uint8_t in2Pin = payload[1];
    const uint8_t pwmPin = payload[2];
    const uint8_t stopMode = payload[3];

    if (
        in1Pin < 2 ||
        in1Pin > 19 ||
        in2Pin < 2 ||
        in2Pin > 19 ||
        !isPwmPin(pwmPin) ||
        in1Pin == in2Pin ||
        in1Pin == pwmPin ||
        in2Pin == pwmPin ||
        stopMode > 1 ||
        isLcdI2cPin(in1Pin) ||
        isLcdI2cPin(in2Pin) ||
        isServoAttachedOnPin(in1Pin) ||
        isServoAttachedOnPin(in2Pin) ||
        isServoAttachedOnPin(pwmPin) ||
        activeTonePin == in1Pin ||
        activeTonePin == in2Pin ||
        activeTonePin == pwmPin ||
        (
            activeTonePin != NO_TONE_PIN &&
            (pwmPin == 3 || pwmPin == 11)
        ) ||
        (
            hasAttachedServo() &&
            (pwmPin == 9 || pwmPin == 10)
        )
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    pinMode(in1Pin, OUTPUT);
    pinMode(in2Pin, OUTPUT);
    pinMode(pwmPin, OUTPUT);

    analogWrite(
        pwmPin,
        0
    );

    digitalWrite(in1Pin, LOW);
    digitalWrite(in2Pin, LOW);

    if (stopMode == 1) {
        analogWrite(
            pwmPin,
            255
        );
    }

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

bool lcdProbeAddress(uint8_t address) {
    Wire.beginTransmission(address);

    return Wire.endTransmission() == 0;
}

bool lcdDetectAddress() {
    if (lcdProbeAddress(LCD_ADDRESS_PRIMARY)) {
        lcdAddress = LCD_ADDRESS_PRIMARY;
        return true;
    }

    if (lcdProbeAddress(LCD_ADDRESS_SECONDARY)) {
        lcdAddress = LCD_ADDRESS_SECONDARY;
        return true;
    }

    lcdAddress = LCD_NO_ADDRESS;

    return false;
}

bool lcdWriteExpander(uint8_t value) {
    if (lcdAddress == LCD_NO_ADDRESS) {
        return false;
    }

    Wire.beginTransmission(lcdAddress);

    Wire.write(
        static_cast<uint8_t>(
            value | LCD_BACKLIGHT_MASK
        )
    );

    return Wire.endTransmission() == 0;
}

bool lcdPulseEnable(uint8_t value) {
    if (
        !lcdWriteExpander(
            static_cast<uint8_t>(
                value | LCD_ENABLE_MASK
            )
        )
    ) {
        return false;
    }

    delayMicroseconds(1);

    if (
        !lcdWriteExpander(
            static_cast<uint8_t>(
                value & ~LCD_ENABLE_MASK
            )
        )
    ) {
        return false;
    }

    delayMicroseconds(50);

    return true;
}

bool lcdWrite4Bits(
    uint8_t nibble,
    uint8_t mode = 0
) {
    const uint8_t value =
        static_cast<uint8_t>(
            ((nibble & 0x0F) << 4) |
            mode
        );

    return lcdPulseEnable(value);
}

bool lcdSend(
    uint8_t value,
    uint8_t mode
) {
    if (
        !lcdWrite4Bits(
            static_cast<uint8_t>(
                value >> 4
            ),
            mode
        )
    ) {
        return false;
    }

    return lcdWrite4Bits(
        static_cast<uint8_t>(
            value & 0x0F
        ),
        mode
    );
}

bool lcdCommand(uint8_t value) {
    if (!lcdSend(value, 0)) {
        return false;
    }

    if (
        value == 0x01 ||
        value == 0x02
    ) {
        delayMicroseconds(2000);
    }

    return true;
}

bool lcdWriteCharacter(uint8_t value) {
    return lcdSend(
        value,
        LCD_RS_MASK
    );
}

bool lcdApplyDisplayControl() {
    uint8_t commandValue = 0x08;

    if (lcdDisplayEnabled) {
        commandValue |= 0x04;
    }

    if (lcdCursorEnabled) {
        commandValue |= 0x02;
    }

    if (lcdBlinkEnabled) {
        commandValue |= 0x01;
    }

    return lcdCommand(commandValue);
}

bool lcdApplyEntryMode() {
    uint8_t commandValue = 0x06;

    if (lcdAutoscrollEnabled) {
        commandValue |= 0x01;
    }

    return lcdCommand(commandValue);
}

bool lcdSetCursor(
    uint8_t row,
    uint8_t column
) {
    if (
        row >= LCD_ROW_COUNT ||
        column >= LCD_COLUMN_COUNT
    ) {
        return false;
    }

    const uint8_t rowOffset =
        row == 0 ? 0x00 : 0x40;

    return lcdCommand(
        static_cast<uint8_t>(
            0x80 |
            (rowOffset + column)
        )
    );
}

bool lcdInitializeController() {
    lcdDisplayEnabled = true;
    lcdCursorEnabled = false;
    lcdBlinkEnabled = false;
    lcdAutoscrollEnabled = false;

    delay(50);

    if (!lcdWriteExpander(0x00)) {
        return false;
    }

    delay(5);

    if (!lcdWrite4Bits(0x03)) {
        return false;
    }

    delayMicroseconds(4500);

    if (!lcdWrite4Bits(0x03)) {
        return false;
    }

    delayMicroseconds(4500);

    if (!lcdWrite4Bits(0x03)) {
        return false;
    }

    delayMicroseconds(150);

    if (!lcdWrite4Bits(0x02)) {
        return false;
    }

    // 4-bit mode, 2 lines, 5x8 font.
    if (!lcdCommand(0x28)) {
        return false;
    }

    // Display on, cursor off, blink off.
    if (!lcdApplyDisplayControl()) {
        return false;
    }

    // Clear display.
    if (!lcdCommand(0x01)) {
        return false;
    }

    // Left-to-right text, autoscroll off.
    if (!lcdApplyEntryMode()) {
        return false;
    }

    return true;
}

void handleMatrixWrite() {
    if (payloadLength != 11) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t dinPin = payload[0];
    const uint8_t csPin = payload[1];
    const uint8_t clkPin = payload[2];

    if (
        dinPin < 2 ||
        dinPin > 19 ||
        csPin < 2 ||
        csPin > 19 ||
        clkPin < 2 ||
        clkPin > 19 ||
        dinPin == csPin ||
        dinPin == clkPin ||
        csPin == clkPin ||
        isLcdI2cPin(dinPin) ||
        isLcdI2cPin(csPin) ||
        isLcdI2cPin(clkPin) ||
        isServoAttachedOnPin(dinPin) ||
        isServoAttachedOnPin(csPin) ||
        isServoAttachedOnPin(clkPin) ||
        activeTonePin == dinPin ||
        activeTonePin == csPin ||
        activeTonePin == clkPin
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    if (
        !matrixInitialized ||
        matrixDinPin != dinPin ||
        matrixCsPin != csPin ||
        matrixClkPin != clkPin
    ) {
        initializeMatrix(
            dinPin,
            csPin,
            clkPin
        );
    }

    for (uint8_t row = 0; row < 8; row++) {
        writeMax7219Register(
            dinPin,
            csPin,
            clkPin,
            static_cast<uint8_t>(row + 1),
            payload[row + 3]
        );
    }

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleMatrixBrightness() {
    if (payloadLength != 4) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t dinPin = payload[0];
    const uint8_t csPin = payload[1];
    const uint8_t clkPin = payload[2];
    const uint8_t brightness = payload[3];

    if (
        dinPin < 2 ||
        dinPin > 19 ||
        csPin < 2 ||
        csPin > 19 ||
        clkPin < 2 ||
        clkPin > 19 ||
        dinPin == csPin ||
        dinPin == clkPin ||
        csPin == clkPin ||
        brightness > 100 ||
        isLcdI2cPin(dinPin) ||
        isLcdI2cPin(csPin) ||
        isLcdI2cPin(clkPin) ||
        isServoAttachedOnPin(dinPin) ||
        isServoAttachedOnPin(csPin) ||
        isServoAttachedOnPin(clkPin) ||
        activeTonePin == dinPin ||
        activeTonePin == csPin ||
        activeTonePin == clkPin
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    matrixIntensity =
        static_cast<uint8_t>(
            (
                static_cast<uint16_t>(brightness) * 15U +
                50U
            ) / 100U
        );

    if (
        !matrixInitialized ||
        matrixDinPin != dinPin ||
        matrixCsPin != csPin ||
        matrixClkPin != clkPin
    ) {
        initializeMatrix(
            dinPin,
            csPin,
            clkPin
        );
    } else {
        writeMax7219Register(
            dinPin,
            csPin,
            clkPin,
            MAX7219_REGISTER_INTENSITY,
            matrixIntensity
        );
    }

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleTm1637Write() {
    if (payloadLength != 6) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t clkPin = payload[0];
    const uint8_t dioPin = payload[1];

    if (
        clkPin < 2 ||
        clkPin > 19 ||
        dioPin < 2 ||
        dioPin > 19 ||
        clkPin == dioPin ||
        isLcdI2cPin(clkPin) ||
        isLcdI2cPin(dioPin) ||
        isServoAttachedOnPin(clkPin) ||
        isServoAttachedOnPin(dioPin) ||
        activeTonePin == clkPin ||
        activeTonePin == dioPin
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    if (
        !writeTm1637Display(
            clkPin,
            dioPin,
            &payload[2]
        )
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleLcdInit() {
    if (payloadLength != 0) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    if (
        isMatrixUsingLcdI2cPins() ||
        isTm1637UsingLcdI2cPins()
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    lcdInitialized = false;
    lcdAddress = LCD_NO_ADDRESS;

    Wire.begin();

    if (!lcdDetectAddress()) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    if (!lcdInitializeController()) {
        lcdAddress = LCD_NO_ADDRESS;

        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    lcdInitialized = true;

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleLcdWrite() {
    if (
        !lcdInitialized ||
        payloadLength < 2
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t row = payload[0];
    const uint8_t column = payload[1];

    if (
        row >= LCD_ROW_COUNT ||
        column >= LCD_COLUMN_COUNT
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    if (!lcdSetCursor(row, column)) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t textLength =
        payloadLength - 2;

    const uint8_t availableColumns =
        LCD_COLUMN_COUNT - column;

    const uint8_t writeLength =
        textLength < availableColumns ?
            textLength :
            availableColumns;

    for (
        uint8_t index = 0;
        index < writeLength;
        index++
    ) {
        if (
            !lcdWriteCharacter(
                payload[index + 2]
            )
        ) {
            sendFrame(
                sequence,
                RESPONSE_ERROR
            );
            return;
        }
    }

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleLcdClear() {
    if (
        !lcdInitialized ||
        payloadLength != 0
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    if (!lcdCommand(0x01)) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleLcdMode() {
    if (
        !lcdInitialized ||
        payloadLength != 1
    ) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t mode = payload[0];
    bool success = false;

    switch (mode) {
        case LCD_MODE_BLINK_ON:
            lcdBlinkEnabled = true;
            success = lcdApplyDisplayControl();
            break;

        case LCD_MODE_BLINK_OFF:
            lcdBlinkEnabled = false;
            success = lcdApplyDisplayControl();
            break;

        case LCD_MODE_CURSOR_ON:
            lcdCursorEnabled = true;
            success = lcdApplyDisplayControl();
            break;

        case LCD_MODE_CURSOR_OFF:
            lcdCursorEnabled = false;
            success = lcdApplyDisplayControl();
            break;

        case LCD_MODE_DISPLAY_ON:
            lcdDisplayEnabled = true;
            success = lcdApplyDisplayControl();
            break;

        case LCD_MODE_DISPLAY_OFF:
            lcdDisplayEnabled = false;
            success = lcdApplyDisplayControl();
            break;

        case LCD_MODE_AUTOSCROLL_ON:
            lcdAutoscrollEnabled = true;
            success = lcdApplyEntryMode();
            break;

        case LCD_MODE_AUTOSCROLL_OFF:
            lcdAutoscrollEnabled = false;
            success = lcdApplyEntryMode();
            break;

        case LCD_MODE_SCROLL_LEFT:
            success = lcdCommand(0x18);
            break;

        case LCD_MODE_SCROLL_RIGHT:
            success = lcdCommand(0x1C);
            break;

        default:
            sendFrame(
                sequence,
                RESPONSE_ERROR
            );
            return;
    }

    sendFrame(
        sequence,
        success ?
            RESPONSE_ACK :
            RESPONSE_ERROR
    );
}

void handleRelayWrite() {
    if (payloadLength != 2) {
        sendFrame(
            sequence,
            RESPONSE_ERROR
        );
        return;
    }

    const uint8_t pin = payload[0];
    const uint8_t state = payload[1];

    if (
        pin < 2 ||
        pin > 19 ||
        state > 1 ||
        isLcdI2cPin(pin) ||
        isServoAttachedOnPin(pin) ||
        activeTonePin == pin
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
        state == 1 ? HIGH : LOW
    );

    sendFrame(
        sequence,
        RESPONSE_ACK
    );
}

void handleFrame() {
    if (command == COMMAND_PING) {
        const uint8_t pongPayload[] = {
            STAGE_FIRMWARE_COMPATIBILITY_VERSION
        };

        sendFrame(
            sequence,
            RESPONSE_PONG,
            pongPayload,
            sizeof(pongPayload)
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

    if (command == COMMAND_JOYSTICK_READ) {
        handleJoystickRead();
        return;
    }

    if (command == COMMAND_TIMER_READ) {
    handleTimerRead();
    return;
    }

    if (command == COMMAND_TIMER_RESET) {
        handleTimerReset();
        return;
    }

    if (command == COMMAND_PWM_WRITE) {
        handlePwmWrite();
        return;
    }

    if (command == COMMAND_TONE_START) {
        handleToneStart();
        return;
    }

    if (command == COMMAND_TONE_STOP) {
        handleToneStop();
        return;
    }

    if (command == COMMAND_SERVO_WRITE) {
        handleServoWrite();
        return;
    }

    if (command == COMMAND_MOTOR_WRITE) {
        handleMotorWrite();
        return;
    }

    if (command == COMMAND_MOTOR_STOP) {
        handleMotorStop();
        return;
    }

    if (command == COMMAND_RELAY_WRITE) {
        handleRelayWrite();
    }

    if (command == COMMAND_ULTRASONIC_READ) {
        handleUltrasonicRead();
    }

    if (command == COMMAND_DHT_READ) {
        handleDhtRead();
    }

    if (command == COMMAND_LCD_INIT) {
        handleLcdInit();
        return;
    }

    if (command == COMMAND_LCD_WRITE) {
        handleLcdWrite();
        return;
    }

    if (command == COMMAND_LCD_CLEAR) {
        handleLcdClear();
        return;
    }

    if (command == COMMAND_LCD_MODE) {
        handleLcdMode();
        return;
    }

    if (command == COMMAND_MATRIX_WRITE) {
        handleMatrixWrite();
        return;
    }

    if (command == COMMAND_MATRIX_BRIGHTNESS) {
        handleMatrixBrightness();
        return;
    }

    if (command == COMMAND_TM1637_WRITE) {
        handleTm1637Write();
        return;
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
        EasyBloxStage::refreshActiveToneState();

        EasyBloxStage::processByte(
            static_cast<uint8_t>(Serial.read())
        );
    }
}
