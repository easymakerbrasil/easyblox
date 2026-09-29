#include "MAX7219Matrix.h"

#include <math.h>

MAX7219Matrix::MAX7219Matrix(
    uint8_t dataPin,
    uint8_t clockPin,
    uint8_t chipSelectPin
) :
    LedControl(
        dataPin,
        clockPin,
        chipSelectPin,
        1
    )
{
}

void MAX7219Matrix::begin()
{
    shutdown(
        0,
        false
    );

    setScanLimit(
        0,
        7
    );

    setIntensity(
        0,
        8
    );

    clearDisplay(0);
}

void MAX7219Matrix::drawBitmap(
    const char *bitmap
)
{
    if (!bitmap) {
        clear();
        return;
    }

    for (
        uint8_t row = 0;
        row < 8;
        ++row
    ) {
        const uint8_t high =
            hexDigitValue(
                bitmap[row * 2]
            );

        const uint8_t low =
            hexDigitValue(
                bitmap[(row * 2) + 1]
            );

        const uint8_t value =
            (high << 4) | low;

        setRow(
            0,
            row,
            value
        );
    }
}

void MAX7219Matrix::setBrightness(
    float brightnessPercent
)
{
    int brightness =
        (int)round(
            brightnessPercent
        );

    if (brightness < 0) {
        brightness = 0;
    } else if (brightness > 100) {
        brightness = 100;
    }

    const uint8_t intensity =
        (uint8_t)(
            (brightness * 15L + 50L) /
            100L
        );

    setIntensity(
        0,
        intensity
    );
}

void MAX7219Matrix::clear()
{
    clearDisplay(0);
}

uint8_t MAX7219Matrix::hexDigitValue(
    char character
)
{
    if (
        character >= '0' &&
        character <= '9'
    ) {
        return character - '0';
    }

    if (
        character >= 'A' &&
        character <= 'F'
    ) {
        return character - 'A' + 10;
    }

    if (
        character >= 'a' &&
        character <= 'f'
    ) {
        return character - 'a' + 10;
    }

    return 0;
}
