#pragma once

#include <Arduino.h>

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
};

extern EasyBloxBluetooth EasyBloxBT;
