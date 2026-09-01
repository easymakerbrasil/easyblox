const test = require('tap').test;

const Runtime = require('../../src/engine/runtime');
const Blocks = require('../../src/engine/blocks');
const Variable = require('../../src/engine/variable');
const EasyBloxUploadProgram =
    require('../../src/upload/easyblox-upload-program');
const VirtualMachine = require('../../src/virtual-machine');
const Sprite = require('../../src/sprites/sprite');

test('EasyBloxUploadProgram owns Upload scripts and views shared project variables', t => {
    const runtime = new Runtime();
    const sharedVariables = Object.create(null);

    const stage = {
        isStage: true,
        variables: sharedVariables,

        lookupVariableById: variableId =>
            sharedVariables[variableId] || null,

        createVariable: (
            variableId,
            variableName,
            variableType,
            isCloud
        ) => {
            if (!sharedVariables[variableId]) {
                sharedVariables[variableId] =
                    new Variable(
                        variableId,
                        variableName,
                        variableType,
                        isCloud
                    );
            }
        }
    };

    runtime.targets = [stage];

    const originalTargets = runtime.targets.slice();

    const program = new EasyBloxUploadProgram(
        runtime,
        'arduino-uno'
    );

    t.equal(
        program.boardId,
        'arduino-uno',
        'identifies the board which owns the Upload program'
    );

    t.ok(
        program.blocks instanceof Blocks,
        'owns a canonical independent Blocks container'
    );

    t.equal(
        program.blocks.forceNoGlow,
        true,
        'Upload blocks are not runtime execution/glow blocks'
    );

    t.equal(
        program.variables,
        sharedVariables,
        'views the canonical shared project variable map'
    );

    t.same(
        Object.keys(program.variables),
        [],
        'shared project starts without variables'
    );

    program.createVariable(
        'variable-counter',
        'contador',
        Variable.SCALAR_TYPE
    );

    const variable =
        program.lookupVariableById('variable-counter');

    t.ok(
        variable instanceof Variable,
        'creates the canonical Variable through the shared project owner'
    );

    t.equal(
        variable,
        sharedVariables['variable-counter'],
        'Upload resolves the exact shared Variable instance'
    );

    t.equal(
        variable.id,
        'variable-counter',
        'preserves the canonical variable ID'
    );

    t.equal(
        variable.name,
        'contador',
        'preserves the visible variable name'
    );

    t.equal(
        variable.type,
        Variable.SCALAR_TYPE,
        'preserves the Scratch scalar storage type'
    );

    t.equal(
        variable.easybloxValueType,
        null,
        'starts without EasyBlox type metadata'
    );

    t.equal(
        program.lookupVariableById('missing-variable'),
        null,
        'returns null for an unknown variable ID'
    );

    t.same(
        runtime.targets,
        originalTargets,
        'creating shared data does not register an Upload target'
    );

    t.end();
});

test('VirtualMachine owns Upload programs independently by board ID', t => {
    const vm = new VirtualMachine();
    const originalTargets = vm.runtime.targets.slice();

    t.equal(
        typeof vm.getOrCreateUploadProgram,
        'function',
        'exposes an Upload program accessor'
    );

    if (typeof vm.getOrCreateUploadProgram !== 'function') {
        t.end();
        return;
    }

    const arduinoProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    t.ok(
        arduinoProgram instanceof EasyBloxUploadProgram,
        'creates an EasyBloxUploadProgram'
    );

    t.equal(
        arduinoProgram.boardId,
        'arduino-uno',
        'associates the program with the requested board'
    );

    t.equal(
        arduinoProgram.runtime,
        vm.runtime,
        'uses the VM runtime without becoming a Scratch target'
    );

    t.equal(
        vm.getOrCreateUploadProgram('arduino-uno'),
        arduinoProgram,
        'returns the same program instance for the same board'
    );

    const otherProgram =
        vm.getOrCreateUploadProgram('future-board');

    t.ok(
        otherProgram instanceof EasyBloxUploadProgram,
        'can own another independent Upload program'
    );

    t.not(
        otherProgram,
        arduinoProgram,
        'different board IDs have independent programs'
    );

    t.equal(
        otherProgram.boardId,
        'future-board',
        'preserves the second board ID'
    );

    t.same(
        vm.runtime.targets,
        originalTargets,
        'Upload programs never become Scratch runtime targets'
    );

    t.end();
});

