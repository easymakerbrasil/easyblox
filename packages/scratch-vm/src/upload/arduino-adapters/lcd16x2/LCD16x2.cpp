#include "LCD16x2.h"

#include <Wire.h>
#include <math.h>

LCD16x2::LCD16x2() :
    _address(0),
    _displayControl(0x04),
    _entryMode(0x02)
{
}

void LCD16x2::begin()
{
    Wire.begin();

    _address =
        detectAddress();

    if (_address == 0) {
        return;
    }

    delay(50);

    write4Bits(0x30);
    delayMicroseconds(4500);

    write4Bits(0x30);
    delayMicroseconds(4500);

    write4Bits(0x30);
    delayMicroseconds(150);

    write4Bits(0x20);

    command(0x28);
    command(0x08);
    command(0x01);

    delayMicroseconds(2000);

    command(0x06);
    command(0x0C);
}

void LCD16x2::write(
    const char *text,
    float rowValue,
    float columnValue
)
{
    if (
        _address == 0 ||
        !text
    ) {
        return;
    }

    int row =
        (int)round(rowValue);

    int column =
        (int)round(columnValue);

    if (row < 1) {
        row = 1;
    } else if (row > 2) {
        row = 2;
    }

    if (column < 1) {
        column = 1;
    } else if (column > 16) {
        column = 16;
    }

    const uint8_t rowOffsets[2] = {
        0x00,
        0x40
    };

    const uint8_t address =
        rowOffsets[row - 1] +
        (column - 1);

    command(
        0x80 | address
    );

    for (
        uint16_t index = 0;
        text[index] != '\0';
        ++index
    ) {
        send(
            (uint8_t)text[index],
            0x01
        );
    }
}

void LCD16x2::clear()
{
    command(0x01);
    delayMicroseconds(2000);
}

void LCD16x2::setMode(
    uint8_t mode
)
{
    switch (mode) {
    case 0:
        _displayControl |= 0x01;
        command(
            0x08 |
            _displayControl
        );
        break;

    case 1:
        _displayControl &= ~0x01;
        command(
            0x08 |
            _displayControl
        );
        break;

    case 2:
        _displayControl |= 0x02;
        command(
            0x08 |
            _displayControl
        );
        break;

    case 3:
        _displayControl &= ~0x02;
        command(
            0x08 |
            _displayControl
        );
        break;

    case 4:
        _displayControl |= 0x04;
        command(
            0x08 |
            _displayControl
        );
        break;

    case 5:
        _displayControl &= ~0x04;
        command(
            0x08 |
            _displayControl
        );
        break;

    case 6:
        _entryMode |= 0x01;
        command(
            0x04 |
            _entryMode
        );
        break;

    case 7:
        _entryMode &= ~0x01;
        command(
            0x04 |
            _entryMode
        );
        break;

    case 8:
        command(0x18);
        break;

    case 9:
        command(0x1C);
        break;

    default:
        break;
    }
}

uint8_t LCD16x2::detectAddress()
{
    const uint8_t addresses[] = {
        0x27,
        0x3F
    };

    for (
        uint8_t index = 0;
        index < 2;
        ++index
    ) {
        Wire.beginTransmission(
            addresses[index]
        );

        if (
            Wire.endTransmission() == 0
        ) {
            return addresses[index];
        }
    }

    return 0;
}

void LCD16x2::expanderWrite(
    uint8_t value
)
{
    if (_address == 0) {
        return;
    }

    Wire.beginTransmission(
        _address
    );

    Wire.write(
        value | 0x08
    );

    Wire.endTransmission();
}

void LCD16x2::pulseEnable(
    uint8_t value
)
{
    expanderWrite(
        value | 0x04
    );

    delayMicroseconds(1);

    expanderWrite(
        value & ~0x04
    );

    delayMicroseconds(50);
}

void LCD16x2::write4Bits(
    uint8_t value
)
{
    expanderWrite(value);
    pulseEnable(value);
}

void LCD16x2::send(
    uint8_t value,
    uint8_t mode
)
{
    write4Bits(
        (value & 0xF0) |
        mode
    );

    write4Bits(
        (value << 4) |
        mode
    );
}

void LCD16x2::command(
    uint8_t value
)
{
    send(
        value,
        0x00
    );
}
