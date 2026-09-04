const ArgumentType = require('../../extension-support/argument-type');
const BlockExecutionMode = require('../../extension-support/block-execution-mode');
const BlockType = require('../../extension-support/block-type');

const {
    EBCP_CONTRACT
} = require('../../connectivity/easyblox-connectivity-contract');

const {
    EasyBloxConnectivitySession
} = require('../../connectivity/easyblox-connectivity-session');

const {
    EasyBloxConnectivityRuntime
} = require('../../connectivity/easyblox-connectivity-runtime');

const EXTENSION_ID = 'easybloxBt';

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

const REQUIRED_BOARD_CAPABILITY =
    'bluetoothSerial';

const STAGE_TRANSPORT_CHUNK_BYTES = 32;

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
        this._connectivitySession = null;
        this._bluetoothSerialProvider = null;
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
     * Write one complete EBCP frame through the Stage Bluetooth transport.
     * Stage payloads are limited to 32 bytes, while EBCP frames can be
     * larger and therefore require transparent byte-stream fragmentation.
     * @param {Uint8Array} data Complete encoded EBCP frame.
     * @returns {?number} Last Stage sequence written, or null when unavailable.
     */
    _writeStageTransport (data) {
        if (!this._bluetoothSerialProvider) {
            return null;
        }

        let lastSequence = null;

        for (
            let offset = 0;
            offset < data.length;
            offset += STAGE_TRANSPORT_CHUNK_BYTES
        ) {
            const chunk =
                data.subarray(
                    offset,
                    Math.min(
                        offset + STAGE_TRANSPORT_CHUNK_BYTES,
                        data.length
                    )
                );

            lastSequence =
                this._bluetoothSerialProvider
                    .writeBluetoothSerial(
                        Uint8Array.from(chunk)
                    );

            if (lastSequence === null) {
                return null;
            }
        }

        return lastSequence;
    }

    /**
     * Initialize the EasyBlox BT Stage transport through a neutral
     * Bluetooth Serial provider.
     * @returns {?Promise<number>} Provider initialization result,
     * or null when the transport is unavailable.
     */
    init () {
        if (
            !this.runtime ||
            typeof this.runtime
                .getPeripheralExtensionByCapability !== 'function'
        ) {
            return null;
        }

        const provider =
            this.runtime.getPeripheralExtensionByCapability(
                REQUIRED_BOARD_CAPABILITY
            );

        if (
            !provider ||
            typeof provider.onBluetoothSerialData !== 'function' ||
            typeof provider.initBluetoothSerial !== 'function' ||
            typeof provider.writeBluetoothSerial !== 'function'
        ) {
            return null;
        }

        this._bluetoothSerialProvider = provider;

        this._connectivitySession =
            new EasyBloxConnectivitySession({
                runtime: this._connectivityRuntime,
                write: data =>
                    this._writeStageTransport(data)
            });

        provider.onBluetoothSerialData(
            data => {
                this._connectivitySession.push(data);
            }
        );

        return provider.initBluetoothSerial();
    }

    /**
     * Send an EasyBlox BT TEXT message.
     * @param {object} args block arguments.
     * @param {string} args.TEXT text payload.
     * @param {string} args.CHANNEL EasyBlox BT channel.
     * @returns {?number} EBCP application sequence, or null when unavailable.
     */
    sendText (args) {
        if (!this._connectivitySession) {
            return null;
        }

        return this._connectivitySession.send(
            TEXT,
            args.CHANNEL,
            args.TEXT
        );
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
     * Send an EasyBlox BT NUMBER message.
     * @param {object} args block arguments.
     * @param {number} args.NUMBER numeric payload.
     * @param {string} args.CHANNEL EasyBlox BT channel.
     * @returns {?number} EBCP application sequence, or null when unavailable.
     */
    sendNumber (args) {
        if (!this._connectivitySession) {
            return null;
        }

        return this._connectivitySession.send(
            NUMBER,
            args.CHANNEL,
            args.NUMBER
        );
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
