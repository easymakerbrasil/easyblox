#pragma once

#include <Arduino.h>

extern String easybloxBtReceivedText;
extern float easybloxBtReceivedNumber;

void easybloxBtBegin();
void easybloxBtSendText(
    const String &channel,
    const String &value
);
void easybloxBtSendNumber(
    const String &channel,
    double value
);
void easybloxBtWaitText(
    const String &channel
);
void easybloxBtWaitNumber(
    const String &channel
);
