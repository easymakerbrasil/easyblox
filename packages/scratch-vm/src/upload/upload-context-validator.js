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
        const unreachable = Array.isArray(ir.unreachable) ?
            ir.unreachable :
            [];

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
}

module.exports = UploadContextValidator;
