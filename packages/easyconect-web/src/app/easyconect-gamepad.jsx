const React =
    require(
        'react'
    );

const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS
} = require(
    '@easymaker/easyconect-core'
);

const NOOP =
    () => {};

const GAMEPAD_DIRECTIONAL_CONTROLS = [
    {
        label:
            'Cima',
        positionClass:
            'gamepad-button-up',
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
            'gamepad-button-left',
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
            'gamepad-button-right',
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
            'gamepad-button-down',
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
            'gamepad-button-up',
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
            'gamepad-button-left',
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
            'gamepad-button-right',
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
            'gamepad-button-down',
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
        [
            gamepadSession
        ]
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
            [
                gamepadSession
            ]
        );

    const handlePointerDown =
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

                handleButtonState(
                    event.currentTarget
                        .dataset
                        .signalId,
                    true
                );
            },
            [
                handleButtonState
            ]
        );

    const releaseButton =
        React.useCallback(
            event => {
                handleButtonState(
                    event.currentTarget
                        .dataset
                        .signalId,
                    false
                );
            },
            [
                handleButtonState
            ]
        );

    const renderControl =
        control => {
            const className = [
                'gamepad-button',
                control.positionClass,
                pressedSignals[
                    control.signalId
                ] ?
                    'gamepad-button-pressed' :
                    null
            ]
                .filter(
                    Boolean
                )
                .join(
                    ' '
                );

            return (
                <button
                    aria-label={control.label}
                    className={className}
                    data-signal-id={
                        control.signalId
                    }
                    disabled={
                        !gamepadSession
                    }
                    key={
                        control.signalId
                    }
                    type="button"
                    onPointerCancel={
                        releaseButton
                    }
                    onPointerDown={
                        handlePointerDown
                    }
                    onPointerUp={
                        releaseButton
                    }
                >
                    <span
                        aria-hidden="true"
                        className="gamepad-button-symbol"
                    >
                        {control.symbol}
                    </span>
                </button>
            );
        };

    return (
        <div className="gamepad-workspace">
            {!gamepadSession && (
                <p className="gamepad-unavailable">
                    Conecte o Bluetooth para usar o Gamepad.
                </p>
            )}

            <div className="gamepad-layout">
                <div
                    aria-label="Direcional"
                    className="gamepad-cluster"
                    role="group"
                >
                    {
                        GAMEPAD_DIRECTIONAL_CONTROLS
                            .map(
                                renderControl
                            )
                    }
                </div>

                <div
                    aria-label="Ações"
                    className="gamepad-cluster"
                    role="group"
                >
                    {
                        GAMEPAD_ACTION_CONTROLS
                            .map(
                                renderControl
                            )
                    }
                </div>
            </div>
        </div>
    );
};

export {
    EasyConectGamepad
};
