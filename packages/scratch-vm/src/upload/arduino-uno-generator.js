const InternalIdentifierAllocator =
    require('./internal-identifier-allocator');

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

        const motorConfigurations = this._collectMotorConfigurations(
            setupStatements,
            loopStatements
        );

        const usesTimer = this._usesTimer(
            setupStatements,
            loopStatements
        );

        const inputPins = this._collectInputPins(
            setupStatements,
            loopStatements
        );

        const outputPins = this._collectOutputPins(
            setupStatements,
            loopStatements
        );

        const servoPins = this._collectServoPins(
            setupStatements,
            loopStatements
        );

        /*
         * A fresh allocator per generation guarantees deterministic output.
         * Future user-defined identifiers can be supplied as reserved names.
         */
        const identifiers = new InternalIdentifierAllocator();

        const lines = [];

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
        case 'DecimalLiteral':
            if (!Number.isFinite(expression.value)) {
                throw new Error(
                    'Invalid Arduino UNO numeric literal'
                );
            }

            return String(expression.value);

        case 'TextLiteral':
            return `"${this._escapeCppStringLiteral(expression.value)}"`;

        case 'BooleanLiteral':
            return expression.value ? 'true' : 'false';

        case 'DigitalReadExpression':
            return `(digitalRead(${expression.pin}) == HIGH)`;

        case 'AnalogReadExpression':
            return `analogRead(${this._generateAnalogPin(expression.pin)})`;

        case 'TimerReadExpression':
            return '((millis() - easyblox_timer_reset_at) / 1000.0)';

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

            default:
                throw new Error(
                    `Unsupported Arduino UNO Upload binary operator: ${
                        expression.operator
                    }`
                );
            }
        }

        case 'UnaryExpression':
            return this._generateUnaryExpression(expression);

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload expression type: ${
                    expression.type
                }`
            );
        }
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
