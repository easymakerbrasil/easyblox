import React from 'react';
import '@testing-library/jest-dom';

import {act, fireEvent} from '@testing-library/react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import alertsReducer from '../../../src/reducers/alerts';
import {
    showStagePreparationAlert,
    clearStagePreparationAlerts
} from '../../../src/lib/easyblox-stage-preparation-alerts';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {GUIComponent} from '../../../src/components/gui/gui.jsx';
import MockHardwareControls from '../../../src/components/hardware-controls/hardware-controls.jsx';

import {
    runEasyBloxStageFirmwareRestore
} from '../../../src/lib/easyblox-stage-firmware-workflow';

import {
    runEasyBloxUpload
} from '../../../src/lib/easyblox-upload-workflow';

jest.mock('@scratch/scratch-render', () => ({
    isSupported: jest.fn().mockReturnValue(true)
}));

jest.mock('../../../src/lib/easyblox-stage-firmware-workflow', () => ({
    runEasyBloxStageFirmwareRestore: jest.fn()
}));

jest.mock('../../../src/lib/easyblox-upload-workflow', () => ({
    runEasyBloxUpload: jest.fn()
}));

jest.mock('react-responsive', () => ({
    __esModule: true,
    default: ({children}) => children(true)
}));

jest.mock('react-tabs', () => ({
    Tab: ({children}) => (
        <div data-testid="editor-tab">
            {children}
        </div>
    ),
    Tabs: ({children, selectedIndex}) => (
        <div
            data-selected-index={selectedIndex}
            data-testid="editor-tabs"
        >
            {children}
        </div>
    ),
    TabList: ({children}) => <div>{children}</div>,
    TabPanel: ({children}) => (
        <div data-testid="editor-tab-panel">
            {children}
        </div>
    )
}));

jest.mock('../../../src/components/box/box.jsx', () => (
    ({children}) => <div>{children}</div>
));

jest.mock('../../../src/contexts/modal-focus-context.jsx', () => ({
    ModalFocusProvider: ({children}) => <div>{children}</div>
}));

jest.mock('../../../src/components/menu-bar/menu-bar.jsx', () => (
    ({
        connectionState,
        onPrepareStageFirmware,
        onProgramModeChange,
        onSelectBoard,
        selectedBoard,
        onStartSelectingExternalProjectImport,
        stageFirmwareIssue
    }) => (
        <div
            data-connection-state={
                connectionState || ''
            }
            data-stage-firmware-issue={
                stageFirmwareIssue || ''
            }
            data-testid="menu-bar-state"
        >
            <button
                data-testid="select-board"
                onClick={onSelectBoard}
            >Select board</button>
            <MockHardwareControls
                connectionState={connectionState}
                onPrepareStageFirmware={onPrepareStageFirmware}
                onSelectBoard={onSelectBoard}
                selectedBoard={selectedBoard}
                stageFirmwareIssue={stageFirmwareIssue}
            />
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

            <button
                data-testid="prepare-stage-firmware"
                disabled={!onPrepareStageFirmware}
                onClick={onPrepareStageFirmware}
            >
                Prepare Stage
            </button>
            <button
                data-testid="import-external-project"
                disabled={!onStartSelectingExternalProjectImport}
                onClick={onStartSelectingExternalProjectImport}
            >
                Import Project
            </button>
        </div>
    )
));

jest.mock('../../../src/components/board-selection-modal/board-selection-modal.jsx', () => (
    ({onConfirm, onRemove, onCancel}) => {
        const {useCallback} = require('react');
        const handleEasyMakerConfirm = useCallback(() => onConfirm('easymaker'), [onConfirm]);
        return (
            <div>
                <button
                    data-testid="remove-board"
                    onClick={onRemove}
                >Remove board</button>
                <button
                    data-testid="cancel-board"
                    onClick={onCancel}
                >Cancel</button>
                <button
                    data-testid="confirm-easymaker"
                    onClick={handleEasyMakerConfirm}
                >EasyMaker</button>
                <button
                    data-testid="confirm-arduino-uno"
                    onClick={() => onConfirm('arduino-uno')}
                >
                    Arduino UNO
                </button>

                <button
                    data-testid="confirm-easyduino-proto"
                    onClick={() => onConfirm('easyduino-proto')}
                >
                    EasyDuino Proto
                </button>
            </div>
        );
    }
));

