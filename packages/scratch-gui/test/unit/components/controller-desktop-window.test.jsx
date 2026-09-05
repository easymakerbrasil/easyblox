import React from 'react';
import {
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import '@testing-library/jest-dom';

import ControllerDesktopWindow
    from '../../../src/components/controller-desktop-window/controller-desktop-window.jsx';

describe(
    'ControllerDesktopWindow',
    () => {
        test('renders nothing while the Controller is closed', () => {
            const {container} =
                render(
                    <ControllerDesktopWindow
                        isOpen={false}
                        onRequestClose={jest.fn()}
                    />
                );

            expect(
                container
            ).toBeEmptyDOMElement();
        });

        test('renders the EasyBlox Controller as a non-modal floating window', () => {
            render(
                <ControllerDesktopWindow
                    isOpen
                    onRequestClose={jest.fn()}
                />
            );

            const dialog =
                screen.getByRole(
                    'dialog',
                    {
                        name:
                            'Controlador EasyBlox'
                    }
                );

            expect(dialog)
                .toBeInTheDocument();

            expect(dialog)
                .not.toHaveAttribute(
                    'aria-modal',
                    'true'
                );

            expect(
                screen.getByText(
                    'Controlador'
                )
            ).toBeInTheDocument();
        });

        test('allows the floating Controller to be repositioned by dragging its header and preserves the position while reopening', () => {
            const originalWidth =
                window.innerWidth;
            const originalHeight =
                window.innerHeight;

            Object.defineProperty(
                window,
                'innerWidth',
                {
                    configurable: true,
                    value: 1200
                }
            );

            Object.defineProperty(
                window,
                'innerHeight',
                {
                    configurable: true,
                    value: 800
                }
            );

            const {rerender} =
                render(
                    <ControllerDesktopWindow
                        isOpen
                        onRequestClose={jest.fn()}
                    />
                );

            const dialog =
                screen.getByRole(
                    'dialog',
                    {
                        name:
                            'Controlador EasyBlox'
                    }
                );

            dialog.getBoundingClientRect =
                () => ({
                    bottom: 416,
                    height: 336,
                    left: 300,
                    right: 972,
                    top: 80,
                    width: 672,
                    x: 300,
                    y: 80,
                    toJSON: () => ({})
                });

            const dragHandle =
                screen
                    .getByText(
                        'Controlador'
                    )
                    .closest(
                        'header'
                    );

            expect(
                dragHandle
            ).not.toBeNull();

            fireEvent.mouseDown(
                dragHandle,
                {
                    button: 0,
                    clientX: 320,
                    clientY: 100
                }
            );

            fireEvent.mouseMove(
                window,
                {
                    clientX: 420,
                    clientY: 180
                }
            );

            fireEvent.mouseUp(
                window
            );

            expect(
                dialog.style.left
            ).toBe('400px');

            expect(
                dialog.style.top
            ).toBe('160px');

            expect(
                dialog.style.transform
            ).toBe('none');

            rerender(
                <ControllerDesktopWindow
                    isOpen={false}
                    onRequestClose={jest.fn()}
                />
            );

            expect(
                screen.queryByRole(
                    'dialog',
                    {
                        name:
                            'Controlador EasyBlox'
                    }
                )
            ).toBeNull();

            rerender(
                <ControllerDesktopWindow
                    isOpen
                    onRequestClose={jest.fn()}
                />
            );

            const reopenedDialog =
                screen.getByRole(
                    'dialog',
                    {
                        name:
                            'Controlador EasyBlox'
                    }
                );

            expect(
                reopenedDialog.style.left
            ).toBe('400px');

            expect(
                reopenedDialog.style.top
            ).toBe('160px');

            Object.defineProperty(
                window,
                'innerWidth',
                {
                    configurable: true,
                    value: originalWidth
                }
            );

            Object.defineProperty(
                window,
                'innerHeight',
                {
                    configurable: true,
                    value: originalHeight
                }
            );
        });

        test('keeps the floating Controller inside the visible viewport while dragging', () => {
            const originalWidth =
                window.innerWidth;
            const originalHeight =
                window.innerHeight;

            Object.defineProperty(
                window,
                'innerWidth',
                {
                    configurable: true,
                    value: 800
                }
            );

            Object.defineProperty(
                window,
                'innerHeight',
                {
                    configurable: true,
                    value: 600
                }
            );

            render(
                <ControllerDesktopWindow
                    isOpen
                    onRequestClose={jest.fn()}
                />
            );

            const dialog =
                screen.getByRole(
                    'dialog',
                    {
                        name:
                            'Controlador EasyBlox'
                    }
                );

            dialog.getBoundingClientRect =
                () => ({
                    bottom: 436,
                    height: 336,
                    left: 100,
                    right: 772,
                    top: 100,
                    width: 672,
                    x: 100,
                    y: 100,
                    toJSON: () => ({})
                });

            const dragHandle =
                screen
                    .getByText(
                        'Controlador'
                    )
                    .closest(
                        'header'
                    );

            fireEvent.mouseDown(
                dragHandle,
                {
                    button: 0,
                    clientX: 120,
                    clientY: 120
                }
            );

            fireEvent.mouseMove(
                window,
                {
                    clientX: 2000,
                    clientY: 2000
                }
            );

            expect(
                dialog.style.left
            ).toBe('128px');

            expect(
                dialog.style.top
            ).toBe('264px');

            fireEvent.mouseMove(
                window,
                {
                    clientX: -100,
                    clientY: -100
                }
            );

            expect(
                dialog.style.left
            ).toBe('0px');

            expect(
                dialog.style.top
            ).toBe('0px');

            fireEvent.mouseUp(
                window
            );

            Object.defineProperty(
                window,
                'innerWidth',
                {
                    configurable: true,
                    value: originalWidth
                }
            );

            Object.defineProperty(
                window,
                'innerHeight',
                {
                    configurable: true,
                    value: originalHeight
                }
            );
        });

        test('shows the approved Controller v1 hub modules', () => {
            render(
                <ControllerDesktopWindow
                    isOpen
                    onRequestClose={jest.fn()}
                />
            );

            const moduleNames = [
                'Gamepad',
                'Joystick',
                'Slider',
                'Botão',
                'Chave',
                'Indicador',
                'Serial'
            ];

            for (
                const moduleName of
                    moduleNames
            ) {
                expect(
                    screen.getByText(
                        moduleName
                    )
                ).toBeInTheDocument();
            }
        });

        test('keeps implementation details out of the student-facing shell', () => {
            render(
                <ControllerDesktopWindow
                    isOpen
                    onRequestClose={jest.fn()}
                />
            );

            expect(
                screen.queryByText(
                    /COM\d+/i
                )
            ).not.toBeInTheDocument();

            expect(
                screen.queryByText(
                    /EBCP/i
                )
            ).not.toBeInTheDocument();

            expect(
                screen.queryByText(
                    /9600/
                )
            ).not.toBeInTheDocument();

            expect(
                screen.queryByText(
                    /channel/i
                )
            ).not.toBeInTheDocument();
        });

        test('delegates closing through the window close action', () => {
            const onRequestClose =
                jest.fn();

            render(
                <ControllerDesktopWindow
                    isOpen
                    onRequestClose={
                        onRequestClose
                    }
                />
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Fechar Controlador'
                    }
                )
            );

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(1);
        });
    }
);
