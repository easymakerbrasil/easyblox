const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
    APP_INFO_CHANNEL,
    isAllowedGuiUrl,
    registerDesktopAppInfo
} = require('../src/desktop-app-info');

const createWindow = () => {
    const window = new EventEmitter();
    const contents = new EventEmitter();
    const handlers = new Map();
    window.destroyed = false;
    window.isDestroyed = () => window.destroyed;
    contents.destroyed = false;
    contents.isDestroyed = () => contents.destroyed;
    contents.mainFrame = {
        origin: 'http://127.0.0.1:8601',
        url: 'http://127.0.0.1:8601/'
    };
    contents.ipc = {
        handle: (channel, handler) => {
            assert.equal(handlers.has(channel), false, 'duplicate handler');
            handlers.set(channel, handler);
        },
        removeHandler: channel => handlers.delete(channel)
    };
    contents.setWindowOpenHandler = handler => {
        contents.openHandler = handler;
    };
    window.webContents = contents;
    return {
        window,
        handlers,
        event: {sender: contents, senderFrame: contents.mainFrame},
        app: {getName: () => 'EasyBlox', getVersion: () => '0.5.0-rc.2', isPackaged: false}
    };
};

test('Desktop returns only official application metadata', () => {
    const fixture = createWindow();
    registerDesktopAppInfo(fixture.window, fixture.app);
    const result = fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event);
    assert.deepEqual([...fixture.handlers.keys()], [APP_INFO_CHANNEL]);
    assert.equal(fixture.handlers.has('easyblox:desktop:open-external-link'), false);
    assert.deepEqual(result, {
        productName: 'EasyBlox', version: '0.5.0-rc.2', platform: process.platform, isPackaged: false
    });
    fixture.app.isPackaged = true;
    fixture.app.getVersion = () => '1.2.3';
    assert.equal(fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event).version, '1.2.3');
    assert.equal(fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event).isPackaged, true);
});

test('Desktop rejects unauthorized senders, frames, origins, documents and arguments', () => {
    const cases = [
        fixture => {
            fixture.event.sender = {};
        },
        fixture => {
            fixture.event.senderFrame = {...fixture.event.senderFrame};
        },
        fixture => {
            fixture.event.senderFrame = null;
        },
        fixture => {
            fixture.event.senderFrame.origin = 'http://localhost:8601';
        },
        fixture => {
            fixture.event.senderFrame.url = 'http://127.0.0.1:8601/other.html';
        },
        fixture => {
            fixture.event.senderFrame.url = 'https://127.0.0.1:8601/';
        },
        fixture => {
            fixture.event.senderFrame.url = 'http://127.0.0.1:8601.evil.test/';
        },
        fixture => {
            fixture.event.senderFrame.url = 'about:blank';
        },
        fixture => {
            fixture.window.destroyed = true;
        },
        fixture => {
            fixture.window.webContents.destroyed = true;
        },
        fixture => {
            fixture.window.webContents.mainFrame = {...fixture.event.senderFrame};
        }
    ];
    for (const change of cases) {
        const fixture = createWindow();
        registerDesktopAppInfo(fixture.window, fixture.app);
        change(fixture);
        assert.throws(() => fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event), /DESKTOP_UNAUTHORIZED/);
    }
    const fixture = createWindow();
    registerDesktopAppInfo(fixture.window, fixture.app);
    assert.throws(() => fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event, 'extra'), /DESKTOP_UNAUTHORIZED/);
});

test('Desktop URL policy permits editor reloads, queries and project hashes only on approved documents', () => {
    for (const url of ['http://127.0.0.1:8601/', 'http://127.0.0.1:8601/index.html?lang=pt-br#123']) {
        assert.equal(isAllowedGuiUrl(url), true);
    }
    for (const url of ['file:///index.html', 'http://user@127.0.0.1:8601/', 'http://127.0.0.1:8602/', null]) {
        assert.equal(isAllowedGuiUrl(url), false);
    }
    const fixture = createWindow();
    registerDesktopAppInfo(fixture.window, fixture.app);
    for (const name of ['will-navigate', 'will-redirect']) {
        let prevented = false;
        fixture.window.webContents.emit(name, {
            url: 'https://example.com/',
            isMainFrame: true,
            preventDefault: () => {
                prevented = true;
            }
        });
        assert.equal(prevented, true);
        prevented = false;
        fixture.window.webContents.emit(name, {
            url: 'http://127.0.0.1:8601/index.html',
            preventDefault: () => {
                prevented = true;
            }
        });
        assert.equal(prevented, false);
    }
    assert.deepEqual(fixture.window.webContents.openHandler({url: 'https://example.com'}), {action: 'deny'});
});

