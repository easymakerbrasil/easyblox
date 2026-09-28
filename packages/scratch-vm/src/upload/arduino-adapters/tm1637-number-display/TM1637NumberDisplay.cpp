#include "TM1637NumberDisplay.h"

#include <math.h>

TM1637NumberDisplay::TM1637NumberDisplay(
    uint8_t clkPin,
    uint8_t dioPin
) :
    TM1637(clkPin, dioPin)
{
}

void TM1637NumberDisplay::showNumber(
    float value,
    float lengthValue,
    float positionValue,
    bool point,
    bool leadingZeros
)
{
    if (!isfinite(value)) {
        value = 0;
    }

    if (value < 0) {
        value = 0;
    }

    int requestedLength =
        (int)round(lengthValue);

    int position =
        (int)round(positionValue);

    if (requestedLength < 1) {
        requestedLength = 1;
    } else if (requestedLength > 4) {
        requestedLength = 4;
    }

    if (position < 1) {
        position = 1;
    } else if (position > 4) {
        position = 4;
    }

    const uint8_t start =
        position - 1;

    const uint8_t available =
        4 - start;

    const uint8_t length =
        requestedLength < available ?
            requestedLength :
            available;

    const uint8_t digitSegments[10] = {
        0x3F,
        0x06,
        0x5B,
        0x4F,
        0x66,
        0x6D,
        0x7D,
        0x07,
        0x7F,
        0x6F
    };

    uint8_t segments[4] = {
        0,
        0,
        0,
        0
    };

    uint8_t digits[4] = {
        0,
        0,
        0,
        0
    };

    long remaining =
        (long)value;

    if (remaining == 0) {
        if (leadingZeros) {
            for (
                uint8_t index = 0;
                index < length;
                ++index
            ) {
                digits[index] =
                    digitSegments[0];
            }
        } else {
            digits[length - 1] =
                digitSegments[0];
        }
    } else {
        for (
            int8_t index = length - 1;
            index >= 0;
            --index
        ) {
            if (remaining > 0) {
                const uint8_t digit =
                    remaining % 10;

                digits[index] =
                    digitSegments[digit];

                remaining /= 10;
            } else if (leadingZeros) {
                digits[index] =
                    digitSegments[0];
            }
        }
    }

    for (
        uint8_t index = 0;
        index < length;
        ++index
    ) {
        segments[start + index] =
            digits[index];
    }

    if (point) {
        segments[1] |= 0x80;
    }

    writeData(
        0x00,
        segments,
        4
    );
}
