/**
 * Allocate deterministic internal C++ identifiers without collisions.
 */
class InternalIdentifierAllocator {
    /**
     * @param {Array<string>} reservedIdentifiers Identifiers already in use
     * by the generated program.
     */
    constructor (reservedIdentifiers = []) {
        this._used = new Set(reservedIdentifiers);
        this._counters = new Map();
    }

    /**
     * Allocate a deterministic identifier from a trusted internal base name.
     * Internal identifiers must begin with a letter and contain only
     * alphanumeric characters or underscores.
     * @param {string} baseName Internal identifier base name.
     * @returns {string} Unique C++ identifier.
     */
    allocate (baseName) {
        if (
            typeof baseName !== 'string' ||
            !/^[A-Za-z][A-Za-z0-9_]*$/.test(baseName)
        ) {
            throw new Error(
                `Invalid internal identifier base: ${baseName}`
            );
        }

        let index = this._counters.get(baseName) || 0;
        let identifier;

        do {
            identifier = `${baseName}_${index}`;
            index++;
        } while (this._used.has(identifier));

        this._counters.set(baseName, index);
        this._used.add(identifier);

        return identifier;
    }
}

module.exports = InternalIdentifierAllocator;
