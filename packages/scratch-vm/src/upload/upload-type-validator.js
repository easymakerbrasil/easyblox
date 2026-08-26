const VALUE_TYPES = Object.freeze({
    INTEGER: 'INTEGER',
    DECIMAL: 'DECIMAL',
    TEXT: 'TEXT',
    BOOLEAN: 'BOOLEAN'
});

/**
 * Validate semantic value types in EasyBlox Upload IR.
 */
class UploadTypeValidator {
    /**
     * Validate an EasyBlox Upload IR program.
     * @param {object} ir EasyBlox Upload IR.
     * @returns {object} The validated IR.
     */
    validate (ir) {
        this._validateStatements(
            Array.isArray(ir.setup) ? ir.setup : []
        );

        this._validateStatements(
            Array.isArray(ir.loop) ? ir.loop : []
        );

        return ir;
    }

    /**
     * Validate a list of semantic IR statements recursively.
     * @param {Array<object>} statements IR statements.
     * @private
     */
    _validateStatements (statements) {
        for (const statement of statements) {
            switch (statement.type) {
            case 'DigitalWrite':
            case 'PwmWrite':
            case 'ToneStart':
            case 'ToneStop':
            case 'TimerReset':
            case 'MotorConfigure':
            case 'MotorWrite':
            case 'MotorStop':
            case 'ServoWrite':
            case 'RelayWrite':
            case 'SerialBegin':
                break;

            case 'SerialWrite':
            case 'SerialWriteLine': {
                const valueType = this._inferExpressionType(
                    statement.value
                );

                if (valueType !== VALUE_TYPES.TEXT) {
                    throw new Error(
                        'Serial write value must be Texto'
                    );
                }

                break;
            }

            case 'Wait': {
                const durationType = this._inferExpressionType(
                    statement.duration
                );

                if (
                    durationType !== VALUE_TYPES.INTEGER &&
                    durationType !== VALUE_TYPES.DECIMAL
                ) {
                    throw new Error(
                        'Wait duration must be numeric'
                    );
                }

                break;
            }

            case 'WaitUntil': {
                const conditionType = this._inferExpressionType(
                    statement.condition
                );

                if (conditionType !== VALUE_TYPES.BOOLEAN) {
                    throw new Error(
                        'WaitUntil condition must be Boolean'
                    );
                }

                break;
            }

            case 'RepeatUntil': {
                const conditionType = this._inferExpressionType(
                    statement.condition
                );

                if (conditionType !== VALUE_TYPES.BOOLEAN) {
                    throw new Error(
                        'RepeatUntil condition must be Boolean'
                    );
                }

                this._validateStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        []
                );

                break;
            }

            case 'Repeat': {
                const timesType = this._inferExpressionType(
                    statement.times
                );

                if (timesType !== VALUE_TYPES.INTEGER) {
                    throw new Error(
                        'Repeat count must be Número inteiro'
                    );
                }

                this._validateStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        []
                );
                break;
            }

            case 'If': {
                const conditionType = this._inferExpressionType(
                    statement.condition
                );

                if (conditionType !== VALUE_TYPES.BOOLEAN) {
                    throw new Error(
                        'If condition must be Boolean'
                    );
                }

                this._validateStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        []
                );
                break;
            }

            case 'IfElse': {
                const conditionType = this._inferExpressionType(
                    statement.condition
                );

                if (conditionType !== VALUE_TYPES.BOOLEAN) {
                    throw new Error(
                        'IfElse condition must be Boolean'
                    );
                }

                this._validateStatements(
                    Array.isArray(statement.thenBody) ?
                        statement.thenBody :
                        []
                );

                this._validateStatements(
                    Array.isArray(statement.elseBody) ?
                        statement.elseBody :
                        []
                );

                break;
            }

