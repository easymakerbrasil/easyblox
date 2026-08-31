/**
 * Validate hardware resources used by EasyBlox Upload IR.
 *
 * Hardware capabilities are supplied by the selected BoardProfile so this
 * validator remains independent of a specific board.
 */
class UploadResourceValidator {
    /**
     * @param {object} boardProfile Hardware capabilities of the target board.
     */
    constructor (boardProfile) {
        this.boardProfile = boardProfile;
    }

    /**
     * Validate hardware resources used by an EasyBlox Upload IR program.
     * @param {object} ir EasyBlox Upload IR.
     * @returns {object} The validated IR.
     */
    validate (ir) {
        const setup = Array.isArray(ir.setup) ?
            ir.setup :
            [];

        const loop = Array.isArray(ir.loop) ?
            ir.loop :
            [];

        const procedures = Array.isArray(ir.procedures) ?
            ir.procedures :
            [];

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

        const analysisStatements = [
            ...setup,
            ...loop,
            ...procedureStatements
        ];

        const joystickInitialization =
            setup.find(statement =>
                statement &&
                statement.type === 'JoystickInit'
            ) || null;

        if (joystickInitialization) {
            this._validateJoystickInitialization(
                joystickInitialization
            );
        }

        const configuredMotors = new Set();

        const motorPins = new Set();
        const usedMotors = new Set();

        for (const statement of setup) {
            if (statement.type === 'SerialBegin') {
                const supportedSerialBaudRates =
                    Array.isArray(this.boardProfile.serialBaudRates) ?
                        this.boardProfile.serialBaudRates :
                        [];

                if (!supportedSerialBaudRates.includes(statement.baud)) {
                    throw new Error(
                        'Serial baud rate is not supported by the selected board'
                    );
                }
            }

            if (statement.type === 'MotorConfigure') {
                if (configuredMotors.has(statement.motor)) {
                    throw new Error(
                        'Motor can only be configured once'
                    );
                }

                this._validateMotorConfiguration(statement);

                const configuredMotorPins = [
                    statement.in1Pin,
                    statement.in2Pin,
                    statement.pwmPin
                ];

                if (configuredMotorPins.some(pin => motorPins.has(pin))) {
                    throw new Error(
                        'Motors cannot share pins'
                    );
                }

                configuredMotors.add(statement.motor);

                for (const pin of configuredMotorPins) {
                    motorPins.add(pin);
                }
            }
        }

        this._collectUsedMotors(
            analysisStatements,
            usedMotors
        );

        for (const motor of usedMotors) {
            if (configuredMotors.has(motor)) {
                continue;
            }

            const motorConfiguration =
                this.boardProfile.motors &&
                this.boardProfile.motors[motor];

            if (!motorConfiguration) {
                throw new Error(
                    'Motor is not supported by the selected board'
                );
            }

            if (motorConfiguration) {
                const defaultMotorPins = [
                    motorConfiguration.in1Pin,
                    motorConfiguration.in2Pin,
                    motorConfiguration.pwmPin
                ];

                if (defaultMotorPins.some(pin => motorPins.has(pin))) {
                    throw new Error(
                        'Motors cannot share pins'
                    );
                }

                for (const pin of defaultMotorPins) {
                    motorPins.add(pin);
                }
            }
        }

        const servoPins = new Set();
        const tonePins = new Set();
        const relayPins = new Set();
        const pwmWritePins = new Set();
        const digitalWritePins = new Set();
        const digitalReadPins = new Set();
        const ultrasonicPins = new Set();
        const dhtPins = new Set();

        const displayGpioPins = new Set();
        const displayI2cPins = new Set();

        for (const statement of setup) {
            if (!statement) {
                continue;
            }

            if (statement.type === 'MatrixInit') {
                this._validateMatrixInitialization(statement);

                const matrixPins = [
                    statement.dinPin,
                    statement.csPin,
                    statement.clkPin
                ];

                if (matrixPins.some(pin => displayGpioPins.has(pin))) {
                    throw new Error(
                        'Display GPIO pins cannot be shared'
                    );
                }

                for (const pin of matrixPins) {
                    displayGpioPins.add(pin);
                }
            }

            if (statement.type === 'Tm1637Init') {
                this._validateTm1637Initialization(statement);

                const tm1637Pins = [
                    statement.clkPin,
                    statement.dioPin
                ];

                if (tm1637Pins.some(pin => displayGpioPins.has(pin))) {
                    throw new Error(
                        'Display GPIO pins cannot be shared'
                    );
                }

                for (const pin of tm1637Pins) {
                    displayGpioPins.add(pin);
                }
            }

            if (statement.type === 'LcdInit') {
                const i2c =
                    this.boardProfile &&
                    this.boardProfile.i2c;

                if (
                    !i2c ||
                    !Number.isFinite(i2c.sdaPin) ||
                    !Number.isFinite(i2c.sclPin)
                ) {
                    throw new Error(
                        'I2C is not supported by the selected board'
                    );
                }

                displayI2cPins.add(i2c.sdaPin);
                displayI2cPins.add(i2c.sclPin);
            }
        }

        for (const pin of displayGpioPins) {
            if (displayI2cPins.has(pin)) {
                throw new Error(
                    'Display GPIO and I2C cannot use the same pin'
                );
            }
        }

        this._collectServoAndTonePins(
            analysisStatements,
            servoPins,
            tonePins,
            relayPins
        );

        this._collectPwmWritePins(
            analysisStatements,
            pwmWritePins
        );

        this._collectDigitalWritePins(
            analysisStatements,
            digitalWritePins
        );

        const supportedPwmPins =
            Array.isArray(this.boardProfile.pwmPins) ?
                this.boardProfile.pwmPins :
                [];

        for (const pin of pwmWritePins) {
            if (!supportedPwmPins.includes(pin)) {
                throw new Error(
                    'PWM pin is not supported by the selected board'
                );
            }
        }

        const servoPwmConflictPins =
            Array.isArray(this.boardProfile.servoPwmConflictPins) ?
                this.boardProfile.servoPwmConflictPins :
                [];

        if (servoPins.size > 0) {
            for (const pin of pwmWritePins) {
                if (servoPwmConflictPins.includes(pin)) {
                    throw new Error(
                        'Servo cannot be used with PWM on the selected pin'
                    );
                }
            }
        }

        const supportedTonePins =
            Array.isArray(this.boardProfile.tonePins) ?
                this.boardProfile.tonePins :
                [];

        for (const pin of tonePins) {
            if (!supportedTonePins.includes(pin)) {
                throw new Error(
                    'Tone pin is not supported by the selected board'
                );
            }
        }

        const supportedServoPins =
            Array.isArray(this.boardProfile.servoPins) ?
                this.boardProfile.servoPins :
                [];

        for (const pin of servoPins) {
            if (motorPins.has(pin)) {
                throw new Error(
                    'Motor and Servo cannot use the same pin'
                );
            }
        }

        for (const pin of servoPins) {
            if (digitalWritePins.has(pin)) {
                throw new Error(
                    'DigitalWrite and Servo cannot use the same pin'
                );
            }
        }

        for (const pin of servoPins) {
            if (pwmWritePins.has(pin)) {
                throw new Error(
                    'Servo and PWM cannot use the same pin'
                );
            }
        }

        for (const pin of relayPins) {
            if (pwmWritePins.has(pin)) {
                throw new Error(
                    'Relay and PWM cannot use the same pin'
                );
            }
        }

        for (const pin of tonePins) {
            if (motorPins.has(pin)) {
                throw new Error(
                    'Motor and Tone cannot use the same pin'
                );
            }
        }

        for (const pin of pwmWritePins) {
            if (motorPins.has(pin)) {
                throw new Error(
                    'Motor and PWM cannot use the same pin'
                );
            }
        }

        for (const pin of relayPins) {
            if (motorPins.has(pin)) {
                throw new Error(
                    'Motor and Relay cannot use the same pin'
                );
            }
        }

        for (const pin of servoPins) {
            if (!supportedServoPins.includes(pin)) {
                throw new Error(
                    'Servo pin is not supported by the selected board'
                );
            }
        }

        for (const pin of servoPins) {
            if (tonePins.has(pin)) {
                throw new Error(
                    'Servo and Tone cannot use the same pin'
                );
            }
        }

        for (const pin of servoPins) {
            if (relayPins.has(pin)) {
                throw new Error(
                    'Relay and Servo cannot use the same pin'
                );
            }
        }

        for (const pin of tonePins) {
            if (relayPins.has(pin)) {
                throw new Error(
                    'Relay and Tone cannot use the same pin'
                );
            }
        }

        this._validateStatementExpressions(
            analysisStatements,
            digitalReadPins,
            ultrasonicPins,
            dhtPins
        );

        const displayReservedPins = new Set([
            ...displayGpioPins,
            ...displayI2cPins
        ]);

        const displayConflictPinSets = [
            motorPins,
            servoPins,
            tonePins,
            relayPins,
            pwmWritePins,
            digitalWritePins,
            digitalReadPins,
            ultrasonicPins,
            dhtPins
        ];

        for (const pin of displayReservedPins) {
            if (
                displayConflictPinSets.some(
                    pinSet => pinSet.has(pin)
                )
            ) {
                throw new Error(
                    `Display resource conflict on pin ${pin}`
                );
            }
        }

        if (joystickInitialization) {
            const joystickPins = [
                joystickInitialization.xPin,
                joystickInitialization.yPin,
                joystickInitialization.clickPin
            ];

            if (
                joystickPins.some(
                    pin => displayReservedPins.has(pin)
                )
            ) {
                const conflictPin = joystickPins.find(
                    pin => displayReservedPins.has(pin)
                );

                throw new Error(
                    `Display resource conflict on pin ${conflictPin}`
                );
            }
        }

        for (const pin of ultrasonicPins) {
            if (servoPins.has(pin)) {
                throw new Error(
                    'Ultrasonic and Servo cannot use the same pin'
                );
            }
        }

        for (const pin of ultrasonicPins) {
            if (tonePins.has(pin)) {
                throw new Error(
                    'Ultrasonic and Tone cannot use the same pin'
                );
            }
        }

        for (const pin of dhtPins) {
            if (servoPins.has(pin)) {
                throw new Error(
                    'DHT and Servo cannot use the same pin'
                );
            }

            if (tonePins.has(pin)) {
                throw new Error(
                    'DHT and Tone cannot use the same pin'
                );
            }
        }

        if (joystickInitialization) {
            const joystickPins = [
                joystickInitialization.xPin,
                joystickInitialization.yPin,
                joystickInitialization.clickPin
            ];

            const clickPin =
                joystickInitialization.clickPin;

            if (servoPins.has(clickPin)) {
                throw new Error(
                    'Joystick CLICK and Servo cannot use the same pin'
                );
            }

            if (tonePins.has(clickPin)) {
                throw new Error(
                    'Joystick CLICK and Tone cannot use the same pin'
                );
            }

            if (dhtPins.has(clickPin)) {
                throw new Error(
                    'DHT and Joystick CLICK cannot use the same pin'
                );
            }

            for (const pin of joystickPins) {
                if (digitalWritePins.has(pin)) {
                    throw new Error(
                        'Joystick and DigitalWrite cannot use the same pin'
                    );
                }
            }
        }

        for (const pin of digitalReadPins) {
            if (servoPins.has(pin)) {
                throw new Error(
                    'DigitalRead and Servo cannot use the same pin'
                );
            }
        }

        return ir;
    }

