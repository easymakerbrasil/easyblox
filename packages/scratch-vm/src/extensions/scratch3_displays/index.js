const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

const EXTENSION_ID = 'displays';

const MATRIX_SIZE = 8;
const DEFAULT_MATRIX = '0066FFFF7E3C1800';

const DEFAULT_MATRIX_DIN_PIN = 18;
const DEFAULT_MATRIX_CS_PIN = 19;
const DEFAULT_MATRIX_CLK_PIN = 13;

/**
 * Hardware display blocks for supported EasyBlox boards.
 */
class Scratch3DisplaysBlocks {
    /**
     * @param {Runtime} runtime Scratch runtime.
     */
    constructor (runtime) {
        this.runtime = runtime;
        this._peripheral = runtime.getPeripheralExtension('arduinoUno');

        this._matrixDinPin = DEFAULT_MATRIX_DIN_PIN;
        this._matrixCsPin = DEFAULT_MATRIX_CS_PIN;
        this._matrixClkPin = DEFAULT_MATRIX_CLK_PIN;
    }

    /**
     * Describe the hardware displays extension to the Scratch VM.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'Displays',
            color1: '#E53935',
            color2: '#C62828',
            color3: '#8E0000',
            blocks: [
                {
                    blockType: BlockType.LABEL,
                    text: 'Matriz de LED 8x8'
                },
                {
                    opcode: 'configureMatrix',
                    blockType: BlockType.COMMAND,
                    text: 'configurar matriz 8×8 DIN [DIN] CS [CS] CLK [CLK]',
                    arguments: {
                        DIN: {
                            type: ArgumentType.NUMBER,
                            menu: 'matrixPins',
                            defaultValue: DEFAULT_MATRIX_DIN_PIN
                        },
                        CS: {
                            type: ArgumentType.NUMBER,
                            menu: 'matrixPins',
                            defaultValue: DEFAULT_MATRIX_CS_PIN
                        },
                        CLK: {
                            type: ArgumentType.NUMBER,
                            menu: 'matrixPins',
                            defaultValue: DEFAULT_MATRIX_CLK_PIN
                        }
                    }
                },
                {
                    opcode: 'matrixWrite',
                    blockType: BlockType.COMMAND,
                    text: 'mostrar na matriz [MATRIX]',
                    arguments: {
                        MATRIX: {
                            type: ArgumentType.MATRIX_8X8,
                            defaultValue: DEFAULT_MATRIX
                        }
                    }
                },
                {
                    opcode: 'matrixClear',
                    blockType: BlockType.COMMAND,
                    text: 'limpar matriz'
                },
                {
                    opcode: 'matrixBrightness',
                    blockType: BlockType.COMMAND,
                    text: 'definir brilho da matriz para [BRIGHTNESS] %',
                    arguments: {
                        BRIGHTNESS: {
                            type: ArgumentType.PERCENTAGE,
                            defaultValue: 100
                        }
                    }
                },
                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Display LCD'
                },
                {
                    opcode: 'lcdInit',
                    blockType: BlockType.COMMAND,
                    text: 'iniciar LCD 16x2 I2C'
                },
                {
                    opcode: 'lcdWrite',
                    blockType: BlockType.COMMAND,
                    text: 'escrever [TEXT] no LCD linha [ROW] coluna [COLUMN]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Olá!'
                        },
                        ROW: {
                            type: ArgumentType.NUMBER,
                            menu: 'lcdRows',
                            defaultValue: 1
                        },
                        COLUMN: {
                            type: ArgumentType.NUMBER,
                            menu: 'lcdColumns',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'lcdClear',
                    blockType: BlockType.COMMAND,
                    text: 'limpar LCD'
                },
                {
                    opcode: 'lcdMode',
                    blockType: BlockType.COMMAND,
                    text: 'definir LCD [MODE]',
                    arguments: {
                        MODE: {
                            type: ArgumentType.STRING,
                            menu: 'lcdModes',
                            defaultValue: '0'
                        }
                    }
                }
            ],
            menus: {
                matrixPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'D2', value: '2'},
                        {text: 'D3', value: '3'},
                        {text: 'D4', value: '4'},
                        {text: 'D5', value: '5'},
                        {text: 'D6', value: '6'},
                        {text: 'D7', value: '7'},
                        {text: 'D8', value: '8'},
                        {text: 'D9', value: '9'},
                        {text: 'D10', value: '10'},
                        {text: 'D11', value: '11'},
                        {text: 'D12', value: '12'},
                        {text: 'D13', value: '13'},
                        {text: 'A0', value: '14'},
                        {text: 'A1', value: '15'},
                        {text: 'A2', value: '16'},
                        {text: 'A3', value: '17'},
                        {text: 'A4', value: '18'},
                        {text: 'A5', value: '19'}
                    ]
                },
                lcdRows: {
                    acceptReporters: true,
                    items: [
                        {text: '1', value: '1'},
                        {text: '2', value: '2'}
                    ]
                },
                lcdColumns: {
                    acceptReporters: true,
                    items: [
                        {text: '1', value: '1'},
                        {text: '2', value: '2'},
                        {text: '3', value: '3'},
                        {text: '4', value: '4'},
                        {text: '5', value: '5'},
                        {text: '6', value: '6'},
                        {text: '7', value: '7'},
                        {text: '8', value: '8'},
                        {text: '9', value: '9'},
                        {text: '10', value: '10'},
                        {text: '11', value: '11'},
                        {text: '12', value: '12'},
                        {text: '13', value: '13'},
                        {text: '14', value: '14'},
                        {text: '15', value: '15'},
                        {text: '16', value: '16'}
                    ]
                },
                lcdModes: {
                    acceptReporters: true,
                    items: [
                        {text: 'piscar', value: '0'},
                        {text: 'sem piscar', value: '1'},
                        {text: 'cursor', value: '2'},
                        {text: 'sem cursor', value: '3'},
                        {text: 'display ligado', value: '4'},
                        {text: 'display desligado', value: '5'},
                        {text: 'auto-rolagem', value: '6'},
                        {text: 'sem auto-rolagem', value: '7'},
                        {
                            text: 'deslocar display para a esquerda',
                            value: '8'
                        },
                        {
                            text: 'deslocar display para a direita',
                            value: '9'
                        }
                    ]
                }
            }
        };
    }

    /**
     * Check whether a pin can be used by the MAX7219 matrix.
     * @param {number} pin Arduino pin number.
     * @returns {boolean} True when valid.
     */
    _isValidMatrixPin (pin) {
        return (
            Number.isInteger(pin) &&
            pin >= 2 &&
            pin <= 19
        );
    }

