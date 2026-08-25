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
            [...setup, ...loop],
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

        this._collectServoAndTonePins(
            [...setup, ...loop],
            servoPins,
            tonePins,
            relayPins
        );

        this._collectPwmWritePins(
            [...setup, ...loop],
            pwmWritePins
        );

        this._collectDigitalWritePins(
            [...setup, ...loop],
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
            [
                ...setup,
                ...loop
            ],
            digitalReadPins
        );

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
     * Validate expressions used by Upload statements.
     * @param {Array<object>} statements EasyBlox Upload IR statements.
     * @returns {void}
     * @private
     */
    _validateStatementExpressions (statements, digitalReadPins) {
        for (const statement of statements) {
            if (
                (
                    statement.type === 'WaitUntil' ||
                    statement.type === 'RepeatUntil' ||
                    statement.type === 'If' ||
                    statement.type === 'IfElse'
                ) &&
                statement.condition
            ) {
                this._validateExpression(
                    statement.condition,
                    digitalReadPins
                );
            }

            if (
                (
                    statement.type === 'Repeat' ||
                    statement.type === 'RepeatUntil' ||
                    statement.type === 'If'
                ) &&
                Array.isArray(statement.body)
            ) {
                this._validateStatementExpressions(
                    statement.body,
                    digitalReadPins
                );
            }

            if (statement.type === 'IfElse') {
                if (Array.isArray(statement.thenBody)) {
                    this._validateStatementExpressions(
                        statement.thenBody,
                        digitalReadPins
                    );
                }

                if (Array.isArray(statement.elseBody)) {
                    this._validateStatementExpressions(
                        statement.elseBody,
                        digitalReadPins
                    );
                }
            }
        }
    }

    /**
     * Validate one Upload expression and its nested expressions.
     * @param {object} expression EasyBlox Upload IR expression.
     * @returns {void}
     * @private
     */
    _validateExpression (expression, digitalReadPins) {
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

        for (const value of Object.values(expression)) {
            if (Array.isArray(value)) {
                for (const item of value) {
                    this._validateExpression(
                        item,
                        digitalReadPins
                    );
                }
            } else if (value && typeof value === 'object') {
                this._validateExpression(
                    value,
                    digitalReadPins
                );
            }
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
