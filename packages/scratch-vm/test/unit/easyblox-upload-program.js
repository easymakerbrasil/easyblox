const test = require('tap').test;

const Runtime = require('../../src/engine/runtime');
const Blocks = require('../../src/engine/blocks');
const Variable = require('../../src/engine/variable');
const EasyBloxUploadProgram =
    require('../../src/upload/easyblox-upload-program');
const VirtualMachine = require('../../src/virtual-machine');
const Sprite = require('../../src/sprites/sprite');

test('EasyBloxUploadProgram owns independent Upload state', t => {
    const runtime = new Runtime();
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
        'owns a canonical Blocks container'
    );

    t.equal(
        program.blocks.forceNoGlow,
        true,
        'Upload blocks are not runtime execution/glow blocks'
    );

    t.same(
        Object.keys(program.variables),
        [],
        'starts without variables'
    );

    t.same(
        runtime.targets,
        originalTargets,
        'does not register the Upload program as a Scratch target'
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
        'creates canonical Variable instances'
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
        'creating Upload data still does not mutate Scratch targets'
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

test('clearing the VM discards Upload programs from the previous project', t => {
    const vm = new VirtualMachine();

    const firstProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    firstProgram.createVariable(
        'old-variable',
        'variável antiga',
        Variable.SCALAR_TYPE
    );

    firstProgram.lookupVariableById(
        'old-variable'
    ).easybloxValueType = 'INTEGER';

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
        secondProgram.lookupVariableById('old-variable'),
        null,
        'Upload variables from the previous project do not leak into the next project'
    );

    t.same(
        Object.keys(secondProgram.variables),
        [],
        'fresh Upload program starts without data from the previous project'
    );

    t.end();
});

test('toJSON serializes independent EasyBlox Upload programs at project root', t => {
    const vm = new VirtualMachine();

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

    const serialized = JSON.parse(vm.toJSON());

    t.ok(
        serialized.easybloxUploadPrograms,
        'serializes EasyBlox Upload programs at the project root'
    );

    if (!serialized.easybloxUploadPrograms) {
        t.end();
        return;
    }

    t.ok(
        serialized.easybloxUploadPrograms['arduino-uno'],
        'serializes the Arduino UNO Upload program by canonical board ID'
    );

    const serializedProgram =
        serialized.easybloxUploadPrograms['arduino-uno'];

    t.same(
        serializedProgram.blocks,
        {},
        'serializes the independent Upload block workspace'
    );

    t.same(
        serializedProgram.variables,
        {
            'upload-counter': [
                'contador',
                0
            ]
        },
        'uses the canonical Scratch variable representation'
    );

    t.same(
        serializedProgram.lists,
        {},
        'serializes Upload lists independently'
    );

    t.same(
        serializedProgram.easybloxData,
        {
            'upload-counter': {
                valueType: 'INTEGER'
            }
        },
        'serializes EasyBlox type metadata by canonical variable ID'
    );

    t.same(
        serialized.targets,
        [],
        'serializing Upload state does not create or modify Scratch targets'
    );

    t.end();
});

test('deserializeProject restores independent EasyBlox Upload program variables', t => {
    const vm = new VirtualMachine();

    // Isolate this test from Scratch target installation. This contract is
    // specifically about restoring the independent EasyBlox Upload domain.
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
                blocks: {},
                variables: {
                    'upload-counter': [
                        'contador',
                        0
                    ]
                },
                lists: {},
                easybloxData: {
                    'upload-counter': {
                        valueType: 'INTEGER'
                    }
                }
            }
        }
    };

    return vm.deserializeProject(serializedProject)
        .then(() => {
            const restoredProgram =
                vm.getOrCreateUploadProgram('arduino-uno');

            const restoredVariable =
                restoredProgram.lookupVariableById('upload-counter');

            t.ok(
                restoredVariable,
                'restores the Upload variable by canonical ID'
            );

            if (!restoredVariable) {
                t.end();
                return;
            }

            t.equal(
                restoredVariable.id,
                'upload-counter',
                'preserves the canonical variable ID'
            );

            t.equal(
                restoredVariable.name,
                'contador',
                'preserves the Upload variable name'
            );

            t.equal(
                restoredVariable.type,
                Variable.SCALAR_TYPE,
                'restores the canonical scalar variable type'
            );

            t.equal(
                restoredVariable.value,
                0,
                'restores the scalar value'
            );

            t.equal(
                restoredVariable.easybloxValueType,
                'INTEGER',
                'restores EasyBlox type metadata'
            );

            t.same(
                vm.runtime.targets,
                [],
                'restoring Upload state does not create Scratch runtime targets'
            );

            t.end();
        });
});