test('Upload program survives Scratch editing target changes', t => {
    const vm = new VirtualMachine();

    const stageSprite = new Sprite(null, vm.runtime);
    const stage = stageSprite.createClone();
    stage.isStage = true;

    const actorSprite = new Sprite(null, vm.runtime);
    const actor = actorSprite.createClone();

    vm.runtime.targets = [
        stage,
        actor
    ];

    vm.editingTarget = stage;
    vm.runtime.setEditingTarget(stage);

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.createVariable(
        'upload-counter',
        'contador',
        Variable.SCALAR_TYPE
    );

    uploadProgram.lookupVariableById(
        'upload-counter'
    ).easybloxValueType = 'INTEGER';

    t.equal(
        vm.getOrCreateUploadProgram('arduino-uno'),
        uploadProgram,
        'starts with the canonical Arduino UNO Upload program'
    );

    vm.setEditingTarget(actor.id);

    t.equal(
        vm.editingTarget,
        actor,
        'Scratch editing target changes to the actor'
    );

    t.equal(
        vm.getOrCreateUploadProgram('arduino-uno'),
        uploadProgram,
        'changing the Scratch editing target preserves the Upload program instance'
    );

    t.equal(
        uploadProgram.lookupVariableById('upload-counter').name,
        'contador',
        'preserves Upload variable data after switching Scratch targets'
    );

    t.equal(
        uploadProgram.lookupVariableById('upload-counter').easybloxValueType,
        'INTEGER',
        'preserves EasyBlox type metadata after switching Scratch targets'
    );

    vm.setEditingTarget(stage.id);

    t.equal(
        vm.editingTarget,
        stage,
        'Scratch editing target can return to the stage'
    );

    t.equal(
        vm.getOrCreateUploadProgram('arduino-uno'),
        uploadProgram,
        'returning to the stage still preserves the same Upload program'
    );

    t.equal(
        uploadProgram.lookupVariableById('upload-counter').easybloxValueType,
        'INTEGER',
        'Upload state remains unchanged across the complete target round trip'
    );

    t.end();
});

test('EasyBlox Upload block mutations notify project changes without enabling block glow', t => {
    const vm = new VirtualMachine();

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    const delegatedEvents = [];
    let projectChangedCount = 0;

    uploadProgram.blocks.blocklyListen = event => {
        delegatedEvents.push(event);
    };

    vm.runtime.emitProjectChanged = () => {
        projectChangedCount++;
    };

    const persistentEvents = [
        {
            type: 'create',
            blockId: 'upload-created'
        },
        {
            type: 'change',
            blockId: 'upload-changed'
        },
        {
            type: 'move',
            blockId: 'upload-moved'
        },
        {
            type: 'delete',
            blockId: 'upload-deleted'
        }
    ];

    const transientEvents = [
        {
            type: 'block_field_intermediate_change',
            blockId: 'upload-changed',
            name: 'TEXT',
            newValue: 'abc'
        },
        {
            type: 'dragOutside',
            blockId: 'upload-moved',
            isOutside: false
        },
        {
            type: 'endDrag',
            blockId: 'upload-moved',
            isOutside: false
        },
        {
            type: 'click',
            blockId: 'upload-created',
            targetType: 'block'
        }
    ];

    persistentEvents
        .concat(transientEvents)
        .forEach(event => uploadProgram.blocklyListen(event));

    t.same(
        delegatedEvents,
        persistentEvents.concat(transientEvents),
        'delegates block events to the canonical Upload Blocks container'
    );

    t.equal(
        projectChangedCount,
        persistentEvents.length,
        'persistent Upload block mutations mark the project changed'
    );

    t.equal(
        uploadProgram.blocks.forceNoGlow,
        true,
        'Upload Blocks remain no-glow while project changes are notified'
    );

    t.end();
});

