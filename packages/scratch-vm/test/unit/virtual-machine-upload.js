const tap = require('tap');
const VirtualMachine = require('../../src/virtual-machine');
const Runtime = require('../../src/engine/runtime');
const Blocks = require('../../src/engine/blocks');
const Variable = require('../../src/engine/variable');
const Sprite = require('../../src/sprites/sprite');

const test = tap.test;

const createRuntimeWithBlocks = blockDefinitions => {
    const runtime = new Runtime();
    const blocks = new Blocks(runtime);

    blockDefinitions.forEach(block =>
        blocks.createBlock(block)
    );

    runtime.targets = [{
        isOriginal: true,
        blocks
    }];

    return runtime;
};

const loadCanonicalArduinoUnoUploadProgram = (
    vm,
    blockDefinitions
) => {
    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    blockDefinitions.forEach(block =>
        uploadProgram.blocks.createBlock(block)
    );

    return uploadProgram;
};

const createUploadHat = (next = null) => ({
    id: 'upload_hat',
    opcode: 'arduinoUno_whenArduinoUnoStart',
    next,
    parent: null,
    inputs: {},
    fields: {},
    topLevel: true,
    shadow: false
});

const createNumberShadow = (
    id,
    parent,
    value,
    opcode = 'math_number'
) => ({
    id,
    opcode,
    next: null,
    parent,
    inputs: {},
    fields: {
        NUM: {
            name: 'NUM',
            value: String(value)
        }
    },
    topLevel: false,
    shadow: true
});

const createExtensionMenuShadow = (
    id,
    parent,
    opcode,
    fieldName,
    value
) => ({
    id,
    opcode,
    next: null,
    parent,
    inputs: {},
    fields: {
        [fieldName]: {
            name: fieldName,
            value: String(value)
        }
    },
    topLevel: false,
    shadow: true
});

test('VirtualMachine routes Blockly events between Stage and canonical Upload program', t => {
    const vm = new VirtualMachine();
    const stageEvents = [];
    const uploadEvents = [];

    vm.editingTarget = {
        blocks: {
            blocklyListen: event => {
                stageEvents.push(event);
            }
        }
    };

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.blocks.blocklyListen = event => {
        uploadEvents.push(event);
    };

    const initialStageEvent = {
        type: 'create',
        blockId: 'stage_block'
    };

    vm.blockListener(initialStageEvent);

    t.same(
        stageEvents,
        [initialStageEvent],
        'Stage mode routes Blockly events to the current editing target'
    );

    t.same(
        uploadEvents,
        [],
        'Stage mode does not mutate the Upload program'
    );

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    const uploadEvent = {
        type: 'create',
        blockId: 'upload_block'
    };

    vm.blockListener(uploadEvent);

    t.same(
        uploadEvents,
        [uploadEvent],
        'Upload mode routes Blockly events to the canonical Upload program'
    );

    t.same(
        stageEvents,
        [initialStageEvent],
        'Upload mode does not mutate the Stage editing target'
    );

    vm.setProgramContext(
        'stage',
        null
    );

    const restoredStageEvent = {
        type: 'create',
        blockId: 'stage_block_after_upload'
    };

    vm.blockListener(restoredStageEvent);

    t.same(
        stageEvents,
        [
            initialStageEvent,
            restoredStageEvent
        ],
        'leaving Upload mode restores Stage Blockly routing'
    );

    t.same(
        uploadEvents,
        [uploadEvent],
        'Upload program stops receiving Blockly events after returning to Stage'
    );

    t.end();
});

