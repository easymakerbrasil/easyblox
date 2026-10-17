'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {EventEmitter} = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
    registerDesktopNativeSaveIpc,
    CHOOSE_CHANNEL,
    WRITE_CHANNEL
} = require('../src/desktop-native-save-ipc');

const fixture = (filePath, response = {}) => {
    const handlers = new Map();
    const contents = new EventEmitter();
    contents.ipc = {
        handle: (channel, callback) => handlers.set(channel, callback),
        removeHandler: channel => handlers.delete(channel)
    };
    contents.mainFrame = {
        origin: 'http://127.0.0.1:8601',
        url: 'http://127.0.0.1:8601/'
    };
    contents.getURL = () => contents.mainFrame.url;
    contents.isDestroyed = () => false;
    const window = new EventEmitter();
    window.isDestroyed = () => false;
    window.webContents = contents;
    const event = {sender: contents, senderFrame: contents.mainFrame};
    const dialog = {
        showSaveDialog: async () => ({
            canceled: false,
            filePath,
            ...response
        })
    };
    const registration = registerDesktopNativeSaveIpc(window, {dialog});
    return {handlers, contents, event, dialog, registration};
};

test('native desktop file save writes the chosen sb3 and replaces it only on success', async t => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'easyblox-save-'));
    t.after(() => fs.rm(dir, {recursive: true, force: true}));
    const target = path.join(dir, 'Projeto.sb3');
    await fs.writeFile(target, 'old');
    const {handlers, event, registration} = fixture(target);
    const chosen = await handlers.get(CHOOSE_CHANNEL)(event, 'Projeto.sb3');
    assert.equal(chosen.cancelled, false);
    assert.equal(chosen.name, 'Projeto.sb3');
    assert.ok(typeof chosen.token === 'string');
    const data = new Uint8Array([80, 75, 3, 4]);
    assert.deepEqual(await handlers.get(WRITE_CHANNEL)(event, chosen.token, data), {
        status: 'saved'
    });
    assert.deepEqual(await fs.readFile(target), Buffer.from(data));
    registration.dispose();
    assert.equal(handlers.has(CHOOSE_CHANNEL), false);
    assert.equal(handlers.has(WRITE_CHANNEL), false);
});

test('native desktop save rejects forged frames, unknown tokens and navigated sessions', async t => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'easyblox-save-'));
    t.after(() => fs.rm(dir, {recursive: true, force: true}));
    const target = path.join(dir, 'Projeto.sb3');
    const {handlers, contents, event, registration} = fixture(target);
    await assert.rejects(
        handlers.get(CHOOSE_CHANNEL)({sender: contents, senderFrame: {}}, 'Projeto.sb3'),
        /DESKTOP_UNAUTHORIZED/
    );
    await assert.rejects(
        handlers.get(WRITE_CHANNEL)(event, 'unknown', new Uint8Array([1])),
        /DESKTOP_SAVE_INVALID_ARGUMENTS/
    );
    const chosen = await handlers.get(CHOOSE_CHANNEL)(event, 'Projeto.sb3');
    contents.emit('did-start-navigation', {}, {isSameDocument: true, isMainFrame: true});
    assert.equal(await handlers.get(WRITE_CHANNEL)(event, chosen.token, new Uint8Array([1])).then(x => x.status), 'saved');
    // A real document navigation revokes the token.
    contents.emit('did-start-navigation', {}, {isSameDocument: false, isMainFrame: true});
    await assert.rejects(
        handlers.get(WRITE_CHANNEL)(event, chosen.token, new Uint8Array([1])),
        /DESKTOP_SAVE_INVALID_ARGUMENTS/
    );
    assert.deepEqual(await fs.readFile(target), Buffer.from([1]));
    registration.dispose();
});

test('cancelled native picker provides no file authorization', async () => {
    const {handlers, event, registration} = fixture('unused.sb3', {canceled: true});
    assert.deepEqual(await handlers.get(CHOOSE_CHANNEL)(event, 'Projeto.sb3'), {cancelled: true});
    await assert.rejects(
        handlers.get(WRITE_CHANNEL)(event, 'unused.sb3', new Uint8Array([1])),
        /DESKTOP_SAVE_INVALID_ARGUMENTS/
    );
    registration.dispose();
});

test('native disk failure keeps the token reusable and leaves no temporary file', async t => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'easyblox-save-'));
    t.after(() => fs.rm(dir, {recursive: true, force: true}));
    const parent = path.join(dir, 'missing');
    const target = path.join(parent, 'Projeto.sb3');
    const {handlers, event, registration} = fixture(target);
    const chosen = await handlers.get(CHOOSE_CHANNEL)(event, 'Projeto.sb3');
    await assert.rejects(
        handlers.get(WRITE_CHANNEL)(event, chosen.token, new Uint8Array([1])),
        {code: 'ENOENT'}
    );
    assert.deepEqual(await fs.readdir(dir), []);
    await fs.mkdir(parent);
    assert.deepEqual(await handlers.get(WRITE_CHANNEL)(event, chosen.token, new Uint8Array([2])), {
        status: 'saved'
    });
    assert.deepEqual(await fs.readdir(parent), ['Projeto.sb3']);
    registration.dispose();
});
