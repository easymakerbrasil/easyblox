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
        extensionId: 'microbit',
        helpLink: 'https://scratch.mit.edu/microbit'
    },
    {
        extensionId: 'gdxfor',
        helpLink: 'https://scratch.mit.edu/vernier'
    },
    {
        extensionId: 'testSerialWeb',
        useAutoScan: false,
        connectionTransport: 'serial'
    },
    {
        extensionId: 'testSerialDesktop',
        useAutoScan: true,
        connectionTransport: 'serial'
    },
    {
        extensionId: 'testBluetooth',
        useAutoScan: false,
        connectionTransport: 'bluetooth'
    }
]));

import React from 'react';
import configureStore from 'redux-mock-store';
import VM from '@scratch/scratch-vm';
import {render} from '@testing-library/react';

import ConnectionModal, {
    getConnectionTransportIconKind
} from '../../../src/containers/connection-modal.jsx';
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
        return ConnectionModalComponent.mock.calls.at(-1)[0];
    };

    test('uses auto-scanning flow for serial connections on web', () => {
        const props = renderConnectionModal('testSerialWeb', PLATFORM.WEB);
        expect(props.useAutoScan).toEqual(true);
    });

    test('uses list scanning flow for serial connections on desktop', () => {
        const props = renderConnectionModal('testSerialDesktop', PLATFORM.DESKTOP);
        expect(props.useAutoScan).toEqual(false);
    });
    test('keeps Web help, including simulated Desktop without a bridge', () => {
        const open = jest.spyOn(window, 'open').mockImplementation(() => null);
        try {
            const props = renderConnectionModal('microbit', PLATFORM.WEB);
            props.onHelp();
            expect(open).toHaveBeenCalledWith('https://scratch.mit.edu/microbit', '_blank');
            renderConnectionModal('gdxfor', PLATFORM.DESKTOP).onHelp();
            expect(open).toHaveBeenCalledWith('https://scratch.mit.edu/vernier', '_blank');
        } finally {
            open.mockRestore();
        }
    });
    test('removes legacy help only when the real Desktop bridge is available', () => {
        const getAppInfo = jest.fn();
        window.easybloxDesktop = {getAppInfo};
        try {
            expect(renderConnectionModal('gdxfor', PLATFORM.WEB).onHelp).toBeNull();
            expect(getAppInfo).not.toHaveBeenCalled();
        } finally {
            delete window.easybloxDesktop;
        }
    });
    test.each([
        [
            'serial',
            'usb'
        ],
        [
            'bluetooth',
            'bluetooth'
        ]
    ])(
        'uses %s connection transport indicator',
        (
            connectionTransport,
            expectedIconKind
        ) => {
            expect(
                getConnectionTransportIconKind(
                    connectionTransport
                )
            ).toEqual(
                expectedIconKind
            );
        }
    );
});
