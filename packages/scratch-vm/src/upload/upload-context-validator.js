/**
 * Validate semantic execution-context rules for EasyBlox Upload IR.
 */
class UploadContextValidator {
    /**
     * Validate an EasyBlox Upload IR program.
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

        const unreachable = Array.isArray(ir.unreachable) ?
            ir.unreachable :
            [];

        const invalidSetupMotorConfiguration = setup.some(statement =>
            statement &&
            statement.type !== 'MotorConfigure' &&
            this._containsMotorConfigure(statement)
        );

        const invalidLoopMotorConfiguration =
            this._containsMotorConfigure(loop);

        const invalidProcedureMotorConfiguration =
            this._containsMotorConfigure(procedures);

        if (
            invalidSetupMotorConfiguration ||
            invalidLoopMotorConfiguration ||
            invalidProcedureMotorConfiguration
        ) {
            throw new Error(
                'Motor configuration must be declared directly in Arduino UNO setup'
            );
        }

        const invalidSetupSerialInitialization = setup.some(statement =>
            statement &&
            statement.type !== 'SerialBegin' &&
            this._containsSerialBegin(statement)
        );

        const invalidLoopSerialInitialization =
            this._containsSerialBegin(loop);

        const invalidProcedureSerialInitialization =
            this._containsSerialBegin(procedures);

        if (
            invalidSetupSerialInitialization ||
            invalidLoopSerialInitialization ||
            invalidProcedureSerialInitialization
        ) {
            throw new Error(
                'Serial initialization must be declared directly in Arduino UNO setup'
            );
        }

        const serialInitializationCount = setup.filter(statement =>
            statement &&
            statement.type === 'SerialBegin'
        ).length;

        if (serialInitializationCount > 1) {
            throw new Error(
                'Serial can only be initialized once'
            );
        }

        const usesSerialOutput = this._containsSerialOutput([
            ...setup,
            ...loop,
            ...procedures
        ]);

        if (
            usesSerialOutput &&
            serialInitializationCount === 0
        ) {
            throw new Error(
                'Serial must be initialized before use'
            );
        }

        const serialInitializationIndex = setup.findIndex(statement =>
            statement &&
            statement.type === 'SerialBegin'
        );

        const usesSerialOutputBeforeInitialization =
            serialInitializationIndex > 0 &&
            this._containsSerialOutput(
                setup.slice(0, serialInitializationIndex)
            );

        if (usesSerialOutputBeforeInitialization) {
            throw new Error(
                'Serial must be initialized before use'
            );
        }

        const invalidSetupJoystickInitialization =
            setup.some(statement =>
                statement &&
                statement.type !== 'JoystickInit' &&
                this._containsJoystickInit(statement)
            );

        const invalidLoopJoystickInitialization =
            this._containsJoystickInit(loop);

        const invalidProcedureJoystickInitialization =
            this._containsJoystickInit(procedures);

        if (
            invalidSetupJoystickInitialization ||
            invalidLoopJoystickInitialization ||
            invalidProcedureJoystickInitialization
        ) {
            throw new Error(
                'Joystick initialization must be declared directly in Arduino UNO setup'
            );
        }

        const joystickInitializationCount =
            setup.filter(statement =>
                statement &&
                statement.type === 'JoystickInit'
            ).length;

        if (joystickInitializationCount > 1) {
            throw new Error(
                'Joystick can only be initialized once'
            );
        }

        const usesJoystick =
            this._containsJoystickReporter([
                ...setup,
                ...loop,
                ...procedures
            ]);

        if (
            usesJoystick &&
            joystickInitializationCount === 0
        ) {
            throw new Error(
                'Joystick must be initialized before use'
            );
        }

        const joystickInitializationIndex =
            setup.findIndex(statement =>
                statement &&
                statement.type === 'JoystickInit'
            );

        const usesJoystickBeforeInitialization =
            joystickInitializationIndex > 0 &&
            this._containsJoystickReporter(
                setup.slice(
                    0,
                    joystickInitializationIndex
                )
            );

        if (usesJoystickBeforeInitialization) {
            throw new Error(
                'Joystick must be initialized before use'
            );
        }

        const invalidSetupDisplayInitialization =
            setup.some(statement =>
                statement &&
                ![
                    'MatrixInit',
                    'LcdInit',
                    'Tm1637Init'
                ].includes(statement.type) &&
                this._containsDisplayInit(statement)
            );

        const invalidLoopDisplayInitialization =
            this._containsDisplayInit(loop);

        const invalidProcedureDisplayInitialization =
            this._containsDisplayInit(procedures);

        if (
            invalidSetupDisplayInitialization ||
            invalidLoopDisplayInitialization ||
            invalidProcedureDisplayInitialization
        ) {
            throw new Error(
                'Display initialization must be declared directly in Arduino UNO setup'
            );
        }

        const matrixInitializationIndex =
            setup.findIndex(statement =>
                statement &&
                statement.type === 'MatrixInit'
            );

        const lcdInitializationIndex =
            setup.findIndex(statement =>
                statement &&
                statement.type === 'LcdInit'
            );

        const tm1637InitializationIndex =
            setup.findIndex(statement =>
                statement &&
                statement.type === 'Tm1637Init'
            );

        const usesMatrix =
            this._containsMatrixOperation([
                ...setup,
                ...loop,
                ...procedures
            ]);

        const usesLcd =
            this._containsLcdOperation([
                ...setup,
                ...loop,
                ...procedures
            ]);

        const usesTm1637 =
            this._containsTm1637Operation([
                ...setup,
                ...loop,
                ...procedures
            ]);

        if (
            usesMatrix &&
            matrixInitializationIndex === -1
        ) {
            throw new Error(
                'Matrix must be initialized before use'
            );
        }

        if (
            usesLcd &&
            lcdInitializationIndex === -1
        ) {
            throw new Error(
                'LCD must be initialized before use'
            );
        }

        if (
            usesTm1637 &&
            tm1637InitializationIndex === -1
        ) {
            throw new Error(
                'TM1637 must be initialized before use'
            );
        }

        const usesMatrixBeforeInitialization =
            matrixInitializationIndex > 0 &&
            this._containsMatrixOperation(
                setup.slice(0, matrixInitializationIndex)
            );

        if (usesMatrixBeforeInitialization) {
            throw new Error(
                'Matrix must be initialized before use'
            );
        }

        const usesLcdBeforeInitialization =
            lcdInitializationIndex > 0 &&
            this._containsLcdOperation(
                setup.slice(0, lcdInitializationIndex)
            );

        if (usesLcdBeforeInitialization) {
            throw new Error(
                'LCD must be initialized before use'
            );
        }

        const usesTm1637BeforeInitialization =
            tm1637InitializationIndex > 0 &&
            this._containsTm1637Operation(
                setup.slice(0, tm1637InitializationIndex)
            );

        if (usesTm1637BeforeInitialization) {
            throw new Error(
                'TM1637 must be initialized before use'
            );
        }

        if (unreachable.some(item =>
            item &&
            item.type === 'UnreachableCode' &&
            item.reason === 'AfterInfiniteLoop'
        )) {
            throw new Error(
                'Arduino UNO Upload contains unreachable code after infinite loop'
            );
        }

        return ir;
    }

    /**
     * Check recursively whether a value contains a Display initializer.
     * @param {*} value IR value to inspect.
     * @returns {boolean} True when a Display initializer is present.
     * @private
     */
    _containsDisplayInit (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (
            value.type === 'MatrixInit' ||
            value.type === 'LcdInit' ||
            value.type === 'Tm1637Init'
        ) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsDisplayInit(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsDisplayInit(value[key])
        );
    }

