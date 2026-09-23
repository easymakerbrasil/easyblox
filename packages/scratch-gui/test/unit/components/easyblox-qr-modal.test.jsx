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

        getEasyBloxQrCodeRaster:
            jest.fn(
                id => {
                    const qrCode =
                        qrCodes.find(
                            item =>
                                item.id === id
                        );

                    if (!qrCode) {
                        return null;
                    }

                    return {
                        content:
                            qrCode.content,
                        width:
                            2,
                        height:
                            2,
                        pixels:
                            new Uint8ClampedArray(
                                16
                            )
                    };
                }
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
        let canvasContext;

        beforeEach(
            () => {
                canvasContext = {
                    createImageData:
                        jest.fn(
                            (width, height) => ({
                                data:
                                    new Uint8ClampedArray(
                                        width *
                                        height *
                                        4
                                    )
                            })
                        ),
                    putImageData:
                        jest.fn()
                };

                jest.spyOn(
                    HTMLCanvasElement.prototype,
                    'getContext'
                ).mockReturnValue(
                    canvasContext
                );

                jest.spyOn(
                    HTMLCanvasElement.prototype,
                    'toDataURL'
                ).mockReturnValue(
                    'data:image/png;base64,EASYBLOX'
                );

                jest.spyOn(
                    HTMLAnchorElement.prototype,
                    'click'
                ).mockImplementation(
                    () => {}
                );
            }
        );

        afterEach(
            () => {
                jest.restoreAllMocks();
            }
        );

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
            'renders a real preview from the canonical QR raster',
            () => {
                const vm =
                    createVm([
                        {
                            id:
                                'qr_a',
                            name:
                                'Estação 1',
                            content:
                                'EASYBLOX-PREVIEW'
                        }
                    ]);

                const {
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

                expect(
                    vm.getEasyBloxQrCodeRaster
                ).toHaveBeenCalledWith(
                    'qr_a',
                    {
                        size: 256
                    }
                );

                expect(
                    getByRole(
                        'img',
                        {
                            name:
                                'Prévia do QR Code Estação 1'
                        }
                    )
                ).toBeTruthy();

                expect(
                    canvasContext.putImageData
                ).toHaveBeenCalled();
            }
        );

        test(
            'downloads a canonical 1024 pixel PNG',
            () => {
                const vm =
                    createVm([
                        {
                            id:
                                'qr_a',
                            name:
                                'Estação 1',
                            content:
                                'EASYBLOX-DOWNLOAD'
                        }
                    ]);

                const {
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
                                'Baixar PNG'
                        }
                    )
                );

                expect(
                    vm.getEasyBloxQrCodeRaster
                ).toHaveBeenCalledWith(
                    'qr_a',
                    {
                        size: 1024
                    }
                );

                expect(
                    HTMLCanvasElement
                        .prototype
                        .toDataURL
                ).toHaveBeenCalledWith(
                    'image/png'
                );

                expect(
                    HTMLAnchorElement
                        .prototype
                        .click
                ).toHaveBeenCalled();
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
