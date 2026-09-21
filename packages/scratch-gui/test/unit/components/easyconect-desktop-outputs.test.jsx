import React from 'react';
import {
    act,
    fireEvent,
    render,
    screen
} from '@testing-library/react';
import '@testing-library/jest-dom';

import EasyConectDesktopWindow
    from '../../../src/components/easyconect-desktop-window/easyconect-desktop-window.jsx';

class FakeOutputsSession {
    constructor (
        indicator = false
    ) {
        this.indicator =
            indicator;

        this._listeners = [];
    }

    getIndicator () {
        return this.indicator;
    }

    onIndicatorChange (
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

    emitIndicator (
        value
    ) {
        this.indicator =
            value;

        for (
            const listener of
            [...this._listeners]
        ) {
            listener(
                value
            );
        }
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

describe(
    'EasyConect Desktop Outputs',
    () => {
        test('shows the fixed indicator off when the active Outputs session starts', () => {
            const outputsSession =
                new FakeOutputsSession(
                    false
                );

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    onRequestClose={
                        jest.fn()
                    }
                    outputsSession={
                        outputsSession
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
                screen.getByRole(
                    'heading',
                    {
                        name:
                            'Saídas'
                    }
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    'Indicador'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    'Desligado'
                )
            ).toBeInTheDocument();
        });

        test('updates the fixed indicator from the active Outputs session', () => {
            const outputsSession =
                new FakeOutputsSession(
                    false
                );

            render(
                <EasyConectDesktopWindow
                    isOpen
                    connectionState={
                        connectedState
                    }
                    onRequestClose={
                        jest.fn()
                    }
                    outputsSession={
                        outputsSession
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

            act(
                () => {
                    outputsSession
                        .emitIndicator(
                            true
                        );
                }
            );

            expect(
                screen.getByText(
                    'Ligado'
                )
            ).toBeInTheDocument();

            expect(
                screen.queryByText(
                    'Desligado'
                )
            ).not.toBeInTheDocument();

            act(
                () => {
                    outputsSession
                        .emitIndicator(
                            false
                        );
                }
            );

            expect(
                screen.getByText(
                    'Desligado'
                )
            ).toBeInTheDocument();
        });

        test('shows Outputs unavailable and off without an active Bluetooth session', () => {
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
                            'Abrir Saídas'
                    }
                )
            );

            expect(
                screen.getByText(
                    'Conecte o Bluetooth para usar Saídas.'
                )
            ).toBeInTheDocument();

            expect(
                screen.getByText(
                    'Desligado'
                )
            ).toBeInTheDocument();
        });
    }
);