test('VirtualMachine shares EasyBlox variables between Stage and Upload contexts', t => {
    const vm = new VirtualMachine();

    const stageVariables = Object.create(null);
    const stageBlocks = new Blocks(vm.runtime);

    let sharedDeleteCount = 0;

    stageVariables.shared_counter = {
        id: 'shared_counter',
        name: 'contador',
        type: '',
        value: 0,
        isCloud: false,
        easybloxValueType: null
    };

    stageBlocks.createBlock({
        id: 'stage_variable_reporter',
        opcode: 'data_variable',
        next: null,
        parent: null,
        inputs: {},
        fields: {
            VARIABLE: {
                name: 'VARIABLE',
                id: 'shared_counter',
                value: 'contador',
                variableType: ''
            }
        },
        topLevel: true,
        shadow: false
    });

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        variables: stageVariables,
        blocks: stageBlocks,

        lookupVariableById: variableId =>
            stageVariables[variableId] || null,

        lookupVariableByNameAndType: () => null,

        createVariable: (
            variableId,
            variableName,
            variableType,
            isCloud
        ) => {
            if (!stageVariables[variableId]) {
                stageVariables[variableId] = {
                    id: variableId,
                    name: variableName,
                    type: variableType,
                    value: 0,
                    isCloud,
                    easybloxValueType: null
                };
            }
        },

        renameVariable: (variableId, newName) => {
            if (stageVariables[variableId]) {
                stageVariables[variableId].name = newName;

                stageBlocks.updateBlocksAfterVarRename(
                    variableId,
                    newName
                );
            }
        },

        deleteVariable: variableId => {
            sharedDeleteCount++;

            delete stageVariables[variableId];
        }
    };

    vm.runtime.targets = [stage];

    vm.runtime.getEditingTarget = () => stage;
    vm.runtime.getTargetForStage = () => stage;

    vm.editingTarget = stage;

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.blocks.createBlock({
        id: 'upload_variable_reporter',
        opcode: 'data_variable',
        next: null,
        parent: null,
        inputs: {},
        fields: {
            VARIABLE: {
                name: 'VARIABLE',
                id: 'shared_counter',
                value: 'contador',
                variableType: ''
            }
        },
        topLevel: true,
        shadow: false
    });

    t.equal(
        uploadProgram.lookupVariableById('shared_counter'),
        stageVariables.shared_counter,
        'a Stage-created variable is the same logical variable in Upload'
    );

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    vm.blockListener({
        type: 'var_create',
        varId: 'created_in_upload',
        varName: 'criada_no_upload',
        varType: '',
        isLocal: false,
        isCloud: false
    });

    t.ok(
        stageVariables.created_in_upload,
        'a variable created in Upload is created in the shared project variable map'
    );

    t.equal(
        uploadProgram.lookupVariableById('created_in_upload'),
        stageVariables.created_in_upload,
        'Upload resolves a newly created variable through the shared project variable map'
    );

    vm.blockListener({
        type: 'var_rename',
        varId: 'shared_counter',
        oldName: 'contador',
        newName: 'total'
    });

    t.equal(
        stageVariables.shared_counter.name,
        'total',
        'renaming a variable in Upload renames the shared project variable'
    );

    t.equal(
        stageBlocks
            .getBlock('stage_variable_reporter')
            .fields.VARIABLE.value,
        'total',
        'renaming in Upload updates Stage variable block references'
    );

    t.equal(
        uploadProgram.blocks
            .getBlock('upload_variable_reporter')
            .fields.VARIABLE.value,
        'total',
        'renaming in Upload updates Upload variable block references'
    );

    t.equal(
        vm.setVariableEasyBloxValueType(
            null,
            'shared_counter',
            'TEXT'
        ),
        true,
        'Upload can update the EasyBlox type of the shared variable'
    );

    t.equal(
        stageVariables.shared_counter.easybloxValueType,
        'TEXT',
        'EasyBlox type metadata is shared between Stage and Upload'
    );

    t.equal(
        stageVariables.shared_counter.value,
        '',
        'TEXT normalization updates the shared variable value'
    );

    vm.blockListener({
        type: 'var_delete',
        varId: 'shared_counter'
    });

    t.notOk(
        stageVariables.shared_counter,
        'deleting a variable in Upload deletes the shared project variable'
    );

    t.equal(
        sharedDeleteCount,
        1,
        'deleting a variable in Upload delegates to the shared project variable owner'
    );

    t.end();
});

