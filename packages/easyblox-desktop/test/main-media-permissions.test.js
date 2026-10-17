const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');
const GuiStaticServer = require('../src/gui-static-server');
const {registerDesktopAppInfo} = require('../src/desktop-app-info');
const {registerMediaPermissions} = require('../src/media-permissions');
const {parseVersion} = require('../src/update-service');

const loadMain = ({listenError, selectPort} = {}) => {
    const windows = [];
    const order = [];
    const serialSession = new EventEmitter();
    let checks = 0;
    let requests = 0;
    let picks = 0;
    serialSession.setPermissionCheckHandler = handler => {
        checks++;
        serialSession.check = handler;
    };
    serialSession.setPermissionRequestHandler = handler => {
        requests++;
        serialSession.request = handler;
    };
    class Window extends EventEmitter {
        constructor (options) {
            super();
            this.options = options;
            this.destroyed = false;
            const contents = new EventEmitter();
            contents.isDestroyed = () => this.destroyed;
            contents.session = serialSession;
            contents.ipc = {handle: () => {}, removeHandler: () => {}};
            contents.setWindowOpenHandler = () => {};
            contents.executeJavaScriptInIsolatedWorld = async () => {};
            contents.mainFrame = {origin: 'http://127.0.0.1:8601', url: 'http://127.0.0.1:8601/'};
            this.webContents = contents;
            windows.push(this);
        }
        isDestroyed () {
            return this.destroyed;
        }
        center () {}
        show () {}
        async loadFile () {}
        async loadURL () {
            assert.equal(checks, 1, 'check handler precedes renderer load');
            assert.equal(requests, 1, 'request handler precedes renderer load');
            order.push('main-load');
        }
    }
    class Server {
        constructor () {
            this.listening = false;
        }
        async listen () {
            if (listenError) throw listenError;
            this.listening = true;
            order.push('gui-listen');
            return this.address();
        }
        address () {
            return {host: '127.0.0.1', port: this.listening ? 8601 : null};
        }
    }
    const mainPath = path.join(__dirname, '../src/main.js');
    const context = {__dirname: path.dirname(mainPath),
        console,
        URL,
        queueMicrotask,
        setTimeout,
        clearTimeout,
        process: {platform: 'win32', env: {}, resourcesPath: 'C:/resources'},
        require: name => {
            if (name === 'node:path') return path;
            if (name === 'electron') {
                return {
                    app: {isPackaged: false,
                        getVersion: () => '0.5.0',
                        getPath: () => 'C:/user-data',
                        setAppUserModelId: () => {},
                        on: () => {},
                        whenReady: () => ({then: () => ({catch: () => {}})})},
                    BrowserWindow: Window,
                    Menu: {setApplicationMenu: () => {}}
                };
            }
            if (name === './desktop-app-info') return {registerDesktopAppInfo};
            if (name === './media-permissions') return {registerMediaPermissions};
            if (name === './gui-static-server') return Server;
            if (name === './arduino-runtime') return {prepareArduinoRuntime: async () => null};
            if (name === '@easymaker/easyblox-hardware-service') {
                return {
                    HardwareHttpServer: class {
                        async listen () {
                            return {host: '127.0.0.1', port: 8765};
                        }
                    }
                };
            }
            if (name === './serial-port-picker') {
                return {showSerialPortPicker: async () => {
                    picks++;
                    return selectPort ? selectPort() : 'COM3';
                }};
            }
            if (name === './update-service') return {parseVersion};
            throw new Error(`Unexpected dependency: ${name}`);
        }};
    vm.runInNewContext(`${fs.readFileSync(mainPath, 'utf8')}
        globalThis.start = startDesktop;
        globalThis.createMain = createMainWindow;
        globalThis.setServer = value => { guiServer = value; };
    `, context);
    return {context,
        windows,
        serialSession,
        order,
        counts: () => ({checks, requests, picks}),
        check: window => serialSession.check(window.webContents, 'media', 'http://127.0.0.1:8601/', {
            isMainFrame: true, requestingUrl: 'http://127.0.0.1:8601/', mediaType: 'video'
        })};
};

