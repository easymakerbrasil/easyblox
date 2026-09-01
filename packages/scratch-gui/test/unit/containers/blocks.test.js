import {Blocks} from '../../../src/containers/blocks.jsx';
import {
    EASYBLOX_EXECUTION_MODE_DISABLED_REASON
} from '../../../src/lib/easyblox-connection-checker';

describe('Blocks variable category program mode', () => {
    test('filters the Scratch variable category using the current program mode', () => {
        const elements = [
            document.createElement('button'),
            document.createElement('block')
        ];

        const filteredElements = [
            elements[0]
        ];

        const instance = {
            props: {
                programMode: 'upload',
                vm: {
                    runtime: {
                        getBlockExecutionMode: jest.fn()
                    }
                }
            },
            ScratchBlocks: {
                ScratchVariables: {
                    getVariablesCategory: jest.fn().mockReturnValue(elements)
                }
            },
            filterVariableCategoryForProgramMode: jest.fn()
                .mockReturnValue(filteredElements)
        };

        const workspace = {};

        const result =
            Blocks.prototype.getVariableCategoryForProgramMode.call(
                instance,
                workspace
            );

        expect(
            instance.ScratchBlocks.ScratchVariables.getVariablesCategory
        ).toHaveBeenCalledWith(workspace);

        expect(
            instance.filterVariableCategoryForProgramMode
        ).toHaveBeenCalledWith(
            elements,
            'upload',
            expect.any(Function)
        );

        expect(result).toBe(filteredElements);

        const executionModeResolver =
            instance.filterVariableCategoryForProgramMode.mock.calls[0][2];

        executionModeResolver('data_addtolist');

        expect(
            instance.props.vm.runtime.getBlockExecutionMode
        ).toHaveBeenCalledWith('data_addtolist');
    });
});

describe('Blocks EasyBlox variable prompt program mode', () => {
    const createInstance = programMode => {
        const instance = {
            _pendingEasyBloxVariableType: 'TEXT',
            props: {
                programMode,
                canUseCloud: true
            },
            ScratchBlocks: {
                SCALAR_VARIABLE_TYPE: '',
                BROADCAST_MESSAGE_VARIABLE_TYPE: 'broadcast_msg',
                Msg: {
                    VARIABLE_MODAL_TITLE: 'Make a Variable',
                    RENAME_VARIABLE_MODAL_TITLE: 'Rename Variable',
                    RENAME_LIST_MODAL_TITLE: 'Rename List'
                }
            },
            setState: jest.fn()
        };

        return instance;
    };

    test('keeps Scratch scope and cloud options for Stage scalar variables', () => {
        const instance = createInstance('stage');
        const callback = jest.fn();

        Blocks.prototype.handlePromptStart.call(
            instance,
            'Variable name',
            '',
            callback,
            'Make a Variable',
            ''
        );

        expect(instance.setState).toHaveBeenCalledWith({
            prompt: expect.objectContaining({
                callback,
                showEasyBloxVariableTypeOptions: true,
                showVariableOptions: true,
                showCloudOption: true
            })
        });
    });

    test('hides Scratch scope and cloud options for Upload scalar variables', () => {
        const instance = createInstance('upload');
        const callback = jest.fn();

        Blocks.prototype.handlePromptStart.call(
            instance,
            'Variable name',
            '',
            callback,
            'Make a Variable',
            ''
        );

        expect(instance.setState).toHaveBeenCalledWith({
            prompt: expect.objectContaining({
                callback,
                showEasyBloxVariableTypeOptions: true,
                showVariableOptions: false,
                showCloudOption: false
            })
        });
    });
});

