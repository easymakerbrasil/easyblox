const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ControllerEvents
} = require('../src/controller-events');

test('Controller Events delivers emitted payloads to subscribers', () => {
    const events = new ControllerEvents();
    const receivedPayloads = [];

    events.on('change', payload => {
        receivedPayloads.push(payload);
    });

    events.emit('change', {
        source: 'controller'
    });

    assert.deepEqual(
        receivedPayloads,
        [{
            source: 'controller'
        }]
    );
});

test('Controller Events supports multiple subscribers for the same event', () => {
    const events = new ControllerEvents();
    const calls = [];

    events.on('change', () => {
        calls.push('first');
    });

    events.on('change', () => {
        calls.push('second');
    });

    events.emit('change');

    assert.deepEqual(
        calls,
        [
            'first',
            'second'
        ]
    );
});

test('Controller Events removes a specific subscriber', () => {
    const events = new ControllerEvents();
    let callCount = 0;

    const listener = () => {
        callCount += 1;
    };

    events.on('change', listener);
    events.emit('change');

    assert.equal(
        events.off('change', listener),
        true
    );

    events.emit('change');

    assert.equal(
        callCount,
        1
    );

    assert.equal(
        events.off('change', listener),
        false
    );
});

test('Controller Events rejects invalid listeners', () => {
    const events = new ControllerEvents();

    assert.throws(
        () => events.on('change', null),
        /listener must be a function/i
    );

    assert.throws(
        () => events.on('change', 'listener'),
        /listener must be a function/i
    );
});
