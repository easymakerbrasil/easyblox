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
        this._variablesById = new Map();
        this._listsById = new Map();
        this._proceduresById = new Map();
        this._currentProcedureParameters = null;

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

        /*
        * Index all symbols before validating expressions so references can be
        * resolved independently of declaration order.
        */
        for (const variable of variables) {
            if (!variable || typeof variable.id !== 'string') {
                throw new Error(
                    'Invalid Arduino UNO Upload variable declaration'
                );
            }

            if (this._variablesById.has(variable.id)) {
                throw new Error(
                    `Duplicate Arduino UNO Upload variable: ${variable.id}`
                );
            }

            if (!this._isKnownValueType(variable.valueType)) {
                throw new Error(
                    `Variable ${variable.id} has invalid type: ${
                        variable.valueType
                    }`
                );
            }

            this._variablesById.set(variable.id, variable);
        }

        for (const list of lists) {
            if (!list || typeof list.id !== 'string') {
                throw new Error(
                    'Invalid Arduino UNO Upload list declaration'
                );
            }

            if (this._listsById.has(list.id)) {
                throw new Error(
                    `Duplicate Arduino UNO Upload list: ${list.id}`
                );
            }

            if (!this._isKnownValueType(list.itemType)) {
                throw new Error(
                    `List ${list.id} has invalid item type: ${
                        list.itemType
                    }`
                );
            }

            if (
                !Number.isInteger(list.capacity) ||
                list.capacity < 1
            ) {
                throw new Error(
                    `List ${list.id} capacity must be a positive integer`
                );
            }

            this._listsById.set(list.id, list);
        }

        for (const procedure of procedures) {
            if (!procedure || typeof procedure.id !== 'string') {
                throw new Error(
                    'Invalid Arduino UNO Upload procedure declaration'
                );
            }

            if (this._proceduresById.has(procedure.id)) {
                throw new Error(
                    `Duplicate Arduino UNO Upload procedure: ${procedure.id}`
                );
            }

            const parameterIds = new Set();

            for (
                const parameter of
                Array.isArray(procedure.parameters) ?
                    procedure.parameters :
                    []
            ) {
                if (!parameter || typeof parameter.id !== 'string') {
                    throw new Error(
                        `Invalid parameter in procedure ${procedure.id}`
                    );
                }

                if (parameterIds.has(parameter.id)) {
                    throw new Error(
                        `Duplicate procedure parameter: ${parameter.id}`
                    );
                }

                if (!this._isKnownValueType(parameter.valueType)) {
                    throw new Error(
                        `Procedure argument ${parameter.id} has invalid type: ${
                            parameter.valueType
                        }`
                    );
                }

                parameterIds.add(parameter.id);
            }

            this._proceduresById.set(procedure.id, procedure);
        }

        /*
        * Validate global initial values only after every global symbol is
        * available.
        */
        for (const variable of variables) {
            const initialType = this._inferExpressionType(
                variable.initialValue
            );

            this._assertAssignableType(
                variable.valueType,
                initialType,
                `Variable ${variable.id}`
            );
        }

        for (const list of lists) {
            const initialValues = Array.isArray(list.initialValues) ?
                list.initialValues :
                [];

            if (initialValues.length > list.capacity) {
                throw new Error(
                    `List ${list.id} exceeds capacity ${list.capacity}`
                );
            }

            for (const initialValue of initialValues) {
                const initialType = this._inferExpressionType(
                    initialValue
                );

                this._assertAssignableType(
                    list.itemType,
                    initialType,
                    `List ${list.id}`
                );
            }
        }

        /*
        * Procedure bodies are validated with their own typed parameter scope.
        */
        for (const procedure of procedures) {
            const previousParameters =
                this._currentProcedureParameters;

            this._currentProcedureParameters = new Map();

            for (
                const parameter of
                Array.isArray(procedure.parameters) ?
                    procedure.parameters :
                    []
            ) {
                this._currentProcedureParameters.set(
                    parameter.id,
                    parameter
                );
            }

            try {
                this._validateStatements(
                    Array.isArray(procedure.body) ?
                        procedure.body :
                        []
                );
            } finally {
                this._currentProcedureParameters =
                    previousParameters;
            }
        }

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
            case 'MatrixInit':
            case 'LcdInit':
            case 'Tm1637Init':
            case 'MatrixWrite':
            case 'MatrixBrightness':
            case 'MatrixClear':
            case 'LcdWrite':
            case 'LcdMode':
            case 'LcdClear':
            case 'Tm1637Show':
            case 'Tm1637Clear':
            case 'JoystickInit':
            case 'MotorConfigure':
            case 'MotorWrite':
            case 'MotorStop':
            case 'ServoWrite':
            case 'RelayWrite':
            case 'SerialBegin':
                break;

            case 'VariableSet': {
                const variable = this._getVariable(
                    statement.variableId
                );

                const valueType = this._inferExpressionType(
                    statement.value
                );

                /*
                 * EasyBlox Number variables are represented internally as
                 * DECIMAL. If the student supplies a non-numeric value,
                 * use zero instead of invalidating the program.
                 */
                if (
                    variable.valueType === VALUE_TYPES.DECIMAL &&
                    valueType !== VALUE_TYPES.INTEGER &&
                    valueType !== VALUE_TYPES.DECIMAL
                ) {
                    statement.value = {
                        type: 'IntegerLiteral',
                        value: 0
                    };
                    break;
                }

                this._assertAssignableType(
                    variable.valueType,
                    valueType,
                    `Variable ${statement.variableId}`
                );

                break;
            }

            case 'VariableChange': {
                const variable = this._getVariable(
                    statement.variableId
                );

                if (!this._isNumericType(variable.valueType)) {
                    throw new Error(
                        `Variable ${statement.variableId} must be numeric for change`
                    );
                }

                const valueType = this._inferExpressionType(
                    statement.value
                );

                if (!this._isNumericType(valueType)) {
                    throw new Error(
                        `Variable ${statement.variableId} change must be numeric`
                    );
                }

                this._assertAssignableType(
                    variable.valueType,
                    valueType,
                    `Variable ${statement.variableId}`
                );

                break;
            }

            case 'ListAdd': {
                this._validateListItem(
                    statement.listId,
                    statement.item
                );
                break;
            }

            case 'ListInsert': {
                this._validateListIndex(
                    statement.listId,
                    statement.index
                );

                this._validateListItem(
                    statement.listId,
                    statement.item
                );
                break;
            }

            case 'ListReplace': {
                this._validateListIndex(
                    statement.listId,
                    statement.index
                );

                this._validateListItem(
                    statement.listId,
                    statement.item
                );
                break;
            }

            case 'ListDelete': {
                this._validateListIndex(
                    statement.listId,
                    statement.index
                );
                break;
            }

            case 'ListDeleteAll':
                this._getList(statement.listId);
                break;

            case 'ProcedureCall':
                this._validateProcedureCall(statement);
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

        case 'UltrasonicReadExpression':
            return VALUE_TYPES.DECIMAL;

        case 'DhtReadExpression':
            if (
                expression.reading !== 'temperature' &&
                expression.reading !== 'humidity'
            ) {
                throw new Error(
                    'DHT reading must be temperature or humidity'
                );
            }

            return VALUE_TYPES.DECIMAL;

        case 'JoystickValueExpression':
            if (
                expression.axis !== 'X' &&
                expression.axis !== 'Y'
            ) {
                throw new Error(
                    'Joystick axis must be X or Y'
                );
            }

            return VALUE_TYPES.INTEGER;

        case 'JoystickClickedExpression':
            return VALUE_TYPES.BOOLEAN;

        case 'VariableReference': {
            const variable = this._getVariable(
                expression.variableId
            );

            return variable.valueType;
        }

        case 'ProcedureArgumentReference': {
            if (
                !this._currentProcedureParameters ||
                !this._currentProcedureParameters.has(
                    expression.parameterId
                )
            ) {
                throw new Error(
                    `Unknown procedure argument: ${
                        expression.parameterId
                    }`
                );
            }

            return this._currentProcedureParameters.get(
                expression.parameterId
            ).valueType;
        }

        case 'ListItemExpression': {
            const list = this._getList(expression.listId);

            this._validateListIndex(
                expression.listId,
                expression.index
            );

            return list.itemType;
        }

        case 'ListIndexOfExpression': {
            const list = this._getList(expression.listId);
            const itemType = this._inferExpressionType(
                expression.item
            );

            this._assertComparableType(
                list.itemType,
                itemType,
                `List ${expression.listId}`
            );

            return VALUE_TYPES.INTEGER;
        }

        case 'ListLengthExpression':
            this._getList(expression.listId);
            return VALUE_TYPES.INTEGER;

        case 'ListContainsExpression': {
            const list = this._getList(expression.listId);
            const itemType = this._inferExpressionType(
                expression.item
            );

            this._assertComparableType(
                list.itemType,
                itemType,
                `List ${expression.listId}`
            );

            return VALUE_TYPES.BOOLEAN;
        }

        case 'ListContentsExpression':
            this._getList(expression.listId);
            return VALUE_TYPES.TEXT;

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

        case 'Length':
            return VALUE_TYPES.INTEGER;

        case 'Round': {
            const operandType = this._inferExpressionType(
                expression.operand
            );

            if (!this._isNumericType(operandType)) {
                throw new Error(
                    'Round operand must be numeric'
                );
            }

            return VALUE_TYPES.INTEGER;
        }

        case 'MathOp': {
            const operandType = this._inferExpressionType(
                expression.operand
            );

            if (!this._isNumericType(operandType)) {
                throw new Error(
                    'MathOp operand must be numeric'
                );
            }

            if (
                expression.mathOperator === 'floor' ||
                expression.mathOperator === 'ceiling'
            ) {
                return VALUE_TYPES.INTEGER;
            }

            if (expression.mathOperator === 'abs') {
                return operandType;
            }

            return VALUE_TYPES.DECIMAL;
        }

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
        case 'Mod':
        case 'Random':
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

        case 'LetterOf':
            if (!this._isNumericType(leftType)) {
                throw new Error(
                    'LetterOf index must be numeric'
                );
            }

            return VALUE_TYPES.TEXT;

        case 'Contains':
            return VALUE_TYPES.BOOLEAN;

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
     * Resolve a declared variable.
     * @param {string} variableId Variable ID.
     * @returns {object} Variable declaration.
     * @private
     */
    _getVariable (variableId) {
        if (
            !this._variablesById ||
            !this._variablesById.has(variableId)
        ) {
            throw new Error(
                `Unknown Arduino UNO Upload variable: ${variableId}`
            );
        }

        return this._variablesById.get(variableId);
    }

    /**
     * Resolve a declared list.
     * @param {string} listId List ID.
     * @returns {object} List declaration.
     * @private
     */
    _getList (listId) {
        if (
            !this._listsById ||
            !this._listsById.has(listId)
        ) {
            throw new Error(
                `Unknown Arduino UNO Upload list: ${listId}`
            );
        }

        return this._listsById.get(listId);
    }

    /**
     * Resolve a declared procedure.
     * @param {string} procedureId Procedure ID.
     * @returns {object} Procedure declaration.
     * @private
     */
    _getProcedure (procedureId) {
        if (
            !this._proceduresById ||
            !this._proceduresById.has(procedureId)
        ) {
            throw new Error(
                `Unknown Arduino UNO Upload procedure: ${procedureId}`
            );
        }

        return this._proceduresById.get(procedureId);
    }

    /**
     * Validate one typed list item.
     * @param {string} listId List ID.
     * @param {object} item Item expression.
     * @private
     */
    _validateListItem (listId, item) {
        const list = this._getList(listId);
        const itemType = this._inferExpressionType(item);

        this._assertAssignableType(
            list.itemType,
            itemType,
            `List ${listId}`
        );
    }

    /**
     * Validate a Scratch list index expression.
     * Scratch accepts numeric indices; conversion to its one-based runtime
     * semantics belongs to the generator.
     * @param {string} listId List ID.
     * @param {object} index Index expression.
     * @private
     */
    _validateListIndex (listId, index) {
        this._getList(listId);

        const indexType = this._inferExpressionType(index);

        if (!this._isNumericType(indexType)) {
            throw new Error(
                `List ${listId} index must be numeric`
            );
        }
    }

    /**
     * Validate a typed My Blocks invocation.
     * @param {object} statement ProcedureCall statement.
     * @private
     */
    _validateProcedureCall (statement) {
        const procedure = this._getProcedure(
            statement.procedureId
        );

        const parameters = Array.isArray(procedure.parameters) ?
            procedure.parameters :
            [];

        const argumentsList = Array.isArray(statement.arguments) ?
            statement.arguments :
            [];

        const argumentsByParameterId = new Map();

        for (const argument of argumentsList) {
            if (
                argument &&
                typeof argument.parameterId === 'string'
            ) {
                argumentsByParameterId.set(
                    argument.parameterId,
                    argument
                );
            }
        }

        for (const parameter of parameters) {
            if (!argumentsByParameterId.has(parameter.id)) {
                throw new Error(
                    `Missing procedure argument: ${parameter.id}`
                );
            }

            const argument = argumentsByParameterId.get(
                parameter.id
            );

            const argumentType = this._inferExpressionType(
                argument.value
            );

            if (
                !this._isAssignableType(
                    parameter.valueType,
                    argumentType
                )
            ) {
                throw new Error(
                    `Procedure argument ${parameter.id} expects ${
                        parameter.valueType
                    } but received ${argumentType}`
                );
            }
        }

        if (argumentsByParameterId.size !== parameters.length) {
            throw new Error(
                `Procedure ${statement.procedureId} has unexpected arguments`
            );
        }
    }

    /**
     * Check whether a type belongs to the pedagogical Upload type system.
     * @param {string} valueType Type.
     * @returns {boolean} True for a supported type.
     * @private
     */
    _isKnownValueType (valueType) {
        return (
            valueType === VALUE_TYPES.INTEGER ||
            valueType === VALUE_TYPES.DECIMAL ||
            valueType === VALUE_TYPES.TEXT ||
            valueType === VALUE_TYPES.BOOLEAN
        );
    }

    /**
     * Check assignment compatibility.
     *
     * INTEGER -> DECIMAL promotion is safe.
     * DECIMAL -> INTEGER is deliberately not implicit.
     *
     * @param {string} expectedType Destination type.
     * @param {string} actualType Expression type.
     * @returns {boolean} Whether assignment is permitted.
     * @private
     */
    _isAssignableType (expectedType, actualType) {
        return (
            expectedType === actualType ||
            (
                expectedType === VALUE_TYPES.DECIMAL &&
                actualType === VALUE_TYPES.INTEGER
            )
        );
    }

    /**
     * Validate assignment compatibility with a pedagogical diagnostic.
     * @param {string} expectedType Expected type.
     * @param {string} actualType Actual type.
     * @param {string} subject Diagnostic subject.
     * @private
     */
    _assertAssignableType (
        expectedType,
        actualType,
        subject
    ) {
        if (
            !this._isAssignableType(
                expectedType,
                actualType
            )
        ) {
            throw new Error(
                `${subject} expects ${expectedType} but received ${actualType}`
            );
        }
    }

    /**
     * Validate equality/search compatibility for typed list values.
     * Numeric INTEGER/DECIMAL values remain mutually comparable.
     * @param {string} expectedType List item type.
     * @param {string} actualType Search expression type.
     * @param {string} subject Diagnostic subject.
     * @private
     */
    _assertComparableType (
        expectedType,
        actualType,
        subject
    ) {
        if (expectedType === actualType) {
            return;
        }

        if (
            this._isNumericType(expectedType) &&
            this._isNumericType(actualType)
        ) {
            return;
        }

        throw new Error(
            `${subject} cannot compare ${expectedType} with ${actualType}`
        );
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