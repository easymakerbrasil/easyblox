const tap = require('tap');
const VirtualMachine = require('../../src/virtual-machine');
const Runtime = require('../../src/engine/runtime');
const Blocks = require('../../src/engine/blocks');

const test = tap.test;

const createRuntimeWithBlocks = blockDefinitions => {
    const runtime = new Runtime();
    const blocks = new Blocks(runtime);

    blockDefinitions.forEach(block => blocks.createBlock(block));

    runtime.targets = [{
        isOriginal: true,
        blocks
    }];

    return runtime;
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

test('VirtualMachine creates Upload variables in the canonical Upload program', t => {
    const vm = new VirtualMachine();
    const stageVariables = Object.create(null);

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        variables: stageVariables,

        lookupVariableById: variableId =>
            stageVariables[variableId] || null,

        lookupVariableByNameAndType: () => null,

        createVariable: (
            variableId,
            variableName,
            variableType,
            isCloud
        ) => {
            stageVariables[variableId] = {
                id: variableId,
                name: variableName,
                type: variableType,
                isCloud
            };
        }
    };

    vm.runtime.targets = [stage];

    vm.runtime.getEditingTarget = () => stage;
    vm.runtime.getTargetForStage = () => stage;

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    vm.blockListener({
        type: 'var_create',
        varId: 'upload_counter',
        varName: 'contador',
        varType: '',
        isLocal: false,
        isCloud: false
    });

    t.ok(
        uploadProgram.lookupVariableById('upload_counter'),
        'Upload variable belongs to the canonical Upload program'
    );

    t.notOk(
        stageVariables.upload_counter,
        'Upload variable is not created on the Scratch Stage'
    );

    t.end();
});

test('VirtualMachine renames and deletes variables only in the canonical Upload program', t => {
    const vm = new VirtualMachine();
    const stageVariables = Object.create(null);

    stageVariables.upload_counter = {
        id: 'upload_counter',
        name: 'contador_palco',
        type: '',
        isCloud: false
    };

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        variables: stageVariables,

        lookupVariableById: variableId =>
            stageVariables[variableId] || null,

        lookupVariableByNameAndType: () => null,

        renameVariable: (variableId, newName) => {
            if (stageVariables[variableId]) {
                stageVariables[variableId].name = newName;
            }
        },

        deleteVariable: variableId => {
            delete stageVariables[variableId];
        },

        blocks: {
            updateBlocksAfterVarRename: () => {}
        }
    };

    vm.runtime.targets = [stage];

    vm.runtime.getEditingTarget = () => stage;
    vm.runtime.getTargetForStage = () => stage;

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.createVariable(
        'upload_counter',
        'contador',
        ''
    );

    uploadProgram.blocks.createBlock({
        id: 'upload_variable_reporter',
        opcode: 'data_variable',
        next: null,
        parent: null,
        inputs: {},
        fields: {
            VARIABLE: {
                name: 'VARIABLE',
                id: 'upload_counter',
                value: 'contador',
                variableType: ''
            }
        },
        topLevel: true,
        shadow: false
    });

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    vm.blockListener({
        type: 'var_rename',
        varId: 'upload_counter',
        oldName: 'contador',
        newName: 'total'
    });

    t.equal(
        uploadProgram.lookupVariableById('upload_counter').name,
        'total',
        'Upload variable is renamed inside the canonical Upload program'
    );

    t.equal(
        uploadProgram.blocks
            .getBlock('upload_variable_reporter')
            .fields.VARIABLE.value,
        'total',
        'Upload variable references are updated after rename'
    );

    t.equal(
        stageVariables.upload_counter.name,
        'contador_palco',
        'renaming an Upload variable does not mutate the Scratch Stage'
    );

    vm.blockListener({
        type: 'var_delete',
        varId: 'upload_counter'
    });

    t.equal(
        uploadProgram.lookupVariableById('upload_counter'),
        null,
        'deleted Upload variable is removed from the canonical Upload program'
    );

    t.ok(
        stageVariables.upload_counter,
        'deleting an Upload variable does not delete the Scratch Stage variable'
    );

    t.equal(
        stageVariables.upload_counter.name,
        'contador_palco',
        'Scratch Stage variable remains unchanged after Upload deletion'
    );

    t.end();
});

test('VirtualMachine sets EasyBlox variable type on the active Upload program only', t => {
    const vm = new VirtualMachine();

    const stageVariable = {
        id: 'shared_variable',
        name: 'variavel_palco',
        type: '',
        value: 0,
        easybloxValueType: null
    };

    const stage = {
        id: 'stage',
        variables: {
            shared_variable: stageVariable
        },

        lookupVariableById: variableId =>
            variableId === 'shared_variable' ?
                stageVariable :
                null
    };

    vm.runtime.targets = [stage];

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.createVariable(
        'shared_variable',
        'variavel_upload',
        ''
    );

    const uploadVariable =
        uploadProgram.lookupVariableById('shared_variable');

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
        'Upload variable type is resolved without a Scratch target ID'
    );

    t.equal(
        uploadVariable.easybloxValueType,
        'TEXT',
        'EasyBlox type metadata is stored on the canonical Upload variable'
    );

    t.equal(
        uploadVariable.value,
        '',
        'new TEXT Upload variable normalizes the Scratch numeric zero to an empty string'
    );

    t.equal(
        stageVariable.easybloxValueType,
        null,
        'setting an Upload variable type does not mutate the Scratch Stage variable'
    );

    t.equal(
        stageVariable.value,
        0,
        'Upload TEXT normalization does not mutate the Scratch Stage variable value'
    );

    t.equal(
        projectChangedCount,
        1,
        'Upload variable metadata update marks the project as changed'
    );

    t.equal(
        vm.setVariableEasyBloxValueType(
            null,
            'missing_upload_variable',
            'INTEGER'
        ),
        false,
        'unknown Upload variable ID is rejected'
    );

    t.equal(
        projectChangedCount,
        1,
        'rejected Upload variable update does not mark the project as changed'
    );

    vm.setProgramContext(
        'stage',
        null
    );

    t.equal(
        vm.setVariableEasyBloxValueType(
            'stage',
            'shared_variable',
            'DECIMAL'
        ),
        true,
        'Stage context continues to resolve variables through the target ID'
    );

    t.equal(
        stageVariable.easybloxValueType,
        'DECIMAL',
        'Stage variable metadata still uses the legacy target-owned path'
    );

    t.equal(
        uploadVariable.easybloxValueType,
        'TEXT',
        'returning to Stage does not mutate Upload variable metadata'
    );

    t.equal(
        projectChangedCount,
        2,
        'successful Stage and Upload metadata updates each mark the project as changed'
    );

    t.end();
});

