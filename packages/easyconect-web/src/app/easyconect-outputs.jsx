const React =
    require(
        'react'
    );

const EasyConectOutputs = ({
    outputsSession
}) => {
    const [
        indicator,
        setIndicator
    ] = React.useState(
        false
    );

    React.useEffect(
        () => {
            if (!outputsSession) {
                setIndicator(
                    false
                );

                return undefined;
            }

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
                            Boolean(
                                value
                            )
                        );
                    }
                );
        },
        [
            outputsSession
        ]
    );

    return (
        <div className="outputs-workspace">
            {!outputsSession && (
                <p className="outputs-unavailable">
                    Conecte o Bluetooth para usar Saídas.
                </p>
            )}

            <div
                aria-live="polite"
                className="outputs-indicator-card"
                role="status"
            >
                <span
                    aria-hidden="true"
                    className={[
                        'outputs-indicator-light',
                        indicator ?
                            'outputs-indicator-light-on' :
                            null
                    ]
                        .filter(
                            Boolean
                        )
                        .join(
                            ' '
                        )}
                />

                <div className="outputs-indicator-copy">
                    <strong className="outputs-indicator-title">
                        Indicador
                    </strong>

                    <span className="outputs-indicator-state">
                        {
                            indicator ?
                                'Ligado' :
                                'Desligado'
                        }
                    </span>

                    <span className="outputs-indicator-description">
                        Estado definido pelo programa EasyBlox.
                    </span>
                </div>
            </div>
        </div>
    );
};

export {
    EasyConectOutputs
};
