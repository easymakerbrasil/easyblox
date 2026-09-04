import React from 'react';
import '@testing-library/jest-dom';

import {act, fireEvent} from '@testing-library/react';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import {GUIComponent} from '../../../src/components/gui/gui.jsx';

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
    ({
        connectionState,
        onPrepareStageFirmware,
        onProgramModeChange,
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

        expect(runEasyBloxUpload)
            .toHaveBeenCalledWith(
                expect.objectContaining({
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