jest.mock('../../../src/containers/blocks.jsx', () => (
    ({programMode}) => (
        <div
            data-testid="blocks"
            data-program-mode={programMode || ''}
        />
    )
));
jest.mock('../../../src/containers/easyconect-desktop-window.jsx', () => () => null);
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
jest.mock('../../../src/containers/sb3-downloader.jsx', () => (
    ({children}) => children(null, jest.fn())
));

describe('GUI Stage preparation presentation', () => {
    const setup = function () {
        const handlers = new Map();
        const store = createStore((state, action) => (
            {scratchGui: {alerts: alertsReducer(state?.scratchGui.alerts, action)}}
        ));
        const vm = {
            generateArduinoUnoUploadCode: jest.fn().mockReturnValue(''),
            getPeripheralIsConnected: jest.fn().mockReturnValue(false),
            getPeripheralIsStageConnected: jest.fn().mockReturnValue(false),
            disconnectPeripheral: jest.fn(),
            getEasyBloxProjectContext: () => ({selectedBoardId: 'arduino-uno', programMode: 'stage'}),
            on: jest.fn((event, handler) => {
                handlers.set(event, handler);
                if (event === 'PROJECT_LOADED') handler();
            }),
            removeListener: jest.fn(),
            setEasyBloxSelectedBoard: jest.fn(),
            setProgramContext: jest.fn(),
            refreshWorkspace: jest.fn()
        };
        const attempts = [];
        const restore = function (options) {
            const captureResolve = function (resolve) {
                attempts.push({options, resolve});
            };
            return new Promise(captureResolve);
        };
        runEasyBloxStageFirmwareRestore.mockImplementation(restore);
        const show = function (status) {
            return showStagePreparationAlert(store.dispatch, status);
        };
        const clear = function (scopeId) {
            clearStagePreparationAlerts(store.dispatch, scopeId);
        };
        const onShow = jest.fn(show);
        const onClear = jest.fn(clear);
        const view = renderWithIntl(
            <Provider store={store}>
                <GUIComponent
                    alertsVisible
                    colorMode="default"
                    onClearStagePreparationAlerts={onClear}
                    onRequestCloseDebugModal={jest.fn()}
                    onShowStagePreparationAlert={onShow}
                    setTheme={jest.fn()}
                    theme="default"
                    vm={vm}
                />
            </Provider>
        );
        const start = function () {
            fireEvent.click(view.getByTestId('prepare-stage-firmware'));
            return attempts[attempts.length - 1];
        };
        const emit = function (attempt, state, code = null) {
            const messages = {
                'restoring-stage': 'Preparando a placa para o Modo Palco...',
                'reconnecting-stage': 'Restaurando a comunicação com a placa...',
                'stage-ready': 'Placa pronta no Modo Palco.',
                'error': 'A placa não foi encontrada. Verifique o cabo USB e tente novamente.'
            };
            const status = {state, code, message: messages[state]};
            act(() => attempt.options.onStatus(status));
            return status;
        };
        const finish = async function (attempt) {
            await act(async () => {
                attempt.resolve({portHint: {}, peripheralId: 'serial-1'});
                await Promise.resolve();
            });
        };
        return {...view, store, onShow, handlers, attempts, start, emit, finish};
    };

    test('preserves full status and replaces progress, persistent error and success', async () => {
        const view = setup();
        const attempt = view.start();
        const status = view.emit(attempt, 'restoring-stage');
        expect(view.onShow).toHaveBeenLastCalledWith(expect.objectContaining(status));
        expect(view.getByRole('status')).toHaveTextContent(status.message);
        view.emit(attempt, 'reconnecting-stage');
        expect(view.getAllByRole('status')).toHaveLength(1);
        const error = view.emit(attempt, 'error', 'PORT_NOT_FOUND');
        expect(view.onShow).toHaveBeenLastCalledWith(expect.objectContaining(error));
        expect(view.getByRole('alert')).toHaveTextContent(error.message);
        expect(view.getByTestId('menu-bar-state')).toHaveAttribute('data-stage-firmware-issue', '');
        await view.finish(attempt);
        const next = view.start();
        expect(view.queryByRole('alert')).toBeNull();
        view.emit(next, 'restoring-stage');
        view.emit(next, 'error', 'PORT_NOT_FOUND');
        view.emit(next, 'stage-ready');
        expect(view.queryByRole('alert')).toBeNull();
        expect(view.getByRole('status')).toHaveTextContent('Placa pronta no Modo Palco.');
        await view.finish(next);
    });

    test('ignores callbacks from a completed previous attempt and keeps the new progress', async () => {
        const view = setup();
        const old = view.start();
        view.emit(old, 'error', 'PORT_NOT_FOUND');
        await view.finish(old);
        const next = view.start();
        view.emit(next, 'restoring-stage');
        const count = view.onShow.mock.calls.length;
        view.emit(old, 'error', 'UPLOAD_FAILED');
        expect(view.onShow).toHaveBeenCalledTimes(count);
        expect(view.getByRole('status')).toHaveTextContent('Preparando a placa');
        await view.finish(next);
    });

    const checkContextChange = async function (action) {
        const view = setup();
        const attempt = view.start();
        view.emit(attempt, 'restoring-stage');
        if (action === 'change' || action === 'remove') {
            fireEvent.click(view.getByTestId('select-board'));
            fireEvent.click(view.getByTestId(action === 'change' ? 'confirm-easymaker' : 'remove-board'));
        } else if (action === 'upload') {
            fireEvent.click(view.getByTestId('request-upload-mode'));
        } else {
            view.unmount();
        }
        expect(view.store.getState().scratchGui.alerts.alertsList).toHaveLength(0);
        const count = view.onShow.mock.calls.length;
        view.emit(attempt, 'error', 'PORT_NOT_FOUND');
        await view.finish(attempt);
        expect(view.onShow).toHaveBeenCalledTimes(count);
        expect(view.store.getState().scratchGui.alerts.alertsList).toHaveLength(0);
    };
    test.each(['change', 'remove', 'upload', 'unmount'])(
        'clears and ignores late status after %s', checkContextChange
    );

    test('a valid ready event clears its error, while another extension cannot clear it', async () => {
        const view = setup();
        const attempt = view.start();
        view.emit(attempt, 'error', 'STAGE_HANDSHAKE_FAILED');
        await view.finish(attempt);
        act(() => view.handlers.get('PERIPHERAL_STAGE_READY')({extensionId: 'microbit'}));
        expect(view.getByRole('alert')).toBeInTheDocument();
        act(() => view.handlers.get('PERIPHERAL_STAGE_READY')({extensionId: 'arduinoUno'}));
        expect(view.queryByRole('alert')).toBeNull();
        expect(view.getByRole('status')).toHaveTextContent('Placa pronta no Modo Palco.');
    });

    test('unmount cancels the success timer and leaves unrelated alerts intact', async () => {
        jest.useFakeTimers();
        const view = setup();
        const attempt = view.start();
        view.emit(attempt, 'stage-ready');
        await view.finish(attempt);
        expect(jest.getTimerCount()).toBeGreaterThan(0);
        view.unmount();
        expect(view.store.getState().scratchGui.alerts.alertsList).toHaveLength(0);
        expect(jest.getTimerCount()).toBe(0);
        jest.useRealTimers();
    });

    test('opening and cancelling the A4.2 modal keeps the preparation error and starts no new attempt', async () => {
        const view = setup();
        const attempt = view.start();
        view.emit(attempt, 'error', 'STAGE_HANDSHAKE_FAILED');
        await view.finish(attempt);
        act(() => view.handlers.get('PERIPHERAL_STAGE_HANDSHAKE_FAILED')({
            extensionId: 'arduinoUno', reason: 'legacy'
        }));
        fireEvent.click(view.getByRole('button', {name: 'Cancelar'}));
        expect(view.getByRole('alert')).toBeInTheDocument();
        fireEvent.click(view.getByRole('button', {name: 'Erro de conexão. Tentar novamente'}));
        expect(view.getByRole('dialog', {name: 'Preparar Modo Palco?'})).toBeInTheDocument();
        expect(view.attempts).toHaveLength(1);
        fireEvent.click(view.getByRole('button', {name: 'Cancelar'}));
        expect(view.getByRole('alert')).toBeInTheDocument();
        expect(view.attempts).toHaveLength(1);
    });
});