    /**
     * Validate MAX7219 matrix initialization resources.
     * @param {object} statement MatrixInit statement.
     * @returns {void}
     * @private
     */
    _validateMatrixInitialization (statement) {
        const supportedDigitalPins =
            Array.isArray(this.boardProfile.digitalPins) ?
                this.boardProfile.digitalPins :
                [];

        if (!supportedDigitalPins.includes(statement.dinPin)) {
            throw new Error(
                'Matrix DIN pin is not supported by the selected board'
            );
        }

        if (!supportedDigitalPins.includes(statement.csPin)) {
            throw new Error(
                'Matrix CS pin is not supported by the selected board'
            );
        }

        if (!supportedDigitalPins.includes(statement.clkPin)) {
            throw new Error(
                'Matrix CLK pin is not supported by the selected board'
            );
        }

        const pins = [
            statement.dinPin,
            statement.csPin,
            statement.clkPin
        ];

        if (new Set(pins).size !== pins.length) {
            throw new Error(
                'Matrix DIN, CS and CLK pins must be different'
            );
        }
    }

    /**
     * Validate TM1637 initialization resources.
     * @param {object} statement Tm1637Init statement.
     * @returns {void}
     * @private
     */
    _validateTm1637Initialization (statement) {
        const supportedDigitalPins =
            Array.isArray(this.boardProfile.digitalPins) ?
                this.boardProfile.digitalPins :
                [];

        if (!supportedDigitalPins.includes(statement.clkPin)) {
            throw new Error(
                'TM1637 CLK pin is not supported by the selected board'
            );
        }

        if (!supportedDigitalPins.includes(statement.dioPin)) {
            throw new Error(
                'TM1637 DIO pin is not supported by the selected board'
            );
        }

        if (statement.clkPin === statement.dioPin) {
            throw new Error(
                'TM1637 CLK and DIO pins must be different'
            );
        }
    }

