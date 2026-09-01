import React from 'react';
import {
    render,
    screen
} from '@testing-library/react';
import '@testing-library/jest-dom';

import HardwareControls from '../../../src/components/hardware-controls/hardware-controls';

jest.mock(
    '../../../src/components/confirmation-prompt/confirmation-prompt.jsx',
    () => () => null
);

describe(
    'HardwareControls Upload state',
    () => {
        test('shows an inaccessible-to-click working state while the board is being programmed', () => {
            const onConnect =
                jest.fn();

            render(
                <HardwareControls
                    connectionState="uploading"
                    onConnect={onConnect}
                    onDisconnect={jest.fn()}
                    onSelectBoard={jest.fn()}
                    selectedBoard={null}
                />
            );

            const connectionButton =
                screen.getByRole(
                    'button',
                    {
                        name:
                            'Enviando programa...'
                    }
                );

            expect(connectionButton)
                .toBeDisabled();

            expect(onConnect)
                .not.toHaveBeenCalled();
        });
    }
);
