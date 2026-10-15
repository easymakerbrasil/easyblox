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
import EasyConectDesktopSession from '../../../src/lib/easyconect-desktop-session';

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
        this.gamepadSession = null;
        this.outputsSession = null;
        this.terminalSession = null;

        this._listeners = [];
    }

    getState () {
        return this.state;
    }

    getGamepadSession () {
        return this.gamepadSession;
    }

    getControlsSession () {
        return null;
    }

    getMotorsServoSession () {
        return null;
    }

    getTerminalSession () {
        return this.terminalSession;
    }

    getOutputsSession () {
        return this.outputsSession;
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
        test.each([{pending: false}, {pending: true}])('Jr cancels the session: $pending', async ({pending}) => {
            let resolveConnection;
            let physicallyConnected = false;
            const unsubscribe = jest.fn();
            const pendingConnect = function (resolve) {
                resolveConnection = () => {
                    physicallyConnected = true;
                    resolve();
                };
            };
            const client = {
                listDevices: jest.fn(() => Promise.resolve([{deviceId: 'COM10', name: 'EasyMaker-39'}])),
                connect: jest.fn(() => new Promise(pendingConnect)),
                disconnect: jest.fn(() => {
                    const wasConnected = physicallyConnected;
                    physicallyConnected = false;
                    return Promise.resolve(wasConnected);
                }),
                onDisconnect: jest.fn(() => unsubscribe),
                send: jest.fn(() => Promise.resolve()),
                waitFor: jest.fn(() => new Promise(() => {}))
            };
            const session = new EasyConectDesktopSession({client});
            const onRequestClose = jest.fn();
            const onConnectionStateChange = jest.fn();
            const renderWindow = function (compatible) {
                return (
                    <EasyConectDesktopWindowContainer
                        easyBloxBtActive
                        isOpen
                        easyConectBoardCompatible={compatible}
                        onConnectionStateChange={onConnectionStateChange}
                        onRequestClose={onRequestClose}
                        session={session}
                    />
                );
            };
            const {rerender, unmount} = render(renderWindow(true));
            let connecting;
            await act(async () => {
                connecting = session.connect();
                await Promise.resolve();
            });
            expect(session.getState().status).toBe('connecting');
            if (!pending) {
                await act(async () => {
                    resolveConnection();
                    await connecting;
                });
                expect(session.getState().status).toBe('connected');
            }
            rerender(renderWindow(false));
            expect(onRequestClose).toHaveBeenCalledTimes(1);
            expect(session.getTerminalSession()).toBeNull();
            expect(session.getControlsSession()).toBeNull();
            expect(session.getMotorsServoSession()).toBeNull();
            expect(session.getOutputsSession()).toBeNull();
            expect(session.getGamepadSession()).toBeNull();
            await act(async () => {
                if (pending) {
                    resolveConnection();
                    expect(await connecting).toBe(false);
                }
            });
            expect(physicallyConnected).toBe(false);
            expect(session.getState().status).toBe('disconnected');
            expect(onConnectionStateChange).toHaveBeenLastCalledWith(false);
            expect(client.send).not.toHaveBeenCalled();
            rerender(renderWindow(true));
            await act(async () => {
                fireEvent.click(screen.getByRole('button', {name: 'Conectar'}));
                await Promise.resolve();
            });
            await act(async () => {
                resolveConnection();
                await Promise.resolve();
            });
            expect(session.getState().status).toBe('connected');
            expect(client.connect).toHaveBeenCalledTimes(2);
            expect(client.onDisconnect).toHaveBeenCalledTimes(1);
            expect(onRequestClose).toHaveBeenCalledTimes(1);
            unmount();
            expect(session._stateListeners.size).toBe(0);
            session.dispose();
            expect(unsubscribe).toHaveBeenCalledTimes(1);
        });

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

        test('disconnects and closes EasyConect when EasyBlox BT is removed', () => {
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
                        easyBloxBtActive
                        easyConectBoardCompatible
                        isOpen
                        onRequestClose={
                            onRequestClose
                        }
                        session={session}
                    />
                );

            expect(
                session.disconnectCalls
            ).toBe(0);

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(0);

            rerender(
                <EasyConectDesktopWindowContainer
                    easyBloxBtActive={false}
                    isOpen
                    onRequestClose={
                        onRequestClose
                    }
                    session={session}
                />
            );

            expect(
                session.disconnectCalls
            ).toBe(1);

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(1);

            rerender(
                <EasyConectDesktopWindowContainer
                    easyBloxBtActive={false}
                    isOpen={false}
                    onRequestClose={
                        onRequestClose
                    }
                    session={session}
                />
            );

            expect(
                session.disconnectCalls
            ).toBe(1);

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(1);
        });

        test('disconnects and closes EasyConect when the active board loses Bluetooth capability', () => {
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
                        easyBloxBtActive
                        easyConectBoardCompatible
                        isOpen
                        onRequestClose={
                            onRequestClose
                        }
                        session={session}
                    />
                );

            expect(
                session.disconnectCalls
            ).toBe(0);

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(0);

            rerender(
                <EasyConectDesktopWindowContainer
                    easyBloxBtActive
                    easyConectBoardCompatible={false}
                    isOpen
                    onRequestClose={
                        onRequestClose
                    }
                    session={session}
                />
            );

            expect(
                session.disconnectCalls
            ).toBe(1);

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(1);
        });

        test('disconnects EasyConect when EasyBlox BT is removed while the window is closed', () => {
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
                        easyBloxBtActive
                        easyConectBoardCompatible
                        isOpen={false}
                        onRequestClose={
                            onRequestClose
                        }
                        session={session}
                    />
                );

            expect(
                session.disconnectCalls
            ).toBe(0);

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(0);

            rerender(
                <EasyConectDesktopWindowContainer
                    easyBloxBtActive={false}
                    isOpen={false}
                    onRequestClose={
                        onRequestClose
                    }
                    session={session}
                />
            );

            expect(
                session.disconnectCalls
            ).toBe(1);

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(1);
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
