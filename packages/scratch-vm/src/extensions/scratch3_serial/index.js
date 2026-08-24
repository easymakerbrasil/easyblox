const ArgumentType = require('../../extension-support/argument-type');
const BlockExecutionMode = require('../../extension-support/block-execution-mode');
const BlockType = require('../../extension-support/block-type');

const EXTENSION_ID = 'serial';

/**
 * Serial blocks for Upload Mode programs.
 */
class Scratch3SerialBlocks {
    /**
     * Describe the Serial extension to the Scratch VM.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'Serial',
            blocks: [
                {
                    opcode: 'serialBegin',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.UPLOAD_ONLY,
                    text: 'iniciar serial em [BAUD] baud',
                    arguments: {
                        BAUD: {
                            type: ArgumentType.STRING,
                            menu: 'baudRates',
                            defaultValue: '9600'
                        }
                    }
                },
                {
                    opcode: 'serialWrite',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.UPLOAD_ONLY,
                    text: 'escrever na serial [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        }
                    }
                },
                {
                    opcode: 'serialWriteLine',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.UPLOAD_ONLY,
                    text: 'escrever linha na serial [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: ''
                        }
                    }
                }
            ],
            menus: {
                baudRates: {
                    acceptReporters: false,
                    items: [
                        {text: '4800', value: '4800'},
                        {text: '9600', value: '9600'},
                        {text: '19200', value: '19200'},
                        {text: '38400', value: '38400'},
                        {text: '57600', value: '57600'},
                        {text: '115200', value: '115200'}
                    ]
                }
            }
        };
    }
}

module.exports = Scratch3SerialBlocks;
