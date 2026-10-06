const React =
    require(
        'react'
    );

const {
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
} = require(
    '@easymaker/easyconect-core'
);

const MOTOR_CONTROLS = [
    {
        label:
            'Motor 1',
        signalId:
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_1
    },
    {
        label:
            'Motor 2',
        signalId:
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .MOTOR_2
    }
];

const SERVO_CONTROLS = [
    {
        label:
            'Servo 1',
        signalId:
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_1
    },
    {
        label:
            'Servo 2',
        signalId:
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_2
    },
    {
        label:
            'Servo 3',
        signalId:
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_3
    },
    {
        label:
            'Servo 4',
        signalId:
            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                .SERVO_4
    }
];

const createInitialMotorValues =
    () => ({
        [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .MOTOR_1]:
            0,
        [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .MOTOR_2]:
            0
    });

const createInitialServoAngles =
    () => ({
        [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_1]:
            0,
        [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_2]:
            0,
        [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_3]:
            0,
        [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            .SERVO_4]:
            0
    });

const getMotorDirectionLabel =
    value => {
        if (value < 0) {
            return 'Ré';
        }

        if (value > 0) {
            return 'Frente';
        }

        return 'Parado';
    };

const EasyConectMotorsServo = ({
    motorsServoSession
}) => {
    const [
        motorValues,
        setMotorValues
    ] = React.useState(
        createInitialMotorValues
    );

    const [
        servoAngles,
        setServoAngles
    ] = React.useState(
        createInitialServoAngles
    );

    const motorRampTokensRef =
        React.useRef({});

    const cancelMotorRamp =
        React.useCallback(
            signalId => {
                const nextToken =
                    (
                        motorRampTokensRef
                            .current[
                                signalId
                            ] ||
                        0
                    ) +
                    1;

                motorRampTokensRef
                    .current[
                        signalId
                    ] =
                        nextToken;

                return nextToken;
            },
            []
        );

    const isMotorRampCurrent =
        React.useCallback(
            (
                signalId,
                token
            ) =>
                motorRampTokensRef
                    .current[
                        signalId
                    ] ===
                token,
            []
        );

    React.useEffect(
        () => {
            cancelMotorRamp(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1
            );

            cancelMotorRamp(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2
            );

            return () => {
                cancelMotorRamp(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_1
                );

                cancelMotorRamp(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_2
                );
            };
        },
        [
            cancelMotorRamp,
            motorsServoSession
        ]
    );

    React.useEffect(
        () => {
            if (!motorsServoSession) {
                setMotorValues(
                    createInitialMotorValues()
                );

                setServoAngles(
                    createInitialServoAngles()
                );

                return;
            }

            setMotorValues({
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_1]:
                    motorsServoSession
                        .getMotorValue(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .MOTOR_1
                        ),
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .MOTOR_2]:
                    motorsServoSession
                        .getMotorValue(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .MOTOR_2
                        )
            });

            setServoAngles({
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_1]:
                    motorsServoSession
                        .getServoAngle(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_1
                        ),
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_2]:
                    motorsServoSession
                        .getServoAngle(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_2
                        ),
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_3]:
                    motorsServoSession
                        .getServoAngle(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_3
                        ),
                [EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                    .SERVO_4]:
                    motorsServoSession
                        .getServoAngle(
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_4
                        )
            });
        },
        [
            motorsServoSession
        ]
    );

    const applyMotorValue =
        React.useCallback(
            (
                signalId,
                value,
                displayValue = value
            ) => {
                if (!motorsServoSession) {
                    return Promise.resolve(
                        false
                    );
                }

                setMotorValues(
                    currentValues => ({
                        ...currentValues,
                        [signalId]:
                            displayValue
                    })
                );

                return Promise.resolve(
                    motorsServoSession
                        .setMotorValue(
                            signalId,
                            value
                        )
                )
                    .then(
                        () =>
                            true
                    )
                    .catch(
                        () => {
                            setMotorValues(
                                currentValues => {
                                    if (
                                        currentValues[
                                            signalId
                                        ] !==
                                        displayValue
                                    ) {
                                        return currentValues;
                                    }

                                    return {
                                        ...currentValues,
                                        [signalId]:
                                            motorsServoSession
                                                .getMotorValue(
                                                    signalId
                                                )
                                    };
                                }
                            );

                            return false;
                        }
                    );
            },
            [
                motorsServoSession
            ]
        );

    const runMotorPresetRamp =
        React.useCallback(
            async (
                signalId,
                targetValue,
                currentValue,
                rampToken
            ) => {
                if (
                    currentValue ===
                    targetValue
                ) {
                    return;
                }

                const runValues =
                    async values => {
                        for (
                            let index = 0;
                            index <
                                values.length;
                            index++
                        ) {
                            if (
                                !isMotorRampCurrent(
                                    signalId,
                                    rampToken
                                )
                            ) {
                                return false;
                            }

                            const sent =
                                await applyMotorValue(
                                    signalId,
                                    values[
                                        index
                                    ],
                                    targetValue
                                );

                            if (
                                !sent ||
                                !isMotorRampCurrent(
                                    signalId,
                                    rampToken
                                )
                            ) {
                                return false;
                            }

                            if (
                                index <
                                values.length -
                                    1
                            ) {
                                await new Promise(
                                    resolve => {
                                        setTimeout(
                                            resolve,
                                            120
                                        );
                                    }
                                );

                                if (
                                    !isMotorRampCurrent(
                                        signalId,
                                        rampToken
                                    )
                                ) {
                                    return false;
                                }
                            }
                        }

                        return true;
                    };

                const currentDirection =
                    Math.sign(
                        currentValue
                    );

                const targetDirection =
                    Math.sign(
                        targetValue
                    );

                const currentMagnitude =
                    Math.abs(
                        currentValue
                    );

                const decelerationValues =
                    currentDirection ===
                    0 ?
                        [] :
                        [
                            75,
                            50,
                            25
                        ]
                            .filter(
                                magnitude =>
                                    magnitude <
                                    currentMagnitude
                            )
                            .map(
                                magnitude =>
                                    currentDirection *
                                    magnitude
                            )
                            .concat(
                                0
                            );

                if (
                    targetValue ===
                    0
                ) {
                    await runValues(
                        decelerationValues
                    );

                    return;
                }

                let startingMagnitude =
                    currentMagnitude;

                if (
                    currentDirection !==
                        0 &&
                    currentDirection !==
                        targetDirection
                ) {
                    const decelerated =
                        await runValues(
                            decelerationValues
                        );

                    if (
                        !decelerated ||
                        !isMotorRampCurrent(
                            signalId,
                            rampToken
                        )
                    ) {
                        return;
                    }

                    await new Promise(
                        resolve => {
                            setTimeout(
                                resolve,
                                120
                            );
                        }
                    );

                    if (
                        !isMotorRampCurrent(
                            signalId,
                            rampToken
                        )
                    ) {
                        return;
                    }

                    startingMagnitude =
                        0;
                }

                const targetMagnitude =
                    Math.abs(
                        targetValue
                    );

                const accelerationValues =
                    [
                        25,
                        50,
                        75,
                        100
                    ]
                        .filter(
                            magnitude =>
                                magnitude >
                                    startingMagnitude &&
                                magnitude <=
                                    targetMagnitude
                        )
                        .map(
                            magnitude =>
                                targetDirection *
                                magnitude
                        );

                await runValues(
                    accelerationValues
                );
            },
            [
                applyMotorValue,
                isMotorRampCurrent
            ]
        );

    const handleMotorChange =
        React.useCallback(
            event => {
                const signalId =
                    event.currentTarget
                        .dataset.signalId;

                const value =
                    Number(
                        event.currentTarget
                            .value
                    );

                cancelMotorRamp(
                    signalId
                );

                applyMotorValue(
                    signalId,
                    value
                );
            },
            [
                applyMotorValue,
                cancelMotorRamp
            ]
        );

    const handleMotorPresetClick =
        React.useCallback(
            event => {
                if (!motorsServoSession) {
                    return;
                }

                const signalId =
                    event.currentTarget
                        .dataset.signalId;

                const targetValue =
                    Number(
                        event.currentTarget
                            .dataset.value
                    );

                const currentValue =
                    motorsServoSession
                        .getMotorValue(
                            signalId
                        );

                const rampToken =
                    cancelMotorRamp(
                        signalId
                    );

                runMotorPresetRamp(
                    signalId,
                    targetValue,
                    currentValue,
                    rampToken
                );
            },
            [
                cancelMotorRamp,
                motorsServoSession,
                runMotorPresetRamp
            ]
        );

    const handleServoChange =
        React.useCallback(
            event => {
                if (!motorsServoSession) {
                    return;
                }

                const signalId =
                    event.currentTarget
                        .dataset.signalId;

                const angle =
                    Number(
                        event.currentTarget
                            .value
                    );

                setServoAngles(
                    currentAngles => ({
                        ...currentAngles,
                        [signalId]:
                            angle
                    })
                );

                Promise.resolve(
                    motorsServoSession
                        .setServoAngle(
                            signalId,
                            angle
                        )
                )
                    .catch(
                        () => {
                            setServoAngles(
                                currentAngles => {
                                    if (
                                        currentAngles[
                                            signalId
                                        ] !==
                                        angle
                                    ) {
                                        return currentAngles;
                                    }

                                    return {
                                        ...currentAngles,
                                        [signalId]:
                                            motorsServoSession
                                                .getServoAngle(
                                                    signalId
                                                )
                                    };
                                }
                            );
                        }
                    );
            },
            [
                motorsServoSession
            ]
        );

    return (
        <div className="motors-servo-workspace">
            {!motorsServoSession && (
                <p className="motors-servo-unavailable">
                    Conecte o Bluetooth para usar Motores e Servos.
                </p>
            )}

            <div className="motors-servo-layout">
                <section
                    aria-label="Motores"
                    className="motors-servo-group"
                >
                    <h3 className="motors-servo-group-title">
                        Motores
                    </h3>

                    <div className="motors-servo-motor-list">
                        {
                            MOTOR_CONTROLS.map(
                                control => {
                                    const value =
                                        motorValues[
                                            control.signalId
                                        ];

                                    return (
                                        <div
                                            className="motors-servo-control"
                                            key={
                                                control.signalId
                                            }
                                        >
                                            <span className="motors-servo-control-header">
                                                <strong className="motors-servo-control-name">
                                                    {control.label}
                                                </strong>

                                                <span className="motors-servo-value">
                                                    {
                                                        `${value}% · ${
                                                            getMotorDirectionLabel(
                                                                value
                                                            )
                                                        }`
                                                    }
                                                </span>
                                            </span>

                                            <input
                                                aria-label={
                                                    control.label
                                                }
                                                className="motors-servo-range"
                                                data-signal-id={
                                                    control.signalId
                                                }
                                                disabled={
                                                    !motorsServoSession
                                                }
                                                max="100"
                                                min="-100"
                                                step="1"
                                                type="range"
                                                value={
                                                    value
                                                }
                                                onChange={
                                                    handleMotorChange
                                                }
                                            />

                                            <div className="motors-servo-motor-presets">
                                                <button
                                                    aria-label={
                                                        `${control.label}: Ré`
                                                    }
                                                    aria-pressed={
                                                        value ===
                                                        -100
                                                    }
                                                    className={[
                                                        'motors-servo-motor-preset',
                                                        value ===
                                                            -100 ?
                                                            'motors-servo-motor-preset-active' :
                                                            null
                                                    ]
                                                        .filter(
                                                            Boolean
                                                        )
                                                        .join(
                                                            ' '
                                                        )}
                                                    data-signal-id={
                                                        control.signalId
                                                    }
                                                    data-value="-100"
                                                    disabled={
                                                        !motorsServoSession
                                                    }
                                                    type="button"
                                                    onClick={
                                                        handleMotorPresetClick
                                                    }
                                                >
                                                    Ré
                                                </button>

                                                <button
                                                    aria-label={
                                                        `${control.label}: Parado`
                                                    }
                                                    aria-pressed={
                                                        value ===
                                                        0
                                                    }
                                                    className={[
                                                        'motors-servo-motor-preset',
                                                        value ===
                                                            0 ?
                                                            'motors-servo-motor-preset-active' :
                                                            null
                                                    ]
                                                        .filter(
                                                            Boolean
                                                        )
                                                        .join(
                                                            ' '
                                                        )}
                                                    data-signal-id={
                                                        control.signalId
                                                    }
                                                    data-value="0"
                                                    disabled={
                                                        !motorsServoSession
                                                    }
                                                    type="button"
                                                    onClick={
                                                        handleMotorPresetClick
                                                    }
                                                >
                                                    Parado
                                                </button>

                                                <button
                                                    aria-label={
                                                        `${control.label}: Frente`
                                                    }
                                                    aria-pressed={
                                                        value ===
                                                        100
                                                    }
                                                    className={[
                                                        'motors-servo-motor-preset',
                                                        value ===
                                                            100 ?
                                                            'motors-servo-motor-preset-active' :
                                                            null
                                                    ]
                                                        .filter(
                                                            Boolean
                                                        )
                                                        .join(
                                                            ' '
                                                        )}
                                                    data-signal-id={
                                                        control.signalId
                                                    }
                                                    data-value="100"
                                                    disabled={
                                                        !motorsServoSession
                                                    }
                                                    type="button"
                                                    onClick={
                                                        handleMotorPresetClick
                                                    }
                                                >
                                                    Frente
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                            )
                        }
                    </div>
                </section>

                <section
                    aria-label="Servos"
                    className="motors-servo-group"
                >
                    <h3 className="motors-servo-group-title">
                        Servos
                    </h3>

                    <div className="motors-servo-servo-grid">
                        {
                            SERVO_CONTROLS.map(
                                control => {
                                    const angle =
                                        servoAngles[
                                            control.signalId
                                        ];

                                    return (
                                        <label
                                            className="motors-servo-control"
                                            key={
                                                control.signalId
                                            }
                                        >
                                            <span className="motors-servo-control-header">
                                                <strong className="motors-servo-control-name">
                                                    {control.label}
                                                </strong>

                                                <span className="motors-servo-value">
                                                    {`${angle}°`}
                                                </span>
                                            </span>

                                            <input
                                                aria-label={
                                                    control.label
                                                }
                                                className="motors-servo-range"
                                                data-signal-id={
                                                    control.signalId
                                                }
                                                disabled={
                                                    !motorsServoSession
                                                }
                                                max="180"
                                                min="0"
                                                step="1"
                                                type="range"
                                                value={
                                                    angle
                                                }
                                                onChange={
                                                    handleServoChange
                                                }
                                            />
                                        </label>
                                    );
                                }
                            )
                        }
                    </div>
                </section>
            </div>
        </div>
    );
};

export {
    EasyConectMotorsServo
};
