import React from 'react';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import MenuBar from '../../../src/components/menu-bar/menu-bar';
import {menuInitialState} from '../../../src/reducers/menus';
import {LoadingState} from '../../../src/reducers/project-state';
import {DEFAULT_MODE} from '../../../src/lib/settings/color-mode';
import {fireEvent} from '@testing-library/react';

import {PLATFORM} from '../../../src/lib/platform';

import createEasyBloxProjectFileService from '../../../src/lib/easyblox-project-file-service';

import configureStore from 'redux-mock-store';
import {Provider} from 'react-redux';
import VM from '@scratch/scratch-vm';
import {MenuRefProvider} from '../../../src/contexts/menu-ref-context.jsx';
jest.mock('../../../src/lib/easyblox-project-file-service');

describe('MenuBar Component', () => {
    const store = configureStore()({
        locales: {
            isRtl: false,
            locale: 'en-US'
        },
        scratchGui: {
            activeExtensions: [],
            menus: menuInitialState,
            projectState: {
                loadingState: LoadingState.NOT_LOADED
            },
            settings: {
                colorMode: DEFAULT_MODE
            },
            controllerDesktop: {
                isOpen: false
            },
            timeTravel: {
                year: 'NOW'
            },
            vm: new VM(),
            platform: {
                platform: PLATFORM.WEB
            }
        }
    });

    const getComponent = function (props = {}) {
        return (<Provider store={store}>
            <MenuRefProvider>
                <MenuBar
                    canManageFiles
                    canCreateCopy={false}
                    canRemix={false}
                    onStartSelectingFileUpload={jest.fn()}
                    {...props}
                />
            </MenuRefProvider>
        </Provider>);
    };

    let projectFileService;

    beforeEach(() => {
        projectFileService = {
            clearFileHandle: jest.fn(),
            save: jest.fn().mockResolvedValue(),
            saveAs: jest.fn().mockResolvedValue()
        };

        createEasyBloxProjectFileService.mockReturnValue(
            projectFileService
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('EasyBlox local project save integration', () => {
        test('quick-save diskette delegates to the local project file service', () => {
            const {getByRole} = renderWithIntl(
                getComponent()
            );

            fireEvent.click(
                getByRole(
                    'button',
                    {
                        name: 'Salvar'
                    }
                )
            );

            expect(
                createEasyBloxProjectFileService
            ).toHaveBeenCalledTimes(1);

            expect(
                projectFileService.save
            ).toHaveBeenCalledTimes(1);
        });

        test('Ctrl+S delegates to the same local Save operation', () => {
            renderWithIntl(
                getComponent()
            );

            fireEvent.keyDown(
                document,
                {
                    key: 's',
                    ctrlKey: true
                }
            );

            expect(
                projectFileService.save
            ).toHaveBeenCalledTimes(1);
        });

        test('File menu Save delegates to the local Save operation', () => {
            const {
                getByRole,
                getByText
            } = renderWithIntl(
                getComponent()
            );

            fireEvent.click(
                getByRole(
                    'button',
                    {
                        name: 'File menu'
                    }
                )
            );

            fireEvent.click(
                getByText('Salvar')
            );

            expect(
                projectFileService.save
            ).toHaveBeenCalledTimes(1);

            expect(
                projectFileService.saveAs
            ).not.toHaveBeenCalled();
        });

        test('File menu Save As delegates to the local Save As operation', () => {
            const {
                getByRole,
                getByText
            } = renderWithIntl(
                getComponent()
            );

            fireEvent.click(
                getByRole(
                    'button',
                    {
                        name: 'File menu'
                    }
                )
            );

            fireEvent.click(
                getByText('Salvar como...')
            );

            expect(
                projectFileService.saveAs
            ).toHaveBeenCalledTimes(1);

            expect(
                projectFileService.save
            ).not.toHaveBeenCalled();
        });

        test('clears the associated local file when another project finishes loading', () => {
            renderWithIntl(
                getComponent()
            );

            store.getState()
                .scratchGui
                .vm
                .emit('PROJECT_LOADED');

            expect(
                projectFileService.clearFileHandle
            ).toHaveBeenCalledTimes(1);
        });
    });

    describe('Controller active state', () => {
        test('keeps the EasyConect button active while Bluetooth remains connected with the window closed', () => {
            const {
                getByRole
            } = renderWithIntl(
                getComponent({
                    easyConectOpen:
                        false,
                    easyConectConnected:
                        true
                })
            );

            expect(
                getByRole(
                    'button',
                    {
                        name:
                            'EasyConect'
                    }
                ).getAttribute(
                    'aria-pressed'
                )
            ).toBe(
                'true'
            );
        });

        test('leaves the EasyConect button inactive when the window and Bluetooth session are both inactive', () => {
            const {
                getByRole
            } = renderWithIntl(
                getComponent({
                    easyConectOpen:
                        false,
                    easyConectConnected:
                        false
                })
            );

            expect(
                getByRole(
                    'button',
                    {
                        name:
                            'EasyConect'
                    }
                ).getAttribute(
                    'aria-pressed'
                )
            ).toBe(
                'false'
            );
        });
    });

    test('menu bar with no About handler has no About button', () => {
        const {container} = renderWithIntl(getComponent());
        const button = container.querySelector('button[aria-label="About menu"]');
        expect(button).toBeFalsy();
    });

    test('menu bar with an About handler has an About button', () => {
        const onClickAbout = jest.fn();
        const {container} = renderWithIntl(getComponent({onClickAbout}));
        const button = container.querySelector('button[aria-label="About menu"]');
        expect(button).toBeTruthy();
    });

    describe('triggering About button handler', () => {
        test('clicking on About button calls the handler', () => {
            const onClickAbout = jest.fn();
            const {container} = renderWithIntl(getComponent({onClickAbout}));
            const button = container.querySelector('button[aria-label="About menu"]');
    
            fireEvent.click(button);
            expect(onClickAbout).toHaveBeenCalledTimes(1);
        });
    
        test('not clicking on About button does not call the handler', () => {
            const onClickAbout = jest.fn();
            const {container} = renderWithIntl(getComponent({onClickAbout}));
            const button = container.querySelector('button[aria-label="About menu"]');

            expect(onClickAbout).toHaveBeenCalledTimes(0);
        });
    });

    describe('EasyConect integration', () => {
        test('keeps EasyConect visible but disabled until EasyBlox BT is loaded', () => {
            const {getByRole} =
                renderWithIntl(
                    getComponent()
                );

            const easyConectButton =
                getByRole(
                    'button',
                    {
                        name:
                            'EasyConect'
                    }
                );

            expect(
                easyConectButton
            ).toBeTruthy();

            expect(
                easyConectButton.disabled
            ).toBe(
                true
            );

            expect(
                easyConectButton.getAttribute(
                    'title'
                )
            ).toBe(
                'Adicione a extensão EasyBlox BT para habilitar o EasyConect.'
            );
        });

        test('does not toggle EasyConect before EasyBlox BT is loaded', () => {
            const onToggleEasyConect =
                jest.fn();

            const {getByRole} =
                renderWithIntl(
                    getComponent({
                        onToggleEasyConect
                    })
                );

            const easyConectButton =
                getByRole(
                    'button',
                    {
                        name:
                            'EasyConect'
                    }
                );

            fireEvent.click(
                easyConectButton
            );

            expect(
                onToggleEasyConect
            ).toHaveBeenCalledTimes(0);
        });

        test('EasyConect action reflects open state and stays before the hardware controls', () => {
            const {getByRole} =
                renderWithIntl(
                    getComponent({
                        easyBloxBtActive:
                            true,
                        easyConectOpen:
                            true
                    })
                );

            const easyConectButton =
                getByRole(
                    'button',
                    {
                        name:
                            'EasyConect'
                    }
                );

            const boardButton =
                getByRole(
                    'button',
                    {
                        name:
                            'Selecionar placa'
                    }
                );

            expect(
                easyConectButton
                    .getAttribute(
                        'aria-pressed'
                    )
            ).toBe('true');

            expect(
                easyConectButton
                    .compareDocumentPosition(
                        boardButton
                    ) &
                    Node
                        .DOCUMENT_POSITION_FOLLOWING
            ).toBeTruthy();
        });

        test('enables EasyConect while EasyBlox BT is active', () => {
            const onToggleEasyConect =
                jest.fn();

            const {getByRole} =
                renderWithIntl(
                    getComponent({
                        easyBloxBtActive:
                            true,
                        onToggleEasyConect
                    })
                );

            const easyConectButton =
                getByRole(
                    'button',
                    {
                        name:
                            'EasyConect'
                    }
                );

            expect(
                easyConectButton.disabled
            ).toBe(
                false
            );

            expect(
                easyConectButton.getAttribute(
                    'title'
                )
            ).toBe(
                'EasyConect'
            );

            fireEvent.click(
                easyConectButton
            );

            expect(
                onToggleEasyConect
            ).toHaveBeenCalledTimes(1);
        });
    });
});
