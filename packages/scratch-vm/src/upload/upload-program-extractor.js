const ENTRY_POINT_OPCODE = 'arduinoUno_whenArduinoUnoStart';
const DIGITAL_WRITE_OPCODE = 'arduinoUno_digitalWrite';
const DIGITAL_READ_OPCODE = 'arduinoUno_digitalRead';
const ANALOG_READ_OPCODE = 'arduinoUno_analogRead';
const PWM_WRITE_OPCODE = 'arduinoUno_pwmWrite';
const TONE_START_OPCODE = 'arduinoUno_toneStart';
const TONE_STOP_OPCODE = 'arduinoUno_toneStop';
const TIMER_READ_OPCODE = 'arduinoUno_timerRead';
const TIMER_RESET_OPCODE = 'arduinoUno_timerReset';
const MOTOR_CONFIGURE_OPCODE = 'actuators_motorConfigure';
const MOTOR_WRITE_OPCODE = 'actuators_motorWrite';
const MOTOR_STOP_OPCODE = 'actuators_motorStop';
const SERVO_WRITE_OPCODE = 'actuators_servoWrite';
const RELAY_WRITE_OPCODE = 'actuators_relayWrite';
const SERIAL_BEGIN_OPCODE = 'serial_serialBegin';
const SERIAL_WRITE_OPCODE = 'serial_serialWrite';
const SERIAL_WRITE_LINE_OPCODE = 'serial_serialWriteLine';
const FOREVER_OPCODE = 'control_forever';
const REPEAT_OPCODE = 'control_repeat';
const IF_OPCODE = 'control_if';
const WAIT_OPCODE = 'control_wait';
const WAIT_UNTIL_OPCODE = 'control_wait_until';
const REPEAT_UNTIL_OPCODE = 'control_repeat_until';
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
const IF_ELSE_OPCODE = 'control_if_else';
const TEXT_OPCODE = 'text';

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
            return {
                setup: [],
                loop: []
            };
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

        case TONE_START_OPCODE:
            return {
                type: 'ToneStart',
                pin: this._readNumberInput(
                    blocks,
                    block,
                    'PIN'
                ),
                frequency: this._readNumberInput(
                    blocks,
                    block,
                    'FREQUENCY'
                )
            };

        case TONE_STOP_OPCODE:
            return {
                type: 'ToneStop',
                pin: this._readNumberInput(
                    blocks,
                    block,
                    'PIN'
                )
            };

        case PWM_WRITE_OPCODE:
            return {
                type: 'PwmWrite',
                pin: this._readNumberInput(
                    blocks,
                    block,
                    'PIN'
                ),
                value: this._readNumberInput(
                    blocks,
                    block,
                    'VALUE'
                )
            };

        case TIMER_RESET_OPCODE:
            return {
                type: 'TimerReset'
            };

        case MOTOR_CONFIGURE_OPCODE:
            return {
                type: 'MotorConfigure',
                motor: this._readNumberInput(
                    blocks,
                    block,
                    'MOTOR'
                ),
                in1Pin: this._readNumberInput(
                    blocks,
                    block,
                    'IN1'
                ),
                in2Pin: this._readNumberInput(
                    blocks,
                    block,
                    'IN2'
                ),
                pwmPin: this._readNumberInput(
                    blocks,
                    block,
                    'PWM'
                )
            };

        case MOTOR_WRITE_OPCODE:
            return {
                type: 'MotorWrite',
                motor: this._readNumberInput(
                    blocks,
                    block,
                    'MOTOR'
                ),
                direction: this._readNumberInput(
                    blocks,
                    block,
                    'DIRECTION'
                ),
                speedPercent: this._readNumberInput(
                    blocks,
                    block,
                    'SPEED'
                )
            };

        case MOTOR_STOP_OPCODE:
            return {
                type: 'MotorStop',
                motor: this._readNumberInput(
                    blocks,
                    block,
                    'MOTOR'
                )
            };

        case SERVO_WRITE_OPCODE:
            return {
                type: 'ServoWrite',
                pin: this._readNumberInput(
                    blocks,
                    block,
                    'PIN'
                ),
                angle: this._readNumberInput(
                    blocks,
                    block,
                    'ANGLE'
                )
            };

        case RELAY_WRITE_OPCODE:
            return {
                type: 'RelayWrite',
                pin: this._readNumberInput(
                    blocks,
                    block,
                    'PIN'
                ),
                state: this._readDigitalValue(
                    blocks,
                    block,
                    'STATE'
                )
            };

        case SERIAL_BEGIN_OPCODE:
            return {
                type: 'SerialBegin',
                baud: this._readNumberInput(
                    blocks,
                    block,
                    'BAUD'
                )
            };

        case SERIAL_WRITE_OPCODE:
            return {
                type: 'SerialWrite',
                value: this._extractExpressionInput(
                    blocks,
                    block,
                    'TEXT'
                )
            };

        case SERIAL_WRITE_LINE_OPCODE:
            return {
                type: 'SerialWriteLine',
                value: this._extractExpressionInput(
                    blocks,
                    block,
                    'TEXT'
                )
            };

        case WAIT_OPCODE:
            return {
                type: 'Wait',
                duration: this._extractExpressionInput(
                    blocks,
                    block,
                    'DURATION'
                )
            };

            case WAIT_UNTIL_OPCODE:
                return {
                    type: 'WaitUntil',
                    condition: this._extractBooleanConditionInput(
                        blocks,
                        block,
                        'CONDITION'
                    )
                };

        case REPEAT_UNTIL_OPCODE: {
            const body = [];

            this._extractBranchStatements(
                blocks,
                blocks.getBranch(block.id, 1),
                body
            );

            return {
                type: 'RepeatUntil',
                condition: this._extractBooleanConditionInput(
                    blocks,
                    block,
                    'CONDITION'
                ),
                body
            };
        }

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
                condition: this._extractBooleanConditionInput(
                    blocks,
                    block,
                    'CONDITION'
                ),
                body
            };
        }

        case IF_ELSE_OPCODE: {
            const thenBody = [];
            const elseBody = [];

            this._extractBranchStatements(
                blocks,
                blocks.getBranch(block.id, 1),
                thenBody
            );

            this._extractBranchStatements(
                blocks,
                blocks.getBranch(block.id, 2),
                elseBody
            );

            return {
                type: 'IfElse',
                condition: this._extractBooleanConditionInput(
                    blocks,
                    block,
                    'CONDITION'
                ),
                thenBody,
                elseBody
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
        if (this._isNumericLiteralOpcode(inputBlock.opcode)) {
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

        if (this._isNumericLiteralOpcode(block.opcode)) {
            const value = this._readNumericLiteralValue(
                blocks,
                block
            );

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

        if (block.opcode === TEXT_OPCODE) {
            const fields = blocks.getFields(block);
            const textField = fields && fields.TEXT;

            if (!textField) {
                throw new Error(
                    'Missing TEXT field in Scratch text literal'
                );
            }

            return {
                type: 'TextLiteral',
                value: String(textField.value)
            };
        }

        switch (block.opcode) {
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

        case DIGITAL_READ_OPCODE:
            return {
                type: 'DigitalReadExpression',
                pin: this._readNumberInput(
                    blocks,
                    block,
                    'PIN'
                )
            };

        case ANALOG_READ_OPCODE:
            return {
                type: 'AnalogReadExpression',
                pin: this._readNumberInput(
                    blocks,
                    block,
                    'PIN'
                )
            };

        case TIMER_READ_OPCODE:
            return {
                type: 'TimerReadExpression'
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
     * Extract a Boolean condition input using Scratch semantics.
     * An empty Boolean input is equivalent to false.
     * @param {Blocks} blocks Scratch Blocks storage.
     * @param {object} block Parent control block.
     * @param {string} inputName Scratch input name.
     * @returns {object} Boolean Expression IR.
     * @private
     */
    _extractBooleanConditionInput (blocks, block, inputName) {
        const inputs = blocks.getInputs(block);
        const input = inputs && inputs[inputName];

        if (!input || !input.block) {
            return {
                type: 'BooleanLiteral',
                value: false
            };
        }

        return this._extractExpressionInput(
            blocks,
            block,
            inputName
        );
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

    _isNumericLiteralOpcode (opcode) {
        return [
            'math_number',
            'math_positive_number',
            'math_whole_number',
            'math_integer',
            'math_angle',
            'easyblox_nonnegative_number',
            'easyblox_servo_angle',
            'easyblox_pwm_value',
            'easyblox_motor_speed',
            'easyblox_percentage'
        ].includes(opcode);
    }

    _readNumericLiteralValue (blocks, block) {
        const fields = blocks.getFields(block);
        const numberField = fields && fields.NUM;
        const value = numberField && Number(numberField.value);

        if (!Number.isFinite(value)) {
            throw new Error(
                'Invalid Arduino UNO Upload numeric literal'
            );
        }

        return value;
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

        if (!inputBlock) {
            throw new Error(
                `Unsupported numeric input ${inputName} in ${block.opcode}`
            );
        }

        if (this._isNumericLiteralOpcode(inputBlock.opcode)) {
            return this._readNumericLiteralValue(
                blocks,
                inputBlock
            );
        }

        if (inputBlock.opcode.includes('_menu_')) {
            const fields = blocks.getFields(inputBlock);
            const fieldNames = fields ? Object.keys(fields) : [];

            if (fieldNames.length === 1) {
                const value = Number(
                    fields[fieldNames[0]].value
                );

                if (Number.isFinite(value)) {
                    return value;
                }
            }
        }

        throw new Error(
            `Unsupported numeric input ${inputName} in ${block.opcode}`
        );
    }
}

module.exports = UploadProgramExtractor;
