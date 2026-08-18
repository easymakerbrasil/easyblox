const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

const EXTENSION_ID = 'displays';

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
