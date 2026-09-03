const ArgumentType = require('../../extension-support/argument-type');
const BlockExecutionMode = require('../../extension-support/block-execution-mode');
const BlockType = require('../../extension-support/block-type');

const EXTENSION_ID = 'easybloxBt';

const REQUIRED_BOARD_CAPABILITY =
    'bluetoothSerial';

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
            color1: '#0a3e91',
            color2: '#083477',
            color3: '#06285c',
            blocks: [
                {
                    opcode: 'init',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'iniciar EasyBlox BT'
                },
                {
                    opcode: 'sendText',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
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
                    opcode: 'waitText',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'aguardar texto no canal [CHANNEL]',
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cmd'
                        }
                    }
                },
                {
                    opcode: 'receivedText',
                    blockType: BlockType.REPORTER,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'texto recebido'
                },
                {
                    opcode: 'sendNumber',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
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
                    opcode: 'waitNumber',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'aguardar número no canal [CHANNEL]',
                    arguments: {
                        CHANNEL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'valor'
                        }
                    }
                },
                {
                    opcode: 'receivedNumber',
                    blockType: BlockType.REPORTER,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'número recebido'
                }
            ]
        };
    }

    /**
     * Initialize the EasyBlox BT transport.
     * Runtime transport behavior is implemented in a later checkpoint.
     * @returns {void} No value.
     */
    init () {
        // Transport integration is intentionally deferred.
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
     * Wait for an EasyBlox BT TEXT message on a channel.
     * Runtime blocking behavior is implemented in a later checkpoint.
     * @returns {void} No value.
     */
    waitText () {
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
     * Send an EasyBlox BT numeric message.
     * Transport behavior is implemented in a later checkpoint.
     * @returns {void} No value.
     */
    sendNumber () {
        // Transport integration is intentionally deferred.
    }

    /**
     * Wait for an EasyBlox BT NUMBER message on a channel.
     * Runtime blocking behavior is implemented in a later checkpoint.
     * @returns {void} No value.
     */
    waitNumber () {
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