test('clearing the VM discards independent Upload script state from the previous project', t => {
    const vm = new VirtualMachine();

    const firstProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    firstProgram.blocks.createBlock({
        id: 'old-upload-block',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 24,
        y: 36
    });

    t.equal(
        vm.getOrCreateUploadProgram('arduino-uno'),
        firstProgram,
        'program exists before clearing the project'
    );

    vm.clear();

    const secondProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    t.not(
        secondProgram,
        firstProgram,
        'clearing the VM creates a fresh Upload program for the next project'
    );

    t.equal(
        secondProgram.blocks.getBlock('old-upload-block'),
        undefined,
        'Upload blocks from the previous project do not leak into the next project'
    );

    t.same(
        secondProgram.blocks.getScripts(),
        [],
        'fresh Upload program starts with an empty independent workspace'
    );

    t.end();
});

test('toJSON serializes only independent EasyBlox Upload script state at project root', t => {
    const vm = new VirtualMachine();

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.blocks.createBlock({
        id: 'upload-entry',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 48,
        y: 72
    });

    const serialized = JSON.parse(vm.toJSON());

    t.ok(
        serialized.easybloxUploadPrograms,
        'serializes EasyBlox Upload programs at the project root'
    );

    const serializedProgram =
        serialized.easybloxUploadPrograms['arduino-uno'];

    t.ok(
        serializedProgram,
        'serializes the Arduino UNO Upload program by canonical board ID'
    );

    t.ok(
        serializedProgram.blocks['upload-entry'],
        'serializes the independent Upload block workspace'
    );

    t.notOk(
        Object.prototype.hasOwnProperty.call(
            serializedProgram,
            'variables'
        ),
        'does not duplicate shared project variables inside the Upload program'
    );

    t.notOk(
        Object.prototype.hasOwnProperty.call(
            serializedProgram,
            'lists'
        ),
        'does not persist Stage-only lists inside the Upload program'
    );

    t.notOk(
        Object.prototype.hasOwnProperty.call(
            serializedProgram,
            'easybloxData'
        ),
        'does not duplicate shared EasyBlox variable metadata inside the Upload program'
    );

    t.same(
        serialized.targets,
        [],
        'serializing independent Upload scripts does not create Scratch targets'
    );

    t.end();
});

test('VirtualMachine migrates legacy Upload variables and lists into the shared Stage owner', t => {
    const vm = new VirtualMachine();
    const sharedVariables = Object.create(null);

    const stage = {
        isStage: true,
        variables: sharedVariables,

        lookupVariableById: variableId =>
            sharedVariables[variableId] || null,

        createVariable: (
            variableId,
            variableName,
            variableType,
            isCloud
        ) => {
            if (!sharedVariables[variableId]) {
                sharedVariables[variableId] =
                    new Variable(
                        variableId,
                        variableName,
                        variableType,
                        isCloud
                    );
            }
        }
    };

    const canonicalVariable =
        new Variable(
            'already-shared',
            'canonica',
            Variable.SCALAR_TYPE,
            false
        );

    canonicalVariable.value = 42;
    canonicalVariable.easybloxValueType = 'INTEGER';

    sharedVariables['already-shared'] =
        canonicalVariable;

    vm.runtime.targets = [stage];

    const legacyProgram = {
        variables: {
            'legacy-counter': [
                'contador',
                7
            ],

            'already-shared': [
                'legada',
                999
            ]
        },

        lists: {
            'legacy-names': [
                'nomes',
                [
                    'Ana',
                    'Beto'
                ]
            ]
        },

        easybloxData: {
            'legacy-counter': {
                valueType: 'INTEGER'
            },

            'already-shared': {
                valueType: 'DECIMAL'
            },

            'legacy-names': {
                valueType: 'TEXT',
                capacity: 10
            }
        }
    };

    vm._migrateLegacyEasyBloxUploadData(
        legacyProgram,
        stage
    );

    const migratedVariable =
        stage.lookupVariableById('legacy-counter');

    const migratedList =
        stage.lookupVariableById('legacy-names');

    t.ok(
        migratedVariable instanceof Variable,
        'migrates a legacy Upload scalar into the shared project owner'
    );

    t.equal(
        migratedVariable.value,
        7,
        'preserves the legacy scalar value'
    );

    t.equal(
        migratedVariable.easybloxValueType,
        'INTEGER',
        'preserves legacy EasyBlox scalar metadata'
    );

    t.ok(
        migratedList instanceof Variable,
        'migrates a legacy Upload list into the Stage owner'
    );

    t.equal(
        migratedList.type,
        Variable.LIST_TYPE,
        'legacy Upload list becomes a Stage list'
    );

    t.same(
        migratedList.value,
        [
            'Ana',
            'Beto'
        ],
        'preserves legacy list values'
    );

    t.equal(
        migratedList.easybloxValueType,
        'TEXT',
        'preserves legacy EasyBlox list type metadata'
    );

    t.equal(
        migratedList.easybloxListCapacity,
        10,
        'preserves legacy EasyBlox list capacity'
    );

    t.equal(
        canonicalVariable.name,
        'canonica',
        'legacy Upload data does not rename an existing canonical shared variable'
    );

    t.equal(
        canonicalVariable.value,
        42,
        'legacy Upload data does not overwrite an existing canonical shared value'
    );

    t.equal(
        canonicalVariable.easybloxValueType,
        'INTEGER',
        'canonical shared metadata wins over a duplicate legacy Upload copy'
    );

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    t.equal(
        uploadProgram.lookupVariableById('legacy-counter'),
        migratedVariable,
        'Upload resolves the migrated scalar through the shared owner'
    );

    t.end();
});

