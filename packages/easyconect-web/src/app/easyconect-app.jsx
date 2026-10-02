const React =
    require(
        'react'
    );

const {
    EasyConectWebSession
} = require(
    '../easyconect-web-session'
);

const {
    acknowledgeAndroidNearbyDevicesGuidance,
    shouldShowAndroidNearbyDevicesGuidance
} = require(
    './android-first-use-guidance'
);

const EASYCONECT_MODULES = [
    {
        id:
            'gamepad',
        name:
            'Gamepad',
        description:
            'Controle direcional e botões.'
    },
    {
        id:
            'controls',
        name:
            'Controles',
        description:
            'Joystick, slider, botão e chave.'
    },
    {
        id:
            'motors-servo',
        name:
            'Motores e Servos',
        description:
            'Controle de movimento e posicionamento.'
    },
    {
        id:
            'terminal',
        name:
            'Terminal',
        description:
            'Envio e recebimento de dados.'
    },
    {
        id:
            'outputs',
        name:
            'Saídas',
        description:
            'Indicadores controlados pelo programa.'
    }
];

const hasWebSerial =
    () =>
        typeof navigator !==
            'undefined' &&
        navigator.serial &&
        typeof navigator.serial
            .requestPort ===
            'function';

const getConnectionPresentation = (
    connectionState,
    webSerialAvailable
) => {
    if (!webSerialAvailable) {
        return {
            label:
                'Bluetooth indisponível',
            buttonLabel:
                'Indisponível',
            buttonDisabled:
                true,
            dotClassName:
                'connection-dot-error'
        };
    }

    switch (connectionState.status) {
    case 'connecting':
        return {
            label:
                'Conectando...',
            buttonLabel:
                'Conectando...',
            buttonDisabled:
                true,
            dotClassName:
                'connection-dot-busy'
        };

    case 'connected':
        return {
            label:
                'Conectado',
            buttonLabel:
                'Desconectar',
            buttonDisabled:
                false,
            dotClassName:
                'connection-dot-connected'
        };

    case 'disconnecting':
        return {
            label:
                'Desconectando...',
            buttonLabel:
                'Desconectando...',
            buttonDisabled:
                true,
            dotClassName:
                'connection-dot-busy'
        };

    case 'error':
        return {
            label:
                'Falha na conexão',
            buttonLabel:
                'Tentar novamente',
            buttonDisabled:
                false,
            dotClassName:
                'connection-dot-error'
        };

    default:
        if (
            connectionState.errorCode ===
                'connection-lost'
        ) {
            return {
                label:
                    'Conexão perdida',
                buttonLabel:
                    'Conectar',
                buttonDisabled:
                    false,
                dotClassName:
                    'connection-dot-error'
            };
        }

        return {
            label:
                'Desconectado',
            buttonLabel:
                'Conectar',
            buttonDisabled:
                false,
            dotClassName:
                'connection-dot'
        };
    }
};

const EasyConectModuleCard = ({
    module
}) => (
    <button
        className="module-card"
        type="button"
        disabled
    >
        <span
            aria-hidden="true"
            className="module-card-accent"
        />

        <span className="module-card-content">
            <strong className="module-card-title">
                {module.name}
            </strong>

            <span className="module-card-description">
                {module.description}
            </span>
        </span>

        <span className="module-card-state">
            Em breve
        </span>
    </button>
);

