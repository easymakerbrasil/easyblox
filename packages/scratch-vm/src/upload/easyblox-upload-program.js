const Blocks = require('../engine/blocks');
const Variable = require('../engine/variable');

/**
 * Canonical script state owned by one EasyBlox Upload program.
 *
 * Upload scripts are intentionally independent from Scratch runtime targets.
 * Project-level EasyBlox symbols are shared across Stage and Upload contexts.
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
    }

    /**
     * Get the Scratch Stage which owns EasyBlox project-level variables.
     * Stage and Upload intentionally share the same logical variables even
     * though their script workspaces remain independent.
     * @returns {?Target} Shared project variable owner.
     */
    _getSharedVariableOwner () {
        if (
            !this.runtime ||
            typeof this.runtime.getTargetForStage !== 'function'
        ) {
            return null;
        }

        return this.runtime.getTargetForStage();
    }

    /**
     * Project-level variables exposed to Upload.
     *
     * This is intentionally a live view over the Scratch Stage variable map,
     * not a second Upload-owned variable map. Variable identity, metadata and
     * lifecycle therefore remain common to Stage and Upload.
     * @returns {!Object<string, Variable>} Shared variables.
     */
    get variables () {
        const owner = this._getSharedVariableOwner();

        if (!owner || !owner.variables) {
            return Object.create(null);
        }

        return owner.variables;
    }

    /**
     * Create one project-level EasyBlox variable.
     * @param {!string} id Variable ID.
     * @param {!string} name Variable name.
     * @param {!string} type Scratch variable type.
     */
    createVariable (id, name, type) {
        const owner = this._getSharedVariableOwner();

        if (!owner) {
            return;
        }

        if (this.lookupVariableById(id)) {
            return;
        }

    if (typeof owner.createVariable === 'function') {
        owner.createVariable(
            id,
            name,
            type,
            false
        );

        /*
         * Real Scratch targets create the variable immediately. Keep a
         * defensive fallback for partial target implementations used by
         * tests or other VM consumers.
         */
        if (this.lookupVariableById(id)) {
            return;
        }
    }

    if (!owner.variables) {
        owner.variables = Object.create(null);
    }

    if (
        !Object.prototype.hasOwnProperty.call(
            owner.variables,
            id
        )
    ) {
        owner.variables[id] = new Variable(
            id,
            name,
            type,
            false
        );
    }
    }

    /**
     * Resolve one project-level EasyBlox variable.
     * @param {!string} id Variable ID.
     * @returns {?Variable} Shared variable, or null.
     */
    lookupVariableById (id) {
        const owner = this._getSharedVariableOwner();

        if (!owner) {
            return null;
        }

    if (typeof owner.lookupVariableById === 'function') {
        const variable =
            owner.lookupVariableById(id);

        if (variable) {
            return variable;
        }
    }

    /*
     * Keep the canonical variables map as a fallback. This also allows
     * partial target implementations to participate in the shared EasyBlox
     * variable model without maintaining a duplicate lookup implementation.
     */
    if (
        owner.variables &&
        Object.prototype.hasOwnProperty.call(
            owner.variables,
            id
        )
    ) {
        return owner.variables[id];
    }

        return null;
    }

    /**
     * Rename one shared project variable and keep references in both backing
     * workspaces synchronized with its canonical ID.
     * @param {!string} id Variable ID.
     * @param {!string} newName New variable name.
     */
    renameVariable (id, newName) {
        const owner = this._getSharedVariableOwner();
        const variable = this.lookupVariableById(id);

        if (!owner || !variable) {
            return;
        }

        if (typeof owner.renameVariable === 'function') {
            owner.renameVariable(
                id,
                newName
            );
        } else {
            variable.name = newName;

            if (
                owner.blocks &&
                typeof owner.blocks.updateBlocksAfterVarRename === 'function'
            ) {
                owner.blocks.updateBlocksAfterVarRename(
                    id,
                    newName
                );
            }
        }

        /*
        * The variable object has one shared owner, but Stage and Upload still
        * have independent script stores. Upload references therefore also need
        * their visible field text refreshed after the canonical rename.
        */
        this.blocks.updateBlocksAfterVarRename(
            id,
            newName
        );
    }

    /**
     * Delete one shared project variable.
     * @param {!string} id Variable ID.
     */
    deleteVariable (id) {
        const owner = this._getSharedVariableOwner();

        if (!owner || !this.lookupVariableById(id)) {
            return;
        }

        if (typeof owner.deleteVariable === 'function') {
            owner.deleteVariable(id);
            return;
        }

        if (owner.variables) {
            delete owner.variables[id];
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