            default:
                throw new Error(
                    `Unsupported Arduino UNO IR statement type: ${
                        statement.type
                    }`
                );
            }
        }
    }

    /**
     * Infer the pedagogical type of an Upload expression.
     * @param {*} expression EasyBlox expression IR or legacy literal.
     * @returns {string} VALUE_TYPES member.
     * @private
     */
    _inferExpressionType (expression) {
        /*
         * Preserve compatibility with A3 while Repeat.times is still
         * represented directly as a numeric literal.
         */
        if (typeof expression === 'number') {
            return Number.isInteger(expression) ?
                VALUE_TYPES.INTEGER :
                VALUE_TYPES.DECIMAL;
        }

        if (!expression || typeof expression !== 'object') {
            throw new Error('Invalid Arduino UNO Upload expression');
        }

        switch (expression.type) {
        case 'IntegerLiteral':
            return VALUE_TYPES.INTEGER;

        case 'DecimalLiteral':
            return VALUE_TYPES.DECIMAL;

        case 'TextLiteral':
            return VALUE_TYPES.TEXT;

        case 'BooleanLiteral':
            return VALUE_TYPES.BOOLEAN;

        case 'DigitalReadExpression':
            return VALUE_TYPES.BOOLEAN;

        case 'AnalogReadExpression':
            return VALUE_TYPES.INTEGER;

        case 'TimerReadExpression':
            return VALUE_TYPES.DECIMAL;

        case 'BinaryExpression':
            return this._inferBinaryExpressionType(expression);

        case 'UnaryExpression':
            return this._inferUnaryExpressionType(expression);

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload expression type: ${
                    expression.type
                }`
            );
        }
    }

    /**
     * Infer the result type of a unary expression.
     * @param {object} expression UnaryExpression IR.
     * @returns {string} VALUE_TYPES member.
     * @private
     */
    _inferUnaryExpressionType (expression) {
        const operandType = this._inferExpressionType(
            expression.operand
        );

        switch (expression.operator) {
        case 'Not':
            if (operandType !== VALUE_TYPES.BOOLEAN) {
                throw new Error(
                    'Not operand must be boolean'
                );
            }

            return VALUE_TYPES.BOOLEAN;

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload unary operator: ${
                    expression.operator
                }`
            );
        }
    }

    /**
     * Infer the result type of a binary expression.
     * @param {object} expression BinaryExpression IR.
     * @returns {string} VALUE_TYPES member.
     * @private
     */
    _inferBinaryExpressionType (expression) {
        const leftType = this._inferExpressionType(expression.left);
        const rightType = this._inferExpressionType(expression.right);

        switch (expression.operator) {
        case 'Add':
        case 'Subtract':
        case 'Multiply':
            return this._promoteNumericTypes(
                leftType,
                rightType,
                expression.operator
            );

        case 'Divide':
            this._validateNumericTypes(
                leftType,
                rightType,
                expression.operator
            );
            return VALUE_TYPES.DECIMAL;

        case 'LessThan':
            this._validateNumericTypes(
                leftType,
                rightType,
                expression.operator
            );
            return VALUE_TYPES.BOOLEAN;

        case 'Equals':
            this._validateNumericTypes(
                leftType,
                rightType,
                expression.operator
            );
            return VALUE_TYPES.BOOLEAN;

        case 'GreaterThan':
            this._validateNumericTypes(
                leftType,
                rightType,
                expression.operator
            );
            return VALUE_TYPES.BOOLEAN;

        case 'And':
            this._validateBooleanTypes(
                leftType,
                rightType,
                expression.operator
            );
            return VALUE_TYPES.BOOLEAN;

        case 'Or':
            this._validateBooleanTypes(
                leftType,
                rightType,
                expression.operator
            );
            return VALUE_TYPES.BOOLEAN;

        case 'Join':
            return VALUE_TYPES.TEXT;

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload binary operator: ${
                    expression.operator
                }`
            );
        }
    }

    /**
     * Validate that both operand types are boolean.
     * @param {string} leftType Left operand type.
     * @param {string} rightType Right operand type.
     * @param {string} operator Operator name for diagnostics.
     * @private
     */
    _validateBooleanTypes (leftType, rightType, operator) {
        if (
            leftType !== VALUE_TYPES.BOOLEAN ||
            rightType !== VALUE_TYPES.BOOLEAN
        ) {
            throw new Error(
                `${operator} operands must be boolean`
            );
        }
    }

    /**
     * Validate that both operand types are numeric.
     * @param {string} leftType Left operand type.
     * @param {string} rightType Right operand type.
     * @param {string} operator Operator name for diagnostics.
     * @private
     */
    _validateNumericTypes (leftType, rightType, operator) {
        if (!this._isNumericType(leftType)) {
            throw new Error(
                `${operator} operands must be numeric`
            );
        }

        if (!this._isNumericType(rightType)) {
            throw new Error(
                `${operator} operands must be numeric`
            );
        }
    }

    /**
     * Validate two numeric operands and infer their promoted result type.
     *
     * INTEGER op INTEGER -> INTEGER
     * Any numeric operation involving DECIMAL -> DECIMAL
     *
     * @param {string} leftType Left operand type.
     * @param {string} rightType Right operand type.
     * @param {string} operator Operator name for diagnostics.
     * @returns {string} Promoted numeric VALUE_TYPES member.
     * @private
     */
    _promoteNumericTypes (leftType, rightType, operator) {
        this._validateNumericTypes(
            leftType,
            rightType,
            operator
        );

        return (
            leftType === VALUE_TYPES.DECIMAL ||
            rightType === VALUE_TYPES.DECIMAL
        ) ?
            VALUE_TYPES.DECIMAL :
            VALUE_TYPES.INTEGER;
    }

    /**
     * Check whether a pedagogical value type is numeric.
     * @param {string} valueType VALUE_TYPES member.
     * @returns {boolean} True for INTEGER or DECIMAL.
     * @private
     */
    _isNumericType (valueType) {
        return (
            valueType === VALUE_TYPES.INTEGER ||
            valueType === VALUE_TYPES.DECIMAL
        );
    }
}

UploadTypeValidator.VALUE_TYPES = VALUE_TYPES;

module.exports = UploadTypeValidator;