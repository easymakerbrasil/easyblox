import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import UploadWorkspace from '../../../src/components/upload-workspace/upload-workspace';

const GENERATED_CODE = [
    '#include <Arduino.h>',
    '',
    'void setup() {',
    '    pinMode(13, OUTPUT);',
    '}'
].join('\n');

const getTextContent = function (item) {
    return item.textContent;
};

describe('UploadWorkspace', () => {
    let originalClipboard;

    beforeEach(() => {
        originalClipboard = navigator.clipboard;
    });

    afterEach(() => {
        Object.defineProperty(
            navigator,
            'clipboard',
            {
                configurable: true,
                value: originalClipboard
            }
        );
    });

    test('renders the canonical C++ as a read-only highlighted preview with line numbers', () => {
        const {container} = render(
            <UploadWorkspace
                boardName="Arduino UNO"
                code={GENERATED_CODE}
                error={null}
            />
        );

        const preview = screen.getByRole(
            'region',
            {
                name: 'Pré-visualização do código Arduino'
            }
        );

        const codeElement = preview.querySelector('code');
        const lineNumbers = preview.querySelector(
            'ol[aria-hidden="true"]'
        );

        expect(codeElement.textContent).toBe(GENERATED_CODE);

        expect(lineNumbers.children).toHaveLength(5);
        expect(
            Array.from(lineNumbers.children)
                .map(getTextContent)
        ).toEqual([
            '1',
            '2',
            '3',
            '4',
            '5'
        ]);

        const keywordTokens = Array.from(
            container.querySelectorAll('.token.keyword')
        ).map(getTextContent);

        expect(keywordTokens).toContain('void');

        expect(
            screen.queryByRole(
                'textbox',
                {
                    name: 'Código C++ gerado'
                }
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole(
                'button',
                {
                    name: 'Enviar para Arduino UNO'
                }
            )
        ).toBeDisabled();
    });

    test('opens Output automatically, preserves upload history and marks the upload action as busy', () => {
        const onUpload = jest.fn();

        const {rerender} = render(
            <UploadWorkspace
                boardName="Arduino UNO"
                code={GENERATED_CODE}
                error={null}
                onUpload={onUpload}
                outputEntries={[]}
                uploadState="idle"
            />
        );

        expect(
            screen.getByRole(
                'button',
                {
                    name: 'Enviar para Arduino UNO'
                }
            )
        ).toBeEnabled();

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Saída do envio'
                }
            )
        ).not.toBeInTheDocument();

        rerender(
            <UploadWorkspace
                boardName="Arduino UNO"
                code={GENERATED_CODE}
                error={null}
                onUpload={onUpload}
                outputEntries={[
                    {
                        id: 'build',
                        state: 'building',
                        message: 'Compilando o programa...'
                    },
                    {
                        id: 'prepare',
                        state: 'preparing',
                        message: 'Preparando a placa...'
                    },
                    {
                        id: 'upload',
                        state: 'uploading',
                        message: 'Gravando na placa...'
                    }
                ]}
                uploadState="uploading"
            />
        );

        const outputRegion =
            screen.getByRole(
                'region',
                {
                    name: 'Saída do envio'
                }
            );

        expect(outputRegion)
            .toHaveTextContent(
                'Compilando o programa...'
            );

        expect(outputRegion)
            .toHaveTextContent(
                'Preparando a placa...'
            );

        expect(outputRegion)
            .toHaveTextContent(
                'Gravando na placa...'
            );

        expect(
            screen.getByRole(
                'button',
                {
                    name:
                        'Enviando para Arduino UNO...'
                }
            )
        ).toBeDisabled();
    });

    test('shows a pedagogical empty state when there is no generated code', () => {
        render(
            <UploadWorkspace
                code=""
                error={null}
            />
        );

        expect(
            screen.getByText(
                'Monte seu programa com blocos para visualizar o código Arduino.'
            )
        ).toBeInTheDocument();

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Pré-visualização do código Arduino'
                }
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole(
                'button',
                {
                    name: 'Ver código bruto'
                }
            )
        ).toBeDisabled();
    });

    test('shows the exact canonical C++ in the raw-code view and copies that same text', () => {
        const writeText = jest.fn()
            .mockResolvedValue();

        Object.defineProperty(
            navigator,
            'clipboard',
            {
                configurable: true,
                value: {
                    writeText
                }
            }
        );

        render(
            <UploadWorkspace
                code={GENERATED_CODE}
                error={null}
            />
        );

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name: 'Ver código bruto'
                }
            )
        );

        expect(
            screen.getByRole(
                'dialog',
                {
                    name: 'Código bruto Arduino'
                }
            )
        ).toBeInTheDocument();

        const rawCode = screen.getByRole(
            'textbox',
            {
                name: 'Código bruto C++'
            }
        );

        expect(rawCode).toHaveValue(GENERATED_CODE);
        expect(rawCode).toHaveAttribute('readonly');

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name: 'Copiar código'
                }
            )
        );

        expect(writeText)
            .toHaveBeenCalledTimes(1);
        expect(writeText)
            .toHaveBeenCalledWith(GENERATED_CODE);

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name: 'Close'
                }
            )
        );

        expect(
            screen.queryByRole(
                'dialog',
                {
                    name: 'Código bruto Arduino'
                }
            )
        ).not.toBeInTheDocument();
    });

    test('shows a pedagogical error instead of the code preview', () => {
        render(
            <UploadWorkspace
                code=""
                error="Revise os blocos usados no programa."
            />
        );

        expect(
            screen.getByRole('alert')
        ).toHaveTextContent(
            'Revise os blocos usados no programa.'
        );

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Pré-visualização do código Arduino'
                }
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole(
                'button',
                {
                    name: 'Ver código bruto'
                }
            )
        ).toBeDisabled();
    });

    test('keeps the bottom panel collapsed by default and allows switching between Output and Serial Monitor', () => {
        render(
            <UploadWorkspace
                code={GENERATED_CODE}
                error={null}
                outputEntries={[]}
            />
        );

        const outputTab =
            screen.getByRole(
                'tab',
                {
                    name: 'Saída'
                }
            );

        const serialTab =
            screen.getByRole(
                'tab',
                {
                    name: 'Monitor Serial'
                }
            );

        expect(outputTab)
            .toHaveAttribute(
                'aria-selected',
                'true'
            );

        expect(serialTab)
            .toHaveAttribute(
                'aria-selected',
                'false'
            );

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Saída do envio'
                }
            )
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Monitor Serial'
                }
            )
        ).not.toBeInTheDocument();

        fireEvent.click(outputTab);

        expect(
            screen.getByRole(
                'region',
                {
                    name: 'Saída do envio'
                }
            )
        ).toBeInTheDocument();

        fireEvent.click(serialTab);

        expect(serialTab)
            .toHaveAttribute(
                'aria-selected',
                'true'
            );

        expect(outputTab)
            .toHaveAttribute(
                'aria-selected',
                'false'
            );

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Saída do envio'
                }
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole(
                'region',
                {
                    name: 'Monitor Serial'
                }
            )
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name:
                        'Recolher painel inferior'
                }
            )
        );

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Monitor Serial'
                }
            )
        ).not.toBeInTheDocument();

        expect(
            screen.getByRole(
                'button',
                {
                    name:
                        'Expandir painel inferior'
                }
            )
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole(
                'button',
                {
                    name:
                        'Expandir painel inferior'
                }
            )
        );

        expect(
            screen.getByRole(
                'region',
                {
                    name: 'Monitor Serial'
                }
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole(
                'button',
                {
                    name:
                        'Recolher painel inferior'
                }
            )
        ).toBeInTheDocument();
    });
});
