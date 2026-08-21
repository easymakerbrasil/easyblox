const ENTRY_POINT_OPCODE = 'arduinoUno_whenArduinoUnoStart';
const DIGITAL_WRITE_OPCODE = 'arduinoUno_digitalWrite';
const FOREVER_OPCODE = 'control_forever';
const REPEAT_OPCODE = 'control_repeat';
const IF_OPCODE = 'control_if';
const ADD_OPCODE = 'operator_add';
const SUBTRACT_OPCODE = 'operator_subtract';
const MULTIPLY_OPCODE = 'operator_multiply';
const DIVIDE_OPCODE = 'operator_divide';
const LESS_THAN_OPCODE = 'operator_lt';
const EQUALS_OPCODE = 'operator_equals';
const GREATER_THAN_OPCODE = 'operator_gt';
const AND_OPCODE = 'operator_and';
const OR_OPCODE = 'operator_or';
const NOT_OPCODE = 'operator_not';

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

        case REPEAT_OPCODE: {
            const body = [];

            this._extractBranchStatements(
                blocks,
                blocks.getBranch(block.id, 1),
                body
            );

            return {
                type: 'Repeat',
                times: this._readRepeatTimes(blocks, block, 'TIMES'),
                body
            };
        }

        case IF_OPCODE: {
            const body = [];

            this._extractBranchStatements(
                blocks,
                blocks.getBranch(block.id, 1),
                body
            );

            return {
                type: 'If',
                condition: this._extractExpressionInput(
                    blocks,
                    block,
                    'CONDITION'
                ),
                body
            };
        }

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
     * Read a repeat count.
     *
     * Literal math_number inputs retain the legacy A3 numeric IR shape.
     * Reporter expressions are converted into typed Expression IR and
     * validated later by UploadTypeValidator.
     *
     * @param {Blocks} blocks Scratch Blocks storage.
     * @param {object} block Parent block.
     * @param {string} inputName Scratch input name.
     * @returns {number|object} Literal count or Expression IR.
     * @private
     */
    _readRepeatTimes (blocks, block, inputName) {
        const inputs = blocks.getInputs(block);
        const input = inputs && inputs[inputName];

        if (!input || !input.block) {
            throw new Error(
                `Missing repeat count ${inputName} in ${block.opcode}`
            );
        }

        const inputBlock = blocks.getBlock(input.block);

        if (!inputBlock) {
            throw new Error(
                `Repeat count block not found: ${input.block}`
            );
        }

        /*
        * Preserve the A3 IR shape for direct numeric literals.
        */
        if (inputBlock.opcode === 'math_number') {
            const value = this._readNumberInput(
                blocks,
                block,
                inputName
            );

            if (!Number.isInteger(value) || value < 0) {
                throw new Error(
                    `Invalid repeat count ${inputName} in ${block.opcode}`
                );
            }

            return value;
        }

        return this._extractExpression(
            blocks,
            input.block
        );
    }

    /**
     * Extract a Scratch reporter into EasyBlox Expression IR.
     * @param {Blocks} blocks Scratch Blocks storage.
     * @param {string} blockId Reporter block ID.
     * @returns {object} Expression IR.
     * @private
     */
    _extractExpression (blocks, blockId) {
        const block = blocks.getBlock(blockId);

        if (!block) {
            throw new Error(
                `Arduino UNO Upload expression block not found: ${blockId}`
            );
        }

        switch (block.opcode) {
        case 'math_number': {
            const fields = blocks.getFields(block);
            const numberField = fields && fields.NUM;
            const value = numberField && Number(numberField.value);

            if (!Number.isFinite(value)) {
                throw new Error(
                    'Invalid Arduino UNO Upload numeric literal'
                );
            }

            return Number.isInteger(value) ?
                {
                    type: 'IntegerLiteral',
                    value
                } :
                {
                    type: 'DecimalLiteral',
                    value
                };
        }

        case ADD_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'Add',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM2'
                )
            };

        case SUBTRACT_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'Subtract',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM2'
                )
            };

        case MULTIPLY_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'Multiply',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM2'
                )
            };

        case DIVIDE_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'Divide',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'NUM2'
                )
            };

        case LESS_THAN_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'LessThan',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND2'
                )
            };

        case EQUALS_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'Equals',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND2'
                )
            };

        case GREATER_THAN_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'GreaterThan',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND2'
                )
            };

        case AND_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'And',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND2'
                )
            };

        case OR_OPCODE:
            return {
                type: 'BinaryExpression',
                operator: 'Or',
                left: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND1'
                ),
                right: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND2'
                )
            };

        case NOT_OPCODE:
            return {
                type: 'UnaryExpression',
                operator: 'Not',
                operand: this._extractExpressionInput(
                    blocks,
                    block,
                    'OPERAND'
                )
            };

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload expression opcode: ${
                    block.opcode
                }`
            );
        }
    }

    /**
     * Extract one reporter input as Expression IR.
     * @param {Blocks} blocks Scratch Blocks storage.
     * @param {object} block Parent reporter block.
     * @param {string} inputName Scratch input name.
     * @returns {object} Expression IR.
     * @private
     */
    _extractExpressionInput (blocks, block, inputName) {
        const inputs = blocks.getInputs(block);
        const input = inputs && inputs[inputName];

        if (!input || !input.block) {
            throw new Error(
                `Missing expression input ${inputName} in ${block.opcode}`
            );
        }

        return this._extractExpression(
            blocks,
            input.block
        );
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
