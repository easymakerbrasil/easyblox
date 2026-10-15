const {test} = require('tap');
const crypto = require('crypto');
const JSZip = require('jszip');
const VirtualMachine = require('../../src/virtual-machine');
const Sprite = require('../../src/sprites/sprite');
const UnoProfile = require('../../src/upload/board-profiles/arduino-uno-board-profile');
const UploadResourceValidator = require('../../src/upload/upload-resource-validator');
const {CONNECTIVITY_RESOURCES} = require('../../src/connectivity/easyblox-connectivity-contract');

const UART = CONNECTIVITY_RESOURCES.SOFTWARE_UART_D2_D3;
const resourceError = /Hardware resource is not supported by the selected board/;

const addBluetoothProgram = (vm, boardId) => {
    const program = vm.getOrCreateUploadProgram(boardId);
    program.blocks.createBlock({
        id: 'hat',
        opcode: 'arduinoUno_whenArduinoUnoStart',
        next: 'bt',
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false
    });
    program.blocks.createBlock({
        id: 'bt',
        opcode: 'easybloxBt_init',
        next: null,
        parent: 'hat',
        inputs: {},
        fields: {},
        topLevel: false,
        shadow: false
    });
    return program;
};

test('Jr effective Upload profile removes only Bluetooth without changing shared profiles', t => {
    const vm = new VirtualMachine();
    t.teardown(() => vm.quit());
    const snapshot = JSON.stringify(UnoProfile);
    const jr = vm._getArduinoUnoUploadBoardProfile('easyduino-jr');
    t.not(jr, UnoProfile);
    t.equal(jr.id, 'easyduino-jr');
    t.ok(Object.isFrozen(jr));
    t.ok(Object.isFrozen(jr.logicalResources));
    t.notOk(Object.hasOwn(jr.logicalResources, UART));
    const {id, logicalResources, ...jrHardware} = jr;
    const {id: unoId, logicalResources: unoResources, ...unoHardware} = UnoProfile;
    t.equal(id, 'easyduino-jr');
    t.equal(unoId, 'arduino-uno');
    t.same(jrHardware, unoHardware);
    for (const key of Object.keys(unoHardware)) {
        t.equal(jrHardware[key], unoHardware[key], `${key} retains the shared value`);
    }
    t.same(logicalResources, Object.fromEntries(Object.entries(unoResources).filter(([name]) => name !== UART)));
    t.equal(vm._getArduinoUnoUploadBoardProfile('arduino-uno'), UnoProfile);
    t.equal(vm._getArduinoUnoUploadBoardProfile('easyduino-proto'), UnoProfile);
    t.equal(JSON.stringify(UnoProfile), snapshot);
    t.end();
});

test('Jr rejects Bluetooth resources but leaves D2/D3 and other UNO resources usable', t => {
    const vm = new VirtualMachine();
    t.teardown(() => vm.quit());
    const validator = new UploadResourceValidator(vm._getArduinoUnoUploadBoardProfile('easyduino-jr'));
    t.throws(() => validator.validate({resources: [UART], setup: [], loop: []}), resourceError);
    const ir = {
        setup: [{type: 'DigitalWrite', pin: 2, value: true}, {type: 'DigitalWrite', pin: 3, value: false}],
        loop: [],
        resources: []
    };
    t.equal(validator.validate(ir), ir);
    const empty = vm.generateArduinoUnoUploadBuildBundle('easyduino-jr');
    t.match(empty.code, /void setup\(\)/);
    t.notMatch(empty.code, /EasyBloxBT/);
    t.same(empty.supportFiles, []);
    t.end();
});

test('Upload validation uses the program owner and preserves independent Bluetooth programs', t => {
    const vm = new VirtualMachine();
    t.teardown(() => vm.quit());
    const jr = addBluetoothProgram(vm, 'easyduino-jr');
    const before = JSON.stringify(jr.blocks._blocks);
    for (const boardId of ['arduino-uno', 'easymaker', 'easyduino-proto']) {
        const compatible = addBluetoothProgram(vm, boardId);
        t.not(jr.blocks, compatible.blocks, `${boardId} has its own block storage`);
        vm.setEasyBloxSelectedBoard(boardId);
        t.throws(() => vm.generateArduinoUnoUploadCode('easyduino-jr'), resourceError);
        t.throws(() => vm.generateArduinoUnoUploadBuildBundle('easyduino-jr'), resourceError);
        vm.setEasyBloxSelectedBoard('easyduino-jr');
        const bundle = vm.generateArduinoUnoUploadBuildBundle(boardId);
        t.match(bundle.code, /EasyBloxBT\.begin\(\)/, `${boardId} still generates Bluetooth`);
        t.ok(bundle.supportFiles.length > 0);
        t.ok(vm._getArduinoUnoUploadBoardProfile(boardId).logicalResources[UART]);
    }
    t.equal(JSON.stringify(jr.blocks._blocks), before);
    t.ok(jr.blocks.getBlock('bt'));
    t.end();
});

test('A real Jr sb3 roundtrip preserves incompatible Bluetooth blocks and still refuses generation', async t => {
    const vm = new VirtualMachine();
    const restored = new VirtualMachine();
    t.teardown(() => {
        vm.quit();
        restored.quit();
    });
    const sprite = new Sprite(null, vm.runtime);
    sprite.name = 'Stage';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"></svg>';
    const assetId = crypto.createHash('md5')
        .update(svg)
        .digest('hex');
    sprite.costumes = [{
        assetId,
        name: 'backdrop1',
        bitmapResolution: 1,
        md5ext: `${assetId}.svg`,
        dataFormat: 'svg',
        rotationCenterX: 240,
        rotationCenterY: 180
    }];
    const stage = sprite.createClone();
    stage.isStage = true;
    stage.isOriginal = true;
    stage.currentCostume = 0;
    vm.runtime.targets = [stage];
    vm.setEditingTarget(stage);
    addBluetoothProgram(vm, 'easyduino-jr');
    vm.setProgramContext('upload', 'easyduino-jr');
    const blob = await vm.saveProjectSb3();
    const bytes = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(bytes);
    const json = JSON.parse(await zip.file('project.json').async('string'));
    t.equal(json.easybloxProject.selectedBoardId, 'easyduino-jr');
    t.ok(json.easybloxUploadPrograms['easyduino-jr'].blocks.bt);
    t.ok(json.extensions.includes('easybloxBt'));
    await restored.loadProject(bytes);
    t.equal(restored.getEasyBloxProjectContext().selectedBoardId, 'easyduino-jr');
    const program = restored.getOrCreateUploadProgram('easyduino-jr');
    t.equal(program.blocks.getBlock('bt').opcode, 'easybloxBt_init');
    t.throws(() => restored.generateArduinoUnoUploadBuildBundle('easyduino-jr'), resourceError);
    const savedAgain = JSON.parse(restored.toJSON());
    t.ok(savedAgain.easybloxUploadPrograms['easyduino-jr'].blocks.bt);
});