test('VirtualMachine shares My Block definitions between Stage and Upload contexts', t => {
    const vm = new VirtualMachine();

    const stageBlocks = new Blocks(vm.runtime);

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        variables: Object.create(null),
        comments: Object.create(null),
        blocks: stageBlocks
    };

    vm.runtime.targets = [stage];
    vm.runtime.getTargetForStage = () => stage;
    vm.runtime.getEditingTarget = () => stage;
    vm.editingTarget = stage;

    stageBlocks.createBlock({
        id: 'stage_shared_procedure',
        opcode: 'procedures_definition',
        next: null,
        parent: null,
        inputs: {
            custom_block: {
                name: 'custom_block',
                block: 'stage_shared_prototype',
                shadow: null
            }
        },
        fields: {},
        topLevel: true,
        shadow: false
    });

    stageBlocks.createBlock({
        id: 'stage_shared_prototype',
        opcode: 'procedures_prototype',
        next: null,
        parent: 'stage_shared_procedure',
        inputs: {},
        fields: {},
        mutation: {
            tagName: 'mutation',
            children: [],
            proccode: 'piscar',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            easybloxargumenttypes: '[]',
            warp: 'false'
        },
        topLevel: false,
        shadow: false
    });

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    [
        createUploadHat('upload_shared_call'),
        {
            id: 'upload_shared_call',
            opcode: 'procedures_call',
            next: null,
            parent: 'upload_hat',
            inputs: {},
            fields: {},
            mutation: {
                tagName: 'mutation',
                children: [],
                proccode: 'piscar',
                argumentids: '[]'
            },
            topLevel: false,
            shadow: false
        },
        {
            id: 'upload_shared_procedure',
            opcode: 'procedures_definition',
            next: null,
            parent: null,
            inputs: {
                custom_block: {
                    name: 'custom_block',
                    block: 'upload_shared_prototype',
                    shadow: null
                }
            },
            fields: {},
            topLevel: true,
            shadow: false
        },
        {
            id: 'upload_shared_prototype',
            opcode: 'procedures_prototype',
            next: null,
            parent: 'upload_shared_procedure',
            inputs: {},
            fields: {},
            mutation: {
                tagName: 'mutation',
                children: [],
                proccode: 'ajustar',
                argumentids: '[]',
                argumentnames: '[]',
                argumentdefaults: '[]',
                easybloxargumenttypes: '[]',
                warp: 'false'
            },
            topLevel: false,
            shadow: false
        }
    ].forEach(block =>
        uploadProgram.blocks.createBlock(block)
    );

    let workspaceXml = '';

    vm.on('workspaceUpdate', data => {
        workspaceXml = data.xml;
    });

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    vm.emitWorkspaceUpdate();

    t.match(
        workspaceXml,
        /id="stage_shared_procedure"/,
        'Upload workspace exposes the My Block definition created in Stage'
    );

    let code = '';

    t.doesNotThrow(
        () => {
            code = vm.generateArduinoUnoUploadCode();
        },
        'Upload generation resolves a My Block definition created in Stage'
    );

    t.match(
        code,
        /void\s+piscar\s*\(\)/,
        'generated Upload code contains the shared My Block definition'
    );

    t.match(
        code,
        /piscar\s*\(\s*\);/,
        'generated Upload code contains the shared My Block call'
    );

    vm.setProgramContext(
        'stage',
        null
    );

    vm.emitWorkspaceUpdate();

    t.match(
        workspaceXml,
        /id="upload_shared_procedure"/,
        'Stage workspace exposes the My Block definition created in Upload'
    );

    t.end();
});

test('VirtualMachine shares My Block signatures while keeping Stage and Upload bodies independent', t => {
    const vm = new VirtualMachine();

    const stageBlocks = new Blocks(vm.runtime);

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        variables: Object.create(null),
        comments: Object.create(null),
        blocks: stageBlocks
    };

    vm.runtime.targets = [stage];
    vm.runtime.getTargetForStage = () => stage;
    vm.runtime.getEditingTarget = () => stage;
    vm.editingTarget = stage;

    stageBlocks.createBlock({
        id: 'shared_procedure',
        opcode: 'procedures_definition',
        next: 'stage_procedure_body',
        parent: null,
        inputs: {
            custom_block: {
                name: 'custom_block',
                block: 'shared_prototype',
                shadow: null
            }
        },
        fields: {},
        topLevel: true,
        shadow: false
    });

    stageBlocks.createBlock({
        id: 'shared_prototype',
        opcode: 'procedures_prototype',
        next: null,
        parent: 'shared_procedure',
        inputs: {},
        fields: {},
        mutation: {
            tagName: 'mutation',
            children: [],
            proccode: 'piscar',
            argumentids: '[]',
            argumentnames: '[]',
            argumentdefaults: '[]',
            easybloxargumenttypes: '[]',
            warp: 'false'
        },
        topLevel: false,
        shadow: false
    });

    stageBlocks.createBlock({
        id: 'stage_procedure_body',
        opcode: 'control_wait',
        next: null,
        parent: 'shared_procedure',
        inputs: {},
        fields: {},
        topLevel: false,
        shadow: false
    });

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    const uploadDefinition =
        uploadProgram.blocks.getBlock('shared_procedure');

    t.ok(
        uploadDefinition,
        'Stage My Block definition is mirrored into Upload'
    );

    t.equal(
        uploadDefinition.next,
        null,
        'Stage My Block body is not copied into Upload'
    );

    t.equal(
        stageBlocks.getBlock('shared_procedure').next,
        'stage_procedure_body',
        'Stage keeps its own My Block implementation body'
    );

    uploadProgram.blocks.createBlock({
        id: 'upload_procedure_body',
        opcode: 'arduinoUno_digitalWrite',
        next: null,
        parent: 'shared_procedure',
        inputs: {},
        fields: {},
        topLevel: false,
        shadow: false
    });

    uploadDefinition.next = 'upload_procedure_body';

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    const uploadPrototype =
        uploadProgram.blocks.getBlock('shared_prototype');

    uploadPrototype.mutation = {
        tagName: 'mutation',
        children: [],
        proccode: 'piscar %s',
        argumentids: '["arg_duration"]',
        argumentnames: '["tempo"]',
        argumentdefaults: '[""]',
        easybloxargumenttypes: '["INTEGER"]',
        warp: 'false'
    };

    uploadProgram.blocks.resetCache();

    vm.setProgramContext(
        'stage',
        null
    );

    const stagePrototype =
        stageBlocks.getBlock('shared_prototype');

    t.equal(
        stagePrototype.mutation.proccode,
        'piscar %s',
        'editing a My Block signature in Upload updates Stage'
    );

    t.equal(
        stagePrototype.mutation.argumentids,
        '["arg_duration"]',
        'shared parameter identity is preserved across modes'
    );

    t.equal(
        stagePrototype.mutation.easybloxargumenttypes,
        '["INTEGER"]',
        'shared EasyBlox parameter type is preserved across modes'
    );

    t.equal(
        stageBlocks.getBlock('shared_procedure').next,
        'stage_procedure_body',
        'signature synchronization preserves the Stage implementation body'
    );

    t.equal(
        uploadProgram.blocks.getBlock('shared_procedure').next,
        'upload_procedure_body',
        'signature synchronization preserves the Upload implementation body'
    );

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    vm.blockListener({
        type: 'delete',
        blockId: 'shared_procedure'
    });

    t.equal(
        stageBlocks.getBlock('shared_procedure'),
        undefined,
        'deleting a shared My Block in Upload removes its Stage definition'
    );

    t.equal(
        uploadProgram.blocks.getBlock('shared_procedure'),
        undefined,
        'deleting a shared My Block removes its Upload definition'
    );

    t.equal(
        stageBlocks.getBlock('stage_procedure_body'),
        undefined,
        'deleting the shared definition removes the Stage-specific body'
    );

    t.equal(
        uploadProgram.blocks.getBlock('upload_procedure_body'),
        undefined,
        'deleting the shared definition removes the Upload-specific body'
    );

    t.end();
});

