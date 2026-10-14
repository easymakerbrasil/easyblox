const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {EventEmitter} = require('node:events');
const {test} = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../src/desktop-preload.js'), 'utf8');
const loadPreload = (href = 'http://127.0.0.1:8601/', isMainFrame = true) => {
    const calls = [];
    const exposed = [];
    const document = new EventEmitter();
    document.addEventListener = document.on.bind(document);
    document.removeEventListener = document.removeListener.bind(document);
    const window = new EventEmitter();
    window.addEventListener = window.on.bind(window);
    vm.runInNewContext(source, {
        URL,
        location: {href},
        process: {isMainFrame},
        document,
        window,
        require: name => {
            assert.equal(name, 'electron', 'sandbox preload must only import electron');
            return {
                contextBridge: {exposeInMainWorld: (key, api) => exposed.push({key, api})},
                ipcRenderer: {invoke: (...args) => {
                    calls.push(args);
                    return Promise.resolve({
                        productName: 'EasyBlox', version: '0.4.1', platform: 'win32', isPackaged: false
                    });
                }}
            };
        }
    });
    return {calls, exposed, document, window};
};

test('Sandbox preload exposes only getAppInfo through a fixed IPC channel', async () => {
    const fixture = loadPreload('http://127.0.0.1:8601/index.html?lang=pt-br#123');
    assert.equal(fixture.exposed.length, 1);
    assert.equal(fixture.exposed[0].key, 'easybloxDesktop');
    assert.deepEqual(Object.keys(fixture.exposed[0].api), ['getAppInfo']);
    await fixture.exposed[0].api.getAppInfo();
    assert.deepEqual(fixture.calls, [['easyblox:desktop:get-app-info']]);
    assert.deepEqual(fixture.document.eventNames(), []);
    assert.deepEqual(fixture.window.eventNames(), []);
});

test('Sandbox preload never exposes the bridge in an unauthorized document or frame', () => {
    for (const url of ['https://example.com/', 'http://localhost:8601/',
        'http://127.0.0.1:8601/other.html', 'about:blank', 'http://user@127.0.0.1:8601/']) {
        assert.equal(loadPreload(url).exposed.length, 0);
    }
    assert.equal(loadPreload('http://127.0.0.1:8601/', false).exposed.length, 0);
});

test('Sandbox preload rejects unexpected arguments without invoking IPC', async () => {
    const fixture = loadPreload();
    await assert.rejects(fixture.exposed[0].api.getAppInfo('extra'), /DESKTOP_INVALID_ARGUMENTS/);
    assert.equal(fixture.calls.length, 0);
});
