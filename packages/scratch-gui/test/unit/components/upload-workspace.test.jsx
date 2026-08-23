import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import UploadWorkspace from '../../../src/components/upload-workspace/upload-workspace';

describe('UploadWorkspace', () => {
    test('shows the generated C++ in a read-only preview', () => {
        render(
            <UploadWorkspace
                code="void setup() {}"
                error={null}
            />
        );

        const codeField = screen.getByRole('textbox', {
            name: 'Código C++ gerado'
        });

        expect(codeField).toHaveValue('void setup() {}');
        expect(codeField).toHaveAttribute('readonly');
    });

    test('shows the Serial Monitor collapsed by default', () => {
        render(
            <UploadWorkspace
                code="void setup() {}"
                error={null}
            />
        );

        expect(
            screen.getByRole('button', {
                name: 'Monitor Serial'
            })
        ).toHaveAttribute('aria-expanded', 'false');

        expect(
            screen.queryByRole('region', {
                name: 'Monitor Serial'
            })
        ).not.toBeInTheDocument();
    });

    test('expands and collapses the Serial Monitor', () => {
        render(
            <UploadWorkspace
                code="void setup() {}"
                error={null}
            />
        );

        const serialButton = screen.getByRole('button', {
            name: 'Monitor Serial'
        });

        fireEvent.click(serialButton);

        expect(serialButton).toHaveAttribute(
            'aria-expanded',
            'true'
        );

        expect(
            screen.getByRole('region', {
                name: 'Monitor Serial'
            })
        ).toBeInTheDocument();

        fireEvent.click(serialButton);

        expect(serialButton).toHaveAttribute(
            'aria-expanded',
            'false'
        );
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
            screen.queryByRole('textbox', {
                name: 'Código C++ gerado'
            })
        ).not.toBeInTheDocument();
    });
});
