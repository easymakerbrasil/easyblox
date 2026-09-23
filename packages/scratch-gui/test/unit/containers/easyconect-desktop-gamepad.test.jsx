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

import {
    EasyConectDesktopWindowContainer
} from '../../../src/containers/easyconect-desktop-window.jsx';

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

class FakeSession {
    constructor (
        status = 'connected'
    ) {
        this.status =
            status;

        this.gamepadSession =
            new FakeGamepadSession();

        this._listeners = [];
    }

    getState () {
        return {
            status:
                this.status,
            devices: [],
            connectedDeviceName:
                this.status ===
                    'connected' ?
                    'EasyMaker-39' :
                    null,
            errorCode:
                null
        };
    }

    getControlsSession () {
        return null;
    }

    getMotorsServoSession () {
        return null;
    }

    getTerminalSession () {
        return null;
    }

    getOutputsSession () {
        return null;
    }

    getGamepadSession () {
        return this.gamepadSession;
    }

    onStateChange (
        listener
    ) {
        this._listeners.push(
            listener
        );

        return () => {
            this._listeners =
                this._listeners.filter(
                    registeredListener =>
                        registeredListener !==
                        listener
                );
        };
    }

    connect () {
        return Promise.resolve(
            true
        );
    }

    disconnect () {
        return Promise.resolve(
            true
        );
    }

    selectDevice () {
        return Promise.resolve(
            true
        );
    }
}

describe(
    'EasyConect Desktop Gamepad container bridge',
    () => {
        test('forwards the active Gamepad session to the Gamepad workspace', () => {
            const session =
                new FakeSession();

            render(
                <EasyConectDesktopWindowContainer
                    isOpen
                    onRequestClose={
                        jest.fn()
                    }
                    session={
                        session
                    }
                />
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Abrir Gamepad'
                    }
                )
            );

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

            expect(
                session
                    .gamepadSession
                    .calls
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
                }
            ]);
        });

        test('does not expose the Gamepad session while Bluetooth is disconnected', () => {
            const session =
                new FakeSession(
                    'disconnected'
                );

            render(
                <EasyConectDesktopWindowContainer
                    isOpen
                    onRequestClose={
                        jest.fn()
                    }
                    session={
                        session
                    }
                />
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Abrir Gamepad'
                    }
                )
            );

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar o Gamepad.'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Cima'
                    }
                )
            ).toBeDisabled();

            expect(
                session
                    .gamepadSession
                    .calls
            ).toEqual([]);
        });
    }
);
