
const assert = require('node:assert/strict');
const {test} = require('node:test');

const {
    CLOSE_STATES,
    CLOSE_DECISIONS,
    createDesktopCloseController
} = require('../src/desktop-close-controller');

const createFixture = () => {
    const requested = [];
    const authorized = [];

    const controller = createDesktopCloseController({
        onRequest: requestId => requested.push(requestId),
        onAuthorized: result => authorized.push(result)
    });

    return {
        controller,
        requested,
        authorized
    };
};

test('Controller begins idle', () => {
    const {controller} = createFixture();

    assert.equal(controller.getState(), CLOSE_STATES.IDLE);
    assert.equal(controller.isPending(), false);
});

test('Controller creates one active close request', () => {
    const {controller, requested} = createFixture();

    const requestId = controller.requestClose();

    assert.equal(requestId, 1);
    assert.equal(controller.getState(), CLOSE_STATES.PENDING);
    assert.equal(controller.isPending(), true);
    assert.deepEqual(requested, [1]);

    assert.equal(controller.requestClose(), null);
    assert.deepEqual(requested, [1]);
});

test('Cancellation restores idle state', () => {
    const {controller, authorized} = createFixture();

    const requestId = controller.requestClose();

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.CANCEL),
        true
    );

    assert.equal(controller.getState(), CLOSE_STATES.IDLE);
    assert.deepEqual(authorized, []);
});

test('Discard authorizes closing once', () => {
    const {controller, authorized} = createFixture();

    const requestId = controller.requestClose();

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.DISCARD),
        true
    );

    assert.equal(controller.getState(), CLOSE_STATES.AUTHORIZED);

    assert.deepEqual(authorized, [{
        requestId,
        decision: CLOSE_DECISIONS.DISCARD
    }]);

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.DISCARD),
        false
    );
});

test('Confirmed save authorizes closing', () => {
    const {controller, authorized} = createFixture();

    const requestId = controller.requestClose();

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.SAVE),
        true
    );

    assert.deepEqual(authorized, [{
        requestId,
        decision: CLOSE_DECISIONS.SAVE
    }]);
});

test('Invalid and stale responses are rejected', () => {
    const {controller, authorized} = createFixture();

    const first = controller.requestClose();

    assert.equal(controller.resolveClose(first, 'invalid'), false);
    assert.equal(controller.getState(), CLOSE_STATES.PENDING);

    assert.equal(
        controller.resolveClose(first, CLOSE_DECISIONS.CANCEL),
        true
    );

    const second = controller.requestClose();

    assert.notEqual(first, second);

    assert.equal(
        controller.resolveClose(first, CLOSE_DECISIONS.DISCARD),
        false
    );

    assert.equal(
        controller.resolveClose(second, CLOSE_DECISIONS.DISCARD),
        true
    );

    assert.equal(authorized.length, 1);
});

test('Pending request can be invalidated', () => {
    const {controller, authorized} = createFixture();

    const requestId = controller.requestClose();

    assert.equal(controller.cancelPending(), true);
    assert.equal(controller.getState(), CLOSE_STATES.IDLE);

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.DISCARD),
        false
    );

    assert.deepEqual(authorized, []);
});

test('Disposed controller permanently rejects requests and responses', () => {
    const {controller, authorized} = createFixture();

    const requestId = controller.requestClose();

    controller.dispose();
    controller.dispose();

    assert.equal(controller.getState(), CLOSE_STATES.DISPOSED);
    assert.equal(controller.requestClose(), null);

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.DISCARD),
        false
    );

    assert.deepEqual(authorized, []);
});

test('Request callback failures restore idle state', () => {
    const controller = createDesktopCloseController({
        onRequest: () => {
            throw new Error('REQUEST_FAILED');
        },
        onAuthorized: () => {}
    });

    assert.throws(
        () => controller.requestClose(),
        /REQUEST_FAILED/
    );

    assert.equal(controller.getState(), CLOSE_STATES.IDLE);
});

test('Authorization callback failures do not leave controller authorized', () => {
    const controller = createDesktopCloseController({
        onRequest: () => {},
        onAuthorized: () => {
            throw new Error('AUTHORIZATION_FAILED');
        }
    });

    const requestId = controller.requestClose();

    assert.throws(
        () => controller.resolveClose(
            requestId,
            CLOSE_DECISIONS.DISCARD
        ),
        /AUTHORIZATION_FAILED/
    );

    assert.equal(controller.getState(), CLOSE_STATES.IDLE);
});

test('Disposal during a request callback invalidates the request', () => {
    let controller;

    controller = createDesktopCloseController({
        onRequest: () => controller.dispose(),
        onAuthorized: () => {}
    });

    const requestId = controller.requestClose();

    assert.equal(controller.getState(), CLOSE_STATES.DISPOSED);

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.DISCARD),
        false
    );

    assert.equal(controller.requestClose(), null);
});

test('Disposal during authorization remains permanent', () => {
    let controller;
    let authorizationCount = 0;

    controller = createDesktopCloseController({
        onRequest: () => {},
        onAuthorized: () => {
            authorizationCount++;
            controller.dispose();
        }
    });

    const requestId = controller.requestClose();

    assert.equal(
        controller.resolveClose(requestId, CLOSE_DECISIONS.DISCARD),
        true
    );

    assert.equal(authorizationCount, 1);
    assert.equal(controller.getState(), CLOSE_STATES.DISPOSED);
    assert.equal(controller.requestClose(), null);
});

test('Controller rejects invalid callbacks', () => {
    assert.throws(
        () => createDesktopCloseController({
            onRequest: null,
            onAuthorized: () => {}
        }),
        /DESKTOP_CLOSE_INVALID_CALLBACKS/
    );
});

test('Interrupted authorized close can be reset for a new request', () => {
    const requests = [];
    const controller = createDesktopCloseController({
        onRequest: id => requests.push(id),
        onAuthorized: () => {}
    });

    assert.equal(controller.requestClose(), 1);
    assert.equal(controller.resolveClose(1, 'discard'), true);
    assert.equal(controller.getState(), CLOSE_STATES.AUTHORIZED);

    assert.equal(controller.resetAuthorized(), true);
    assert.equal(controller.getState(), CLOSE_STATES.IDLE);

    assert.equal(controller.requestClose(), 2);
    assert.deepEqual(requests, [1, 2]);

    assert.equal(controller.resolveClose(1, 'discard'), false);
    assert.equal(controller.resolveClose(2, 'cancel'), true);
});

test('Authorization reset cannot bypass pending or disposed states', () => {
    const controller = createDesktopCloseController({
        onRequest: () => {},
        onAuthorized: () => {}
    });

    assert.equal(controller.resetAuthorized(), false);

    assert.equal(controller.requestClose(), 1);
    assert.equal(controller.resetAuthorized(), false);
    assert.equal(controller.getState(), CLOSE_STATES.PENDING);

    assert.equal(controller.resolveClose(1, 'save'), true);
    controller.dispose();

    assert.equal(controller.resetAuthorized(), false);
    assert.equal(controller.getState(), CLOSE_STATES.DISPOSED);
    assert.equal(controller.requestClose(), null);
});
