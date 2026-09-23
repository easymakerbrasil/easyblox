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

class FakeOutputsSession {
    getIndicator () {
        return true;
    }

    onIndicatorChange () {
        return () => {};
    }
}

class FakeSession {
    constructor () {
        this.outputsSession =
            new FakeOutputsSession();

        this._listeners = [];
    }

    getState () {
        return {
            status:
                'connected',
            devices: [],
            connectedDeviceName:
                'EasyMaker-39',
            errorCode:
                null
        };
    }

    getControlsSession () {
        return null;
    }

    getGamepadSession () {
        return null;
    }

    getMotorsServoSession () {
        return null;
    }

    getTerminalSession () {
        return null;
    }

    getOutputsSession () {
        return this.outputsSession;
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
    'EasyConect Desktop Outputs container bridge',
    () => {
        test('forwards the active Outputs session to the Saídas workspace', () => {
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
                            'Abrir Saídas'
                    }
                )
            );

            expect(
                screen.getByText(
                    'Indicador'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    'Ligado'
                )
            ).toBeInTheDocument();
        });
    }
);
