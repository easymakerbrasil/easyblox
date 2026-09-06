import PropTypes from 'prop-types';
import React from 'react';

import styles from './controller-desktop-window.css';

const CONTROLLER_MODULES = [
    'Gamepad',
    'Joystick',
    'Slider',
    'Botão',
    'Chave',
    'Indicador',
    'Serial'
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
    errorCode:
        null
};

const ControllerConnectionStatus = ({
    connectionState,
    onConnect,
    onDisconnect,
    onSelectDevice
}) => {
    const {
        status,
        devices = [],
        errorCode
    } = connectionState;

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
                        Bluetooth conectado
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
                            key={device.key}
                            type="button"
                            onClick={() => {
                                onSelectDevice(
                                    device.key
                                );
                            }}
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

ControllerConnectionStatus.propTypes = {
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

const ControllerDesktopWindow = ({
    connectionState,
    isOpen,
    onConnect,
    onDisconnect,
    onRequestClose,
    onSelectDevice
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
                return undefined;
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
        };

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
            undefined;

    if (!isOpen) {
        return null;
    }

    return (
        <section
            aria-label="Controlador EasyBlox"
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
                            Controlador
                        </h2>
                        <span className={styles.subtitle}>
                            EasyBlox
                        </span>
                    </div>
                </div>

                <button
                    aria-label="Fechar Controlador"
                    className={styles.closeButton}
                    type="button"
                    onClick={onRequestClose}
                    onMouseDown={event => {
                        event.stopPropagation();
                    }}
                >
                    ×
                </button>
            </header>

            <ControllerConnectionStatus
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
                                aria-label="Voltar aos controles"
                                className={styles.backButton}
                                type="button"
                                onClick={() => {
                                    setActiveModule(null);
                                }}
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

                        <div className={styles.moduleWorkspace}>
                            <p className={styles.modulePlaceholder}>
                                Configure este controle para usar no seu projeto.
                            </p>
                        </div>
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
                            {CONTROLLER_MODULES.map(moduleName => (
                                <button
                                    aria-label={`Abrir ${moduleName}`}
                                    className={styles.moduleCard}
                                    key={moduleName}
                                    type="button"
                                    onClick={() => {
                                        setActiveModule(
                                            moduleName
                                        );
                                    }}
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

ControllerDesktopWindow.propTypes = {
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
            errorCode:
                PropTypes.string
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
        PropTypes.func
};

ControllerDesktopWindow.defaultProps = {
    connectionState:
        DEFAULT_CONNECTION_STATE,
    isOpen:
        false,
    onConnect:
        () => {},
    onDisconnect:
        () => {},
    onSelectDevice:
        () => {}
};

export default ControllerDesktopWindow;
