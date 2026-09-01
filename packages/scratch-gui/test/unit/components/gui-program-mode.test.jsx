import React from 'react';
import '@testing-library/jest-dom';

import {fireEvent} from '@testing-library/react';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {GUIComponent} from '../../../src/components/gui/gui.jsx';

jest.mock('@scratch/scratch-render', () => ({
    isSupported: jest.fn().mockReturnValue(true)
}));

jest.mock('react-responsive', () => ({
    __esModule: true,
    default: ({children}) => children(true)
}));

jest.mock('react-tabs', () => ({
    Tab: ({children}) => <div>{children}</div>,
    Tabs: ({children}) => <div>{children}</div>,
    TabList: ({children}) => <div>{children}</div>,
    TabPanel: ({children}) => <div>{children}</div>
}));

jest.mock('../../../src/components/box/box.jsx', () => (
    ({children}) => <div>{children}</div>
));

jest.mock('../../../src/contexts/modal-focus-context.jsx', () => ({
    ModalFocusProvider: ({children}) => <div>{children}</div>
}));

jest.mock('../../../src/components/menu-bar/menu-bar.jsx', () => (
    ({onProgramModeChange}) => (
        <div>
            <button
                data-testid="request-upload-mode"
                onClick={() => onProgramModeChange('upload')}
            >
                Upload
            </button>
            <button
                data-testid="request-stage-mode"
                onClick={() => onProgramModeChange('stage')}
            >
                Stage
            </button>
        </div>
    )
));

jest.mock('../../../src/components/board-selection-modal/board-selection-modal.jsx', () => (
    ({onConfirm}) => (
        <button
            data-testid="confirm-arduino-uno"
            onClick={() => onConfirm('arduino-uno')}
        >
            Arduino UNO
        </button>
    )
));

jest.mock('../../../src/containers/blocks.jsx', () => (
    ({programMode}) => (
        <div
            data-testid="blocks"
            data-program-mode={programMode || ''}
        />
    )
));
jest.mock('../../../src/containers/costume-tab.jsx', () => () => null);
jest.mock('../../../src/containers/connection-modal.jsx', () => () => null);
jest.mock('../../../src/containers/drag-layer.jsx', () => () => null);
jest.mock('../../../src/containers/stage-wrapper.jsx', () => (
    ({children}) => <div>{children}</div>
));

jest.mock('../../../src/containers/target-pane.jsx', () => () => null);
jest.mock('../../../src/components/extension-button/extension-button.jsx', () => () => null);
jest.mock('../../../src/containers/watermark.jsx', () => () => null);
jest.mock('../../../src/components/debug-modal/debug-modal.jsx', () => () => null);

describe('GUI program mode propagation', () => {

    test('synchronizes Stage and Upload program contexts with the VM', () => {
        const contextAndRefreshCalls = [];

        const setProgramContext = jest.fn((mode, boardId) => {
            contextAndRefreshCalls.push([
                'context',
                mode,
                boardId
            ]);
        });

        const refreshWorkspace = jest.fn(() => {
            contextAndRefreshCalls.push([
                'refresh'
            ]);
        });

        const vm = {
            generateArduinoUnoUploadCode: jest.fn().mockReturnValue(''),
            getPeripheralIsConnected: jest.fn().mockReturnValue(false),
            on: jest.fn(),
            removeListener: jest.fn(),
            setProgramContext,
            refreshWorkspace
        };

        const {
            getByRole,
            getByTestId
        } = renderWithIntl(
            <GUIComponent
                colorMode="default"
                setTheme={jest.fn()}
                theme="default"
                vm={vm}
            />
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute('data-program-mode', 'stage');

        expect(setProgramContext)
            .toHaveBeenLastCalledWith(
                'stage',
                null
            );

        expect(refreshWorkspace)
            .toHaveBeenCalledTimes(1);

        expect(contextAndRefreshCalls)
            .toEqual([
                [
                    'context',
                    'stage',
                    null
                ],
                [
                    'refresh'
                ]
            ]);

        fireEvent.click(
            getByTestId('request-upload-mode')
        );

        fireEvent.click(
            getByTestId('confirm-arduino-uno')
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute('data-program-mode', 'upload');

        expect(
            getByRole(
                'button',
                {
                    name: 'Enviar para Arduino UNO'
                }
            )
        ).toBeDisabled();

        expect(setProgramContext)
            .toHaveBeenLastCalledWith(
                'upload',
                'arduino-uno'
            );
        expect(refreshWorkspace)
            .toHaveBeenCalledTimes(2);

        expect(contextAndRefreshCalls.slice(-2))
            .toEqual([
                [
                    'context',
                    'upload',
                    'arduino-uno'
                ],
                [
                    'refresh'
                ]
            ]);

        fireEvent.click(
            getByTestId('request-stage-mode')
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute('data-program-mode', 'stage');

        expect(setProgramContext)
            .toHaveBeenLastCalledWith(
                'stage',
                null
            );
        expect(refreshWorkspace)
            .toHaveBeenCalledTimes(3);

        expect(contextAndRefreshCalls.slice(-2))
            .toEqual([
                [
                    'context',
                    'stage',
                    null
                ],
                [
                    'refresh'
                ]
            ]);
    });

    test('passes the initial stage program mode to Blocks', () => {
        const {getByTestId} = renderWithIntl(
            <GUIComponent
                colorMode="default"
                menuBarHidden
                setTheme={jest.fn()}
                theme="default"
                vm={{
                    setProgramContext: jest.fn(),
                    refreshWorkspace: jest.fn()
                }}
            />
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute('data-program-mode', 'stage');
    });
});
