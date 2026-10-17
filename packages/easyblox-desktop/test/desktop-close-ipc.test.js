
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {test} = require('node:test');

const {
    CLOSE_REQUESTED_CHANNEL,
    CLOSE_RESOLVE_CHANNEL,
    CLOSE_ACK_CHANNEL,
    registerDesktopCloseIpc
} = require('../src/desktop-close-ipc');

const createFixture = () => {
    const window = new EventEmitter();
    const contents = new EventEmitter();
    const handlers = new Map();
    const sent = [];
    const authorized = [];

    window.destroyed = false;
    contents.destroyed = false;

    window.isDestroyed = () => window.destroyed;
    contents.isDestroyed = () => contents.destroyed;

    contents.mainFrame = {
        origin: 'http://127.0.0.1:8601',
        url: 'http://127.0.0.1:8601/'
    };

    contents.getURL = () => contents.mainFrame.url;

    contents.ipc = {
        handle: (channel, handler) => {
            assert.equal(handlers.has(channel), false);
            handlers.set(channel, handler);
        },

        removeHandler: channel => {
            handlers.delete(channel);
        }
    };

    contents.send = (...args) => sent.push(args);

    window.webContents = contents;

    const registration = registerDesktopCloseIpc(window, {
        onAuthorized: value => authorized.push(value)
    });

    const event = () => ({
        sender: contents,
        senderFrame: contents.mainFrame
    });

    const resolve = (...args) => (
        handlers.get(CLOSE_RESOLVE_CHANNEL)(
            event(),
            ...args
        )
    );

    return {
        window,
        contents,
        handlers,
        sent,
        authorized,
        registration,
        event,
        resolve
    };
};

test('Registers one window-scoped IPC handler without affecting unrelated handlers', () => {
    const f = createFixture();

    f.handlers.set('other', () => 42);

    assert.deepEqual(
        [...f.handlers.keys()],
        [
            CLOSE_RESOLVE_CHANNEL,
            CLOSE_ACK_CHANNEL,
            'other'
        ]
    );

    assert.equal(
        registerDesktopCloseIpc(f.window, {
            onAuthorized: () => {}
        }),
        f.registration
    );

    assert.equal(f.handlers.size, 3);
    assert.equal(f.window.listenerCount('close'), 0);

    f.registration.dispose();

    assert.equal(
        f.handlers.has(CLOSE_RESOLVE_CHANNEL),
        false
    );

    assert.equal(
        f.handlers.has(CLOSE_ACK_CHANNEL),
        false
    );

    assert.equal(f.handlers.get('other')(), 42);
});

test('Sends one close request while pending and accepts discard once', () => {
    const f = createFixture();

    assert.equal(f.registration.requestClose(), 1);
    assert.equal(f.registration.requestClose(), null);

    assert.deepEqual(f.sent, [
        [CLOSE_REQUESTED_CHANNEL, 1]
    ]);

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'authorized'}
    );

    assert.deepEqual(f.authorized, [{
        requestId: 1,
        decision: 'discard'
    }]);

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'rejected'}
    );

    assert.equal(f.registration.requestClose(), null);
});

test('Confirmed save authorizes and cancellation permits another attempt', () => {
    const f = createFixture();

    assert.equal(f.registration.requestClose(), 1);

    assert.deepEqual(
        f.resolve(1, 'cancel'),
        {status: 'cancelled'}
    );

    assert.equal(f.authorized.length, 0);
    assert.equal(f.registration.requestClose(), 2);

    assert.deepEqual(
        f.resolve(1, 'save'),
        {status: 'rejected'}
    );

    assert.deepEqual(
        f.resolve(2, 'save'),
        {status: 'authorized'}
    );

    assert.deepEqual(f.authorized, [{
        requestId: 2,
        decision: 'save'
    }]);
});

test('Rejects unexpected arguments and preserves pending request', () => {
    const f = createFixture();

    f.registration.requestClose();

    for (const args of [
        [0, 'save'],
        ['1', 'save'],
        [1, 'unknown'],
        [1, 'save', 'extra'],
        []
    ]) {
        assert.throws(
            () => f.resolve(...args),
            /DESKTOP_CLOSE_INVALID_ARGUMENTS/
        );
    }

    assert.deepEqual(
        f.resolve(1, 'cancel'),
        {status: 'cancelled'}
    );
});

