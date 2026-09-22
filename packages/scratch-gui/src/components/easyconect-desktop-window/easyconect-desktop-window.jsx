import PropTypes from 'prop-types';
import React from 'react';

import {
    EASYCONECT_GAMEPAD_SIGNAL_IDS
} from '@easymaker/easyconect-core';

import styles from './easyconect-desktop-window.css';

const EASYCONECT_MODULES = [
    'Gamepad',
    'Controles',
    'Motores e Servos',
    'Terminal',
    'Saídas'
];

const clampPosition = (
    value,
    maximum
) =>
    Math.min(
        Math.max(value, 0),
        Math.max(maximum, 0)
    );

const DEFAULT_CONNECTION_STATE = {
    status:
        'disconnected',
    devices: [],
    connectedDeviceName:
        null,
    errorCode:
        null
};

const NOOP =
    () => {};

const EasyConectConnectionStatus = ({
    connectionState,
    onConnect,
    onDisconnect,
    onSelectDevice
}) => {
    const {
        status,
        devices = [],
        connectedDeviceName,
        errorCode
    } = connectionState;

    const handleDeviceClick =
        React.useCallback(
            event => {
                onSelectDevice(
                    event.currentTarget.dataset.deviceKey
                );
            },
            [onSelectDevice]
        );

    if (
        status === 'disconnected'
    ) {
        const message =
            errorCode ===
                'connection-lost' ?
                'Conexão Bluetooth perdida' :
                'Bluetooth desconectado';

        return (
            <div className={styles.connectionBar}>
                <div className={styles.connectionStatus}>
                    <span
                        aria-hidden="true"
                        className={styles.connectionDot}
                    />
                    <span>
                        {message}
                    </span>
                </div>

                <button
                    className={styles.connectionButton}
                    type="button"
                    onClick={onConnect}
                >
                    Conectar
                </button>
            </div>
        );
    }

    if (
        status === 'discovering'
    ) {
        return (
            <div className={styles.connectionBar}>
                <div className={styles.connectionStatus}>
                    <span
                        aria-hidden="true"
                        className={styles.connectionDotBusy}
                    />
                    <span>
                        Procurando Bluetooth...
                    </span>
                </div>
            </div>
        );
    }

    if (
        status === 'connecting'
    ) {
        return (
            <div className={styles.connectionBar}>
                <div className={styles.connectionStatus}>
                    <span
                        aria-hidden="true"
                        className={styles.connectionDotBusy}
                    />
                    <span>
                        Conectando Bluetooth...
                    </span>
                </div>
            </div>
        );
    }

    if (
        status === 'connected'
    ) {
        return (
            <div className={styles.connectionBar}>
                <div className={styles.connectionStatus}>
                    <span
                        aria-hidden="true"
                        className={styles.connectionDotConnected}
                    />
                    <span>
                        {connectedDeviceName ?
                            `Bluetooth conectado · ${connectedDeviceName}` :
                            'Bluetooth conectado'}
                    </span>
                </div>

                <button
                    className={styles.connectionButton}
                    type="button"
                    onClick={onDisconnect}
                >
                    Desconectar
                </button>
            </div>
        );
    }

    if (
        status === 'selecting'
    ) {
        return (
            <div
                className={
                    styles.connectionSelection
                }
            >
                <span
                    className={
                        styles.connectionSelectionTitle
                    }
                >
                    Escolha o dispositivo Bluetooth
                </span>

                <div
                    className={
                        styles.connectionDevices
                    }
                >
                    {devices.map(device => (
                        <button
                            className={
                                styles.deviceButton
                            }
                            data-device-key={device.key}
                            key={device.key}
                            type="button"
                            onClick={handleDeviceClick}
                        >
                            {device.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (
        status === 'no-devices'
    ) {
        return (
            <div className={styles.connectionBar}>
                <span className={styles.connectionMessage}>
                    Nenhum dispositivo Bluetooth encontrado
                </span>

                <button
                    className={styles.connectionButton}
                    type="button"
                    onClick={onConnect}
                >
                    Procurar novamente
                </button>
            </div>
        );
    }

    const errorMessage =
        errorCode ===
            'discovery-failed' ?
            'Não foi possível procurar dispositivos Bluetooth' :
            'Não foi possível conectar ao dispositivo Bluetooth';

    return (
        <div className={styles.connectionBar}>
            <span className={styles.connectionMessage}>
                {errorMessage}
            </span>

            <button
                className={styles.connectionButton}
                type="button"
                onClick={onConnect}
            >
                Tentar novamente
            </button>
        </div>
    );
};

EasyConectConnectionStatus.propTypes = {
    connectionState:
        PropTypes.shape({
            status:
                PropTypes.string,
            devices:
                PropTypes.arrayOf(
                    PropTypes.shape({
                        key:
                            PropTypes.string,
                        label:
                            PropTypes.string
                    })
                ),
            connectedDeviceName:
                PropTypes.string,
            errorCode:
                PropTypes.string
        }).isRequired,
    onConnect:
        PropTypes.func.isRequired,
    onDisconnect:
        PropTypes.func.isRequired,
    onSelectDevice:
        PropTypes.func.isRequired
};

const CONTROLS_SESSION_PROP_TYPE =
    PropTypes.shape({
        getButtonPressed:
            PropTypes.func.isRequired,
        getJoystickPosition:
            PropTypes.func.isRequired,
        getSliderValue:
            PropTypes.func.isRequired,
        getSwitchOn:
            PropTypes.func.isRequired,
        setButtonPressed:
            PropTypes.func.isRequired,
        setJoystickPosition:
            PropTypes.func.isRequired,
        setSliderValue:
            PropTypes.func.isRequired,
        setSwitchOn:
            PropTypes.func.isRequired
    });

const clampControlsJoystickValue =
    value =>
        Math.min(
            Math.max(
                value,
                -100
            ),
            100
        );

const getControlsJoystickPosition =
    event => {
        const bounds =
            event.currentTarget
                .getBoundingClientRect();

        if (
            bounds.width <= 0 ||
            bounds.height <= 0
        ) {
            return {
                x: 0,
                y: 0
            };
        }

        const xRatio =
            (
                event.clientX -
                bounds.left
            ) /
            bounds.width;

        const yRatio =
            (
                event.clientY -
                bounds.top
            ) /
            bounds.height;

        const x =
            clampControlsJoystickValue(
                Math.round(
                    (
                        xRatio *
                        200
                    ) -
                    100
                )
            );

        const y =
            clampControlsJoystickValue(
                Math.round(
                    100 -
                    (
                        yRatio *
                        200
                    )
                )
            );

        return {
            x,
            y
        };
    };

const EasyConectControls = ({
    controlsSession
}) => {
    const [
        joystickPosition,
        setJoystickPosition
    ] = React.useState({
        x: 0,
        y: 0
    });

    const [
        sliderValue,
        setSliderValue
    ] = React.useState(
        0
    );

    const [
        buttonPressed,
        setButtonPressed
    ] = React.useState(
        false
    );

    const [
        switchOn,
        setSwitchOn
    ] = React.useState(
        false
    );

    const joystickDraggingRef =
        React.useRef(
            false
        );

    React.useEffect(
        () => {
            joystickDraggingRef.current =
                false;

            if (!controlsSession) {
                setJoystickPosition({
                    x: 0,
                    y: 0
                });

                setSliderValue(
                    0
                );

                setButtonPressed(
                    false
                );

                setSwitchOn(
                    false
                );

                return;
            }

            setJoystickPosition(
                controlsSession
                    .getJoystickPosition()
            );

            setSliderValue(
                controlsSession
                    .getSliderValue()
            );

            setButtonPressed(
                controlsSession
                    .getButtonPressed()
            );

            setSwitchOn(
                controlsSession
                    .getSwitchOn()
            );
        },
        [controlsSession]
    );

    const sendJoystickPosition =
        React.useCallback(
            (
                x,
                y
            ) => {
                if (!controlsSession) {
                    return;
                }

                Promise.resolve(
                    controlsSession
                        .setJoystickPosition(
                            x,
                            y
                        )
                )
                    .then(
                        () => {
                            setJoystickPosition({
                                x,
                                y
                            });
                        }
                    )
                    .catch(
                        NOOP
                    );
            },
            [controlsSession]
        );

    const handleJoystickPointerDown =
        React.useCallback(
            event => {
                joystickDraggingRef.current =
                    true;

                if (
                    typeof event.currentTarget
                        .setPointerCapture ===
                    'function'
                ) {
                    event.currentTarget
                        .setPointerCapture(
                            event.pointerId
                        );
                }

                const {
                    x,
                    y
                } =
                    getControlsJoystickPosition(
                        event
                    );

                sendJoystickPosition(
                    x,
                    y
                );
            },
            [sendJoystickPosition]
        );

    const handleJoystickPointerMove =
        React.useCallback(
            event => {
                if (
                    !joystickDraggingRef.current
                ) {
                    return;
                }

                const {
                    x,
                    y
                } =
                    getControlsJoystickPosition(
                        event
                    );

                sendJoystickPosition(
                    x,
                    y
                );
            },
            [sendJoystickPosition]
        );

    const releaseJoystick =
        React.useCallback(
            () => {
                if (
                    !joystickDraggingRef.current
                ) {
                    return;
                }

                joystickDraggingRef.current =
                    false;

                sendJoystickPosition(
                    0,
                    0
                );
            },
            [sendJoystickPosition]
        );

    const handleSliderChange =
        React.useCallback(
            event => {
                if (!controlsSession) {
                    return;
                }

                const value =
                    Number(
                        event.currentTarget.value
                    );

                Promise.resolve(
                    controlsSession
                        .setSliderValue(
                            value
                        )
                )
                    .then(
                        () => {
                            setSliderValue(
                                value
                            );
                        }
                    )
                    .catch(
                        NOOP
                    );
            },
            [controlsSession]
        );

    const sendButtonState =
        React.useCallback(
            pressed => {
                if (!controlsSession) {
                    return;
                }

                Promise.resolve(
                    controlsSession
                        .setButtonPressed(
                            pressed
                        )
                )
                    .then(
                        () => {
                            setButtonPressed(
                                pressed
                            );
                        }
                    )
                    .catch(
                        NOOP
                    );
            },
            [controlsSession]
        );

    const handleButtonPointerDown =
        React.useCallback(
            () => {
                sendButtonState(
                    true
                );
            },
            [sendButtonState]
        );

    const handleButtonPointerRelease =
        React.useCallback(
            () => {
                sendButtonState(
                    false
                );
            },
            [sendButtonState]
        );

    const handleSwitchClick =
        React.useCallback(
            () => {
                if (!controlsSession) {
                    return;
                }

                const nextValue =
                    !switchOn;

                Promise.resolve(
                    controlsSession
                        .setSwitchOn(
                            nextValue
                        )
                )
                    .then(
                        () => {
                            setSwitchOn(
                                nextValue
                            );
                        }
                    )
                    .catch(
                        NOOP
                    );
            },
            [
                controlsSession,
                switchOn
            ]
        );

    const joystickTransform =
        `translate(calc(-50% + ${
            joystickPosition.x *
            0.28
        }px), calc(-50% - ${
            joystickPosition.y *
            0.28
        }px))`;

    return (
        <div className={styles.controlsWorkspace}>
            {controlsSession ? null : (
                <p className={styles.controlsUnavailable}>
                    Conecte o Bluetooth para usar Controles.
                </p>
            )}

            <div className={styles.controlsLayout}>
                <button
                    aria-label="Joystick"
                    className={styles.controlsJoystick}
                    disabled={!controlsSession}
                    type="button"
                    onPointerCancel={releaseJoystick}
                    onPointerDown={handleJoystickPointerDown}
                    onPointerMove={handleJoystickPointerMove}
                    onPointerUp={releaseJoystick}
                >
                    <span
                        aria-hidden="true"
                        className={styles.controlsJoystickTrack}
                    >
                        <span
                            className={styles.controlsJoystickCrossHorizontal}
                        />
                        <span
                            className={styles.controlsJoystickCrossVertical}
                        />
                        <span
                            className={styles.controlsJoystickKnob}
                            style={{
                                transform:
                                    joystickTransform
                            }}
                        />
                    </span>

                    <span
                        className={
                            styles.controlsJoystickValues
                        }
                    >
                        <span>
                            {`X: ${joystickPosition.x}`}
                        </span>
                        <span>
                            {`Y: ${joystickPosition.y}`}
                        </span>
                    </span>
                </button>

                <label className={styles.controlsSliderCard}>
                    <span className={styles.controlsControlTitle}>
                        Slider
                    </span>

                    <input
                        aria-label="Slider"
                        className={styles.controlsSlider}
                        disabled={!controlsSession}
                        max="100"
                        min="0"
                        step="1"
                        type="range"
                        value={sliderValue}
                        onChange={handleSliderChange}
                    />

                    <span className={styles.controlsSliderValue}>
                        {sliderValue}
                    </span>
                </label>

                <div className={styles.controlsActions}>
                    <button
                        aria-label="Botão"
                        aria-pressed={buttonPressed}
                        className={[
                            styles.controlsActionButton,
                            buttonPressed ?
                                styles.controlsActionButtonActive :
                                null
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        disabled={!controlsSession}
                        type="button"
                        onPointerCancel={
                            handleButtonPointerRelease
                        }
                        onPointerDown={
                            handleButtonPointerDown
                        }
                        onPointerLeave={
                            handleButtonPointerRelease
                        }
                        onPointerUp={
                            handleButtonPointerRelease
                        }
                    >
                        Botão
                    </button>

                    <button
                        aria-checked={switchOn}
                        aria-label="Chave"
                        className={styles.controlsSwitch}
                        disabled={!controlsSession}
                        role="switch"
                        type="button"
                        onClick={handleSwitchClick}
                    >
                        <span
                            aria-hidden="true"
                            className={[
                                styles.controlsSwitchTrack,
                                switchOn ?
                                    styles.controlsSwitchTrackOn :
                                    null
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            <span
                                className={
                                    styles.controlsSwitchKnob
                                }
                            />
                        </span>

                        <span>
                            Chave
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

EasyConectControls.propTypes = {
    controlsSession:
        CONTROLS_SESSION_PROP_TYPE
};

const GAMEPAD_DIRECTIONAL_CONTROLS = [
    {
        label:
            'Cima',
        positionClass:
            'gamepadButtonUp',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_UP,
        symbol:
            '↑'
    },
    {
        label:
            'Esquerda',
        positionClass:
            'gamepadButtonLeft',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_LEFT,
        symbol:
            '←'
    },
    {
        label:
            'Direita',
        positionClass:
            'gamepadButtonRight',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_RIGHT,
        symbol:
            '→'
    },
    {
        label:
            'Baixo',
        positionClass:
            'gamepadButtonDown',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_DOWN,
        symbol:
            '↓'
    }
];

const GAMEPAD_ACTION_CONTROLS = [
    {
        label:
            'Triângulo',
        positionClass:
            'gamepadButtonUp',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_TOP,
        symbol:
            '△'
    },
    {
        label:
            'Quadrado',
        positionClass:
            'gamepadButtonLeft',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_LEFT,
        symbol:
            '□'
    },
    {
        label:
            'Círculo',
        positionClass:
            'gamepadButtonRight',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_RIGHT,
        symbol:
            '○'
    },
    {
        label:
            'Cruz',
        positionClass:
            'gamepadButtonDown',
        signalId:
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_BOTTOM,
        symbol:
            '×'
    }
];

const EasyConectGamepad = ({
    gamepadSession
}) => {
    const [
        pressedSignals,
        setPressedSignals
    ] = React.useState({});

    React.useEffect(
        () => {
            if (!gamepadSession) {
                setPressedSignals({});
            }
        },
        [gamepadSession]
    );

    const handleButtonState =
        React.useCallback(
            (
                signalId,
                state
            ) => {
                setPressedSignals(
                    current => ({
                        ...current,
                        [signalId]:
                            state
                    })
                );

                if (!gamepadSession) {
                    return;
                }

                Promise.resolve(
                    gamepadSession
                        .setButtonPressed(
                            signalId,
                            state
                        )
                ).catch(
                    NOOP
                );
            },
            [gamepadSession]
        );

    const handlePointerDown =
        React.useCallback(
            event => {
                handleButtonState(
                    event.currentTarget.dataset.signalId,
                    true
                );
            },
            [handleButtonState]
        );

    const handlePointerUp =
        React.useCallback(
            event => {
                handleButtonState(
                    event.currentTarget.dataset.signalId,
                    false
                );
            },
            [handleButtonState]
        );

    const handlePointerCancel =
        React.useCallback(
            event => {
                handleButtonState(
                    event.currentTarget.dataset.signalId,
                    false
                );
            },
            [handleButtonState]
        );

    const renderControl =
        control => {
            const buttonClassName = [
                styles.gamepadButton,
                styles[
                    control.positionClass
                ],
                pressedSignals[
                    control.signalId
                ] ?
                    styles.gamepadButtonPressed :
                    null
            ]
                .filter(Boolean)
                .join(' ');

            return (
                <button
                    aria-label={control.label}
                    className={buttonClassName}
                    data-signal-id={control.signalId}
                    disabled={!gamepadSession}
                    key={control.signalId}
                    type="button"
                    onPointerCancel={handlePointerCancel}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    <span
                        aria-hidden="true"
                        className={
                            styles.gamepadButtonSymbol
                        }
                    >
                        {control.symbol}
                    </span>
                </button>
            );
        };

    return (
        <div className={styles.gamepadWorkspace}>
            {gamepadSession ? null : (
                <p className={styles.gamepadUnavailable}>
                    Conecte o Bluetooth para usar o Gamepad.
                </p>
            )}

            <div className={styles.gamepadLayout}>
                <div
                    aria-label="Direcional"
                    className={styles.gamepadCluster}
                    role="group"
                >
                    {GAMEPAD_DIRECTIONAL_CONTROLS.map(
                        renderControl
                    )}
                </div>

                <div
                    aria-label="Ações"
                    className={styles.gamepadCluster}
                    role="group"
                >
                    {GAMEPAD_ACTION_CONTROLS.map(
                        renderControl
                    )}
                </div>
            </div>
        </div>
    );
};

EasyConectGamepad.propTypes = {
    gamepadSession:
        PropTypes.shape({
            setButtonPressed:
                PropTypes.func.isRequired
        })
};

const EasyConectTerminal = ({
    terminalSession
}) => {
    const [
        history,
        setHistory
    ] = React.useState([]);

    const [
        messageType,
        setMessageType
    ] = React.useState('text');

    const [
        draft,
        setDraft
    ] = React.useState('');

    const [
        sendError,
        setSendError
    ] = React.useState(null);

    const [
        isSending,
        setIsSending
    ] = React.useState(false);

    React.useEffect(
        () => {
            if (!terminalSession) {
                setHistory([]);
                setDraft('');
                setSendError(null);

                return NOOP;
            }

            setHistory(
                terminalSession
                    .getHistory()
            );

            return terminalSession
                .onHistoryChange(
                    nextHistory => {
                        setHistory(
                            nextHistory
                        );
                    }
                );
        },
        [terminalSession]
    );

    const handleClear =
        React.useCallback(
            () => {
                if (!terminalSession) {
                    return;
                }

                terminalSession
                    .clearHistory();
            },
            [terminalSession]
        );

    const handleMessageTypeChange =
        React.useCallback(
            event => {
                setMessageType(
                    event.target.value
                );

                setSendError(
                    null
                );
            },
            []
        );

    const handleDraftChange =
        React.useCallback(
            event => {
                setDraft(
                    event.target.value
                );

                setSendError(
                    null
                );
            },
            []
        );

    const handleSubmit =
        React.useCallback(
            async event => {
                event.preventDefault();

                if (
                    !terminalSession ||
                    isSending ||
                    draft.trim().length === 0
                ) {
                    return;
                }

                setIsSending(true);
                setSendError(null);

                try {
                    if (
                        messageType ===
                        'number'
                    ) {
                        const numericValue =
                            Number(
                                draft
                                    .trim()
                                    .replace(
                                        ',',
                                        '.'
                                    )
                            );

                        if (
                            !Number.isFinite(
                                numericValue
                            )
                        ) {
                            setSendError(
                                'Digite um número válido.'
                            );

                            return;
                        }

                        await terminalSession
                            .sendNumber(
                                numericValue
                            );
                    } else {
                        await terminalSession
                            .sendText(
                                draft
                            );
                    }

                    setDraft('');
                } catch (error) {
                    setSendError(
                        'Não foi possível enviar a mensagem.'
                    );
                } finally {
                    setIsSending(false);
                }
            },
            [
                draft,
                isSending,
                messageType,
                terminalSession
            ]
        );

    if (!terminalSession) {
        return (
            <div
                className={
                    styles.terminalUnavailable
                }
            >
                Conecte o Bluetooth para usar o Terminal.
            </div>
        );
    }

    return (
        <div
            className={
                styles.terminalWorkspace
            }
        >
            <div
                aria-label="Histórico do Terminal"
                className={
                    styles.terminalHistory
                }
            >
                {history.length === 0 ? (
                    <p
                        className={
                            styles.terminalEmpty
                        }
                    >
                        Nenhuma mensagem nesta sessão.
                    </p>
                ) : (
                    history.map(
                        (
                            entry,
                            index
                        ) => (
                            <div
                                className={
                                    styles.terminalEntry
                                }
                                key={
                                    `${entry.direction}-${entry.type}-${index}`
                                }
                            >
                                <span
                                    className={
                                        styles.terminalEntryMeta
                                    }
                                >
                                    {
                                        entry.direction ===
                                        'incoming' ?
                                            'Recebido' :
                                            'Enviado'
                                    }
                                    {' · '}
                                    {
                                        entry.type ===
                                        'number' ?
                                            'Número' :
                                            'Texto'
                                    }
                                </span>

                                <span
                                    className={
                                        styles.terminalEntryPayload
                                    }
                                >
                                    {
                                        String(
                                            entry.payload
                                        )
                                    }
                                </span>
                            </div>
                        )
                    )
                )}
            </div>

            <div
                className={
                    styles.terminalToolbar
                }
            >
                <button
                    className={
                        styles.terminalClearButton
                    }
                    disabled={
                        history.length === 0
                    }
                    type="button"
                    onClick={handleClear}
                >
                    Limpar
                </button>
            </div>

            <form
                className={
                    styles.terminalComposer
                }
                onSubmit={handleSubmit}
            >
                <label
                    className={
                        styles.terminalField
                    }
                >
                    <span>
                        Tipo
                    </span>

                    <select
                        aria-label="Tipo de mensagem do Terminal"
                        value={messageType}
                        onChange={
                            handleMessageTypeChange
                        }
                    >
                        <option value="text">
                            Texto
                        </option>
                        <option value="number">
                            Número
                        </option>
                    </select>
                </label>

                <label
                    className={
                        styles.terminalField
                    }
                >
                    <span>
                        Valor
                    </span>

                    <input
                        aria-label="Valor do Terminal"
                        inputMode={
                            messageType ===
                            'number' ?
                                'decimal' :
                                'text'
                        }
                        type="text"
                        value={draft}
                        onChange={
                            handleDraftChange
                        }
                    />
                </label>

                <button
                    className={
                        styles.terminalSendButton
                    }
                    disabled={
                        isSending ||
                        draft.trim().length === 0
                    }
                    type="submit"
                >
                    {
                        isSending ?
                            'Enviando...' :
                            'Enviar'
                    }
                </button>
            </form>

            {sendError ? (
                <p
                    className={
                        styles.terminalError
                    }
                    role="alert"
                >
                    {sendError}
                </p>
            ) : null}
        </div>
    );
};

EasyConectTerminal.propTypes = {
    terminalSession:
        PropTypes.shape({
            clearHistory:
                PropTypes.func.isRequired,
            getHistory:
                PropTypes.func.isRequired,
            onHistoryChange:
                PropTypes.func.isRequired,
            sendNumber:
                PropTypes.func.isRequired,
            sendText:
                PropTypes.func.isRequired
        })
};

const EasyConectOutputs = ({
    outputsSession
}) => {
    const [
        indicator,
        setIndicator
    ] = React.useState(false);

    React.useEffect(
        () => {
            if (outputsSession) {
                setIndicator(
                    Boolean(
                        outputsSession
                            .getIndicator()
                    )
                );

                return outputsSession
                    .onIndicatorChange(
                        value => {
                            setIndicator(
                                Boolean(value)
                            );
                        }
                    );
            }

            setIndicator(false);

            return NOOP;
        },
        [outputsSession]
    );

    return (
        <div className={styles.outputsWorkspace}>
            {outputsSession ? null : (
                <p
                    className={
                        styles.outputsUnavailable
                    }
                >
                    Conecte o Bluetooth para usar Saídas.
                </p>
            )}

            <div
                className={
                    styles.outputsIndicatorCard
                }
            >
                <span
                    aria-hidden="true"
                    className={
                        indicator ?
                            `${styles.outputsIndicatorLight} ${styles.outputsIndicatorLightOn}` :
                            styles.outputsIndicatorLight
                    }
                />

                <div
                    className={
                        styles.outputsIndicatorCopy
                    }
                >
                    <strong
                        className={
                            styles.outputsIndicatorTitle
                        }
                    >
                        Indicador
                    </strong>

                    <span
                        className={
                            styles.outputsIndicatorState
                        }
                    >
                        {indicator ?
                            'Ligado' :
                            'Desligado'}
                    </span>
                </div>
            </div>
        </div>
    );
};

EasyConectOutputs.propTypes = {
    outputsSession:
        PropTypes.shape({
            getIndicator:
                PropTypes.func.isRequired,
            onIndicatorChange:
                PropTypes.func.isRequired
        })
};

const EasyConectDesktopWindow = ({
    controlsSession = null,
    connectionState = DEFAULT_CONNECTION_STATE,
    gamepadSession = null,
    isOpen = false,
    onConnect = NOOP,
    onDisconnect = NOOP,
    onRequestClose,
    onSelectDevice = NOOP,
    outputsSession = null,
    terminalSession = null
}) => {
    const [
        position,
        setPosition
    ] = React.useState(null);

    const [
        dragState,
        setDragState
    ] = React.useState(null);

    const [
        activeModule,
        setActiveModule
    ] = React.useState(null);

    React.useEffect(
        () => {
            if (!dragState) {
                return;
            }

            const handleMouseMove =
                event => {
                    const maximumLeft =
                        window.innerWidth -
                        dragState.width;

                    const maximumTop =
                        window.innerHeight -
                        dragState.height;

                    setPosition({
                        left:
                            clampPosition(
                                event.clientX -
                                    dragState.offsetX,
                                maximumLeft
                            ),
                        top:
                            clampPosition(
                                event.clientY -
                                    dragState.offsetY,
                                maximumTop
                            )
                    });
                };

            const handleMouseUp =
                () => {
                    setDragState(
                        null
                    );
                };

            window.addEventListener(
                'mousemove',
                handleMouseMove
            );

            window.addEventListener(
                'mouseup',
                handleMouseUp
            );

            return () => {
                window.removeEventListener(
                    'mousemove',
                    handleMouseMove
                );

                window.removeEventListener(
                    'mouseup',
                    handleMouseUp
                );
            };
        },
        [dragState]
    );

    const handleDragStart =
        React.useCallback(
            event => {
                if (event.button !== 0) {
                    return;
                }

                const windowElement =
                    event.currentTarget
                        .parentElement;

                const rectangle =
                    windowElement
                        .getBoundingClientRect();

                setDragState({
                    height:
                        rectangle.height,
                    offsetX:
                        event.clientX -
                        rectangle.left,
                    offsetY:
                        event.clientY -
                        rectangle.top,
                    width:
                        rectangle.width
                });

                event.preventDefault();
            },
            []
        );

    const handleCloseMouseDown =
        React.useCallback(
            event => {
                event.stopPropagation();
            },
            []
        );

    const handleBackToHub =
        React.useCallback(
            () => {
                setActiveModule(
                    null
                );
            },
            []
        );

    const handleModuleClick =
        React.useCallback(
            event => {
                setActiveModule(
                    event.currentTarget.dataset.moduleName
                );
            },
            []
        );

    const floatingStyle =
        position ?
            {
                left:
                    `${position.left}px`,
                top:
                    `${position.top}px`,
                transform:
                    'none'
            } :
            null;

    if (!isOpen) {
        return null;
    }

    return (
        <section
            aria-label="EasyConect"
            className={styles.window}
            role="dialog"
            style={floatingStyle}
        >
            <header
                className={styles.header}
                onMouseDown={handleDragStart}
            >
                <div className={styles.titleGroup}>
                    <span
                        aria-hidden="true"
                        className={styles.brandMark}
                    />
                    <div>
                        <h2 className={styles.title}>
                            EasyConect
                        </h2>
                        <span className={styles.subtitle}>
                            EasyBlox
                        </span>
                    </div>
                </div>

                <button
                    aria-label="Fechar EasyConect"
                    className={styles.closeButton}
                    type="button"
                    onClick={onRequestClose}
                    onMouseDown={handleCloseMouseDown}
                >
                    ×
                </button>
            </header>

            <EasyConectConnectionStatus
                connectionState={connectionState}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                onSelectDevice={onSelectDevice}
            />

            <div className={styles.content}>
                {activeModule ? (
                    <div className={styles.moduleView}>
                        <div className={styles.moduleViewHeader}>
                            <button
                                aria-label="Voltar ao EasyConect"
                                className={styles.backButton}
                                type="button"
                                onClick={handleBackToHub}
                            >
                                <span
                                    aria-hidden="true"
                                    className={styles.backArrow}
                                >
                                    ‹
                                </span>
                                <span>
                                    Voltar
                                </span>
                            </button>

                            <div className={styles.moduleHeadingGroup}>
                                <span className={styles.moduleHeadingAccent} />
                                <h3 className={styles.moduleHeading}>
                                    {activeModule}
                                </h3>
                            </div>
                        </div>

                        {activeModule === 'Gamepad' ? (
                            <EasyConectGamepad
                                gamepadSession={
                                    gamepadSession
                                }
                            />
                        ) : null}
                        {activeModule === 'Controles' ? (
                            <EasyConectControls
                                controlsSession={
                                    controlsSession
                                }
                            />
                        ) : null}
                        {activeModule === 'Terminal' ? (
                            <EasyConectTerminal
                                terminalSession={
                                    terminalSession
                                }
                            />
                        ) : null}
                        {activeModule === 'Saídas' ? (
                            <EasyConectOutputs
                                outputsSession={
                                    outputsSession
                                }
                            />
                        ) : null}
                        {(
                            activeModule !== 'Gamepad' &&
                            activeModule !== 'Controles' &&
                            activeModule !== 'Terminal' &&
                            activeModule !== 'Saídas'
                        ) && (
                            <div
                                className={styles.moduleWorkspace}
                            >
                                <p
                                    className={styles.modulePlaceholder}
                                >
                                    Área do módulo selecionado.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={styles.introduction}>
                            <strong className={styles.introductionTitle}>
                                Controles
                            </strong>
                            <span className={styles.introductionText}>
                                Escolha uma função para controlar seu projeto.
                            </span>
                        </div>

                        <div className={styles.moduleGrid}>
                            {EASYCONECT_MODULES.map(moduleName => (
                                <button
                                    aria-label={`Abrir ${moduleName}`}
                                    className={styles.moduleCard}
                                    data-module-name={moduleName}
                                    key={moduleName}
                                    type="button"
                                    onClick={handleModuleClick}
                                >
                                    <span className={styles.moduleAccent} />
                                    <span className={styles.moduleName}>
                                        {moduleName}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

EasyConectDesktopWindow.propTypes = {
    controlsSession:
        CONTROLS_SESSION_PROP_TYPE,
    connectionState:
        PropTypes.shape({
            status:
                PropTypes.string,
            devices:
                PropTypes.arrayOf(
                    PropTypes.shape({
                        key:
                            PropTypes.string,
                        label:
                            PropTypes.string
                    })
                ),
            connectedDeviceName:
                PropTypes.string,
            errorCode:
                PropTypes.string
        }),
    gamepadSession:
        PropTypes.shape({
            setButtonPressed:
                PropTypes.func.isRequired
        }),
    isOpen:
        PropTypes.bool,
    onConnect:
        PropTypes.func,
    onDisconnect:
        PropTypes.func,
    onRequestClose:
        PropTypes.func.isRequired,
    onSelectDevice:
        PropTypes.func,
    outputsSession:
        PropTypes.shape({
            getIndicator:
                PropTypes.func.isRequired,
            onIndicatorChange:
                PropTypes.func.isRequired
        }),
    terminalSession:
        PropTypes.shape({
            clearHistory:
                PropTypes.func.isRequired,
            getHistory:
                PropTypes.func.isRequired,
            onHistoryChange:
                PropTypes.func.isRequired,
            sendNumber:
                PropTypes.func.isRequired,
            sendText:
                PropTypes.func.isRequired
        })
};

export default EasyConectDesktopWindow;