describe('Blocks EasyBlox variable prompt callback', () => {
    test('preserves the selected EasyBlox type until variable creation', () => {
        const promptCallback = jest.fn();
        const handlePromptClose = jest.fn();

        const instance = {
            _pendingEasyBloxVariableType: null,
            state: {
                prompt: {
                    callback: promptCallback,
                    varType: '',
                    showEasyBloxVariableTypeOptions: true
                }
            },
            props: {
                vm: {
                    runtime: {
                        getAllVarNamesOfType: jest.fn()
                            .mockReturnValue(['existente'])
                    }
                }
            },
            handlePromptClose
        };

        const variableOptions = {
            scope: 'global',
            isCloud: false,
            easybloxValueType: 'TEXT'
        };

        Blocks.prototype.handlePromptCallback.call(
            instance,
            'mensagem',
            variableOptions
        );

        expect(instance._pendingEasyBloxVariableType).toBe('TEXT');

        expect(
            instance.props.vm.runtime.getAllVarNamesOfType
        ).toHaveBeenCalledWith('');

        expect(promptCallback).toHaveBeenCalledWith(
            'mensagem',
            ['existente'],
            variableOptions
        );

        expect(handlePromptClose).toHaveBeenCalledTimes(1);
    });

    test('does not retain an EasyBlox type for prompts without type selection', () => {
        const instance = {
            _pendingEasyBloxVariableType: 'DECIMAL',
            state: {
                prompt: {
                    callback: jest.fn(),
                    varType: '',
                    showEasyBloxVariableTypeOptions: false
                }
            },
            props: {
                vm: {
                    runtime: {
                        getAllVarNamesOfType: jest.fn()
                            .mockReturnValue([])
                    }
                }
            },
            handlePromptClose: jest.fn()
        };

        Blocks.prototype.handlePromptCallback.call(
            instance,
            'mensagem',
            {
                scope: 'global',
                isCloud: false,
                easybloxValueType: 'TEXT'
            }
        );

        expect(instance._pendingEasyBloxVariableType).toBeNull();
    });
});

describe('Blocks EasyBlox variable ownership', () => {
    test('keeps Stage variable typing on the owning Scratch target', () => {
        const setVariableEasyBloxValueType = jest.fn();

        const instance = {
            _pendingEasyBloxVariableType: 'DECIMAL',
            props: {
                programMode: 'stage',
                vm: {
                    runtime: {
                        targets: [{
                            id: 'stage',
                            variables: {
                                stage_variable: {
                                    id: 'stage_variable'
                                }
                            }
                        }]
                    },
                    setVariableEasyBloxValueType
                }
            }
        };

        Blocks.prototype.handleVariableCreated.call(
            instance,
            'stage_variable'
        );

        expect(
            setVariableEasyBloxValueType
        ).toHaveBeenCalledWith(
            'stage',
            'stage_variable',
            'DECIMAL'
        );

        expect(
            instance._pendingEasyBloxVariableType
        ).toBeNull();
    });

    test('delegates Upload variable ownership to the VM without a Scratch target ID', () => {
        const setVariableEasyBloxValueType = jest.fn();

        const instance = {
            _pendingEasyBloxVariableType: 'TEXT',
            props: {
                activeBoardId: 'arduino-uno',
                programMode: 'upload',
                vm: {
                    runtime: {
                        targets: [{
                            id: 'stage',
                            variables: {
                                shared_variable: {
                                    id: 'shared_variable'
                                }
                            }
                        }]
                    },
                    setVariableEasyBloxValueType
                }
            }
        };

        Blocks.prototype.handleVariableCreated.call(
            instance,
            'shared_variable'
        );

        expect(
            setVariableEasyBloxValueType
        ).toHaveBeenCalledWith(
            null,
            'shared_variable',
            'TEXT'
        );

        expect(
            instance._pendingEasyBloxVariableType
        ).toBeNull();
    });
});