test('Desktop registration is idempotent, releases only its handler, and rejects stale callbacks', () => {
    const fixture = createWindow();
    const cleanup = registerDesktopAppInfo(fixture.window, fixture.app);
    assert.equal(registerDesktopAppInfo(fixture.window, fixture.app), cleanup);
    assert.equal(fixture.window.listenerCount('close'), 1);
    fixture.handlers.set('unrelated', () => 'preserved');
    const stale = fixture.handlers.get(APP_INFO_CHANNEL);
    fixture.window.emit('close', {defaultPrevented: false});
    assert.throws(() => stale(fixture.event), /DESKTOP_UNAUTHORIZED/);
    fixture.window.emit('closed');
    cleanup();
    assert.equal(fixture.handlers.has(APP_INFO_CHANNEL), false);
    assert.equal(fixture.handlers.get('unrelated')(), 'preserved');
    assert.equal(fixture.window.listenerCount('close'), 0);
    assert.equal(fixture.window.webContents.listenerCount('will-navigate'), 0);
    const replacement = createWindow();
    registerDesktopAppInfo(replacement.window, replacement.app);
    assert.equal(replacement.handlers.get(APP_INFO_CHANNEL)(replacement.event).productName, 'EasyBlox');
    assert.throws(() => stale(fixture.event), /DESKTOP_UNAUTHORIZED/);
});

test('Desktop remains available when closing is cancelled', async () => {
    const fixture = createWindow();
    registerDesktopAppInfo(fixture.window, fixture.app);
    fixture.window.emit('close', {defaultPrevented: true});
    await Promise.resolve();
    assert.equal(fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event).productName, 'EasyBlox');
    fixture.window.emit('close', {defaultPrevented: false});
    fixture.window.webContents.emit('will-prevent-unload', {defaultPrevented: false});
    await Promise.resolve();
    assert.equal(fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event).productName, 'EasyBlox');
});

test('Desktop sanitizes invalid official metadata', () => {
    const fixture = createWindow();
    fixture.app.getName = () => '';
    registerDesktopAppInfo(fixture.window, fixture.app);
    assert.throws(() => fixture.handlers.get(APP_INFO_CHANNEL)(fixture.event), /DESKTOP_INVALID_APP_INFO/);
});

test('Main registers IPC before GUI load and preserves sandbox, serial and updates', async () => {
    const fixture = createWindow();
    const serialSession = new EventEmitter();
    serialSession.setPermissionCheckHandler = () => {};
    serialSession.setPermissionRequestHandler = () => {};
    fixture.window.webContents.session = serialSession;
    let options;
    let loadedUrl;
    let serialCalls = 0;
    let updateCalls = 0;
    const sourcePath = path.join(__dirname, '../src/main.js');
    const app = {
        ...fixture.app,
        isPackaged: true,
        whenReady: () => ({then: () => ({catch: () => {}})}),
        on: () => {},
        setAppUserModelId: () => {}
    };
    fixture.window.show = () => {};
    fixture.window.loadURL = url => {
        assert.equal(fixture.handlers.has(APP_INFO_CHANNEL), true, 'IPC must precede GUI loading');
        loadedUrl = url;
        return Promise.resolve();
    };
    const context = {
        __dirname: path.dirname(sourcePath),
        process: {platform: process.platform, resourcesPath: 'C:/resources', env: {}},
        console,
        require: name => {
            if (name === 'node:path') return path;
            if (name === 'electron') {
                return {
                    app,
                    BrowserWindow: function (config) {
                        options = config; return fixture.window;
                    },
                    dialog: {showMessageBox: () => {
                        throw new Error('unexpected native dialog');
                    }},
                    Menu: {},
                    shell: {}
                };
            }
            if (name === './desktop-app-info') return {registerDesktopAppInfo};
            if (name === './media-permissions') return require('../src/media-permissions');
            if (name === './serial-port-picker') {
                return {
                    showSerialPortPicker: () => {
                        serialCalls++; return Promise.resolve('COM3');
                    }
                };
            }
            if (name === './update-service') {
                return {
                    DEFAULT_UPDATE_MANIFEST_URL: 'https://example.com/latest.json',
                    UpdateService: class {
                        check (version) {
                            assert.equal(version, app.getVersion());
                            updateCalls++;
                            return Promise.resolve({available: false});
                        }
                    }
                };
            }
            return {};
        }
    };
    const mainSource = `${fs.readFileSync(sourcePath, 'utf8')}\nglobalThis.createWindowForTest = createMainWindow;`;
    vm.runInNewContext(mainSource, context);
    await context.createWindowForTest();
    assert.equal(options.webPreferences.preload, path.join(path.dirname(sourcePath), 'desktop-preload.js'));
    assert.equal(options.webPreferences.contextIsolation, true);
    assert.equal(options.webPreferences.sandbox, true);
    assert.equal(options.webPreferences.nodeIntegration, false);
    assert.notEqual(options.webPreferences.webSecurity, false);
    assert.equal(loadedUrl, 'http://127.0.0.1:8601');
    let selectedPort;
    serialSession.emit('select-serial-port', {preventDefault: () => {}}, [], fixture.window.webContents,
        port => {
            selectedPort = port;
        });
    fixture.window.emit('ready-to-show');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(serialCalls, 1);
    assert.equal(selectedPort, 'COM3');
    assert.equal(updateCalls, 1);
    fixture.window.emit('closed');
});