test('VirtualMachine keeps EasyBlox variable metadata shared across Stage and Upload contexts', t => {
    const vm = new VirtualMachine();

    const sharedVariable = {
        id: 'shared_variable',
        name: 'variavel',
        type: '',
        value: 0,
        isCloud: false,
        easybloxValueType: null
    };

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        variables: {
            shared_variable: sharedVariable
        },

        lookupVariableById: variableId =>
            variableId === 'shared_variable' ?
                sharedVariable :
                null
    };

    vm.runtime.targets = [stage];

    vm.runtime.getTargetForStage = () => stage;

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    let projectChangedCount = 0;

    vm.runtime.emitProjectChanged = () => {
        projectChangedCount += 1;
    };

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    t.equal(
        vm.setVariableEasyBloxValueType(
            null,
            'shared_variable',
            'TEXT'
        ),
        true,
        'Upload resolves the shared variable without a Scratch target ID'
    );

    t.equal(
        sharedVariable.easybloxValueType,
        'TEXT',
        'Upload writes EasyBlox type metadata to the shared variable'
    );

    t.equal(
        sharedVariable.value,
        '',
        'TEXT normalization updates the shared variable value'
    );

    t.equal(
        projectChangedCount,
        1,
        'shared metadata update marks the project as changed'
    );

    t.equal(
        vm.setVariableEasyBloxValueType(
            null,
            'missing_shared_variable',
            'INTEGER'
        ),
        false,
        'unknown shared variable ID is rejected'
    );

    t.equal(
        projectChangedCount,
        1,
        'rejected shared variable update does not mark the project as changed'
    );

    vm.setProgramContext(
        'stage',
        null
    );

    t.equal(
        vm.setVariableEasyBloxValueType(
            'stage',
            'shared_variable',
            'INTEGER'
        ),
        true,
        'Stage continues to resolve the shared variable through its target ID'
    );

    t.equal(
        sharedVariable.easybloxValueType,
        'INTEGER',
        'Stage updates the same EasyBlox type metadata'
    );

    t.equal(
        sharedVariable.value,
        '',
        'changing metadata back to INTEGER does not invent a new runtime value'
    );

    t.equal(
        projectChangedCount,
        2,
        'successful Stage and Upload metadata updates each mark the project as changed'
    );

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    t.equal(
        uploadProgram.lookupVariableById('shared_variable'),
        sharedVariable,
        'Upload continues resolving the exact shared variable instance'
    );

    t.equal(
        uploadProgram.lookupVariableById('shared_variable').easybloxValueType,
        'INTEGER',
        'metadata written from Stage remains visible in Upload'
    );

    t.end();
});