test('deserializeProject restores independent EasyBlox Upload typed lists', t => {
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
                blocks: {},
                variables: {},
                lists: {
                    'upload-names': [
                        'nomes',
                        [
                            'Ana',
                            'Beto'
                        ]
                    ]
                },
                easybloxData: {
                    'upload-names': {
                        valueType: 'TEXT',
                        capacity: 10
                    }
                }
            }
        }
    };

    return vm.deserializeProject(serializedProject)
        .then(() => {
            const restoredProgram =
                vm.getOrCreateUploadProgram('arduino-uno');

            const restoredList =
                restoredProgram.lookupVariableById('upload-names');

            t.ok(
                restoredList,
                'restores the Upload list by canonical ID'
            );

            if (!restoredList) {
                t.end();
                return;
            }

            t.equal(
                restoredList.id,
                'upload-names',
                'preserves the canonical list ID'
            );

            t.equal(
                restoredList.name,
                'nomes',
                'preserves the Upload list name'
            );

            t.equal(
                restoredList.type,
                Variable.LIST_TYPE,
                'restores the canonical list type'
            );

            t.same(
                restoredList.value,
                [
                    'Ana',
                    'Beto'
                ],
                'restores the Upload list contents'
            );

            t.equal(
                restoredList.easybloxValueType,
                'TEXT',
                'restores the EasyBlox list item type'
            );

            t.equal(
                restoredList.easybloxListCapacity,
                10,
                'restores the EasyBlox fixed list capacity'
            );

            t.same(
                vm.runtime.targets,
                [],
                'restoring an Upload list does not create Scratch runtime targets'
            );

            t.end();
        });
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

test('EasyBlox Upload program survives a complete VM JSON round trip', t => {
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

    sourceProgram.createVariable(
        'upload-counter',
        'contador',
        Variable.SCALAR_TYPE
    );

    const sourceVariable =
        sourceProgram.lookupVariableById('upload-counter');

    sourceVariable.value = 7;
    sourceVariable.easybloxValueType = 'INTEGER';

    sourceProgram.createVariable(
        'upload-names',
        'nomes',
        Variable.LIST_TYPE
    );

    const sourceList =
        sourceProgram.lookupVariableById('upload-names');

    sourceList.value = [
        'Ana',
        'Beto'
    ];
    sourceList.easybloxValueType = 'TEXT';
    sourceList.easybloxListCapacity = 10;

    const serializedProject =
        JSON.parse(sourceVm.toJSON());

    // loadProject normally receives this from scratch-parser.
    serializedProject.projectVersion = 3;

    const restoredVm = new VirtualMachine();

    // Keep this test focused on the independent Upload domain.
    restoredVm.installTargets = () => Promise.resolve();

    return restoredVm.deserializeProject(serializedProject)
        .then(() => {
            const restoredProgram =
                restoredVm.getOrCreateUploadProgram('arduino-uno');

            t.not(
                restoredProgram,
                sourceProgram,
                'restores into a different Upload program instance'
            );

            const restoredBlock =
                restoredProgram.blocks.getBlock('upload-entry');

            t.ok(
                restoredBlock,
                'restores the Upload entry-point block'
            );

            t.equal(
                restoredBlock.opcode,
                'arduinoUno_whenArduinoUnoStart',
                'preserves the Upload block opcode'
            );

            t.same(
                restoredProgram.blocks.getScripts(),
                [
                    'upload-entry'
                ],
                'preserves the Upload script index'
            );

            const restoredVariable =
                restoredProgram.lookupVariableById('upload-counter');

            t.ok(
                restoredVariable,
                'restores the typed scalar variable'
            );

            t.equal(
                restoredVariable.name,
                'contador',
                'preserves the scalar variable name'
            );

            t.equal(
                restoredVariable.value,
                7,
                'preserves the scalar variable value'
            );

            t.equal(
                restoredVariable.easybloxValueType,
                'INTEGER',
                'preserves the scalar EasyBlox type'
            );

            const restoredList =
                restoredProgram.lookupVariableById('upload-names');

            t.ok(
                restoredList,
                'restores the typed Upload list'
            );

            t.same(
                restoredList.value,
                [
                    'Ana',
                    'Beto'
                ],
                'preserves the Upload list contents'
            );

            t.equal(
                restoredList.easybloxValueType,
                'TEXT',
                'preserves the Upload list item type'
            );

            t.equal(
                restoredList.easybloxListCapacity,
                10,
                'preserves the Upload list capacity'
            );

            t.same(
                sourceVm.runtime.targets,
                [],
                'source Upload program never becomes a Scratch target'
            );

            t.same(
                restoredVm.runtime.targets,
                [],
                'restored Upload program never becomes a Scratch target'
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
