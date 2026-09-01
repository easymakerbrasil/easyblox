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

    test('keeps the Serial Monitor collapsed by default and allows expanding and collapsing it', () => {
        render(
            <UploadWorkspace
                code={GENERATED_CODE}
                error={null}
            />
        );

        const serialButton = screen.getByRole(
            'button',
            {
                name: 'Monitor Serial'
            }
        );

        expect(serialButton)
            .toHaveAttribute(
                'aria-expanded',
                'false'
            );

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Monitor Serial'
                }
            )
        ).not.toBeInTheDocument();

        fireEvent.click(serialButton);

        expect(serialButton)
            .toHaveAttribute(
                'aria-expanded',
                'true'
            );

        expect(
            screen.getByRole(
                'region',
                {
                    name: 'Monitor Serial'
                }
            )
        ).toBeInTheDocument();

        fireEvent.click(serialButton);

        expect(serialButton)
            .toHaveAttribute(
                'aria-expanded',
                'false'
            );

        expect(
            screen.queryByRole(
                'region',
                {
                    name: 'Monitor Serial'
                }
            )
        ).not.toBeInTheDocument();
    });
});
