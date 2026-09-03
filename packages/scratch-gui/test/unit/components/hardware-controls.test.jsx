import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import HardwareControls from '../../../src/components/hardware-controls/hardware-controls';

describe('HardwareControls', () => {
    test('shows no board as a selectable board indicator', () => {
        const onSelectBoard = jest.fn();

        render(
            <HardwareControls
                connectionState="disconnected"
                selectedBoard={null}
                onConnect={jest.fn()}
                onDisconnect={jest.fn()}
                onSelectBoard={onSelectBoard}
            />
        );

        const boardButton = screen.getByRole('button', {
            name: 'Selecionar placa'
        });

        expect(boardButton).toHaveTextContent('Selecionar Placa');

        fireEvent.click(boardButton);

        expect(onSelectBoard).toHaveBeenCalledTimes(1);
    });

    test('shows Arduino UNO as the active board', () => {
        render(
            <HardwareControls
                connectionState="disconnected"
                selectedBoard="arduino-uno"
                onConnect={jest.fn()}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Alterar placa'
            })
        ).toHaveTextContent('Arduino UNO');

        expect(
            screen.queryByRole('combobox')
        ).not.toBeInTheDocument();
    });

    test('shows micro:bit as the active board', () => {
        render(
            <HardwareControls
                connectionState="disconnected"
                selectedBoard="microbit"
                onConnect={jest.fn()}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Alterar placa'
            })
        ).toHaveTextContent('micro:bit');
    });

    test('requests connection while disconnected', () => {
        const onConnect = jest.fn();

        render(
            <HardwareControls
                connectionState="disconnected"
                selectedBoard="arduino-uno"
                onConnect={onConnect}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Conectar placa'
            })
        );

        expect(onConnect).toHaveBeenCalledTimes(1);
    });

    test('shows a disabled visual control while connecting', () => {
        render(
            <HardwareControls
                connectionState="connecting"
                selectedBoard="arduino-uno"
                onConnect={jest.fn()}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Conectando...'
            })
        ).toBeDisabled();

        expect(
            screen.queryByText('Conectando...')
        ).not.toBeInTheDocument();
    });

    test('asks for confirmation before disconnecting', () => {
    const onDisconnect = jest.fn();

    render(
        <HardwareControls
            connectionState="connected"
            selectedBoard="arduino-uno"
            onConnect={jest.fn()}
            onDisconnect={onDisconnect}
            onSelectBoard={jest.fn()}
        />
    );

    fireEvent.click(
        screen.getByRole('button', {
            name: 'Desconectar placa'
        })
    );

    expect(onDisconnect).not.toHaveBeenCalled();

    expect(
        screen.getByText('Desconectar Arduino UNO?')
    ).toBeInTheDocument();

    fireEvent.click(
        screen.getByRole('button', {
            name: 'Desconectar'
        })
    );

    expect(onDisconnect).toHaveBeenCalledTimes(1);
});

    test('keeps the connection when disconnection is cancelled', () => {
        const onDisconnect = jest.fn();

        render(
            <HardwareControls
                connectionState="connected"
                selectedBoard="arduino-uno"
                onConnect={jest.fn()}
                onDisconnect={onDisconnect}
                onSelectBoard={jest.fn()}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Desconectar placa'
            })
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancelar'
            })
        );

        expect(onDisconnect).not.toHaveBeenCalled();

        expect(
            screen.queryByText('Desconectar Arduino UNO?')
        ).not.toBeInTheDocument();
    });

    test('allows retry after a connection error', () => {
        const onConnect = jest.fn();

        render(
            <HardwareControls
                connectionState="error"
                selectedBoard="arduino-uno"
                onConnect={onConnect}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Erro de conexão. Tentar novamente'
            })
        );

        expect(onConnect).toHaveBeenCalledTimes(1);
    });

    test.each([
        [
            'legacy',
            'O firmware do Modo Palco precisa ser atualizado.',
            'Atualizar para o Modo Palco'
        ],
        [
            'incompatible',
            'A versão do firmware do Modo Palco não é compatível.',
            'Atualizar para o Modo Palco'
        ],
        [
            'unidentified',
            'O firmware do Modo Palco não foi identificado.',
            'Preparar para o Modo Palco'
        ]
    ])(
        'offers an explicit Stage firmware action for %s firmware',
        (
            stageFirmwareIssue,
            expectedMessage,
            expectedAction
        ) => {
            const onConnect = jest.fn();
            const onPrepareStageFirmware =
                jest.fn();

            render(
                <HardwareControls
                    connectionState="error"
                    onConnect={onConnect}
                    onDisconnect={jest.fn()}
                    onPrepareStageFirmware={
                        onPrepareStageFirmware
                    }
                    onSelectBoard={jest.fn()}
                    selectedBoard="arduino-uno"
                    stageFirmwareIssue={
                        stageFirmwareIssue
                    }
                />
            );

            expect(
                screen.getByText(
                    expectedMessage
                )
            ).toBeInTheDocument();

            expect(
                onPrepareStageFirmware
            ).not.toHaveBeenCalled();

            expect(
                onConnect
            ).not.toHaveBeenCalled();

            fireEvent.click(
                screen.getByRole(
                    'button',
                    {
                        name:
                            expectedAction
                    }
                )
            );

            expect(
                onPrepareStageFirmware
            ).toHaveBeenCalledTimes(1);

            expect(
                onConnect
            ).not.toHaveBeenCalled();
        }
    );

    test('cancels Stage firmware preparation without reconnecting or restoring', () => {
        const onConnect = jest.fn();
        const onPrepareStageFirmware =
            jest.fn();

        render(
            <HardwareControls
                connectionState="error"
                onConnect={onConnect}
                onDisconnect={jest.fn()}
                onPrepareStageFirmware={
                    onPrepareStageFirmware
                }
                onSelectBoard={jest.fn()}
                selectedBoard="arduino-uno"
                stageFirmwareIssue="unidentified"
            />
        );

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name: 'Cancelar'
                }
            )
        );

        expect(
            onPrepareStageFirmware
        ).not.toHaveBeenCalled();

        expect(
            onConnect
        ).not.toHaveBeenCalled();

        expect(
            screen.queryByText(
                'O firmware do Modo Palco não foi identificado.'
            )
        ).not.toBeInTheDocument();
    });

    test('reopens the Stage firmware prompt instead of retrying the connection', () => {
        const onConnect = jest.fn();

        render(
            <HardwareControls
                connectionState="error"
                onConnect={onConnect}
                onDisconnect={jest.fn()}
                onPrepareStageFirmware={
                    jest.fn()
                }
                onSelectBoard={jest.fn()}
                selectedBoard="arduino-uno"
                stageFirmwareIssue="legacy"
            />
        );

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name: 'Cancelar'
                }
            )
        );

        expect(
            screen.queryByText(
                'O firmware do Modo Palco precisa ser atualizado.'
            )
        ).not.toBeInTheDocument();

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name:
                        'Erro de conexão. Tentar novamente'
                }
            )
        );

        expect(
            screen.getByText(
                'O firmware do Modo Palco precisa ser atualizado.'
            )
        ).toBeInTheDocument();

        expect(onConnect)
            .not.toHaveBeenCalled();
    });
});