test('Rejects forged senders, frames, origins and documents', () => {
    const changes = [
        (f, e) => { e.sender = {}; },
        (f, e) => { e.senderFrame = {}; },
        (f, e) => { e.senderFrame = null; },
        f => { f.contents.mainFrame.origin = 'http://localhost:8601'; },
        f => { f.contents.mainFrame.url = 'http://127.0.0.1:8601/other.html'; },
        f => { f.contents.mainFrame.url = 'https://127.0.0.1:8601/'; },
        f => { f.contents.mainFrame.url = 'http://user@127.0.0.1:8601/'; },
        f => { f.window.destroyed = true; },
        f => { f.contents.destroyed = true; }
    ];

    for (const change of changes) {
        const f = createFixture();

        f.registration.requestClose();

        const event = f.event();
        change(f, event);

        assert.throws(
            () => f.handlers.get(
                CLOSE_RESOLVE_CHANNEL
            )(event, 1, 'save'),
            /DESKTOP_UNAUTHORIZED/
        );

        assert.equal(f.authorized.length, 0);
    }
});

test('Rejects request when document is not trusted', () => {
    const f = createFixture();

    f.contents.mainFrame.url =
        'http://127.0.0.1:8601/other.html';

    assert.throws(
        () => f.registration.requestClose(),
        /DESKTOP_UNAUTHORIZED/
    );

    assert.deepEqual(f.sent, []);
    assert.equal(f.registration.getState(), 'idle');
});

test('Navigation invalidates outstanding requests', () => {
    const f = createFixture();

    f.registration.requestClose();

    f.contents.emit(
        'did-start-navigation',
        {},
        {isMainFrame: false}
    );

    assert.deepEqual(
        f.resolve(1, 'cancel'),
        {status: 'cancelled'}
    );

    f.registration.requestClose();

    f.contents.emit(
        'did-start-navigation',
        {},
        {
            isMainFrame: true,
            isSameDocument: false
        }
    );

    assert.deepEqual(
        f.resolve(2, 'save'),
        {status: 'rejected'}
    );

    assert.equal(f.registration.requestClose(), 3);

    assert.deepEqual(
        f.resolve(3, 'cancel'),
        {status: 'cancelled'}
    );
});

test('Frame replacement rejects an old request without navigation event', () => {
    const f = createFixture();

    f.registration.requestClose();

    f.contents.mainFrame = {
        ...f.contents.mainFrame
    };

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'rejected'}
    );

    assert.equal(f.registration.requestClose(), 2);
    assert.deepEqual(f.authorized, []);
});

test('Explicit cancelPending invalidates a request', () => {
    const f = createFixture();

    f.registration.requestClose();

    assert.equal(
        f.registration.cancelPending(),
        true
    );

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'rejected'}
    );

    assert.equal(f.registration.requestClose(), 2);
});

test('Destroy and crash invalidate callbacks', () => {
    for (const signal of [
        'closed',
        'destroyed',
        'render-process-gone'
    ]) {
        const f = createFixture();

        f.registration.requestClose();

        const stale = f.handlers.get(
            CLOSE_RESOLVE_CHANNEL
        );

        if (signal === 'closed') {
            f.window.emit(signal);
        } else {
            f.contents.emit(signal);
        }

        assert.equal(
            f.handlers.has(CLOSE_RESOLVE_CHANNEL),
            false
        );

        assert.equal(
            f.registration.getState(),
            'disposed'
        );

        assert.equal(f.registration.requestClose(), null);

        assert.throws(
            () => stale(
                f.event(),
                1,
                'discard'
            ),
            /DESKTOP_UNAUTHORIZED/
        );

        assert.deepEqual(f.authorized, []);

        f.registration.dispose();
    }
});

test('A send failure does not leave the controller pending', () => {
    const f = createFixture();

    f.contents.send = () => {
        throw new Error('SEND_FAILED');
    };

    assert.throws(
        () => f.registration.requestClose(),
        /SEND_FAILED/
    );

    assert.equal(
        f.registration.getState(),
        'idle'
    );
});

