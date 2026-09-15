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
};

extern EasyBloxBluetooth EasyBloxBT;
