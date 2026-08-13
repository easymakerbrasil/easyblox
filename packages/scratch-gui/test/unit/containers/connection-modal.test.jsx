jest.mock('../../../src/lib/microbit-update', () => ({
    isMicroBitUpdateSupported: jest.fn(() => false),
    selectAndUpdateMicroBit: jest.fn()
}));

jest.mock('../../../src/components/connection-modal/connection-modal.jsx', () => ({
    __esModule: true,
    default: jest.fn(() => null),
    PHASES: {
        scanning: 'scanning',
        connecting: 'connecting',
        connected: 'connected',
        error: 'error',
        unavailable: 'unavailable',
        updatePeripheral: 'updatePeripheral'
    }
}));

jest.mock('../../../src/lib/libraries/extensions/index.jsx', () => ([
    {
        extensionId: 'testSerialWeb',
        useAutoScan: false,
        connectionTransport: 'serial'
    },
    {
        extensionId: 'testSerialDesktop',
        useAutoScan: true,
        connectionTransport: 'serial'
    }
]));

import React from 'react';
import configureStore from 'redux-mock-store';
import VM from '@scratch/scratch-vm';
import {render} from '@testing-library/react';

import ConnectionModal from '../../../src/containers/connection-modal.jsx';
import ConnectionModalComponent from '../../../src/components/connection-modal/connection-modal.jsx';
import {PLATFORM} from '../../../src/lib/platform';

describe('ConnectionModal container', () => {
    const mockStore = configureStore();

    beforeEach(() => {
        ConnectionModalComponent.mockClear();
    });

    const renderConnectionModal = (extensionId, platform) => {
        const vm = new VM();
        const store = mockStore({
            scratchGui: {
                connectionModal: {extensionId},
                platform: {platform}
            }
        });
        render(
            <ConnectionModal
                store={store}
                vm={vm}
            />
        );
        return ConnectionModalComponent.mock.calls[0][0];
    };

    test('uses auto-scanning flow for serial connections on web', () => {
        const props = renderConnectionModal('testSerialWeb', PLATFORM.WEB);
        expect(props.useAutoScan).toEqual(true);
    });

    test('uses list scanning flow for serial connections on desktop', () => {
        const props = renderConnectionModal('testSerialDesktop', PLATFORM.DESKTOP);
        expect(props.useAutoScan).toEqual(false);
    });
});
