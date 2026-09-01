import React from 'react';
import {
    fireEvent,
    render
} from '@testing-library/react';

import UploadWorkspace
    from '../../../src/components/upload-workspace/upload-workspace';

describe('UploadWorkspace Serial Monitor', () => {
    test('shows decoded Serial Monitor output and allows clearing it', () => {
        const handleClear = jest.fn();

        const {
            getByRole,
            getByTestId,
            getByText
        } = render(
            <UploadWorkspace
                boardName="Arduino UNO"
                code={'void setup() {}\nvoid loop() {}\n'}
                onClearSerialMonitor={handleClear}
                serialMonitorBaudRate={9600}
                serialMonitorState="connected"
                serialMonitorText={'Olá\n27\n'}
            />
        );

        fireEvent.click(
            getByRole('tab', {
                name: 'Monitor Serial'
            })
        );

        expect(
            getByText(
                'Monitor Serial conectado em 9600 baud.'
            )
        ).toBeTruthy();

        expect(
            getByTestId('serial-monitor-output')
                .textContent
        ).toBe('Olá\n27\n');

        fireEvent.click(
            getByRole('button', {
                name: 'Limpar Monitor Serial'
            })
        );

        expect(handleClear).toHaveBeenCalledTimes(1);
    });

    test('explains when the Upload program does not initialize Serial', () => {
        const {
            getByRole,
            getByText
        } = render(
            <UploadWorkspace
                boardName="Arduino UNO"
                code={'void setup() {}\nvoid loop() {}\n'}
                serialMonitorState="unavailable"
            />
        );

        fireEvent.click(
            getByRole('tab', {
                name: 'Monitor Serial'
            })
        );

        expect(
            getByText(
                'Este programa não inicializa a comunicação Serial.'
            )
        ).toBeTruthy();
    });
});
