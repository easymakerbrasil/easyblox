#ifndef MAX7219_MATRIX_H_
#define MAX7219_MATRIX_H_

#include "LedControl.h"

class MAX7219Matrix : public LedControl
{
public:
    MAX7219Matrix(
        uint8_t dataPin,
        uint8_t clockPin,
        uint8_t chipSelectPin
    );

    void begin();

    void drawBitmap(
        const char *bitmap
    );

    void setBrightness(
        float brightnessPercent
    );

    void clear();

private:
    static uint8_t hexDigitValue(
        char character
    );
};

#endif
