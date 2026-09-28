#ifndef TM1637_NUMBER_DISPLAY_H_
#define TM1637_NUMBER_DISPLAY_H_

#include "ErriezTM1637.h"

class TM1637NumberDisplay : public TM1637
{
public:
    TM1637NumberDisplay(
        uint8_t clkPin,
        uint8_t dioPin
    );

    void showNumber(
        float value,
        float lengthValue,
        float positionValue,
        bool point,
        bool leadingZeros
    );
};

#endif