test('Main authorizes media only after its own loopback server is bound and while it remains available', async () => {
    const fixture = loadMain();
    await fixture.context.start();
    assert.deepEqual(fixture.order, ['gui-listen', 'main-load']);
    const window = fixture.windows[1];
    assert.equal(fixture.check(window), true);
    fixture.context.setServer(null);
    assert.equal(fixture.check(window), false);
    fixture.context.setServer({address: () => ({host: 'localhost', port: 8601})});
    assert.equal(fixture.check(window), false);
    fixture.context.setServer({address: () => ({host: '127.0.0.1', port: null})});
    assert.equal(fixture.check(window), false);
});

test('A window pointed at the allowed URL without an owned server is not trusted', async () => {
    const fixture = loadMain();
    await fixture.context.createMain();
    assert.equal(fixture.check(fixture.windows[0]), false);
});

test('Startup refuses an occupied GUI port without loading a foreign service', async () => {
    const error = Object.assign(new Error('Port already in use'), {code: 'EADDRINUSE'});
    const fixture = loadMain({listenError: error});
    await assert.rejects(fixture.context.start(), error);
    assert.equal(fixture.windows.length, 1, 'only the inert splash was constructed');
    assert.deepEqual(fixture.order, []);
    assert.deepEqual(fixture.counts(), {checks: 0, requests: 0, picks: 0});
});

test('Real GUI servers reject a preoccupied loopback port instead of reusing its service', async () => {
    const first = new GuiStaticServer({rootPath: __dirname, host: '127.0.0.1', port: 0});
    await first.listen();
    const second = new GuiStaticServer({rootPath: __dirname, host: '127.0.0.1', port: first.address().port});
    try {
        await assert.rejects(second.listen(), {code: 'EADDRINUSE'});
    } finally {
        await second.close();
        await first.close();
    }
});

test('Window recreation retains one serial listener and one pair of permission handlers', async () => {
    const fixture = loadMain();
    await fixture.context.start();
    const oldWindow = fixture.windows[1];
    await fixture.context.createMain();
    const current = fixture.windows[2];
    assert.equal(fixture.check(oldWindow), false);
    assert.equal(fixture.check(current), true);
    assert.equal(fixture.serialSession.listenerCount('select-serial-port'), 1);
    assert.equal(oldWindow.listenerCount('closed'), 2, 'only Main and IPC listeners remain');
    let selected;
    fixture.serialSession.emit('select-serial-port', {preventDefault: () => {}}, [], oldWindow.webContents,
        value => {
            selected = value;
        });
    assert.equal(selected, '');
    fixture.serialSession.emit('select-serial-port', {preventDefault: () => {}}, [], current.webContents,
        value => {
            selected = value;
        });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(selected, 'COM3');
    assert.deepEqual(fixture.counts(), {checks: 1, requests: 1, picks: 1});
    current.destroyed = true;
    current.emit('closed');
    assert.equal(fixture.serialSession.listenerCount('select-serial-port'), 0);
    assert.equal(fixture.check(current), false);
    await fixture.context.createMain();
    assert.equal(fixture.check(fixture.windows[3]), true);
    assert.equal(fixture.serialSession.listenerCount('select-serial-port'), 1);
    assert.deepEqual(fixture.counts(), {checks: 1, requests: 1, picks: 1});
});

test('A serial selection completing after owner replacement cannot grant a port to the old window', async () => {
    let completeSelection;
    const selection = new Promise(resolve => {
        completeSelection = resolve;
    });
    const fixture = loadMain({selectPort: () => selection});
    await fixture.context.start();
    const oldWindow = fixture.windows[1];
    let selected;
    fixture.serialSession.emit('select-serial-port', {preventDefault: () => {}}, [], oldWindow.webContents,
        value => {
            selected = value;
        });
    await fixture.context.createMain();
    completeSelection('COM3');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(selected, '');
    assert.equal(fixture.serialSession.listenerCount('select-serial-port'), 1);
});