test('VirtualMachine emits shared variables with independent Stage and Upload scripts', t => {
    const vm = new VirtualMachine();

    const stageVariables = Object.create(null);
    const stageBlocks = new Blocks(vm.runtime);

    const createSharedVariable = (
        id,
        name
    ) => {
        const variable = new Variable(
            id,
            name,
            Variable.SCALAR_TYPE,
            false
        );

        variable.easybloxValueType = 'DECIMAL';

        stageVariables[id] = variable;

        return variable;
    };

    createSharedVariable(
        'stage_variable',
        'stageCounter'
    );

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        variables: stageVariables,
        comments: Object.create(null),
        blocks: stageBlocks,

        lookupVariableById: variableId =>
            stageVariables[variableId] || null,

        createVariable: (
            variableId,
            variableName,
            variableType,
            isCloud
        ) => {
            if (!stageVariables[variableId]) {
                stageVariables[variableId] =
                    new Variable(
                        variableId,
                        variableName,
                        variableType,
                        isCloud
                    );
            }
        }
    };

    vm.runtime.targets = [stage];
    vm.runtime.getTargetForStage = () => stage;
    vm.runtime.getEditingTarget = () => stage;
    vm.editingTarget = stage;

    stageBlocks.createBlock({
        id: 'stage_only_block',
        opcode: 'operator_add',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false
    });

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.createVariable(
        'upload_variable',
        'uploadCounter',
        Variable.SCALAR_TYPE
    );

    uploadProgram.blocks.createBlock({
        id: 'upload_only_block',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false
    });

    let workspaceXml = '';

    vm.on('workspaceUpdate', data => {
        workspaceXml = data.xml;
    });

    vm.setProgramContext(
        'stage',
        null
    );

    vm.emitWorkspaceUpdate();

    t.match(
        workspaceXml,
        /stage_variable/,
        'Stage workspace contains variables created from Stage'
    );

    t.match(
        workspaceXml,
        /upload_variable/,
        'Stage workspace contains variables created from Upload'
    );

    t.match(
        workspaceXml,
        /stage_only_block/,
        'Stage workspace contains Stage scripts'
    );

    t.notMatch(
        workspaceXml,
        /upload_only_block/,
        'Stage workspace does not contain Upload scripts'
    );

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    vm.emitWorkspaceUpdate();

    t.match(
        workspaceXml,
        /stage_variable/,
        'Upload workspace contains variables created from Stage'
    );

    t.match(
        workspaceXml,
        /upload_variable/,
        'Upload workspace contains variables created from Upload'
    );

    t.match(
        workspaceXml,
        /upload_only_block/,
        'Upload workspace contains Upload scripts'
    );

    t.notMatch(
        workspaceXml,
        /stage_only_block/,
        'Upload workspace does not contain Stage scripts'
    );

    vm.setProgramContext(
        'stage',
        null
    );

    vm.emitWorkspaceUpdate();

    t.match(
        workspaceXml,
        /stage_only_block/,
        'returning to Stage restores the independent Stage scripts'
    );

    t.notMatch(
        workspaceXml,
        /upload_only_block/,
        'returning to Stage keeps Upload scripts isolated'
    );

    t.end();
});

test('VirtualMachine exposes Upload workspace XML without activating it', t => {
    const vm = new VirtualMachine();

    vm.getOrCreateUploadProgram(
        'arduino-uno'
    );

    const xml =
        vm.getEasyBloxWorkspaceXML(
            'upload',
            'arduino-uno'
        );

    t.ok(
        xml &&
        xml.includes('<xml'),
        'read-only Upload workspace XML is available'
    );

    t.same(
        vm.getEasyBloxProjectContext(),
        {
            selectedBoardId: null,
            programMode: 'stage'
        },
        'reading Upload XML does not activate Upload mode or select a board'
    );

    t.equal(
        vm.getEasyBloxWorkspaceXML(
            'upload',
            'missing-board'
        ),
        null,
        'reading an unknown board does not create an Upload workspace'
    );

    t.end();
});

test('VirtualMachine forwards project loaded runtime events', t => {
    const vm = new VirtualMachine();

    let projectLoadedEvents = 0;

    vm.on(
        'PROJECT_LOADED',
        () => {
            projectLoadedEvents += 1;
        }
    );

    vm.runtime.handleProjectLoaded();

    t.equal(
        projectLoadedEvents,
        1,
        'VM forwards PROJECT_LOADED from the runtime'
    );

    t.end();
});