const EasyConectApp = () => {
    const sessionRef =
        React.useRef(
            null
        );

    const [
        webSerialAvailable
    ] = React.useState(
        hasWebSerial
    );

    const [
        connectionState,
        setConnectionState
    ] = React.useState({
        status:
            'disconnected',
        errorCode:
            null
    });

    const [
        showAndroidGuidance,
        setShowAndroidGuidance
    ] = React.useState(
        shouldShowAndroidNearbyDevicesGuidance
    );

    React.useEffect(
        () => {
            if (!webSerialAvailable) {
                return undefined;
            }

            const session =
                new EasyConectWebSession();

            sessionRef.current =
                session;

            setConnectionState(
                session.getState()
            );

            const unsubscribe =
                session.onStateChange(
                    state => {
                        setConnectionState(
                            state
                        );
                    }
                );

            return () => {
                unsubscribe();

                sessionRef.current =
                    null;

                session.dispose();
            };
        },
        [
            webSerialAvailable
        ]
    );

    const handleConnectionClick =
        React.useCallback(
            async () => {
                const session =
                    sessionRef.current;

                if (!session) {
                    return;
                }

                const currentState =
                    session.getState();

                if (
                    currentState.status ===
                        'connected'
                ) {
                    await session.disconnect();

                    return;
                }

                if (
                    currentState.status !==
                        'disconnected' &&
                    currentState.status !==
                        'error'
                ) {
                    return;
                }

                await session.connect();
            },
            []
        );

    const handleAndroidGuidanceAcknowledgement =
        React.useCallback(
            () => {
                acknowledgeAndroidNearbyDevicesGuidance();

                setShowAndroidGuidance(
                    false
                );
            },
            []
        );

    const connectionPresentation =
        getConnectionPresentation(
            connectionState,
            webSerialAvailable
        );

    return (
        <div className="easyconect-app">
            <header className="app-header">
                <div className="brand">
                    <span
                        aria-hidden="true"
                        className="brand-mark"
                    />

                    <div className="brand-copy">
                        <h1 className="brand-title">
                            EasyConect
                        </h1>

                        <span className="brand-subtitle">
                            EasyBlox
                        </span>
                    </div>
                </div>

                <div
                    aria-live="polite"
                    className="connection-status"
                >
                    <span
                        aria-hidden="true"
                        className={
                            connectionPresentation
                                .dotClassName
                        }
                    />

                    <span className="connection-label">
                        {
                            connectionPresentation
                                .label
                        }
                    </span>

                    <button
                        className="connection-button"
                        type="button"
                        disabled={
                            connectionPresentation
                                .buttonDisabled
                        }
                        onClick={
                            handleConnectionClick
                        }
                    >
                        {
                            connectionPresentation
                                .buttonLabel
                        }
                    </button>
                </div>
            </header>

            <main className="app-main">
                {showAndroidGuidance && (
                    <aside
                        aria-labelledby="android-guidance-title"
                        className="android-guidance"
                    >
                        <div className="android-guidance-copy">
                            <strong
                                className="android-guidance-title"
                                id="android-guidance-title"
                            >
                                Antes de conectar no Android
                            </strong>

                            <p className="android-guidance-text">
                                Confirme que o Chrome tem permissão
                                para acessar Dispositivos próximos.
                                Se o HC-05, HC-06 ou EasyMaker estiver
                                pareado mas não aparecer na lista,
                                habilite essa permissão nas configurações
                                do Android e volte ao EasyConect.
                            </p>
                        </div>

                        <button
                            className="android-guidance-button"
                            type="button"
                            onClick={
                                handleAndroidGuidanceAcknowledgement
                            }
                        >
                            Entendi
                        </button>
                    </aside>
                )}

                <section className="hero">
                    <p className="eyebrow">
                        CONTROLE REMOTO
                    </p>

                    <h2 className="hero-title">
                        Controle seus projetos EasyBlox
                    </h2>

                    <p className="hero-description">
                        Conecte sua placa por Bluetooth e escolha
                        uma das ferramentas do EasyConect.
                    </p>
                </section>

                <section
                    aria-labelledby="modules-title"
                    className="modules"
                >
                    <div className="section-heading">
                        <div>
                            <h2
                                className="section-title"
                                id="modules-title"
                            >
                                Ferramentas
                            </h2>

                            <p className="section-description">
                                Escolha como deseja interagir com
                                seu projeto.
                            </p>
                        </div>
                    </div>

                    <div className="module-grid">
                        {EASYCONECT_MODULES.map(
                            module => (
                                <EasyConectModuleCard
                                    key={module.id}
                                    module={module}
                                />
                            )
                        )}
                    </div>
                </section>
            </main>

            <footer className="app-footer">
                <span>
                    EasyConect
                </span>

                <span aria-hidden="true">
                    •
                </span>

                <span>
                    EasyMaker Robótica Educacional
                </span>
            </footer>
        </div>
    );
};

export {
    EasyConectApp
};
