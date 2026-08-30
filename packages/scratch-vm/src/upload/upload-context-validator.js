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