test('VirtualMachine persists and rehydrates EasyBlox project context with canonical Upload workspace', async t => {
    const sourceVm = new VirtualMachine();

    const sprite =
        new Sprite(null, sourceVm.runtime);

    sprite.name = 'Stage';

    const stage =
        sprite.createClone();

    stage.isStage = true;
    stage.isOriginal = true;

    sourceVm.runtime.targets = [stage];
    sourceVm.editingTarget = stage;
    sourceVm.runtime.setEditingTarget(stage);

    stage.blocks.createBlock({
        id: 'roundtrip_stage_block',
        opcode: 'operator_add',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false
    });

    const sourceUploadProgram =
        sourceVm.getOrCreateUploadProgram(
            'arduino-uno'
        );

    sourceUploadProgram.blocks.createBlock({
        id: 'roundtrip_upload_block',
        opcode: 'operator_subtract',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false
    });

    /*
     * A selected board belongs to the project even while Stage is active.
     * It must therefore be independent from the active Upload owner.
     */
    sourceVm.setEasyBloxSelectedBoard(
        'arduino-uno'
    );

    sourceVm.setProgramContext(
        'stage',
        null
    );

    const serializedStageProject =
        JSON.parse(
            sourceVm.toJSON()
        );

    t.same(
        serializedStageProject.easybloxProject,
        {
            schemaVersion: 1,
            selectedBoardId: 'arduino-uno',
            programMode: 'stage'
        },
        'Stage project serialization preserves the selected board'
    );

    /*
     * A project with no selected board is always a Stage project.
     */
    sourceVm.setEasyBloxSelectedBoard(null);

    const serializedNoBoardProject =
        JSON.parse(
            sourceVm.toJSON()
        );

    t.same(
        serializedNoBoardProject.easybloxProject,
        {
            schemaVersion: 1,
            selectedBoardId: null,
            programMode: 'stage'
        },
        'project serialization preserves the absence of a selected board'
    );

    /*
     * Restore the logical board and enter Upload before the canonical
     * round-trip used by the remainder of this regression.
     */
    sourceVm.setEasyBloxSelectedBoard(
        'arduino-uno'
    );

    sourceVm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    const serializedProject =
        sourceVm.toJSON();

    const serializedProjectJSON =
        JSON.parse(serializedProject);

    t.same(
        serializedProjectJSON.easybloxProject,
        {
            schemaVersion: 1,
            selectedBoardId: 'arduino-uno',
            programMode: 'upload'
        },
        'Upload project serialization preserves board and program mode'
    );

    t.match(
        serializedProject,
        /roundtrip_upload_block/,
        'serialized project contains the canonical Upload script'
    );

    const reloadedVm =
        new VirtualMachine();

    const deserializedProject =
        JSON.parse(serializedProject);

    deserializedProject.projectVersion = 3;

    await reloadedVm.deserializeProject(
        deserializedProject,
        null
    );

    const reloadedUploadProgram =
        reloadedVm.getOrCreateUploadProgram(
            'arduino-uno'
        );

    t.ok(
        reloadedUploadProgram.blocks.getBlock(
            'roundtrip_upload_block'
        ),
        'project reload restores the canonical Upload backing store'
    );

    const restoredProjectContext =
        reloadedVm.getEasyBloxProjectContext();

    t.same(
        restoredProjectContext,
        {
            selectedBoardId: 'arduino-uno',
            programMode: 'upload'
        },
        'project reload restores the logical board and program mode'
    );

    let workspaceXml = '';

    reloadedVm.on(
        'workspaceUpdate',
        data => {
            workspaceXml = data.xml;
        }
    );

    /*
     * Restored project metadata does not itself perform GUI activation.
     * Once the GUI applies the restored context, the canonical Upload
     * workspace must hydrate immediately.
     */
    reloadedVm.setProgramContext(
        restoredProjectContext.programMode,
        restoredProjectContext.selectedBoardId
    );

    reloadedVm.refreshWorkspace();

    t.match(
        workspaceXml,
        /roundtrip_upload_block/,
        'restored Upload context rehydrates the canonical Upload script'
    );

    t.notMatch(
        workspaceXml,
        /roundtrip_stage_block/,
        'restored Upload context does not rehydrate the Stage script'
    );

    /*
     * Malformed persisted context must never create Upload mode without
     * an owning board.
     */
    const invalidContextVm =
        new VirtualMachine();

    const invalidContextProject =
        JSON.parse(serializedProject);

    invalidContextProject.projectVersion = 3;
    invalidContextProject.easybloxProject = {
        schemaVersion: 1,
        selectedBoardId: null,
        programMode: 'upload'
    };

    await invalidContextVm.deserializeProject(
        invalidContextProject,
        null
    );

    t.same(
        invalidContextVm.getEasyBloxProjectContext(),
        {
            selectedBoardId: null,
            programMode: 'stage'
        },
        'Upload without a selected board falls back safely to Stage'
    );
});