test('deserializeProject restores independent EasyBlox Upload blocks', t => {
    const vm = new VirtualMachine();

    vm.installTargets = () => Promise.resolve();

    const serializedProject = {
        projectVersion: 3,
        targets: [],
        monitors: [],
        extensions: [],
        meta: {
            semver: '3.0.0',
            vm: '0.0.0',
            agent: 'test'
        },
        easybloxUploadPrograms: {
            'arduino-uno': {
                blocks: {
                    'upload-entry': {
                        opcode: 'arduinoUno_whenArduinoUnoStart',
                        next: null,
                        parent: null,
                        inputs: {},
                        fields: {},
                        shadow: false,
                        topLevel: true,
                        x: 48,
                        y: 72
                    }
                },
                variables: {},
                lists: {}
            }
        }
    };

    return vm.deserializeProject(serializedProject)
        .then(() => {
            const restoredProgram =
                vm.getOrCreateUploadProgram('arduino-uno');

            const restoredBlock =
                restoredProgram.blocks.getBlock('upload-entry');

            t.ok(
                restoredBlock,
                'restores the Upload block by canonical ID'
            );

            if (!restoredBlock) {
                t.end();
                return;
            }

            t.equal(
                restoredBlock.id,
                'upload-entry',
                'restores the block ID'
            );

            t.equal(
                restoredBlock.opcode,
                'arduinoUno_whenArduinoUnoStart',
                'preserves the Upload entry-point opcode'
            );

            t.equal(
                restoredBlock.topLevel,
                true,
                'preserves the top-level script state'
            );

            t.equal(
                restoredBlock.x,
                48,
                'preserves the workspace x coordinate'
            );

            t.equal(
                restoredBlock.y,
                72,
                'preserves the workspace y coordinate'
            );

            t.same(
                restoredProgram.blocks.getScripts(),
                [
                    'upload-entry'
                ],
                'restores the independent Upload script index'
            );

            t.same(
                vm.runtime.targets,
                [],
                'restoring Upload blocks does not create Scratch runtime targets'
            );

            t.end();
        });
});