test('Authorization callback failure restores idle state', () => {
    const window = new EventEmitter();
    const contents = new EventEmitter();
    const handlers = new Map();

    window.webContents = contents;
    window.isDestroyed = () => false;

    contents.isDestroyed = () => false;

    contents.mainFrame = {
        origin: 'http://127.0.0.1:8601',
        url: 'http://127.0.0.1:8601/'
    };

    contents.getURL = () => contents.mainFrame.url;
    contents.send = () => {};

    contents.ipc = {
        handle: (channel, handler) => {
            handlers.set(channel, handler);
        },
        removeHandler: channel => {
            handlers.delete(channel);
        }
    };

    const registration = registerDesktopCloseIpc(
        window,
        {
            onAuthorized: () => {
                throw new Error('CLOSE_FAILED');
            }
        }
    );

    registration.requestClose();

    assert.throws(
        () => handlers.get(CLOSE_RESOLVE_CHANNEL)(
            {
                sender: contents,
                senderFrame: contents.mainFrame
            },
            1,
            'discard'
        ),
        /CLOSE_FAILED/
    );

    assert.equal(
        registration.getState(),
        'idle'
    );

    registration.dispose();
});

test('IPC can reset an interrupted authorized close safely', () => {
    const f = createFixture();

    assert.equal(f.registration.resetAuthorized(), false);

    assert.equal(f.registration.requestClose(), 1);
    assert.equal(f.registration.resetAuthorized(), false);

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'authorized'}
    );

    assert.equal(f.registration.getState(), 'authorized');

    assert.equal(f.registration.resetAuthorized(), true);
    assert.equal(f.registration.getState(), 'idle');

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'rejected'}
    );

    assert.equal(f.registration.requestClose(), 2);

    assert.deepEqual(
        f.resolve(2, 'cancel'),
        {status: 'cancelled'}
    );

    f.registration.dispose();

    assert.equal(f.registration.resetAuthorized(), false);
    assert.equal(f.registration.requestClose(), null);
});

test('Main-frame navigation invalidates an authorized close', () => {
    const f = createFixture();

    assert.equal(f.registration.requestClose(), 1);

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'authorized'}
    );

    assert.equal(
        f.registration.getState(),
        'authorized'
    );

    f.contents.emit(
        'did-start-navigation',
        {},
        {
            isMainFrame: true,
            isSameDocument: false
        }
    );

    assert.equal(
        f.registration.getState(),
        'idle'
    );

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'rejected'}
    );

    assert.equal(f.registration.requestClose(), 2);

    assert.deepEqual(
        f.resolve(2, 'cancel'),
        {status: 'cancelled'}
    );
});


test('ACK confirms only the current pending request', () => {
    const f = createFixture();
    const ack = id => f.handlers.get(CLOSE_ACK_CHANNEL)(f.event(), id);

    assert.equal(f.registration.requestClose(), 1);
    assert.equal(f.registration.isAcknowledged(1), false);

    assert.deepEqual(ack(1), {status: 'acknowledged'});
    assert.equal(f.registration.isAcknowledged(1), true);
    assert.equal(f.registration.getState(), 'pending');

    assert.deepEqual(ack(1), {status: 'rejected'});
    assert.deepEqual(f.authorized, []);

    assert.deepEqual(f.resolve(1, 'cancel'), {status: 'cancelled'});
    assert.equal(f.registration.isAcknowledged(1), false);
});

test('ACK rejects stale requests and remains isolated by request ID', () => {
    const f = createFixture();
    const ack = id => f.handlers.get(CLOSE_ACK_CHANNEL)(f.event(), id);

    f.registration.requestClose();
    assert.deepEqual(ack(2), {status: 'rejected'});

    assert.deepEqual(f.resolve(1, 'cancel'), {status: 'cancelled'});
    assert.deepEqual(ack(1), {status: 'rejected'});

    assert.equal(f.registration.requestClose(), 2);
    assert.deepEqual(ack(1), {status: 'rejected'});
    assert.deepEqual(ack(2), {status: 'acknowledged'});

    assert.equal(f.registration.isAcknowledged(1), false);
    assert.equal(f.registration.isAcknowledged(2), true);
});

test('ACK rejects invalid arguments without changing the request', () => {
    const f = createFixture();
    const handler = f.handlers.get(CLOSE_ACK_CHANNEL);

    f.registration.requestClose();

    for (const args of [
        [],
        [0],
        [-1],
        ['1'],
        [1.5],
        [Number.MAX_SAFE_INTEGER + 1],
        [1, 'extra']
    ]) {
        assert.throws(
            () => handler(f.event(), ...args),
            /DESKTOP_CLOSE_INVALID_ARGUMENTS/
        );
    }

    assert.equal(f.registration.isAcknowledged(1), false);
    assert.deepEqual(handler(f.event(), 1), {status: 'acknowledged'});
});