test('VirtualMachine emits workspace XML from the active Stage or Upload program', t => {
    const vm = new VirtualMachine();

    const stage = {
        id: 'stage',
        isStage: true,
        isOriginal: true,
        toJSON: () => ({
            id: 'stage',
            isStage: true
        }),
        variables: {
            stage_variable: {
                type: '',
                toXML: () => 'STAGE_VARIABLE'
            }
        },
        comments: {},
        blocks: {
            _blocks: {},
            toXML: () => 'STAGE_BLOCKS'
        }
    };

    vm.runtime.targets = [stage];
    vm.editingTarget = stage;

    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    uploadProgram.variables.upload_variable = {
        toXML: () => 'UPLOAD_VARIABLE'
    };

    uploadProgram.blocks.toXML = () =>
        'UPLOAD_BLOCKS';

    let workspaceXml = null;

    vm.emit = (eventName, data) => {
        if (eventName === 'workspaceUpdate') {
            workspaceXml = data.xml;
        }
    };

    vm.refreshWorkspace();

    t.match(
        workspaceXml,
        /STAGE_VARIABLE/,
        'Stage workspace contains Stage variables'
    );

    t.match(
        workspaceXml,
        /STAGE_BLOCKS/,
        'Stage workspace contains Stage blocks'
    );

    t.notMatch(
        workspaceXml,
        /UPLOAD_VARIABLE|UPLOAD_BLOCKS/,
        'Stage workspace does not leak Upload program data'
    );

    vm.setProgramContext(
        'upload',
        'arduino-uno'
    );

    workspaceXml = null;
    vm.refreshWorkspace();

    t.match(
        workspaceXml,
        /UPLOAD_VARIABLE/,
        'Upload workspace contains canonical Upload variables'
    );

    t.match(
        workspaceXml,
        /UPLOAD_BLOCKS/,
        'Upload workspace contains canonical Upload blocks'
    );

    t.notMatch(
        workspaceXml,
        /STAGE_VARIABLE|STAGE_BLOCKS/,
        'Upload workspace does not leak Scratch Stage data'
    );

    vm.setProgramContext(
        'stage',
        null
    );

    workspaceXml = null;
    vm.refreshWorkspace();

    t.match(
        workspaceXml,
        /STAGE_VARIABLE/,
        'returning to Stage restores Stage variables'
    );

    t.match(
        workspaceXml,
        /STAGE_BLOCKS/,
        'returning to Stage restores Stage blocks'
    );

    t.notMatch(
        workspaceXml,
        /UPLOAD_VARIABLE|UPLOAD_BLOCKS/,
        'returning to Stage hides but preserves Upload program data'
    );

    t.equal(
        uploadProgram.variables.upload_variable.toXML(),
        'UPLOAD_VARIABLE',
        'switching back to Stage preserves canonical Upload variables'
    );

    t.equal(
        uploadProgram.blocks.toXML(),
        'UPLOAD_BLOCKS',
        'switching back to Stage preserves canonical Upload blocks'
    );

    t.end();
});

test('VirtualMachine exposes Arduino UNO Upload code generation', t => {
    const vm = new VirtualMachine();

    t.type(
        vm.generateArduinoUnoUploadCode,
        'function'
    );

    t.end();
});

test('VirtualMachine generates Arduino UNO Upload C++ from current runtime', t => {
    const vm = new VirtualMachine();

    vm.runtime = createRuntimeWithBlocks([
        createUploadHat('digital_write'),
        {
            id: 'digital_write',
            opcode: 'arduinoUno_digitalWrite',
            next: null,
            parent: 'upload_hat',
            inputs: {
                PIN: {
                    name: 'PIN',
                    block: 'pin',
                    shadow: 'pin'
                },
                VALUE: {
                    name: 'VALUE',
                    block: 'value',
                    shadow: 'value'
                }
            },
            fields: {},
            topLevel: false,
            shadow: false
        },
        createNumberShadow(
            'pin',
            'digital_write',
            13
        ),
        createNumberShadow(
            'value',
            'digital_write',
            1
        )
    ]);

    const code = vm.generateArduinoUnoUploadCode();

    t.equal(code, [
        'void setup() {',
        '    pinMode(13, OUTPUT);',
        '    digitalWrite(13, HIGH);',
        '}',
        '',
        'void loop() {',
        '}',
        ''
    ].join('\n'));

    t.end();
});

test('VirtualMachine generates Arduino UNO Serial Upload C++ from current runtime', t => {
    const vm = new VirtualMachine();

    vm.runtime = createRuntimeWithBlocks([
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

    vm.runtime = createRuntimeWithBlocks([
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
