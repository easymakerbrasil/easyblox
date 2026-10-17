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
    contents.getURL = () => contents.mainFrame.url;
    contents.send = () => {};
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
    let closeRegistration = null;
    let closeRequests = 0;
    let closeState = 'idle';
    let acknowledgedRequestId = null;
    let closeAcknowledgedCallback = null;
    const sourcePath = path.join(__dirname, '../src/main.js');
    const app = {
        ...fixture.app,
        isPackaged: true,
        whenReady: () => ({then: () => ({catch: () => {}})}),
        on: () => {},
        setAppUserModelId: () => {}
    };
    fixture.window.show = () => {};

    let closeAttempts = 0;
    let completedCloses = 0;
    let suppressCloseEvent = false;

    fixture.window.close = () => {
        closeAttempts++;

        if (suppressCloseEvent) {
            return false;
        }

        const event = {
            defaultPrevented: false,
            preventDefault () {
                this.defaultPrevented = true;
            }
        };

        fixture.window.emit('close', event);

        if (!event.defaultPrevented) {
            completedCloses++;
        }

        return !event.defaultPrevented;
    };

    fixture.window.loadURL = url => {
        assert.equal(fixture.handlers.has(APP_INFO_CHANNEL), true, 'IPC must precede GUI loading');
        assert.equal(fixture.handlers.has('easyblox:desktop:project-choose-file'), true);
        assert.equal(fixture.handlers.has('easyblox:desktop:project-write-file'), true);
        loadedUrl = url;
        return Promise.resolve();
    };
    const scheduledTimers = new Map();
    let nextTimerId = 0;

    const scheduleTimer = (callback, milliseconds) => {
        const timerId = ++nextTimerId;

        scheduledTimers.set(timerId, {
            callback,
            milliseconds
        });

        return timerId;
    };

    const cancelTimer = timerId => {
        scheduledTimers.delete(timerId);
    };

    const context = {
        __dirname: path.dirname(sourcePath),
        process: {platform: process.platform, resourcesPath: 'C:/resources', env: {}},
        console,
        setTimeout: scheduleTimer,
        clearTimeout: cancelTimer,
        require: name => {
            if (name === 'node:path') return path;
            if (name === 'electron') {
                return {
                    app,
                    BrowserWindow: function (config) {
                        options = config; return fixture.window;
                    },
                    dialog: {
                        showSaveDialog: () => {
                            throw new Error('unexpected native save dialog');
                        },
                        showMessageBox: () => {
                            throw new Error('unexpected native dialog');
                        }
                    },
                    Menu: {},
                    shell: {}
                };
            }
            if (name === './desktop-app-info') return {registerDesktopAppInfo};
            if (name === './desktop-native-save-ipc') return require('../src/desktop-native-save-ipc');
            if (name === './desktop-close-ipc') {
                return {
                    registerDesktopCloseIpc: (window, options) => {
                        assert.equal(window, fixture.window);

                        closeAcknowledgedCallback = options.onAcknowledged;

                        closeRegistration = {
                            onAuthorized: result => {
                                closeState = 'authorized';
                                options.onAuthorized(result);
                            },
                            requestClose: () => {
                                if (closeState !== 'idle') {
                                    return null;
                                }

                                closeState = 'pending';
                                acknowledgedRequestId = null;
                                closeRequests++;
                                return closeRequests;
                            },

                            isAcknowledged: requestId => (
                                closeState === 'pending' &&
                                acknowledgedRequestId === requestId
                            ),

                            cancelPending: () => {
                                if (closeState !== 'pending') {
                                    return false;
                                }

                                closeState = 'idle';
                                acknowledgedRequestId = null;
                                return true;
                            },

                            acknowledge: requestId => {
                                if (
                                    closeState !== 'pending' ||
                                    requestId !== closeRequests ||
                                    acknowledgedRequestId === requestId
                                ) {
                                    return false;
                                }

                                acknowledgedRequestId = requestId;
                                closeAcknowledgedCallback(requestId);
                                return true;
                            },

                            resolve: (requestId, decision) => {
                                if (
                                    closeState !== 'pending' ||
                                    requestId !== closeRequests ||
                                    !['save', 'discard', 'cancel'].includes(decision)
                                ) {
                                    return {status: 'rejected'};
                                }

                                acknowledgedRequestId = null;

                                if (decision === 'cancel') {
                                    closeState = 'idle';
                                    options.onResolved(requestId, decision);

                                    return {status: 'cancelled'};
                                }

                                closeState = 'authorized';

                                options.onAuthorized({
                                    requestId,
                                    decision
                                });

                                options.onResolved(requestId, decision);

                                return {status: 'authorized'};
                            },

                            getState: () => closeState,
                            resetAuthorized: () => {
                                if (closeState !== 'authorized') {
                                    return false;
                                }

                                closeState = 'idle';
                                return true;
                            },
                            invalidate: () => {
                                closeState = 'idle';
                            }
                        };

                        return closeRegistration;
                    }
                };
            }
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
    assert.ok(
        closeRegistration,
        'Close IPC must be registered before GUI loading'
    );

    assert.equal(closeAttempts, 0);
    assert.equal(completedCloses, 0);

    // First X click must not close the window.
    assert.equal(fixture.window.close(), false);

    assert.equal(closeAttempts, 1);
    assert.equal(completedCloses, 0);
    assert.equal(closeRequests, 1);

    // Another listener can still cancel an authorized close.
    let blockAuthorizedClose = true;

    fixture.window.on('close', event => {
        if (blockAuthorizedClose) {
            blockAuthorizedClose = false;
            event.preventDefault();
        }
    });

    // A discard decision must clear the pending ACK timer.
    assert.equal(scheduledTimers.size, 1);

    assert.deepEqual(
        closeRegistration.resolve(1, 'discard'),
        {status: 'authorized'}
    );

    assert.equal(scheduledTimers.size, 0);
    assert.equal(closeAttempts, 2);
    assert.equal(
        completedCloses,
        0,
        'Another listener must be able to cancel closing'
    );

    // The old authorization must never permit a later X click.
    assert.equal(
        fixture.window.close(),
        false,
        'An interrupted authorization must not permit another close'
    );

    assert.equal(completedCloses, 0);
    assert.equal(closeRequests, 2);

    // An authorized close may override beforeunload.
    let preventedUnload = false;

    fixture.window.webContents.emit(
        'will-prevent-unload',
        {
            preventDefault: () => {
                preventedUnload = true;
            }
        }
    );

    assert.equal(
        preventedUnload,
        false,
        'Interrupted authorization must not override beforeunload'
    );

    // A confirmed save must clear the ACK timer.
    // This fixture simulates authorization, not filesystem saving.
    suppressCloseEvent = true;

    assert.equal(scheduledTimers.size, 1);

    assert.deepEqual(
        closeRegistration.resolve(2, 'save'),
        {status: 'authorized'}
    );

    assert.equal(scheduledTimers.size, 0);

    suppressCloseEvent = false;

    assert.equal(completedCloses, 0);
    assert.equal(
        closeState,
        'idle',
        'Closing without a close event must reset authorization'
    );

    // Subsequent IPC invalidation must preserve the safe idle state.
    closeRegistration.invalidate();

    assert.equal(closeState, 'idle');

    // A stale Main authorization must not bypass the controller.
    assert.equal(
        fixture.window.close(),
        false,
        'Stale Main authorization must not close the window'
    );

    assert.equal(completedCloses, 0);
    assert.equal(closeRequests, 3);

    // D3.1: pending request must have a five-second ACK timeout.
    assert.equal(closeState, 'pending');
    assert.equal(scheduledTimers.size, 1);

    const [timerId, timer] = [...scheduledTimers.entries()][0];

    assert.equal(timer.milliseconds, 5000);

    const attemptsBeforeTimeout = closeAttempts;
    const completedBeforeTimeout = completedCloses;

    // Simulate five seconds passing without ACK or a decision.
    timer.callback();

    assert.equal(
        scheduledTimers.has(timerId),
        false,
        'Expired ACK timer must be removed'
    );

    assert.equal(
        closeState,
        'idle',
        'Missing ACK must invalidate only the pending request'
    );

    assert.equal(
        closeAttempts,
        attemptsBeforeTimeout,
        'ACK timeout must not attempt to close the window'
    );

    assert.equal(
        completedCloses,
        completedBeforeTimeout,
        'ACK timeout must never close the window'
    );

    // A decision arriving after timeout must be rejected.
    assert.deepEqual(
        closeRegistration.resolve(3, 'discard'),
        {status: 'rejected'}
    );

    assert.equal(closeState, 'idle');
    assert.equal(completedCloses, 0);

    // A new attempt after timeout must create a new request.
    assert.equal(fixture.window.close(), false);

    assert.equal(closeRequests, 4);
    assert.equal(closeState, 'pending');
    assert.equal(scheduledTimers.size, 1);

    const [ackTimerId, ackTimer] = [...scheduledTimers.entries()][0];

    assert.equal(ackTimer.milliseconds, 5000);

    // A delayed callback from request 3 must not affect request 4.
    timer.callback();

    assert.equal(closeState, 'pending');
    assert.equal(scheduledTimers.has(ackTimerId), true);

    // A valid ACK must remove the active timer.
    assert.equal(closeRegistration.acknowledge(4), true);

    assert.equal(scheduledTimers.has(ackTimerId), false);
    assert.equal(scheduledTimers.size, 0);
    assert.equal(closeRegistration.isAcknowledged(4), true);
    assert.equal(closeState, 'pending');

    // An ACK does not authorize closing the window.
    assert.equal(completedCloses, 0);

    // The user may still cancel after acknowledging the request.
    assert.deepEqual(
        closeRegistration.resolve(4, 'cancel'),
        {status: 'cancelled'}
    );

    assert.equal(closeState, 'idle');
    assert.equal(scheduledTimers.size, 0);
    assert.equal(completedCloses, 0);

    // Request 5: cancellation before ACK must clear the timer.
    assert.equal(fixture.window.close(), false);

    assert.equal(closeRequests, 5);
    assert.equal(closeState, 'pending');
    assert.equal(scheduledTimers.size, 1);

    const [cancelTimerId, cancelledRequestTimer] = [...scheduledTimers.entries()][0];

    assert.equal(cancelledRequestTimer.milliseconds, 5000);

    assert.deepEqual(
        closeRegistration.resolve(5, 'cancel'),
        {status: 'cancelled'}
    );

    assert.equal(closeState, 'idle');
    assert.equal(scheduledTimers.has(cancelTimerId), false);
    assert.equal(scheduledTimers.size, 0);
    assert.equal(completedCloses, 0);

    // A callback retained from the cancelled request is harmless.
    cancelledRequestTimer.callback();

    assert.equal(closeState, 'idle');
    assert.equal(completedCloses, 0);
    assert.equal(closeRegistration.acknowledge(5), false);

    // Request 6: destroying webContents must clear its timer.
    assert.equal(fixture.window.close(), false);

    assert.equal(closeRequests, 6);
    assert.equal(closeState, 'pending');
    assert.equal(scheduledTimers.size, 1);

    const [destroyTimerId, destroyTimer] = [...scheduledTimers.entries()][0];

    assert.equal(destroyTimer.milliseconds, 5000);

    fixture.window.webContents.emit('destroyed');

    assert.equal(scheduledTimers.has(destroyTimerId), false);
    assert.equal(scheduledTimers.size, 0);

    // Even a delayed timer callback must not close the window.
    destroyTimer.callback();

    assert.equal(completedCloses, 0);
    assert.equal(scheduledTimers.size, 0);

    fixture.window.emit('closed');

    assert.equal(scheduledTimers.size, 0);
});