describe('Blocks container onWorkspaceUpdate', () => {
    let instance;

    beforeEach(() => {
        // Minimal mock instance — just enough for onWorkspaceUpdate to run
        instance = {
            getToolboxXML: jest.fn().mockReturnValue(null),
            onWorkspaceMetricsChange: jest.fn(),
            toolboxUpdateChangeListener: jest.fn(),
            updateWorkspaceExecutionMode: jest.fn(),
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

    test('updates workspace execution mode after loading the workspace', () => {
        Blocks.prototype.onWorkspaceUpdate.call(instance, {xml: '<xml/>'});

        expect(instance.updateWorkspaceExecutionMode)
            .toHaveBeenCalledTimes(1);

        expect(instance.ScratchBlocks.clearWorkspaceAndLoadFromXml)
            .toHaveBeenCalled();
    });

    test('updates workspace execution mode after a partial workspace load failure', () => {
        instance.ScratchBlocks.clearWorkspaceAndLoadFromXml.mockImplementation(() => {
            throw new Error('workspace load failed');
        });

        Blocks.prototype.onWorkspaceUpdate.call(instance, {xml: '<xml/>'});

        expect(instance.updateWorkspaceExecutionMode)
            .toHaveBeenCalledTimes(1);
    });
});

describe('Blocks VM attachment', () => {
    test('requests the current workspace after registering the workspace listener', () => {
        const callOrder = [];

        const flyoutWorkspace = {
            addChangeListener: jest.fn()
        };

        const workspace = {
            addChangeListener: jest.fn(),
            getFlyout: jest.fn().mockReturnValue({
                getWorkspace: jest.fn().mockReturnValue(flyoutWorkspace)
            })
        };

        const addListener = jest.fn(eventName => {
            if (eventName === 'workspaceUpdate') {
                callOrder.push('workspaceUpdate listener');
            }
        });

        const refreshWorkspace = jest.fn(() => {
            callOrder.push('refreshWorkspace');
        });

        const instance = {
            workspace,
            props: {
                vm: {
                    blockListener: jest.fn(),
                    flyoutBlockListener: jest.fn(),
                    monitorBlockListener: jest.fn(),
                    addListener,
                    refreshWorkspace
                }
            },
            onScriptGlowOn: jest.fn(),
            onScriptGlowOff: jest.fn(),
            onBlockGlowOn: jest.fn(),
            onBlockGlowOff: jest.fn(),
            onVisualReport: jest.fn(),
            onWorkspaceUpdate: jest.fn(),
            onTargetsUpdate: jest.fn(),
            handleMonitorsUpdate: jest.fn(),
            handleExtensionAdded: jest.fn(),
            handleBlocksInfoUpdate: jest.fn(),
            handleStatusButtonUpdate: jest.fn()
        };

        Blocks.prototype.attachVM.call(instance);

        expect(addListener).toHaveBeenCalledWith(
            'workspaceUpdate',
            instance.onWorkspaceUpdate
        );
        expect(refreshWorkspace).toHaveBeenCalledTimes(1);
        expect(callOrder).toEqual([
            'workspaceUpdate listener',
            'refreshWorkspace'
        ]);
    });
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
        expect(instance.handleCategorySelected).toHaveBeenCalledWith(
            'arduinoUno',
            true
        );
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

describe('Blocks active board toolbox updates', () => {
    test('updates when the active board changes', () => {
        const instance = {
            state: {
                prompt: null
            },
            props: {
                activeBoardId: null
            }
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

describe('Blocks program mode toolbox updates', () => {
    test('updates when the program mode changes', () => {
        const instance = {
            state: {
                prompt: null
            },
            props: {
                programMode: 'stage'
            }
        };

        const shouldUpdate = Blocks.prototype.shouldComponentUpdate.call(
            instance,
            {
                programMode: 'upload'
            },
            {
                prompt: null
            }
        );

        expect(shouldUpdate).toBe(true);
    });

    test('rebuilds toolbox state when the program mode changes', () => {
        const activeExtensionIds = [];
        const instance = {
            state: {
                activeExtensionIds
            },
            props: {
                activeBoardId: null,
                programMode: 'upload',
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
            requestToolboxUpdate: jest.fn(),
            updateWorkspaceExecutionMode: jest.fn()
        };

        Blocks.prototype.componentDidUpdate.call(
            instance,
            {
                activeBoardId: null,
                programMode: 'stage',
                anyModalVisible: false,
                isVisible: false,
                toolboxXML: '<xml/>'
            },
            {
                activeExtensionIds
            }
        );

        expect(instance.getToolboxXML).toHaveBeenCalledTimes(1);
        expect(instance.props.updateToolboxState)
            .toHaveBeenCalledWith('<xml filtered/>');
    });

    test('recreates flyout blocks after a program mode toolbox update', () => {
        const activeExtensionIds = [];
        const setRecyclingEnabled = jest.fn();

        const instance = {
            state: {
                activeExtensionIds
            },
            props: {
                activeBoardId: null,
                programMode: 'stage',
                anyModalVisible: false,
                isVisible: true,
                toolboxXML: '<xml/>',
                updateToolboxState: jest.fn()
            },
            _renderedToolboxXML: '<xml/>',
            ScratchBlocks: {
                hideChaff: jest.fn()
            },
            workspace: {
                getFlyout: jest.fn().mockReturnValue({
                    setRecyclingEnabled
                })
            },
            getToolboxXML: jest.fn().mockReturnValue(
                '<xml filtered/>'
            ),
            handleExtensionSelectionRequest: jest.fn(),
            requestToolboxUpdate: jest.fn(),
            withToolboxUpdates: jest.fn(fn => fn()),
            updateWorkspaceExecutionMode: jest.fn()
        };

        // First render: program mode changes and the new toolbox XML is generated.
        Blocks.prototype.componentDidUpdate.call(
            instance,
            {
                activeBoardId: null,
                programMode: 'upload',
                anyModalVisible: false,
                isVisible: true,
                toolboxXML: '<xml/>'
            },
            {
                activeExtensionIds
            }
        );

        expect(instance.props.updateToolboxState)
            .toHaveBeenCalledWith('<xml filtered/>');

        // Second render: Redux delivers the new toolbox XML to Blockly.
        instance.props.toolboxXML = '<xml filtered/>';

        Blocks.prototype.componentDidUpdate.call(
            instance,
            {
                activeBoardId: null,
                programMode: 'stage',
                anyModalVisible: false,
                isVisible: true,
                toolboxXML: '<xml/>'
            },
            {
                activeExtensionIds
            }
        );

        expect(instance.requestToolboxUpdate)
            .toHaveBeenCalledTimes(1);

        expect(setRecyclingEnabled.mock.calls).toEqual([
            [false],
            [true]
        ]);
    });

    test('passes the program mode when requesting blocks XML', () => {
        const target = {
            id: 'target-id',
            isStage: false,
            getCostumes: jest.fn().mockReturnValue([
                {name: 'target costume'}
            ]),
            getSounds: jest.fn().mockReturnValue([])
        };

        const stage = {
            id: 'stage-id',
            isStage: true,
            getCostumes: jest.fn().mockReturnValue([
                {name: 'stage costume'}
            ])
        };

        const getBlocksXML = jest.fn().mockReturnValue([]);

        const instance = {
            state: {
                activeExtensionIds: []
            },
            props: {
                activeBoardId: null,
                programMode: 'upload',
                colorMode: 'default',
                vm: {
                    editingTarget: target,
                    runtime: {
                        getTargetForStage: jest.fn().mockReturnValue(stage),
                        getBlocksXML
                    },
                    extensionManager: {
                        getExtensionCompanions: jest.fn().mockReturnValue([])
                    }
                }
            }
        };

        const toolboxXML =
            Blocks.prototype.getToolboxXML.call(instance);

        expect(getBlocksXML).toHaveBeenCalledWith(
            target,
            'upload'
        );

        expect(toolboxXML).not.toContain(
            'toolboxitemid="motion"'
        );

        expect(toolboxXML).toContain(
            'toolboxitemid="operators"'
        );
    });

    test('configures the EasyBlox connection checker for the workspace', () => {
        class ScratchConnectionChecker {}

        const instance = {
            props: {
                options: {},
                isRtl: false,
                toolboxXML: '<xml/>',
                colorMode: 'default',
                useCatBlocks: false
            },
            ScratchBlocks: {
                Theme: jest.fn(),
                registry: {
                    Type: {
                        CONNECTION_CHECKER: 'connectionChecker'
                    },
                    DEFAULT: 'default',
                    getClass: jest.fn().mockReturnValue(ScratchConnectionChecker)
                },
                Connection: {
                    CAN_CONNECT: 0,
                    REASON_CHECKS_FAILED: 4
                }
            }
        };

        const workspaceConfig =
            Blocks.prototype.getWorkspaceConfig.call(instance);

        expect(workspaceConfig.plugins.connectionChecker)
            .toEqual(expect.any(Function));

        const checker =
            new workspaceConfig.plugins.connectionChecker();

        expect(checker).toBeInstanceOf(ScratchConnectionChecker);
    });
});

test('updates workspace block disabled state for the program mode', () => {
    const stageOnlyBlock = {
        type: 'motion_movesteps',
        setDisabledReason: jest.fn()
    };
    const uploadOnlyBlock = {
        type: 'serial_serialWrite',
        setDisabledReason: jest.fn()
    };
    const bothBlock = {
        type: 'operator_add',
        setDisabledReason: jest.fn()
    };
    const unknownBlock = {
        type: 'unknown_shadow_block',
        setDisabledReason: jest.fn()
    };

    const executionModes = {
        motion_movesteps: 'stage',
        serial_serialWrite: 'upload',
        operator_add: 'both',
        unknown_shadow_block: null
    };

    const getBlockExecutionMode = jest.fn(blockType =>
        executionModes[blockType]
    );

    const instance = {
        props: {
            programMode: 'upload',
            vm: {
                runtime: {
                    getBlockExecutionMode
                }
            }
        },
        workspace: {
            getAllBlocks: jest.fn().mockReturnValue([
                stageOnlyBlock,
                uploadOnlyBlock,
                bothBlock,
                unknownBlock
            ])
        }
    };

    Blocks.prototype.updateWorkspaceExecutionMode.call(instance);

    expect(instance.workspace.getAllBlocks).toHaveBeenCalledWith(false);

    expect(stageOnlyBlock.setDisabledReason).toHaveBeenCalledWith(
        true,
        EASYBLOX_EXECUTION_MODE_DISABLED_REASON
    );
    expect(uploadOnlyBlock.setDisabledReason).toHaveBeenCalledWith(
        false,
        EASYBLOX_EXECUTION_MODE_DISABLED_REASON
    );
    expect(bothBlock.setDisabledReason).toHaveBeenCalledWith(
        false,
        EASYBLOX_EXECUTION_MODE_DISABLED_REASON
    );
    expect(unknownBlock.setDisabledReason).toHaveBeenCalledWith(
        false,
        EASYBLOX_EXECUTION_MODE_DISABLED_REASON
    );

    stageOnlyBlock.setDisabledReason.mockClear();
    uploadOnlyBlock.setDisabledReason.mockClear();

    instance.props.programMode = 'stage';

    Blocks.prototype.updateWorkspaceExecutionMode.call(instance);

    expect(stageOnlyBlock.setDisabledReason).toHaveBeenCalledWith(
        false,
        EASYBLOX_EXECUTION_MODE_DISABLED_REASON
    );
    expect(uploadOnlyBlock.setDisabledReason).toHaveBeenCalledWith(
        true,
        EASYBLOX_EXECUTION_MODE_DISABLED_REASON
    );
});

test('preserves incompatible workspace blocks visually across Stage and Upload reloads', () => {
    const executionModes = {
        motion_movesteps: 'stage',
        serial_serialWrite: 'upload'
    };

    const getBlockExecutionMode = jest.fn(blockType =>
        executionModes[blockType] || null
    );

    const createWorkspaceDom = (type, id) => {
        const dom = document.createElement('xml');
        dom.innerHTML =
            `<block type="${type}" id="${id}" x="24" y="36"></block>`;
        return dom;
    };

    const stageWorkspaceDom =
        createWorkspaceDom(
            'motion_movesteps',
            'stage-only-block'
        );

    const uploadWorkspaceDom =
        createWorkspaceDom(
            'serial_serialWrite',
            'upload-only-block'
        );

    const clearWorkspaceAndLoadFromXml =
        jest.fn();

    const instance = {
        props: {
            programMode: 'upload',
            vm: {
                editingTarget: null,
                runtime: {
                    getBlockExecutionMode
                }
            },
            workspaceMetrics: {
                targets: {}
            },
            updateToolboxState: jest.fn()
        },

        workspace: {
            removeChangeListener: jest.fn(),
            addChangeListener: jest.fn(),
            clearUndo: jest.fn()
        },

        toolboxUpdateChangeListener: jest.fn(),

        getToolboxXML: jest.fn()
            .mockReturnValue(null),

        onWorkspaceMetricsChange: jest.fn(),

        updateWorkspaceExecutionMode: jest.fn(),

        preserveIncompatibleWorkspaceBlocks:
            Blocks.prototype.preserveIncompatibleWorkspaceBlocks,

        ScratchBlocks: {
            Events: {
                disable: jest.fn(),
                enable: jest.fn()
            },

            Xml: {
                workspaceToDom: jest.fn()
                    .mockReturnValue(stageWorkspaceDom)
            },

            utils: {
                xml: {
                    textToDom: jest.fn()
                        .mockReturnValue(
                            uploadWorkspaceDom
                        )
                }
            },

            clearWorkspaceAndLoadFromXml
        },

        /*
         * A program-mode transition must preserve incompatible blocks from
         * the workspace which is about to be replaced.
         */
        _preserveIncompatibleBlocksOnNextWorkspaceUpdate: true
    };

    const previousRequestAnimationFrame =
        global.requestAnimationFrame;

    global.requestAnimationFrame =
        jest.fn();

    try {
        /*
         * Stage -> Upload:
         * the Upload workspace becomes active, but an existing Stage-only
         * block must remain visible as inactive context.
         */
        Blocks.prototype.onWorkspaceUpdate.call(
            instance,
            {
                xml: '<xml/>'
            }
        );

        expect(
            clearWorkspaceAndLoadFromXml
        ).toHaveBeenCalledTimes(1);

        const stageToUploadDom =
            clearWorkspaceAndLoadFromXml
                .mock.calls[0][0];

        expect(
            stageToUploadDom.querySelector(
                '[id="upload-only-block"]'
            )
        ).not.toBeNull();

        const preservedStageBlock =
            stageToUploadDom.querySelector(
                '[id="stage-only-block"]'
            );

        expect(preservedStageBlock).not.toBeNull();

        expect(
            preservedStageBlock.getAttribute('disabled')
        ).toBe('true');

        expect(
            preservedStageBlock.getAttribute('movable')
        ).toBe('false');

        expect(
            preservedStageBlock.getAttribute('deletable')
        ).toBe('false');

        expect(
            preservedStageBlock.getAttribute('editable')
        ).toBe('false');

        /*
         * Upload -> Stage:
         * perform the inverse transition and require the Upload-only block
         * to remain visible without becoming part of the Stage program.
         */
        instance.props.programMode = 'stage';

        instance.ScratchBlocks.Xml.workspaceToDom
            .mockReturnValue(
                uploadWorkspaceDom
            );

        instance.ScratchBlocks.utils.xml.textToDom
            .mockReturnValue(
                stageWorkspaceDom
            );

        instance._preserveIncompatibleBlocksOnNextWorkspaceUpdate =
            true;

        clearWorkspaceAndLoadFromXml.mockClear();

        Blocks.prototype.onWorkspaceUpdate.call(
            instance,
            {
                xml: '<xml/>'
            }
        );

        expect(
            clearWorkspaceAndLoadFromXml
        ).toHaveBeenCalledTimes(1);

        const uploadToStageDom =
            clearWorkspaceAndLoadFromXml
                .mock.calls[0][0];

        expect(
            uploadToStageDom.querySelector(
                '[id="stage-only-block"]'
            )
        ).not.toBeNull();

        const preservedUploadBlock =
            uploadToStageDom.querySelector(
                '[id="upload-only-block"]'
            );

        expect(preservedUploadBlock).not.toBeNull();

        expect(
            preservedUploadBlock.getAttribute('disabled')
        ).toBe('true');

        expect(
            preservedUploadBlock.getAttribute('movable')
        ).toBe('false');

        expect(
            preservedUploadBlock.getAttribute('deletable')
        ).toBe('false');

        expect(
            preservedUploadBlock.getAttribute('editable')
        ).toBe('false');
    } finally {
        global.requestAnimationFrame =
            previousRequestAnimationFrame;
    }
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
            props: {}
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