test('ACK rejects unauthorized senders and documents', () => {
    const changes = [
        (f, event) => { event.sender = {}; },
        (f, event) => { event.senderFrame = {}; },
        (f, event) => { event.senderFrame = null; },
        f => { f.contents.mainFrame.origin = 'http://localhost:8601'; },
        f => { f.contents.mainFrame.url = 'http://127.0.0.1:8601/other.html'; },
        f => { f.window.destroyed = true; },
        f => { f.contents.destroyed = true; }
    ];

    for (const change of changes) {
        const f = createFixture();
        f.registration.requestClose();

        const event = f.event();
        change(f, event);

        assert.throws(
            () => f.handlers.get(CLOSE_ACK_CHANNEL)(event, 1),
            /DESKTOP_UNAUTHORIZED/
        );

        assert.equal(f.registration.isAcknowledged(1), false);
    }
});

test('Navigation invalidates ACK and pending request', () => {
    const f = createFixture();
    const ack = id => f.handlers.get(CLOSE_ACK_CHANNEL)(f.event(), id);

    f.registration.requestClose();
    assert.deepEqual(ack(1), {status: 'acknowledged'});

    f.contents.emit(
        'did-start-navigation',
        {},
        {isMainFrame: true, isSameDocument: false}
    );

    assert.equal(f.registration.isAcknowledged(1), false);
    assert.deepEqual(ack(1), {status: 'rejected'});
    assert.equal(f.registration.requestClose(), 2);
});

test('Decision before ACK remains valid', () => {
    const f = createFixture();

    f.registration.requestClose();
    assert.equal(f.registration.isAcknowledged(1), false);

    assert.deepEqual(
        f.resolve(1, 'discard'),
        {status: 'authorized'}
    );

    assert.deepEqual(f.authorized, [{
        requestId: 1,
        decision: 'discard'
    }]);

    assert.equal(f.registration.isAcknowledged(1), false);

    assert.deepEqual(
        f.handlers.get(CLOSE_ACK_CHANNEL)(f.event(), 1),
        {status: 'rejected'}
    );
});

test('Disposed registration rejects delayed ACK callbacks', () => {
    const f = createFixture();

    f.registration.requestClose();

    const staleAck = f.handlers.get(CLOSE_ACK_CHANNEL);
    f.registration.dispose();

    assert.equal(f.handlers.has(CLOSE_ACK_CHANNEL), false);
    assert.equal(f.registration.isAcknowledged(1), false);

    assert.throws(
        () => staleAck(f.event(), 1),
        /DESKTOP_UNAUTHORIZED/
    );

    assert.deepEqual(f.authorized, []);
});


test('ACK notification fires once for a valid request', () => {
    const f = createFixture();
    const notified = [];

    f.registration.dispose();

    const registration = registerDesktopCloseIpc(f.window, {
        onAuthorized: value => f.authorized.push(value),
        onAcknowledged: requestId => notified.push(requestId)
    });

    assert.equal(registration.requestClose(), 1);

    const ack = id => f.handlers.get(CLOSE_ACK_CHANNEL)(f.event(), id);

    assert.deepEqual(ack(1), {status: 'acknowledged'});
    assert.deepEqual(ack(1), {status: 'rejected'});

    assert.deepEqual(notified, [1]);
    assert.equal(registration.getState(), 'pending');
    assert.deepEqual(f.authorized, []);

    registration.dispose();
});

test('ACK notification excludes stale, duplicate and invalid requests', () => {
    const f = createFixture();
    const notified = [];

    f.registration.dispose();

    const registration = registerDesktopCloseIpc(f.window, {
        onAuthorized: value => f.authorized.push(value),
        onAcknowledged: requestId => notified.push(requestId)
    });

    const handler = f.handlers.get(CLOSE_ACK_CHANNEL);
    const ack = id => handler(f.event(), id);

    assert.equal(registration.requestClose(), 1);

    assert.deepEqual(ack(2), {status: 'rejected'});
    assert.throws(
        () => ack(0),
        /DESKTOP_CLOSE_INVALID_ARGUMENTS/
    );

    assert.deepEqual(notified, []);

    assert.deepEqual(ack(1), {status: 'acknowledged'});
    assert.deepEqual(ack(1), {status: 'rejected'});
    assert.deepEqual(notified, [1]);

    assert.deepEqual(f.resolve(1, 'cancel'), {status: 'cancelled'});
    assert.equal(registration.requestClose(), 2);

    assert.deepEqual(ack(1), {status: 'rejected'});
    assert.deepEqual(notified, [1]);

    registration.dispose();
});

