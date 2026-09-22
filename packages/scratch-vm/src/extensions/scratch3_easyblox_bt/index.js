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
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
    EASYCONECT_OUTPUTS_SIGNAL_IDS,
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

const MOTORS_SERVO_MOTOR_SIGNAL_IDS =
    new Set([
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .MOTOR_1,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .MOTOR_2
    ]);

const MOTORS_SERVO_SERVO_SIGNAL_IDS =
    new Set([
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_1,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_2,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_3,
        EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_4
    ]);

const MOTORS_SERVO_MOTORS =
    Object.freeze([
        Object.freeze({
            text: '1',
            value:
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
        }),
        Object.freeze({
            text: '2',
            value:
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2
        })
    ]);

const MOTORS_SERVO_SERVOS =
    Object.freeze([
        Object.freeze({
            text: '1',
            value:
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1
        }),
        Object.freeze({
            text: '2',
            value:
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_2
        }),
        Object.freeze({
            text: '3',
            value:
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_3
        }),
        Object.freeze({
            text: '4',
            value:
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_4
        })
    ]);

const MOTORS_SERVO_DIGITAL_PINS =
Object.freeze([
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
]);

const MOTORS_SERVO_PWM_PINS =
    Object.freeze([
        {text: 'D5', value: '5'},
        {text: 'D6', value: '6'},
        {text: 'D9', value: '9'},
        {text: 'D10', value: '10'},
        {text: 'D11', value: '11'}
    ]);

