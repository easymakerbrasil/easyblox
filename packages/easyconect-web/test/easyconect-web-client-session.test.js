const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EASYCONECT_WEB_SERIAL_DEVICE_ID,
    EasyConectWebClient,
    EasyConectWebSession
} = require('../src');

class FakeConnection {
    constructor () {
        this.state =
            'disconnected';

        this.connectCalls = [];
        this.disconnectCalls = 0;
        this.sendCalls = [];
        this.waitForCalls = [];

        this.stateListeners =
            [];
        this.errorListeners =
            [];
        this.disconnectListeners =
            [];
    }

    getState () {
        return this.state;
    }

    onStateChange (listener) {
        this.stateListeners.push(
            listener
        );

        return () => {};
    }

    onError (listener) {
        this.errorListeners.push(
            listener
        );

        return () => {};
    }

    onDisconnect (listener) {
        this.disconnectListeners.push(
            listener
        );

        return () => {};
    }

    async connect (options) {
        this.connectCalls.push({
            ...options
        });

        this.state =
            'connected';

        return true;
    }

    async disconnect () {
        this.disconnectCalls += 1;

        this.state =
            'disconnected';

        return true;
    }

    async send (
        type,
        channel,
        payload
    ) {
        this.sendCalls.push({
            type,
            channel,
            payload
        });

        return 37;
    }

    waitFor (
        type,
        channel
    ) {
        this.waitForCalls.push({
            type,
            channel
        });

        return Promise.resolve({
            type,
            channel,
            payload:
                'received'
        });
    }
}

class FakeWebClient {
    constructor () {
        this.connectCalls = 0;
        this.disconnectCalls = 0;

        this.connectError =
            null;

        this.disconnectListeners =
            [];

        this.waitForCalls =
            [];
    }

    onDisconnect (listener) {
        this.disconnectListeners.push(
            listener
        );

        return () => {
            const index =
                this.disconnectListeners
                    .indexOf(
                        listener
                    );

            if (index >= 0) {
                this.disconnectListeners
                    .splice(
                        index,
                        1
                    );
            }
        };
    }

    async connect () {
        this.connectCalls += 1;

        if (this.connectError) {
            throw this.connectError;
        }

        return true;
    }

    async disconnect () {
        this.disconnectCalls += 1;

        return true;
    }

    async send () {
        return 1;
    }

    waitFor (
        type,
        channel
    ) {
        this.waitForCalls.push({
            type,
            channel
        });

        return new Promise(
            () => {}
        );
    }

    emitDisconnect () {
        for (
            const listener of
            [...this.disconnectListeners]
        ) {
            listener();
        }
    }
}

test('Web client connects EasyConectConnection using the canonical browser-selected device id', async () => {
    const connection =
        new FakeConnection();

    const client =
        new EasyConectWebClient({
            connection
        });

    assert.equal(
        await client.connect(),
        true
    );

    assert.deepEqual(
        connection.connectCalls,
        [{
            deviceId:
                EASYCONECT_WEB_SERIAL_DEVICE_ID
        }]
    );
});

test('Web client delegates connection lifecycle and protocol operations', async () => {
    const connection =
        new FakeConnection();

    const client =
        new EasyConectWebClient({
            connection
        });

    assert.equal(
        client.getState(),
        'disconnected'
    );

    const stateListener =
        () => {};

    const errorListener =
        () => {};

    const disconnectListener =
        () => {};

    client.onStateChange(
        stateListener
    );

    client.onError(
        errorListener
    );

    client.onDisconnect(
        disconnectListener
    );

    assert.deepEqual(
        connection.stateListeners,
        [
            stateListener
        ]
    );

    assert.deepEqual(
        connection.errorListeners,
        [
            errorListener
        ]
    );

    assert.deepEqual(
        connection.disconnectListeners,
        [
            disconnectListener
        ]
    );

    assert.equal(
        await client.send(
            2,
            'web-channel',
            42
        ),
        37
    );

    assert.deepEqual(
        connection.sendCalls,
        [{
            type:
                2,
            channel:
                'web-channel',
            payload:
                42
        }]
    );

    assert.deepEqual(
        await client.waitFor(
            1,
            'incoming'
        ),
        {
            type:
                1,
            channel:
                'incoming',
            payload:
                'received'
        }
    );

    assert.equal(
        await client.disconnect(),
        true
    );

    assert.equal(
        connection.disconnectCalls,
        1
    );
});

