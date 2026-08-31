const InternalIdentifierAllocator =
    require('./internal-identifier-allocator');

const VALUE_TYPES =
    require('./upload-type-validator').VALUE_TYPES;

const ArduinoUnoBoardProfile =
    require('./board-profiles/arduino-uno-board-profile');

/**
 * Generate deterministic Arduino UNO C++ from EasyBlox semantic IR.
 */
class ArduinoUnoGenerator {
    /**
     * Generate a complete Arduino sketch.
     * @param {object} ir EasyBlox Upload IR.
     * @returns {string} Complete deterministic Arduino sketch.
     */
    generate (ir) {
        const setupStatements = Array.isArray(ir.setup) ? ir.setup : [];
        const loopStatements = Array.isArray(ir.loop) ? ir.loop : [];

        const globals =
            ir && ir.globals && typeof ir.globals === 'object' ?
                ir.globals :
                {};

        const variables = Array.isArray(globals.variables) ?
            globals.variables :
            [];

        const lists = Array.isArray(globals.lists) ?
            globals.lists :
            [];

        const procedures = Array.isArray(ir.procedures) ?
            ir.procedures :
            [];

        const reservedIdentifiers = this._initializeDataSymbols(
            variables,
            lists,
            procedures
        );

        const procedureStatements = [];

        for (const procedure of procedures) {
            procedureStatements.push(
                ...(
                    Array.isArray(procedure.body) ?
                        procedure.body :
                        []
                )
            );
        }

        /*
        * Hardware/dependency analysis must also see code inside My Blocks.
        */
        const analysisSetupStatements = setupStatements.concat(
            procedureStatements
        );

        const motorConfigurations = this._collectMotorConfigurations(
            analysisSetupStatements,
            loopStatements
        );

        const usesTimer = this._usesTimer(
            analysisSetupStatements,
            loopStatements
        );

        const usesUltrasonic = (
            this._irUsesExpressionType(
                analysisSetupStatements,
                'UltrasonicReadExpression'
            ) ||
            this._irUsesExpressionType(
                loopStatements,
                'UltrasonicReadExpression'
            )
        );

        const dhtPins = this._collectDhtPins([
            ...analysisSetupStatements,
            ...loopStatements
        ]);

        this._joystickConfiguration =
            this._collectJoystickConfiguration(
                setupStatements
            );

        const matrixInitialization =
            setupStatements.find(statement =>
                statement &&
                statement.type === 'MatrixInit'
            ) || null;

        const lcdInitialization =
            setupStatements.find(statement =>
                statement &&
                statement.type === 'LcdInit'
            ) || null;

        const tm1637Initialization =
            setupStatements.find(statement =>
                statement &&
                statement.type === 'Tm1637Init'
            ) || null;

        this._matrixInitialization =
            matrixInitialization;

        this._lcdInitialization =
            lcdInitialization;

        this._tm1637Initialization =
            tm1637Initialization;

        const usesUnicodeLetterOf = this._usesUnicodeLetterOf(
            analysisSetupStatements,
            loopStatements
        );

        const usesStringContainsIgnoreCase =
            this._usesStringContainsIgnoreCase(
                analysisSetupStatements,
                loopStatements
            );

        const usesScratchMod = this._programUsesExpressionOperator(
            analysisSetupStatements,
            loopStatements,
            'Mod'
        );

        const usesScratchRandom = this._programUsesExpressionOperator(
            analysisSetupStatements,
            loopStatements,
            'Random'
        );

        const usesUnicodeStringLength = (
            this._usesUnicodeStringLength(
                analysisSetupStatements,
                loopStatements
            ) ||
            usesUnicodeLetterOf ||
            lists.length > 0
        );

        const inputPins = this._collectInputPins(
            analysisSetupStatements,
            loopStatements
        );

        const outputPins = this._collectOutputPins(
            analysisSetupStatements,
            loopStatements
        );

        const servoPins = this._collectServoPins(
            analysisSetupStatements,
            loopStatements
        );

        /*
        * Internal temporary identifiers must never collide with normalized
        * identifiers defined by the student.
        */
        const identifiers = new InternalIdentifierAllocator(
            reservedIdentifiers
        );

        const lines = [];

        if (lcdInitialization) {
            lines.push(
                '#include <Wire.h>',
                '',
                'uint8_t easyblox_lcd_address = 0;',
                ''
            );
        }

        if (servoPins.length > 0) {
            lines.push(
                '#include <Servo.h>',
                ''
            );

            for (const pin of servoPins) {
                lines.push(`Servo servo${pin};`);
            }

            lines.push('');
        }

        for (const motor of motorConfigurations) {
            lines.push(
                `const int MOTOR${motor.motor}_IN1 = ${motor.in1Pin};`,
                `const int MOTOR${motor.motor}_IN2 = ${motor.in2Pin};`,
                `const int MOTOR${motor.motor}_PWM = ${motor.pwmPin};`
            );
        }

        if (motorConfigurations.length > 0) {
            lines.push('');
        }

        if (usesTimer) {
            lines.push(
                'unsigned long easyblox_timer_reset_at = 0;',
                ''
            );
        }

        if (usesUltrasonic) {
            lines.push(
                'float easybloxUltrasonicRead(uint8_t trigPin, uint8_t echoPin) {',
                '    pinMode(trigPin, OUTPUT);',
                '    pinMode(echoPin, INPUT);',
                '',
                '    digitalWrite(trigPin, LOW);',
                '    delayMicroseconds(2);',
                '    digitalWrite(trigPin, HIGH);',
                '    delayMicroseconds(10);',
                '    digitalWrite(trigPin, LOW);',
                '',
                '    const unsigned long duration = pulseIn(echoPin, HIGH, 30000UL);',
                '',
                '    if (duration == 0) {',
                '        return 0.0f;',
                '    }',
                '',
                '    const uint16_t distanceMm = static_cast<uint16_t>(',
                '        (duration * 343UL) / 2000UL',
                '    );',
                '',
                '    return static_cast<float>(distanceMm) / 10.0f;',
                '}',
                ''
            );
        }

        if (dhtPins.length > 0) {
            lines.push(
                'constexpr unsigned long EASYBLOX_DHT_CACHE_INTERVAL_MS = 2000UL;',
                'constexpr uint8_t EASYBLOX_DHT_FIRST_PIN = 2;',
                'constexpr uint8_t EASYBLOX_DHT_LAST_PIN = 13;',
                'constexpr uint8_t EASYBLOX_DHT_PIN_COUNT = ' +
                    'EASYBLOX_DHT_LAST_PIN - EASYBLOX_DHT_FIRST_PIN + 1;',
                '',
                'struct EasyBloxDhtCacheEntry {',
                '    uint8_t humidity;',
                '    uint8_t temperature;',
                '    unsigned long timestamp;',
                '    bool valid;',
                '};',
                '',
                'EasyBloxDhtCacheEntry easybloxDhtCache[' +
                    'EASYBLOX_DHT_PIN_COUNT] = {};',
                '',
                'uint16_t easybloxMeasureDhtPulse(',
                '    volatile uint8_t *inputRegister,',
                '    uint8_t bitMask,',
                '    bool level',
                ') {',
                '    const uint8_t expectedState =',
                '        level ? bitMask : 0;',
                '',
                '    const uint16_t maxCycles =',
                '        static_cast<uint16_t>(',
                '            microsecondsToClockCycles(1000)',
                '        );',
                '',
                '    uint16_t cycles = 0;',
                '',
                '    while (',
                '        (*inputRegister & bitMask) == expectedState',
                '    ) {',
                '        cycles++;',
                '',
                '        if (cycles >= maxCycles) {',
                '            return 0;',
                '        }',
                '    }',
                '',
                '    return cycles;',
                '}',
                '',
                'bool easybloxReadDht11Raw(',
                '    uint8_t pin,',
                '    uint8_t &humidity,',
                '    uint8_t &temperature',
                ') {',
                '    uint8_t data[5] = {0, 0, 0, 0, 0};',
                '',
                '    const uint8_t port = digitalPinToPort(pin);',
                '    const uint8_t bitMask = digitalPinToBitMask(pin);',
                '',
                '    if (port == NOT_A_PIN) {',
                '        return false;',
                '    }',
                '',
                '    volatile uint8_t *inputRegister =',
                '        portInputRegister(port);',
                '',
                '    pinMode(pin, INPUT_PULLUP);',
                '    delay(1);',
                '',
                '    pinMode(pin, OUTPUT);',
                '    digitalWrite(pin, LOW);',
                '    delay(20);',
                '',
                '    pinMode(pin, INPUT_PULLUP);',
                '    delayMicroseconds(55);',
                '',
                '    uint16_t lowCycles[40];',
                '    uint16_t highCycles[40];',
                '    bool timingValid = true;',
                '',
                '    noInterrupts();',
                '',
                '    if (',
                '        easybloxMeasureDhtPulse(',
                '            inputRegister,',
                '            bitMask,',
                '            LOW',
                '        ) == 0',
                '    ) {',
                '        timingValid = false;',
                '    }',
                '',
                '    if (',
                '        timingValid &&',
                '        easybloxMeasureDhtPulse(',
                '            inputRegister,',
                '            bitMask,',
                '            HIGH',
                '        ) == 0',
                '    ) {',
                '        timingValid = false;',
                '    }',
                '',
                '    if (timingValid) {',
                '        for (uint8_t bitIndex = 0; bitIndex < 40; bitIndex++) {',
                '            lowCycles[bitIndex] = easybloxMeasureDhtPulse(',
                '                inputRegister,',
                '                bitMask,',
                '                LOW',
                '            );',
                '',
                '            highCycles[bitIndex] = easybloxMeasureDhtPulse(',
                '                inputRegister,',
                '                bitMask,',
                '                HIGH',
                '            );',
                '',
                '            if (',
                '                lowCycles[bitIndex] == 0 ||',
                '                highCycles[bitIndex] == 0',
                '            ) {',
                '                timingValid = false;',
                '                break;',
                '            }',
                '        }',
                '    }',
                '',
                '    interrupts();',
                '',
                '    if (!timingValid) {',
                '        return false;',
                '    }',
                '',
                '    for (uint8_t bitIndex = 0; bitIndex < 40; bitIndex++) {',
                '        data[bitIndex / 8] <<= 1;',
                '',
                '        if (highCycles[bitIndex] > lowCycles[bitIndex]) {',
                '            data[bitIndex / 8] |= 1;',
                '        }',
                '    }',
                '',
                '    const uint8_t expectedChecksum =',
                '        static_cast<uint8_t>(',
                '            data[0] +',
                '            data[1] +',
                '            data[2] +',
                '            data[3]',
                '        );',
                '',
                '    if (expectedChecksum != data[4]) {',
                '        return false;',
                '    }',
                '',
                '    humidity = data[0];',
                '    temperature = data[2];',
                '',
                '    return true;',
                '}',
                '',
                'bool easybloxReadDht11(',
                '    uint8_t pin,',
                '    uint8_t &humidity,',
                '    uint8_t &temperature',
                ') {',
                '    if (',
                '        pin < EASYBLOX_DHT_FIRST_PIN ||',
                '        pin > EASYBLOX_DHT_LAST_PIN',
                '    ) {',
                '        return false;',
                '    }',
                '',
                '    EasyBloxDhtCacheEntry &cache =',
                '        easybloxDhtCache[pin - EASYBLOX_DHT_FIRST_PIN];',
                '',
                '    if (',
                '        cache.valid &&',
                '        millis() - cache.timestamp <',
                '            EASYBLOX_DHT_CACHE_INTERVAL_MS',
                '    ) {',
                '        humidity = cache.humidity;',
                '        temperature = cache.temperature;',
                '        return true;',
                '    }',
                '',
                '    if (!easybloxReadDht11Raw(pin, humidity, temperature)) {',
                '        cache.valid = false;',
                '        return false;',
                '    }',
                '',
                '    cache.humidity = humidity;',
                '    cache.temperature = temperature;',
                '    cache.timestamp = millis();',
                '    cache.valid = true;',
                '',
                '    return true;',
                '}',
                '',
                'float easybloxDhtTemperature(uint8_t pin) {',
                '    uint8_t humidity = 0;',
                '    uint8_t temperature = 0;',
                '',
                '    if (!easybloxReadDht11(pin, humidity, temperature)) {',
                '        return 0.0f;',
                '    }',
                '',
                '    return static_cast<float>(temperature);',
                '}',
                '',
                'float easybloxDhtHumidity(uint8_t pin) {',
                '    uint8_t humidity = 0;',
                '    uint8_t temperature = 0;',
                '',
                '    if (!easybloxReadDht11(pin, humidity, temperature)) {',
                '        return 0.0f;',
                '    }',
                '',
                '    return static_cast<float>(humidity);',
                '}',
                ''
            );
        }

        if (matrixInitialization) {
            lines.push(
                'void easybloxMatrixWriteByte(',
                '    uint8_t dinPin,',
                '    uint8_t clkPin,',
                '    uint8_t value',
                ') {',
                '    for (int8_t bit = 7; bit >= 0; --bit) {',
                '        digitalWrite(clkPin, LOW);',
                '        digitalWrite(',
                '            dinPin,',
                '            (value & (1 << bit)) ? HIGH : LOW',
                '        );',
                '        digitalWrite(clkPin, HIGH);',
                '    }',
                '}',
                '',
                'void easybloxMatrixWriteRegister(',
                '    uint8_t dinPin,',
                '    uint8_t csPin,',
                '    uint8_t clkPin,',
                '    uint8_t reg,',
                '    uint8_t value',
                ') {',
                '    digitalWrite(csPin, LOW);',
                '    easybloxMatrixWriteByte(dinPin, clkPin, reg);',
                '    easybloxMatrixWriteByte(dinPin, clkPin, value);',
                '    digitalWrite(csPin, HIGH);',
                '}',
                '',
                'void easybloxMatrixInit(',
                '    uint8_t dinPin,',
                '    uint8_t csPin,',
                '    uint8_t clkPin',
                ') {',
                '    pinMode(dinPin, OUTPUT);',
                '    pinMode(csPin, OUTPUT);',
                '    pinMode(clkPin, OUTPUT);',
                '',
                '    digitalWrite(csPin, HIGH);',
                '    digitalWrite(clkPin, LOW);',
                '',
                '    easybloxMatrixWriteRegister(',
                '        dinPin, csPin, clkPin, 0x0F, 0x00',
                '    );',
                '    easybloxMatrixWriteRegister(',
                '        dinPin, csPin, clkPin, 0x09, 0x00',
                '    );',
                '    easybloxMatrixWriteRegister(',
                '        dinPin, csPin, clkPin, 0x0B, 0x07',
                '    );',
                '    easybloxMatrixWriteRegister(',
                '        dinPin, csPin, clkPin, 0x0A, 0x08',
                '    );',
                '    easybloxMatrixWriteRegister(',
                '        dinPin, csPin, clkPin, 0x0C, 0x01',
                '    );',
                '',
                '    for (uint8_t row = 1; row <= 8; ++row) {',
                '        easybloxMatrixWriteRegister(',
                '            dinPin, csPin, clkPin, row, 0x00',
                '        );',
                '    }',
                '}',
                ''
            );
        }

        if (lcdInitialization) {
            lines.push(
                'uint8_t easyblox_lcd_display_control = 0x04;',
                'uint8_t easyblox_lcd_entry_mode = 0x02;',
                '',
                'void easybloxLcdWrite(',
                '    const char *text,',
                '    float rowValue,',
                '    float columnValue',
                ') {',
                '    if (easyblox_lcd_address == 0) {',
                '        return;',
                '    }',
                '',
                '    int row = (int)round(rowValue);',
                '    int column = (int)round(columnValue);',
                '',
                '    if (row < 1) {',
                '        row = 1;',
                '    } else if (row > 2) {',
                '        row = 2;',
                '    }',
                '',
                '    if (column < 1) {',
                '        column = 1;',
                '    } else if (column > 16) {',
                '        column = 16;',
                '    }',
                '',
                '    const uint8_t rowOffsets[2] = {0x00, 0x40};',
                '    const uint8_t address =',
                '        rowOffsets[row - 1] + (column - 1);',
                '',
                '    easybloxLcdCommand(0x80 | address);',
                '',
                '    for (uint16_t index = 0; text[index] != \'\\0\'; ++index) {',
                '        easybloxLcdSend((uint8_t)text[index], 0x01);',
                '    }',
                '}',
                '',
                'void easybloxLcdClear() {',
                '    easybloxLcdCommand(0x01);',
                '    delayMicroseconds(2000);',
                '}',
                '',
                'void easybloxLcdMode(uint8_t mode) {',
                '    switch (mode) {',
                '    case 0:',
                '        easyblox_lcd_display_control |= 0x01;',
                '        easybloxLcdCommand(',
                '            0x08 | easyblox_lcd_display_control',
                '        );',
                '        break;',
                '',
                '    case 1:',
                '        easyblox_lcd_display_control &= ~0x01;',
                '        easybloxLcdCommand(',
                '            0x08 | easyblox_lcd_display_control',
                '        );',
                '        break;',
                '',
                '    case 2:',
                '        easyblox_lcd_display_control |= 0x02;',
                '        easybloxLcdCommand(',
                '            0x08 | easyblox_lcd_display_control',
                '        );',
                '        break;',
                '',
                '    case 3:',
                '        easyblox_lcd_display_control &= ~0x02;',
                '        easybloxLcdCommand(',
                '            0x08 | easyblox_lcd_display_control',
                '        );',
                '        break;',
                '',
                '    case 4:',
                '        easyblox_lcd_display_control |= 0x04;',
                '        easybloxLcdCommand(',
                '            0x08 | easyblox_lcd_display_control',
                '        );',
                '        break;',
                '',
                '    case 5:',
                '        easyblox_lcd_display_control &= ~0x04;',
                '        easybloxLcdCommand(',
                '            0x08 | easyblox_lcd_display_control',
                '        );',
                '        break;',
                '',
                '    case 6:',
                '        easyblox_lcd_entry_mode |= 0x01;',
                '        easybloxLcdCommand(',
                '            0x04 | easyblox_lcd_entry_mode',
                '        );',
                '        break;',
                '',
                '    case 7:',
                '        easyblox_lcd_entry_mode &= ~0x01;',
                '        easybloxLcdCommand(',
                '            0x04 | easyblox_lcd_entry_mode',
                '        );',
                '        break;',
                '',
                '    case 8:',
                '        easybloxLcdCommand(0x18);',
                '        break;',
                '',
                '    case 9:',
                '        easybloxLcdCommand(0x1C);',
                '        break;',
                '',
                '    default:',
                '        break;',
                '    }',
                '}',
                ''
            );
        }

        if (tm1637Initialization) {
            lines.push(
                'void easybloxTm1637Init(',
                '    uint8_t clkPin,',
                '    uint8_t dioPin',
                ') {',
                '    pinMode(clkPin, OUTPUT);',
                '    pinMode(dioPin, OUTPUT);',
                '',
                '    digitalWrite(clkPin, HIGH);',
                '    digitalWrite(dioPin, HIGH);',
                '}',
                ''
            );
        }

        if (tm1637Initialization) {
            lines.push(
                'const uint8_t EASYBLOX_TM1637_DIGITS[10] = {',
                '    0x3F, 0x06, 0x5B, 0x4F, 0x66,',
                '    0x6D, 0x7D, 0x07, 0x7F, 0x6F',
                '};',
                '',
                'void easybloxTm1637Start(',
                '    uint8_t clkPin,',
                '    uint8_t dioPin',
                ') {',
                '    digitalWrite(dioPin, HIGH);',
                '    digitalWrite(clkPin, HIGH);',
                '    delayMicroseconds(2);',
                '    digitalWrite(dioPin, LOW);',
                '    delayMicroseconds(2);',
                '    digitalWrite(clkPin, LOW);',
                '}',
                '',
                'void easybloxTm1637Stop(',
                '    uint8_t clkPin,',
                '    uint8_t dioPin',
                ') {',
                '    digitalWrite(clkPin, LOW);',
                '    digitalWrite(dioPin, LOW);',
                '    delayMicroseconds(2);',
                '    digitalWrite(clkPin, HIGH);',
                '    delayMicroseconds(2);',
                '    digitalWrite(dioPin, HIGH);',
                '}',
                '',
                'void easybloxTm1637WriteByte(',
                '    uint8_t clkPin,',
                '    uint8_t dioPin,',
                '    uint8_t value',
                ') {',
                '    for (uint8_t bit = 0; bit < 8; ++bit) {',
                '        digitalWrite(clkPin, LOW);',
                '        digitalWrite(',
                '            dioPin,',
                '            (value & 0x01) ? HIGH : LOW',
                '        );',
                '        delayMicroseconds(3);',
                '        value >>= 1;',
                '        digitalWrite(clkPin, HIGH);',
                '        delayMicroseconds(3);',
                '    }',
                '',
                '    digitalWrite(clkPin, LOW);',
                '    pinMode(dioPin, INPUT_PULLUP);',
                '    delayMicroseconds(3);',
                '    digitalWrite(clkPin, HIGH);',
                '    delayMicroseconds(3);',
                '    digitalWrite(clkPin, LOW);',
                '    pinMode(dioPin, OUTPUT);',
                '}',
                '',
                'void easybloxTm1637WriteFrame(',
                '    uint8_t clkPin,',
                '    uint8_t dioPin,',
                '    const uint8_t segments[4]',
                ') {',
                '    easybloxTm1637Start(clkPin, dioPin);',
                '    easybloxTm1637WriteByte(clkPin, dioPin, 0x40);',
                '    easybloxTm1637Stop(clkPin, dioPin);',
                '',
                '    easybloxTm1637Start(clkPin, dioPin);',
                '    easybloxTm1637WriteByte(clkPin, dioPin, 0xC0);',
                '',
                '    for (uint8_t index = 0; index < 4; ++index) {',
                '        easybloxTm1637WriteByte(',
                '            clkPin, dioPin, segments[index]',
                '        );',
                '    }',
                '',
                '    easybloxTm1637Stop(clkPin, dioPin);',
                '',
                '    easybloxTm1637Start(clkPin, dioPin);',
                '    easybloxTm1637WriteByte(clkPin, dioPin, 0x8F);',
                '    easybloxTm1637Stop(clkPin, dioPin);',
                '}',
                '',
                'void easybloxTm1637Show(',
                '    uint8_t clkPin,',
                '    uint8_t dioPin,',
                '    long value,',
                '    float lengthValue,',
                '    float positionValue,',
                '    bool point,',
                '    bool leadingZeros',
                ') {',
                '    if (value < 0) {',
                '        value = 0;',
                '    }',
                '',
                '    int requestedLength = (int)round(lengthValue);',
                '    int position = (int)round(positionValue);',
                '',
                '    if (requestedLength < 1) {',
                '        requestedLength = 1;',
                '    } else if (requestedLength > 4) {',
                '        requestedLength = 4;',
                '    }',
                '',
                '    if (position < 1) {',
                '        position = 1;',
                '    } else if (position > 4) {',
                '        position = 4;',
                '    }',
                '',
                '    const uint8_t start = position - 1;',
                '    const uint8_t available = 4 - start;',
                '    const uint8_t length =',
                '        requestedLength < available ?',
                '            requestedLength : available;',
                '',
                '    uint8_t segments[4] = {0, 0, 0, 0};',
                '    uint8_t digits[4] = {0, 0, 0, 0};',
                '    long remaining = value;',
                '',
                '    if (remaining == 0) {',
                '        if (leadingZeros) {',
                '            for (uint8_t index = 0; index < length; ++index) {',
                '                digits[index] = EASYBLOX_TM1637_DIGITS[0];',
                '            }',
                '        } else {',
                '            digits[length - 1] = EASYBLOX_TM1637_DIGITS[0];',
                '        }',
                '    } else {',
                '        for (int8_t index = length - 1; index >= 0; --index) {',
                '            if (remaining > 0) {',
                '                const uint8_t digit = remaining % 10;',
                '                digits[index] = EASYBLOX_TM1637_DIGITS[digit];',
                '                remaining /= 10;',
                '            } else if (leadingZeros) {',
                '                digits[index] = EASYBLOX_TM1637_DIGITS[0];',
                '            }',
                '        }',
                '    }',
                '',
                '    for (uint8_t index = 0; index < length; ++index) {',
                '        segments[start + index] = digits[index];',
                '    }',
                '',
                '    if (point) {',
                '        segments[1] |= 0x80;',
                '    }',
                '',
                '    easybloxTm1637WriteFrame(clkPin, dioPin, segments);',
                '}',
                '',
                'void easybloxTm1637Clear(',
                '    uint8_t clkPin,',
                '    uint8_t dioPin',
                ') {',
                '    const uint8_t segments[4] = {0, 0, 0, 0};',
                '    easybloxTm1637WriteFrame(clkPin, dioPin, segments);',
                '}',
                ''
            );
        }

        if (matrixInitialization) {
            lines.push(
                'void easybloxMatrixWrite(',
                '    uint8_t dinPin,',
                '    uint8_t csPin,',
                '    uint8_t clkPin,',
                '    uint8_t row0,',
                '    uint8_t row1,',
                '    uint8_t row2,',
                '    uint8_t row3,',
                '    uint8_t row4,',
                '    uint8_t row5,',
                '    uint8_t row6,',
                '    uint8_t row7',
                ') {',
                '    const uint8_t rows[8] = {',
                '        row0, row1, row2, row3,',
                '        row4, row5, row6, row7',
                '    };',
                '',
                '    for (uint8_t row = 0; row < 8; ++row) {',
                '        easybloxMatrixWriteRegister(',
                '            dinPin,',
                '            csPin,',
                '            clkPin,',
                '            row + 1,',
                '            rows[row]',
                '        );',
                '    }',
                '}',
                '',
                'void easybloxMatrixBrightness(',
                '    uint8_t dinPin,',
                '    uint8_t csPin,',
                '    uint8_t clkPin,',
                '    float brightnessPercent',
                ') {',
                '    int brightness = (int)round(brightnessPercent);',
                '',
                '    if (brightness < 0) {',
                '        brightness = 0;',
                '    } else if (brightness > 100) {',
                '        brightness = 100;',
                '    }',
                '',
                '    const uint8_t intensity =',
                '        (uint8_t)((brightness * 15L + 50L) / 100L);',
                '',
                '    easybloxMatrixWriteRegister(',
                '        dinPin,',
                '        csPin,',
                '        clkPin,',
                '        0x0A,',
                '        intensity',
                '    );',
                '}',
                '',
                'void easybloxMatrixClear(',
                '    uint8_t dinPin,',
                '    uint8_t csPin,',
                '    uint8_t clkPin',
                ') {',
                '    for (uint8_t row = 1; row <= 8; ++row) {',
                '        easybloxMatrixWriteRegister(',
                '            dinPin, csPin, clkPin, row, 0x00',
                '        );',
                '    }',
                '}',
                ''
            );
        }

        if (lcdInitialization) {
            lines.push(
                'uint8_t easybloxLcdDetectAddress() {',
                '    const uint8_t addresses[] = {0x27, 0x3F};',
                '',
                '    for (uint8_t index = 0; index < 2; ++index) {',
                '        Wire.beginTransmission(addresses[index]);',
                '',
                '        if (Wire.endTransmission() == 0) {',
                '            return addresses[index];',
                '        }',
                '    }',
                '',
                '    return 0;',
                '}',
                '',
                'void easybloxLcdExpanderWrite(uint8_t value) {',
                '    if (easyblox_lcd_address == 0) {',
                '        return;',
                '    }',
                '',
                '    Wire.beginTransmission(easyblox_lcd_address);',
                '    Wire.write(value | 0x08);',
                '    Wire.endTransmission();',
                '}',
                '',
                'void easybloxLcdPulseEnable(uint8_t value) {',
                '    easybloxLcdExpanderWrite(value | 0x04);',
                '    delayMicroseconds(1);',
                '    easybloxLcdExpanderWrite(value & ~0x04);',
                '    delayMicroseconds(50);',
                '}',
                '',
                'void easybloxLcdWrite4Bits(uint8_t value) {',
                '    easybloxLcdExpanderWrite(value);',
                '    easybloxLcdPulseEnable(value);',
                '}',
                '',
                'void easybloxLcdSend(uint8_t value, uint8_t mode) {',
                '    easybloxLcdWrite4Bits((value & 0xF0) | mode);',
                '    easybloxLcdWrite4Bits((value << 4) | mode);',
                '}',
                '',
                'void easybloxLcdCommand(uint8_t value) {',
                '    easybloxLcdSend(value, 0x00);',
                '}',
                '',
                'void easybloxLcdInit() {',
                '    Wire.begin();',
                '    easyblox_lcd_address = easybloxLcdDetectAddress();',
                '',
                '    if (easyblox_lcd_address == 0) {',
                '        return;',
                '    }',
                '',
                '    delay(50);',
                '',
                '    easybloxLcdWrite4Bits(0x30);',
                '    delayMicroseconds(4500);',
                '    easybloxLcdWrite4Bits(0x30);',
                '    delayMicroseconds(4500);',
                '    easybloxLcdWrite4Bits(0x30);',
                '    delayMicroseconds(150);',
                '    easybloxLcdWrite4Bits(0x20);',
                '',
                '    easybloxLcdCommand(0x28);',
                '    easybloxLcdCommand(0x08);',
                '    easybloxLcdCommand(0x01);',
                '    delayMicroseconds(2000);',
                '    easybloxLcdCommand(0x06);',
                '    easybloxLcdCommand(0x0C);',
                '}',
                ''
            );
        }

        this._generateDataGlobals(
            variables,
            lists,
            lines
        );

        this._generateProcedurePrototypes(
            procedures,
            lines
        );

        if (usesUnicodeStringLength) {
            lines.push(
                'size_t unicodeStringLength(const String &value) {',
                '    size_t length = 0;',
                '    size_t index = 0;',
                '',
                '    while (index < value.length()) {',
                '        const unsigned char current = static_cast<unsigned char>(value[index]);',
                '',
                '        if ((current & 0xF8) == 0xF0) {',
                '            ++length;',
                '            index += 4;',
                '        } else if ((current & 0xF0) == 0xE0) {',
                '            ++length;',
                '            index += 3;',
                '        } else if ((current & 0xE0) == 0xC0) {',
                '            ++length;',
                '            index += 2;',
                '        } else {',
                '            ++length;',
                '            ++index;',
                '        }',
                '    }',
                '',
                '    return length;',
                '}',
                ''
            );
        }

        if (usesUnicodeLetterOf) {
            lines.push(
                'String unicodeLetterOf(const String &value, double letter) {',
                '    const double index = letter - 1;',
                '    if (index < 0) {',
                '        return "";',
                '    }',
                '    if (index >= unicodeStringLength(value)) {',
                '        return "";',
                '    }',
                '    const size_t characterIndex = static_cast<size_t>(index);',
                '    size_t byteIndex = 0;',
                '    size_t characterPosition = 0;',
                '',
                '    while (',
                '        byteIndex < value.length() &&',
                '        characterPosition < characterIndex',
                '    ) {',
                '        const unsigned char current = static_cast<unsigned char>(value[byteIndex]);',
                '',
                '        if ((current & 0xF8) == 0xF0) {',
                '            byteIndex += 4;',
                '            ++characterPosition;',
                '        } else if ((current & 0xF0) == 0xE0) {',
                '            byteIndex += 3;',
                '            ++characterPosition;',
                '        } else if ((current & 0xE0) == 0xC0) {',
                '            byteIndex += 2;',
                '            ++characterPosition;',
                '        } else {',
                '            ++byteIndex;',
                '            ++characterPosition;',
                '        }',
                '    }',
                '',
                '    const unsigned char current = static_cast<unsigned char>(value[byteIndex]);',
                '    size_t byteLength = 1;',
                '',
                '    if ((current & 0xF8) == 0xF0) {',
                '        byteLength = 4;',
                '    } else if ((current & 0xF0) == 0xE0) {',
                '        byteLength = 3;',
                '    } else if ((current & 0xE0) == 0xC0) {',
                '        byteLength = 2;',
                '    }',
                '',
                '    return value.substring(byteIndex, byteIndex + byteLength);',
                '}',
                ''
            );
        }

        if (usesStringContainsIgnoreCase) {
            lines.push(
                'String unicodeLatin1ToLower(const String &value) {',
                '    String result;',
                '    result.reserve(value.length());',
                '    size_t index = 0;',
                '',
                '    while (index < value.length()) {',
                '        const unsigned char current = static_cast<unsigned char>(value[index]);',
                '',
                "        if (current >= 'A' && current <= 'Z') {",
                "            result += static_cast<char>(current + ('a' - 'A'));",
                '            ++index;',
                '            continue;',
                '        }',
                '',
                '        if (current == 0xC3 && index + 1 < value.length()) {',
                '            const unsigned char next = static_cast<unsigned char>(value[index + 1]);',
                '',
                '            if (',
                '                (next >= 0x80 && next <= 0x96) ||',
                '                (next >= 0x98 && next <= 0x9E)',
                '            ) {',
                '                result += static_cast<char>(current);',
                '                result += static_cast<char>(next + 0x20);',
                '                index += 2;',
                '                continue;',
                '            }',
                '        }',
                '',
                '        result += static_cast<char>(current);',
                '        ++index;',
                '    }',
                '',
                '    return result;',
                '}',
                '',
                'bool stringContainsIgnoreCase(const String &value, const String &substring) {',
                '    if (substring.length() == 0) {',
                '        return true;',
                '    }',
                '',
                '    const String normalizedValue = unicodeLatin1ToLower(value);',
                '    const String normalizedSubstring = unicodeLatin1ToLower(substring);',
                '',
                '    return normalizedValue.indexOf(normalizedSubstring) >= 0;',
                '}',
                ''
            );
        }

        if (usesScratchMod) {
            lines.push(
                'double scratchMod(double n, double modulus) {',
                '    double result = fmod(n, modulus);',
                '',
                '    if (result / modulus < 0) {',
                '        result += modulus;',
                '    }',
                '',
                '    return result;',
                '}',
                ''
            );
        }

        if (usesScratchRandom) {
            lines.push(
                'double scratchRandom(double from, double to) {',
                '    const double low = from <= to ? from : to;',
                '    const double high = from <= to ? to : from;',
                '',
                '    if (low == high) {',
                '        return low;',
                '    }',
                '',
                '    if (',
                '        floor(from) == from &&',
                '        floor(to) == to',
                '    ) {',
                '        return static_cast<double>(',
                '            random(',
                '                static_cast<long>(low),',
                '                static_cast<long>(high) + 1L',
                '            )',
                '        );',
                '    }',
                '',
                '    const double unit =',
                '        static_cast<double>(random(0, 1000000L)) /',
                '        1000000.0;',
                '',
                '    return low + (unit * (high - low));',
                '}',
                ''
            );
        }

        if (lists.length > 0) {
            this._generateListRuntimeHelpers(lines);
        }

        this._generateProcedureDefinitions(
            procedures,
            identifiers,
            lines
        );

        lines.push('void setup() {');

        for (const motor of motorConfigurations) {
            lines.push(
                `    pinMode(MOTOR${motor.motor}_IN1, OUTPUT);`,
                `    pinMode(MOTOR${motor.motor}_IN2, OUTPUT);`,
                `    pinMode(MOTOR${motor.motor}_PWM, OUTPUT);`
            );
        }

        for (const pin of inputPins) {
            lines.push(`    pinMode(${pin}, INPUT);`);
        }

        for (const pin of outputPins) {
            lines.push(`    pinMode(${pin}, OUTPUT);`);
        }

        this._generateStatements(
            setupStatements,
            1,
            identifiers,
            lines
        );

        lines.push(
            '}',
            '',
            'void loop() {'
        );

        this._generateStatements(
            loopStatements,
            1,
            identifiers,
            lines
        );

        lines.push(
            '}',
            ''
        );

        return lines.join('\n');
    }

