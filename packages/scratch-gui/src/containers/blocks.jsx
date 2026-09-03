import bindAll from 'lodash.bindall';
import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import makeToolboxXML from '../lib/make-toolbox-xml';
import PropTypes from 'prop-types';
import React from 'react';
import VMScratchBlocks from '../lib/blocks';
import {
    createEasyBloxConnectionChecker,
    EASYBLOX_EXECUTION_MODE_DISABLED_REASON,
    EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
} from '../lib/easyblox-connection-checker';
import {
    filterVariableCategoryForProgramMode
} from '../lib/variable-category-program-mode';
import VM from '@scratch/scratch-vm';

import analytics from '../lib/analytics';
import log from '../lib/log.js';
import Prompt from './prompt.jsx';
import BlocksComponent from '../components/blocks/blocks.jsx';
import ExtensionLibrary from './extension-library.jsx';
import extensionData, {
    filterBlocksXMLForProjectContext,
    getBoardById
} from '../lib/libraries/extensions/index.jsx';
import CustomProcedures from './custom-procedures.jsx';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {BLOCKS_DEFAULT_SCALE, STAGE_DISPLAY_SIZES} from '../lib/layout-constants';
import DropAreaHOC from '../lib/drop-area-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import defineDynamicBlock from '../lib/define-dynamic-block';
import {DEFAULT_MODE, getColorsForMode, colorModeMap} from '../lib/settings/color-mode';
import {CAT_BLOCKS_THEME} from '../lib/settings/theme';
import {
    injectExtensionBlockIcons,
    injectExtensionCategoryMode,
    getExtensionColors
} from '../lib/settings/color-mode/blockHelpers';

import {connect} from 'react-redux';
import {updateToolbox} from '../reducers/toolbox';
import {activateColorPicker} from '../reducers/color-picker';
import {closeExtensionLibrary, openSoundRecorder, openConnectionModal} from '../reducers/modals';
import {activateCustomProcedures, deactivateCustomProcedures} from '../reducers/custom-procedures';
import {setConnectionModalExtensionId} from '../reducers/connection-modal';
import {updateMetrics} from '../reducers/workspace-metrics';
import {isTimeTravel2020} from '../reducers/time-travel';

