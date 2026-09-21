#pragma once

#include <Arduino.h>

enum class EasyBloxGamepadButton : uint8_t {
    DpadUp = 0,
    DpadDown,
    DpadLeft,
    DpadRight,
    ActionTop,
    ActionLeft,
    ActionBottom,
    ActionRight
};

enum class EasyBloxControlsJoystickAxis : uint8_t {
    Horizontal = 0,
    Vertical
};

enum class EasyBloxRemoteMotor : uint8_t {
    Motor1 = 0,
    Motor2
};

enum class EasyBloxRemoteServo : uint8_t {
    Servo1 = 0,
    Servo2,
    Servo3,
    Servo4
};

class EasyBloxBluetooth {
public:
    void begin();

    void sendText(
        const String &value
    );

    void sendNumber(
        double value
    );

    void setIndicator(
        bool value
    );

    void waitText();
    void waitNumber();

    const String &receivedText() const;
    float receivedNumber() const;

    bool gamepadButtonPressed(
        EasyBloxGamepadButton button
    );

    float controlsJoystickPosition(
        EasyBloxControlsJoystickAxis axis
    );

    float controlsSliderValue();

    bool controlsButtonPressed();

    bool controlsSwitchOn();

    void bindMotor(
        EasyBloxRemoteMotor motor,
        uint8_t in1Pin,
        uint8_t in2Pin,
        uint8_t pwmPin
    );

    void bindServo(
        EasyBloxRemoteServo servo,
        uint8_t pin
    );
};

extern EasyBloxBluetooth EasyBloxBT;