describe('GUI program mode propagation', () => {

    test('forwards the external project import action to the menu bar', () => {
        const onStartSelectingExternalProjectImport =
            jest.fn();

        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn()
                    .mockReturnValue(''),

            getPeripheralIsConnected:
                jest.fn()
                    .mockReturnValue(false),

            on:
                jest.fn(),

            removeListener:
                jest.fn(),

            setEasyBloxSelectedBoard:
                jest.fn(),

            setProgramContext:
                jest.fn(),

            refreshWorkspace:
                jest.fn()
        };

        const {
            getByTestId
        } = renderWithIntl(
            <GUIComponent
                colorMode="default"
                onStartSelectingExternalProjectImport={
                    onStartSelectingExternalProjectImport
                }
                setTheme={jest.fn()}
                theme="default"
                vm={vm}
            />
        );

        fireEvent.click(
            getByTestId(
                'import-external-project'
            )
        );

        expect(
            onStartSelectingExternalProjectImport
        ).toHaveBeenCalledTimes(
            1
        );
    });

    test('rejects a coming-soon board even if selection is requested programmatically', () => {
        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn()
                    .mockReturnValue(''),

            getPeripheralIsConnected:
                jest.fn()
                    .mockReturnValue(false),

            on:
                jest.fn(),

            removeListener:
                jest.fn(),

            setEasyBloxSelectedBoard:
                jest.fn(),

            setProgramContext:
                jest.fn(),

            refreshWorkspace:
                jest.fn()
        };

        const {
            getByTestId
        } = renderWithIntl(
            <GUIComponent
                colorMode="default"
                setTheme={jest.fn()}
                theme="default"
                vm={vm}
            />
        );

        fireEvent.click(
            getByTestId(
                'request-upload-mode'
            )
        );

        fireEvent.click(
            getByTestId(
                'confirm-easyduino-proto'
            )
        );

        expect(
            getByTestId(
                'blocks'
            )
        ).toHaveAttribute(
            'data-program-mode',
            'stage'
        );

        expect(
            vm.setEasyBloxSelectedBoard
        ).not.toHaveBeenCalledWith(
            'easyduino-proto'
        );

        expect(
            vm.setProgramContext
        ).toHaveBeenLastCalledWith(
            'stage',
            null
        );
    });

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
            setEasyBloxSelectedBoard: jest.fn(),
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

        expect(
            vm.setEasyBloxSelectedBoard
        ).toHaveBeenLastCalledWith(
            'arduino-uno'
        );

        expect(
            vm.setEasyBloxSelectedBoard
        ).toHaveBeenLastCalledWith(
            'arduino-uno'
        );

        expect(
            vm.setEasyBloxSelectedBoard
        ).toHaveBeenLastCalledWith(
            'arduino-uno'
        );

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

    test('restores Arduino UNO and Upload mode when an EasyBlox project finishes loading', () => {
        const setEasyBloxSelectedBoard =
            jest.fn();

        const setProgramContext =
            jest.fn();

        const refreshWorkspace =
            jest.fn();

        const getEasyBloxProjectContext =
            jest.fn().mockReturnValue({
                selectedBoardId: 'arduino-uno',
                programMode: 'upload'
            });

        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn().mockReturnValue(''),

            getPeripheralIsConnected:
                jest.fn().mockReturnValue(false),

            getEasyBloxProjectContext,

            on: jest.fn((eventName, handler) => {
                if (eventName === 'PROJECT_LOADED') {
                    handler();
                }
            }),

            removeListener: jest.fn(),

            setEasyBloxSelectedBoard,
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

        expect(vm.on)
            .toHaveBeenCalledWith(
                'PROJECT_LOADED',
                expect.any(Function)
            );

        expect(getEasyBloxProjectContext)
            .toHaveBeenCalled();

        expect(
            setEasyBloxSelectedBoard
        ).toHaveBeenLastCalledWith(
            'arduino-uno'
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute(
                'data-program-mode',
                'upload'
            );

        expect(setProgramContext)
            .toHaveBeenLastCalledWith(
                'upload',
                'arduino-uno'
            );

        expect(refreshWorkspace)
            .toHaveBeenCalled();

        expect(
            getByRole(
                'button',
                {
                    name:
                        'Enviar para Arduino UNO'
                }
            )
        ).toBeDisabled();
    });

    test('restores Arduino UNO while keeping a loaded EasyBlox project in Stage mode', () => {
        const setEasyBloxSelectedBoard =
            jest.fn();

        const setProgramContext =
            jest.fn();

        const refreshWorkspace =
            jest.fn();

        const getEasyBloxProjectContext =
            jest.fn().mockReturnValue({
                selectedBoardId: 'arduino-uno',
                programMode: 'stage'
            });

        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn().mockReturnValue(''),

            getPeripheralIsConnected:
                jest.fn().mockReturnValue(false),

            getEasyBloxProjectContext,

            on: jest.fn((eventName, handler) => {
                if (eventName === 'PROJECT_LOADED') {
                    handler();
                }
            }),

            removeListener: jest.fn(),

            setEasyBloxSelectedBoard,
            setProgramContext,
            refreshWorkspace
        };

        const {getByTestId} =
            renderWithIntl(
                <GUIComponent
                    colorMode="default"
                    menuBarHidden
                    setTheme={jest.fn()}
                    theme="default"
                    vm={vm}
                />
            );

        expect(vm.on)
            .toHaveBeenCalledWith(
                'PROJECT_LOADED',
                expect.any(Function)
            );

        expect(getEasyBloxProjectContext)
            .toHaveBeenCalled();

        expect(
            setEasyBloxSelectedBoard
        ).toHaveBeenLastCalledWith(
            'arduino-uno'
        );

        expect(getByTestId('blocks'))
            .toHaveAttribute(
                'data-program-mode',
                'stage'
            );

        expect(setProgramContext)
            .toHaveBeenLastCalledWith(
                'stage',
                null
            );

        expect(refreshWorkspace)
            .toHaveBeenCalled();
    });

    test('does not restore a coming-soon board from loaded project metadata', () => {
        const setEasyBloxSelectedBoard =
            jest.fn();

        const setProgramContext =
            jest.fn();

        const refreshWorkspace =
            jest.fn();

        const getEasyBloxProjectContext =
            jest.fn()
                .mockReturnValue({
                    selectedBoardId:
                        'easyduino-proto',

                    programMode:
                        'upload'
                });

        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn()
                    .mockReturnValue(''),

            getPeripheralIsConnected:
                jest.fn()
                    .mockReturnValue(false),

            getEasyBloxProjectContext,

            on:
                jest.fn(
                    (
                        eventName,
                        handler
                    ) => {
                        if (
                            eventName ===
                                'PROJECT_LOADED'
                        ) {
                            handler();
                        }
                    }
                ),

            removeListener:
                jest.fn(),

            setEasyBloxSelectedBoard,

            setProgramContext,

            refreshWorkspace
        };

        const {
            getByTestId
        } = renderWithIntl(
            <GUIComponent
                colorMode="default"
                menuBarHidden
                setTheme={jest.fn()}
                theme="default"
                vm={vm}
            />
        );

        expect(
            getEasyBloxProjectContext
        ).toHaveBeenCalled();

        expect(
            setEasyBloxSelectedBoard
        ).toHaveBeenLastCalledWith(
            null
        );

        expect(
            getByTestId(
                'blocks'
            )
        ).toHaveAttribute(
            'data-program-mode',
            'stage'
        );

        expect(
            setProgramContext
        ).toHaveBeenLastCalledWith(
            'stage',
            null
        );

        expect(
            refreshWorkspace
        ).toHaveBeenCalled();
    });

    test.each([
        [
            'legacy',
            null
        ],
        [
            'incompatible',
            2
        ],
        [
            'unidentified',
            null
        ]
    ])(
        'does not automatically restore Stage firmware after a %s handshake failure',
        async (
            reason,
            firmwareCompatibilityVersion
        ) => {
            const handlers = {};

            runEasyBloxStageFirmwareRestore
                .mockClear();

            runEasyBloxStageFirmwareRestore
                .mockResolvedValue({
                    portHint: null,
                    peripheralId:
                        'web-serial-1'
                });

            const vm = {
                generateArduinoUnoUploadCode:
                    jest.fn().mockReturnValue(''),

                getPeripheralIsConnected:
                    jest.fn().mockReturnValue(false),

                getEasyBloxProjectContext:
                    jest.fn().mockReturnValue({
                        selectedBoardId:
                            'arduino-uno',
                        programMode:
                            'stage'
                    }),

                on: jest.fn(
                    (
                        eventName,
                        handler
                    ) => {
                        handlers[eventName] =
                            handler;

                        if (
                            eventName ===
                            'PROJECT_LOADED'
                        ) {
                            handler();
                        }
                    }
                ),

                removeListener:
                    jest.fn(),

                setEasyBloxSelectedBoard:
                    jest.fn(),

                setProgramContext:
                    jest.fn(),

                refreshWorkspace:
                    jest.fn()
            };

            const {unmount} =
                renderWithIntl(
                    <GUIComponent
                        colorMode="default"
                        menuBarHidden
                        setTheme={jest.fn()}
                        theme="default"
                        vm={vm}
                    />
                );

            expect(
                handlers
                    .PERIPHERAL_STAGE_HANDSHAKE_FAILED
            ).toEqual(
                expect.any(Function)
            );

            await act(async () => {
                handlers
                    .PERIPHERAL_STAGE_HANDSHAKE_FAILED({
                        extensionId:
                            'arduinoUno',
                        reason,
                        firmwareCompatibilityVersion,
                        expectedFirmwareCompatibilityVersion:
                            1
                    });

                await Promise.resolve();
            });

            expect(
                runEasyBloxStageFirmwareRestore
            ).not.toHaveBeenCalled();

            unmount();
        }
    );

    test('automatically restores Stage after an EasyBlox Upload when returning to Stage', async () => {
        const handlers = {};
        const onShowStagePreparationAlert = jest.fn();

        runEasyBloxUpload
            .mockClear();

        runEasyBloxStageFirmwareRestore
            .mockClear();

        runEasyBloxUpload
            .mockImplementation(
                async ({onStatus}) => {
                    onStatus({
                        state: 'success',
                        message:
                            'Programa enviado para Arduino UNO.'
                    });

                    return {
                        portHint: null,
                        peripheralId:
                            'web-serial-1'
                    };
                }
            );

        runEasyBloxStageFirmwareRestore
            .mockResolvedValue({
                portHint: null,
                peripheralId:
                    'web-serial-1'
            });

        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn().mockReturnValue(
                    [
                        'void setup() {',
                        '}',
                        '',
                        'void loop() {',
                        '}'
                    ].join('\n')
                ),

            generateArduinoUnoUploadBuildBundle:
                jest.fn().mockReturnValue({
                    code:
                        [
                            'void setup() {',
                            '}',
                            '',
                            'void loop() {',
                            '}'
                        ].join('\n'),
                    supportFiles: [
                        {
                            name:
                                'EasyBlox.h',
                            content:
                                '#pragma once\n'
                        }
                    ]
                }),

            getPeripheralIsConnected:
                jest.fn().mockReturnValue(true),

            getPeripheralConnectionInfo:
                jest.fn().mockReturnValue({
                    peripheralId:
                        'web-serial-1'
                }),

            getEasyBloxProjectContext:
                jest.fn().mockReturnValue({
                    selectedBoardId:
                        'arduino-uno',
                    programMode:
                        'upload'
                }),

            on: jest.fn(
                (
                    eventName,
                    handler
                ) => {
                    handlers[eventName] =
                        handler;

                    if (
                        eventName ===
                        'PROJECT_LOADED'
                    ) {
                        handler();
                    }
                }
            ),

            removeListener:
                jest.fn(),

            setEasyBloxSelectedBoard:
                jest.fn(),

            setProgramContext:
                jest.fn(),

            refreshWorkspace:
                jest.fn()
        };

        const {
            getByRole,
            getByTestId
        } = renderWithIntl(
            <GUIComponent
                colorMode="default"
                onShowStagePreparationAlert={onShowStagePreparationAlert}
                setTheme={jest.fn()}
                theme="default"
                vm={vm}
            />
        );

        await act(async () => {
            fireEvent.click(
                getByRole(
                    'button',
                    {
                        name:
                            'Enviar para Arduino UNO'
                    }
                )
            );

            await Promise.resolve();
        });

        expect(runEasyBloxUpload)
            .toHaveBeenCalledTimes(1);

        expect(
            vm.generateArduinoUnoUploadBuildBundle
        ).toHaveBeenCalledTimes(1);

        expect(
            vm.generateArduinoUnoUploadBuildBundle
        ).toHaveBeenCalledWith(
            'arduino-uno'
        );

        expect(runEasyBloxUpload)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    boardId:
                        'arduino-uno',
                    code:
                        [
                            'void setup() {',
                            '}',
                            '',
                            'void loop() {',
                            '}'
                        ].join('\n'),
                    supportFiles: [
                        {
                            name:
                                'EasyBlox.h',
                            content:
                                '#pragma once\n'
                        }
                    ]
                })
            );

        expect(
            runEasyBloxStageFirmwareRestore
        ).not.toHaveBeenCalled();

        await act(async () => {
            fireEvent.click(
                getByTestId(
                    'request-stage-mode'
                )
            );

            await Promise.resolve();
        });

        expect(
            runEasyBloxStageFirmwareRestore
        ).toHaveBeenCalledTimes(1);

        expect(
            runEasyBloxStageFirmwareRestore
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                boardId:
                    'arduino-uno'
            })
        );
        // The automatic operation uses the same status callback as manual preparation.
        const {onStatus} = runEasyBloxStageFirmwareRestore.mock.calls[0][0];
        const statuses = [
            {state: 'restoring-stage', message: 'Preparando a placa para o Modo Palco...'},
            {state: 'reconnecting-stage', message: 'Restaurando a comunicação com a placa...'},
            {state: 'error', code: 'UPLOAD_FAILED', message: 'Não foi possível preparar a placa para o Modo Palco.'},
            {state: 'stage-ready', message: 'Placa pronta no Modo Palco.'}
        ];
        for (const status of statuses) {
            act(() => onStatus(status));
            expect(onShowStagePreparationAlert).toHaveBeenLastCalledWith(expect.objectContaining(status));
        }
    });

    test('tracks Stage firmware diagnosis and only restores after explicit user action', async () => {
        const handlers = {};

        runEasyBloxStageFirmwareRestore
            .mockClear();

        runEasyBloxStageFirmwareRestore
            .mockResolvedValue({
                portHint: null,
                peripheralId:
                    'web-serial-1'
            });

        const vm = {
            generateArduinoUnoUploadCode:
                jest.fn().mockReturnValue(''),

            getPeripheralIsConnected:
                jest.fn().mockReturnValue(false),

            getEasyBloxProjectContext:
                jest.fn().mockReturnValue({
                    selectedBoardId:
                        'arduino-uno',
                    programMode:
                        'stage'
                }),

            on: jest.fn(
                (
                    eventName,
                    handler
                ) => {
                    handlers[eventName] =
                        handler;

                    if (
                        eventName ===
                        'PROJECT_LOADED'
                    ) {
                        handler();
                    }
                }
            ),

            removeListener:
                jest.fn(),

            setEasyBloxSelectedBoard:
                jest.fn(),

            setProgramContext:
                jest.fn(),

            refreshWorkspace:
                jest.fn()
        };

        const {
            getByTestId
        } = renderWithIntl(
            <GUIComponent
                colorMode="default"
                setTheme={jest.fn()}
                theme="default"
                vm={vm}
            />
        );

        const menuBarState =
            getByTestId(
                'menu-bar-state'
            );

        expect(menuBarState)
            .toHaveAttribute(
                'data-stage-firmware-issue',
                ''
            );

        for (
            const reason of [
                'legacy',
                'incompatible',
                'unidentified'
            ]
        ) {
            await act(async () => {
                handlers
                    .PERIPHERAL_STAGE_HANDSHAKE_FAILED({
                        extensionId:
                            'arduinoUno',
                        reason,
                        firmwareCompatibilityVersion:
                            reason ===
                            'incompatible' ?
                                2 :
                                null,
                        expectedFirmwareCompatibilityVersion:
                            1
                    });
            });

            expect(menuBarState)
                .toHaveAttribute(
                    'data-stage-firmware-issue',
                    reason
                );

            expect(
                runEasyBloxStageFirmwareRestore
            ).not.toHaveBeenCalled();
        }

        await act(async () => {
            fireEvent.click(
                getByTestId(
                    'prepare-stage-firmware'
                )
            );

            await Promise.resolve();
        });

        expect(
            runEasyBloxStageFirmwareRestore
        ).toHaveBeenCalledTimes(1);

        expect(menuBarState)
            .toHaveAttribute(
                'data-stage-firmware-issue',
                ''
            );

        await act(async () => {
            handlers
                .PERIPHERAL_STAGE_HANDSHAKE_FAILED({
                    extensionId:
                        'arduinoUno',
                    reason:
                        'legacy',
                    firmwareCompatibilityVersion:
                        null,
                    expectedFirmwareCompatibilityVersion:
                        1
                });
        });

        expect(menuBarState)
            .toHaveAttribute(
                'data-stage-firmware-issue',
                'legacy'
            );

        await act(async () => {
            handlers
                .PERIPHERAL_STAGE_READY({
                    extensionId:
                        'arduinoUno',
                    firmwareCompatibilityVersion:
                        1
                });
        });

        expect(menuBarState)
            .toHaveAttribute(
                'data-stage-firmware-issue',
                ''
            );
    });

    test.each([
        [
            'Costumes',
            1
        ],
        [
            'Sounds',
            2
        ]
    ])(
        'shows only Code in Upload and forces Code when entering from %s',
        (
            tabName,
            activeTabIndex
        ) => {
            const onActivateTab =
                jest.fn();

            const vm = {
                generateArduinoUnoUploadCode:
                    jest.fn().mockReturnValue(''),

                getPeripheralIsConnected:
                    jest.fn().mockReturnValue(false),

                on:
                    jest.fn(),

                removeListener:
                    jest.fn(),

                setEasyBloxSelectedBoard:
                    jest.fn(),

                setProgramContext:
                    jest.fn(),

                refreshWorkspace:
                    jest.fn()
            };

            const {
                getAllByTestId,
                getByTestId
            } = renderWithIntl(
                <GUIComponent
                    activeTabIndex={activeTabIndex}
                    colorMode="default"
                    onActivateTab={onActivateTab}
                    setTheme={jest.fn()}
                    theme="default"
                    vm={vm}
                />
            );

            /*
             * Stage exposes the complete Scratch editing surface.
             */
            expect(
                getAllByTestId('editor-tab')
            ).toHaveLength(3);

            expect(
                getAllByTestId(
                    'editor-tab-panel'
                )
            ).toHaveLength(3);

            expect(
                getByTestId('editor-tabs')
            ).toHaveAttribute(
                'data-selected-index',
                String(activeTabIndex)
            );

            fireEvent.click(
                getByTestId(
                    'request-upload-mode'
                )
            );

            fireEvent.click(
                getByTestId(
                    'confirm-arduino-uno'
                )
            );

            /*
             * Upload owns only the Code surface.
             * Costumes and Sounds must not exist as editor tabs there,
             * regardless of which Stage tab was active previously.
             */
            expect(
                getAllByTestId('editor-tab')
            ).toHaveLength(1);

            expect(
                getAllByTestId(
                    'editor-tab-panel'
                )
            ).toHaveLength(1);

            expect(
                getByTestId('editor-tabs')
            ).toHaveAttribute(
                'data-selected-index',
                '0'
            );

            expect(
                onActivateTab
            ).toHaveBeenCalledWith(0);

            fireEvent.click(
                getByTestId(
                    'request-stage-mode'
                )
            );

            /*
             * Returning to Stage restores the normal editor tabs.
             */
            expect(
                getAllByTestId('editor-tab')
            ).toHaveLength(3);

            expect(
                getAllByTestId(
                    'editor-tab-panel'
                )
            ).toHaveLength(3);
        }
    );

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
