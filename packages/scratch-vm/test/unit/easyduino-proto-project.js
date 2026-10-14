const {test} = require('tap');
const JSZip = require('jszip');
const crypto = require('crypto');
const VirtualMachine = require('../../src/virtual-machine');
const Sprite = require('../../src/sprites/sprite');
const ArduinoUno = require('../../src/extensions/scratch3_arduino_uno');
const Actuators = require('../../src/extensions/scratch3_actuators');
const Sensors = require('../../src/extensions/scratch3_sensors');
const Displays = require('../../src/extensions/scratch3_displays');
const UnoProfile = require('../../src/upload/board-profiles/arduino-uno-board-profile');

const createVm = () => {
    const vm = new VirtualMachine();
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

    return vm;
};

const createHat = id => ({
    id,
    opcode: 'arduinoUno_whenArduinoUnoStart',
    next: null,
    parent: null,
    inputs: {},
    fields: {},
    topLevel: true,
    shadow: false
});

for (const mode of ['stage', 'upload']) {
    test(`Proto .sb3 roundtrip preserves ${mode} identity and independent UNO programs`, async t => {
        const source = createVm();
        const restored = new VirtualMachine();
        t.teardown(() => {
            source.runtime.dispose();
            restored.runtime.dispose();
        });
        const uno = source.getOrCreateUploadProgram('arduino-uno');
        const proto = source.getOrCreateUploadProgram('easyduino-proto');
        uno.blocks.createBlock(createHat('uno-hat'));
        proto.blocks.createBlock(createHat('proto-hat'));
        source.setEasyBloxSelectedBoard('easyduino-proto');
        source.setProgramContext(mode, mode === 'upload' ? 'easyduino-proto' : null);

        const blob = await source.saveProjectSb3();
        const bytes = Buffer.from(await blob.arrayBuffer());
        t.equal(bytes.subarray(0, 2).toString(), 'PK', 'serializes a real sb3 ZIP');
        const zip = await JSZip.loadAsync(bytes);
        const json = JSON.parse(await zip.file('project.json').async('string'));
        t.equal(json.easybloxProject.selectedBoardId, 'easyduino-proto', 'keeps the logical product ID');
        t.equal(json.easybloxProject.programMode, mode, 'keeps the mode');
        t.same(Object.keys(json.easybloxUploadPrograms).sort(), ['arduino-uno', 'easyduino-proto']);

        await restored.loadProject(bytes);
        t.same(restored.getEasyBloxProjectContext(), {selectedBoardId: 'easyduino-proto', programMode: mode});
        const loadedUno = restored.getOrCreateUploadProgram('arduino-uno');
        const loadedProto = restored.getOrCreateUploadProgram('easyduino-proto');
        t.not(loadedUno.blocks, loadedProto.blocks, 'each product retains a separate block store');
        t.ok(loadedUno.blocks.getBlock('uno-hat'));
        t.notOk(loadedUno.blocks.getBlock('proto-hat'));
        t.ok(loadedProto.blocks.getBlock('proto-hat'));
        t.notOk(loadedProto.blocks.getBlock('uno-hat'));
        loadedUno.blocks.deleteBlock('uno-hat');
        t.notOk(loadedUno.blocks.getBlock('uno-hat'), 'UNO edit is applied');
        t.ok(loadedProto.blocks.getBlock('proto-hat'), 'editing UNO cannot remove Proto blocks');
    });
}

test('Proto shares the UNO profile, C++ and categories without narrowing accessible pins', t => {
    const vm = createVm();
    t.teardown(() => vm.runtime.dispose());
    vm.setEasyBloxSelectedBoard('easyduino-proto');
    t.equal(vm._getArduinoUnoUploadBoardProfile('easyduino-proto'), UnoProfile);
    t.same(UnoProfile.servoPins, [3, 5, 6, 9, 10, 11], 'quick connectors do not restrict UNO servo pins');
    t.equal(vm.generateArduinoUnoUploadCode('easyduino-proto'), vm.generateArduinoUnoUploadCode('arduino-uno'));
    t.match(vm.generateArduinoUnoUploadBuildBundle('easyduino-proto').code, /void setup\(\)/);
    const arduino = new ArduinoUno(vm.runtime);
    t.equal(arduino.getInfo().id, 'arduinoUno');
    t.equal(arduino.getInfo().name, 'Arduino UNO');
    t.ok(arduino.getInfo().blocks.some(block => block.opcode === 'digitalWrite'));
    const groups = [new Actuators(vm.runtime), new Sensors(vm.runtime), new Displays(vm.runtime)];
    t.same(groups.map(group => group.getInfo().id), ['actuators', 'sensors', 'displays']);
    t.ok(groups[0].getInfo().blocks.some(block => block.opcode === 'servoWrite'));
    t.ok(groups[1].getInfo().blocks.some(block => block.opcode === 'joystickInit' && !block.hideFromPalette));
    t.ok(groups[2].getInfo().blocks.some(block => block.opcode === 'configureMatrix'));
    t.end();
});