    /**
     * Validate expressions used by Upload statements.
     * @param {Array<object>} statements EasyBlox Upload IR statements.
     * @returns {void}
     * @private
     */
    _validateStatementExpressions (
        statements,
        digitalReadPins,
        ultrasonicPins,
        dhtPins
    ) {
        for (const statement of statements) {
            this._validateExpression(
                statement,
                digitalReadPins,
                ultrasonicPins,
                dhtPins
            );
        }
    }

    /**
     * Validate one Upload expression and its nested expressions.
     * @param {object} expression EasyBlox Upload IR expression.
     * @returns {void}
     * @private
     */
    _validateExpression (
        expression,
        digitalReadPins,
        ultrasonicPins,
        dhtPins
    ) {
        if (!expression || typeof expression !== 'object') {
            return;
        }

        if (expression.type === 'DigitalReadExpression') {
            digitalReadPins.add(expression.pin);

            const supportedDigitalPins =
                Array.isArray(this.boardProfile.digitalPins) ?
                    this.boardProfile.digitalPins :
                    [];

            if (!supportedDigitalPins.includes(expression.pin)) {
                throw new Error(
                    'DigitalRead pin is not supported by the selected board'
                );
            }
        }

        if (expression.type === 'AnalogReadExpression') {
            const supportedAnalogPins =
                Array.isArray(this.boardProfile.analogPins) ?
                    this.boardProfile.analogPins :
                    [];

            if (!supportedAnalogPins.includes(expression.pin)) {
                throw new Error(
                    'AnalogRead pin is not supported by the selected board'
                );
            }
        }

        if (expression.type === 'UltrasonicReadExpression') {
            ultrasonicPins.add(expression.trigPin);
            ultrasonicPins.add(expression.echoPin);
            const supportedUltrasonicPins =
                Array.isArray(this.boardProfile.digitalPins) ?
                    this.boardProfile.digitalPins :
                    [];

            if (!supportedUltrasonicPins.includes(expression.trigPin)) {
                throw new Error(
                    'Ultrasonic TRIG pin is not supported by the selected board'
                );
            }

            if (!supportedUltrasonicPins.includes(expression.echoPin)) {
                throw new Error(
                    'Ultrasonic ECHO pin is not supported by the selected board'
                );
            }

            if (expression.trigPin === expression.echoPin) {
                throw new Error(
                    'Ultrasonic TRIG and ECHO pins must be different'
                );
            }
        }

        for (const value of Object.values(expression)) {
            if (Array.isArray(value)) {
                for (const item of value) {
                    this._validateExpression(
                        item,
                        digitalReadPins,
                        ultrasonicPins,
                        dhtPins
                    );
                }
            } else if (value && typeof value === 'object') {
                this._validateExpression(
                    value,
                    digitalReadPins,
                    ultrasonicPins,
                    dhtPins
                );
            }
        }

        if (expression.type === 'DhtReadExpression') {
            dhtPins.add(expression.pin);

            const supportedDhtPins =
                Array.isArray(this.boardProfile.digitalPins) ?
                    this.boardProfile.digitalPins.filter(pin =>
                        pin >= 2 &&
                        pin <= 13
                    ) :
                    [];

            if (!supportedDhtPins.includes(expression.pin)) {
                throw new Error(
                    'DHT pin is not supported by the selected board'
                );
            }
        }
    }

