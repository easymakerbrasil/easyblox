import React from 'react';
import {fireEvent, render as renderComponent, screen} from '@testing-library/react';
import {IntlProvider} from 'react-intl';
import '@testing-library/jest-dom';

import HardwareControls from '../../../src/components/hardware-controls/hardware-controls';
import {renderWithIntl as render} from '../../helpers/intl-helpers.jsx';

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

    test('keeps the board selector visually neutral when no board is selected', () => {
        render(
            <HardwareControls
                connectionState="disconnected"
                selectedBoard={null}
                onConnect={jest.fn()}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
            />
        );

        const boardButton =
            screen.getByRole('button', {
                name: 'Selecionar placa'
            });

        expect(boardButton)
            .toHaveAttribute(
                'aria-pressed',
                'false'
            );

        expect(
            boardButton.className
        ).not.toContain(
            'board-button-selected'
        );
    });

    test('shows Arduino UNO as the visually selected board', () => {
        render(
            <HardwareControls
                connectionState="disconnected"
                selectedBoard="arduino-uno"
                onConnect={jest.fn()}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
            />
        );

        const boardButton =
            screen.getByRole('button', {
                name: 'Alterar placa'
            });

        expect(boardButton)
            .toHaveTextContent('Arduino UNO');

        expect(boardButton)
            .toHaveAttribute(
                'aria-pressed',
                'true'
            );

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
            'A preparação do Modo Palco desta placa precisa ser atualizada.'
        ],
        [
            'incompatible',
            'A preparação do Modo Palco desta placa não é compatível com esta versão do EasyBlox.'
        ],
        [
            'unidentified',
            'O EasyBlox não conseguiu confirmar se esta placa está pronta para o Modo Palco.'
        ]
    ])(
        'offers an explicit Stage firmware action for %s firmware',
        (
            stageFirmwareIssue,
            expectedMessage
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

            expect(screen.getByRole('dialog', {name: 'Preparar Modo Palco?'})).toBeInTheDocument();
            expect(screen.getByText('Preparar Modo Palco?')).toBeVisible();
            expect(screen.getByText(
                'Para continuar, o EasyBlox precisa preparar a placa. ' +
                'Esse processo substituirá o programa que está gravado nela atualmente.'
            )).toBeVisible();

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
                            'Preparar Modo Palco'
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
                'O EasyBlox não conseguiu confirmar se esta placa está pronta para o Modo Palco.'
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
                'A preparação do Modo Palco desta placa precisa ser atualizada.'
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
                'A preparação do Modo Palco desta placa precisa ser atualizada.'
            )
        ).toBeInTheDocument();

        expect(onConnect)
            .not.toHaveBeenCalled();
    });

    test.each([
        ['Cancelar', false],
        ['Close', false],
        ['Escape', true]
    ])('%s preserves the diagnosis and allows preparation after reopening', (label, isEscape) => {
        const onPrepareStageFirmware = jest.fn();
        const onConnect = jest.fn();
        const onDisconnect = jest.fn();
        render(
            <HardwareControls
                connectionState="error"
                selectedBoard="arduino-uno"
                stageFirmwareIssue="unidentified"
                onPrepareStageFirmware={onPrepareStageFirmware}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
            />
        );

        if (isEscape) {
            fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape', keyCode: 27});
        } else {
            fireEvent.click(screen.getByRole('button', {name: label}));
        }

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(onPrepareStageFirmware).not.toHaveBeenCalled();
        expect(onConnect).not.toHaveBeenCalled();
        expect(onDisconnect).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', {name: 'Erro de conexão. Tentar novamente'}));
        expect(screen.getByText(
            'O EasyBlox não conseguiu confirmar se esta placa está pronta para o Modo Palco.'
        )).toBeVisible();
        fireEvent.click(screen.getByRole('button', {name: 'Preparar Modo Palco'}));
        expect(onPrepareStageFirmware).toHaveBeenCalledTimes(1);
        expect(onConnect).not.toHaveBeenCalled();
        expect(onDisconnect).not.toHaveBeenCalled();
    });

    test('opens only for a diagnosis and preserves the opening rules when it changes', () => {
        const props = {
            connectionState: 'error',
            selectedBoard: 'arduino-uno',
            onPrepareStageFirmware: jest.fn(),
            onConnect: jest.fn()
        };
        const {rerender} = renderComponent(<HardwareControls {...props} />, {
            wrapper: ({children}) => <IntlProvider locale="pt-br">{children}</IntlProvider>
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        rerender(
            <HardwareControls
                {...props}
                stageFirmwareIssue="legacy"
            />
        );
        expect(screen.getByRole('dialog', {name: 'Preparar Modo Palco?'})).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', {name: 'Cancelar'}));

        rerender(
            <HardwareControls
                {...props}
                stageFirmwareIssue="legacy"
            />
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        rerender(
            <HardwareControls
                {...props}
                stageFirmwareIssue="incompatible"
            />
        );
        expect(screen.getByRole('dialog', {name: 'Preparar Modo Palco?'})).toBeInTheDocument();

        rerender(
            <HardwareControls
                {...props}
                stageFirmwareIssue={null}
            />
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(props.onPrepareStageFirmware).not.toHaveBeenCalled();
        expect(props.onConnect).not.toHaveBeenCalled();
    });
});
