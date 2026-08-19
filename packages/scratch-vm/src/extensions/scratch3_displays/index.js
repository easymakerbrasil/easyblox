const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

const EXTENSION_ID = 'displays';

const MATRIX_SIZE = 8;
const DEFAULT_MATRIX = '0066FFFF7E3C1800';

const DEFAULT_MATRIX_DIN_PIN = 18;
const DEFAULT_MATRIX_CS_PIN = 19;
const DEFAULT_MATRIX_CLK_PIN = 13;

const TM1637_DIGIT_COUNT = 4;

const TM1637_DIGIT_SEGMENTS = Object.freeze([
    0x3F,
    0x06,
    0x5B,
    0x4F,
    0x66,
    0x6D,
    0x7D,
    0x07,
    0x7F,
    0x6F
]);

const TM1637_POINT_MASK = 0x80;

const DEFAULT_TM1637_CLK_PIN = 19;
const DEFAULT_TM1637_DIO_PIN = 18;

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

        this._tm1637ClkPin = DEFAULT_TM1637_CLK_PIN;
        this._tm1637DioPin = DEFAULT_TM1637_DIO_PIN;
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
                },
                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Display 7 SEG'
                },
                {
                    opcode: 'tm1637Init',
                    blockType: BlockType.COMMAND,
                    text: 'inicializar display 7 segmentos CLK [CLK] DIO [DIO]',
                    arguments: {
                        CLK: {
                            type: ArgumentType.NUMBER,
                            menu: 'matrixPins',
                            defaultValue: DEFAULT_TM1637_CLK_PIN
                        },
                        DIO: {
                            type: ArgumentType.NUMBER,
                            menu: 'matrixPins',
                            defaultValue: DEFAULT_TM1637_DIO_PIN
                        }
                    }
                },
                {
                    opcode: 'tm1637Show',
                    blockType: BlockType.COMMAND,
                    text: 'mostrar [VALUE] com [LENGTH] dígitos na posição [POSITION] [POINT] e [LEADING_ZEROS]',
                    arguments: {
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        },
                        LENGTH: {
                            type: ArgumentType.NUMBER,
                            menu: 'tm1637Lengths',
                            defaultValue: 4
                        },
                        POSITION: {
                            type: ArgumentType.NUMBER,
                            menu: 'tm1637Positions',
                            defaultValue: 1
                        },
                        POINT: {
                            type: ArgumentType.STRING,
                            menu: 'tm1637Point',
                            defaultValue: '0'
                        },
                        LEADING_ZEROS: {
                            type: ArgumentType.STRING,
                            menu: 'tm1637LeadingZeros',
                            defaultValue: '0'
                        }
                    }
                },
                {
                    opcode: 'tm1637Clear',
                    blockType: BlockType.COMMAND,
                    text: 'limpar display 7 segmentos'
                },
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
                tm1637Lengths: {
                    acceptReporters: true,
                    items: [
                        {text: '1', value: '1'},
                        {text: '2', value: '2'},
                        {text: '3', value: '3'},
                        {text: '4', value: '4'}
                    ]
                },
                tm1637Positions: {
                    acceptReporters: true,
                    items: [
                        {text: '1', value: '1'},
                        {text: '2', value: '2'},
                        {text: '3', value: '3'},
                        {text: '4', value: '4'}
                    ]
                },
                tm1637Point: {
                    acceptReporters: true,
                    items: [
                        {text: 'sem ponto', value: '0'},
                        {text: 'com ponto', value: '1'}
                    ]
                },
                tm1637LeadingZeros: {
                    acceptReporters: true,
                    items: [
                        {
                            text: 'sem zeros à esquerda',
                            value: '0'
                        },
                        {
                            text: 'com zeros à esquerda',
                            value: '1'
                        }
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
     * @returns {void} No transport command is sent.
     */
    configureMatrix (args) {
        const dinPin = Number(args.DIN);
        const csPin = Number(args.CS);
        const clkPin = Number(args.CLK);

        if (!this._isValidMatrixPin(dinPin) ||
            !this._isValidMatrixPin(csPin) ||
            !this._isValidMatrixPin(clkPin)) {
            return;
        }

        if (dinPin === csPin ||
            dinPin === clkPin ||
            csPin === clkPin) {
            return;
        }

        this._matrixDinPin = dinPin;
        this._matrixCsPin = csPin;
        this._matrixClkPin = clkPin;
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
     * Check whether a pin can be used by the TM1637 display.
     * @param {number} pin Arduino pin number.
     * @returns {boolean} True when valid.
     */
    _isValidTm1637Pin (pin) {
        return (
            Number.isInteger(pin) &&
            pin >= 2 &&
            pin <= 19
        );
    }

    /**
     * Configure the pins used by subsequent TM1637 blocks.
     * @param {object} args Scratch block arguments.
     * @returns {null} No transport command is sent.
     */
    tm1637Init (args) {
        const clkPin = Number(args.CLK);
        const dioPin = Number(args.DIO);

        if (
            !this._isValidTm1637Pin(clkPin) ||
            !this._isValidTm1637Pin(dioPin) ||
            clkPin === dioPin
        ) {
            return;
        }

        this._tm1637ClkPin = clkPin;
        this._tm1637DioPin = dioPin;

    }

    /**
     * Convert TM1637 block arguments to a complete four-digit frame.
     * @param {object} args Scratch block arguments.
     * @returns {number[]} Four raw segment bytes.
     */
    _tm1637ValueToSegments (args) {
        const rawValue = Number(args.VALUE);

        const value =
            Number.isFinite(rawValue) ?
                Math.max(0, Math.trunc(rawValue)) :
                0;

        const rawLength = Number(args.LENGTH);
        const rawPosition = Number(args.POSITION);

        const requestedLength =
            Number.isFinite(rawLength) ?
                Math.max(
                    1,
                    Math.min(
                        TM1637_DIGIT_COUNT,
                        Math.round(rawLength)
                    )
                ) :
                TM1637_DIGIT_COUNT;

        const position =
            Number.isFinite(rawPosition) ?
                Math.max(
                    1,
                    Math.min(
                        TM1637_DIGIT_COUNT,
                        Math.round(rawPosition)
                    )
                ) :
                1;

        const start = position - 1;

        const length = Math.min(
            requestedLength,
            TM1637_DIGIT_COUNT - start
        );

        const leadingZeros =
            String(args.LEADING_ZEROS) === '1';

        const segments =
            new Array(TM1637_DIGIT_COUNT).fill(0);

        const digitSegments =
            new Array(length).fill(0);

        let remaining = value;

        if (remaining === 0) {
            if (leadingZeros) {
                digitSegments.fill(
                    TM1637_DIGIT_SEGMENTS[0]
                );
            } else {
                digitSegments[length - 1] =
                    TM1637_DIGIT_SEGMENTS[0];
            }
        } else {
            for (
                let index = length - 1;
                index >= 0;
                index--
            ) {
                if (remaining > 0) {
                    const digit = remaining % 10;

                    digitSegments[index] =
                        TM1637_DIGIT_SEGMENTS[digit];

                    remaining =
                        Math.floor(remaining / 10);
                } else if (leadingZeros) {
                    digitSegments[index] =
                        TM1637_DIGIT_SEGMENTS[0];
                }
            }
        }

        for (let index = 0; index < length; index++) {
            segments[start + index] =
                digitSegments[index];
        }

        if (String(args.POINT) === '1') {
            segments[1] |= TM1637_POINT_MASK;
        }

        return segments;
    }

    /**
     * Show a number on the configured TM1637 display.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved after ACK, or null when unavailable.
     */
    tm1637Show (args) {
        return this._peripheral.tm1637Write(
            this._tm1637ClkPin,
            this._tm1637DioPin,
            this._tm1637ValueToSegments(args)
        );
    }

    /**
     * Clear the configured TM1637 display.
     * @returns {?Promise<number>} Promise resolved after ACK, or null when unavailable.
     */
    tm1637Clear () {
        return this._peripheral.tm1637Write(
            this._tm1637ClkPin,
            this._tm1637DioPin,
            new Array(TM1637_DIGIT_COUNT).fill(0)
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
