import React from 'react';
import {render, screen} from '@testing-library/react';

import HardwareControls from '../../../src/components/hardware-controls/hardware-controls.jsx';

describe('HardwareControls Stage restore state', () => {
    test('shows Stage preparation as a disabled working state', () => {
        render(
            <HardwareControls
                connectionState="restoring"
                onConnect={jest.fn()}
                onDisconnect={jest.fn()}
                onSelectBoard={jest.fn()}
                selectedBoard={null}
            />
        );

        const button =
            screen.getByRole(
                'button',
                {
                    name:
                        'Preparando Modo Palco...'
                }
            );

        expect(button.disabled)
            .toBe(true);
    });
});
