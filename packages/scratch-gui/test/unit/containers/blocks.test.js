import {Blocks} from '../../../src/containers/blocks.jsx';

describe('Blocks container onWorkspaceUpdate', () => {
    let instance;

    beforeEach(() => {
        // Minimal mock instance — just enough for onWorkspaceUpdate to run
        instance = {
            getToolboxXML: jest.fn().mockReturnValue(null),
            onWorkspaceMetricsChange: jest.fn(),
            toolboxUpdateChangeListener: jest.fn(),
            props: {
                vm: {editingTarget: null},
                workspaceMetrics: {targets: {}},
                updateToolboxState: jest.fn()
            },
            workspace: {
                removeChangeListener: jest.fn(),
                addChangeListener: jest.fn(),
                clearUndo: jest.fn()
            },
            ScratchBlocks: {
                Events: {
                    disable: jest.fn(),
                    enable: jest.fn()
                },
                utils: {
                    xml: {
                        textToDom: jest.fn().mockReturnValue(document.createElement('xml'))
                    }
                },
                clearWorkspaceAndLoadFromXml: jest.fn()
            }
        };
    });

    test('Events.enable() is called after a successful workspace load', () => {
        Blocks.prototype.onWorkspaceUpdate.call(instance, {xml: '<xml/>'});

        expect(instance.ScratchBlocks.Events.disable).toHaveBeenCalled();
        expect(instance.ScratchBlocks.Events.enable).toHaveBeenCalled();
    });

    test('Events.enable() is called even when clearWorkspaceAndLoadFromXml throws', () => {
        instance.ScratchBlocks.clearWorkspaceAndLoadFromXml.mockImplementation(() => {
            throw new Error('workspace load failed');
        });

        Blocks.prototype.onWorkspaceUpdate.call(instance, {xml: '<xml/>'});

        expect(instance.ScratchBlocks.Events.disable).toHaveBeenCalled();
        expect(instance.ScratchBlocks.Events.enable).toHaveBeenCalled();
    });

    test('Events.enable() is called even when textToDom throws', () => {
        instance.ScratchBlocks.utils.xml.textToDom.mockImplementation(() => {
            throw new Error('XML parse failed');
        });

        Blocks.prototype.onWorkspaceUpdate.call(instance, {xml: 'invalid xml'});

        expect(instance.ScratchBlocks.Events.disable).toHaveBeenCalled();
        expect(instance.ScratchBlocks.Events.enable).toHaveBeenCalled();
    });

describe('Blocks requested extension selection', () => {
    let instance;

    beforeEach(() => {
        instance = {
            props: {
                requestedExtensionId: 'arduinoUno',
                extensionSelectionRequest: 1,
                requestedExtensionShouldConnect: true,
                vm: {
                    extensionManager: {
                        isExtensionLoaded: jest.fn().mockReturnValue(true),
                        loadExtensionURL: jest.fn()
                    }
                }
            },
            handleCategorySelected: jest.fn()
        };
    });

    test('processes a new extension selection request', () => {
        Blocks.prototype.handleExtensionSelectionRequest.call(instance, {
            extensionSelectionRequest: 0
        });

        expect(instance.handleCategorySelected).toHaveBeenCalledTimes(1);
        expect(instance.handleCategorySelected).toHaveBeenCalledWith('arduinoUno', true);
    });

    test('does not process the same request twice', () => {
        Blocks.prototype.handleExtensionSelectionRequest.call(instance, {
            extensionSelectionRequest: 1
        });

        expect(instance.handleCategorySelected).not.toHaveBeenCalled();
    });

    test('allows the same extension to be requested again with a new request number', () => {
        instance.props.extensionSelectionRequest = 2;

        Blocks.prototype.handleExtensionSelectionRequest.call(instance, {
            extensionSelectionRequest: 1
        });

        expect(instance.handleCategorySelected).toHaveBeenCalledTimes(1);
        expect(instance.handleCategorySelected).toHaveBeenCalledWith(
            'arduinoUno',
            true
        );
    });

    test('loads the extension before selecting it when it is not loaded', async () => {
        instance.props.vm.extensionManager.isExtensionLoaded.mockReturnValue(false);
        instance.props.vm.extensionManager.loadExtensionURL.mockResolvedValue();

        Blocks.prototype.handleExtensionSelectionRequest.call(instance, {
            extensionSelectionRequest: 0
        });

        expect(
            instance.props.vm.extensionManager.loadExtensionURL
        ).toHaveBeenCalledWith('arduinoUno');

        await Promise.resolve();

        expect(instance.handleCategorySelected).toHaveBeenCalledTimes(1);
        expect(instance.handleCategorySelected).toHaveBeenCalledWith(
            'arduinoUno',
            true
        );
    });

    test('can select an extension without launching its connection flow', () => {
        instance.props.requestedExtensionShouldConnect = false;

        Blocks.prototype.handleExtensionSelectionRequest.call(instance, {
            extensionSelectionRequest: 0
        });

        expect(instance.handleCategorySelected).toHaveBeenCalledTimes(1);
        expect(instance.handleCategorySelected).toHaveBeenCalledWith(
            'arduinoUno',
            false
        );
    });
});
});

