/**
 * Wait for a Stage tone without blocking the editor or other VM scripts.
 * Scratch supplies util when a block is running in a VM thread. Direct
 * programmatic calls retain the peripheral's synchronous result.
 * @param {?number} sequence Stage command sequence or null when unavailable.
 * @param {number} duration Musical note duration, in milliseconds.
 * @param {?object} util Scratch block utility object, when available.
 * @returns {?number|Promise<number>} Sequence or a deferred sequence.
 */
const waitForTimedTone = (sequence, duration, util) => {
    if (
        !util ||
        sequence === null ||
        sequence === undefined ||
        !Number.isInteger(duration) ||
        duration <= 0
    ) {
        return sequence;
    }

    return new Promise(resolve => {
        setTimeout(() => resolve(sequence), duration);
    });
};

module.exports = waitForTimedTone;
