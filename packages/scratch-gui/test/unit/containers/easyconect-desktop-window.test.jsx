import React from 'react';
import {
    act,
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import '@testing-library/jest-dom';

import {
    EasyConectDesktopWindowContainer
} from '../../../src/containers/easyconect-desktop-window.jsx';

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
        this.terminalSession = null;

        this._listeners = [];
    }

    getState () {
        return this.state;
    }

    getTerminalSession () {
        return this.terminalSession;
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
    'EasyConectDesktopWindowContainer',
    () => {
        test('owns the EasyConect session actions and reflects session state changes', () => {
            const session =
                new FakeSession();

            const onConnectionStateChange =
                jest.fn();

            render(
                <EasyConectDesktopWindowContainer
                    isOpen
                    onConnectionStateChange={
                        onConnectionStateChange
                    }
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
                onConnectionStateChange
            ).toHaveBeenLastCalledWith(
                true
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
                            'Desconectar'
                    }
                )
            );

            expect(
                session.disconnectCalls
            ).toBe(1);

            act(() => {
                session.emitState({
                    status:
                        'disconnected',
                    devices: [],
                    connectedDeviceName:
                        null,
                    errorCode:
                        null
                });
            });

            expect(
                onConnectionStateChange
            ).toHaveBeenLastCalledWith(
                false
            );
        });

        test('closing and reopening the EasyConect does not disconnect its active session', () => {
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
                    <EasyConectDesktopWindowContainer
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
                            'Fechar EasyConect'
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
                <EasyConectDesktopWindowContainer
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
                            'EasyConect'
                    }
                )
            ).not.toBeInTheDocument();

            rerender(
                <EasyConectDesktopWindowContainer
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
