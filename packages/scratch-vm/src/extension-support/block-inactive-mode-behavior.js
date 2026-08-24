/**
 * Palette behaviors for a block when it is incompatible with the current
 * execution mode.
 * @enum {string}
 */
const BlockInactiveModeBehavior = {
    /**
     * Hide the block from the palette while it is incompatible.
     */
    HIDE: 'hide',

    /**
     * Keep the block visible in the palette, but disabled.
     */
    SHOW_DISABLED: 'show_disabled'
};

module.exports = BlockInactiveModeBehavior;
