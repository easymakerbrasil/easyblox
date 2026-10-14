const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');
const {parseVersion} = require('../src/update-service');

const mainPath = path.join(__dirname, '../src/main.js');
const html = fs.readFileSync(path.join(__dirname, '../build/splash.html'), 'utf8');
const loadMain = ({version = '0.4.1', packaged = false, execute, loadError, getVersionError,
    missingElement, destroyOnLoad} = {}) => {
    const calls = [];
    const warnings = [];
    const windows = [];
    const element = {textContent: ''};
    let timer;
    const app = {isPackaged: packaged,
        getVersion: () => {
            calls.push('version');
            if (getVersionError) throw getVersionError;
            return version;
        },
        whenReady: () => ({then: () => ({catch: () => {}})}),
        on: () => {},
        setAppUserModelId: () => {}};
    class Window extends EventEmitter {
        constructor (options) {
            super();
            this.options = options;
            this.destroyed = false;
            this.webContents = new EventEmitter();
            this.webContents.isDestroyed = () => this.destroyed;
            this.webContents.executeJavaScriptInIsolatedWorld = async (world, scripts) => {
                calls.push('fill');
                assert.notEqual(world, 0);
                assert.notEqual(world, 999);
                assert.equal(world, 1001);
                if (execute) return execute(this);
                return vm.runInNewContext(scripts[0].code, {document: {getElementById: id => {
                    assert.equal(id, 'splash-version'); return missingElement ? null : element;
                }}});
            };
            this.webContents.session = new EventEmitter();
            windows.push(this);
        }
        isDestroyed () {
            return this.destroyed;
        }
        center () {
            calls.push('center');
        }
        async loadFile (file) {
            this.file = file; calls.push('load'); if (loadError) throw loadError;
            if (destroyOnLoad) this.close();
        }
        async loadURL () {}
        show () {
            calls.push('show');
        }
        close () {
            this.destroyed = true; calls.push('close'); this.emit('closed');
        }
    }
    const context = {__dirname: path.dirname(mainPath),
        process: {platform: 'win32', resourcesPath: 'C:/resources', env: {}},
        console: {log: () => {}, error: () => {}, warn: (...args) => warnings.push(args)},
        setTimeout: callback => {
            timer = callback; return 1;
        },
        clearTimeout: () => {
            timer = null;
        },
        require: name => {
            if (name === 'node:path') return path;
            if (name === 'electron') return {app, BrowserWindow: Window};
            if (name === './desktop-app-info') return {registerDesktopAppInfo: () => {}};
            if (name === './update-service') {
                return {parseVersion,
                    UpdateService: class {
                        async check () {
                            return {available: false};
                        }
                    }};
            }
            return {};
        }};
    const source = `${fs.readFileSync(mainPath, 'utf8')}\n` +
        'globalThis.splash = createSplashWindow; globalThis.main = createMainWindow;';
    vm.runInNewContext(source, context);
    return {context, calls, warnings, windows, element, expire: () => timer(), timerPending: () => Boolean(timer)};
};

test('Splash has a dedicated empty version element, local icon and reduced motion', () => {
    assert.match(html, /id="splash-version"/);
    assert.match(html, /src="icon.png"/);
    assert.match(html, /prefers-reduced-motion/);
    assert.doesNotMatch(html, /<script|Versão 0\.4\.1|Versão 0\.5\.0/);
});

for (const packaged of [false, true]) {
    test(`Splash loads ${packaged ? 'packaged' : 'development'} file, fills the real version, then shows`, async () => {
        const fixture = loadMain({packaged});
        await fixture.context.splash();
        assert.deepEqual(fixture.calls, ['center', 'load', 'version', 'fill', 'show']);
        assert.equal(fixture.element.textContent, 'Versão 0.4.1');
        const window = fixture.windows[0];
        const expectedFile = packaged ?
            path.join('C:/resources', 'splash.html') : path.join(__dirname, '../build/splash.html');
        assert.equal(window.file, expectedFile);
        assert.equal(window.options.width, 560);
        assert.equal(window.options.height, 340);
        assert.deepEqual(JSON.parse(JSON.stringify(window.options.webPreferences)), {
            contextIsolation: true, nodeIntegration: false, sandbox: true, javascript: false
        });
        assert.equal(fixture.timerPending(), false);
    });
}

