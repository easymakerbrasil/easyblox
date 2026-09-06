#pragma once

#include "EasyBloxBluetooth.h"

void easybloxDelay(unsigned long milliseconds);

#define loop easybloxUserLoop
#define delay easybloxDelay