test('VirtualMachine exposes Arduino UNO Upload code generation', t => {
    const vm = new VirtualMachine();

    t.type(
        vm.generateArduinoUnoUploadCode,
        'function'
    );

    t.end();
});

test('VirtualMachine generates Arduino UNO Upload C++ only from the canonical Upload program', t => {
    const vm = new VirtualMachine();

    /*
     * Deliberately keep a different valid firmware in the Scratch Stage.
     * Upload generation must ignore it completely.
     */
    vm.runtime = createRuntimeWithBlocks([
        createUploadHat('stage_digital_write'),
        {
            id: 'stage_digital_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'stage_pin',
                    shadow: 'stage_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'stage_value',
                    shadow: 'stage_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'stage_pin',
            'stage_digital_write',
            12
        ),
        createNumberShadow(
            'stage_value',
            'stage_digital_write',
            0
        )
    ]);

    vm.runtime.targets[0].variables = {
        stage_counter: {
            id: 'stage_counter',
            name: 'stageCounter',
            type: '',
            value: 99,
            easybloxValueType: 'DECIMAL'
        },

        upload_counter: {
            id: 'upload_counter',
            name: 'uploadCounter',
            type: '',
            value: 2.5,
            easybloxValueType: 'DECIMAL'
        }
    };

    vm.runtime.getTargetForStage = () =>
        vm.runtime.targets[0];

    const uploadProgram =
        loadCanonicalArduinoUnoUploadProgram(
            vm,
            [
                createUploadHat('upload_set_variable'),
                {
                    id: 'upload_set_variable',
                    opcode: 'data_setvariableto',
                    next: 'upload_change_variable',
                    parent: 'upload_hat',
                    inputs: {
                        VALUE: {
                            name: 'VALUE',
                            block: 'upload_variable_value',
                            shadow: 'upload_variable_value'
                        }
                    },
                    fields: {
                        VARIABLE: {
                            name: 'VARIABLE',
                            value: 'uploadCounter',
                            id: 'upload_counter'
                        }
                    },
                    topLevel: false,
                    shadow: false
                },
                {
                    id: 'upload_variable_value',
                    opcode: 'text',
                    next: null,
                    parent: 'upload_set_variable',
                    inputs: {},
                    fields: {
                        TEXT: {
                            name: 'TEXT',
                            value: '7'
                        }
                    },
                    topLevel: false,
                    shadow: true
                },
                {
                    id: 'upload_change_variable',
                    opcode: 'data_changevariableby',
                    next: 'upload_set_from_reporter',
                    parent: 'upload_set_variable',
                    inputs: {
                        VALUE: {
                            name: 'VALUE',
                            block: 'upload_change_value',
                            shadow: 'upload_change_value'
                        }
                    },
                    fields: {
                        VARIABLE: {
                            name: 'VARIABLE',
                            value: 'uploadCounter',
                            id: 'upload_counter'
                        }
                    },
                    topLevel: false,
                    shadow: false
                },
                createNumberShadow(
                    'upload_change_value',
                    'upload_change_variable',
                    2
                ),
                {
                    id: 'upload_set_from_reporter',
                    opcode: 'data_setvariableto',
                    next: 'upload_digital_write',
                    parent: 'upload_change_variable',
                    inputs: {
                        VALUE: {
                            name: 'VALUE',
                            block: 'upload_variable_reporter',
                            shadow: null
                        }
                    },
                    fields: {
                        VARIABLE: {
                            name: 'VARIABLE',
                            value: 'uploadCounter',
                            id: 'upload_counter'
                        }
                    },
                    topLevel: false,
                    shadow: false
                },
                {
                    id: 'upload_variable_reporter',
                    opcode: 'data_variable',
                    next: null,
                    parent: 'upload_set_from_reporter',
                    inputs: {},
                    fields: {
                        VARIABLE: {
                            name: 'VARIABLE',
                            value: 'uploadCounter',
                            id: 'upload_counter',
                            variableType: ''
                        }
                    },
                    topLevel: false,
                    shadow: false
                },
                {
                    id: 'upload_digital_write',
                    opcode: 'arduinoUno_digitalWrite',
                    next: null,
                    parent: 'upload_set_from_reporter',
                    inputs: {
                        PIN: {
                            name: 'PIN',
                            block: 'upload_pin',
                            shadow: 'upload_pin'
                        },
                        VALUE: {
                            name: 'VALUE',
                            block: 'upload_value',
                            shadow: 'upload_value'
                        }
                    },
                    fields: {},
                    topLevel: false,
                    shadow: false
                },
                createNumberShadow(
                    'upload_pin',
                    'upload_digital_write',
                    13
                ),
                createNumberShadow(
                    'upload_value',
                    'upload_digital_write',
                    1
                )
            ]
        );

    const uploadVariable =
        uploadProgram.lookupVariableById(
            'upload_counter'
        );

    t.equal(
        uploadVariable,
        vm.runtime.targets[0].variables.upload_counter,
        'Upload resolves the canonical shared project variable'
    );

    const code = vm.generateArduinoUnoUploadCode();

    t.match(
        code,
        /uploadCounter/,
        'generated code contains the canonical Upload variable'
    );

    t.match(
        code,
        /uploadCounter\s*=\s*7;/,
        'variable assignment resolves against the canonical Upload variable'
    );

    t.match(
        code,
        /uploadCounter\s*\+=\s*2(?:\.0)?;/,
        'variable change resolves against the canonical Upload variable'
    );

    t.match(
        code,
        /uploadCounter\s*=\s*uploadCounter;/,
        'variable reporter resolves against the canonical Upload variable'
    );

    t.match(
        code,
        /pinMode\(13, OUTPUT\);/,
        'generated code configures the canonical Upload pin'
    );

    t.match(
        code,
        /digitalWrite\(13, HIGH\);/,
        'generated code contains the canonical Upload statement'
    );

    t.match(
        code,
        /stageCounter/,
        'generated code contains the shared project variable created from Stage'
    );

    t.notMatch(
        code,
        /pinMode\(12, OUTPUT\);/,
        'generated code does not configure the Stage-only pin'
    );

    t.notMatch(
        code,
        /digitalWrite\(12, LOW\);/,
        'generated code does not leak Stage statements'
    );

    t.end();
});

