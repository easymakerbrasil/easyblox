import React from 'react';
import {
    fireEvent,
    render,
    screen,
    waitFor
} from '@testing-library/react';
import '@testing-library/jest-dom';

import EasyConectDesktopWindow
    from '../../../src/components/easyconect-desktop-window/easyconect-desktop-window.jsx';

const connectedState = {
    status:
        'connected',
    devices: [],
    connectedDeviceName:
        'EasyMaker-39',
    errorCode:
        null
};

const disconnectedState = {
    status:
        'disconnected',
    devices: [],
    connectedDeviceName:
        null,
    errorCode:
        null
};

class FakeControlsSession {
    constructor () {
        this.joystick = {
            x: 0,
            y: 0
        };

        this.slider = 0;
        this.button = false;
        this.switchOn = false;

        this.joystickCalls = [];
        this.sliderCalls = [];
        this.buttonCalls = [];
        this.switchCalls = [];
    }

    getJoystickPosition () {
        return {
            ...this.joystick
        };
    }

    getSliderValue () {
        return this.slider;
    }

    getButtonPressed () {
        return this.button;
    }

    getSwitchOn () {
        return this.switchOn;
    }

    setJoystickPosition (
        x,
        y
    ) {
        this.joystickCalls.push({
            x,
            y
        });

        this.joystick = {
            x,
            y
        };

        return Promise.resolve(
            true
        );
    }

    setSliderValue (value) {
        this.sliderCalls.push(
            value
        );

        this.slider =
            value;

        return Promise.resolve(
            true
        );
    }

    setButtonPressed (pressed) {
        this.buttonCalls.push(
            pressed
        );

        this.button =
            pressed;

        return Promise.resolve(
            true
        );
    }

    setSwitchOn (on) {
        this.switchCalls.push(
            on
        );

        this.switchOn =
            on;

        return Promise.resolve(
            true
        );
    }
}

const openControls =
    () => {
        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name:
                        'Abrir Controles'
                }
            )
        );
    };

describe(
    'EasyConect Desktop Controls',
    () => {
        test('shows the canonical visual Controls workspace', () => {
            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    controlsSession={
                        new FakeControlsSession()
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openControls();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Joystick'
                    }
                )
            ).toBeEnabled();

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Slider'
                    }
                )
            ).toBeEnabled();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Botão'
                    }
                )
            ).toBeEnabled();

            expect(
                screen.getByRole(
                    'switch',
                    {
                        name:
                            'Chave'
                    }
                )
            ).toBeEnabled();

            expect(
                screen.getByText(
                    'X: 0'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    'Y: 0'
                )
            ).toBeInTheDocument();
        });

        test('forwards Slider, Button and Switch interactions to the Controls session', () => {
            const controlsSession =
                new FakeControlsSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    controlsSession={
                        controlsSession
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openControls();

            fireEvent.change(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Slider'
                    }
                ),
                {
                    target: {
                        value:
                            '75'
                    }
                }
            );

            const button =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Botão'
                    }
                );

            fireEvent.pointerDown(
                button
            );

            fireEvent.pointerUp(
                button
            );

            fireEvent.click(
                screen.getByRole(
                    'switch',
                    {
                        name:
                            'Chave'
                    }
                )
            );

            expect(
                controlsSession.sliderCalls
            ).toEqual([
                75
            ]);

            expect(
                controlsSession.buttonCalls
            ).toEqual([
                true,
                false
            ]);

            expect(
                controlsSession.switchCalls
            ).toEqual([
                true
            ]);
        });

        test('clamps joystick beyond its limits and recenters only on release', async () => {
            const controlsSession =
                new FakeControlsSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    controlsSession={
                        controlsSession
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openControls();

            const joystick =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Joystick'
                    }
                );

            joystick.getBoundingClientRect =
                () => ({
                    left: 0,
                    top: 0,
                    right: 200,
                    bottom: 200,
                    width: 200,
                    height: 200,
                    x: 0,
                    y: 0,
                    toJSON:
                        () => {}
                });

            joystick.setPointerCapture =
                jest.fn();

            const pointerDownEvent =
                new MouseEvent(
                    'pointerdown',
                    {
                        bubbles:
                            true,
                        clientX:
                            150,
                        clientY:
                            50
                    }
                );

            Object.defineProperty(
                pointerDownEvent,
                'pointerId',
                {
                    value: 1
                }
            );

            fireEvent(
                joystick,
                pointerDownEvent
            );

            expect(
                joystick.setPointerCapture
            ).toHaveBeenCalledWith(
                1
            );

            fireEvent(
                joystick,
                new MouseEvent(
                    'pointermove',
                    {
                        bubbles:
                            true,
                        clientX:
                            260,
                        clientY:
                            -40
                    }
                )
            );

            await waitFor(
                () => {
                    expect(
                        controlsSession.joystickCalls
                    ).toEqual([
                        {
                            x: 50,
                            y: 50
                        },
                        {
                            x: 100,
                            y: 100
                        }
                    ]);
                }
            );

            fireEvent(
                joystick,
                new MouseEvent(
                    'pointerup',
                    {
                        bubbles:
                            true
                    }
                )
            );

            await waitFor(
                () => {
                    expect(
                        controlsSession.joystickCalls
                    ).toEqual([
                        {
                            x: 50,
                            y: 50
                        },
                        {
                            x: 100,
                            y: 100
                        },
                        {
                            x: 0,
                            y: 0
                        }
                    ]);
                }
            );
        });

        test('shows Controls unavailable and disables every control while disconnected', () => {
            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        disconnectedState
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openControls();

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar Controles.'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Joystick'
                    }
                )
            ).toBeDisabled();

            expect(
                screen.getByRole(
                    'slider',
                    {
                        name:
                            'Slider'
                    }
                )
            ).toBeDisabled();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Botão'
                    }
                )
            ).toBeDisabled();

            expect(
                screen.getByRole(
                    'switch',
                    {
                        name:
                            'Chave'
                    }
                )
            ).toBeDisabled();
        });
    }
);
