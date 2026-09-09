#pragma once

#include "EasyBloxBluetooth.h"

void easybloxDelay(unsigned long milliseconds);

float easybloxControllerBindingNumber(
    uint8_t bindingIndex
);

bool easybloxControllerBindingBoolean(
    uint8_t bindingIndex
);

#define loop easybloxUserLoop
#define delay easybloxDelay
