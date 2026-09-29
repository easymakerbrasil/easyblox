#ifndef LCD16X2_H_
#define LCD16X2_H_

#include <Arduino.h>

class LCD16x2
{
public:
    LCD16x2();

    void begin();

    void write(
        const char *text,
        float rowValue,
        float columnValue
    );

    void clear();

    void setMode(
        uint8_t mode
    );

private:
    uint8_t _address;
    uint8_t _displayControl;
    uint8_t _entryMode;

    uint8_t detectAddress();

    void expanderWrite(
        uint8_t value
    );

    void pulseEnable(
        uint8_t value
    );

    void write4Bits(
        uint8_t value
    );

    void send(
        uint8_t value,
        uint8_t mode
    );

    void command(
        uint8_t value
    );
};

#endif
