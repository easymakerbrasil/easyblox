const InternalIdentifierAllocator =
    require('./internal-identifier-allocator');

/**
 * Generate deterministic Arduino UNO C++ from EasyBlox semantic IR.
 */
class ArduinoUnoGenerator {
    /**
     * Generate a complete Arduino sketch.
     * @param {object} ir EasyBlox Upload IR.
     * @returns {string} Complete deterministic Arduino sketch.
     */
    generate (ir) {
        const setupStatements = Array.isArray(ir.setup) ? ir.setup : [];
        const loopStatements = Array.isArray(ir.loop) ? ir.loop : [];

        const outputPins = this._collectOutputPins(
            setupStatements,
            loopStatements
        );

        /*
         * A fresh allocator per generation guarantees deterministic output.
         * Future user-defined identifiers can be supplied as reserved names.
         */
        const identifiers = new InternalIdentifierAllocator();

        const lines = [
            'void setup() {'
        ];

        for (const pin of outputPins) {
            lines.push(`    pinMode(${pin}, OUTPUT);`);
        }

        this._generateStatements(
            setupStatements,
            1,
            identifiers,
            lines
        );

        lines.push(
            '}',
            '',
            'void loop() {'
        );

        this._generateStatements(
            loopStatements,
            1,
            identifiers,
            lines
        );

        lines.push(
            '}',
            ''
        );

        return lines.join('\n');
    }

    /**
     * Infer digital OUTPUT resources required by executable statements.
     * Resources inside structured statements must also be discovered.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {Array<number>} Unique pins in deterministic order.
     * @private
     */
    _collectOutputPins (setupStatements, loopStatements) {
        const pins = new Set();

        this._collectOutputPinsFromStatements(
            setupStatements,
            pins
        );

        this._collectOutputPinsFromStatements(
            loopStatements,
            pins
        );

        return Array.from(pins).sort((a, b) => a - b);
    }

    /**
     * Recursively collect output resources from structured IR.
     * @param {Array<object>} statements Semantic IR statements.
     * @param {Set<number>} pins Destination pin set.
     * @private
     */
    _collectOutputPinsFromStatements (statements, pins) {
        for (const statement of statements) {
            if (statement.type === 'DigitalWrite') {
                pins.add(statement.pin);
            } else if (statement.type === 'Repeat') {
                const body = Array.isArray(statement.body) ?
                    statement.body :
                    [];

                this._collectOutputPinsFromStatements(body, pins);
            }
        }
    }

    /**
     * Generate structured Arduino C++ statements recursively.
     * @param {Array<object>} statements Semantic IR statements.
     * @param {number} indentLevel Current indentation depth.
     * @param {InternalIdentifierAllocator} identifiers Identifier allocator.
     * @param {Array<string>} lines Destination source lines.
     * @private
     */
    _generateStatements (
        statements,
        indentLevel,
        identifiers,
        lines
    ) {
        const indent = '    '.repeat(indentLevel);

        for (const statement of statements) {
            switch (statement.type) {
            case 'DigitalWrite':
                lines.push(
                    `${indent}digitalWrite(${statement.pin}, ${
                        statement.value ? 'HIGH' : 'LOW'
                    });`
                );
                break;

            case 'Repeat': {
                const identifier = identifiers.allocate(
                    'easyblox_repeat_index'
                );

                const timesExpression = this._generateExpression(
                    statement.times
                );

                lines.push(
                    `${indent}for (int ${identifier} = 0; ` +
                    `${identifier} < ${timesExpression}; ` +
                    `++${identifier}) {`
                );

                this._generateStatements(
                    Array.isArray(statement.body) ?
                        statement.body :
                        [],
                    indentLevel + 1,
                    identifiers,
                    lines
                );

                lines.push(`${indent}}`);
                break;
            }

            default:
                throw new Error(
                    `Unsupported Arduino UNO IR statement: ${
                        statement.type
                    }`
                );
            }
        }
    }

    /**
     * Generate Arduino C++ for an EasyBlox expression.
     *
     * Numeric values are temporarily supported for compatibility with
     * the A3 Repeat IR. Structured expressions are generated recursively.
     *
     * @param {number|object} expression EasyBlox expression IR.
     * @returns {string} Arduino C++ expression.
     * @private
     */
    _generateExpression (expression) {
        /*
        * Preserve compatibility with the A3 IR while direct Repeat
        * literals are still represented as raw numbers.
        */
        if (typeof expression === 'number') {
            if (!Number.isFinite(expression)) {
                throw new Error(
                    'Invalid Arduino UNO numeric expression'
                );
            }

            return String(expression);
        }

        if (!expression || typeof expression !== 'object') {
            throw new Error(
                'Invalid Arduino UNO Upload expression'
            );
        }

        switch (expression.type) {
        case 'IntegerLiteral':
        case 'DecimalLiteral':
            if (!Number.isFinite(expression.value)) {
                throw new Error(
                    'Invalid Arduino UNO numeric literal'
                );
            }

            return String(expression.value);

        case 'BinaryExpression': {
            const left = this._generateExpression(expression.left);
            const right = this._generateExpression(expression.right);

            switch (expression.operator) {
            case 'Add':
                return `(${left} + ${right})`;

            case 'Subtract':
                return `(${left} - ${right})`;

            case 'Multiply':
                return `(${left} * ${right})`;

            case 'Divide':
                return `(` +
                    `static_cast<double>(${left}) / ` +
                    `static_cast<double>(${right})` +
                    `)`;

            default:
                throw new Error(
                    `Unsupported Arduino UNO Upload binary operator: ${
                        expression.operator
                    }`
                );
            }
        }

        default:
            throw new Error(
                `Unsupported Arduino UNO Upload expression type: ${
                    expression.type
                }`
            );
        }
    }
}

module.exports = ArduinoUnoGenerator;
