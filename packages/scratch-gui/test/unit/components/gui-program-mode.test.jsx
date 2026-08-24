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
        <button
            data-testid="request-upload-mode"
            onClick={() => onProgramModeChange('upload')}
        >
            Upload
        </button>
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

    test('passes upload program mode to Blocks after selecting Arduino UNO', () => {
        const vm = {
            generateArduinoUnoUploadCode: jest.fn().mockReturnValue(''),
            getPeripheralIsConnected: jest.fn().mockReturnValue(false),
            on: jest.fn(),
            removeListener: jest.fn()
        };

        const {getByTestId} = renderWithIntl(
            <GUIComponent
                colorMode="default"
                setTheme={jest.fn()}
                theme="default"
                vm={vm}
            />
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute('data-program-mode', 'stage');

        fireEvent.click(
            getByTestId('request-upload-mode')
        );

        fireEvent.click(
            getByTestId('confirm-arduino-uno')
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute('data-program-mode', 'upload');
    });

    test('passes the initial stage program mode to Blocks', () => {
        const {getByTestId} = renderWithIntl(
            <GUIComponent
                colorMode="default"
                menuBarHidden
                setTheme={jest.fn()}
                theme="default"
                vm={{}}
            />
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute('data-program-mode', 'stage');
    });
});
