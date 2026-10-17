const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {test} = require('node:test');
const {registerMediaPermissions} = require('../src/media-permissions');

const GUI_URL = 'http://127.0.0.1:8601/';
let missingValue;
const createSession = () => ({
    checks: [],
    requests: [],
    setPermissionCheckHandler (handler) {
        this.checks.push(handler);
        this.check = handler;
    },
    setPermissionRequestHandler (handler) {
        this.requests.push(handler);
        this.request = handler;
    }
});
const createWindow = (session = createSession()) => {
    const window = new EventEmitter();
    window.destroyed = false;
    window.isDestroyed = () => window.destroyed;
    const contents = new EventEmitter();
    contents.destroyed = false;
    contents.isDestroyed = () => contents.destroyed;
    contents.mainFrame = {origin: 'http://127.0.0.1:8601', url: GUI_URL};
    contents.session = session;
    window.webContents = contents;
    return window;
};
const createFixture = () => {
    const window = createWindow();
    const session = window.webContents.session;
    let trusted = true;
    const options = {isGuiServerTrusted: () => trusted};
    const cleanup = registerMediaPermissions(window, options);
    return {window,
        session,
        cleanup,
        options,
        revokeServer: () => {
            trusted = false;
        }};
};
const checkDetails = () => ({isMainFrame: true,
    requestingUrl: GUI_URL,
    mediaType: 'video',
    securityOrigin: 'http://127.0.0.1:8601/'});
const requestDetails = () => ({isMainFrame: true,
    requestingUrl: GUI_URL,
    mediaTypes: ['video'],
    securityOrigin: 'http://127.0.0.1:8601/'});
const check = (fixture, details = checkDetails(), contents = fixture.window.webContents, permission = 'media',
    origin = 'http://127.0.0.1:8601/') => fixture.session.check(contents, permission, origin, details);
const request = (fixture, details = requestDetails(), contents = fixture.window.webContents, permission = 'media') => {
    const results = [];
    fixture.session.request(contents, permission, result => results.push(result), details);
    assert.equal(results.length, 1, 'the request must receive exactly one synchronous response');
    return results[0];
};

test('Main camera, microphone and combined requests use the Electron media contract', () => {
    const fixture = createFixture();
    for (const mediaTypes of [['video'], ['audio'], ['audio', 'video']]) {
        assert.equal(request(fixture, {...requestDetails(), mediaTypes}), true);
    }
    for (const mediaType of ['video', 'audio']) {
        assert.equal(check(fixture, {...checkDetails(), mediaType}), true);
    }
    // Permissions API queries can omit securityOrigin; they still identify the document and origin.
    const details = checkDetails();
    delete details.securityOrigin;
    assert.equal(check(fixture, details), true);
    assert.equal(request(fixture, checkDetails()), false, 'mediaType does not replace mediaTypes');
    assert.equal(check(fixture, requestDetails()), false, 'mediaTypes does not replace mediaType');
});

test('Queries only decide permission and do not start acquisition or request callbacks', () => {
    const fixture = createFixture();
    for (let i = 0; i < 3; i++) assert.equal(check(fixture), true);
    assert.equal(fixture.session.requests.length, 1, 'only the handler registration occurred');
    assert.deepEqual(fixture.window.webContents.eventNames(), ['destroyed', 'will-prevent-unload']);
});

test('Both handlers reject external, similar, credential-bearing and unapproved document URLs', () => {
    const urls = ['https://example.com/', 'http://localhost:8601/', 'https://127.0.0.1:8601/',
        'http://127.0.0.1:8602/', 'http://127.0.0.1:8601.evil.test/',
        'http://127.0.0.1:8601@evil.test/', 'http://user@127.0.0.1:8601/',
        'http://127.0.0.1:8601/other.html', 'http://127.0.0.1:8601/index.html/evil',
        'file:///index.html', 'about:blank', null];
    for (const requestingUrl of urls) {
        const fixture = createFixture();
        assert.equal(check(fixture, {...checkDetails(), requestingUrl}), false, String(requestingUrl));
        assert.equal(request(fixture, {...requestDetails(), requestingUrl}), false, String(requestingUrl));
    }
});

test('Same-origin subframes and secondary windows cannot impersonate Main', () => {
    const fixture = createFixture();
    assert.equal(check(fixture, {...checkDetails(), isMainFrame: false}), false);
    assert.equal(request(fixture, {...requestDetails(), isMainFrame: false}), false);
    const secondary = createWindow(fixture.session);
    assert.equal(check(fixture, checkDetails(), secondary.webContents), false);
    assert.equal(request(fixture, requestDetails(), secondary.webContents), false);
    assert.equal(check(fixture, checkDetails(), null), false, 'workers have no authorized document');
    assert.equal(request(fixture, requestDetails(), null), false);
});

