import React from 'react';
import {
    fireEvent,
    render
} from '@testing-library/react';

import EasyBloxQrModal from '../../../src/components/easyblox-qr-modal/easyblox-qr-modal.jsx';

const createVm = (
    initialQrCodes = []
) => {
    let qrCodes =
        initialQrCodes.map(
            qrCode => ({
                ...qrCode
            })
        );

    let nextId = 1;

    return {
        getEasyBloxQrCodes:
            jest.fn(
                () =>
                    qrCodes.map(
                        qrCode => ({
                            ...qrCode
                        })
                    )
            ),

        createEasyBloxQrCode:
            jest.fn(
                (name, content) => {
                    const created = {
                        id:
                            `qr_test_${nextId++}`,
                        name:
                            name.trim(),
                        content
                    };

                    qrCodes = [
                        ...qrCodes,
                        created
                    ];

                    return created;
                }
            ),

        updateEasyBloxQrCode:
            jest.fn(
                (id, updates) => {
                    qrCodes =
                        qrCodes.map(
                            qrCode => {
                                if (
                                    qrCode.id === id
                                ) {
                                    return {
                                        ...qrCode,
                                        ...updates
                                    };
                                }

                                return qrCode;
                            }
                        );

                    return qrCodes.find(
                        qrCode =>
                            qrCode.id === id
                    );
                }
            ),

        deleteEasyBloxQrCode:
            jest.fn(
                id => {
                    const previousLength =
                        qrCodes.length;

                    qrCodes =
                        qrCodes.filter(
                            qrCode =>
                                qrCode.id !== id
                        );

                    return (
                        qrCodes.length !==
                        previousLength
                    );
                }
            )
    };
};

describe(
    'EasyBlox QR authoring modal',
    () => {
        test(
            'creates a project QR Code and opens the manager',
            () => {
                const vm =
                    createVm();

                const {
                    getByLabelText,
                    getByRole,
                    getByText
                } = render(
                    <EasyBloxQrModal
                        initialMode="create"
                        vm={vm}
                        onRequestClose={
                            jest.fn()
                        }
                    />
                );

                fireEvent.change(
                    getByLabelText(
                        'Nome do QR Code'
                    ),
                    {
                        target: {
                            value:
                                'Estação 1'
                        }
                    }
                );

                fireEvent.change(
                    getByLabelText(
                        'Conteúdo do QR Code'
                    ),
                    {
                        target: {
                            value:
                                'https://example.com'
                        }
                    }
                );

                fireEvent.click(
                    getByRole(
                        'button',
                        {
                            name:
                                'Criar'
                        }
                    )
                );

                expect(
                    vm.createEasyBloxQrCode
                ).toHaveBeenCalledWith(
                    'Estação 1',
                    'https://example.com'
                );

                expect(
                    getByText(
                        'Estação 1'
                    )
                ).toBeTruthy();

                expect(
                    getByText(
                        'https://example.com'
                    )
                ).toBeTruthy();
            }
        );

        test(
            'edits a resource while preserving its stable ID',
            () => {
                const vm =
                    createVm([
                        {
                            id:
                                'qr_a',
                            name:
                                'Estação 1',
                            content:
                                'A'
                        }
                    ]);

                const {
                    getByLabelText,
                    getByRole
                } = render(
                    <EasyBloxQrModal
                        initialMode="manage"
                        vm={vm}
                        onRequestClose={
                            jest.fn()
                        }
                    />
                );

                fireEvent.click(
                    getByRole(
                        'button',
                        {
                            name:
                                'Editar'
                        }
                    )
                );

                fireEvent.change(
                    getByLabelText(
                        'Nome do QR Code Estação 1'
                    ),
                    {
                        target: {
                            value:
                                'Desafio Final'
                        }
                    }
                );

                fireEvent.change(
                    getByLabelText(
                        'Conteúdo do QR Code Estação 1'
                    ),
                    {
                        target: {
                            value:
                                'B'
                        }
                    }
                );

                fireEvent.click(
                    getByRole(
                        'button',
                        {
                            name:
                                'Salvar'
                        }
                    )
                );

                expect(
                    vm.updateEasyBloxQrCode
                ).toHaveBeenCalledWith(
                    'qr_a',
                    {
                        name:
                            'Desafio Final',
                        content:
                            'B'
                    }
                );
            }
        );

        test(
            'requires confirmation before deleting a resource',
            () => {
                const vm =
                    createVm([
                        {
                            id:
                                'qr_a',
                            name:
                                'Estação 1',
                            content:
                                'A'
                        }
                    ]);

                const {
                    getAllByRole,
                    getByRole
                } = render(
                    <EasyBloxQrModal
                        initialMode="manage"
                        vm={vm}
                        onRequestClose={
                            jest.fn()
                        }
                    />
                );

                fireEvent.click(
                    getByRole(
                        'button',
                        {
                            name:
                                'Excluir'
                        }
                    )
                );

                expect(
                    vm.deleteEasyBloxQrCode
                ).not.toHaveBeenCalled();

                const deleteButtons =
                    getAllByRole(
                        'button',
                        {
                            name:
                                'Excluir'
                        }
                    );

                fireEvent.click(
                    deleteButtons[
                        deleteButtons.length - 1
                    ]
                );

                expect(
                    vm.deleteEasyBloxQrCode
                ).toHaveBeenCalledWith(
                    'qr_a'
                );
            }
        );
    }
);
