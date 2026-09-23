import React from 'react';
import {
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import '@testing-library/jest-dom';

import {
    EasyConectDesktopWindowContainer
} from '../../../src/containers/easyconect-desktop-window.jsx';

class FakeControlsSession {
    constructor () {
        this.switchCalls = [];
    }

    getJoystickPosition () {
        return {
            x: 0,
            y: 0
        };
    }

    getSliderValue () {
        return 0;
    }

    getButtonPressed () {
        return false;
    }

    getSwitchOn () {
        return false;
    }

    setJoystickPosition () {
        return Promise.resolve(
            true
        );
    }

    setSliderValue () {
        return Promise.resolve(
            true
        );
    }

    setButtonPressed () {
        return Promise.resolve(
            true
        );
    }

    setSwitchOn (on) {
        this.switchCalls.push(
            on
        );

        return Promise.resolve(
            true
        );
    }
}

class FakeSession {
    constructor (
        status = 'connected'
    ) {
        this.status =
            status;

        this.controlsSession =
            new FakeControlsSession();

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
        return this.controlsSession;
    }

    getGamepadSession () {
        return null;
    }

    getMotorsServoSession () {
        return null;
    }

    getOutputsSession () {
        return null;
    }

    getTerminalSession () {
        return null;
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
    'EasyConect Desktop Controls container bridge',
    () => {
        test('forwards the active Controls session while Bluetooth is connected', () => {
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
                            'Abrir Controles'
                    }
                )
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
                session
                    .controlsSession
                    .switchCalls
            ).toEqual([
                true
            ]);
        });

        test('does not expose the Controls session while Bluetooth is disconnected', () => {
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
                            'Abrir Controles'
                    }
                )
            );

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar Controles.'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByRole(
                    'switch',
                    {
                        name:
                            'Chave'
                    }
                )
            ).toBeDisabled();

            expect(
                session
                    .controlsSession
                    .switchCalls
            ).toEqual([]);
        });
    }
);
