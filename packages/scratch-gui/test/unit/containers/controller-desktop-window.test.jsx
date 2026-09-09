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

class FakeVM {
    constructor () {
        this._listeners =
            new Map();
    }

    addListener (eventName, listener) {
        if (!this._listeners.has(eventName)) {
            this._listeners.set(
                eventName,
                new Set()
            );
        }

        this._listeners
            .get(eventName)
            .add(listener);
    }

    removeListener (eventName, listener) {
        const listeners =
            this._listeners.get(
                eventName
            );

        if (!listeners) {
            return;
        }

        listeners.delete(
            listener
        );
    }

    emit (eventName) {
        const listeners =
            this._listeners.get(
                eventName
            );

        if (!listeners) {
            return;
        }

        for (
            const listener of
            [...listeners]
        ) {
            listener();
        }
    }

    listenerCount (eventName) {
        const listeners =
            this._listeners.get(
                eventName
            );

        return listeners ?
            listeners.size :
            0;
    }
}

class FakeProjectBridge {
    constructor () {
        this.refreshCalls = 0;
    }

    refreshFromVM () {
        this.refreshCalls += 1;
    }
}

describe(
    'ControllerDesktopWindowContainer',
    () => {
        test('owns the Controller session actions and reflects session state changes', () => {
            const session =
                new FakeSession();

            const onConnectionStateChange =
                jest.fn();

            render(
                <ControllerDesktopWindowContainer
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
                    connectedDeviceLabel:
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

        test('refreshes the Controller project bridge when the VM loads a project', () => {
            const session =
                new FakeSession();

            const vm =
                new FakeVM();

            const projectBridge =
                new FakeProjectBridge();

            const {unmount} =
                render(
                    <ControllerDesktopWindowContainer
                        isOpen={false}
                        onRequestClose={jest.fn()}
                        projectBridge={projectBridge}
                        session={session}
                        vm={vm}
                    />
                );

            expect(
                vm.listenerCount(
                    'PROJECT_LOADED'
                )
            ).toBe(1);

            act(() => {
                vm.emit(
                    'PROJECT_LOADED'
                );
            });

            expect(
                projectBridge.refreshCalls
            ).toBe(1);

            unmount();

            expect(
                vm.listenerCount(
                    'PROJECT_LOADED'
                )
            ).toBe(0);
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
