const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {test} = require('node:test');
const {_electron, chromium} = require('playwright');
const JSZip = require('jszip');
const GuiStaticServer = require('../../src/gui-static-server');

const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const startGuiServer = async () => {
    if (process.env.EASYBLOX_RUNTIME_REUSE_GUI === '1') {
        const response = await fetch('http://127.0.0.1:8601/', {signal: AbortSignal.timeout(10000)});
        assert.equal(response.ok, true);
        assert.match(await response.text(), /<title>EasyBlox<\/title>/);
        return {close: async () => {}};
    }
    const server = new GuiStaticServer({rootPath: path.join(repo, 'packages/scratch-gui/build')});
    await server.listen();
    return server;
};

const launchDesktop = async (mode = 'gui') => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'easyblox-b21h-runtime-'));
    fs.writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({name: metadata.name,
        productName: metadata.productName,
        version: metadata.version,
        main: 'main.cjs'}));
    fs.writeFileSync(path.join(fixture, 'main.cjs'), `
        const fs = require('node:fs');
        const path = require('node:path');
        const {createRequire} = require('node:module');
        const electron = require('electron');
        const {app} = electron;
        app.setPath('userData', path.join(__dirname, 'user-data'));
        globalThis.runtime = {shown: [], closed: [], errors: [], ready: false};
        app.on('browser-window-created', (_event, window) => {
            window.on('show', () => {
                globalThis.runtime.shown.push(window.id);
                if (${JSON.stringify(mode)} !== 'gui') window.hide();
            });
            window.on('closed', () => globalThis.runtime.closed.push(window.id));
            window.webContents.on('preload-error', (_event, _file, error) => {
                globalThis.runtime.errors.push(error.message);
            });
        });
        const mainPath = ${JSON.stringify(path.join(root, 'src/main.js'))};
        const localRequire = createRequire(mainPath);
        const mainApp = new Proxy(app, {get(target, key) {
            if (key === 'whenReady') return () => ({then: () => ({catch: () => {}})});
            const value = Reflect.get(target, key);
            return typeof value === 'function' ? value.bind(target) : value;
        }});
        const testRequire = name => {
            if (name === 'electron') return {...electron, app: mainApp,
                BrowserWindow: function (options) {
                    if (${JSON.stringify(mode)} === 'webgl') options.webPreferences.webgl = false;
                    return new electron.BrowserWindow(options);
                }};
            if (name === './update-service') return {...localRequire(name), UpdateService: class {
                async check() {return {available: false};}
            }};
            return localRequire(name);
        };
        globalThis.mainFunctions = new Function('require', '__dirname',
            fs.readFileSync(mainPath, 'utf8') + '\\nreturn {createSplashWindow, createMainWindow};')(
            testRequire, path.dirname(mainPath));
        app.whenReady().then(async () => {
            if (${JSON.stringify(mode)} === 'splash') await globalThis.mainFunctions.createSplashWindow();
            else await globalThis.mainFunctions.createMainWindow();
            globalThis.runtime.ready = true;
        }).catch(error => {globalThis.runtime.failure = error.stack;});
    `);
    const env = {...process.env};
    delete env.ELECTRON_RUN_AS_NODE;
    const application = await _electron.launch({executablePath: require('electron'), args: [fixture], env});
    try {
        await application.firstWindow();
        await application.evaluate(async () => {
            const deadline = Date.now() + 30000;
            while (!globalThis.runtime.ready && !globalThis.runtime.failure && Date.now() < deadline) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            if (!globalThis.runtime.ready) throw new Error(globalThis.runtime.failure || 'Runtime startup timeout');
        });
        return {application, fixture};
    } catch (error) {
        await application.close();
        throw error;
    }
};

test('Real Main fills the real splash with page JS disabled, then closes it on Main readiness',
    {timeout: 60000}, async () => {
        const server = await startGuiServer();
        let application;
        try {
            ({application} = await launchDesktop('splash'));
            const snapshot = await application.evaluate(async ({app, BrowserWindow}) => {
                const window = BrowserWindow.getAllWindows()[0];
                const prefs = window.webContents.getLastWebPreferences();
                const documentState = await window.webContents.executeJavaScriptInIsolatedWorld(1001, [{code: `({
                    text: document.getElementById('splash-version').textContent,
                    displayed: document.getElementById('splash-version').getClientRects().length > 0,
                    iconLoaded: document.querySelector('.icon').naturalWidth > 0,
                    scripts: document.querySelectorAll('script').length
                })`}]);
                return {id: window.id,
                    documentState,
                    version: app.getVersion(),
                    prefs: {
                        javascript: prefs.javascript,
                        sandbox: prefs.sandbox,
                        contextIsolation: prefs.contextIsolation,
                        nodeIntegration: prefs.nodeIntegration,
                        preload: prefs.preload},
                    runtime: globalThis.runtime};
            });
            assert.equal(snapshot.documentState.text, `Versão ${metadata.version}`);
            assert.equal(snapshot.documentState.displayed, true);
            assert.equal(snapshot.documentState.iconLoaded, true);
            assert.equal(snapshot.documentState.scripts, 0);
            assert.equal(snapshot.version, metadata.version);
            assert.equal(snapshot.prefs.javascript, false);
            assert.equal(snapshot.prefs.sandbox, true);
            assert.equal(snapshot.prefs.contextIsolation, true);
            assert.equal(snapshot.prefs.nodeIntegration, false);
            assert.ok(!snapshot.prefs.preload);
            assert.ok(snapshot.runtime.shown.includes(snapshot.id));
            await application.evaluate(() => globalThis.mainFunctions.createMainWindow());
            const page = application.windows().find(window => !window.isClosed() &&
                window.url().startsWith('http://127.0.0.1:8601'));
            assert.ok(page, 'Active Main page after splash closure');
            await page.waitForFunction(() => Boolean(window.easybloxDesktop));
            assert.deepEqual(await page.evaluate(() => window.easybloxDesktop.getAppInfo()), {
                productName: metadata.productName,
                version: metadata.version,
                platform: process.platform,
                isPackaged: false
            });
            const state = await application.evaluate(({BrowserWindow}) => ({
                ...globalThis.runtime, windows: BrowserWindow.getAllWindows().map(window => window.id)
            }));
            assert.ok(state.closed.includes(snapshot.id));
            assert.equal(state.windows.length, 1);
            assert.ok(state.shown.includes(state.windows[0]));
            assert.deepEqual(state.errors, []);
            console.log(`REAL SPLASH: Versão ${snapshot.version}; sandbox and isolated world; native transition PASS`);
        } finally {
            if (application) await application.close();
            await server.close();
        }
    });

