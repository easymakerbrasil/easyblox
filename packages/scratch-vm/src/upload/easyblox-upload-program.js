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

    /**
     * Rename a variable owned exclusively by this Upload program.
     * Keep canonical Upload block references synchronized with the new name.
     * @param {!string} id Variable ID.
     * @param {!string} newName New visible variable name.
     */
    renameVariable (id, newName) {
        const variable = this.lookupVariableById(id);

        if (!variable) {
            return;
        }

        variable.name = newName;

        this.blocks.updateBlocksAfterVarRename(
            id,
            newName
        );
    }

    /**
     * Delete a variable owned exclusively by this Upload program.
     * Upload variables do not own Scratch Stage/cloud monitors.
     * @param {!string} id Variable ID.
     */
    deleteVariable (id) {
        if (Object.prototype.hasOwnProperty.call(this.variables, id)) {
            delete this.variables[id];
        }
    }

    /**
     * Handle a Blockly event owned by this Upload program.
     * Variable lifecycle events operate on the Upload program's canonical
     * variable map instead of Scratch runtime targets.
     * All other Blockly events are delegated to the canonical Blocks container.
     * @param {!Blockly.Event} e Blockly event.
     */
    blocklyListen (e) {
        switch (e.type) {
        case 'var_create':
            this.createVariable(
                e.varId,
                e.varName,
                e.varType
            );

            this.runtime.emitProjectChanged();
            return;

        case 'var_rename':
            this.renameVariable(
                e.varId,
                e.newName
            );

            this.runtime.emitProjectChanged();
            return;

        case 'var_delete':
            this.deleteVariable(e.varId);

            this.runtime.emitProjectChanged();
            return;

        default:
            this.blocks.blocklyListen(e);

            // Upload Blocks intentionally use forceNoGlow, which also suppresses
            // Blocks.emitProjectChanged(). Persistent block mutations must still
            // invalidate the canonical Upload project state and C++ preview.
            if ([
                'create',
                'change',
                'move',
                'delete'
            ].includes(e.type)) {
                this.runtime.emitProjectChanged();
            }
        }
    }

}

module.exports = EasyBloxUploadProgram;