    /**
     * Check recursively whether a value contains a MAX7219 operation.
     * @param {*} value IR value to inspect.
     * @returns {boolean} True when a matrix operation is present.
     * @private
     */
    _containsMatrixOperation (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (
            value.type === 'MatrixWrite' ||
            value.type === 'MatrixBrightness' ||
            value.type === 'MatrixClear'
        ) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsMatrixOperation(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsMatrixOperation(value[key])
        );
    }

    /**
     * Check recursively whether a value contains an LCD operation.
     * @param {*} value IR value to inspect.
     * @returns {boolean} True when an LCD operation is present.
     * @private
     */
    _containsLcdOperation (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (
            value.type === 'LcdWrite' ||
            value.type === 'LcdMode' ||
            value.type === 'LcdClear'
        ) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsLcdOperation(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsLcdOperation(value[key])
        );
    }

    /**
     * Check recursively whether a value contains a TM1637 operation.
     * @param {*} value IR value to inspect.
     * @returns {boolean} True when a TM1637 operation is present.
     * @private
     */
    _containsTm1637Operation (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (
            value.type === 'Tm1637Show' ||
            value.type === 'Tm1637Clear'
        ) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsTm1637Operation(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsTm1637Operation(value[key])
        );
    }

    /**
     * Check recursively whether a value contains a MotorConfigure statement.
     * @param {*} value IR value to inspect.
     * @returns {boolean} True when MotorConfigure is present.
     * @private
     */
    _containsMotorConfigure (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (value.type === 'MotorConfigure') {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsMotorConfigure(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsMotorConfigure(value[key])
        );
    }

    /**
     * Check recursively whether a value contains a SerialBegin statement.
     * @param {*} value IR value to inspect.
     * @returns {boolean} True when SerialBegin is present.
     * @private
     */
    _containsSerialBegin (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (value.type === 'SerialBegin') {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsSerialBegin(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsSerialBegin(value[key])
        );
    }

    /**
     * Check recursively whether a value contains Serial output statements.
     * @param {*} value IR value to inspect.
     * @returns {boolean} True when SerialWrite or SerialWriteLine is present.
     * @private
     */
    _containsSerialOutput (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (
            value.type === 'SerialWrite' ||
            value.type === 'SerialWriteLine'
        ) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsSerialOutput(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsSerialOutput(value[key])
        );
    }

_containsJoystickInit (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (value.type === 'JoystickInit') {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsJoystickInit(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsJoystickInit(value[key])
        );
    }

    _containsJoystickReporter (value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        if (
            value.type === 'JoystickValueExpression' ||
            value.type === 'JoystickClickedExpression'
        ) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.some(item =>
                this._containsJoystickReporter(item)
            );
        }

        return Object.keys(value).some(key =>
            this._containsJoystickReporter(value[key])
        );
    }
}

module.exports = UploadContextValidator;