    /**
     * Validate one Arduino joystick hardware configuration.
     * @param {object} statement JoystickInit statement.
     * @returns {void}
     * @private
     */
    _validateJoystickInitialization (statement) {
        const supportedAnalogPins =
            Array.isArray(this.boardProfile.analogPins) ?
                this.boardProfile.analogPins :
                [];

        const supportedDigitalPins =
            Array.isArray(this.boardProfile.digitalPins) ?
                this.boardProfile.digitalPins :
                [];

        if (!supportedAnalogPins.includes(statement.xPin)) {
            throw new Error(
                'Joystick X pin is not supported by the selected board'
            );
        }

        if (!supportedAnalogPins.includes(statement.yPin)) {
            throw new Error(
                'Joystick Y pin is not supported by the selected board'
            );
        }

        if (
            !supportedDigitalPins.includes(statement.clickPin) ||
            statement.clickPin < 2 ||
            statement.clickPin > 13
        ) {
            throw new Error(
                'Joystick CLICK pin is not supported by the selected board'
            );
        }

        if (statement.xPin === statement.yPin) {
            throw new Error(
                'Joystick X and Y pins must be different'
            );
        }
    }

    /**
     * Collect pins used by DigitalWrite statements.
     * @param {Array<object>} statements EasyBlox Upload IR statements.
     * @param {Set<number>} digitalWritePins DigitalWrite pins used by the program.
     * @returns {void}
     * @private
     */
    _collectDigitalWritePins (statements, digitalWritePins) {
        for (const statement of statements) {
            if (statement.type === 'DigitalWrite') {
                digitalWritePins.add(statement.pin);
            }

            if (
                (
                    statement.type === 'Repeat' ||
                    statement.type === 'If'
                ) &&
                Array.isArray(statement.body)
            ) {
                this._collectDigitalWritePins(
                    statement.body,
                    digitalWritePins
                );
            }

            if (statement.type === 'IfElse') {
                if (Array.isArray(statement.thenBody)) {
                    this._collectDigitalWritePins(
                        statement.thenBody,
                        digitalWritePins
                    );
                }

                if (Array.isArray(statement.elseBody)) {
                    this._collectDigitalWritePins(
                        statement.elseBody,
                        digitalWritePins
                    );
                }
            }
        }
    }

