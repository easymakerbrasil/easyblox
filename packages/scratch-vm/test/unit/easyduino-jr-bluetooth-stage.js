const {test} = require('tap');
const Runtime = require('../../src/engine/runtime');
const Peripheral = require('../../src/extensions/scratch3_arduino_uno/peripheral');
const BluetoothBlocks = require('../../src/extensions/scratch3_easyblox_bt');
const Serial = require('../../src/io/serial');
const {getEasyBloxStageConnectivity} = require('../../src/connectivity/easyblox-stage-connectivity');
const {COMMANDS, RESPONSES} = require('../../src/extensions/scratch3_arduino_uno/protocol');
const {encodeFrame, EBCP_CONTRACT} = require('@easymaker/easyblox-connectivity-core');
const {EASYCONECT_MOTORS_SERVO_SIGNAL_IDS, getEasyConectWireChannel} = require('@easymaker/easyconect-core');

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const settle = promise => Promise.race([
    promise,
    new Promise(resolve => setImmediate(() => resolve('pending')))
]);

const createHarness = t => {
    const runtime = new Runtime();
    runtime.setEasyBloxSelectedBoardId('arduino-uno');
    const peripheral = new Peripheral(runtime);
    const connectivity = getEasyBloxStageConnectivity(runtime);
    const blocks = new BluetoothBlocks(runtime);
    const writes = [];
    peripheral._serial = {
        isConnected: () => true,
        write: frame => writes.push(Buffer.from(frame))
    };
    peripheral._stageConnected = true;
    const ack = frame => peripheral._handleFrame({command: RESPONSES.ACK, sequence: frame[3], payload: []});
    const receive = (payload, channel = '1', sequence = 1, type = TEXT) => peripheral._handleFrame({
        command: RESPONSES.BT_SERIAL_DATA,
        sequence: 0,
        payload: encodeFrame({type, sequence, channel, payload})
    });
    const initialize = async () => {
        const pending = connectivity.initializeBluetoothSerial();
        ack(writes[writes.length - 1]);
        return pending;
    };
    t.teardown(() => {
        runtime.dispose();
        peripheral._reset();
    });
    return {runtime, peripheral, connectivity, blocks, writes, ack, receive, initialize};
};

test('Jr blocks direct Bluetooth calls and preserves common serial commands', t => {
    const {runtime, peripheral, writes} = createHarness(t);
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    t.equal(peripheral.initBluetoothSerial(), null);
    t.equal(peripheral.writeBluetoothSerial(Uint8Array.from([1])), null);
    t.equal(writes.length, 0);
    t.type(peripheral.digitalWrite(2, 1), 'number');
    t.equal(writes.length, 1);
    t.equal(writes[0][4], COMMANDS.DIGITAL_WRITE);
    t.end();
});

test('Jr synchronously invalidates the session, cancels waiters and ignores an old callback', async t => {
    const {runtime, peripheral, connectivity, writes, initialize, receive} = createHarness(t);
    await initialize();
    const oldCallback = peripheral._bluetoothSerialDataCallback;
    const generation = connectivity.contextGeneration;
    const pending = connectivity.waitFor(TEXT, '1');
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    t.ok(connectivity.contextGeneration > generation);
    t.equal(peripheral._bluetoothSerialDataCallback, null);
    t.equal(connectivity._connectivitySession, null);
    t.equal(connectivity.send(TEXT, '1', 'blocked'), null);
    t.equal(await settle(pending), null, 'cancellation settles explicitly without a fake message');
    const before = writes.length;
    oldCallback(encodeFrame({type: TEXT, sequence: 1, channel: '1', payload: 'old'}));
    receive('late-frame');
    t.equal(writes.length, before, 'old callback cannot ACK');
    t.equal(await settle(connectivity.waitFor(TEXT, '1')), null);
});

test('UNO to Jr to UNO discards inbox and never revives the old session', async t => {
    const {runtime, peripheral, connectivity, receive, initialize, writes} = createHarness(t);
    await initialize();
    const oldCallback = peripheral._bluetoothSerialDataCallback;
    receive('old-inbox');
    const generation = connectivity.sessionGeneration;
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    runtime.setEasyBloxSelectedBoardId('arduino-uno');
    t.ok(connectivity.sessionGeneration > generation, 'generation never resets backwards');
    const before = writes.length;
    t.equal(connectivity.send(TEXT, '1', 'old-session'), null);
    t.equal(writes.length, before);
    await initialize();
    const pending = connectivity.waitFor(TEXT, '1');
    const writeCount = writes.length;
    oldCallback(encodeFrame({type: TEXT, sequence: 3, channel: '1', payload: 'ghost'}));
    t.equal(writes.length, writeCount, 'a callback captured before Jr stays invalid after returning to UNO');
    t.equal(await settle(pending), 'pending', 'old inbox was discarded');
    receive('fresh', '1', 2);
    t.equal((await pending).payload, 'fresh');
});

