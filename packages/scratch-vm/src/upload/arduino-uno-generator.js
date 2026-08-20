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

        const lines = [
            'void setup() {'
        ];

        for (const pin of outputPins) {
            lines.push(`    pinMode(${pin}, OUTPUT);`);
        }

        for (const statement of setupStatements) {
            lines.push(`    ${this._generateStatement(statement)}`);
        }

        lines.push(
            '}',
            '',
            'void loop() {'
        );

        for (const statement of loopStatements) {
            lines.push(`    ${this._generateStatement(statement)}`);
        }

        lines.push(
            '}',
            ''
        );

        return lines.join('\n');
    }

    /**
     * Infer digital OUTPUT resources required by executable statements.
     * @param {Array<object>} setupStatements Setup IR statements.
     * @param {Array<object>} loopStatements Loop IR statements.
     * @returns {Array<number>} Unique pins in deterministic order.
     * @private
     */
    _collectOutputPins (setupStatements, loopStatements) {
        const pins = new Set();

        for (const statement of setupStatements.concat(loopStatements)) {
            if (statement.type === 'DigitalWrite') {
                pins.add(statement.pin);
            }
        }

        return Array.from(pins).sort((a, b) => a - b);
    }

    /**
     * Generate one Arduino C++ statement.
     * @param {object} statement Semantic IR statement.
     * @returns {string} Arduino C++ statement.
     * @private
     */
    _generateStatement (statement) {
        switch (statement.type) {
        case 'DigitalWrite':
            return `digitalWrite(${statement.pin}, ${
                statement.value ? 'HIGH' : 'LOW'
            });`;
        default:
            throw new Error(
                `Unsupported Arduino UNO IR statement: ${statement.type}`
            );
        }
    }
}

module.exports = ArduinoUnoGenerator;
