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
    EASYCONECT_CONTROLS_SIGNAL_IDS,
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

const CONTROLS_JOYSTICK_SIGNAL_IDS =
    new Set([
        EASYCONECT_CONTROLS_SIGNAL_IDS
            .JOYSTICK_X,
        EASYCONECT_CONTROLS_SIGNAL_IDS
            .JOYSTICK_Y
    ]);

const CONTROLS_JOYSTICK_AXES =
    Object.freeze([
        Object.freeze({
            text: 'horizontal',
            value:
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_X
        }),
        Object.freeze({
            text: 'vertical',
            value:
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .JOYSTICK_Y
        })
    ]);

const createEasyConectStageSignal =
    (
        signalId,
        messageType
    ) =>
        Object.freeze({
            signalId,
            messageType
        });

const EASYCONECT_STAGE_SIGNALS =
    Object.freeze([
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_UP,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_DOWN,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_LEFT,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_RIGHT,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_TOP,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_LEFT,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_BOTTOM,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_RIGHT,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_X,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_Y,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .SLIDER,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .BUTTON,
            BOOLEAN
        ),
        createEasyConectStageSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .SWITCH,
            BOOLEAN
        )
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
        this._easyConectWatcherGeneration = 0;
        this._easyConectWatchersActive = false;

        this._easyConectSessionGeneration =
            this._stageConnectivity
                .sessionGeneration;

        this._easyConectStageInitialization =
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

                    this._easyConectSessionGeneration =
                        this._stageConnectivity
                            .sessionGeneration;

                    ++this._easyConectWatcherGeneration;
                    this._easyConectWatchersActive =
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
                },
                '---',
                {
                    blockType:
                        BlockType.LABEL,
                    text: 'CONTROLES'
                },
                {
                    opcode:
                        'controlsJoystickPosition',
                    blockType:
                        BlockType.REPORTER,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        'posição [AXIS] do joystick',
                    arguments: {
                        AXIS: {
                            type:
                                ArgumentType.STRING,
                            menu:
                                'controlsJoystickAxis',
                            defaultValue:
                                EASYCONECT_CONTROLS_SIGNAL_IDS
                                    .JOYSTICK_X
                        }
                    }
                },
                {
                    opcode:
                        'controlsSliderValue',
                    blockType:
                        BlockType.REPORTER,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        'valor do slider'
                },
                {
                    opcode:
                        'isControlsButtonPressed',
                    blockType:
                        BlockType.BOOLEAN,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        'botão está pressionado?'
                },
                {
                    opcode:
                        'isControlsSwitchOn',
                    blockType:
                        BlockType.BOOLEAN,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        'chave está ligada?'
                }
            ],
            menus: {
                gamepadButtons: {
                    acceptReporters: false,
                    items:
                        GAMEPAD_BUTTONS
                },
                controlsJoystickAxis: {
                    acceptReporters: false,
                    items:
                        CONTROLS_JOYSTICK_AXES
                }
            }
        };
    }

    /**
     * Reset transient GAMEPAD state when the EBCP session changes.
     * @returns {void}
     * @private
     */
    _syncEasyConectSessionState () {
        const sessionGeneration =
            this._stageConnectivity
                .sessionGeneration;

        if (
            sessionGeneration ===
            this._easyConectSessionGeneration
        ) {
            return;
        }

        this._easyConectState.reset();

        this._easyConectSessionGeneration =
            sessionGeneration;
    }

    /**
     * Arm one pending EBCP receive for every high-level EasyConect signal.
     * @returns {void}
     * @private
     */
    _startEasyConectStageWatchers () {
        if (
            this._easyConectWatchersActive
        ) {
            return;
        }

        this._easyConectWatchersActive =
            true;

        const watcherGeneration =
            ++this._easyConectWatcherGeneration;

        for (
            const signal of
            EASYCONECT_STAGE_SIGNALS
        ) {
            this._watchEasyConectStageSignal(
                signal,
                watcherGeneration
            );
        }
    }

    /**
     * Keep one pending EBCP waiter armed for one EasyConect signal.
     * @param {object} signal canonical Stage signal descriptor.
     * @param {string} signal.signalId canonical EasyConect signal id.
     * @param {number} signal.messageType EBCP application message type.
     * @param {number} watcherGeneration watcher generation.
     * @returns {void}
     * @private
     */
    _watchEasyConectStageSignal (
        signal,
        watcherGeneration
    ) {
        const channel =
            getEasyConectWireChannel(
                signal.signalId
            );

        if (!channel) {
            return;
        }

        this._stageConnectivity
            .waitFor(
                signal.messageType,
                channel
            )
            .then(message => {
                if (
                    watcherGeneration !==
                    this._easyConectWatcherGeneration
                ) {
                    return;
                }

                this._syncEasyConectSessionState();

                this._easyConectState
                    .setSignalValue(
                        signal.signalId,
                        message.payload
                    );

                this._watchEasyConectStageSignal(
                    signal,
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
    _rememberEasyConectStageInitialization (
        initialization
    ) {
        if (!initialization) {
            return initialization;
        }

        const tracked =
            Promise.resolve(
                initialization
            );

        this._easyConectStageInitialization =
            tracked;

        tracked.catch(() => {
            if (
                this._easyConectStageInitialization ===
                tracked
            ) {
                this._easyConectStageInitialization =
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
    _ensureEasyConectStageTransport () {
        if (
            this._easyConectStageInitialization
        ) {
            return;
        }

        this._rememberEasyConectStageInitialization(
            this._stageConnectivity
                .initializeBluetoothSerial()
        );
    }

    /**
     * Read one high-level EasyConect Stage signal.
     * Reception and Bluetooth initialization are shared by all modules.
     * @param {string} signalId canonical EasyConect signal id.
     * @returns {*} current canonical signal value.
     * @private
     */
    _readEasyConectSignal (signalId) {
        this._startEasyConectStageWatchers();
        this._ensureEasyConectStageTransport();
        this._syncEasyConectSessionState();

        return this._easyConectState
            .getSignalValue(
                signalId
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
            ._rememberEasyConectStageInitialization(
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

        return this._readEasyConectSignal(
            signalId
        );
    }
    /**
     * Report one canonical Controls joystick axis.
     * @param {object} args block arguments.
     * @returns {number} current joystick position.
     */
    controlsJoystickPosition (args) {
        const signalId =
            args && args.AXIS;

        if (
            !CONTROLS_JOYSTICK_SIGNAL_IDS
                .has(signalId)
        ) {
            return 0;
        }

        return this._readEasyConectSignal(
            signalId
        );
    }

    /**
     * Report the canonical Controls slider position.
     * @returns {number} current slider value.
     */
    controlsSliderValue () {
        return this._readEasyConectSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .SLIDER
        );
    }

    /**
     * Report whether the Controls button is pressed.
     * @returns {boolean} current button state.
     */
    isControlsButtonPressed () {
        return this._readEasyConectSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .BUTTON
        );
    }

    /**
     * Report whether the Controls switch is on.
     * @returns {boolean} current switch state.
     */
    isControlsSwitchOn () {
        return this._readEasyConectSignal(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .SWITCH
        );
    }
}

module.exports = Scratch3EasyBloxBtBlocks;
