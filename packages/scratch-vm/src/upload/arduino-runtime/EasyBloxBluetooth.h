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

class EasyBloxBluetooth {
public:
    void begin();

    void sendText(
        const String &value
    );

    void sendNumber(
        double value
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
};

extern EasyBloxBluetooth EasyBloxBT;