test('independent EasyBlox Upload scripts survive a complete VM JSON round trip', t => {
    const sourceVm = new VirtualMachine();

    const sourceProgram =
        sourceVm.getOrCreateUploadProgram('arduino-uno');

    sourceProgram.blocks.createBlock({
        id: 'upload-entry',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 48,
        y: 72
    });

    const serializedProject =
        JSON.parse(sourceVm.toJSON());

    serializedProject.projectVersion = 3;

    const restoredVm = new VirtualMachine();

    restoredVm.installTargets =
        () => Promise.resolve();

    return restoredVm.deserializeProject(
        serializedProject
    )
        .then(() => {
            const restoredProgram =
                restoredVm.getOrCreateUploadProgram(
                    'arduino-uno'
                );

            t.not(
                restoredProgram,
                sourceProgram,
                'restores into a different Upload program instance'
            );

            const restoredBlock =
                restoredProgram.blocks.getBlock(
                    'upload-entry'
                );

            t.ok(
                restoredBlock,
                'restores the independent Upload block'
            );

            t.equal(
                restoredBlock.opcode,
                'arduinoUno_whenArduinoUnoStart',
                'preserves the Upload entry-point opcode'
            );

            t.same(
                restoredProgram.blocks.getScripts(),
                [
                    'upload-entry'
                ],
                'restores the independent Upload script index'
            );

            const reserialized =
                JSON.parse(restoredVm.toJSON());

            const reserializedProgram =
                reserialized.easybloxUploadPrograms[
                    'arduino-uno'
                ];

            t.ok(
                reserializedProgram.blocks['upload-entry'],
                're-serializes the restored independent Upload workspace'
            );

            t.notOk(
                Object.prototype.hasOwnProperty.call(
                    reserializedProgram,
                    'variables'
                ),
                'round trip does not recreate private Upload variables'
            );

            t.notOk(
                Object.prototype.hasOwnProperty.call(
                    reserializedProgram,
                    'lists'
                ),
                'round trip does not recreate private Upload lists'
            );

            t.notOk(
                Object.prototype.hasOwnProperty.call(
                    reserializedProgram,
                    'easybloxData'
                ),
                'round trip does not recreate duplicated EasyBlox data'
            );

            t.end();
        });
});

test('legacy projects without Upload programs remain compatible and lazy', t => {
    const vm = new VirtualMachine();

    vm.installTargets = () => Promise.resolve();

    const legacyProject = {
        projectVersion: 3,
        targets: [],
        monitors: [],
        extensions: [],
        meta: {
            semver: '3.0.0',
            vm: '0.0.0',
            agent: 'test'
        }
    };

    return vm.deserializeProject(legacyProject)
        .then(() => {
            t.equal(
                vm._easybloxUploadPrograms,
                null,
                'legacy project does not eagerly create Upload program state'
            );

            const serializedBeforeUploadAccess =
                JSON.parse(vm.toJSON());

            t.equal(
                Object.prototype.hasOwnProperty.call(
                    serializedBeforeUploadAccess,
                    'easybloxUploadPrograms'
                ),
                false,
                'legacy project remains free of EasyBlox Upload data when saved unchanged'
            );

            t.same(
                vm.runtime.targets,
                [],
                'legacy project loading does not create Upload targets'
            );

            const uploadProgram =
                vm.getOrCreateUploadProgram('arduino-uno');

            t.ok(
                uploadProgram instanceof EasyBloxUploadProgram,
                'Upload program is created only when explicitly requested'
            );

            t.equal(
                uploadProgram.boardId,
                'arduino-uno',
                'lazy Upload program uses the requested board ID'
            );

            t.same(
                Object.keys(uploadProgram.variables),
                [],
                'lazy Upload program starts with no inherited variables'
            );

            t.same(
                uploadProgram.blocks.getScripts(),
                [],
                'lazy Upload program starts with an empty workspace'
            );

            t.same(
                vm.runtime.targets,
                [],
                'creating the lazy Upload program still does not create a Scratch target'
            );

            t.end();
        });
});

test('toJSON includes extensions used only by EasyBlox Upload programs', t => {
    const vm = new VirtualMachine();

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.blocks.createBlock({
        id: 'upload-entry',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    });

    const serialized =
        JSON.parse(vm.toJSON());

    t.ok(
        serialized.easybloxUploadPrograms['arduino-uno']
            .blocks['upload-entry'],
        'serializes the Upload block'
    );

    t.ok(
        serialized.extensions.includes('arduinoUno'),
        'registers an extension used only by the Upload program'
    );

    t.equal(
        serialized.extensions.filter(
            extensionId => extensionId === 'arduinoUno'
        ).length,
        1,
        'registers the Upload extension exactly once'
    );

    t.same(
        vm.runtime.targets,
        [],
        'registering the Upload extension does not create Scratch targets'
    );

    t.end();
});

