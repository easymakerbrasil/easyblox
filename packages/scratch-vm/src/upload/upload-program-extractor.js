const ENTRY_POINT_OPCODE = 'arduinoUno_whenArduinoUnoStart';
const DIGITAL_WRITE_OPCODE = 'arduinoUno_digitalWrite';
const FOREVER_OPCODE = 'control_forever';

/**
 * Extract an EasyBlox Upload program from the canonical Scratch VM state.
 *
 * This is deliberately the boundary which knows about Scratch targets,
 * Blocks instances, block IDs and Scratch opcodes.
 */
class UploadProgramExtractor {
    /**
     * @param {Runtime} runtime Scratch runtime containing project targets.
     */
    constructor (runtime) {
        this.runtime = runtime;
    }

    /**
     * Extract the reachable Arduino UNO Upload program into semantic IR.
     * @returns {object} EasyBlox Upload IR.
     */
    extract () {
        const entryPoints = this._findEntryPoints();

        if (entryPoints.length === 0) {
            throw new Error('Arduino UNO Upload entry point not found');
        }

        if (entryPoints.length > 1) {
            throw new Error('Arduino UNO Upload has multiple entry points');
        }

        const entryPoint = entryPoints[0];
        const setup = [];
        const loop = [];
        const unreachable = [];

        let blockId = entryPoint.blocks.getNextBlock(entryPoint.blockId);

        while (blockId) {
            const block = entryPoint.blocks.getBlock(blockId);

            if (!block) {
                throw new Error(`Arduino UNO Upload block not found: ${blockId}`);
            }

            if (block.opcode === FOREVER_OPCODE) {
    this._extractBranchStatements(
        entryPoint.blocks,
        entryPoint.blocks.getBranch(blockId, 1),
        loop
    );

    const nextBlockId = entryPoint.blocks.getNextBlock(blockId);

            if (nextBlockId) {
                unreachable.push({
                    type: 'UnreachableCode',
                    reason: 'AfterInfiniteLoop'
                });
            }

            break;
        }

            setup.push(this._extractStatement(entryPoint.blocks, block));
            blockId = entryPoint.blocks.getNextBlock(blockId);
        }

        const ir = {
            setup,
            loop
        };

        if (unreachable.length > 0) {
            ir.unreachable = unreachable;
        }

        return ir;
    }

    /**
     * Find Upload entry points across all original project targets.
     * Runtime clones must never become independent firmware entry points.
     * @returns {Array<object>} Located entry points.
     * @private
     */
    _findEntryPoints () {
        const targets = Array.isArray(this.runtime.targets) ?
            this.runtime.targets.filter(target =>
                target &&
                target.isOriginal &&
                target.blocks
            ) :
            [];

        const entryPoints = [];

        for (const target of targets) {
            const scripts = target.blocks.getScripts();

            for (const blockId of scripts) {
                const block = target.blocks.getBlock(blockId);

                if (block && block.opcode === ENTRY_POINT_OPCODE) {
                    entryPoints.push({
                        target,
                        blocks: target.blocks,
                        blockId
                    });
                }
            }
        }

        return entryPoints;
    }

    /**
     * Extract a linear reachable branch into semantic IR statements.
     * @param {Blocks} blocks Scratch Blocks storage for the current target.
     * @param {?string} blockId First block ID in the branch.
     * @param {Array<object>} statements Destination IR statement list.
     * @private
     */
    _extractBranchStatements (blocks, blockId, statements) {
        let currentBlockId = blockId;

        while (currentBlockId) {
            const block = blocks.getBlock(currentBlockId);

            if (!block) {
                throw new Error(
                    `Arduino UNO Upload block not found: ${currentBlockId}`
                );
            }

            statements.push(this._extractStatement(blocks, block));
            currentBlockId = blocks.getNextBlock(currentBlockId);
        }
    }

    /**
     * Convert one reachable Scratch block into a semantic IR statement.
     * @param {Blocks} blocks Scratch Blocks storage for the current target.
     * @param {object} block Scratch block metadata.
     * @returns {object} Semantic IR statement.
     * @private
     */
    _extractStatement (blocks, block) {
        switch (block.opcode) {
        case DIGITAL_WRITE_OPCODE:
            return {
                type: 'DigitalWrite',
                pin: this._readNumberInput(blocks, block, 'PIN'),
                value: this._readDigitalValue(blocks, block, 'VALUE')
            };
        default:
            throw new Error(
                `Unsupported Arduino UNO Upload opcode: ${block.opcode}`
            );
        }
    }

    /**
     * Read and validate a digital HIGH/LOW Scratch input.
     * @param {Blocks} blocks Scratch Blocks storage.
     * @param {object} block Parent block.
     * @param {string} inputName Scratch input name.
     * @returns {boolean} Digital state.
     * @private
     */
    _readDigitalValue (blocks, block, inputName) {
        const value = this._readNumberInput(blocks, block, inputName);

        if (value !== 0 && value !== 1) {
            throw new Error(
                `Invalid digital value ${inputName} in ${block.opcode}`
            );
        }

        return value === 1;
    }

    /**
     * Read a numeric Scratch input from its connected/shadow block.
     * @param {Blocks} blocks Scratch Blocks storage.
     * @param {object} block Parent block.
     * @param {string} inputName Scratch input name.
     * @returns {number} Numeric value.
     * @private
     */
    _readNumberInput (blocks, block, inputName) {
        const inputs = blocks.getInputs(block);
        const input = inputs && inputs[inputName];

        if (!input || !input.block) {
            throw new Error(
                `Missing numeric input ${inputName} in ${block.opcode}`
            );
        }

        const inputBlock = blocks.getBlock(input.block);

        if (!inputBlock || inputBlock.opcode !== 'math_number') {
            throw new Error(
                `Unsupported numeric input ${inputName} in ${block.opcode}`
            );
        }

        const fields = blocks.getFields(inputBlock);
        const numberField = fields && fields.NUM;
        const value = numberField && Number(numberField.value);

        if (!Number.isFinite(value)) {
            throw new Error(
                `Invalid numeric input ${inputName} in ${block.opcode}`
            );
        }

        return value;
    }
}

module.exports = UploadProgramExtractor;
