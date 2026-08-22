import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';

import ProgramModeSelector from '../../../src/components/program-mode-selector/program-mode-selector';

describe('ProgramModeSelector', () => {
    test('renders Stage and Upload modes with Stage selected', () => {
        render(
            <ProgramModeSelector
                mode="stage"
                onModeChange={jest.fn()}
            />
        );

        const stageButton = screen.getByRole('button', {
            name: 'Palco'
        });

        const uploadButton = screen.getByRole('button', {
            name: 'Carregar'
        });

        expect(stageButton).toBeInTheDocument();
        expect(uploadButton).toBeInTheDocument();

        expect(stageButton).toHaveAttribute(
            'aria-pressed',
            'true'
        );

        expect(uploadButton).toHaveAttribute(
            'aria-pressed',
            'false'
        );
    });

    test('requests Upload mode when Upload is clicked', () => {
        const onModeChange = jest.fn();

        render(
            <ProgramModeSelector
                mode="stage"
                onModeChange={onModeChange}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Carregar'
            })
        );

        expect(onModeChange).toHaveBeenCalledTimes(1);
        expect(onModeChange).toHaveBeenCalledWith('upload');
    });

    test('renders Upload mode as selected when requested', () => {
        render(
            <ProgramModeSelector
                mode="upload"
                onModeChange={jest.fn()}
            />
        );

        const stageButton = screen.getByRole('button', {
            name: 'Palco'
        });

        const uploadButton = screen.getByRole('button', {
            name: 'Carregar'
        });

        expect(stageButton).toHaveAttribute(
            'aria-pressed',
            'false'
        );

        expect(uploadButton).toHaveAttribute(
            'aria-pressed',
            'true'
        );
    });

    test('requests Stage mode when Stage is clicked', () => {
        const onModeChange = jest.fn();

        render(
            <ProgramModeSelector
                mode="upload"
                onModeChange={onModeChange}
            />
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Palco'
            })
        );

        expect(onModeChange).toHaveBeenCalledTimes(1);
        expect(onModeChange).toHaveBeenCalledWith('stage');
    });
});
