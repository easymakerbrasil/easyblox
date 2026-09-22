import React from 'react';
import {
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import '@testing-library/jest-dom';

import {
    EASYCONECT_GAMEPAD_SIGNAL_IDS
} from '@easymaker/easyconect-core';

import EasyConectDesktopWindow
    from '../../../src/components/easyconect-desktop-window/easyconect-desktop-window.jsx';

class FakeGamepadSession {
    constructor () {
        this.calls = [];
    }

    setButtonPressed (
        signalId,
        pressed
    ) {
        this.calls.push({
            signalId,
            pressed
        });

        return Promise.resolve();
    }
}

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

const openGamepad =
    () => {
        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name:
                        'Abrir Gamepad'
                }
            )
        );
    };

describe(
    'EasyConect Desktop Gamepad',
    () => {
        test('shows the eight canonical Gamepad controls', () => {
            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    gamepadSession={
                        new FakeGamepadSession()
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openGamepad();

            expect(
                screen.getByRole(
                    'heading',
                    {
                        name:
                            'Gamepad'
                    }
                )
            ).toBeInTheDocument();

            const buttonNames = [
                'Cima',
                'Baixo',
                'Esquerda',
                'Direita',
                'Triângulo',
                'Quadrado',
                'Cruz',
                'Círculo'
            ];

            for (
                const buttonName of
                buttonNames
            ) {
                expect(
                    screen.getByRole(
                        'button',
                        {
                            name:
                                buttonName
                        }
                    )
                ).toBeEnabled();
            }
        });

        test('sends press and release for directional and action buttons', () => {
            const gamepadSession =
                new FakeGamepadSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    gamepadSession={
                        gamepadSession
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openGamepad();

            const up =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Cima'
                    }
                );

            fireEvent.pointerDown(
                up
            );

            fireEvent.pointerUp(
                up
            );

            const cross =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Cruz'
                    }
                );

            fireEvent.pointerDown(
                cross
            );

            fireEvent.pointerUp(
                cross
            );

            expect(
                gamepadSession.calls
            ).toEqual([
                {
                    signalId:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_UP,
                    pressed:
                        true
                },
                {
                    signalId:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_UP,
                    pressed:
                        false
                },
                {
                    signalId:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .ACTION_BOTTOM,
                    pressed:
                        true
                },
                {
                    signalId:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .ACTION_BOTTOM,
                    pressed:
                        false
                }
            ]);
        });

        test('releases a pressed button when the pointer interaction is cancelled', () => {
            const gamepadSession =
                new FakeGamepadSession();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    gamepadSession={
                        gamepadSession
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            openGamepad();

            const right =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Direita'
                    }
                );

            fireEvent.pointerDown(
                right
            );

            fireEvent.pointerCancel(
                right
            );

            expect(
                gamepadSession.calls
            ).toEqual([
                {
                    signalId:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_RIGHT,
                    pressed:
                        true
                },
                {
                    signalId:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_RIGHT,
                    pressed:
                        false
                }
            ]);
        });

        test('shows the Gamepad unavailable and disables every control while disconnected', () => {
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

            openGamepad();

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar o Gamepad.'
                )
            ).toBeInTheDocument();

            const buttonNames = [
                'Cima',
                'Baixo',
                'Esquerda',
                'Direita',
                'Triângulo',
                'Quadrado',
                'Cruz',
                'Círculo'
            ];

            for (
                const buttonName of
                buttonNames
            ) {
                expect(
                    screen.getByRole(
                        'button',
                        {
                            name:
                                buttonName
                        }
                    )
                ).toBeDisabled();
            }
        });
    }
);