test('VirtualMachine generates Arduino UNO Serial Upload C++ from current runtime', t => {
    const vm = new VirtualMachine();

    loadCanonicalArduinoUnoUploadProgram(vm, [
        createUploadHat('serial_begin'),
        {
            id: 'serial_begin',
            opcode: 'serial_serialBegin',
            next: 'serial_write_line',
            parent: 'upload_hat',
            inputs: {},
            fields: {
                BAUD: {
                    name: 'BAUD',
                    value: '9600'
                }
            },
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_write_line',
            opcode: 'serial_serialWriteLine',
            next: null,
            parent: 'serial_begin',
            inputs: {
                TEXT: {
                    name: 'TEXT',
                    block: 'serial_text',
                    shadow: 'serial_text'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        {
            id: 'serial_text',
            opcode: 'text',
            next: null,
            parent: 'serial_write_line',
            inputs: {},
            fields: {
                TEXT: {
                    name: 'TEXT',
                    value: 'Olá'
                }
            },
            topLevel: false,
            shadow: true
        }
    ]);

    const code = vm.generateArduinoUnoUploadCode();

    t.equal(code, [
        'void setup() {',
        '    Serial.begin(9600);',
        '    Serial.println("Olá");',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

test('VirtualMachine rejects Arduino UNO Upload resource conflicts', t => {
    const vm = new VirtualMachine();

    loadCanonicalArduinoUnoUploadProgram(vm, [
        createUploadHat('servo_write'),
        {
            id: 'servo_write',
            opcode: 'actuators_servoWrite',
            next: 'pwm_write',
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'servo_pin',
                    shadow: 'servo_pin'
                },
                ANGLE: {
                    name: 'ANGLE',
                    block: 'servo_angle',
                    shadow: 'servo_angle'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'servo_pin',
            'servo_write',
            'actuators_menu_servoPins',
            'servoPins',
            5
        ),
        createNumberShadow(
            'servo_angle',
            'servo_write',
            90,
            'easyblox_servo_angle'
        ),
        {
            id: 'pwm_write',
            opcode: 'arduinoUno_pwmWrite',
            next: null,
            parent: 'servo_write',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pwm_pin',
                    shadow: 'pwm_pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'pwm_value',
                    shadow: 'pwm_value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createExtensionMenuShadow(
            'pwm_pin',
            'pwm_write',
            'arduinoUno_menu_pwmPins',
            'pwmPins',
            5
        ),
        createNumberShadow(
            'pwm_value',
            'pwm_write',
            128,
            'easyblox_pwm_value'
        )
    ]);

    t.throws(
        () => vm.generateArduinoUnoUploadCode(),
        /Servo and PWM cannot use the same pin/
    );

    t.end();
});