for (const version of ['0.5.0-rc.2+build.123', '123.456.789-release.candidate.with.long.metadata+build.123456789']) {
    test(`Splash displays the complete version ${version}`, async () => {
        const fixture = loadMain({version});
        await fixture.context.splash();
        assert.equal(fixture.element.textContent, `Versão ${version}`);
    });
}

for (const version of ['', null, '0.5.0";globalThis.attack=true;//']) {
    test('Invalid version is logged without a fictitious number or preventing startup', async () => {
        const fixture = loadMain({version});
        await fixture.context.splash();
        assert.equal(fixture.element.textContent, '');
        assert.equal(fixture.calls.includes('fill'), false);
        assert.equal(fixture.calls.at(-1), 'show');
        assert.equal(fixture.warnings.length, 1);
    });
}

for (const options of [{missingElement: true}, {execute: () => Promise.reject(new Error('renderer error'))},
    {getVersionError: new Error('metadata unavailable')}]) {
    test('Version filling failure is logged, cleaned up and does not prevent showing', async () => {
        const fixture = loadMain(options);
        await fixture.context.splash();
        assert.equal(fixture.warnings.length, 1);
        assert.equal(fixture.calls.at(-1), 'show');
        assert.equal(fixture.element.textContent, '');
        assert.equal(fixture.timerPending(), false);
    });
}

test('Closing during a pending fill cancels waiting without showing or retaining listeners', async () => {
    const fixture = loadMain({execute: window => {
        window.close(); return new Promise(() => {});
    }});
    await fixture.context.splash();
    assert.equal(fixture.calls.includes('show'), false);
    assert.equal(fixture.timerPending(), false);
    assert.equal(fixture.windows[0].listenerCount('closed'), 1);
    assert.equal(fixture.windows[0].webContents.listenerCount('destroyed'), 0);
});

test('A pending version operation has a bounded wait', async () => {
    const fixture = loadMain({execute: () => new Promise(() => {})});
    const pending = fixture.context.splash();
    await new Promise(resolve => setImmediate(resolve));
    fixture.expire();
    await pending;
    assert.equal(fixture.calls.at(-1), 'show');
    assert.equal(fixture.warnings.length, 1);
    assert.equal(fixture.timerPending(), false);
});

test('Fatal loadFile failures remain fatal', async () => {
    const fixture = loadMain({loadError: new Error('file missing')});
    await assert.rejects(fixture.context.splash(), /file missing/);
    assert.equal(fixture.calls.includes('show'), false);
});

test('Closing immediately after load prevents version delivery and showing', async () => {
    const fixture = loadMain({destroyOnLoad: true});
    await fixture.context.splash();
    assert.equal(fixture.calls.includes('version'), false);
    assert.equal(fixture.calls.includes('show'), false);
});

test('Destroyed webContents cancel delivery and prevent showing a stale window', async () => {
    const fixture = loadMain({execute: window => {
        window.webContents.isDestroyed = () => true;
        window.webContents.emit('destroyed');
        return new Promise(() => {});
    }});
    await fixture.context.splash();
    assert.equal(fixture.calls.includes('show'), false);
    assert.equal(fixture.timerPending(), false);
    assert.equal(fixture.windows[0].webContents.listenerCount('destroyed'), 0);
});

test('The existing main ready-to-show transition closes splash before showing Main', async () => {
    const fixture = loadMain();
    await fixture.context.splash();
    await fixture.context.main();
    fixture.calls.length = 0;
    fixture.windows[1].emit('ready-to-show');
    assert.deepEqual(fixture.calls.slice(0, 2), ['close', 'show']);
    await new Promise(resolve => setImmediate(resolve));
});