    /**
     * Check whether the program uses the Arduino timer.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {boolean} True when timer support is required.
     * @private
     */
    _usesTimer (setupStatements, loopStatements) {
        return (
            this._statementsUseTimer(setupStatements) ||
            this._statementsUseTimer(loopStatements)
        );
    }

    /**
     * Recursively inspect statements for timer expressions.
     * @param {Array<object>} statements Semantic IR statements.
     * @returns {boolean} True when timer support is required.
     * @private
     */
    _statementsUseTimer (statements) {
        for (const statement of statements) {
            if (statement.type === 'TimerReset') {
                return true;
            }

            if (
                statement.type === 'Wait' &&
                this._expressionUsesTimer(statement.duration)
            ) {
                return true;
            }

            if (statement.type === 'Repeat') {
                if (
                    this._expressionUsesTimer(statement.times) ||
                    this._statementsUseTimer(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'WaitUntil') {
                if (
                    this._expressionUsesTimer(
                        statement.condition
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'RepeatUntil') {
                if (
                    this._expressionUsesTimer(
                        statement.condition
                    ) ||
                    this._statementsUseTimer(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'If') {
                if (
                    this._expressionUsesTimer(statement.condition) ||
                    this._statementsUseTimer(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'IfElse') {
                if (
                    this._expressionUsesTimer(statement.condition) ||
                    this._statementsUseTimer(
                        Array.isArray(statement.thenBody) ?
                            statement.thenBody :
                            []
                    ) ||
                    this._statementsUseTimer(
                        Array.isArray(statement.elseBody) ?
                            statement.elseBody :
                            []
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Recursively inspect Expression IR for timer reads.
     * @param {number|object} expression EasyBlox expression IR.
     * @returns {boolean} True when the expression uses the timer.
     * @private
     */
    _expressionUsesTimer (expression) {
        if (!expression || typeof expression !== 'object') {
            return false;
        }

        switch (expression.type) {
        case 'TimerReadExpression':
            return true;

        case 'BinaryExpression':
            return (
                this._expressionUsesTimer(expression.left) ||
                this._expressionUsesTimer(expression.right)
            );

        case 'UnaryExpression':
            return this._expressionUsesTimer(expression.operand);

        default:
            return false;
        }
    }

    /**
     * Check whether the program requires Scratch-compatible string length support.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {boolean} True when Length is used.
     * @private
     */
    _usesUnicodeStringLength (setupStatements, loopStatements) {
        return (
            this._statementsUseUnicodeStringLength(setupStatements) ||
            this._statementsUseUnicodeStringLength(loopStatements)
        );
    }

    /**
     * Recursively inspect statements for Length expressions.
     * @param {Array<object>} statements Semantic IR statements.
     * @returns {boolean} True when Length is used.
     * @private
     */
    _statementsUseUnicodeStringLength (statements) {
        for (const statement of statements) {
            if (
                (
                    statement.type === 'SerialWrite' ||
                    statement.type === 'SerialWriteLine'
                ) &&
                this._expressionUsesUnicodeStringLength(statement.value)
            ) {
                return true;
            }

            if (
                statement.type === 'Wait' &&
                this._expressionUsesUnicodeStringLength(statement.duration)
            ) {
                return true;
            }

            if (statement.type === 'Repeat') {
                if (
                    this._expressionUsesUnicodeStringLength(statement.times) ||
                    this._statementsUseUnicodeStringLength(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'WaitUntil') {
                if (
                    this._expressionUsesUnicodeStringLength(statement.condition)
                ) {
                    return true;
                }
            } else if (statement.type === 'RepeatUntil') {
                if (
                    this._expressionUsesUnicodeStringLength(statement.condition) ||
                    this._statementsUseUnicodeStringLength(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'If') {
                if (
                    this._expressionUsesUnicodeStringLength(statement.condition) ||
                    this._statementsUseUnicodeStringLength(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'IfElse') {
                if (
                    this._expressionUsesUnicodeStringLength(statement.condition) ||
                    this._statementsUseUnicodeStringLength(
                        Array.isArray(statement.thenBody) ?
                            statement.thenBody :
                            []
                    ) ||
                    this._statementsUseUnicodeStringLength(
                        Array.isArray(statement.elseBody) ?
                            statement.elseBody :
                            []
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check whether the program requires case-insensitive Contains support.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {boolean} True when Contains is used.
     * @private
     */
    _usesStringContainsIgnoreCase (setupStatements, loopStatements) {
        return (
            this._statementsUseStringContainsIgnoreCase(setupStatements) ||
            this._statementsUseStringContainsIgnoreCase(loopStatements)
        );
    }

    /**
     * Recursively inspect statements for Contains expressions.
     * @param {Array<object>} statements Semantic IR statements.
     * @returns {boolean} True when Contains is used.
     * @private
     */
    _statementsUseStringContainsIgnoreCase (statements) {
        for (const statement of statements) {
            if (
                (
                    statement.type === 'SerialWrite' ||
                    statement.type === 'SerialWriteLine'
                ) &&
                this._expressionUsesStringContainsIgnoreCase(statement.value)
            ) {
                return true;
            }

            if (
                statement.type === 'Wait' &&
                this._expressionUsesStringContainsIgnoreCase(
                    statement.duration
                )
            ) {
                return true;
            }

            if (statement.type === 'Repeat') {
                if (
                    this._expressionUsesStringContainsIgnoreCase(
                        statement.times
                    ) ||
                    this._statementsUseStringContainsIgnoreCase(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'WaitUntil') {
                if (
                    this._expressionUsesStringContainsIgnoreCase(
                        statement.condition
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'RepeatUntil') {
                if (
                    this._expressionUsesStringContainsIgnoreCase(
                        statement.condition
                    ) ||
                    this._statementsUseStringContainsIgnoreCase(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'If') {
                if (
                    this._expressionUsesStringContainsIgnoreCase(
                        statement.condition
                    ) ||
                    this._statementsUseStringContainsIgnoreCase(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'IfElse') {
                if (
                    this._expressionUsesStringContainsIgnoreCase(
                        statement.condition
                    ) ||
                    this._statementsUseStringContainsIgnoreCase(
                        Array.isArray(statement.thenBody) ?
                            statement.thenBody :
                            []
                    ) ||
                    this._statementsUseStringContainsIgnoreCase(
                        Array.isArray(statement.elseBody) ?
                            statement.elseBody :
                            []
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Recursively inspect Expression IR for Contains.
     * @param {number|object} expression EasyBlox expression IR.
     * @returns {boolean} True when the expression uses Contains.
     * @private
     */
    _expressionUsesStringContainsIgnoreCase (expression) {
        if (!expression || typeof expression !== 'object') {
            return false;
        }

        if (
            expression.type === 'BinaryExpression' &&
            expression.operator === 'Contains'
        ) {
            return true;
        }

        if (expression.type === 'BinaryExpression') {
            return (
                this._expressionUsesStringContainsIgnoreCase(
                    expression.left
                ) ||
                this._expressionUsesStringContainsIgnoreCase(
                    expression.right
                )
            );
        }

        if (expression.type === 'UnaryExpression') {
            return this._expressionUsesStringContainsIgnoreCase(
                expression.operand
            );
        }

        return false;
    }

    /**
     * Check whether an expression operator occurs anywhere in the program IR.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @param {string} operator Expression operator.
     * @returns {boolean} True when the operator is used.
     * @private
     */
    _programUsesExpressionOperator (
        setupStatements,
        loopStatements,
        operator
    ) {
        return (
            this._irUsesExpressionOperator(
                setupStatements,
                operator
            ) ||
            this._irUsesExpressionOperator(
                loopStatements,
                operator
            )
        );
    }

    /**
     * Recursively inspect EasyBlox IR for an expression operator.
     * @param {*} value IR value.
     * @param {string} operator Expression operator.
     * @returns {boolean} True when found.
     * @private
     */
    _irUsesExpressionOperator (value, operator) {
        if (Array.isArray(value)) {
            return value.some(item =>
                this._irUsesExpressionOperator(item, operator)
            );
        }

        if (!value || typeof value !== 'object') {
            return false;
        }

        if (
            (
                value.type === 'BinaryExpression' ||
                value.type === 'UnaryExpression'
            ) &&
            value.operator === operator
        ) {
            return true;
        }

        return Object.keys(value).some(key =>
            this._irUsesExpressionOperator(
                value[key],
                operator
            )
        );
    }

    /**
     * Recursively inspect EasyBlox IR for an expression type.
     * @param {*} value IR value.
     * @param {string} expressionType Expression IR type.
     * @returns {boolean} True when found.
     * @private
     */
    _irUsesExpressionType (value, expressionType) {
        if (Array.isArray(value)) {
            return value.some(item =>
                this._irUsesExpressionType(
                    item,
                    expressionType
                )
            );
        }

        if (!value || typeof value !== 'object') {
            return false;
        }

        if (value.type === expressionType) {
            return true;
        }

        return Object.keys(value).some(key =>
            this._irUsesExpressionType(
                value[key],
                expressionType
            )
        );
    }

    /**
     * Collect unique DHT pins referenced anywhere in EasyBlox IR.
     * @param {*} value IR value.
     * @returns {Array<number>} Unique DHT pins in deterministic order.
     * @private
     */
    _collectDhtPins (value) {
        const pins = new Set();

        const visit = item => {
            if (Array.isArray(item)) {
                for (const child of item) {
                    visit(child);
                }
                return;
            }

            if (
                !item ||
                typeof item !== 'object'
            ) {
                return;
            }

            if (item.type === 'DhtReadExpression') {
                pins.add(item.pin);
            }

            for (const child of Object.values(item)) {
                visit(child);
            }
        };

        visit(value);

        return Array.from(pins)
            .sort((a, b) => a - b);
    }

    /**
     * Find the explicit joystick configuration declared in setup.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @returns {?object} JoystickInit statement or null.
     * @private
     */
    _collectJoystickConfiguration (setupStatements) {
        for (const statement of setupStatements) {
            if (
                statement &&
                statement.type === 'JoystickInit'
            ) {
                return statement;
            }
        }

        return null;
    }

    /**
     * Check whether the program requires Unicode-aware letter support.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {boolean} True when LetterOf is used.
     * @private
     */
    _usesUnicodeLetterOf (setupStatements, loopStatements) {
        return (
            this._statementsUseUnicodeLetterOf(setupStatements) ||
            this._statementsUseUnicodeLetterOf(loopStatements)
        );
    }

    /**
     * Recursively inspect statements for LetterOf expressions.
     * @param {Array<object>} statements Semantic IR statements.
     * @returns {boolean} True when LetterOf is used.
     * @private
     */
    _statementsUseUnicodeLetterOf (statements) {
        for (const statement of statements) {
            if (
                (
                    statement.type === 'SerialWrite' ||
                    statement.type === 'SerialWriteLine'
                ) &&
                this._expressionUsesUnicodeLetterOf(statement.value)
            ) {
                return true;
            }

            if (
                statement.type === 'Wait' &&
                this._expressionUsesUnicodeLetterOf(statement.duration)
            ) {
                return true;
            }

            if (statement.type === 'Repeat') {
                if (
                    this._expressionUsesUnicodeLetterOf(statement.times) ||
                    this._statementsUseUnicodeLetterOf(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'WaitUntil') {
                if (
                    this._expressionUsesUnicodeLetterOf(statement.condition)
                ) {
                    return true;
                }
            } else if (statement.type === 'RepeatUntil') {
                if (
                    this._expressionUsesUnicodeLetterOf(statement.condition) ||
                    this._statementsUseUnicodeLetterOf(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'If') {
                if (
                    this._expressionUsesUnicodeLetterOf(statement.condition) ||
                    this._statementsUseUnicodeLetterOf(
                        Array.isArray(statement.body) ?
                            statement.body :
                            []
                    )
                ) {
                    return true;
                }
            } else if (statement.type === 'IfElse') {
                if (
                    this._expressionUsesUnicodeLetterOf(statement.condition) ||
                    this._statementsUseUnicodeLetterOf(
                        Array.isArray(statement.thenBody) ?
                            statement.thenBody :
                            []
                    ) ||
                    this._statementsUseUnicodeLetterOf(
                        Array.isArray(statement.elseBody) ?
                            statement.elseBody :
                            []
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Recursively inspect Expression IR for LetterOf.
     * @param {number|object} expression EasyBlox expression IR.
     * @returns {boolean} True when the expression uses LetterOf.
     * @private
     */
    _expressionUsesUnicodeLetterOf (expression) {
        if (!expression || typeof expression !== 'object') {
            return false;
        }

        if (
            expression.type === 'BinaryExpression' &&
            expression.operator === 'LetterOf'
        ) {
            return true;
        }

        if (expression.type === 'BinaryExpression') {
            return (
                this._expressionUsesUnicodeLetterOf(expression.left) ||
                this._expressionUsesUnicodeLetterOf(expression.right)
            );
        }

        if (expression.type === 'UnaryExpression') {
            return this._expressionUsesUnicodeLetterOf(
                expression.operand
            );
        }

        return false;
    }

    /**
     * Recursively inspect Expression IR for Length.
     * @param {number|object} expression EasyBlox expression IR.
     * @returns {boolean} True when the expression uses Length.
     * @private
     */
    _expressionUsesUnicodeStringLength (expression) {
        if (!expression || typeof expression !== 'object') {
            return false;
        }

        if (
            expression.type === 'UnaryExpression' &&
            expression.operator === 'Length'
        ) {
            return true;
        }

        if (expression.type === 'BinaryExpression') {
            return (
                this._expressionUsesUnicodeStringLength(expression.left) ||
                this._expressionUsesUnicodeStringLength(expression.right)
            );
        }

        if (expression.type === 'UnaryExpression') {
            return this._expressionUsesUnicodeStringLength(
                expression.operand
            );
        }

        return false;
    }

    /**
     * Collect declarative motor configurations from setup.
     * MotorConfigure is restricted by UploadContextValidator to the
     * root of setup, so no recursive traversal is required here.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @returns {Array<object>} Motor configurations in deterministic order.
     * @private
     */
    _collectMotorConfigurations (
        setupStatements,
        loopStatements
    ) {
        const configurations = new Map();

        /*
        * Explicit MotorConfigure statements override the board defaults.
        */
        for (const statement of setupStatements) {
            if (
                statement &&
                statement.type === 'MotorConfigure'
            ) {
                configurations.set(
                    statement.motor,
                    statement
                );
            }
        }

        const usedMotors = new Set();

        this._collectUsedMotorsFromStatements(
            setupStatements,
            usedMotors
        );

        this._collectUsedMotorsFromStatements(
            loopStatements,
            usedMotors
        );

        for (const motor of usedMotors) {
            if (configurations.has(motor)) {
                continue;
            }

            const defaultConfiguration =
                ArduinoUnoBoardProfile.motors[motor];

            if (!defaultConfiguration) {
                continue;
            }

            configurations.set(motor, {
                type: 'MotorConfigure',
                motor,
                in1Pin: defaultConfiguration.in1Pin,
                in2Pin: defaultConfiguration.in2Pin,
                pwmPin: defaultConfiguration.pwmPin
            });
        }

        return Array.from(configurations.values())
            .sort((a, b) => a.motor - b.motor);
    }

    /**
     * Recursively collect motors referenced by executable statements.
     * @param {Array<object>} statements Semantic IR statements.
     * @param {Set<number>} motors Destination motor set.
     * @private
     */
    _collectUsedMotorsFromStatements (statements, motors) {
        for (const statement of statements) {
            if (
                statement.type === 'MotorWrite' ||
                statement.type === 'MotorStop'
            ) {
                motors.add(statement.motor);
            } else if (
                statement.type === 'Repeat' ||
                statement.type === 'If'
            ) {
                this._collectUsedMotorsFromStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    motors
                );
            } else if (statement.type === 'IfElse') {
                this._collectUsedMotorsFromStatements(
                    Array.isArray(statement.thenBody) ?
                        statement.thenBody :
                        [],
                    motors
                );

                this._collectUsedMotorsFromStatements(
                    Array.isArray(statement.elseBody) ?
                        statement.elseBody :
                        [],
                    motors
                );
            }
        }
    }

    /**
     * Collect Servo pins required by executable statements.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {Array<number>} Unique Servo pins in deterministic order.
     * @private
     */
    _collectServoPins (setupStatements, loopStatements) {
        const pins = new Set();

        this._collectServoPinsFromStatements(
            setupStatements,
            pins
        );

        this._collectServoPinsFromStatements(
            loopStatements,
            pins
        );

        return Array.from(pins).sort((a, b) => a - b);
    }

    /**
     * Recursively collect Servo pins from structured IR.
     * @param {Array<object>} statements Semantic IR statements.
     * @param {Set<number>} pins Destination pin set.
     * @private
     */
    _collectServoPinsFromStatements (statements, pins) {
        for (const statement of statements) {
            if (statement.type === 'ServoWrite') {
                pins.add(statement.pin);
            } else if (
                statement.type === 'Repeat' ||
                statement.type === 'If'
            ) {
                this._collectServoPinsFromStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    pins
                );
            } else if (statement.type === 'IfElse') {
                this._collectServoPinsFromStatements(
                    Array.isArray(statement.thenBody) ?
                        statement.thenBody :
                        [],
                    pins
                );

                this._collectServoPinsFromStatements(
                    Array.isArray(statement.elseBody) ?
                        statement.elseBody :
                        [],
                    pins
                );
            }
        }
    }

    /**
     * Infer digital INPUT resources required by expressions.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {Array<number>} Unique pins in deterministic order.
     * @private
     */
    _collectInputPins (setupStatements, loopStatements) {
        const pins = new Set();

        this._collectInputPinsFromStatements(
            setupStatements,
            pins
        );

        this._collectInputPinsFromStatements(
            loopStatements,
            pins
        );

        return Array.from(pins).sort((a, b) => a - b);
    }

    /**
     * Recursively collect digital INPUT resources from statements.
     * @param {Array<object>} statements Semantic IR statements.
     * @param {Set<number>} pins Destination pin set.
     * @private
     */
    _collectInputPinsFromStatements (statements, pins) {
        for (const statement of statements) {
            if (statement.type === 'Repeat') {
                this._collectInputPinsFromExpression(
                    statement.times,
                    pins
                );

                this._collectInputPinsFromStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    pins
                );

            } else if (statement.type === 'WaitUntil') {
                this._collectInputPinsFromExpression(
                    statement.condition,
                    pins
                );
            } else if (statement.type === 'RepeatUntil') {
                this._collectInputPinsFromExpression(
                    statement.condition,
                    pins
                );

                this._collectInputPinsFromStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    pins
                );
            } else if (statement.type === 'If') {
                this._collectInputPinsFromExpression(
                    statement.condition,
                    pins
                );

                this._collectInputPinsFromStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    pins
                );
            } else if (statement.type === 'IfElse') {
                this._collectInputPinsFromExpression(
                    statement.condition,
                    pins
                );

                this._collectInputPinsFromStatements(
                    Array.isArray(statement.thenBody) ?
                        statement.thenBody :
                        [],
                    pins
                );

                this._collectInputPinsFromStatements(
                    Array.isArray(statement.elseBody) ?
                        statement.elseBody :
                        [],
                    pins
                );
            }
        }
    }

    /**
     * Recursively collect digital INPUT resources from Expression IR.
     * @param {number|object} expression EasyBlox expression IR.
     * @param {Set<number>} pins Destination pin set.
     * @private
     */
    _collectInputPinsFromExpression (expression, pins) {
        if (!expression || typeof expression !== 'object') {
            return;
        }

        switch (expression.type) {
        case 'DigitalReadExpression':
            pins.add(expression.pin);
            break;

        case 'BinaryExpression':
            this._collectInputPinsFromExpression(
                expression.left,
                pins
            );
            this._collectInputPinsFromExpression(
                expression.right,
                pins
            );
            break;

        case 'UnaryExpression':
            this._collectInputPinsFromExpression(
                expression.operand,
                pins
            );
            break;

        default:
            break;
        }
    }

    /**
     * Infer digital OUTPUT resources required by executable statements.
     * Resources inside structured statements must also be discovered.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {Array<number>} Unique pins in deterministic order.
     * @private
     */
    _collectOutputPins (setupStatements, loopStatements) {
        const pins = new Set();

        this._collectOutputPinsFromStatements(
            setupStatements,
            pins
        );

        this._collectOutputPinsFromStatements(
            loopStatements,
            pins
        );

        return Array.from(pins).sort((a, b) => a - b);
    }

    /**
     * Recursively collect output resources from structured IR.
     * @param {Array<object>} statements Semantic IR statements.
     * @param {Set<number>} pins Destination pin set.
     * @private
     */
    _collectOutputPinsFromStatements (statements, pins) {
        for (const statement of statements) {
            if (
                statement.type === 'DigitalWrite' ||
                statement.type === 'PwmWrite' ||
                statement.type === 'RelayWrite'
            ) {
                pins.add(statement.pin);
            } else if (
                statement.type === 'Repeat' ||
                statement.type === 'RepeatUntil' ||
                statement.type === 'If'
            ) {
                const body = Array.isArray(statement.body) ?
                    statement.body :
                    [];

                this._collectOutputPinsFromStatements(
                    body,
                    pins
                );
            } else if (statement.type === 'IfElse') {
                const thenBody = Array.isArray(statement.thenBody) ?
                    statement.thenBody :
                    [];

                const elseBody = Array.isArray(statement.elseBody) ?
                    statement.elseBody :
                    [];

                this._collectOutputPinsFromStatements(
                    thenBody,
                    pins
                );

                this._collectOutputPinsFromStatements(
                    elseBody,
                    pins
                );
            }
        }
    }

    /**
     * Initialize deterministic C++ identifiers for user-defined data symbols.
     * @param {Array<object>} variables Variable declarations.
     * @param {Array<object>} lists List declarations.
     * @param {Array<object>} procedures Procedure declarations.
     * @returns {Array<string>} Identifiers reserved from internal allocation.
     * @private
     */
    _initializeDataSymbols (variables, lists, procedures) {
        this._variablesById = new Map();
        this._listsById = new Map();
        this._proceduresById = new Map();
        this._currentProcedureParameterIdentifiers = null;

        const globalUsed = this._createCppReservedIdentifierSet();
        const reservedForInternals = new Set(globalUsed);

        /*
        * Internal EasyBlox helper emitted by the Ultrasonic reporter.
        * Reserve it from student variables, lists, procedures and parameters.
        */
        globalUsed.add('easybloxUltrasonicRead');
        reservedForInternals.add('easybloxUltrasonicRead');
        const dhtInternalIdentifiers = [
            'EASYBLOX_DHT_CACHE_INTERVAL_MS',
            'EASYBLOX_DHT_FIRST_PIN',
            'EASYBLOX_DHT_LAST_PIN',
            'EASYBLOX_DHT_PIN_COUNT',
            'EasyBloxDhtCacheEntry',
            'easybloxDhtCache',
            'easybloxMeasureDhtPulse',
            'easybloxReadDht11Raw',
            'easybloxReadDht11',
            'easybloxDhtTemperature',
            'easybloxDhtHumidity'
        ];

        for (const identifier of dhtInternalIdentifiers) {
            globalUsed.add(identifier);
            reservedForInternals.add(identifier);
        }

        for (const variable of variables) {
            const identifier = this._allocateUserCppIdentifier(
                variable.name,
                'variable',
                globalUsed
            );

            reservedForInternals.add(identifier);

            this._variablesById.set(variable.id, {
                declaration: variable,
                identifier
            });
        }

        for (const list of lists) {
            const identifier = this._allocateUserCppIdentifier(
                list.name,
                'lista',
                globalUsed
            );

            const lengthIdentifier = this._allocateUserCppIdentifier(
                `${identifier}_length`,
                'list_length',
                globalUsed
            );

            reservedForInternals.add(identifier);
            reservedForInternals.add(lengthIdentifier);

            this._listsById.set(list.id, {
                declaration: list,
                identifier,
                lengthIdentifier
            });
        }

        for (const procedure of procedures) {
            const identifier = this._allocateUserCppIdentifier(
                procedure.name,
                'procedimento',
                globalUsed
            );

            reservedForInternals.add(identifier);

            const parameterIdentifiers = new Map();
            const localUsed = new Set(globalUsed);

            for (
                const parameter of
                Array.isArray(procedure.parameters) ?
                    procedure.parameters :
                    []
            ) {
                const parameterIdentifier =
                    this._allocateUserCppIdentifier(
                        parameter.name,
                        'argumento',
                        localUsed
                    );

                parameterIdentifiers.set(
                    parameter.id,
                    parameterIdentifier
                );

                reservedForInternals.add(parameterIdentifier);
            }

            this._proceduresById.set(procedure.id, {
                declaration: procedure,
                identifier,
                parameterIdentifiers
            });
        }

        return Array.from(reservedForInternals);
    }

    /**
     * Build the set of C++/Arduino identifiers unavailable to student symbols.
     * @returns {Set<string>} Reserved identifiers.
     * @private
     */
    _createCppReservedIdentifierSet () {
        const keywords = (
            'alignas alignof and and_eq asm atomic_cancel atomic_commit ' +
            'atomic_noexcept auto bitand bitor bool break case catch char ' +
            'char8_t char16_t char32_t class compl concept const consteval ' +
            'constexpr constinit const_cast continue co_await co_return ' +
            'co_yield decltype default delete do double dynamic_cast else ' +
            'enum explicit export extern false float for friend goto if ' +
            'inline int long mutable namespace new noexcept not not_eq ' +
            'nullptr operator or or_eq private protected public reflexpr ' +
            'register reinterpret_cast requires return short signed sizeof ' +
            'static static_assert static_cast struct switch synchronized ' +
            'template this thread_local throw true try typedef typeid ' +
            'typename union unsigned using virtual void volatile wchar_t ' +
            'while xor xor_eq'
        ).split(' ');

        const reserved = new Set(keywords);

        [
            'setup',
            'loop',
            'Serial',
            'String',
            'PI',
            'HIGH',
            'LOW',
            'INPUT',
            'OUTPUT',
            'unicodeStringLength',
            'unicodeLetterOf',
            'unicodeLatin1ToLower',
            'stringContainsIgnoreCase',
            'scratchMod',
            'scratchRandom',
            'easybloxScratchListIndex',
            'easybloxListItem',
            'easybloxListIndexOf',
            'easybloxListContains',
            'easybloxListContents',
            'easybloxListValuesEqual',
            'easybloxListItemText'
        ].forEach(identifier => reserved.add(identifier));

        for (let pin = 0; pin <= 19; pin++) {
            reserved.add(`servo${pin}`);
        }

        for (let motor = 1; motor <= 2; motor++) {
            reserved.add(`MOTOR${motor}_IN1`);
            reserved.add(`MOTOR${motor}_IN2`);
            reserved.add(`MOTOR${motor}_PWM`);
        }

        return reserved;
    }

    /**
     * Normalize and allocate one deterministic user-facing C++ identifier.
     * @param {*} rawName Pedagogical visible name.
     * @param {string} fallback Safe fallback base.
     * @param {Set<string>} used Identifiers already occupied in this scope.
     * @returns {string} Unique C++ identifier.
     * @private
     */
    _allocateUserCppIdentifier (rawName, fallback, used) {
        let base = String(rawName || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z0-9_]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');

        if (!base) {
            base = fallback;
        }

        if (/^[0-9]/.test(base)) {
            base = `${fallback}_${base}`;
        }

        if (base.toLowerCase().startsWith('easyblox_')) {
            base = `user_${base}`;
        }

        let identifier = base;
        let suffix = 2;

        while (used.has(identifier)) {
            identifier = `${base}_${suffix}`;
            suffix++;
        }

        used.add(identifier);

        return identifier;
    }

    /**
     * Convert a pedagogical type into the Arduino C++ backend type.
     * @param {string} valueType EasyBlox pedagogical type.
     * @returns {string} C++ type.
     * @private
     */
    _generateCppType (valueType) {
        switch (valueType) {
        case VALUE_TYPES.INTEGER:
            return 'long';

        case VALUE_TYPES.DECIMAL:
            return 'float';

        case VALUE_TYPES.TEXT:
            return 'String';

        case VALUE_TYPES.BOOLEAN:
            return 'bool';

        default:
            throw new Error(
                `Unsupported Arduino UNO value type: ${valueType}`
            );
        }
    }

    /**
     * Emit global variable and fixed-capacity list declarations.
     * @param {Array<object>} variables Variable declarations.
     * @param {Array<object>} lists List declarations.
     * @param {Array<string>} lines Destination source lines.
     * @private
     */
    _generateDataGlobals (variables, lists, lines) {
        let emitted = false;

        for (const variable of variables) {
            const info = this._getVariableGeneratorInfo(variable.id);

            lines.push(
                `${this._generateCppType(variable.valueType)} ` +
                `${info.identifier} = ` +
                `${this._generateExpression(variable.initialValue)};`
            );

            emitted = true;
        }

        for (const list of lists) {
            const info = this._getListGeneratorInfo(list.id);

            const initialValues = Array.isArray(list.initialValues) ?
                list.initialValues :
                [];

            const generatedInitialValues = initialValues.map(value =>
                this._generateExpression(value)
            );

            let declaration =
                `${this._generateCppType(list.itemType)} ` +
                `${info.identifier}[${list.capacity}]`;

            if (generatedInitialValues.length > 0) {
                declaration += ` = {${generatedInitialValues.join(', ')}}`;
            }

            declaration += ';';

            lines.push(
                declaration,
                `size_t ${info.lengthIdentifier} = ${initialValues.length};`
            );

            emitted = true;
        }

        if (emitted) {
            lines.push('');
        }
    }

    /**
     * Emit forward declarations for all My Blocks.
     * @param {Array<object>} procedures Procedure declarations.
     * @param {Array<string>} lines Destination source lines.
     * @private
     */
    _generateProcedurePrototypes (procedures, lines) {
        if (procedures.length === 0) {
            return;
        }

        for (const procedure of procedures) {
            lines.push(
                `${this._generateProcedureSignature(procedure)};`
            );
        }

        lines.push('');
    }

    /**
     * Emit complete C++ functions for My Blocks.
     * @param {Array<object>} procedures Procedure declarations.
     * @param {InternalIdentifierAllocator} identifiers Internal allocator.
     * @param {Array<string>} lines Destination source lines.
     * @private
     */
    _generateProcedureDefinitions (
        procedures,
        identifiers,
        lines
    ) {
        for (const procedure of procedures) {
            const info = this._getProcedureGeneratorInfo(
                procedure.id
            );

            const previousParameters =
                this._currentProcedureParameterIdentifiers;

            this._currentProcedureParameterIdentifiers =
                info.parameterIdentifiers;

            lines.push(
                `${this._generateProcedureSignature(procedure)} {`
            );

            try {
                this._generateStatements(
                    Array.isArray(procedure.body) ?
                        procedure.body :
                        [],
                    1,
                    identifiers,
                    lines
                );
            } finally {
                this._currentProcedureParameterIdentifiers =
                    previousParameters;
            }

            lines.push(
                '}',
                ''
            );
        }
    }

    /**
     * Generate one My Blocks C++ function signature.
     * @param {object} procedure Procedure declaration.
     * @returns {string} C++ function signature.
     * @private
     */
    _generateProcedureSignature (procedure) {
        const info = this._getProcedureGeneratorInfo(
            procedure.id
        );

        const parameters = (
            Array.isArray(procedure.parameters) ?
                procedure.parameters :
                []
        ).map(parameter => {
            const parameterIdentifier =
                info.parameterIdentifiers.get(parameter.id);

            return (
                `${this._generateCppType(parameter.valueType)} ` +
                `${parameterIdentifier}`
            );
        });

        return `void ${info.identifier}(${parameters.join(', ')})`;
    }

    /**
     * Emit helpers shared by fixed-capacity typed lists.
     * @param {Array<string>} lines Destination source lines.
     * @private
     */
    _generateListRuntimeHelpers (lines) {
        lines.push(
            'long easybloxScratchListIndex(double index) {',
            '    return static_cast<long>(index);',
            '}',
            '',
            'template <typename T>',
            'T easybloxListItem(const T *list, size_t length, double index) {',
            '    const long scratchIndex = easybloxScratchListIndex(index);',
            '',
            '    if (',
            '        scratchIndex < 1 ||',
            '        scratchIndex > static_cast<long>(length)',
            '    ) {',
            '        return T();',
            '    }',
            '',
            '    return list[scratchIndex - 1];',
            '}',
            '',
            'template <typename A, typename B>',
            'bool easybloxListValuesEqual(const A &left, const B &right) {',
            '    return left == right;',
            '}',
            '',
            'bool easybloxListValuesEqual(const String &left, const String &right) {',
            '    return left.equalsIgnoreCase(right);',
            '}',
            '',
            'template <typename T, typename U>',
            'long easybloxListIndexOf(',
            '    const T *list,',
            '    size_t length,',
            '    const U &item',
            ') {',
            '    for (size_t index = 0; index < length; ++index) {',
            '        if (easybloxListValuesEqual(list[index], item)) {',
            '            return static_cast<long>(index) + 1;',
            '        }',
            '    }',
            '',
            '    return 0;',
            '}',
            '',
            'template <typename T, typename U>',
            'bool easybloxListContains(',
            '    const T *list,',
            '    size_t length,',
            '    const U &item',
            ') {',
            '    return easybloxListIndexOf(list, length, item) != 0;',
            '}',
            '',
            'template <typename T>',
            'String easybloxListItemText(const T &value) {',
            '    return String(value);',
            '}',
            '',
            'String easybloxListItemText(const bool &value) {',
            '    return value ? "true" : "false";',
            '}',
            '',
            'String easybloxListItemText(const String &value) {',
            '    return value;',
            '}',
            '',
            'template <typename T>',
            'String easybloxListContents(const T *list, size_t length) {',
            '    String result;',
            '',
            '    for (size_t index = 0; index < length; ++index) {',
            '        if (index > 0) {',
            '            result += " ";',
            '        }',
            '',
            '        result += easybloxListItemText(list[index]);',
            '    }',
            '',
            '    return result;',
            '}',
            '',
            'String easybloxListContents(const String *list, size_t length) {',
            '    bool allSingleLetters = true;',
            '',
            '    for (size_t index = 0; index < length; ++index) {',
            '        if (unicodeStringLength(list[index]) != 1) {',
            '            allSingleLetters = false;',
            '            break;',
            '        }',
            '    }',
            '',
            '    String result;',
            '',
            '    for (size_t index = 0; index < length; ++index) {',
            '        if (!allSingleLetters && index > 0) {',
            '            result += " ";',
            '        }',
            '',
            '        result += list[index];',
            '    }',
            '',
            '    return result;',
            '}',
            ''
        );
    }

    /**
     * Resolve generated variable metadata.
     * @param {string} variableId Variable ID.
     * @returns {object} Generator metadata.
     * @private
     */
    _getVariableGeneratorInfo (variableId) {
        if (
            !this._variablesById ||
            !this._variablesById.has(variableId)
        ) {
            throw new Error(
                `Unknown Arduino UNO generator variable: ${variableId}`
            );
        }

        return this._variablesById.get(variableId);
    }

    /**
     * Resolve generated list metadata.
     * @param {string} listId List ID.
     * @returns {object} Generator metadata.
     * @private
     */
    _getListGeneratorInfo (listId) {
        if (
            !this._listsById ||
            !this._listsById.has(listId)
        ) {
            throw new Error(
                `Unknown Arduino UNO generator list: ${listId}`
            );
        }

        return this._listsById.get(listId);
    }

    /**
     * Resolve generated procedure metadata.
     * @param {string} procedureId Procedure ID.
     * @returns {object} Generator metadata.
     * @private
     */
    _getProcedureGeneratorInfo (procedureId) {
        if (
            !this._proceduresById ||
            !this._proceduresById.has(procedureId)
        ) {
            throw new Error(
                `Unknown Arduino UNO generator procedure: ${procedureId}`
            );
        }

        return this._proceduresById.get(procedureId);
    }

    /**
     * Normalize one serialized MAX7219 8x8 bitmap exactly as Stage mode does.
     * @param {*} bitmap Serialized matrix value.
     * @returns {Array<number>} Eight row bytes.
     * @private
     */
    _normalizeMatrixBitmap (bitmap) {
        const normalized =
            String(bitmap || '')
                .replace(/[^0-9a-f]/gi, '')
                .toUpperCase()
                .slice(0, 16)
                .padEnd(16, '0');

        const rows = [];

        for (let row = 0; row < 8; row++) {
            rows.push(
                parseInt(
                    normalized.slice(
                        row * 2,
                        (row + 1) * 2
                    ),
                    16
                )
            );
        }

        return rows;
    }

    /**
     * Generate structured Arduino C++ statements recursively.
     * @param {Array<object>} statements Semantic IR statements.
     * @param {number} indentLevel Current indentation depth.
     * @param {InternalIdentifierAllocator} identifiers Identifier allocator.
     * @param {Array<string>} lines Destination source lines.
     * @param {number} repeatDepth Current nested Repeat depth.
     * @private
     */
    _generateStatements (
        statements,
        indentLevel,
        identifiers,
        lines,
        repeatDepth = 0
    ) {
        const indent = '    '.repeat(indentLevel);

        for (const statement of statements) {
            switch (statement.type) {
            case 'DigitalWrite':
                lines.push(
                    `${indent}digitalWrite(${statement.pin}, ${
                        statement.value ? 'HIGH' : 'LOW'
                    });`
                );
                break;

            case 'PwmWrite':
                lines.push(
                    `${indent}analogWrite(${statement.pin}, ${statement.value});`
                );
                break;

            case 'ToneStart':
                lines.push(
                    `${indent}tone(${statement.pin}, ${statement.frequency});`
                );
                break;

            case 'ToneStop':
                lines.push(
                    `${indent}noTone(${statement.pin});`
                );
                break;

            case 'TimerReset':
                lines.push(
                    `${indent}easyblox_timer_reset_at = millis();`
                );
                break;

            case 'MatrixInit':
                lines.push(
                    `${indent}easybloxMatrixInit(` +
                    `${statement.dinPin}, ` +
                    `${statement.csPin}, ` +
                    `${statement.clkPin}` +
                    ');'
                );
                break;

            case 'LcdInit':
                lines.push(
                    `${indent}easybloxLcdInit();`
                );
                break;

            case 'Tm1637Init':
                lines.push(
                    `${indent}easybloxTm1637Init(` +
                    `${statement.clkPin}, ` +
                    `${statement.dioPin}` +
                    ');'
                );
                break;

            case 'MatrixWrite': {
                if (!this._matrixInitialization) {
                    throw new Error(
                        'Matrix must be initialized before use'
                    );
                }

                const rows =
                    this._normalizeMatrixBitmap(statement.bitmap);

                const rowArguments = rows.map(row =>
                    `0x${row
                        .toString(16)
                        .toUpperCase()
                        .padStart(2, '0')}`
                );

                lines.push(
                    `${indent}easybloxMatrixWrite(` +
                    `${this._matrixInitialization.dinPin}, ` +
                    `${this._matrixInitialization.csPin}, ` +
                    `${this._matrixInitialization.clkPin}, ` +
                    `${rowArguments.join(', ')}` +
                    ');'
                );
                break;
            }

            case 'MatrixBrightness':
                if (!this._matrixInitialization) {
                    throw new Error(
                        'Matrix must be initialized before use'
                    );
                }

                lines.push(
                    `${indent}easybloxMatrixBrightness(` +
                    `${this._matrixInitialization.dinPin}, ` +
                    `${this._matrixInitialization.csPin}, ` +
                    `${this._matrixInitialization.clkPin}, ` +
                    `${statement.brightnessPercent}` +
                    ');'
                );
                break;

            case 'MatrixClear':
                if (!this._matrixInitialization) {
                    throw new Error(
                        'Matrix must be initialized before use'
                    );
                }

                lines.push(
                    `${indent}easybloxMatrixClear(` +
                    `${this._matrixInitialization.dinPin}, ` +
                    `${this._matrixInitialization.csPin}, ` +
                    `${this._matrixInitialization.clkPin}` +
                    ');'
                );
                break;

            case 'LcdWrite': {
                if (!this._lcdInitialization) {
                    throw new Error(
                        'LCD must be initialized before use'
                    );
                }

                const text =
                    JSON.stringify(String(statement.text));

                lines.push(
                    `${indent}easybloxLcdWrite(` +
                    `${text}, ` +
                    `${statement.row}, ` +
                    `${statement.column}` +
                    ');'
                );
                break;
            }

            case 'LcdMode':
                if (!this._lcdInitialization) {
                    throw new Error(
                        'LCD must be initialized before use'
                    );
                }

                lines.push(
                    `${indent}easybloxLcdMode(` +
                    `${Number(statement.mode)}` +
                    ');'
                );
                break;

            case 'LcdClear':
                if (!this._lcdInitialization) {
                    throw new Error(
                        'LCD must be initialized before use'
                    );
                }

                lines.push(
                    `${indent}easybloxLcdClear();`
                );
                break;

            case 'Tm1637Show': {
                if (!this._tm1637Initialization) {
                    throw new Error(
                        'TM1637 must be initialized before use'
                    );
                }

                const point =
                    String(statement.point) === '1' ?
                        'true' :
                        'false';

                const leadingZeros =
                    String(statement.leadingZeros) === '1' ?
                        'true' :
                        'false';

                lines.push(
                    `${indent}easybloxTm1637Show(` +
                    `${this._tm1637Initialization.clkPin}, ` +
                    `${this._tm1637Initialization.dioPin}, ` +
                    `${statement.value}, ` +
                    `${statement.length}, ` +
                    `${statement.position}, ` +
                    `${point}, ` +
                    `${leadingZeros}` +
                    ');'
                );
                break;
            }

            case 'Tm1637Clear':
                if (!this._tm1637Initialization) {
                    throw new Error(
                        'TM1637 must be initialized before use'
                    );
                }

                lines.push(
                    `${indent}easybloxTm1637Clear(` +
                    `${this._tm1637Initialization.clkPin}, ` +
                    `${this._tm1637Initialization.dioPin}` +
                    ');'
                );
                break;

            case 'JoystickInit':
                lines.push(
                    `${indent}pinMode(${
                        this._generateAnalogPin(statement.xPin)
                    }, INPUT);`,
                    `${indent}digitalWrite(${
                        this._generateAnalogPin(statement.xPin)
                    }, LOW);`,
                    `${indent}pinMode(${
                        this._generateAnalogPin(statement.yPin)
                    }, INPUT);`,
                    `${indent}digitalWrite(${
                        this._generateAnalogPin(statement.yPin)
                    }, LOW);`,
                    `${indent}pinMode(${statement.clickPin}, INPUT_PULLUP);`
                );
                break;

            case 'MotorConfigure':
                /*
                * MotorConfigure is declarative hardware configuration.
                * Its C++ declarations and pin setup are generated separately.
                */
                break;

            case 'MotorWrite': {
                if (
                    statement.direction !== 0 &&
                    statement.direction !== 1
                ) {
                    throw new Error(
                        `Unsupported Arduino UNO motor direction: ${
                            statement.direction
                        }`
                    );
                }

                const pwmValue = Math.round(
                    statement.speedPercent * 255 / 100
                );

                lines.push(
                    `${indent}analogWrite(MOTOR${statement.motor}_PWM, 0);`
                );

                if (pwmValue === 0) {
                    lines.push(
                        `${indent}digitalWrite(MOTOR${statement.motor}_IN1, LOW);`,
                        `${indent}digitalWrite(MOTOR${statement.motor}_IN2, LOW);`
                    );
                } else if (statement.direction === 0) {
                    lines.push(
                        `${indent}digitalWrite(MOTOR${statement.motor}_IN1, HIGH);`,
                        `${indent}digitalWrite(MOTOR${statement.motor}_IN2, LOW);`
                    );
                } else {
                    lines.push(
                        `${indent}digitalWrite(MOTOR${statement.motor}_IN1, LOW);`,
                        `${indent}digitalWrite(MOTOR${statement.motor}_IN2, HIGH);`
                    );
                }

                lines.push(
                    `${indent}analogWrite(MOTOR${statement.motor}_PWM, ${pwmValue});`
                );
                break;
            }

            case 'MotorStop':
                lines.push(
                    `${indent}analogWrite(MOTOR${statement.motor}_PWM, 0);`,
                    `${indent}digitalWrite(MOTOR${statement.motor}_IN1, LOW);`,
                    `${indent}digitalWrite(MOTOR${statement.motor}_IN2, LOW);`
                );
                break;

            case 'ServoWrite':
                lines.push(
                    `${indent}if (!servo${statement.pin}.attached()) {`,
                    `${indent}    servo${statement.pin}.attach(${statement.pin});`,
                    `${indent}}`,
                    `${indent}servo${statement.pin}.write(${statement.angle});`
                );
                break;

            case 'RelayWrite':
                lines.push(
                    `${indent}digitalWrite(${statement.pin}, ${
                        statement.state ? 'HIGH' : 'LOW'
                    });`
                );
                break;

            case 'SerialBegin':
                lines.push(
                    `${indent}Serial.begin(${statement.baud});`
                );
                break;

            case 'VariableSet': {
                const variable = this._getVariableGeneratorInfo(
                    statement.variableId
                );

                lines.push(
                    `${indent}${variable.identifier} = ${
                        this._generateExpression(statement.value)
                    };`
                );

                break;
            }

            case 'VariableChange': {
                const variable = this._getVariableGeneratorInfo(
                    statement.variableId
                );

                lines.push(
                    `${indent}${variable.identifier} += ${
                        this._generateExpression(statement.value)
                    };`
                );

                break;
            }

            case 'ListAdd': {
                const list = this._getListGeneratorInfo(
                    statement.listId
                );

                const item = this._generateExpression(
                    statement.item
                );

                lines.push(
                    `${indent}if (${list.lengthIdentifier} < ${
                        list.declaration.capacity
                    }) {`,
                    `${indent}    ${list.identifier}[${
                        list.lengthIdentifier
                    }] = ${item};`,
                    `${indent}    ++${list.lengthIdentifier};`,
                    `${indent}}`
                );

                break;
            }

            case 'ListInsert': {
                const list = this._getListGeneratorInfo(
                    statement.listId
                );

                const indexIdentifier = identifiers.allocate(
                    'listIndex'
                );

                const shiftIdentifier = identifiers.allocate(
                    'listShift'
                );

                const index = this._generateExpression(
                    statement.index
                );

                const item = this._generateExpression(
                    statement.item
                );

                lines.push(
                    `${indent}{`,
                    `${indent}    long ${indexIdentifier} = ` +
                    `easybloxScratchListIndex(${index});`,
                    `${indent}    if (`,
                    `${indent}        ${list.lengthIdentifier} < ${
                        list.declaration.capacity
                    } &&`,
                    `${indent}        ${indexIdentifier} >= 1 &&`,
                    `${indent}        ${indexIdentifier} <= ` +
                    `static_cast<long>(${list.lengthIdentifier}) + 1`,
                    `${indent}    ) {`,
                    `${indent}        for (`,
                    `${indent}            size_t ${shiftIdentifier} = ${
                        list.lengthIdentifier
                    };`,
                    `${indent}            ${shiftIdentifier} > ` +
                    `static_cast<size_t>(${indexIdentifier} - 1);`,
                    `${indent}            --${shiftIdentifier}`,
                    `${indent}        ) {`,
                    `${indent}            ${list.identifier}[${
                        shiftIdentifier
                    }] = ${list.identifier}[${shiftIdentifier} - 1];`,
                    `${indent}        }`,
                    `${indent}        ${list.identifier}[${
                        indexIdentifier
                    } - 1] = ${item};`,
                    `${indent}        ++${list.lengthIdentifier};`,
                    `${indent}    }`,
                    `${indent}}`
                );

                break;
            }

            case 'ListReplace': {
                const list = this._getListGeneratorInfo(
                    statement.listId
                );

                const indexIdentifier = identifiers.allocate(
                    'listIndex'
                );

                const index = this._generateExpression(
                    statement.index
                );

                const item = this._generateExpression(
                    statement.item
                );

                lines.push(
                    `${indent}{`,
                    `${indent}    long ${indexIdentifier} = ` +
                    `easybloxScratchListIndex(${index});`,
                    `${indent}    if (`,
                    `${indent}        ${indexIdentifier} >= 1 &&`,
                    `${indent}        ${indexIdentifier} <= ` +
                    `static_cast<long>(${list.lengthIdentifier})`,
                    `${indent}    ) {`,
                    `${indent}        ${list.identifier}[${
                        indexIdentifier
                    } - 1] = ${item};`,
                    `${indent}    }`,
                    `${indent}}`
                );

                break;
            }

            case 'ListDelete': {
                const list = this._getListGeneratorInfo(
                    statement.listId
                );

                const indexIdentifier = identifiers.allocate(
                    'listIndex'
                );

                const shiftIdentifier = identifiers.allocate(
                    'listShift'
                );

                const index = this._generateExpression(
                    statement.index
                );

                lines.push(
                    `${indent}{`,
                    `${indent}    long ${indexIdentifier} = ` +
                    `easybloxScratchListIndex(${index});`,
                    `${indent}    if (`,
                    `${indent}        ${indexIdentifier} >= 1 &&`,
                    `${indent}        ${indexIdentifier} <= ` +
                    `static_cast<long>(${list.lengthIdentifier})`,
                    `${indent}    ) {`,
                    `${indent}        for (`,
                    `${indent}            size_t ${shiftIdentifier} = ` +
                    `static_cast<size_t>(${indexIdentifier} - 1);`,
                    `${indent}            ${shiftIdentifier} + 1 < ${
                        list.lengthIdentifier
                    };`,
                    `${indent}            ++${shiftIdentifier}`,
                    `${indent}        ) {`,
                    `${indent}            ${list.identifier}[${
                        shiftIdentifier
                    }] = ${list.identifier}[${shiftIdentifier} + 1];`,
                    `${indent}        }`,
                    `${indent}        --${list.lengthIdentifier};`,
                    `${indent}    }`,
                    `${indent}}`
                );

                break;
            }

            case 'ListDeleteAll': {
                const list = this._getListGeneratorInfo(
                    statement.listId
                );

                lines.push(
                    `${indent}${list.lengthIdentifier} = 0;`
                );

                break;
            }

            case 'ProcedureCall': {
                const procedure = this._getProcedureGeneratorInfo(
                    statement.procedureId
                );

                const argumentsByParameterId = new Map();

                for (
                    const argument of
                    Array.isArray(statement.arguments) ?
                        statement.arguments :
                        []
                ) {
                    argumentsByParameterId.set(
                        argument.parameterId,
                        argument
                    );
                }

                const generatedArguments = (
                    Array.isArray(procedure.declaration.parameters) ?
                        procedure.declaration.parameters :
                        []
                ).map(parameter => {
                    const argument = argumentsByParameterId.get(
                        parameter.id
                    );

                    if (!argument) {
                        throw new Error(
                            `Missing Arduino UNO procedure argument: ${
                                parameter.id
                            }`
                        );
                    }

                    return this._generateExpression(
                        argument.value
                    );
                });

                lines.push(
                    `${indent}${procedure.identifier}(` +
                    `${generatedArguments.join(', ')});`
                );

                break;
            }

            case 'SerialWrite':
                lines.push(
                    `${indent}Serial.print(${
                        this._generateExpression(statement.value)
                    });`
                );
                break;

            case 'SerialWriteLine':
                lines.push(
                    `${indent}Serial.println(${
                        this._generateExpression(statement.value)
                    });`
                );
                break;

            case 'Wait': {
                const duration = statement.duration;

                if (
                    duration &&
                    (
                        duration.type === 'IntegerLiteral' ||
                        duration.type === 'DecimalLiteral'
                    )
                ) {
                    const milliseconds = Math.max(
                        0,
                        duration.value * 1000
                    );

                    lines.push(
                        `${indent}delay(${milliseconds});`
                    );
                    break;
                }

                const durationExpression = this._generateExpression(
                    duration
                );

                const identifier = identifiers.allocate(
                    'waitSeconds'
                );

                lines.push(
                    `${indent}{`,
                    `${indent}    float ${identifier} = ${durationExpression};`,
                    `${indent}    if (${identifier} < 0) {`,
                    `${indent}        ${identifier} = 0;`,
                    `${indent}    }`,
                    `${indent}    delay(${identifier} * 1000);`,
                    `${indent}}`
                );
                break;
            }

            case 'Repeat': {
                const identifier = this._getRepeatIdentifier(
                    repeatDepth
                );

                const timesExpression = this._generateExpression(
                    statement.times
                );

                lines.push(
                    `${indent}for (int ${identifier} = 0; ` +
                    `${identifier} < ${timesExpression}; ` +
                    `++${identifier}) {`
                );

                this._generateStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    indentLevel + 1,
                    identifiers,
                    lines,
                    repeatDepth + 1
                );

                lines.push(`${indent}}`);
                break;
            }

            case 'WaitUntil': {
                const conditionExpression = this._generateExpression(
                    statement.condition
                );

                lines.push(
                    `${indent}while (!${conditionExpression}) {`
                );

                lines.push(`${indent}}`);
                break;
            }

            case 'RepeatUntil': {
                const conditionExpression = this._generateExpression(
                    statement.condition
                );

                lines.push(
                    `${indent}while (!${conditionExpression}) {`
                );

                this._generateStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    indentLevel + 1,
                    identifiers,
                    lines,
                    repeatDepth
                );

                lines.push(`${indent}}`);
                break;
            }

            case 'If': {
                const conditionExpression = this._generateExpression(
                    statement.condition
                );

                lines.push(
                    `${indent}if (${conditionExpression}) {`
                );

                this._generateStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    indentLevel + 1,
                    identifiers,
                    lines,
                    repeatDepth
                );

                lines.push(`${indent}}`);
                break;
            }

            case 'IfElse': {
                const conditionExpression = this._generateExpression(
                    statement.condition
                );

                lines.push(
                    `${indent}if (${conditionExpression}) {`
                );

                this._generateStatements(
                    Array.isArray(statement.thenBody) ?
                        statement.thenBody :
                        [],
                    indentLevel + 1,
                    identifiers,
                    lines,
                    repeatDepth
                );

                lines.push(`${indent}} else {`);

                this._generateStatements(
                    Array.isArray(statement.elseBody) ?
                        statement.elseBody :
                        [],
                    indentLevel + 1,
                    identifiers,
                    lines,
                    repeatDepth
                );

                lines.push(`${indent}}`);
                break;
            }

            default:
                throw new Error(
                    `Unsupported Arduino UNO IR statement: ${
                        statement.type
                    }`
                );
            }
        }
    }

    /**
     * Get a pedagogical C++ identifier for a Repeat loop.
     * Identifiers are determined by Repeat nesting depth, not indentation.
     * @param {number} repeatDepth Current nested Repeat depth.
     * @returns {string} Pedagogical loop identifier.
     * @private
     */
    _getRepeatIdentifier (repeatDepth) {
        const repeatIdentifiers = 'ijklmnopqrstuvwxyz';

        if (
            !Number.isInteger(repeatDepth) ||
            repeatDepth < 0
        ) {
            throw new Error(
                `Invalid Arduino UNO Repeat depth: ${repeatDepth}`
            );
        }

        if (repeatDepth < repeatIdentifiers.length) {
            return repeatIdentifiers[repeatDepth];
        }

        return `i${repeatDepth}`;
    }

    /**
     * Generate Arduino C++ for an EasyBlox expression.
     *
     * Numeric values are temporarily supported for compatibility with
     * the A3 Repeat IR. Structured expressions are generated recursively.
     *
     * @param {number|object} expression EasyBlox expression IR.
     * @returns {string} Arduino C++ expression.
     * @private
     */
    _generateExpression (expression) {
        /*
        * Preserve compatibility with the A3 IR while direct Repeat
        * literals are still represented as raw numbers.
        */
        if (typeof expression === 'number') {
            if (!Number.isFinite(expression)) {
                throw new Error(
                    'Invalid Arduino UNO numeric expression'
                );
            }

            return String(expression);
        }

        if (!expression || typeof expression !== 'object') {
            throw new Error(
                'Invalid Arduino UNO Upload expression'
            );
        }

        switch (expression.type) {
        case 'IntegerLiteral':
        case 'DecimalLiteral': {
            const numericValue = Number(expression.value);

            if (!Number.isFinite(numericValue)) {
                throw new Error(
                    'Invalid Arduino UNO numeric literal'
                );
            }

            return String(numericValue);
        }

        case 'TextLiteral':
            return `"${this._escapeCppStringLiteral(expression.value)}"`;

        case 'BooleanLiteral':
            return expression.value ? 'true' : 'false';

        case 'DigitalReadExpression':
            return `(digitalRead(${expression.pin}) == HIGH)`;

        case 'AnalogReadExpression':
            return `analogRead(${this._generateAnalogPin(expression.pin)})`;

        case 'UltrasonicReadExpression':
            return `easybloxUltrasonicRead(${
                expression.trigPin
            }, ${expression.echoPin})`;

        case 'DhtReadExpression':
            if (expression.reading === 'temperature') {
                return `easybloxDhtTemperature(${expression.pin})`;
            }

            if (expression.reading === 'humidity') {
                return `easybloxDhtHumidity(${expression.pin})`;
            }

            throw new Error(
                `Unsupported Arduino UNO DHT reading: ${
                    expression.reading
                }`
            );

        case 'JoystickValueExpression': {
            if (!this._joystickConfiguration) {
                throw new Error(
                    'Joystick must be initialized before use'
                );
            }

            let pin;

            if (expression.axis === 'X') {
                pin = this._joystickConfiguration.xPin;
            } else if (expression.axis === 'Y') {
                pin = this._joystickConfiguration.yPin;
            } else {
                throw new Error(
                    `Unsupported Arduino UNO joystick axis: ${
                        expression.axis
                    }`
                );
            }

            return `analogRead(${
                this._generateAnalogPin(pin)
            })`;
        }

        case 'JoystickClickedExpression':
            if (!this._joystickConfiguration) {
                throw new Error(
                    'Joystick must be initialized before use'
                );
            }

            return `(digitalRead(${
                this._joystickConfiguration.clickPin
            }) == LOW)`;

        case 'TimerReadExpression':
            return '((millis() - easyblox_timer_reset_at) / 1000.0)';

        case 'VariableReference':
            return this._getVariableGeneratorInfo(
                expression.variableId
            ).identifier;

        case 'ProcedureArgumentReference': {
            if (
                !this._currentProcedureParameterIdentifiers ||
                !this._currentProcedureParameterIdentifiers.has(
                    expression.parameterId
                )
            ) {
                throw new Error(
                    `Unknown Arduino UNO procedure argument: ${
                        expression.parameterId
                    }`
                );
            }

            return this._currentProcedureParameterIdentifiers.get(
                expression.parameterId
            );
        }

        case 'ListItemExpression': {
            const list = this._getListGeneratorInfo(
                expression.listId
            );

            return `easybloxListItem(` +
                `${list.identifier}, ` +
                `${list.lengthIdentifier}, ` +
                `${this._generateExpression(expression.index)}` +
                `)`;
        }

        case 'ListIndexOfExpression': {
            const list = this._getListGeneratorInfo(
                expression.listId
            );

            return `easybloxListIndexOf(` +
                `${list.identifier}, ` +
                `${list.lengthIdentifier}, ` +
                `${this._generateExpression(expression.item)}` +
                `)`;
        }

        case 'ListLengthExpression':
            return this._getListGeneratorInfo(
                expression.listId
            ).lengthIdentifier;

        case 'ListContainsExpression': {
            const list = this._getListGeneratorInfo(
                expression.listId
            );

            return `easybloxListContains(` +
                `${list.identifier}, ` +
                `${list.lengthIdentifier}, ` +
                `${this._generateExpression(expression.item)}` +
                `)`;
        }

        case 'ListContentsExpression': {
            const list = this._getListGeneratorInfo(
                expression.listId
            );

            return `easybloxListContents(` +
                `${list.identifier}, ` +
                `${list.lengthIdentifier}` +
                `)`;
        }

        case 'BinaryExpression': {
            const left = this._generateExpression(expression.left);
            const right = this._generateExpression(expression.right);

            switch (expression.operator) {
            case 'Add':
                return `(${left} + ${right})`;

            case 'Subtract':
                return `(${left} - ${right})`;

            case 'Multiply':
                return `(${left} * ${right})`;

            case 'Mod':
                return `scratchMod(${left}, ${right})`;

            case 'Random':
                return `scratchRandom(${left}, ${right})`;

            case 'Divide':
                return `(` +
                    `static_cast<double>(${left}) / ` +
                    `static_cast<double>(${right})` +
                    `)`;

            case 'LessThan':
                return `(${left} < ${right})`;

            case 'Equals':
                return `(${left} == ${right})`;

            case 'GreaterThan':
                return `(${left} > ${right})`;

            case 'And':
                return `(${left} && ${right})`;

            case 'Or':
                return `(${left} || ${right})`;

            case 'LetterOf':
                return `unicodeLetterOf(${
                    this._generateTextCoercion(expression.right)
                }, ${left})`;

            case 'Join':
                return `(${
                    this._generateTextCoercion(expression.left)
                } + ${
                    this._generateTextCoercion(expression.right)
                })`;

            case 'Contains':
                return `stringContainsIgnoreCase(${
                    this._generateTextCoercion(expression.left)
                }, ${
                    this._generateTextCoercion(expression.right)
                })`;

            default:
                throw new Error(
                    `Unsupported Arduino UNO Upload binary operator: ${
                        expression.operator
                    }`
                );
            }
        }

        case 'UnaryExpression': {
            const operand = this._generateExpression(
                expression.operand
            );

            switch (expression.operator) {
            case 'Round':
                return `floor(${operand} + 0.5)`;

            case 'MathOp':
                return this._generateMathOpExpression(
                    expression.mathOperator,
                    operand
                );

            default:
                return this._generateUnaryExpression(expression);
            }
        }

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload expression type: ${
                    expression.type
                }`
            );
        }
    }

    /**
     * Generate a Scratch mathematical operator as Arduino C++.
     * Scratch angles are expressed in degrees.
     * @param {string} operator Scratch math operator.
     * @param {string} operand Generated numeric operand.
     * @returns {string} Generated C++ expression.
     * @private
     */
    _generateMathOpExpression (operator, operand) {
        switch (operator) {
        case 'abs':
            return `fabs(${operand})`;

        case 'floor':
            return `floor(${operand})`;

        case 'ceiling':
            return `ceil(${operand})`;

        case 'sqrt':
            return `sqrt(${operand})`;

        case 'sin':
            return `sin(${operand} * PI / 180.0)`;

        case 'cos':
            return `cos(${operand} * PI / 180.0)`;

        case 'tan':
            return `tan(${operand} * PI / 180.0)`;

        case 'asin':
            return `(asin(${operand}) * 180.0 / PI)`;

        case 'acos':
            return `(acos(${operand}) * 180.0 / PI)`;

        case 'atan':
            return `(atan(${operand}) * 180.0 / PI)`;

        case 'ln':
            return `log(${operand})`;

        case 'log':
            return `log10(${operand})`;

        case 'e ^':
            return `exp(${operand})`;

        case '10 ^':
            return `pow(10, ${operand})`;

        default:
            return '0';
        }
    }


    /**
     * Generate an Arduino String coercion preserving Scratch text semantics.
     * @param {object} expression EasyBlox expression IR.
     * @returns {string} C++ expression producing Arduino String.
     * @private
     */
    _generateTextCoercion (expression) {
        const generated = this._generateExpression(expression);

        if (this._isBooleanExpression(expression)) {
            return `String(${generated} ? "true" : "false")`;
        }

        return `String(${generated})`;
    }

    /**
     * Check whether an EasyBlox expression produces a boolean value.
     * @param {object} expression EasyBlox expression IR.
     * @returns {boolean} True when the expression result is boolean.
     * @private
     */
    _isBooleanExpression (expression) {
        if (!expression || typeof expression !== 'object') {
            return false;
        }

        if (
            expression.type === 'BooleanLiteral' ||
            expression.type === 'DigitalReadExpression' ||
            expression.type === 'ListContainsExpression'
        ) {
            return true;
        }

        if (expression.type === 'VariableReference') {
            const variable = this._getVariableGeneratorInfo(
                expression.variableId
            );

            return (
                variable.declaration.valueType ===
                VALUE_TYPES.BOOLEAN
            );
        }

        if (expression.type === 'ListItemExpression') {
            const list = this._getListGeneratorInfo(
                expression.listId
            );

            return (
                list.declaration.itemType ===
                VALUE_TYPES.BOOLEAN
            );
        }

        if (
            expression.type === 'ProcedureArgumentReference' &&
            this._currentProcedureParameterIdentifiers
        ) {
            /*
            * Argument type is resolved from the active procedure declaration.
            */
            for (const procedure of this._proceduresById.values()) {
                for (
                    const parameter of
                    Array.isArray(procedure.declaration.parameters) ?
                        procedure.declaration.parameters :
                        []
                ) {
                    if (
                        parameter.id === expression.parameterId &&
                        parameter.valueType === VALUE_TYPES.BOOLEAN
                    ) {
                        return true;
                    }
                }
            }
        }

        if (expression.type === 'BinaryExpression') {
            return [
                'LessThan',
                'Equals',
                'GreaterThan',
                'And',
                'Or',
                'Contains'
            ].includes(expression.operator);
        }

        return (
            expression.type === 'UnaryExpression' &&
            expression.operator === 'Not'
        );
    }

    /**
     * Escape a value for use inside a C++ string literal.
     * @param {*} value Value to escape.
     * @returns {string} Escaped C++ string content without surrounding quotes.
     * @private
     */
    _escapeCppStringLiteral (value) {
        return String(value)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
    }

    /**
     * Generate Arduino notation for an analog pin.
     * EasyBlox stores UNO analog pins canonically as 14..19.
     * @param {number} pin Canonical Arduino UNO analog pin.
     * @returns {string} Arduino analog pin notation.
     * @private
     */
    _generateAnalogPin (pin) {
        if (
            !Number.isInteger(pin) ||
            pin < 14 ||
            pin > 19
        ) {
            throw new Error(
                `Invalid Arduino UNO analog pin: ${pin}`
            );
        }

        return `A${pin - 14}`;
    }

    /**
     * Generate a C++ unary expression.
     * @param {object} expression UnaryExpression IR.
     * @returns {string} Generated C++ expression.
     * @private
     */
    _generateUnaryExpression (expression) {
        const operand = this._generateExpression(
            expression.operand
        );

        switch (expression.operator) {
        case 'Not':
            return `(!${operand})`;

        case 'Length':
            return `unicodeStringLength(${
                this._generateTextCoercion(expression.operand)
            })`;

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload unary operator: ${
                    expression.operator
                }`
            );
        }
    }
}

module.exports = ArduinoUnoGenerator;
