const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {test} = require('node:test');
const {_electron} = require('playwright');

const root = path.resolve(__dirname, '../..');

test('Electron 44 attributes permission queries and enumeration without starting capture',
    {timeout: 60000}, async () => {
        const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'easyblox-b4-media-'));
        fs.writeFileSync(path.join(fixture, 'index.html'), '<!doctype html><title>Permission fixture</title>');
        fs.writeFileSync(path.join(fixture, 'package.json'), JSON.stringify({name: 'easyblox-media-test',
            version: '0.5.0',
            main: 'main.cjs'}));
        fs.writeFileSync(path.join(fixture, 'main.cjs'), `
            const path = require('node:path');
            const {app, BrowserWindow, session} = require('electron');
            const {createRequire} = require('node:module');
            const localRequire = createRequire(${JSON.stringify(path.join(root, 'src/main.js'))});
            const GuiStaticServer = localRequire('./gui-static-server');
            const {registerMediaPermissions} = localRequire('./media-permissions');
            const {registerDesktopAppInfo} = localRequire('./desktop-app-info');
            app.setPath('userData', path.join(__dirname, 'user-data'));
            globalThis.observed = {checks: [], requests: [], checkInstalls: 0, requestInstalls: 0};
            app.whenReady().then(async () => {
                const server = new GuiStaticServer({rootPath: __dirname});
                await server.listen();
                globalThis.server = server;
                const ses = session.defaultSession;
                const setCheck = ses.setPermissionCheckHandler.bind(ses);
                const setRequest = ses.setPermissionRequestHandler.bind(ses);
                ses.setPermissionCheckHandler = handler => {
                    observed.checkInstalls++;
                    setCheck((contents, permission, origin, details) => {
                        const allowed = handler(contents, permission, origin, details);
                        observed.checks.push({id: contents && contents.id, permission, origin, details, allowed});
                        return allowed;
                    });
                };
                ses.setPermissionRequestHandler = handler => {
                    observed.requestInstalls++;
                    setRequest((contents, permission, callback, details) => {
                        observed.requests.push({permission, details});
                        handler(contents, permission, callback, details);
                    });
                };
                globalThis.createWindow = async authorized => {
                    const window = new BrowserWindow({show: false, webPreferences: {
                        contextIsolation: true, sandbox: true, nodeIntegration: false,
                        preload: ${JSON.stringify(path.join(root, 'src/desktop-preload.js'))}
                    }});
                    if (authorized) {
                        registerDesktopAppInfo(window, app);
                        registerMediaPermissions(window, {isGuiServerTrusted: () => server.address().port === 8601});
                    }
                    await window.loadURL('http://127.0.0.1:8601/');
                    return window;
                };
                globalThis.owner = await createWindow(true);
                globalThis.ready = true;
            }).catch(error => { globalThis.failure = error.stack; });
        `);
        const env = {...process.env};
        delete env.ELECTRON_RUN_AS_NODE;
        let application;
        try {
            application = await _electron.launch({executablePath: require('electron'), args: [fixture], env});
            const page = await application.firstWindow();
            await application.evaluate(async () => {
                while (!globalThis.ready && !globalThis.failure) await new Promise(resolve => setTimeout(resolve, 20));
                if (globalThis.failure) throw new Error(globalThis.failure);
            });
            const result = await page.evaluate(async () => ({
                camera: (await navigator.permissions.query({name: 'camera'})).state,
                microphone: (await navigator.permissions.query({name: 'microphone'})).state,
                devices: (await navigator.mediaDevices.enumerateDevices()).map(device => device.kind),
                info: await window.easybloxDesktop.getAppInfo(),
                node: typeof require
            }));
            assert.ok(['granted', 'denied'].includes(result.camera));
            assert.ok(['granted', 'denied'].includes(result.microphone));
            assert.ok(Array.isArray(result.devices));
            assert.equal(result.node, 'undefined');
            assert.equal(result.info.version, '0.5.0');
            await page.evaluate(async () => {
                const frame = document.createElement('iframe');
                frame.src = '/index.html?frame';
                document.body.append(frame);
                await new Promise(resolve => {
                    frame.onload = resolve;
                });
            });
            const frame = page.frames().find(value => value !== page.mainFrame());
            const denied = await frame.evaluate(async () =>
                (await navigator.permissions.query({name: 'camera'})).state);
            assert.equal(denied, 'denied');
            const snapshot = await application.evaluate(async () => {
                const secondary = await globalThis.createWindow(false);
                const secondaryState = await secondary.webContents.executeJavaScript(
                    'navigator.permissions.query({name: "microphone"}).then(value => value.state)');
                secondary.destroy();
                const oldOwner = globalThis.owner;
                globalThis.owner = await globalThis.createWindow(true);
                const staleState = await oldOwner.webContents.executeJavaScript(
                    'navigator.permissions.query({name: "camera"}).then(value => value.state)');
                oldOwner.destroy();
                const prefs = globalThis.owner.webContents.getLastWebPreferences();
                return {secondaryState,
                    staleState,
                    prefs: {sandbox: prefs.sandbox,
                        contextIsolation: prefs.contextIsolation,
                        nodeIntegration: prefs.nodeIntegration,
                        webSecurity: prefs.webSecurity},
                    version: process.versions.electron,
                    observed: globalThis.observed};
            });
            assert.equal(snapshot.version, '44.7.0');
            assert.equal(snapshot.secondaryState, 'denied');
            assert.equal(snapshot.staleState, 'denied');
            assert.deepEqual(snapshot.prefs, {sandbox: true,
                contextIsolation: true,
                nodeIntegration: false,
                webSecurity: true});
            assert.equal(snapshot.observed.checkInstalls, 1);
            assert.equal(snapshot.observed.requestInstalls, 1);
            assert.deepEqual(snapshot.observed.requests, []);
            for (const mediaType of ['video', 'audio']) {
                assert.ok(snapshot.observed.checks.some(value => value.permission === 'media' && value.allowed &&
                    value.details.mediaType === mediaType && value.details.isMainFrame === true));
            }
            assert.ok(snapshot.observed.checks.some(value => value.permission === 'media' && !value.allowed &&
                value.details.isMainFrame === false));
            console.log(JSON.stringify({electron: snapshot.version,
                camera: result.camera,
                microphone: result.microphone,
                devices: result.devices,
                requests: 0}));
        } finally {
            if (application) {
                await application.evaluate(async () => {
                    if (globalThis.server) await globalThis.server.close();
                });
                await application.close();
            }
        }
    });