test('Both handlers require the current committed main document and matching origin fields', () => {
    for (const change of [
        fixture => {
            fixture.window.webContents.mainFrame.origin = 'https://example.com';
        },
        fixture => {
            fixture.window.webContents.mainFrame.url = 'https://example.com/';
        },
        fixture => {
            fixture.window.webContents.mainFrame.url = `${GUI_URL}?another-document`;
        },
        fixture => {
            fixture.window.destroyed = true;
        },
        fixture => {
            fixture.window.webContents.destroyed = true;
        },
        fixture => fixture.revokeServer()
    ]) {
        const fixture = createFixture();
        change(fixture);
        assert.equal(check(fixture), false);
        assert.equal(request(fixture), false);
    }
    const fixture = createFixture();
    assert.equal(check(fixture, checkDetails(), fixture.window.webContents, 'media', 'https://evil.test/'), false);
    for (const securityOrigin of ['https://evil.test/', `${GUI_URL}other.html`, null]) {
        assert.equal(check(fixture, {...checkDetails(), securityOrigin}), false);
        assert.equal(request(fixture, {...requestDetails(), securityOrigin}), false);
    }
    assert.equal(request(fixture, {isMainFrame: true, requestingUrl: GUI_URL, mediaTypes: ['video']}), false);
    for (const details of [missingValue, null, {}, {requestingUrl: GUI_URL}]) {
        assert.equal(fixture.session.check(fixture.window.webContents, 'media', GUI_URL, details), false);
        const results = [];
        fixture.session.request(fixture.window.webContents, 'media', value => results.push(value), details);
        assert.deepEqual(results, [false]);
    }
});

test('Approved index document permits project hashes and queries only for the current URL', () => {
    const fixture = createFixture();
    const requestingUrl = `${GUI_URL}index.html?lang=pt-br#123`;
    fixture.window.webContents.mainFrame.url = requestingUrl;
    assert.equal(check(fixture, {...checkDetails(), requestingUrl}), true);
    assert.equal(request(fixture, {...requestDetails(), requestingUrl}), true);
});

test('Unknown permissions, display capture and invalid media kinds are denied', () => {
    const fixture = createFixture();
    for (const permission of ['unknown', 'display-capture', 'notifications', 'geolocation', 'hid', 'usb',
        'speaker-selection', 'camera', 'microphone']) {
        assert.equal(check(fixture, checkDetails(), fixture.window.webContents, permission), false);
        assert.equal(request(fixture, requestDetails(), fixture.window.webContents, permission), false);
    }
    for (const mediaTypes of [missingValue, [], ['unknown'], ['audio', 'screen'], ['video', 'video'], 'video']) {
        assert.equal(request(fixture, {...requestDetails(), mediaTypes}), false);
    }
    for (const mediaType of [missingValue, 'unknown', 'screen', ['audio', 'video']]) {
        assert.equal(check(fixture, {...checkDetails(), mediaType}), false);
    }
});

test('Serial permission retains the existing chooser and device permission mechanism', () => {
    const fixture = createFixture();
    const details = {isMainFrame: true, requestingUrl: GUI_URL};
    assert.equal(check(fixture, details, fixture.window.webContents, 'serial'), true);
    assert.equal(request(fixture, details, fixture.window.webContents, 'serial'), true);
    assert.equal(check(fixture, {...details, isMainFrame: false}, fixture.window.webContents, 'serial'), false);
    assert.equal(request(fixture, {...details, isMainFrame: false}, fixture.window.webContents, 'serial'), false);
    assert.equal(typeof fixture.session.setDevicePermissionHandler, 'undefined');
});

test('Session handlers register once, revoke old windows and survive recreation without stale cleanup', () => {
    const fixture = createFixture();
    assert.equal(registerMediaPermissions(fixture.window, fixture.options), fixture.cleanup);
    assert.equal(fixture.window.listenerCount('close'), 1);
    const oldWindow = fixture.window;
    fixture.window = createWindow(fixture.session);
    const release = registerMediaPermissions(fixture.window, fixture.options);
    assert.equal(oldWindow.listenerCount('close'), 0);
    assert.equal(oldWindow.webContents.listenerCount('destroyed'), 0);
    assert.equal(check(fixture, checkDetails(), oldWindow.webContents), false);
    assert.equal(request(fixture, requestDetails(), oldWindow.webContents), false);
    fixture.cleanup();
    assert.equal(check(fixture), true);
    assert.equal(request(fixture), true);
    assert.equal(fixture.session.checks.length, 1);
    assert.equal(fixture.session.requests.length, 1);
    release();
    release();
    assert.equal(check(fixture), false);
    assert.equal(request(fixture), false);
    assert.deepEqual(fixture.window.eventNames(), []);
    assert.deepEqual(fixture.window.webContents.eventNames(), []);
});

test('Closing and destroyed windows lose authorization, including before closed is emitted', async () => {
    const fixture = createFixture();
    const event = {defaultPrevented: false};
    fixture.window.emit('close', event);
    assert.equal(check(fixture), false);
    assert.equal(request(fixture), false);
    event.defaultPrevented = true;
    await Promise.resolve();
    assert.equal(check(fixture), true, 'cancelled close restores the live owner');
    fixture.window.emit('close', {defaultPrevented: false});
    fixture.window.webContents.emit('will-prevent-unload', {defaultPrevented: false});
    await Promise.resolve();
    assert.equal(request(fixture), true, 'beforeunload may also cancel closing');
    fixture.window.webContents.emit('destroyed');
    assert.equal(check(fixture), false);
    assert.equal(request(fixture), false);
    assert.deepEqual(fixture.window.eventNames(), []);
});

test('Closed sessions remain denied until a new live Main is explicitly registered', () => {
    const fixture = createFixture();
    fixture.window.emit('closed');
    assert.equal(check(fixture), false);
    assert.equal(request(fixture), false);
    fixture.window = createWindow(fixture.session);
    assert.equal(check(fixture), false);
    registerMediaPermissions(fixture.window, fixture.options);
    assert.equal(check(fixture), true);
});