test('A Bluetooth initialization ACK cannot revive an operation after UNO to Jr to UNO', async t => {
    const {runtime, peripheral, connectivity, writes, ack, initialize} = createHarness(t);
    const old = peripheral.initBluetoothSerial();
    const oldFrame = writes[writes.length - 1];
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    runtime.setEasyBloxSelectedBoardId('arduino-uno');
    ack(oldFrame);
    t.equal(await settle(old), null);
    t.notOk(peripheral._pendingCommandAcks.has(oldFrame[3]));
    t.type(await initialize(), 'number', 'a fresh operation still succeeds');
    const pending = connectivity.initializeBluetoothSerial();
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    t.equal(await settle(pending), null);
});

test('Common serial ACKs survive Bluetooth invalidation', async t => {
    const {runtime, peripheral, writes, ack} = createHarness(t);
    const pending = peripheral._sendCommandWithAck(COMMANDS.LCD_INIT);
    const frame = writes[writes.length - 1];
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    ack(frame);
    t.equal(await pending, frame[3]);
});

test('Text and number waits cancel without rejected promises or received values', async t => {
    const {runtime, blocks, initialize} = createHarness(t);
    await initialize();
    const util = {thread: {}};
    const text = blocks.waitText({}, util);
    const number = blocks.waitNumber({}, util);
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    t.equal(typeof await settle(text), 'undefined');
    t.equal(typeof await settle(number), 'undefined');
    t.equal(blocks.receivedText({}, util), '');
    t.equal(blocks.receivedNumber({}, util), 0);
});

test('An already resolved receive cannot write state after a context switch', async t => {
    const {runtime, blocks, receive, initialize} = createHarness(t);
    await initialize();
    const util = {thread: {}};
    const pending = blocks.waitText({}, util);
    receive('stale');
    await Promise.resolve();
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    runtime.setEasyBloxSelectedBoardId('arduino-uno');
    await settle(pending);
    t.equal(blocks.receivedText({}, util), '');
});

test('Late EasyConect signals cannot actuate or rearm watchers after a Jr switch', async t => {
    const {runtime, peripheral, blocks, receive, initialize} = createHarness(t);
    await initialize();
    const signal = Object.values(EASYCONECT_MOTORS_SERVO_SIGNAL_IDS)[0];
    let actuations = 0;
    peripheral.motorWrite = () => actuations++;
    blocks._bindEasyConectRemoteActuator(signal, {type: 'motor', in1Pin: 4, in2Pin: 7, pwmPin: 5});
    receive(50, getEasyConectWireChannel(signal), 1, EBCP_CONTRACT.messageTypes.NUMBER);
    await Promise.resolve();
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    runtime.setEasyBloxSelectedBoardId('arduino-uno');
    await new Promise(resolve => setImmediate(resolve));
    t.equal(actuations, 0);
    t.equal(blocks._easyConectRemoteActuatorBindings.size, 0);
    t.equal(blocks._easyConectWatchersActive, false);
});

for (const boardId of ['arduino-uno', 'easymaker', 'easyduino-proto']) {
    test(`${boardId} keeps Bluetooth initialization, sending and receiving`, async t => {
        const {runtime, connectivity, receive, initialize} = createHarness(t);
        runtime.setEasyBloxSelectedBoardId(boardId);
        t.type(await initialize(), 'number');
        t.type(connectivity.send(TEXT, '1', 'hello'), 'number');
        const pending = connectivity.waitFor(TEXT, '1');
        receive('reply');
        t.equal((await pending).payload, 'reply');
    });
}

test('Repeated lookups and project disposal do not duplicate listeners or change block metadata', t => {
    const {runtime, blocks, connectivity} = createHarness(t);
    const metadata = blocks.getInfo();
    const count = runtime.listenerCount('EASYBLOX_SELECTED_BOARD_CHANGED');
    t.equal(count, 3);
    for (let index = 0; index < 3; index++) {
        t.equal(getEasyBloxStageConnectivity(runtime), connectivity);
        runtime.dispose();
        runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    }
    t.equal(runtime.listenerCount('EASYBLOX_SELECTED_BOARD_CHANGED'), count);
    t.same(blocks.getInfo(), metadata);
    t.end();
});

test('Stopping a compatible project cancels waits without cancelling Bluetooth initialization', async t => {
    const {runtime, connectivity, writes, ack} = createHarness(t);
    const initialization = connectivity.initializeBluetoothSerial();
    const frame = writes[writes.length - 1];
    const wait = connectivity.waitFor(TEXT, '1');
    runtime.stopAll();
    t.equal(await settle(wait), null);
    t.equal(await settle(initialization), 'pending');
    ack(frame);
    t.equal(await initialization, frame[3]);
});

