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
    const ipcEvents = new EventEmitter();
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
                ipcRenderer: {
                    invoke: (...args) => {
                        calls.push(args);
                        return Promise.resolve({
                            productName: 'EasyBlox',
                            version: '0.4.1',
                            platform: 'win32',
                            isPackaged: false
                        });
                    },
                    on: (channel, listener) => {
                        ipcEvents.on(channel, listener);
                    },
                    removeListener: (channel, listener) => {
                        ipcEvents.removeListener(channel, listener);
                    }
                }
            };
        }
    });
    return {calls, exposed, document, window, ipcEvents};
};

test('Sandbox preload exposes only the approved desktop bridge methods', async () => {
    const fixture = loadPreload('http://127.0.0.1:8601/index.html?lang=pt-br#123');
    assert.equal(fixture.exposed.length, 1);
    assert.equal(fixture.exposed[0].key, 'easybloxDesktop');
    assert.deepEqual(
        Object.keys(fixture.exposed[0].api).sort(),
        [
            'getAppInfo',
            'onCloseRequested',
            'onCloseDecision',
            'chooseProjectFile',
            'writeProjectFile',
            'ackClose',
            'resolveClose'
        ].sort()
    );
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

test('native save bridge forwards bytes and an opaque token, rejecting invalid content before IPC', async () => {
    const fixture = loadPreload();
    const api = fixture.exposed[0].api;
    const bytes = new Uint8Array([80, 75, 3, 4]);
    await api.chooseProjectFile('Projeto.sb3');
    await api.writeProjectFile('opaque', bytes);
    assert.deepEqual(fixture.calls, [
        ['easyblox:desktop:project-choose-file', 'Projeto.sb3'],
        ['easyblox:desktop:project-write-file', 'opaque', bytes]
    ]);
    for (const invalid of [[], {}, new Uint8Array(), new Uint16Array([1]), bytes.buffer]) {
        await assert.rejects(api.writeProjectFile('opaque', invalid), /DESKTOP_SAVE_INVALID_ARGUMENTS/);
    }
    assert.equal(fixture.calls.length, 2);
});


test('Close subscription forwards only valid request IDs', () => {
    const fixture = loadPreload();
    const api = fixture.exposed[0].api;
    const received = [];

    const unsubscribe = api.onCloseRequested(
        requestId => received.push(requestId)
    );

    const channel = 'easyblox:desktop:close-requested';

    fixture.ipcEvents.emit(channel, {sender: 'internal'}, 1);
    fixture.ipcEvents.emit(channel, {sender: 'internal'}, 2);

    fixture.ipcEvents.emit(channel, {}, 0);
    fixture.ipcEvents.emit(channel, {}, -1);
    fixture.ipcEvents.emit(channel, {}, '3');
    fixture.ipcEvents.emit(channel, {}, 1.5);
    fixture.ipcEvents.emit(channel, {}, Number.MAX_SAFE_INTEGER + 1);

    assert.deepEqual(received, [1, 2]);

    unsubscribe();

    fixture.ipcEvents.emit(channel, {}, 3);

    assert.deepEqual(received, [1, 2]);
    assert.equal(fixture.ipcEvents.listenerCount(channel), 0);
});

test('Close subscription validates callbacks and unsubscribes idempotently', () => {
    const fixture = loadPreload();
    const api = fixture.exposed[0].api;
    const channel = 'easyblox:desktop:close-requested';

    assert.throws(
        () => api.onCloseRequested(null),
        /DESKTOP_CLOSE_INVALID_CALLBACK/
    );

    assert.equal(fixture.ipcEvents.listenerCount(channel), 0);

    const first = api.onCloseRequested(() => {});
    const second = api.onCloseRequested(() => {});

    assert.equal(fixture.ipcEvents.listenerCount(channel), 2);

    first();
    first();

    assert.equal(fixture.ipcEvents.listenerCount(channel), 1);

    second();

    assert.equal(fixture.ipcEvents.listenerCount(channel), 0);
});

test('Close resolution accepts only the approved request and decisions', async () => {
    const fixture = loadPreload();
    const api = fixture.exposed[0].api;

    await api.resolveClose(1, 'save');
    await api.resolveClose(2, 'discard');
    await api.resolveClose(3, 'cancel');

    assert.deepEqual(
        fixture.calls,
        [
            ['easyblox:desktop:close-resolve', 1, 'save'],
            ['easyblox:desktop:close-resolve', 2, 'discard'],
            ['easyblox:desktop:close-resolve', 3, 'cancel']
        ]
    );

    for (const [requestId, decision] of [
        [0, 'save'],
        [-1, 'save'],
        ['1', 'save'],
        [1.5, 'save'],
        [Number.MAX_SAFE_INTEGER + 1, 'save'],
        [1, 'invalid'],
        [1, null],
        [null, 'discard']
    ]) {
        await assert.rejects(
            api.resolveClose(requestId, decision),
            /DESKTOP_CLOSE_INVALID_ARGUMENTS/
        );
    }

    assert.equal(fixture.calls.length, 3);
});

test('Close ACK invokes only the approved IPC channel with a valid request ID', async () => {
    const fixture = loadPreload();
    const api = fixture.exposed[0].api;

    await api.ackClose(1);
    await api.ackClose(2);

    assert.deepEqual(
        fixture.calls,
        [
            ['easyblox:desktop:close-ack', 1],
            ['easyblox:desktop:close-ack', 2]
        ]
    );

    for (const requestId of [
        0,
        -1,
        '1',
        1.5,
        Number.MAX_SAFE_INTEGER + 1,
        null,
        undefined
    ]) {
        await assert.rejects(
            api.ackClose(requestId),
            /DESKTOP_CLOSE_INVALID_ARGUMENTS/
        );
    }

    assert.equal(
        fixture.calls.length,
        2,
        'Invalid ACK arguments must not invoke IPC'
    );
});

test('Unauthorized documents and subframes cannot access close IPC', () => {
    const forbiddenUrls = [
        'https://example.com/',
        'http://localhost:8601/',
        'http://127.0.0.1:8601/other.html',
        'about:blank'
    ];

    for (const url of forbiddenUrls) {
        const fixture = loadPreload(url);

        assert.equal(fixture.exposed.length, 0);
        assert.equal(fixture.ipcEvents.eventNames().length, 0);
        assert.equal(fixture.calls.length, 0);
    }

    const frame = loadPreload('http://127.0.0.1:8601/', false);

    assert.equal(frame.exposed.length, 0);
    assert.equal(frame.ipcEvents.eventNames().length, 0);
});