    /**
     * Collect PWM pins used by PwmWrite statements.
     * @param {Array<object>} statements EasyBlox Upload IR statements.
     * @param {Set<number>} pwmWritePins PWM pins used by the program.
     * @returns {void}
     * @private
     */
    _collectPwmWritePins (statements, pwmWritePins) {
        for (const statement of statements) {
            if (statement.type === 'PwmWrite') {
                pwmWritePins.add(statement.pin);
            }

            if (
                (
                    statement.type === 'Repeat' ||
                    statement.type === 'If'
                ) &&
                Array.isArray(statement.body)
            ) {
                this._collectPwmWritePins(
                    statement.body,
                    pwmWritePins
                );
            }

            if (statement.type === 'IfElse') {
                if (Array.isArray(statement.thenBody)) {
                    this._collectPwmWritePins(
                        statement.thenBody,
                        pwmWritePins
                    );
                }

                if (Array.isArray(statement.elseBody)) {
                    this._collectPwmWritePins(
                        statement.elseBody,
                        pwmWritePins
                    );
                }
            }
        }
    }

    /**
     * Collect motors used by MotorWrite statements.
     * @param {Array<object>} statements EasyBlox Upload IR statements.
     * @param {Set<number>} usedMotors Motor numbers used by the program.
     * @returns {void}
     * @private
     */
    _collectUsedMotors (statements, usedMotors) {
        for (const statement of statements) {
            if (
                statement.type === 'MotorWrite' ||
                statement.type === 'MotorStop'
            ) {
                usedMotors.add(statement.motor);
            }

            if (
                (
                    statement.type === 'Repeat' ||
                    statement.type === 'If'
                ) &&
                Array.isArray(statement.body)
            ) {
                this._collectUsedMotors(
                    statement.body,
                    usedMotors
                );
            }

            if (statement.type === 'IfElse') {
                if (Array.isArray(statement.thenBody)) {
                    this._collectUsedMotors(
                        statement.thenBody,
                        usedMotors
                    );
                }

                if (Array.isArray(statement.elseBody)) {
                    this._collectUsedMotors(
                        statement.elseBody,
                        usedMotors
                    );
                }
            }
        }
    }