const MOTORS_SERVO_SERVO_PINS =
    Object.freeze([
        {text: 'D5', value: '5'},
        {text: 'D9', value: '9'},
        {text: 'D10', value: '10'},
        {text: 'D11', value: '11'}
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
        ),
        createEasyConectStageSignal(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_1,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_2,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_1,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_2,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_3,
            NUMBER
        ),
        createEasyConectStageSignal(
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_4,
            NUMBER
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

        this._easyConectRemoteActuatorBindings =
            new Map();

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

                    this._easyConectRemoteActuatorBindings
                        .clear();

                    this._easyConectSessionGeneration =
                        this._stageConnectivity
                            .sessionGeneration;

                    ++this._easyConectWatcherGeneration;
                    this._easyConectWatchersActive =
                        false;
                }
            );

            this.runtime.on(
                'PERIPHERAL_STAGE_READY',
                data => {
                    if (
                        !data ||
                        data.extensionId !==
                            'arduinoUno'
                    ) {
                        return;
                    }

                    this._easyConectStageInitialization =
                        null;

                    this._ensureEasyConectStageTransport();
                }
            );

            const stagePeripheral =
                this._getEasyConectActuatorPeripheral();

            if (
                stagePeripheral &&
                typeof stagePeripheral
                    .isStageConnected ===
                    'function' &&
                stagePeripheral
                    .isStageConnected()
            ) {
                this._ensureEasyConectStageTransport();
            }
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
                    text: 'Gamepad'
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
                    text: 'Controles'
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
                },
                '---',
                {
                    blockType:
                        BlockType.LABEL,
                    text:
                        'Motores e Servos'
                },
                {
                    opcode:
                        'motorsServoMotorControl',
                    blockType:
                        BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        'controlar motor [MOTOR] IN1 [IN1] IN2 [IN2] PWM [PWM] pelo EasyConect',
                    arguments: {
                        MOTOR: {
                            type:
                                ArgumentType.STRING,
                            menu:
                                'motorsServoMotors',
                            defaultValue:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .MOTOR_1
                        },
                        IN1: {
                            type:
                                ArgumentType.NUMBER,
                            menu:
                                'motorsServoDigitalPins',
                            defaultValue: 7
                        },
                        IN2: {
                            type:
                                ArgumentType.NUMBER,
                            menu:
                                'motorsServoDigitalPins',
                            defaultValue: 8
                        },
                        PWM: {
                            type:
                                ArgumentType.NUMBER,
                            menu:
                                'motorsServoPwmPins',
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode:
                        'motorsServoServoControl',
                    blockType:
                        BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        'controlar servo [SERVO] no pino [PIN] pelo EasyConect',
                    arguments: {
                        SERVO: {
                            type:
                                ArgumentType.STRING,
                            menu:
                                'motorsServoServos',
                            defaultValue:
                                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                    .SERVO_1
                        },
                        PIN: {
                            type:
                                ArgumentType.NUMBER,
                            menu:
                                'motorsServoServoPins',
                            defaultValue: 5
                        }
                    }
                },
                '---',
                {
                    blockType:
                        BlockType.LABEL,
                    text:
                        'Saídas'
                },
                {
                    opcode:
                        'outputsSetIndicator',
                    blockType:
                        BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.BOTH,
                    requiredBoardCapability:
                        REQUIRED_BOARD_CAPABILITY,
                    text:
                        'definir indicador [STATE] no EasyConect',
                    arguments: {
                        STATE: {
                            type:
                                ArgumentType.STRING,
                            menu:
                                'outputsIndicatorStates',
                            defaultValue:
                                'true'
                        }
                    }
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
                },
                motorsServoMotors: {
                    acceptReporters: false,
                    items:
                        MOTORS_SERVO_MOTORS
                },
                motorsServoServos: {
                    acceptReporters: false,
                    items:
                        MOTORS_SERVO_SERVOS
                },
                motorsServoDigitalPins: {
                    acceptReporters: true,
                    items:
                        MOTORS_SERVO_DIGITAL_PINS
                },
                motorsServoPwmPins: {
                    acceptReporters: true,
                    items:
                        MOTORS_SERVO_PWM_PINS
                },
                motorsServoServoPins: {
                    acceptReporters: true,
                    items:
                        MOTORS_SERVO_SERVO_PINS
                },
                outputsIndicatorStates: {
                    acceptReporters: false,
                    items: [
                        {
                            text: 'ligado',
                            value: 'true'
                        },
                        {
                            text: 'desligado',
                            value: 'false'
                        }
                    ]
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

                this._applyEasyConectRemoteActuatorSignal(
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
     * Resolve the active board peripheral used by EasyConect actuators.
     * The actuator path must reuse the same neutral Bluetooth-capable
     * provider selected by the shared Stage connectivity layer.
     * @returns {?object} active board peripheral, or null when unavailable.
     * @private
     */
    _getEasyConectActuatorPeripheral () {
        if (
            !this.runtime ||
            typeof this.runtime
                .getPeripheralExtensionByCapability !==
                'function'
        ) {
            return null;
        }

        return this.runtime
            .getPeripheralExtensionByCapability(
                REQUIRED_BOARD_CAPABILITY
            );
    }

    /**
     * Apply one received EasyConect actuator signal to its active Stage
     * physical binding.
     * @param {string} signalId canonical EasyConect signal id.
     * @param {number} value received canonical value.
     * @returns {void}
     * @private
     */
    _applyEasyConectRemoteActuatorSignal (
        signalId,
        value
    ) {
        const binding =
            this._easyConectRemoteActuatorBindings
                .get(signalId);

        if (!binding) {
            return;
        }

        const numericValue =
            Number(value);

        if (!Number.isFinite(numericValue)) {
            return;
        }

        const peripheral =
            this._getEasyConectActuatorPeripheral();

        if (!peripheral) {
            return;
        }

        if (binding.type === 'motor') {
            if (
                typeof peripheral.motorWrite !==
                    'function'
            ) {
                return;
            }

            const direction =
                numericValue < 0 ?
                    1 :
                    0;

            const speedPercent =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Math.round(
                            Math.abs(
                                numericValue
                            )
                        )
                    )
                );

            const speed =
                Math.round(
                    speedPercent *
                    255 /
                    100
                );

            peripheral.motorWrite(
                binding.in1Pin,
                binding.in2Pin,
                binding.pwmPin,
                direction,
                speed
            );

            return;
        }

        if (
            binding.type === 'servo' &&
            typeof peripheral.servoWrite ===
                'function'
        ) {
            const angle =
                Math.max(
                    0,
                    Math.min(
                        180,
                        Math.round(
                            numericValue
                        )
                    )
                );

            peripheral.servoWrite(
                binding.pin,
                angle
            );
        }
    }

    /**
     * Register one remote actuator Stage binding and ensure EasyConect
     * reception is active.
     * @param {string} signalId canonical EasyConect signal id.
     * @param {object} binding physical actuator binding.
     * @returns {void}
     * @private
     */
    _bindEasyConectRemoteActuator (
        signalId,
        binding
    ) {
        this._easyConectRemoteActuatorBindings
            .set(
                signalId,
                binding
            );

        this._startEasyConectStageWatchers();
        this._ensureEasyConectStageTransport();
        this._syncEasyConectSessionState();
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

    /**
     * Bind one EasyConect motor command to physical Arduino UNO pins.
     * @param {object} args block arguments.
     * @returns {?void} null when the binding is invalid.
     */
    motorsServoMotorControl (args) {
        const signalId =
            args && args.MOTOR;

        const in1Pin =
            Number(args && args.IN1);

        const in2Pin =
            Number(args && args.IN2);

        const pwmPin =
            Number(args && args.PWM);

        if (
            !MOTORS_SERVO_MOTOR_SIGNAL_IDS
                .has(signalId) ||
            !Number.isInteger(in1Pin) ||
            !Number.isInteger(in2Pin) ||
            !Number.isInteger(pwmPin) ||
            in1Pin < 4 ||
            in1Pin > 19 ||
            in2Pin < 4 ||
            in2Pin > 19 ||
            ![5, 6, 9, 10, 11]
                .includes(pwmPin) ||
            in1Pin === in2Pin ||
            in1Pin === pwmPin ||
            in2Pin === pwmPin
        ) {
            return null;
        }

        this._bindEasyConectRemoteActuator(
            signalId,
            {
                type: 'motor',
                in1Pin,
                in2Pin,
                pwmPin
            }
        );
    }

    /**
     * Bind one EasyConect servo command to one physical Arduino UNO pin.
     * @param {object} args block arguments.
     * @returns {?void} null when the binding is invalid.
     */
    motorsServoServoControl (args) {
        const signalId =
            args && args.SERVO;

        const pin =
            Number(args && args.PIN);

        if (
            !MOTORS_SERVO_SERVO_SIGNAL_IDS
                .has(signalId) ||
            !Number.isInteger(pin) ||
            ![5, 9, 10, 11]
                .includes(pin)
        ) {
            return null;
        }

        this._bindEasyConectRemoteActuator(
            signalId,
            {
                type: 'servo',
                pin
            }
        );
    }

    /**
     * Send the EasyConect indicator state through the canonical Stage channel.
     * @param {object} args block arguments.
     * @param {string} args.STATE canonical indicator state.
     * @returns {?number} EBCP application sequence, or null when unavailable.
     */
    outputsSetIndicator (args) {
        return this._stageConnectivity.send(
            BOOLEAN,
            getEasyConectWireChannel(
                EASYCONECT_OUTPUTS_SIGNAL_IDS
                    .INDICATOR
            ),
            Cast.toString(
                args.STATE
            ) === 'true'
        );
    }
}

module.exports = Scratch3EasyBloxBtBlocks;