import {
    activateTab,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';

const addFunctionListener = (object, property, callback) => {
    const oldFn = object[property];
    object[property] = function (...args) {
        const result = oldFn.apply(this, args);
        callback.apply(this, result);
        return result;
    };
};

const DroppableBlocks = DropAreaHOC([
    DragConstants.BACKPACK_CODE
])(BlocksComponent);

class Blocks extends React.Component {
    constructor (props) {
        super(props);
        this.ScratchBlocks = VMScratchBlocks(props.vm);
        this.filterVariableCategoryForProgramMode =
            filterVariableCategoryForProgramMode;
        bindAll(this, [
            'attachVM',
            'detachVM',
            'getToolboxXML',
            'getVariableCategoryForProgramMode',
            'handleCategorySelected',
            'handleConnectionModalStart',
            'handleDrop',
            'handleStatusButtonUpdate',
            'handleOpenSoundRecorder',
            'handleVariableCreated',
            'handlePromptStart',
            'handlePromptCallback',
            'handlePromptClose',
            'handleCustomProceduresClose',
            'onScriptGlowOn',
            'onScriptGlowOff',
            'onBlockGlowOn',
            'onBlockGlowOff',
            'handleMonitorsUpdate',
            'handleExtensionActivate',
            'handleExtensionRemove',
            'handleExtensionAdded',
            'handleBlocksInfoUpdate',
            'onTargetsUpdate',
            'onVisualReport',
            'onWorkspaceUpdate',
            'onWorkspaceMetricsChange',
            'setBlocks',
            'setLocale'
        ]);
        this.ScratchBlocks.dialog.setPrompt(this.handlePromptStart);
        this.ScratchBlocks.ScratchVariables.setPromptHandler(
            this.handlePromptStart
        );
        this.ScratchBlocks.StatusIndicatorLabel.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.state = {
            prompt: null,
            activeExtensionIds: []
        };
        this.onTargetsUpdate = debounce(this.onTargetsUpdate, 100);
        this.toolboxUpdateQueue = [];
        this._recreateFlyoutOnNextToolboxUpdate = false;
        this._hydrateInactiveBlocksOnNextWorkspaceUpdate = false;
    }

    componentDidMount () {
        this.ScratchBlocks = VMScratchBlocks(this.props.vm, this.props.useCatBlocks);
        this.ScratchBlocks.dialog.setPrompt(this.handlePromptStart);
        this.ScratchBlocks.StatusIndicatorLabel.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.ScratchBlocks.FieldColourSlider.activateEyedropper_ = this.props.onActivateColorPicker;
        this.ScratchBlocks.ScratchProcedures.externalProcedureDefCallback = this.props.onActivateCustomProcedures;
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);

        const workspaceConfig = this.getWorkspaceConfig();
        this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);
        this.workspace.registerToolboxCategoryCallback(
            'VARIABLE',
            this.getVariableCategoryForProgramMode
        );

        this.workspace.registerToolboxCategoryCallback(
            'PROCEDURE',
            this.ScratchBlocks.ScratchProcedures.getProceduresCategory
        );

        this.toolboxUpdateChangeListener = event => {
            if (
                event.type === this.ScratchBlocks.Events.VAR_CREATE ||
                event.type === this.ScratchBlocks.Events.VAR_RENAME ||
                event.type === this.ScratchBlocks.Events.VAR_DELETE ||
                (event.type === this.ScratchBlocks.Events.BLOCK_DELETE &&
                    event.oldJson.type === 'procedures_definition') ||
                // Only refresh the toolbox when procedure block creations are
                // triggered by undoing a deletion (implied by recordUndo being
                // false on the event).
                (event.type === this.ScratchBlocks.Events.BLOCK_CREATE &&
                    event.json.type === 'procedures_definition' &&
                    !event.recordUndo)
            ) {
                this.requestToolboxUpdate();
            }
            if (
                event.type === this.ScratchBlocks.Events.VAR_CREATE &&
                this._pendingEasyBloxVariableType
            ) {
                setTimeout(() => {
                    this.handleVariableCreated(event.varId);
                }, 0);
            }
        };
        this.workspace.addChangeListener(this.toolboxUpdateChangeListener);

        // Register buttons under new callback keys for creating variables,
        // lists, and procedures from extensions.

        const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();

        const varListButtonCallback = type =>
            (() => this.ScratchBlocks.ScratchVariables.createVariable(
                this.workspace,
                null,
                type
            ));
        const procButtonCallback = () => {
            this.ScratchBlocks.ScratchProcedures.createProcedureDefCallback(this.workspace);
        };

        toolboxWorkspace.registerButtonCallback('MAKE_A_VARIABLE', varListButtonCallback(''));
        toolboxWorkspace.registerButtonCallback('MAKE_A_LIST', varListButtonCallback('list'));
        toolboxWorkspace.registerButtonCallback('MAKE_A_PROCEDURE', procButtonCallback);

        // Store the xml of the toolbox that is actually rendered.
        // This is used in componentDidUpdate instead of prevProps, because
        // the xml can change while e.g. on the costumes tab.
        this._renderedToolboxXML = this.props.toolboxXML;

        // @todo change this when blockly supports UI events
        addFunctionListener(this.workspace, 'translate', this.onWorkspaceMetricsChange);
        addFunctionListener(this.workspace, 'zoom', this.onWorkspaceMetricsChange);
        this.workspace.getToolbox().selectItemByPosition(0);

        this.attachVM();
        // Only update blocks/vm locale when visible to avoid sizing issues
        // If locale changes while not visible it will get handled in didUpdate
        if (this.props.isVisible) {
            this.setLocale();
        }

        window.addEventListener('load-extension', () => {
            this.props.vm.extensionManager.loadExtensionURL('faceSensing').then(() => {
                this.handleCategorySelected('faceSensing');
            });
        });
    }
    shouldComponentUpdate (nextProps, nextState) {
        return (
            this.state.prompt !== nextState.prompt ||
            this.state.activeExtensionIds !== nextState.activeExtensionIds ||
            this.props.activeBoardId !== nextProps.activeBoardId ||
            this.props.programMode !== nextProps.programMode ||
            this.props.requestedExtensionId !== nextProps.requestedExtensionId ||
            this.props.extensionSelectionRequest !== nextProps.extensionSelectionRequest ||
            this.props.isVisible !== nextProps.isVisible ||
            this._renderedToolboxXML !== nextProps.toolboxXML ||
            this.props.extensionLibraryVisible !== nextProps.extensionLibraryVisible ||
            this.props.customProceduresVisible !== nextProps.customProceduresVisible ||
            this.props.locale !== nextProps.locale ||
            this.props.anyModalVisible !== nextProps.anyModalVisible ||
            this.props.stageSize !== nextProps.stageSize
        );
    }
    componentDidUpdate (prevProps, prevState) {
        // If any modals are open, call hideChaff to close z-indexed field editors
        if (this.props.anyModalVisible && !prevProps.anyModalVisible) {
            this.ScratchBlocks.hideChaff();
        }

        this.handleExtensionSelectionRequest(prevProps);

        /*
         * A board restored while Stage remains active does not cause a
         * Stage -> Upload -> Stage transition. Hydrate the board's canonical
         * Upload program once so it can appear only as inert visual context.
         */
        if (
            this.props.programMode === 'stage' &&
            prevProps.programMode === 'stage' &&
            this.props.activeBoardId &&
            this.props.activeBoardId !== prevProps.activeBoardId
        ) {
            this._hydrateInactiveBlocksOnNextWorkspaceUpdate = true;
        }


        if (this.props.programMode !== prevProps.programMode) {
        /*
        * The VM intentionally owns independent Stage and Upload backing stores.
        * Preserve incompatible blocks from the outgoing workspace only as inert
        * visual context during the workspace reload triggered by a mode change.
        */
            this._preserveIncompatibleBlocksOnNextWorkspaceUpdate = true;

            this.updateWorkspaceExecutionMode();
            this._recreateFlyoutOnNextToolboxUpdate = true;
        }

        if (
            this.props.activeBoardId !==
            prevProps.activeBoardId
        ) {
            this.updateWorkspaceBoardCapability();
            this._recreateFlyoutOnNextToolboxUpdate = true;
        }

        if (
            this.props.activeBoardId !== prevProps.activeBoardId ||
            this.props.programMode !== prevProps.programMode ||
            this.state.activeExtensionIds !== prevState.activeExtensionIds
        ) {
            const toolboxXML = this.getToolboxXML();
            if (toolboxXML) {
                this.props.updateToolboxState(toolboxXML);
            }
        }

        // Only rerender the toolbox when the blocks are visible and the xml is
        // different from the previously rendered toolbox xml.
        // Do not check against prevProps.toolboxXML because that may not have been rendered.
        if (this.props.isVisible && this.props.toolboxXML !== this._renderedToolboxXML) {
            if (this._recreateFlyoutOnNextToolboxUpdate) {
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                    this._recreateFlyoutOnNextToolboxUpdate = false;
                });
            } else {
                this.requestToolboxUpdate();
            }
        }

        if (this.props.isVisible === prevProps.isVisible) {
            if (this.props.stageSize !== prevProps.stageSize) {
                // force workspace to redraw for the new stage size
                window.dispatchEvent(new Event('resize'));
            }
            return;
        }
        // @todo hack to resize blockly manually in case resize happened while hidden
        // @todo hack to reload the workspace due to gui bug #413
        if (this.props.isVisible) { // Scripts tab
            this.workspace.setVisible(true);
            if (prevProps.locale !== this.props.locale || this.props.locale !== this.props.vm.getLocale()) {
                // call setLocale if the locale has changed, or changed while the blocks were hidden.
                // vm.getLocale() will be out of sync if locale was changed while not visible
                this.setLocale();
            } else {
                this.props.vm.refreshWorkspace();
            }

            window.dispatchEvent(new Event('resize'));
        } else {
            this.workspace.setVisible(false);
        }
    }
    componentWillUnmount () {
        this.detachVM();
        // Hide any open field editor and move Blockly focus to the workspace
        // root before disposing. Without this, BlockSvg.dispose() detects the
        // focused element is inside a block and schedules a stale
        // setTimeout(() => focusTree(workspace)), which fires after the
        // workspace is unregistered and throws
        // "Attempted to focus unregistered tree" (scratch-blocks#3460).
        //
        // focusNode(workspace) — not focusTree(workspace) — is used here
        // because focusTree would restore focus to whatever was previously
        // focused in this workspace (likely the same block about to be
        // disposed). focusNode pins focus to the workspace root directly,
        // ensuring no block is focused when dispose() runs.
        this.ScratchBlocks.WidgetDiv.hide();
        this.ScratchBlocks.getFocusManager().focusNode(this.workspace);
        this.workspace.dispose();
        clearTimeout(this.toolboxUpdateTimeout);

        // Clear the flyout blocks so that they can be recreated on mount.
        this.props.vm.clearFlyoutBlocks();
    }

    updateWorkspaceExecutionMode () {
        if (!this.workspace) {
            return;
        }

        const currentMode = this.props.programMode;

        for (const block of this.workspace.getAllBlocks(false)) {
            const executionMode =
                this.props.vm.runtime.getBlockExecutionMode(block.type);

            const incompatible =
                executionMode !== null &&
                executionMode !== 'both' &&
                executionMode !== currentMode;

            block.setDisabledReason(
                incompatible,
                EASYBLOX_EXECUTION_MODE_DISABLED_REASON
            );
        }
    }

    updateWorkspaceBoardCapability () {
        if (!this.workspace) {
            return;
        }

        const activeBoard =
            this.props.activeBoardId ?
                getBoardById(
                    this.props.activeBoardId
                ) :
                null;

        const availableCapabilities =
            new Set(
                activeBoard &&
                Array.isArray(activeBoard.capabilities) ?
                    activeBoard.capabilities :
                    []
            );

        for (
            const block of
            this.workspace.getAllBlocks(false)
        ) {
            const requiredCapability =
                this.props.vm.runtime
                    .getBlockRequiredBoardCapability(
                        block.type
                    );

            const incompatible =
                Boolean(requiredCapability) &&
                !availableCapabilities.has(
                    requiredCapability
                );

            block.setDisabledReason(
                incompatible,
                EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
            );
        }
    }

    getWorkspaceConfig () {
        const workspaceConfig = defaultsDeep({},
            Blocks.defaultOptions,
            this.props.options,
            {
                rtl: this.props.isRtl,
                toolbox: this.props.toolboxXML,
                theme: new this.ScratchBlocks.Theme(
                    this.props.colorMode,
                    getColorsForMode(this.props.colorMode)
                ),
                // TODO: use scratch-blocks constants instead of bare strings
                scratchTheme: this.props.useCatBlocks ? 'catblocks' : 'classic'
            }
        );

        workspaceConfig.plugins = Object.assign(
            {},
            workspaceConfig.plugins,
            {
                connectionChecker:
                    createEasyBloxConnectionChecker(this.ScratchBlocks)
            }
        );

        return workspaceConfig;
    }

    getVariableCategoryForProgramMode (workspace) {
        const elements =
            this.ScratchBlocks.ScratchVariables.getVariablesCategory(
                workspace
            );

        return this.filterVariableCategoryForProgramMode(
            elements,
            this.props.programMode,
            blockType =>
                this.props.vm.runtime.getBlockExecutionMode(blockType)
        );
    }
    requestToolboxUpdate () {
        clearTimeout(this.toolboxUpdateTimeout);
        this.toolboxUpdateTimeout = setTimeout(() => {
            this.updateToolbox();
        }, 0);
    }
    setLocale () {
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
        this.props.vm.setLocale(this.props.locale, this.props.messages)
            .then(() => {
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                });
            });
    }

    updateToolbox () {
        this.toolboxUpdateTimeout = false;

        const scale = this.workspace.getFlyout().getWorkspace().scale;
        const selectedCategoryName = this.workspace
            .getToolbox()
            .getSelectedItem()
            .getName();
        const selectedCategoryScrollPosition =
            this.workspace
                .getFlyout()
                .getCategoryScrollPosition(selectedCategoryName) * scale;
        const offsetWithinCategory =
            this.workspace.getFlyout().getWorkspace()
                .getMetrics().viewTop -
            selectedCategoryScrollPosition;

        this.workspace.updateToolbox(this.props.toolboxXML);
        this.workspace.getToolbox().runAfterRerender(() => {
            const newCategoryScrollPosition = this.workspace
                .getFlyout()
                .getCategoryScrollPosition(selectedCategoryName);
            if (newCategoryScrollPosition) {
                this.workspace
                    .getFlyout()
                    .getWorkspace()
                    .scrollbar.setY(
                        (newCategoryScrollPosition * scale) + offsetWithinCategory
                    );
            }
        });
        this.workspace.getToolbox().forceRerender();
        this._renderedToolboxXML = this.props.toolboxXML;

        const queue = this.toolboxUpdateQueue;
        this.toolboxUpdateQueue = [];
        queue.forEach(fn => fn());
    }

    withToolboxUpdates (fn) {
        // if there is a queued toolbox update, we need to wait
        if (this.toolboxUpdateTimeout) {
            this.toolboxUpdateQueue.push(fn);
        } else {
            fn();
        }
    }

    attachVM () {
        this.workspace.addChangeListener(this.props.vm.blockListener);
        this.flyoutWorkspace = this.workspace
            .getFlyout()
            .getWorkspace();
        this.flyoutWorkspace.addChangeListener(this.props.vm.flyoutBlockListener);
        this.flyoutWorkspace.addChangeListener(this.props.vm.monitorBlockListener);
        this.props.vm.addListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.addListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.addListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.addListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.addListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.addListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.addListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.addListener('MONITORS_UPDATE', this.handleMonitorsUpdate);
        this.props.vm.addListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.addListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.addListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.addListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);

        this.props.vm.refreshWorkspace();
    }
    detachVM () {
        this.props.vm.removeListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.removeListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.removeListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.removeListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.removeListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.removeListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.removeListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.removeListener('MONITORS_UPDATE', this.handleMonitorsUpdate);
        this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.removeListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.removeListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
    }

    updateToolboxBlockValue (id, value) {
        this.withToolboxUpdates(() => {
            const block = this.workspace
                .getFlyout()
                .getWorkspace()
                .getBlockById(id);
            if (block) {
                block.inputList[0].fieldRow[0].setValue(value);
            }
        });
    }

    onTargetsUpdate () {
        if (this.props.vm.editingTarget && this.workspace.getFlyout()) {
            ['glide', 'move', 'set'].forEach(prefix => {
                this.updateToolboxBlockValue(`${prefix}x`, Math.round(this.props.vm.editingTarget.x).toString());
                this.updateToolboxBlockValue(`${prefix}y`, Math.round(this.props.vm.editingTarget.y).toString());
            });
        }
    }
    onWorkspaceMetricsChange () {
        const target = this.props.vm.editingTarget;
        if (target && target.id) {
            // Dispatch updateMetrics later, since onWorkspaceMetricsChange may be (very indirectly)
            // called from a reducer, i.e. when you create a custom procedure.
            // TODO: Is this a vehement hack?
            setTimeout(() => {
                this.props.updateMetrics({
                    targetID: target.id,
                    scrollX: this.workspace.scrollX,
                    scrollY: this.workspace.scrollY,
                    scale: this.workspace.scale
                });
            }, 0);
        }
    }
    onScriptGlowOn (data) {
        this.ScratchBlocks.glowStack(data.id, true);
    }
    onScriptGlowOff (data) {
        this.ScratchBlocks.glowStack(data.id, false);
    }
    onBlockGlowOn (/* data */) {
        // No-op, support may be added in the future
    }
    onBlockGlowOff (/* data */) {
        // No-op, support may be added in the future
    }
    onVisualReport (data) {
        this.ScratchBlocks.reportValue(data.id, data.value);
    }
    getToolboxXML () {
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let {editingTarget: target, runtime} = this.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();

            const activeBoard =
                this.props.activeBoardId ?
                    getBoardById(
                        this.props.activeBoardId
                    ) :
                    null;

            const activeBoardCapabilities =
                activeBoard &&
                Array.isArray(activeBoard.capabilities) ?
                    activeBoard.capabilities :
                    [];

            const blocksXML =
                this.props.vm.runtime.getBlocksXML(
                    target,
                    this.props.programMode,
                    activeBoardCapabilities
                );

            const activeBoardCompanionIds = activeBoard ?
                this.props.vm.extensionManager.getExtensionCompanions(
                    activeBoard.extensionId
                ) :
                [];

            const allBoardCompanionIds = Array.from(new Set(
                blocksXML
                    .map(category => extensionData.find(
                        item =>
                            item.kind === 'board' &&
                            item.extensionId === category.id
                    ))
                    .filter(Boolean)
                    .reduce(
                        (companions, board) => companions.concat(
                            this.props.vm.extensionManager.getExtensionCompanions(
                                board.extensionId
                            )
                        ),
                        []
                    )
            ));

            const dynamicBlocksXML = injectExtensionCategoryMode(
                filterBlocksXMLForProjectContext(
                    blocksXML,
                    this.props.activeBoardId,
                    this.state.activeExtensionIds,
                    activeBoardCompanionIds,
                    allBoardCompanionIds
                ),
                this.props.colorMode
            );
            return makeToolboxXML(false, target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0 ? targetSounds[targetSounds.length - 1].name : '',
                getColorsForMode(this.props.colorMode),
                this.props.programMode
            );
        } catch {
            return null;
        }
    }

    /**
     * Preserve scripts containing blocks which are incompatible with the
     * newly active EasyBlox program mode.
     *
     * Stage and Upload continue to have independent VM backing stores.
     * Mode-specific blocks preserved from the inactive backing store remain
     * inert visual context. BOTH blocks remain available so they can be
     * detached and transferred to the active backing store by the VM.
     *
     * @param {!Element} incomingDom XML for the newly active backing store.
     * @returns {!Element} XML including preserved visual context.
     */
    preserveIncompatibleWorkspaceBlocks (incomingDom) {
        const shouldPreserve =
            this._preserveIncompatibleBlocksOnNextWorkspaceUpdate;

        const shouldHydrateInactive =
            this._hydrateInactiveBlocksOnNextWorkspaceUpdate;

        /*
         * Both markers are one-shot. Ordinary workspace refreshes must
         * continue to represent only the canonical active backing store.
         */
        this._preserveIncompatibleBlocksOnNextWorkspaceUpdate = false;
        this._hydrateInactiveBlocksOnNextWorkspaceUpdate = false;

        if (
            (!shouldPreserve && !shouldHydrateInactive) ||
            !incomingDom ||
            !this.workspace
        ) {
            return incomingDom;
        }

        const currentMode =
            this.props.programMode;

        const runtime =
            this.props.vm.runtime;

        const getExecutionMode =
            runtime.getBlockExecutionMode;

        let currentDom = null;

        /*
         * Cold Stage hydration reads the canonical Upload workspace without
         * activating it. The resulting XML is visual source material only.
         */
        if (
            shouldHydrateInactive &&
            currentMode === 'stage' &&
            this.props.activeBoardId &&
            typeof this.props.vm.getEasyBloxWorkspaceXML === 'function' &&
            this.ScratchBlocks.utils &&
            this.ScratchBlocks.utils.xml &&
            typeof this.ScratchBlocks.utils.xml.textToDom === 'function'
        ) {
            const inactiveWorkspaceXML =
                this.props.vm.getEasyBloxWorkspaceXML(
                    'upload',
                    this.props.activeBoardId
                );

            if (inactiveWorkspaceXML) {
                currentDom =
                    this.ScratchBlocks.utils.xml.textToDom(
                        inactiveWorkspaceXML
                    );
            }
        }

        /*
         * A real Stage <-> Upload transition preserves incompatible scripts
         * from the outgoing Blockly workspace.
         */
        if (
            !currentDom &&
            shouldPreserve &&
            this.ScratchBlocks.Xml &&
            typeof this.ScratchBlocks.Xml.workspaceToDom === 'function'
        ) {
            currentDom =
                this.ScratchBlocks.Xml.workspaceToDom(
                    this.workspace
                );
        }

        if (!currentDom) {
            return incomingDom;
        }

        if (typeof getExecutionMode !== 'function') {
            return incomingDom;
        }

        /*
         * IDs already present in the canonical incoming workspace always win.
         * This is particularly important for project-level shared My Block
         * definitions/signatures.
         */
        const existingBlockIds =
            new Set(
                Array.from(
                    incomingDom.getElementsByTagName('block')
                )
                    .map(blockNode =>
                        blockNode.getAttribute('id')
                    )
                    .filter(Boolean)
            );

        const topLevelBlocks =
            Array.from(currentDom.childNodes)
                .filter(node =>
                    node.nodeType === 1 &&
                    node.nodeName.toLowerCase() === 'block'
                );

        topLevelBlocks.forEach(topLevelBlock => {
            /*
             * Preserve the whole visual script when any block inside that
             * script is incompatible. This covers, for example, a BOTH
             * control block containing a STAGE_ONLY motion block.
             */
            const scriptBlocks = [
                topLevelBlock,
                ...Array.from(
                    topLevelBlock.getElementsByTagName('block')
                )
            ];

            const containsIncompatibleBlock =
                scriptBlocks.some(blockNode => {
                    const blockType =
                        blockNode.getAttribute('type');

                    const executionMode =
                        getExecutionMode.call(
                            runtime,
                            blockType
                        );

                    return (
                        executionMode !== null &&
                        executionMode !== 'both' &&
                        executionMode !== currentMode
                    );
                });

            if (!containsIncompatibleBlock) {
                return;
            }

            /*
             * Never introduce duplicate Blockly IDs into the visual workspace.
             * The canonical incoming representation takes precedence.
             */
            const scriptIds =
                scriptBlocks
                    .map(blockNode =>
                        blockNode.getAttribute('id')
                    )
                    .filter(Boolean);

            if (
                scriptIds.some(blockId =>
                    existingBlockIds.has(blockId)
                )
            ) {
                return;
            }

            const preservedScript =
                topLevelBlock.cloneNode(true);

            const preservedBlocks = [
                preservedScript,
                ...Array.from(
                    preservedScript.getElementsByTagName('block')
                )
            ];

            /*
             * Preserved mode-specific blocks still belong exclusively to
             * the inactive backing store and therefore remain inert.
             *
             * BOTH blocks are portable. They must stay interactive so the
             * user can detach them; the VM then transfers their ownership
             * to the active backing store when Blockly emits the move.
             */
            preservedBlocks.forEach(blockNode => {
                const blockType =
                    blockNode.getAttribute('type');

                const executionMode =
                    getExecutionMode.call(
                        runtime,
                        blockType
                    );

                if (executionMode === 'both') {
                    /*
                     * Remove stale inert attributes as well. The outgoing
                     * workspace may itself contain blocks preserved during
                     * an earlier program-mode transition.
                     */
                    blockNode.removeAttribute(
                        'disabled'
                    );
                    blockNode.removeAttribute(
                        'movable'
                    );
                    blockNode.removeAttribute(
                        'deletable'
                    );
                    blockNode.removeAttribute(
                        'editable'
                    );
                } else {
                    /*
                     * A mode-specific block remains inactive for execution
                     * and editing, but it must still behave like a Blockly
                     * object: the student may reposition or delete it.
                     * MOVE and DELETE are routed by the VM to its inactive
                     * backing-store owner.
                     */
                    blockNode.setAttribute(
                        'disabled',
                        'true'
                    );
                    blockNode.removeAttribute(
                        'movable'
                    );
                    blockNode.removeAttribute(
                        'deletable'
                    );
                    blockNode.setAttribute(
                        'editable',
                        'false'
                    );
                }

                const blockId =
                    blockNode.getAttribute('id');

                if (blockId) {
                    existingBlockIds.add(blockId);
                }
            });

            incomingDom.appendChild(
                preservedScript
            );
        });

        return incomingDom;
    }

    onWorkspaceUpdate (data) {
        // When we change sprites, update the toolbox to have the new sprite's blocks
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }

        if (this.props.vm.editingTarget && !this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            this.onWorkspaceMetricsChange();
        }

        // Disable Blockly events during workspace reload. In Blockly v2, Events.fire()
        // enqueues events for async dispatch (after rendering), so the old pattern of
        // removing and re-adding the blockListener no longer prevents spurious events
        // from reaching the VM — the queued events fire after the listener is re-added.
        // Disabling events entirely during the load ensures nothing is queued.
        this.workspace.removeChangeListener(this.toolboxUpdateChangeListener);
        try {
            this.ScratchBlocks.Events.disable();
            let dom =
                this.ScratchBlocks.utils.xml.textToDom(
                    data.xml
                );

            if (
                typeof this.preserveIncompatibleWorkspaceBlocks ===
                    'function'
            ) {
                dom =
                    this.preserveIncompatibleWorkspaceBlocks(
                        dom
                    );
            }

            this.ScratchBlocks.clearWorkspaceAndLoadFromXml(
                dom,
                this.workspace
            );
        } catch (error) {
            // The workspace is likely incomplete. What did update should be
            // functional.
            //
            // Instead of throwing the error, by logging it and continuing as
            // normal lets the other workspace update processes complete in the
            // gui and vm, which lets the vm run even if the workspace is
            // incomplete. Throwing the error would keep things like setting the
            // correct editing target from happening which can interfere with
            // some blocks and processes in the vm.
            if (error.message) {
                error.message = `Workspace Update Error: ${error.message}`;
            }
            log.error(error);
        } finally {
            this.ScratchBlocks.Events.enable();
        }

        this.updateWorkspaceExecutionMode();

        if (this.props.vm.editingTarget && this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            const {scrollX, scrollY, scale} = this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id];
            this.workspace.scrollX = scrollX;
            this.workspace.scrollY = scrollY;
            this.workspace.scale = scale;
            this.workspace.resize();
        }

        // Clear the undo state of the workspace since this is a
        // fresh workspace and we don't want any changes made to another sprites
        // workspace to be 'undone' here.
        this.workspace.clearUndo();
        // Let events get flushed before readding the toolbox-updater listener
        // to avoid unneeded refreshes.
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.workspace.addChangeListener(
                    this.toolboxUpdateChangeListener
                );
            });
        });
    }
    handleMonitorsUpdate (monitors) {
        // Update the checkboxes of the relevant monitors.
        // TODO: What about monitors that have fields? See todo in scratch-vm blocks.js changeBlock:
        // https://github.com/LLK/scratch-vm/blob/2373f9483edaf705f11d62662f7bb2a57fbb5e28/src/engine/blocks.js#L569-L576
        const flyout = this.workspace.getFlyout();
        for (const monitor of monitors.values()) {
            const blockId = monitor.get('id');
            const isVisible = monitor.get('visible');
            flyout.setCheckboxState(blockId, isVisible);
            // We also need to update the isMonitored flag for this block on the VM, since it's used to determine
            // whether the checkbox is activated or not when the checkbox is re-displayed (e.g. local variables/blocks
            // when switching between sprites).
            const block = this.props.vm.runtime.monitorBlocks.getBlock(blockId);
            if (block) {
                block.isMonitored = isVisible;
            }
        }
    }
    handleExtensionAdded (categoryInfo, shouldActivate = true) {
        analytics.event({
            category: 'extensions',
            action: 'added',
            label: categoryInfo.id
        });

        const extension = extensionData.find(
            item => item.extensionId === categoryInfo.id
        );

        if (
            shouldActivate &&
            extension &&
            extension.kind === 'extension'
        ) {
            this.handleExtensionActivate(categoryInfo.id);
        }

        const defineBlocks = blockInfoArray => {
            if (blockInfoArray && blockInfoArray.length > 0) {
                const staticBlocksJson = [];
                const dynamicBlocksInfo = [];
                blockInfoArray.forEach(blockInfo => {
                    if (blockInfo.info && blockInfo.info.isDynamic) {
                        dynamicBlocksInfo.push(blockInfo);
                    } else if (blockInfo.json) {
                        staticBlocksJson.push(injectExtensionBlockIcons(blockInfo.json, this.props.colorMode));
                    }
                    // otherwise it's a non-block entry such as '---'
                });

                this.ScratchBlocks.defineBlocksWithJsonArray(staticBlocksJson);
                dynamicBlocksInfo.forEach(blockInfo => {
                    // This is creating the block factory / constructor -- NOT a specific instance of the block.
                    // The factory should only know static info about the block: the category info and the opcode.
                    // Anything else will be picked up from the XML attached to the block instance.
                    const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
                    const blockDefinition =
                        defineDynamicBlock(this.ScratchBlocks, categoryInfo, blockInfo, extendedOpcode);
                    this.ScratchBlocks.Blocks[extendedOpcode] = blockDefinition;
                });
            }
        };

        // scratch-blocks implements a menu or custom field as a special kind of block ("shadow" block)
        // these actually define blocks and MUST run regardless of the UI state
        defineBlocks(
            Object.getOwnPropertyNames(categoryInfo.customFieldTypes)
                .map(fieldTypeName => categoryInfo.customFieldTypes[fieldTypeName].scratchBlocksDefinition));
        defineBlocks(categoryInfo.menus);
        defineBlocks(categoryInfo.blocks);
        // Note that Blockly uses the UK spelling of "colour", so fields that
        // interact directly with Blockly follow that convention, while Scratch
        // code uses the US spelling of "color".
        let colourPrimary = categoryInfo.color1;
        let colourSecondary = categoryInfo.color2;
        let colourTertiary = categoryInfo.color3;
        let colourQuaternary = categoryInfo.color3;
        if (this.props.colorMode !== DEFAULT_MODE) {
            const colors = getExtensionColors(this.props.colorMode);
            colourPrimary = colors.colourPrimary;
            colourSecondary = colors.colourSecondary;
            colourTertiary = colors.colourTertiary;
            colourQuaternary = colors.colourQuaternary;
        }
        this.ScratchBlocks.getMainWorkspace()
            .getTheme()
            .setBlockStyle(categoryInfo.id, {
                colourPrimary,
                colourSecondary,
                colourTertiary,
                colourQuaternary
            });
        this.ScratchBlocks.getMainWorkspace()
            .getTheme()
            .setBlockStyle(`${categoryInfo.id}_selected`, {
                colourPrimary: colourQuaternary,
                colourSecondary: colourQuaternary,
                colourTertiary: colourQuaternary,
                colourQuaternary: colourQuaternary
            });
        this.ScratchBlocks.getMainWorkspace().setTheme(
            this.ScratchBlocks.getMainWorkspace().getTheme()
        );
        // Update the toolbox with new blocks if possible
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }
    }
    handleExtensionActivate (extensionId) {
        this.setState(state => {
            if (state.activeExtensionIds.includes(extensionId)) {
                return null;
            }

            return {
                activeExtensionIds: [
                    ...state.activeExtensionIds,
                    extensionId
                ]
            };
        });
    }

    handleExtensionRemove (extensionId) {
        this.setState(state => ({
            activeExtensionIds: state.activeExtensionIds.filter(
                activeExtensionId => activeExtensionId !== extensionId
            )
        }));
    }
    handleBlocksInfoUpdate (categoryInfo) {
        this.handleExtensionAdded(categoryInfo, false);
    }
    handleExtensionSelectionRequest (prevProps) {
        if (
            this.props.extensionSelectionRequest === prevProps.extensionSelectionRequest ||
            !this.props.requestedExtensionId
        ) {
            return;
        }

        const extensionId = this.props.requestedExtensionId;
        const shouldConnect = this.props.requestedExtensionShouldConnect;

        if (this.props.vm.extensionManager.isExtensionLoaded(extensionId)) {
            this.handleCategorySelected(extensionId, shouldConnect);
            return;
        }

        this.props.vm.extensionManager.loadExtensionURL(extensionId).then(() => {
            this.handleCategorySelected(extensionId, shouldConnect);
        });
    }
    handleCategorySelected (categoryId, shouldConnect = true) {
        const extension = extensionData.find(ext => ext.extensionId === categoryId);

        if (
            shouldConnect &&
            extension &&
            extension.launchPeripheralConnectionFlow
        ) {
            this.handleConnectionModalStart(categoryId);
        }

        this.withToolboxUpdates(() => {
            const toolbox = this.workspace.getToolbox();
            toolbox.setSelectedItem(toolbox.getToolboxItemById(categoryId));
        });
    }
    setBlocks (blocks) {
        this.blocks = blocks;
    }

    handleVariableCreated (variableId) {
        const valueType = this._pendingEasyBloxVariableType;
        this._pendingEasyBloxVariableType = null;

        if (!variableId || !valueType) {
            return;
        }

        if (this.props.programMode === 'upload') {
            this.props.vm.setVariableEasyBloxValueType(
                null,
                variableId,
                valueType
            );
            return;
        }

        const ownerTarget =
            this.props.vm.runtime.targets.find(target =>
                target &&
                target.variables &&
                Object.prototype.hasOwnProperty.call(
                    target.variables,
                    variableId
                )
            );

        if (!ownerTarget) {
            return;
        }

        this.props.vm.setVariableEasyBloxValueType(
            ownerTarget.id,
            variableId,
            valueType
        );
    }

    handlePromptStart (message, defaultValue, callback, optTitle, optVarType) {
        this._pendingEasyBloxVariableType = null;
        const p = {prompt: {callback, message, defaultValue}};
        p.prompt.title = optTitle ? optTitle :
            this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;
        p.prompt.varType = typeof optVarType === 'string' ?
            optVarType : this.ScratchBlocks.SCALAR_VARIABLE_TYPE;

        p.prompt.showEasyBloxVariableTypeOptions =
            optVarType === this.ScratchBlocks.SCALAR_VARIABLE_TYPE &&
            p.prompt.title === this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;

        const isUploadProgram =
            this.props.programMode === 'upload';

        p.prompt.showVariableOptions = // This flag means that we should show variable/list options about scope
            !isUploadProgram &&
            optVarType !== this.ScratchBlocks.BROADCAST_MESSAGE_VARIABLE_TYPE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_VARIABLE_MODAL_TITLE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_LIST_MODAL_TITLE;

        p.prompt.showCloudOption =
            !isUploadProgram &&
            optVarType === this.ScratchBlocks.SCALAR_VARIABLE_TYPE &&
            this.props.canUseCloud;
        this.setState(p);
    }
    handleConnectionModalStart (extensionId) {
        this.props.onOpenConnectionModal(extensionId);
    }
    handleStatusButtonUpdate () {
        this.workspace.getFlyout().refreshStatusButtons();
    }
    handleOpenSoundRecorder () {
        this.props.onOpenSoundRecorder();
    }

    /*
     * Pass along information about proposed name and variable options (scope and isCloud)
     * and additional potentially conflicting variable names from the VM
     * to the variable validation prompt callback used in scratch-blocks.
     */
    handlePromptCallback (input, variableOptions = {}) {
        this._pendingEasyBloxVariableType =
            this.state.prompt.showEasyBloxVariableTypeOptions ?
                variableOptions.easybloxValueType :
                null;

        this.state.prompt.callback(
            input,
            this.props.vm.runtime.getAllVarNamesOfType(this.state.prompt.varType),
            variableOptions);
        this.handlePromptClose();
    }
    handlePromptClose () {
        this.setState({prompt: null});
    }
    handleCustomProceduresClose (data) {
        this.props.onRequestCloseCustomProcedures(data);
        const ws = this.workspace;
        this.updateToolbox();
        ws.getToolbox().selectCategoryByName('myBlocks');
    }
    handleDrop (dragInfo) {
        fetch(dragInfo.payload.bodyUrl)
            .then(response => response.json())
            .then(blocks => this.props.vm.shareBlocksToTarget(blocks, this.props.vm.editingTarget.id))
            .then(() => {
                this.props.vm.refreshWorkspace();
            });
    }
    render () {
         
        const {
            anyModalVisible,
            canUseCloud,
            customProceduresVisible,
            extensionLibraryVisible,
            options,
            stageSize,
            vm,
            isRtl,
            isVisible,
            onActivateColorPicker,
            onOpenConnectionModal,
            onOpenSoundRecorder,
            updateToolboxState,
            onActivateCustomProcedures,
            onRequestCloseExtensionLibrary,
            onRequestCloseCustomProcedures,
            toolboxXML,
            updateMetrics: updateMetricsProp,
            useCatBlocks,
            workspaceMetrics,
            colorMode,
            ...props
        } = this.props;
         
        return (
            <React.Fragment>
                <DroppableBlocks
                    componentRef={this.setBlocks}
                    onDrop={this.handleDrop}
                    {...props}
                />
                {this.state.prompt ? (
                    <Prompt
                        defaultValue={this.state.prompt.defaultValue}
                        isStage={vm.runtime.getEditingTarget().isStage}
                        showListMessage={this.state.prompt.varType === this.ScratchBlocks.LIST_VARIABLE_TYPE}
                        label={this.state.prompt.message}
                        showCloudOption={this.state.prompt.showCloudOption}
                        showEasyBloxVariableTypeOptions={
                            this.state.prompt.showEasyBloxVariableTypeOptions
                        }
                        showVariableOptions={this.state.prompt.showVariableOptions}
                        title={this.state.prompt.title}
                        vm={vm}
                        onCancel={this.handlePromptClose}
                        onOk={this.handlePromptCallback}
                    />
                ) : null}
                {extensionLibraryVisible ? (
                    <ExtensionLibrary
                        activeExtensionIds={this.state.activeExtensionIds}
                        vm={vm}
                        onCategorySelected={this.handleCategorySelected}
                        onExtensionActivate={this.handleExtensionActivate}
                        onExtensionRemove={this.handleExtensionRemove}
                        onRequestClose={onRequestCloseExtensionLibrary}
                    />
                ) : null}
                {customProceduresVisible ? (
                    <CustomProcedures
                        options={{
                            media: options.media
                        }}
                        onRequestClose={this.handleCustomProceduresClose}
                        colorMode={colorMode}
                    />
                ) : null}
            </React.Fragment>
        );
    }
}

