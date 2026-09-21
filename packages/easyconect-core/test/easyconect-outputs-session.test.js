const test = require('node:test');
const assert = require('node:assert/strict');

const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_OUTPUTS_SIGNAL_IDS,
    getEasyConectWireChannel,
    EasyConectOutputsSession
} = require('../src');

const BOOLEAN =
    EBCP_CONTRACT
        .messageTypes
        .BOOLEAN;

const INDICATOR_CHANNEL =
    getEasyConectWireChannel(
        EASYCONECT_OUTPUTS_SIGNAL_IDS
            .INDICATOR
    );

class FakeConnection {
    constructor () {
        this.waitForCalls = [];
        this.waitForResults = [];
    }

    waitFor (
        type,
        channel
    ) {
        this.waitForCalls.push({
            type,
            channel
        });

        const result =
            this.waitForResults.shift();

        if (result instanceof Error) {
            return Promise.reject(
                result
            );
        }

        return Promise.resolve(
            result
        );
    }
}

test(
    'EasyConect Outputs session is exported by the public Core API',
    () => {
        assert.equal(
            typeof EasyConectOutputsSession,
            'function'
        );
    }
);

test(
    'EasyConect Outputs session requires a connection with waitFor',
    () => {
        assert.throws(
            () =>
                new EasyConectOutputsSession(),
            /connection/i
        );

        assert.throws(
            () =>
                new EasyConectOutputsSession({
                    connection: {}
                }),
            /waitFor/i
        );
    }
);

test(
    'EasyConect Outputs indicator starts false for every new session',
    () => {
        const first =
            new EasyConectOutputsSession({
                connection:
                    new FakeConnection()
            });

        const second =
            new EasyConectOutputsSession({
                connection:
                    new FakeConnection()
            });

        assert.equal(
            first.getIndicator(),
            false
        );

        assert.equal(
            second.getIndicator(),
            false
        );
    }
);

test(
    'EasyConect Outputs consumes BOOLEAN indicator state on the canonical wire channel',
    async () => {
        const connection =
            new FakeConnection();

        connection.waitForResults.push(
            {
                type:
                    BOOLEAN,
                sequence:
                    1,
                channel:
                    INDICATOR_CHANNEL,
                payload:
                    true
            },
            {
                type:
                    BOOLEAN,
                sequence:
                    2,
                channel:
                    INDICATOR_CHANNEL,
                payload:
                    false
            }
        );

        const outputs =
            new EasyConectOutputsSession({
                connection
            });

        assert.equal(
            await outputs.waitForIndicator(),
            true
        );

        assert.equal(
            outputs.getIndicator(),
            true
        );

        assert.equal(
            await outputs.waitForIndicator(),
            false
        );

        assert.equal(
            outputs.getIndicator(),
            false
        );

        assert.deepEqual(
            connection.waitForCalls,
            [
                {
                    type:
                        BOOLEAN,
                    channel:
                        INDICATOR_CHANNEL
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        INDICATOR_CHANNEL
                }
            ]
        );
    }
);

test(
    'EasyConect Outputs notifies indicator observers and isolates observer failures',
    async () => {
        const connection =
            new FakeConnection();

        connection.waitForResults.push(
            {
                type:
                    BOOLEAN,
                sequence:
                    1,
                channel:
                    INDICATOR_CHANNEL,
                payload:
                    true
            },
            {
                type:
                    BOOLEAN,
                sequence:
                    2,
                channel:
                    INDICATOR_CHANNEL,
                payload:
                    false
            }
        );

        const outputs =
            new EasyConectOutputsSession({
                connection
            });

        const values = [];

        outputs.onIndicatorChange(
            () => {
                throw new Error(
                    'observer failure'
                );
            }
        );

        const unsubscribe =
            outputs.onIndicatorChange(
                (value) => {
                    values.push(
                        value
                    );
                }
            );

        await outputs.waitForIndicator();

        unsubscribe();

        await outputs.waitForIndicator();

        assert.deepEqual(
            values,
            [
                true
            ]
        );

        assert.equal(
            outputs.getIndicator(),
            false
        );
    }
);