test('deserializeProject registers extensions used only by EasyBlox Upload blocks', t => {
    const vm = new VirtualMachine();

    let installedExtensions = null;

    vm.installTargets = (targets, extensions) => {
        installedExtensions = extensions;
        return Promise.resolve();
    };

    const serializedProject = {
        projectVersion: 3,
        targets: [],
        monitors: [],
        extensions: [],
        meta: {
            semver: '3.0.0',
            vm: '0.0.0',
            agent: 'test'
        },
        easybloxUploadPrograms: {
            'arduino-uno': {
                blocks: {
                    'upload-entry': {
                        opcode: 'arduinoUno_whenArduinoUnoStart',
                        next: null,
                        parent: null,
                        inputs: {},
                        fields: {},
                        shadow: false,
                        topLevel: true,
                        x: 0,
                        y: 0
                    }
                },
                variables: {},
                lists: {}
            }
        }
    };

    return vm.deserializeProject(serializedProject)
        .then(() => {
            t.ok(
                installedExtensions,
                'passes extension metadata to target installation'
            );

            t.ok(
                installedExtensions.extensionIDs.has('arduinoUno'),
                'registers an extension discovered only in the Upload workspace'
            );

            t.equal(
                Array.from(installedExtensions.extensionIDs)
                    .filter(extensionId => extensionId === 'arduinoUno')
                    .length,
                1,
                'registers the Upload extension exactly once'
            );

            t.ok(
                vm.getOrCreateUploadProgram('arduino-uno')
                    .blocks.getBlock('upload-entry'),
                'still restores the Upload block'
            );

            t.same(
                vm.runtime.targets,
                [],
                'extension discovery does not create Scratch targets'
            );

            t.end();
        });
});

test('Stage and Upload programs deduplicate shared extension IDs when serialized', t => {
    const vm = new VirtualMachine();

    const stageSprite =
        new Sprite(null, vm.runtime);

    const stage =
        stageSprite.createClone();

    stage.isStage = true;

    vm.runtime.targets = [
        stage
    ];

    stage.blocks.createBlock({
        id: 'stage-arduino-block',
        opcode: 'arduinoUno_digitalWrite',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    });

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.blocks.createBlock({
        id: 'upload-entry',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    });

    const serialized =
        JSON.parse(vm.toJSON());

    t.ok(
        serialized.targets[0].blocks['stage-arduino-block'],
        'serializes the Arduino block owned by the Stage target'
    );

    t.ok(
        serialized.easybloxUploadPrograms['arduino-uno']
            .blocks['upload-entry'],
        'serializes the Arduino block owned by the Upload program'
    );

    t.ok(
        serialized.extensions.includes('arduinoUno'),
        'registers the shared Arduino extension'
    );

    t.equal(
        serialized.extensions.filter(
            extensionId => extensionId === 'arduinoUno'
        ).length,
        1,
        'registers the shared Arduino extension exactly once'
    );

    t.equal(
        serialized.extensions.length,
        1,
        'does not introduce any duplicate extension entries'
    );

    t.end();
});

test('sprite serialization excludes independent EasyBlox Upload programs', t => {
    const vm = new VirtualMachine();

    const sprite =
        new Sprite(null, vm.runtime);

    sprite.name = 'Sprite1';

    const target =
        sprite.createClone();

    target.isStage = false;

    vm.runtime.targets = [
        target
    ];

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.blocks.createBlock({
        id: 'upload-entry',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        shadow: false,
        topLevel: true,
        x: 0,
        y: 0
    });

    const serializedSprite =
        JSON.parse(vm.toJSON(target.id));

    t.equal(
        Object.prototype.hasOwnProperty.call(
            serializedSprite,
            'easybloxUploadPrograms'
        ),
        false,
        'sprite serialization does not include project-level Upload programs'
    );

    t.equal(
        JSON.stringify(serializedSprite).includes('upload-entry'),
        false,
        'sprite serialization does not leak Upload workspace blocks'
    );

    t.ok(
        uploadProgram.blocks.getBlock('upload-entry'),
        'serializing a sprite does not modify the independent Upload program'
    );

    t.end();
});
