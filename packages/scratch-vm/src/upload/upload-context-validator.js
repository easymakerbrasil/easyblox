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

        if (
            invalidSetupMotorConfiguration ||
            invalidLoopMotorConfiguration
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

        if (
            invalidSetupSerialInitialization ||
            invalidLoopSerialInitialization
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
            ...loop
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
}

module.exports = UploadContextValidator;
