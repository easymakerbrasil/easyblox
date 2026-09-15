const ArgumentType = require('../../extension-support/argument-type');
const BlockExecutionMode = require('../../extension-support/block-execution-mode');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');

const {
    EASYBLOX_BT_CHANNEL,
    EBCP_CONTRACT
} = require('../../connectivity/easyblox-connectivity-contract');

const {
    getEasyBloxStageConnectivity
} = require('../../connectivity/easyblox-stage-connectivity');

const {
    EasyConectState,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    getEasyConectWireChannel
} = require('@easymaker/easyconect-core');

const EXTENSION_ID = 'easybloxBt';

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;
const BOOLEAN = EBCP_CONTRACT.messageTypes.BOOLEAN;

const REQUIRED_BOARD_CAPABILITY =
    'bluetoothSerial';

    const GAMEPAD_SIGNAL_IDS =
    new Set(
        Object.values(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
        )
    );

const GAMEPAD_BUTTONS =
    Object.freeze([
        Object.freeze({
            text: 'cima',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_UP
        }),
        Object.freeze({
            text: 'baixo',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_DOWN
        }),
        Object.freeze({
            text: 'esquerda',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_LEFT
        }),
        Object.freeze({
            text: 'direita',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .DPAD_RIGHT
        }),
        Object.freeze({
            text: 'triângulo',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_TOP
        }),
        Object.freeze({
            text: 'quadrado',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_LEFT
        }),
        Object.freeze({
            text: 'cruz',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_BOTTOM
        }),
        Object.freeze({
            text: 'círculo',
            value:
                EASYCONECT_GAMEPAD_SIGNAL_IDS
                    .ACTION_RIGHT
        })
    ]);

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
        this._stageConnectivity =
            getEasyBloxStageConnectivity(runtime);
        this._receivedByThread = new WeakMap();
        this._easyConectState =
            new EasyConectState();
        this._gamepadWatcherGeneration = 0;
        this._gamepadWatchersActive = false;

        this._gamepadSessionGeneration =
            this._stageConnectivity
                .sessionGeneration;

        this._gamepadStageInitialization =
            null;

        if (
            this.runtime &&
            typeof this.runtime.on ===
                'function'
        ) {
            this.runtime.on(
                'PROJECT_STOP_ALL',
                () => {
                    this._easyConectState
                        .reset();

                    this._gamepadSessionGeneration =
                        this._stageConnectivity
                            .sessionGeneration;

                    ++this._gamepadWatcherGeneration;
                    this._gamepadWatchersActive =
                        false;
                }
            );
        }
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
                    blockType: BlockType.LABEL,
                    text: 'Comunicação'
                },
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
                    text: 'enviar texto [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Olá'
                        }
                    }
                },
                {
                    opcode: 'waitText',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'aguardar texto'
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
                    text: 'enviar número [NUMBER]',
                    arguments: {
                        NUMBER: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'waitNumber',
                    blockType: BlockType.COMMAND,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'aguardar número'
                },
                {
                    opcode: 'receivedNumber',
                    blockType: BlockType.REPORTER,
                    executionMode: BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text: 'número recebido'
                },
                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'GAMEPAD'
                },
                {
                    opcode:
                        'isGamepadButtonPressed',
                    blockType:
                        BlockType.BOOLEAN,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        '[BUTTON] está pressionado no gamepad?',
                    arguments: {
                        BUTTON: {
                            type:
                                ArgumentType.STRING,
                            menu:
                                'gamepadButtons',
                            defaultValue:
                                EASYCONECT_GAMEPAD_SIGNAL_IDS
                                    .DPAD_UP
                        }
                    }
                }
            ],
            menus: {
                gamepadButtons: {
                    acceptReporters: false,
                    items:
                        GAMEPAD_BUTTONS
                }
            }
        };
    }

    /**
     * Reset transient GAMEPAD state when the EBCP session changes.
     * @returns {void}
     * @private
     */
    _syncGamepadSessionState () {
        const sessionGeneration =
            this._stageConnectivity
                .sessionGeneration;

        if (
            sessionGeneration ===
            this._gamepadSessionGeneration
        ) {
            return;
        }

        this._easyConectState.reset();

        this._gamepadSessionGeneration =
            sessionGeneration;
    }

    /**
     * Arm one pending BOOLEAN receive for every canonical GAMEPAD signal.
     * @returns {void}
     * @private
     */
    _startGamepadStageWatchers () {
        if (this._gamepadWatchersActive) {
            return;
        }

        this._gamepadWatchersActive = true;

        const watcherGeneration =
            ++this._gamepadWatcherGeneration;

        for (
            const signalId of
            GAMEPAD_SIGNAL_IDS
        ) {
            this._watchGamepadStageSignal(
                signalId,
                watcherGeneration
            );
        }
    }

    /**
     * Keep one pending EBCP waiter armed for one GAMEPAD signal.
     * @param {string} signalId canonical EasyConect signal id.
     * @param {number} watcherGeneration watcher generation.
     * @returns {void}
     * @private
     */
    _watchGamepadStageSignal (
        signalId,
        watcherGeneration
    ) {
        const channel =
            getEasyConectWireChannel(
                signalId
            );

        if (!channel) {
            return;
        }

        this._stageConnectivity
            .waitFor(
                BOOLEAN,
                channel
            )
            .then(message => {
                if (
                    watcherGeneration !==
                    this._gamepadWatcherGeneration
                ) {
                    return;
                }

                this._syncGamepadSessionState();

                this._easyConectState
                    .setSignalValue(
                        signalId,
                        message.payload
                    );

                this._watchGamepadStageSignal(
                    signalId,
                    watcherGeneration
                );
            });
    }

    /**
     * Track one board-side Bluetooth initialization.
     * @param {*} initialization provider initialization result.
     * @returns {*} original initialization result.
     * @private
     */
    _rememberGamepadStageInitialization (
        initialization
    ) {
        if (!initialization) {
            return initialization;
        }

        const tracked =
            Promise.resolve(
                initialization
            );

        this._gamepadStageInitialization =
            tracked;

        tracked.catch(() => {
            if (
                this._gamepadStageInitialization ===
                tracked
            ) {
                this._gamepadStageInitialization =
                    null;
            }
        });

        return initialization;
    }

    /**
     * GAMEPAD is a high-level module and therefore starts its Stage
     * Bluetooth transport automatically on first use.
     * @returns {void}
     * @private
     */
    _ensureGamepadStageTransport () {
        if (
            this._gamepadStageInitialization
        ) {
            return;
        }

        this._rememberGamepadStageInitialization(
            this._stageConnectivity
                .initializeBluetoothSerial()
        );
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
            this._stageConnectivity.sessionGeneration;

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
     * Initialize the shared EasyBlox Stage Bluetooth connectivity.
     * @returns {?Promise<number>} provider initialization result,
     * or null when the transport is unavailable.
     */
    init () {
        return this
            ._rememberGamepadStageInitialization(
                this._stageConnectivity
                    .initializeBluetoothSerial()
            );
    }

    /**
     * Send an EasyBlox BT TEXT message on the fixed internal EBCP channel.
     * @param {object} args block arguments.
     * @param {string} args.TEXT text payload.
     * @returns {?number} EBCP application sequence, or null when unavailable.
     */
    sendText (args) {
        return this._stageConnectivity.send(
            TEXT,
            EASYBLOX_BT_CHANNEL,
            args.TEXT
        );
    }

    /**
     * Wait for an EasyBlox BT TEXT message on the fixed internal EBCP channel.
     * @param {object} args block arguments
     * @param {object} util Scratch block utility
     * @returns {Promise<void>} resolves when a matching message is consumed
     */
    waitText (args, util) {
        return this._stageConnectivity.waitFor(
            TEXT,
            EASYBLOX_BT_CHANNEL
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
     * Send an EasyBlox BT NUMBER message on the fixed internal EBCP channel.
     * @param {object} args block arguments.
     * @param {number} args.NUMBER numeric payload.
     * @returns {?number} EBCP application sequence, or null when unavailable.
     */
    sendNumber (args) {
        return this._stageConnectivity.send(
            NUMBER,
            EASYBLOX_BT_CHANNEL,
            Cast.toNumber(args.NUMBER)
        );
    }

    /**
     * Wait for an EasyBlox BT NUMBER message on the fixed internal EBCP channel.
     * @param {object} args block arguments
     * @param {object} util Scratch block utility
     * @returns {Promise<void>} resolves when a matching message is consumed
     */
    waitNumber (args, util) {
        return this._stageConnectivity.waitFor(
            NUMBER,
            EASYBLOX_BT_CHANNEL
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

    /**
     * Report whether one EasyConect GAMEPAD button is currently pressed.
     * @param {object} args block arguments.
     * @returns {boolean} current pressed state.
     */
    isGamepadButtonPressed (args) {
        const signalId =
            args && args.BUTTON;

        if (
            !GAMEPAD_SIGNAL_IDS.has(
                signalId
            )
        ) {
            return false;
        }

        this._startGamepadStageWatchers();
        this._ensureGamepadStageTransport();
        this._syncGamepadSessionState();

        return this._easyConectState
            .getSignalValue(
                signalId
            );
    }
}

module.exports = Scratch3EasyBloxBtBlocks;
