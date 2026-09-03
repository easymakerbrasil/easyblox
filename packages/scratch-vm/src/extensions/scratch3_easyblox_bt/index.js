const ArgumentType = require('../../extension-support/argument-type');
const BlockExecutionMode = require('../../extension-support/block-execution-mode');
const BlockType = require('../../extension-support/block-type');

const EXTENSION_ID = 'easybloxBt';

/**
 * Scratch blocks for EasyBlox BT.
 *
 * The public block surface is shared by Stage and Upload modes.
 * Transport behavior will be integrated incrementally.
 */
class Scratch3EasyBloxBtBlocks {
    /**
     * @param {object} runtime Scratch runtime.
     */
    constructor (runtime) {
        this.runtime = runtime;
    }

    /**
     * Describe the EasyBlox BT extension to the Scratch VM.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'EasyBlox BT',
            blocks: [
                {
                    opcode: 'sendText',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    text: 'enviar texto [TEXT] no canal [CHANNEL]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Olá'
                        },
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cmd'
                        }
                    }
                },
                {
                    opcode: 'whenTextReceived',
                    blockType: BlockType.HAT,
                    executionMode: BlockExecutionMode.BOTH,
                    text: 'quando EasyBlox BT receber texto no canal [CHANNEL]',
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cmd'
                        }
                    },
                    isEdgeActivated: false,
                    shouldRestartExistingThreads: false
                },
                {
                    opcode: 'receivedText',
                    blockType: BlockType.REPORTER,
                    executionMode: BlockExecutionMode.BOTH,
                    text: 'texto recebido'
                },
                {
                    opcode: 'sendNumber',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    text: 'enviar número [NUMBER] no canal [CHANNEL]',
                    arguments: {
                        NUMBER: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'valor'
                        }
                    }
                },
                {
                    opcode: 'whenNumberReceived',
                    blockType: BlockType.HAT,
                    executionMode: BlockExecutionMode.BOTH,
                    text: 'quando EasyBlox BT receber número no canal [CHANNEL]',
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'valor'
                        }
                    },
                    isEdgeActivated: false,
                    shouldRestartExistingThreads: false
                },
                {
                    opcode: 'receivedNumber',
                    blockType: BlockType.REPORTER,
                    executionMode: BlockExecutionMode.BOTH,
                    text: 'número recebido'
                }
            ]
        };
    }

    /**
     * EasyBlox BT TEXT receive hat.
     * Runtime transport behavior is implemented in a later checkpoint.
     * @returns {boolean} False until the Stage transport is integrated.
     */
    whenTextReceived () {
        return false;
    }

    /**
     * Send an EasyBlox BT text message.
     * Transport behavior is implemented in a later checkpoint.
     * @returns {void} No value.
     */
    sendText () {
        // Transport integration is intentionally deferred.
    }

    /**
     * Report the most recently received EasyBlox BT text.
     * Runtime transport behavior is implemented in a later checkpoint.
     * @returns {string} Empty text until transport integration.
     */
    receivedText () {
        return '';
    }

    /**
     * EasyBlox BT NUMBER receive hat.
     * Runtime transport behavior is implemented in a later checkpoint.
     * @returns {boolean} False until the Stage transport is integrated.
     */
    whenNumberReceived () {
        return false;
    }

    /**
     * Send an EasyBlox BT numeric message.
     * Transport behavior is implemented in a later checkpoint.
     * @returns {void} No value.
     */
    sendNumber () {
        // Transport integration is intentionally deferred.
    }

    /**
     * Report the most recently received EasyBlox BT number.
     * Runtime transport behavior is implemented in a later checkpoint.
     * @returns {number} Zero until transport integration.
     */
    receivedNumber () {
        return 0;
    }
}

module.exports = Scratch3EasyBloxBtBlocks;
