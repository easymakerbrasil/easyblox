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

const ControllerDesktopWindow = ({
    isOpen,
    onRequestClose
}) => {
    const [
        position,
        setPosition
    ] = React.useState(null);

    const [
        dragState,
        setDragState
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

            <div className={styles.content}>
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
                        >
                            <span className={styles.moduleAccent} />
                            <span className={styles.moduleName}>
                                {moduleName}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

ControllerDesktopWindow.propTypes = {
    isOpen: PropTypes.bool,
    onRequestClose: PropTypes.func.isRequired
};

ControllerDesktopWindow.defaultProps = {
    isOpen: false
};

export default ControllerDesktopWindow;