Blocks.propTypes = {
    anyModalVisible: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    customProceduresVisible: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    isRtl: PropTypes.bool,
    isVisible: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(PropTypes.string),
    onActivateColorPicker: PropTypes.func,
    onActivateCustomProcedures: PropTypes.func,
    onOpenConnectionModal: PropTypes.func,
    onOpenSoundRecorder: PropTypes.func,
    onRequestCloseCustomProcedures: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    extensionSelectionRequest: PropTypes.number,
    requestedExtensionId: PropTypes.string,
    requestedExtensionShouldConnect: PropTypes.bool,
    activeBoardId: PropTypes.string,
    programMode: PropTypes.oneOf([
        'stage',
        'upload'
    ]),
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    }),
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    colorMode: PropTypes.oneOf(Object.keys(colorModeMap)),
    toolboxXML: PropTypes.string,
    updateMetrics: PropTypes.func,
    updateToolboxState: PropTypes.func,
    useCatBlocks: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    workspaceMetrics: PropTypes.shape({
        targets: PropTypes.objectOf(PropTypes.object)
    })
};

Blocks.defaultOptions = {
    zoom: {
        controls: true,
        wheel: true,
        pinch: true,
        startScale: BLOCKS_DEFAULT_SCALE
    },
    move: {
        wheel: true
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: '#ddd'
    },
    comments: true,
    collapse: false,
    sounds: false,
    trashcan: false,
    modalInputs: false
};

