const React =
    require(
        'react'
    );

const NOOP =
    () => {};

const clampJoystickValue =
    value =>
        Math.min(
            Math.max(
                value,
                -100
            ),
            100
        );

const getJoystickPosition =
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
            clampJoystickValue(
                Math.round(
                    (
                        xRatio *
                        200
                    ) -
                    100
                )
            );

        const y =
            clampJoystickValue(
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
        [
            controlsSession
        ]
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
            [
                controlsSession
            ]
        );

    const handleJoystickPointerDown =
        React.useCallback(
            event => {
                event.preventDefault();

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
                    getJoystickPosition(
                        event
                    );

                sendJoystickPosition(
                    x,
                    y
                );
            },
            [
                sendJoystickPosition
            ]
        );

    const handleJoystickPointerMove =
        React.useCallback(
            event => {
                if (
                    !joystickDraggingRef.current
                ) {
                    return;
                }

                event.preventDefault();

                const {
                    x,
                    y
                } =
                    getJoystickPosition(
                        event
                    );

                sendJoystickPosition(
                    x,
                    y
                );
            },
            [
                sendJoystickPosition
            ]
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
            [
                sendJoystickPosition
            ]
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
            [
                controlsSession
            ]
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
            [
                controlsSession
            ]
        );

    const handleButtonPointerDown =
        React.useCallback(
            event => {
                event.preventDefault();

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

                sendButtonState(
                    true
                );
            },
            [
                sendButtonState
            ]
        );

    const handleButtonPointerRelease =
        React.useCallback(
            () => {
                sendButtonState(
                    false
                );
            },
            [
                sendButtonState
            ]
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
        <div className="controls-workspace">
            {!controlsSession && (
                <p className="controls-unavailable">
                    Conecte o Bluetooth para usar Controles.
                </p>
            )}

            <div className="controls-layout">
                <button
                    aria-label="Joystick"
                    className="controls-joystick"
                    disabled={
                        !controlsSession
                    }
                    type="button"
                    onPointerCancel={
                        releaseJoystick
                    }
                    onPointerDown={
                        handleJoystickPointerDown
                    }
                    onPointerMove={
                        handleJoystickPointerMove
                    }
                    onPointerUp={
                        releaseJoystick
                    }
                >
                    <span
                        aria-hidden="true"
                        className="controls-joystick-track"
                    >
                        <span
                            className="controls-joystick-cross-horizontal"
                        />

                        <span
                            className="controls-joystick-cross-vertical"
                        />

                        <span
                            className="controls-joystick-knob"
                            style={{
                                transform:
                                    joystickTransform
                            }}
                        />
                    </span>

                    <span className="controls-joystick-values">
                        <span>
                            {`X: ${joystickPosition.x}`}
                        </span>

                        <span>
                            {`Y: ${joystickPosition.y}`}
                        </span>
                    </span>
                </button>

                <label className="controls-slider-card">
                    <span className="controls-control-title">
                        Slider
                    </span>

                    <input
                        aria-label="Slider"
                        className="controls-slider"
                        disabled={
                            !controlsSession
                        }
                        max="100"
                        min="0"
                        step="1"
                        type="range"
                        value={
                            sliderValue
                        }
                        onChange={
                            handleSliderChange
                        }
                    />

                    <span className="controls-slider-value">
                        {sliderValue}
                    </span>
                </label>

                <div className="controls-actions">
                    <button
                        aria-label="Botão"
                        aria-pressed={
                            buttonPressed
                        }
                        className={[
                            'controls-action-button',
                            buttonPressed ?
                                'controls-action-button-active' :
                                null
                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                ' '
                            )}
                        disabled={
                            !controlsSession
                        }
                        type="button"
                        onPointerCancel={
                            handleButtonPointerRelease
                        }
                        onPointerDown={
                            handleButtonPointerDown
                        }
                        onPointerUp={
                            handleButtonPointerRelease
                        }
                    >
                        Botão
                    </button>

                    <button
                        aria-checked={
                            switchOn
                        }
                        aria-label="Chave"
                        className="controls-switch"
                        disabled={
                            !controlsSession
                        }
                        role="switch"
                        type="button"
                        onClick={
                            handleSwitchClick
                        }
                    >
                        <span
                            aria-hidden="true"
                            className={[
                                'controls-switch-track',
                                switchOn ?
                                    'controls-switch-track-on' :
                                    null
                            ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    ' '
                                )}
                        >
                            <span className="controls-switch-knob" />
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

export {
    EasyConectControls
};
