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

const disconnectedState = {
    status:
        'disconnected',
    devices: [],
    connectedDeviceName:
        null,
    errorCode:
        null
};

class FakeTerminalSession {
    constructor (history = []) {
        this.history = history;
        this.sendTextCalls = [];
        this.sendNumberCalls = [];
        this.clearHistoryCalls = 0;
        this._listeners = [];
    }

    getHistory () {
        return this.history;
    }

    onHistoryChange (listener) {
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

    sendText (payload) {
        this.sendTextCalls.push(
            payload
        );

        this.history = [
            ...this.history,
            {
                direction:
                    'outgoing',
                type:
                    'text',
                payload
            }
        ];

        this._emit();

        return Promise.resolve(
            this.sendTextCalls.length
        );
    }

    sendNumber (payload) {
        this.sendNumberCalls.push(
            payload
        );

        this.history = [
            ...this.history,
            {
                direction:
                    'outgoing',
                type:
                    'number',
                payload
            }
        ];

        this._emit();

        return Promise.resolve(
            this.sendNumberCalls.length
        );
    }

    clearHistory () {
        this.clearHistoryCalls += 1;
        this.history = [];
        this._emit();
    }

    _emit () {
        for (
            const listener of
            [...this._listeners]
        ) {
            listener(
                this.history
            );
        }
    }
}

describe(
    'EasyConectDesktopWindow',
    () => {
        test('stays hidden while closed', () => {
            render(
                <EasyConectDesktopWindow
                    connectionState={
                        disconnectedState
                    }
                    onRequestClose={
                        jest.fn()
                    }
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
        });

        test('exposes exactly the five canonical EasyConect modules', () => {
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

            const modules = [
                'Gamepad',
                'Controles',
                'Motores e Servos',
                'Terminal',
                'Saídas'
            ];

            for (
                const moduleName of
                modules
            ) {
                expect(
                    screen.getByRole(
                        'button',
                        {
                            name:
                                `Abrir ${moduleName}`
                        }
                    )
                ).toBeInTheDocument();
            }

            expect(
                screen.queryByRole(
                    'button',
                    {
                        name:
                            'Abrir Joystick'
                    }
                )
            ).not.toBeInTheDocument();

            expect(
                screen.queryByRole(
                    'button',
                    {
                        name:
                            'Abrir Serial'
                    }
                )
            ).not.toBeInTheDocument();
        });

        test('navigates from the hub to Terminal and back', () => {
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

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Abrir Terminal'
                    }
                )
            );

            expect(
                screen.getByRole(
                    'heading',
                    {
                        name:
                            'Terminal'
                    }
                )
            ).toBeInTheDocument();

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Voltar ao EasyConect'
                    }
                )
            );

            expect(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Abrir Gamepad'
                    }
                )
            ).toBeInTheDocument();
        });

        test('uses the active Terminal session for history and TEXT NUMBER sends', async () => {
            const terminalSession =
                new FakeTerminalSession([
                    {
                        direction:
                            'incoming',
                        type:
                            'text',
                        payload:
                            'Arduino'
                    }
                ]);

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={{
                        status:
                            'connected',
                        devices: [],
                        connectedDeviceName:
                            'EasyMaker-39',
                        errorCode:
                            null
                    }}
                    onRequestClose={
                        jest.fn()
                    }
                    terminalSession={
                        terminalSession
                    }
                />
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Abrir Terminal'
                    }
                )
            );

            expect(
                screen.getByText(
                    'Arduino'
                )
            ).toBeInTheDocument();

            fireEvent.change(
                screen.getByLabelText(
                    'Valor do Terminal'
                ),
                {
                    target: {
                        value:
                            'Olá'
                    }
                }
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Enviar'
                    }
                )
            );

            await waitFor(
                () => {
                    expect(
                        terminalSession
                            .sendTextCalls
                    ).toEqual([
                        'Olá'
                    ]);
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    'Tipo de mensagem do Terminal'
                ),
                {
                    target: {
                        value:
                            'number'
                    }
                }
            );

            fireEvent.change(
                screen.getByLabelText(
                    'Valor do Terminal'
                ),
                {
                    target: {
                        value:
                            '42,5'
                    }
                }
            );

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Enviar'
                    }
                )
            );

            await waitFor(
                () => {
                    expect(
                        terminalSession
                            .sendNumberCalls
                    ).toEqual([
                        42.5
                    ]);
                }
            );

            expect(
                screen.getByText(
                    '42.5'
                )
            ).toBeInTheDocument();

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Limpar'
                    }
                )
            );

            expect(
                terminalSession
                    .clearHistoryCalls
            ).toBe(1);

            expect(
                screen.getByText(
                    'Nenhuma mensagem nesta sessão.'
                )
            ).toBeInTheDocument();
        });

        test('shows Terminal as unavailable without an active Bluetooth session', () => {
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

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Abrir Terminal'
                    }
                )
            );

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar o Terminal.'
                )
            ).toBeInTheDocument();
        });

        test('shows the connected EasyConect device and disconnect action', () => {
            const onDisconnect =
                jest.fn();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={{
                        status:
                            'connected',
                        devices: [],
                        connectedDeviceName:
                            'EasyMaker-39',
                        errorCode:
                            null
                    }}
                    onDisconnect={
                        onDisconnect
                    }
                    onRequestClose={
                        jest.fn()
                    }
                />
            );

            expect(
                screen.getByText(
                    /Bluetooth conectado.*EasyMaker-39/
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
                onDisconnect
            ).toHaveBeenCalledTimes(
                1
            );
        });

        test('closes the window without requesting a Bluetooth disconnect', () => {
            const onRequestClose =
                jest.fn();

            const onDisconnect =
                jest.fn();

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={{
                        status:
                            'connected',
                        devices: [],
                        connectedDeviceName:
                            'EasyMaker-39',
                        errorCode:
                            null
                    }}
                    onDisconnect={
                        onDisconnect
                    }
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
                            'Fechar EasyConect'
                    }
                )
            );

            expect(
                onRequestClose
            ).toHaveBeenCalledTimes(
                1
            );

            expect(
                onDisconnect
            ).not.toHaveBeenCalled();
        });
    }
);