const holdSerialQueue = async (t, {runtime, peripheral}) => {
    let releaseFirst;
    const firstWrite = new Promise(resolve => {
        releaseFirst = resolve;
    });
    const frames = [];
    runtime.configureSerialTransportFactory(() => ({
        open: () => Promise.resolve(),
        close: () => Promise.resolve(),
        write: frame => {
            frames.push(Buffer.from(frame));
            return frames.length === 1 ? firstWrite : Promise.resolve();
        }
    }));
    const serial = new Serial(runtime, 'arduinoUno');
    t.teardown(() => {
        releaseFirst();
        return serial.disconnect();
    });
    serial.connect('simulated-port');
    await new Promise(resolve => setImmediate(resolve));
    peripheral._serial = serial;
    peripheral.digitalWrite(2, 1);
    await new Promise(resolve => setImmediate(resolve));
    return {serial, frames, releaseFirst};
};

test('Queued Bluetooth is dropped after Jr while ordinary commands and their ACKs survive', async t => {
    const harness = createHarness(t);
    const {runtime, peripheral, ack} = harness;
    const {serial, frames, releaseFirst} = await holdSerialQueue(t, harness);
    const initialization = peripheral.initBluetoothSerial();
    const oldSequence = [...peripheral._pendingCommandAcks.keys()][0];
    t.type(peripheral.writeBluetoothSerial(Uint8Array.from([1])), 'number');
    const droppedWrite = serial._writeQueue;
    const ordinaryAck = peripheral._sendCommandWithAck(COMMANDS.LCD_INIT);
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    t.equal(await settle(initialization), null, 'initialization settles before the blocked transport is released');
    t.notOk(peripheral._pendingCommandAcks.has(oldSequence));
    ack(Uint8Array.from([0, 0, 0, oldSequence]));
    t.equal(peripheral.initBluetoothSerial(), null);
    t.equal(peripheral.writeBluetoothSerial(Uint8Array.from([2])), null, 'new calls are blocked');
    peripheral.digitalWrite(3, 1);
    releaseFirst();
    await serial._writeQueue;
    t.equal(await settle(droppedWrite), null, 'a dropped queue entry settles without waiting for an ACK');
    t.same(frames.map(frame => frame[4]), [COMMANDS.DIGITAL_WRITE, COMMANDS.LCD_INIT, COMMANDS.DIGITAL_WRITE]);
    ack(frames[1]);
    t.equal(await settle(ordinaryAck), frames[1][3]);
    t.equal(serial.isConnected(), true, 'dropping Bluetooth does not disconnect the physical port');
});

test('UNO to Jr to UNO never revives old queued chunks and allows a fresh session', async t => {
    const harness = createHarness(t);
    const {runtime, connectivity, peripheral, ack, initialize} = harness;
    await initialize();
    const {serial, frames, releaseFirst} = await holdSerialQueue(t, harness);
    const oldInitialization = peripheral.initBluetoothSerial();
    const oldSequence = [...peripheral._pendingCommandAcks.keys()][0];
    const before = peripheral._nextSequence;
    t.type(connectivity.send(TEXT, '1', 'x'.repeat(EBCP_CONTRACT.maxPayloadBytes)), 'number');
    t.ok(peripheral._nextSequence - before > 1, 'the old EBCP message spans several queued chunks');
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    runtime.setEasyBloxSelectedBoardId('arduino-uno');
    const freshInitialization = connectivity.initializeBluetoothSerial();
    t.type(connectivity.send(TEXT, '1', 'fresh'), 'number');
    peripheral.digitalWrite(4, 0);
    releaseFirst();
    await serial._writeQueue;
    t.same(frames.map(frame => frame[4]), [
        COMMANDS.DIGITAL_WRITE, COMMANDS.BT_SERIAL_INIT, COMMANDS.BT_SERIAL_WRITE, COMMANDS.DIGITAL_WRITE
    ]);
    t.equal(await settle(oldInitialization), null);
    ack(Uint8Array.from([0, 0, 0, oldSequence]));
    t.equal(await settle(freshInitialization), 'pending', 'the old ACK cannot acknowledge the new initialization');
    ack(frames[1]);
    t.equal(await settle(freshInitialization), frames[1][3]);
    t.equal(serial.isConnected(), true);
});

test('Bluetooth invalidated before the queue microtask never reaches the transport', async t => {
    const harness = createHarness(t);
    const {runtime, peripheral} = harness;
    const {serial, frames, releaseFirst} = await holdSerialQueue(t, harness);
    releaseFirst();
    await serial._writeQueue;
    peripheral.writeBluetoothSerial(Uint8Array.from([1]));
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    await serial._writeQueue;
    t.same(frames.map(frame => frame[4]), [COMMANDS.DIGITAL_WRITE]);
});

test('Bluetooth already handed to the transport cannot be recalled', async t => {
    const harness = createHarness(t);
    const {runtime, peripheral} = harness;
    const {serial, frames, releaseFirst} = await holdSerialQueue(t, harness);
    releaseFirst();
    await serial._writeQueue;
    peripheral.writeBluetoothSerial(Uint8Array.from([1]));
    await serial._writeQueue;
    runtime.setEasyBloxSelectedBoardId('easyduino-jr');
    t.same(frames.map(frame => frame[4]), [COMMANDS.DIGITAL_WRITE, COMMANDS.BT_SERIAL_WRITE]);
    t.equal(peripheral.writeBluetoothSerial(Uint8Array.from([2])), null);
});
