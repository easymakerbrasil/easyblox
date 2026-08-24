/**
 * Execution modes supported by an extension block.
 * @enum {string}
 */
const BlockExecutionMode = {
    /**
     * Block is available only in Stage Mode.
     */
    STAGE_ONLY: 'stage',

    /**
     * Block is available only in Upload Mode.
     */
    UPLOAD_ONLY: 'upload',

    /**
     * Block is available in both Stage and Upload modes.
     */
    BOTH: 'both'
};

module.exports = BlockExecutionMode;