    /**
     * Configure the pins used by subsequent matrix blocks.
     * @param {object} args Scratch block arguments.
     * @returns {null} No transport command is sent.
     */
    configureMatrix (args) {
        const dinPin = Number(args.DIN);
        const csPin = Number(args.CS);
        const clkPin = Number(args.CLK);

        if (!this._isValidMatrixPin(dinPin) ||
            !this._isValidMatrixPin(csPin) ||
            !this._isValidMatrixPin(clkPin)) {
            return null;
        }

        if (dinPin === csPin ||
            dinPin === clkPin ||
            csPin === clkPin) {
            return null;
        }

        this._matrixDinPin = dinPin;
        this._matrixCsPin = csPin;
        this._matrixClkPin = clkPin;

        return null;
    }

    /**
     * Convert the serialized 8x8 matrix value to eight row bytes.
     * @param {unknown} matrix Serialized matrix value.
     * @returns {number[]} Eight bytes, one per matrix row.
     */
    _matrixValueToRows (matrix) {
        const normalized =
            String(matrix || '')
                .replace(/[^0-9a-f]/gi, '')
                .toUpperCase()
                .slice(0, MATRIX_SIZE * 2)
                .padEnd(MATRIX_SIZE * 2, '0');

        const rows = [];

        for (let row = 0; row < MATRIX_SIZE; row++) {
            rows.push(
                parseInt(
                    normalized.slice(
                        row * 2,
                        (row + 1) * 2
                    ),
                    16
                )
            );
        }

        return rows;
    }

    /**
     * Display an 8x8 bitmap on the configured MAX7219 matrix.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved after ACK, or null when unavailable.
     */
    matrixWrite (args) {
        return this._peripheral.matrixWrite(
            this._matrixDinPin,
            this._matrixCsPin,
            this._matrixClkPin,
            this._matrixValueToRows(args.MATRIX)
        );
    }

    /**
     * Clear the configured MAX7219 matrix.
     * @returns {?Promise<number>} Promise resolved after ACK, or null when unavailable.
     */
    matrixClear () {
        return this._peripheral.matrixWrite(
            this._matrixDinPin,
            this._matrixCsPin,
            this._matrixClkPin,
            new Array(MATRIX_SIZE).fill(0)
        );
    }

    /**
     * Set the MAX7219 intensity using a percentage from 0 to 100.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved after ACK, or null when unavailable.
     */
    matrixBrightness (args) {
        const brightness =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        Number(args.BRIGHTNESS)
                    )
                )
            );

        return this._peripheral.matrixBrightness(
            this._matrixDinPin,
            this._matrixCsPin,
            this._matrixClkPin,
            brightness
        );
    }

    /**
     * Initialize the active board LCD.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdInit () {
        return this._peripheral.lcdInit();
    }

    /**
     * Write text to the active board LCD.
     * Scratch coordinates are one-based; the Stage protocol is zero-based.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdWrite (args) {
        const row = Math.max(
            1,
            Math.min(
                2,
                Math.round(Number(args.ROW))
            )
        );

        const column = Math.max(
            1,
            Math.min(
                16,
                Math.round(Number(args.COLUMN))
            )
        );

        return this._peripheral.lcdWrite(
            args.TEXT,
            row - 1,
            column - 1
        );
    }

    /**
     * Clear the active board LCD.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdClear () {
        return this._peripheral.lcdClear();
    }

    /**
     * Set or execute an LCD mode on the active board.
     * @param {object} args Scratch block arguments.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdMode (args) {
        return this._peripheral.lcdMode(
            Number(args.MODE)
        );
    }
}

module.exports = Scratch3DisplaysBlocks;
