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
}

module.exports = UploadContextValidator;
