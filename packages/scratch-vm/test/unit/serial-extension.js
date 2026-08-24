const tap = require('tap');

const ArgumentType = require('../../src/extension-support/argument-type');
const BlockExecutionMode = require('../../src/extension-support/block-execution-mode');
const BlockType = require('../../src/extension-support/block-type');
const Runtime = require('../../src/engine/runtime');
const ArduinoUnoBoardProfile =
    require('../../src/upload/board-profiles/arduino-uno-board-profile');
const Scratch3SerialBlocks = require('../../src/extensions/scratch3_serial');

const test = tap.test;

test('Serial exposes the Upload-only v1 block contract', t => {
    const runtime = {};
    const extension = new Scratch3SerialBlocks(runtime);
    const info = extension.getInfo();

    t.equal(info.id, 'serial');
    t.equal(info.name, 'Serial');
    t.equal(info.blocks.length, 3);

    const serialBeginBlock = info.blocks[0];
    const serialWriteBlock = info.blocks[1];
    const serialWriteLineBlock = info.blocks[2];

    t.equal(serialBeginBlock.opcode, 'serialBegin');
    t.equal(serialBeginBlock.blockType, BlockType.COMMAND);
    t.equal(serialBeginBlock.executionMode, BlockExecutionMode.UPLOAD_ONLY);
    t.equal(serialBeginBlock.text, 'iniciar serial em [BAUD] baud');
    t.equal(serialBeginBlock.arguments.BAUD.type, ArgumentType.STRING);
    t.equal(serialBeginBlock.arguments.BAUD.menu, 'baudRates');
    t.equal(serialBeginBlock.arguments.BAUD.defaultValue, '9600');
    t.equal(
        info.menus.baudRates.acceptReporters,
        false
    );

    t.equal(serialWriteBlock.opcode, 'serialWrite');
    t.equal(serialWriteBlock.blockType, BlockType.COMMAND);
    t.equal(serialWriteBlock.executionMode, BlockExecutionMode.UPLOAD_ONLY);
    t.equal(serialWriteBlock.text, 'escrever na serial [TEXT]');
    t.equal(serialWriteBlock.arguments.TEXT.type, ArgumentType.STRING);
    t.equal(serialWriteBlock.arguments.TEXT.defaultValue, '');

    t.equal(serialWriteLineBlock.opcode, 'serialWriteLine');
    t.equal(serialWriteLineBlock.blockType, BlockType.COMMAND);
    t.equal(serialWriteLineBlock.executionMode, BlockExecutionMode.UPLOAD_ONLY);
    t.equal(serialWriteLineBlock.text, 'escrever linha na serial [TEXT]');
    t.equal(serialWriteLineBlock.arguments.TEXT.type, ArgumentType.STRING);
    t.equal(serialWriteLineBlock.arguments.TEXT.defaultValue, '');

    t.same(
        info.menus.baudRates.items,
        [
            {text: '4800', value: '4800'},
            {text: '9600', value: '9600'},
            {text: '19200', value: '19200'},
            {text: '38400', value: '38400'},
            {text: '57600', value: '57600'},
            {text: '115200', value: '115200'}
        ]
    );

    t.same(
        info.menus.baudRates.items.map(item =>
            Number(item.value)
        ),
        ArduinoUnoBoardProfile.serialBaudRates
    );

    t.end();
});

test('Serial is hidden in Stage and visible in Upload toolbox XML', t => {
    const runtime = new Runtime();
    const extension = new Scratch3SerialBlocks(runtime);

    runtime._registerExtensionPrimitives(
        extension.getInfo()
    );

    const stageBlocksXML = runtime.getBlocksXML(
        null,
        BlockExecutionMode.STAGE_ONLY
    );

    t.notOk(
        stageBlocksXML.find(category =>
            category.id === 'serial'
        ),
        'Serial category is hidden in Stage mode'
    );

    const uploadBlocksXML = runtime.getBlocksXML(
        null,
        BlockExecutionMode.UPLOAD_ONLY
    );

    const serialCategory = uploadBlocksXML.find(category =>
        category.id === 'serial'
    );

    t.ok(
        serialCategory,
        'Serial category is visible in Upload mode'
    );

    t.match(
        serialCategory.xml,
        '<block type="serial_serialBegin">',
        'Serial begin block is visible in Upload mode'
    );

    t.match(
        serialCategory.xml,
        '<block type="serial_serialWrite">',
        'Serial write block is visible in Upload mode'
    );

    t.match(
        serialCategory.xml,
        '<block type="serial_serialWriteLine">',
        'Serial write line block is visible in Upload mode'
    );

    t.end();
});