test('Real GUI keeps WebGL diagnosis and legacy gdxfor projects without external controls',
    {timeout: 120000}, async () => {
        const server = await startGuiServer();
        let application;
        try {
            ({application} = await launchDesktop('webgl'));
            let page = await application.firstWindow();
            await page.getByRole('dialog').waitFor();
            assert.equal(await page.locator('a[href]').count(), 0);
            assert.ok(await page.getByText('não suporta WebGL', {exact: true}).count());
            assert.ok(await page.getByText('Perguntas frequentes', {exact: true}).count());
            await application.close();
            application = null;
            const launched = await launchDesktop();
            application = launched.application;
            page = await application.firstWindow();
            await page.locator('#logo_img').waitFor();
            await page.waitForFunction(() => document.body.innerText.includes('Meus Blocos'));
            const zip = await JSZip.loadAsync(fs.readFileSync(path.join(repo,
                'packages/scratch-vm/test/fixtures/load-extensions/confirm-load/ev3-simple-project.sb3')));
            const project = JSON.parse(await zip.file('project.json').async('string'));
            project.extensions = ['gdxfor'];
            project.monitors = [];
            for (const target of project.targets) target.blocks = {};
            const actor = project.targets.find(target => !target.isStage);
            actor.blocks['legacy-force'] = {opcode: 'gdxfor_getForce',
                next: null,
                parent: null,
                inputs: {},
                fields: {},
                shadow: false,
                topLevel: true,
                x: 100,
                y: 100};
            zip.file('project.json', JSON.stringify(project));
            const legacy = path.join(launched.fixture, 'legacy.sb3');
            fs.writeFileSync(legacy, await zip.generateAsync({type: 'nodebuffer'}));
            page.on('filechooser', () => {});
            await page.getByRole('button', {name: 'File menu', exact: true}).click();
            await page.getByText('Abrir...', {exact: true}).click();
            await page.locator('input[accept=".sb,.sb2,.sb3"]').setInputFiles(legacy);
            await page.locator('#gdxfor.blocklyToolboxCategory').waitFor();
            await page.locator('#gdxfor.blocklyToolboxCategory').click();
            await page.locator('g:has(> image.blocklyFlyoutButton) > rect.blocklyTouchTargetBackground').click();
            await page.getByRole('dialog').waitFor();
            assert.equal(await page.getByRole('button', {name: 'Ajuda', exact: true}).count(), 0);
            assert.equal(await page.locator('a[href]').count(), 0);
            assert.ok(await page.getByText('Go Direct Force & Acceleration', {exact: true}).count());
            console.log('REAL GUI: WebGL diagnosis and loaded legacy gdxfor without actionable external controls PASS');
        } finally {
            if (application) await application.close();
            await server.close();
        }
    });

test('A real common browser keeps both diagnostic links without a Desktop bridge',
    {timeout: 60000}, async () => {
        const server = await startGuiServer();
        let browser;
        try {
            browser = await chromium.launch({channel: 'chrome', headless: true});
            const page = await browser.newPage();
            await page.addInitScript(() => {
                const getContext = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function (type, ...args) {
                    if (type.startsWith('webgl') || type === 'experimental-webgl') return null;
                    return getContext.call(this, type, ...args);
                };
            });
            await page.goto('http://127.0.0.1:8601/');
            await page.getByRole('dialog').waitFor();
            assert.equal(await page.evaluate(() => typeof window.easybloxDesktop), 'undefined');
            assert.equal(await page.locator('a[href="https://get.webgl.org/"]').count(), 1);
            assert.equal(await page.locator('a[href="//scratch.mit.edu/3faq"]').count(), 1);
            console.log('REAL CHROME: Web diagnostic links preserved, no Desktop bridge PASS');
        } finally {
            if (browser) await browser.close();
            await server.close();
        }
    });
