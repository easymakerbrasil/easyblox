import React from 'react';
import {
    act,
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import '@testing-library/jest-dom';

import {
    ControllerDesktopWindowContainer
} from '../../../src/containers/controller-desktop-window.jsx';

class FakeSession {
    constructor (state = {
        status:
            'disconnected',
        devices: [],
        errorCode:
            null
    }) {
        this.state = state;

        this.connectCalls = 0;
        this.disconnectCalls = 0;
        this.selectDeviceCalls = [];

        this._listeners = [];
    }

    getState () {
        return this.state;
    }

    onStateChange (listener) {
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
        this.connectCalls += 1;

        return Promise.resolve(
            true
        );
    }

    disconnect () {
        this.disconnectCalls += 1;

        return true;
    }

    selectDevice (key) {
        this.selectDeviceCalls.push(
            key
        );

        return Promise.resolve(
            true
        );
    }

    emitState (state) {
        this.state = state;

        for (
            const listener of
                [...this._listeners]
        ) {
            listener(
                state
            );
        }
    }
}

describe(
    'ControllerDesktopWindowContainer',
    () => {
        test('owns the Controller session actions and reflects session state changes', () => {
            const session =
                new FakeSession();

            render(
                <ControllerDesktopWindowContainer
                    isOpen
                    onRequestClose={jest.fn()}
                    session={session}
                />
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Conectar'
                    }
                )
            );

            expect(
                session.connectCalls
            ).toBe(1);

            act(() => {
                session.emitState({
                    status:
                        'connected',
                    devices: [],
                    errorCode:
                        null
                });
            });

            expect(
                screen.getByText(
                    'Bluetooth conectado'
                )
            ).toBeInTheDocument();

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Desconectar'
                    }
                )
            );

            expect(
                session.disconnectCalls
            ).toBe(1);
        });

        test('closing and reopening the Controller does not disconnect its active session', () => {
            const session =
                new FakeSession({
                    status:
                        'connected',
                    devices: [],
                    errorCode:
                        null
                });

            const onRequestClose =
                jest.fn();

            const {rerender} =
                render(
                    <ControllerDesktopWindowContainer
                        isOpen
                        onRequestClose={
                            onRequestClose
                        }
                        session={session}
                    />
                );

            expect(
                screen.getByText(
                    'Bluetooth conectado'
                )
            ).toBeInTheDocument();

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

            expect(
                session.disconnectCalls
            ).toBe(0);

            rerender(
                <ControllerDesktopWindowContainer
                    isOpen={false}
                    onRequestClose={
                        onRequestClose
                    }
                    session={session}
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
            ).not.toBeInTheDocument();

            rerender(
                <ControllerDesktopWindowContainer
                    isOpen
                    onRequestClose={
                        onRequestClose
                    }
                    session={session}
                />
            );

            expect(
                screen.getByText(
                    'Bluetooth conectado'
                )
            ).toBeInTheDocument();

            expect(
                session.disconnectCalls
            ).toBe(0);
        });
    }
);
