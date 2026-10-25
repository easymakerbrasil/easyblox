const tap = require('tap');

const Runtime = require('../../src/engine/runtime');
const Scratch3ArduinoUnoBlocks =
    require('../../src/extensions/scratch3_arduino_uno');
const Scratch3ActuatorsBlocks =
    require('../../src/extensions/scratch3_actuators');

tap.test('EB-BUG-TONE-01 Stage awaits each of six UNO notes without blocking other scripts', async t => {
    const runtime = new Runtime();
    t.teardown(() => runtime.dispose());
    runtime.setEasyBloxSelectedBoardId('arduino-uno');

    const extension = new Scratch3ArduinoUnoBlocks(runtime);
    const sent = [];
    extension._peripheral.toneStart = (pin, frequency, duration) => {
        sent.push({pin, frequency, duration});
        return sent.length;
    };

    const frequencies = [262, 294, 330, 349, 392, 440];
    const utility = {stackFrame: {}};
    for (const [index, frequency] of frequencies.entries()) {
        const pending = extension.toneStart({
            PIN: 6,
            NOTE: frequency,
            DURATION: 15
        }, utility);

        t.type(pending.then, 'function', 'the Stage VM must wait for the note');
        t.equal(sent.length, index + 1, 'only the current note is dispatched');

        let otherScriptRan = false;
        await Promise.resolve().then(() => {
            otherScriptRan = true;
        });
        t.ok(otherScriptRan, 'other JavaScript / VM work remains schedulable');
        t.equal(await pending, index + 1, 'the current note finishes before the script advances');
    }

    t.same(sent, frequencies.map(frequency => ({
        pin: 6,
        frequency,
        duration: 15
    })), 'six notes were sent in order');

    extension._peripheral.toneStart = () => null;
    t.equal(extension.toneStart({PIN: 6, NOTE: 440, DURATION: 15}, utility),
        null, 'unavailable Stage commands do not create a delay');
});

tap.test('EB-BUG-TONE-01 Stage waits for EasyMaker and EasyDuino Jr buzzer notes', async t => {
    let boardId = 'easymaker';
    const sent = [];
    const peripheral = {
        toneStart: (pin, frequency, duration) => {
            sent.push({pin, frequency, duration});
            return sent.length;
        }
    };
    const extension = new Scratch3ActuatorsBlocks({
        getPeripheralExtension: () => peripheral,
        getEasyBloxSelectedBoardId: () => boardId
    });
    const utility = {stackFrame: {}};

    const easyMakerNote = extension.toneStart({
        PIN: 3,
        NOTE: 262,
        DURATION: 15
    }, utility);
    t.type(easyMakerNote.then, 'function', 'EasyMaker Stage note waits');
    t.equal(await easyMakerNote, 1);

    boardId = 'easyduino-jr';
    const jrNote = extension.toneStart({
        NOTE: 440,
        DURATION: 15
    }, utility);
    t.type(jrNote.then, 'function', 'EasyDuino Jr Stage note waits');
    t.equal(await jrNote, 2);

    t.same(sent, [
        {pin: 3, frequency: 262, duration: 15},
        {pin: 6, frequency: 440, duration: 15}
    ]);

    t.equal(extension.toneStart({NOTE: 262, DURATION: 15}), 3,
        'direct calls without Scratch utility preserve the existing synchronous contract');
});