test('ACK notification callback failure never authorizes closing', () => {
    const f = createFixture();
    const originalConsoleError = console.error;
    const loggedErrors = [];

    f.registration.dispose();

    try {
        console.error = (...args) => loggedErrors.push(args);

        const registration = registerDesktopCloseIpc(f.window, {
            onAuthorized: value => f.authorized.push(value),
            onAcknowledged: () => {
                throw new Error('ACK_CALLBACK_FAILURE');
            }
        });

        assert.equal(registration.requestClose(), 1);

        const result = f.handlers.get(CLOSE_ACK_CHANNEL)(f.event(), 1);

        assert.deepEqual(result, {status: 'acknowledged'});
        assert.equal(registration.isAcknowledged(1), true);
        assert.equal(registration.getState(), 'pending');
        assert.deepEqual(f.authorized, []);

        assert.equal(loggedErrors.length, 1);
        assert.match(
            String(loggedErrors[0][1]),
            /ACK_CALLBACK_FAILURE/
        );

        registration.dispose();
    } finally {
        console.error = originalConsoleError;
    }
});

test('ACK remains compatible without notification callback', () => {
    const f = createFixture();

    assert.equal(f.registration.requestClose(), 1);

    assert.deepEqual(
        f.handlers.get(CLOSE_ACK_CHANNEL)(f.event(), 1),
        {status: 'acknowledged'}
    );

    assert.equal(f.registration.isAcknowledged(1), true);
    assert.equal(f.registration.getState(), 'pending');
    assert.deepEqual(f.authorized, []);

    f.registration.dispose();
});


test('Resolved notification reports accepted cancel decision once', () => {
    const f = createFixture();
    const resolved = [];

    f.registration.dispose();

    const registration = registerDesktopCloseIpc(f.window, {
        onAuthorized: value => f.authorized.push(value),
        onResolved: (requestId, decision) => {
            resolved.push({requestId, decision});
        }
    });

    assert.equal(registration.requestClose(), 1);

    assert.deepEqual(
        f.resolve(1, 'cancel'),
        {status: 'cancelled'}
    );

    assert.deepEqual(resolved, [
        {requestId: 1, decision: 'cancel'}
    ]);

    assert.equal(registration.getState(), 'idle');

    assert.deepEqual(
        f.resolve(1, 'cancel'),
        {status: 'rejected'}
    );

    assert.equal(resolved.length, 1);
    assert.deepEqual(f.authorized, []);

    registration.dispose();
});

test('Resolved notification reports accepted save and discard decisions', () => {
    for (const decision of ['save', 'discard']) {
        const f = createFixture();
        const resolved = [];

        f.registration.dispose();

        const registration = registerDesktopCloseIpc(f.window, {
            onAuthorized: value => f.authorized.push(value),
            onResolved: (requestId, value) => {
                resolved.push({requestId, decision: value});
            }
        });

        assert.equal(registration.requestClose(), 1);

        assert.deepEqual(
            f.resolve(1, decision),
            {status: 'authorized'}
        );

        assert.deepEqual(resolved, [
            {requestId: 1, decision}
        ]);

        assert.equal(f.authorized.length, 1);
        assert.equal(registration.getState(), 'authorized');

        assert.deepEqual(
            f.resolve(1, decision),
            {status: 'rejected'}
        );

        assert.equal(resolved.length, 1);

        registration.dispose();
    }
});

test('Resolved notification failure does not change accepted cancellation', () => {
    const f = createFixture();
    const originalConsoleError = console.error;
    const loggedErrors = [];

    f.registration.dispose();

    try {
        console.error = (...args) => loggedErrors.push(args);

        const registration = registerDesktopCloseIpc(f.window, {
            onAuthorized: value => f.authorized.push(value),
            onResolved: () => {
                throw new Error('RESOLVED_CALLBACK_FAILURE');
            }
        });

        assert.equal(registration.requestClose(), 1);

        assert.deepEqual(
            f.resolve(1, 'cancel'),
            {status: 'cancelled'}
        );

        assert.equal(registration.getState(), 'idle');
        assert.deepEqual(f.authorized, []);
        assert.equal(loggedErrors.length, 1);

        assert.match(
            String(loggedErrors[0][1]),
            /RESOLVED_CALLBACK_FAILURE/
        );

        registration.dispose();
    } finally {
        console.error = originalConsoleError;
    }
});