    /**
     * Collect Servo and Tone pin usage from Upload statements.
     * @param {Array<object>} statements EasyBlox Upload IR statements.
     * @param {Set<number>} servoPins Servo pins found in the program.
     * @param {Set<number>} tonePins Tone pins found in the program.
     * @returns {void}
     * @private
     */
    _collectServoAndTonePins (statements, servoPins, tonePins, relayPins) {
        for (const statement of statements) {
            if (statement.type === 'ServoWrite') {
                servoPins.add(statement.pin);

                const servoAngleRange = this.boardProfile.servoAngleRange;

                if (
                    servoAngleRange &&
                    (
                        statement.angle < servoAngleRange.min ||
                        statement.angle > servoAngleRange.max
                    )
                ) {
                    throw new Error(
                        'Servo angle is not supported by the selected board'
                    );
                }
            }

            if (statement.type === 'ToneStart') {
                tonePins.add(statement.pin);

                const toneFrequencyRange =
                    this.boardProfile.toneFrequencyRange;

                if (
                    toneFrequencyRange &&
                    (
                        statement.frequency < toneFrequencyRange.min ||
                        statement.frequency > toneFrequencyRange.max
                    )
                ) {
                    throw new Error(
                        'Tone frequency is not supported by the selected board'
                    );
                }
            }

            if (statement.type === 'ToneStop') {
                const supportedTonePins =
                    Array.isArray(this.boardProfile.tonePins) ?
                        this.boardProfile.tonePins :
                        [];

                if (!supportedTonePins.includes(statement.pin)) {
                    throw new Error(
                        'Tone pin is not supported by the selected board'
                    );
                }
            }

            if (statement.type === 'RelayWrite') {
                relayPins.add(statement.pin);

                const digitalPins =
                    Array.isArray(this.boardProfile.digitalPins) ?
                        this.boardProfile.digitalPins :
                        [];

                if (!digitalPins.includes(statement.pin)) {
                    throw new Error(
                        'Relay pin is not supported by the selected board'
                    );
                }
            }

            if (statement.type === 'DigitalWrite') {
                const supportedDigitalPins =
                    Array.isArray(this.boardProfile.digitalPins) ?
                        this.boardProfile.digitalPins :
                        [];

                if (!supportedDigitalPins.includes(statement.pin)) {
                    throw new Error(
                        'DigitalWrite pin is not supported by the selected board'
                    );
                }
            }

            if (
                (
                    statement.type === 'Repeat' ||
                    statement.type === 'If'
                ) &&
                Array.isArray(statement.body)
            ) {
                this._collectServoAndTonePins(
                    statement.body,
                    servoPins,
                    tonePins,
                    relayPins
                );
            }

            if (statement.type === 'IfElse') {
                if (Array.isArray(statement.thenBody)) {
                    this._collectServoAndTonePins(
                        statement.thenBody,
                        servoPins,
                        tonePins,
                        relayPins
                    );
                }

                if (Array.isArray(statement.elseBody)) {
                    this._collectServoAndTonePins(
                        statement.elseBody,
                        servoPins,
                        tonePins,
                        relayPins
                    );
                }
            }
        }
    }

    /**
     * Validate one declarative motor configuration.
     * @param {object} statement MotorConfigure IR statement.
     * @returns {void}
     * @private
     */
    _validateMotorConfiguration (statement) {

        const motors = this.boardProfile.motors || {};

        if (!Object.prototype.hasOwnProperty.call(
            motors,
            statement.motor
        )) {
            throw new Error(
                'Motor is not supported by the selected board'
            );
        }

        const digitalPins = Array.isArray(this.boardProfile.digitalPins) ?
            this.boardProfile.digitalPins :
            [];

        const pwmPins = Array.isArray(this.boardProfile.pwmPins) ?
            this.boardProfile.pwmPins :
            [];

        if (!digitalPins.includes(statement.in1Pin)) {
            throw new Error(
                'Motor IN1 pin is not supported by the selected board'
            );
        }

        if (!digitalPins.includes(statement.in2Pin)) {
            throw new Error(
                'Motor IN2 pin is not supported by the selected board'
            );
        }

        if (!pwmPins.includes(statement.pwmPin)) {
            throw new Error(
                'Motor PWM pin is not supported by the selected board'
            );
        }

        if (
            statement.in1Pin === statement.in2Pin ||
            statement.in1Pin === statement.pwmPin ||
            statement.in2Pin === statement.pwmPin
        ) {
            throw new Error(
                'Motor pins must be different'
            );
        }
    }
}

module.exports = UploadResourceValidator;
