const Blocks = require('../engine/blocks');
const Variable = require('../engine/variable');

/**
 * Canonical state owned by one EasyBlox Upload program.
 *
 * Upload programs are intentionally independent from Scratch runtime targets.
 */
class EasyBloxUploadProgram {
    /**
     * @param {!Runtime} runtime Scratch runtime used by the Blocks container.
     * @param {!string} boardId Board which owns this Upload program.
     */
    constructor (runtime, boardId) {
        this.runtime = runtime;
        this.boardId = boardId;

        this.blocks = new Blocks(runtime, true);
        this.variables = Object.create(null);
    }

    /**
     * Create a variable owned exclusively by this Upload program.
     * @param {!string} id Canonical variable ID.
     * @param {!string} name Visible variable name.
     * @param {!string} type Scratch storage type.
     */
    createVariable (id, name, type) {
        if (!Object.prototype.hasOwnProperty.call(this.variables, id)) {
            this.variables[id] = new Variable(
                id,
                name,
                type,
                false
            );
        }
    }

    /**
     * Look up an Upload variable by its canonical ID.
     * @param {!string} id Variable ID.
     * @returns {?Variable} Variable or null when it does not exist.
     */
    lookupVariableById (id) {
        if (Object.prototype.hasOwnProperty.call(this.variables, id)) {
            return this.variables[id];
        }

        return null;
    }
}

module.exports = EasyBloxUploadProgram;