describe('Blocks active board toolbox updates', () => {
    test('updates when the active board changes', () => {
        const instance = {
            state: {
                prompt: null
            },
            props: {
                activeBoardId: null
            },
            _renderedToolboxXML: undefined
        };

        const shouldUpdate = Blocks.prototype.shouldComponentUpdate.call(
            instance,
            {
                activeBoardId: 'arduino-uno'
            },
            {
                prompt: null
            }
        );

        expect(shouldUpdate).toBe(true);
    });

    test('rebuilds toolbox state when the active board changes', () => {
        const instance = {
            props: {
                activeBoardId: null,
                anyModalVisible: false,
                isVisible: false,
                toolboxXML: '<xml/>',
                updateToolboxState: jest.fn()
            },
            _renderedToolboxXML: '<xml/>',
            ScratchBlocks: {
                hideChaff: jest.fn()
            },
            getToolboxXML: jest.fn().mockReturnValue('<xml filtered/>'),
            handleExtensionSelectionRequest: jest.fn(),
            requestToolboxUpdate: jest.fn()
        };

        Blocks.prototype.componentDidUpdate.call(instance, {
            activeBoardId: 'arduino-uno',
            anyModalVisible: false,
            isVisible: false,
            toolboxXML: '<xml/>'
        });

        expect(instance.getToolboxXML).toHaveBeenCalledTimes(1);
        expect(instance.props.updateToolboxState)
            .toHaveBeenCalledWith('<xml filtered/>');
    });
});

describe('Blocks active extensions', () => {
    test('activates an extension without duplicating it', () => {
        const instance = {
            state: {
                activeExtensionIds: ['music']
            },
            setState: jest.fn(updater => {
                const nextState = typeof updater === 'function' ?
                    updater(instance.state) :
                    updater;

                instance.state = {
                    ...instance.state,
                    ...nextState
                };
            })
        };

        Blocks.prototype.handleExtensionActivate.call(
            instance,
            'translate'
        );

        Blocks.prototype.handleExtensionActivate.call(
            instance,
            'translate'
        );

        expect(instance.state.activeExtensionIds).toEqual([
            'music',
            'translate'
        ]);
    });

    test('removes only the requested active extension', () => {
        const instance = {
            state: {
                activeExtensionIds: [
                    'music',
                    'translate',
                    'pen'
                ]
            },
            setState: jest.fn(updater => {
                const nextState = typeof updater === 'function' ?
                    updater(instance.state) :
                    updater;

                instance.state = {
                    ...instance.state,
                    ...nextState
                };
            })
        };

        Blocks.prototype.handleExtensionRemove.call(
            instance,
            'translate'
        );

        expect(instance.state.activeExtensionIds).toEqual([
            'music',
            'pen'
        ]);
    });

    test('updates when the active extensions change', () => {
        const instance = {
            state: {
                prompt: null,
                activeExtensionIds: ['translate']
            },
            props: {},
            _renderedToolboxXML: undefined
        };

        const shouldUpdate =
            Blocks.prototype.shouldComponentUpdate.call(
                instance,
                {},
                {
                    prompt: null,
                    activeExtensionIds: []
                }
            );

        expect(shouldUpdate).toBe(true);
    });

    test('rebuilds toolbox state when the active extensions change', () => {
        const instance = {
            state: {
                activeExtensionIds: ['translate']
            },
            props: {
                activeBoardId: null,
                anyModalVisible: false,
                isVisible: false,
                toolboxXML: '<xml/>',
                updateToolboxState: jest.fn()
            },
            _renderedToolboxXML: '<xml/>',
            ScratchBlocks: {
                hideChaff: jest.fn()
            },
            getToolboxXML: jest.fn().mockReturnValue('<xml filtered/>'),
            handleExtensionSelectionRequest: jest.fn(),
            requestToolboxUpdate: jest.fn()
        };

        Blocks.prototype.componentDidUpdate.call(
            instance,
            {
                activeBoardId: null,
                anyModalVisible: false,
                isVisible: false,
                toolboxXML: '<xml/>'
            },
            {
                activeExtensionIds: []
            }
        );

        expect(instance.getToolboxXML).toHaveBeenCalledTimes(1);
        expect(instance.props.updateToolboxState)
            .toHaveBeenCalledWith('<xml filtered/>');
    });

    test('activates a normal extension when the VM adds it', () => {
        const instance = {
            state: {
                activeExtensionIds: []
            },
            handleExtensionActivate: jest.fn(),
            props: {
                colorMode: 'default'
            },
            ScratchBlocks: {
                defineBlocksWithJsonArray: jest.fn(),
                Blocks: {},
                getMainWorkspace: jest.fn(() => ({
                    getTheme: jest.fn(() => ({
                        setBlockStyle: jest.fn()
                    })),
                    setTheme: jest.fn()
                }))
            },
            getToolboxXML: jest.fn().mockReturnValue(null)
        };

        Blocks.prototype.handleExtensionAdded.call(instance, {
            id: 'translate',
            color1: '#000000',
            color2: '#000000',
            color3: '#000000',
            customFieldTypes: {},
            menus: [],
            blocks: []
        });

        expect(instance.handleExtensionActivate)
            .toHaveBeenCalledWith('translate');
    });

    test('does not reactivate a removed extension on blocks info update', () => {
        const instance = {
            handleExtensionAdded: jest.fn()
        };

        Blocks.prototype.handleBlocksInfoUpdate.call(instance, {
            id: 'translate'
        });

        expect(instance.handleExtensionAdded)
            .toHaveBeenCalledWith(
                {
                    id: 'translate'
                },
                false
            );
    });
});