Blocks.defaultProps = {
    extensionSelectionRequest: 0,
    requestedExtensionId: null,
    isVisible: true,
    options: Blocks.defaultOptions,
    requestedExtensionShouldConnect: true,
    activeBoardId: null,
    programMode: 'stage',
    colorMode: DEFAULT_MODE

};

const mapStateToProps = state => ({
    anyModalVisible: (
        Object.keys(state.scratchGui.modals).some(key => state.scratchGui.modals[key]) ||
        state.scratchGui.mode.isFullScreen
    ),
    extensionLibraryVisible: state.scratchGui.modals.extensionLibrary,
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.messages,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    customProceduresVisible: state.scratchGui.customProcedures.active,
    workspaceMetrics: state.scratchGui.workspaceMetrics,
    useCatBlocks: isTimeTravel2020(state) || state.scratchGui.settings.theme === CAT_BLOCKS_THEME
});

const mapDispatchToProps = dispatch => ({
    onActivateColorPicker: callback => dispatch(activateColorPicker(callback)),
    onActivateCustomProcedures: (data, callback) => dispatch(activateCustomProcedures(data, callback)),
    onOpenConnectionModal: id => {
        dispatch(setConnectionModalExtensionId(id));
        dispatch(openConnectionModal());
    },
    onOpenSoundRecorder: () => {
        dispatch(activateTab(SOUNDS_TAB_INDEX));
        dispatch(openSoundRecorder());
    },
    onRequestCloseExtensionLibrary: () => {
        dispatch(closeExtensionLibrary());
    },
    onRequestCloseCustomProcedures: data => {
        dispatch(deactivateCustomProcedures(data));
    },
    updateToolboxState: toolboxXML => {
        dispatch(updateToolbox(toolboxXML));
    },
    updateMetrics: metrics => {
        dispatch(updateMetrics(metrics));
    }
});

export {Blocks};
export default errorBoundaryHOC('Blocks')(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(Blocks)
);
