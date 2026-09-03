const ArgumentType = require('../../extension-support/argument-type');
const BlockExecutionMode = require('../../extension-support/block-execution-mode');
const BlockType = require('../../extension-support/block-type');

const {
    EBCP_CONTRACT
} = require('../../connectivity/easyblox-connectivity-contract');

const {
    EasyBloxConnectivityRuntime
} = require('../../connectivity/easyblox-connectivity-runtime');

const EXTENSION_ID = 'easybloxBt';

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

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
        this._connectivityRuntime =
            new EasyBloxConnectivityRuntime();
        this._receivedByThread = new WeakMap();
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
     * Get or initialize received EasyBlox BT values for one Scratch thread.
     * @param {object} util Scratch block utility.
     * @returns {?object} thread-local received state, or null
     */
    _getReceivedState (util) {
        const thread =
            util && util.thread;

        if (
            !thread ||
            (
                typeof thread !== 'object' &&
                typeof thread !== 'function'
            )
        ) {
            return null;
        }

        const sessionGeneration =
            this._connectivityRuntime.sessionGeneration;

        let state =
            this._receivedByThread.get(thread);

        if (
            !state ||
            state.sessionGeneration !== sessionGeneration
        ) {
            state = {
                text: '',
                number: 0,
                sessionGeneration
            };

            this._receivedByThread.set(
                thread,
                state
            );
        }

        return state;
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
     * @param {object} args block arguments
     * @param {string} args.CHANNEL EasyBlox BT channel
     * @param {object} util Scratch block utility
     * @returns {Promise<void>} resolves when a matching message is consumed
     */
    waitText (args, util) {
        return this._connectivityRuntime.waitFor(
            TEXT,
            args.CHANNEL
        ).then(message => {
            const state =
                this._getReceivedState(util);

            if (state) {
                state.text = message.payload;
            }
        });
    }

    /**
     * Report the most recently consumed EasyBlox BT text for this Scratch thread.
     * @param {object} args block arguments
     * @param {object} util Scratch block utility
     * @returns {string} received text, or empty text before the first receive
     */
    receivedText (args, util) {
        const state =
            this._getReceivedState(util);

        return state ?
            state.text :
            '';
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
     * @param {object} args block arguments
     * @param {string} args.CHANNEL EasyBlox BT channel
     * @param {object} util Scratch block utility
     * @returns {Promise<void>} resolves when a matching message is consumed
     */
    waitNumber (args, util) {
        return this._connectivityRuntime.waitFor(
            NUMBER,
            args.CHANNEL
        ).then(message => {
            const state =
                this._getReceivedState(util);

            if (state) {
                state.number = message.payload;
            }
        });
    }

    /**
     * Report the most recently consumed EasyBlox BT number for this Scratch thread.
     * @param {object} args block arguments
     * @param {object} util Scratch block utility
     * @returns {number} received number, or zero before the first receive
     */
    receivedNumber (args, util) {
        const state =
            this._getReceivedState(util);

        return state ?
            state.number :
            0;
    }
}

module.exports = Scratch3EasyBloxBtBlocks;