test('Web session starts disconnected without module sessions', () => {
    const session =
        new EasyConectWebSession({
            client:
                new FakeWebClient()
        });

    assert.deepEqual(
        session.getState(),
        {
            status:
                'disconnected',
            errorCode:
                null
        }
    );

    assert.equal(
        session.getControlsSession(),
        null
    );

    assert.equal(
        session.getMotorsServoSession(),
        null
    );

    assert.equal(
        session.getGamepadSession(),
        null
    );

    assert.equal(
        session.getTerminalSession(),
        null
    );

    assert.equal(
        session.getOutputsSession(),
        null
    );
});

test('Web session connects through the browser client and creates every canonical module session', async () => {
    const client =
        new FakeWebClient();

    const session =
        new EasyConectWebSession({
            client
        });

    const states =
        [];

    session.onStateChange(
        state => {
            states.push(
                state
            );
        }
    );

    assert.equal(
        await session.connect(),
        true
    );

    assert.equal(
        client.connectCalls,
        1
    );

    assert.deepEqual(
        states,
        [
            {
                status:
                    'connecting',
                errorCode:
                    null
            },
            {
                status:
                    'connected',
                errorCode:
                    null
            }
        ]
    );

    assert.notEqual(
        session.getControlsSession(),
        null
    );

    assert.notEqual(
        session.getMotorsServoSession(),
        null
    );

    assert.notEqual(
        session.getGamepadSession(),
        null
    );

    assert.notEqual(
        session.getTerminalSession(),
        null
    );

    assert.notEqual(
        session.getOutputsSession(),
        null
    );
});

test('Web session reports connection failure without creating module sessions', async () => {
    const client =
        new FakeWebClient();

    client.connectError =
        new Error(
            'browser selection failed'
        );

    const session =
        new EasyConectWebSession({
            client
        });

    assert.equal(
        await session.connect(),
        false
    );

    assert.deepEqual(
        session.getState(),
        {
            status:
                'error',
            errorCode:
                'connection-failed'
        }
    );

    assert.equal(
        session.getControlsSession(),
        null
    );

    assert.equal(
        session.getTerminalSession(),
        null
    );
});

test('Web session disconnects and clears every module session', async () => {
    const client =
        new FakeWebClient();

    const session =
        new EasyConectWebSession({
            client
        });

    await session.connect();

    assert.equal(
        await session.disconnect(),
        true
    );

    assert.equal(
        client.disconnectCalls,
        1
    );

    assert.deepEqual(
        session.getState(),
        {
            status:
                'disconnected',
            errorCode:
                null
        }
    );

    assert.equal(
        session.getControlsSession(),
        null
    );

    assert.equal(
        session.getMotorsServoSession(),
        null
    );

    assert.equal(
        session.getGamepadSession(),
        null
    );

    assert.equal(
        session.getTerminalSession(),
        null
    );

    assert.equal(
        session.getOutputsSession(),
        null
    );
});

test('Web session reports an unexpected browser transport loss', async () => {
    const client =
        new FakeWebClient();

    const session =
        new EasyConectWebSession({
            client
        });

    await session.connect();

    client.emitDisconnect();

    assert.deepEqual(
        session.getState(),
        {
            status:
                'disconnected',
            errorCode:
                'connection-lost'
        }
    );

    assert.equal(
        session.getGamepadSession(),
        null
    );

    assert.equal(
        session.getOutputsSession(),
        null
    );
});

test('Web session does not reconnect when it is already connected', async () => {
    const client =
        new FakeWebClient();

    const session =
        new EasyConectWebSession({
            client
        });

    assert.equal(
        await session.connect(),
        true
    );

    assert.equal(
        await session.connect(),
        true
    );

    assert.equal(
        client.connectCalls,
        1
    );
});
