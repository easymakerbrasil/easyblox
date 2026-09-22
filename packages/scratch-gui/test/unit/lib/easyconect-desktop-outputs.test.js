import EasyConectDesktopSession
    from '../../../src/lib/easyconect-desktop-session';

class FakeEasyConectDesktopClient {
    constructor () {
        this.devices = [
            {
                deviceId:
                    'COM10',
                name:
                    'EasyMaker-39'
            }
        ];

        this.connectCalls = [];
        this.disconnectCalls = 0;

        this._disconnectListeners = [];
    }

    listDevices () {
        return Promise.resolve(
            this.devices
        );
    }

    connect ({
        deviceId
    }) {
        this.connectCalls.push({
            deviceId
        });

        return Promise.resolve(
            true
        );
    }

    disconnect () {
        this.disconnectCalls += 1;

        return Promise.resolve(
            true
        );
    }

    onDisconnect (listener) {
        this._disconnectListeners.push(
            listener
        );

        return () => {
            this._disconnectListeners =
                this._disconnectListeners.filter(
                    registeredListener =>
                        registeredListener !==
                        listener
                );
        };
    }
}

class FakeTerminalSession {
    waitForText () {
        return new Promise(
            () => {}
        );
    }

    waitForNumber () {
        return new Promise(
            () => {}
        );
    }
}

class FakeOutputsSession {
    constructor () {
        this.indicator = false;
        this.waitForIndicatorCalls = 0;

        this._resolvers = [];
    }

    getIndicator () {
        return this.indicator;
    }

    waitForIndicator () {
        this.waitForIndicatorCalls += 1;

        return new Promise(
            resolve => {
                this._resolvers.push(
                    value => {
                        this.indicator =
                            value;

                        resolve(
                            value
                        );
                    }
                );
            }
        );
    }

    resolveNext (
        value
    ) {
        const resolve =
            this._resolvers.shift();

        if (!resolve) {
            throw new Error(
                'No pending Outputs wait'
            );
        }

        resolve(
            value
        );
    }
}

const flushPromises =
    async () => {
        await Promise.resolve();
        await Promise.resolve();
    };

const createSession =
    () => {
        const client =
            new FakeEasyConectDesktopClient();

        const outputsSessions = [];

        const session =
            new EasyConectDesktopSession({
                client,
                terminalSessionFactory:
                    () =>
                        new FakeTerminalSession(),
                gamepadSessionFactory:
                    () => ({}),
                controlsSessionFactory:
                    () => ({}),
                outputsSessionFactory:
                    () => {
                        const outputs =
                            new FakeOutputsSession();

                        outputsSessions.push(
                            outputs
                        );

                        return outputs;
                    }
            });

        return {
            client,
            outputsSessions,
            session
        };
    };

describe(
    'EasyConect Desktop Outputs lifecycle',
    () => {
        test('starts without an Outputs session and creates it only after Bluetooth connects', async () => {
            const {
                outputsSessions,
                session
            } = createSession();

            expect(
                typeof session.getOutputsSession
            ).toBe(
                'function'
            );

            expect(
                session.getOutputsSession()
            ).toBeNull();

            await session.connect();

            expect(
                outputsSessions
            ).toHaveLength(
                1
            );

            expect(
                session.getOutputsSession()
            ).toBe(
                outputsSessions[0]
            );

            expect(
                outputsSessions[0]
                    .getIndicator()
            ).toBe(
                false
            );

            expect(
                outputsSessions[0]
                    .waitForIndicatorCalls
            ).toBe(
                1
            );
        });

        test('discards Outputs immediately on disconnect and reconnects with false state', async () => {
            const {
                outputsSessions,
                session
            } = createSession();

            await session.connect();

            const firstOutputs =
                outputsSessions[0];

            firstOutputs.resolveNext(
                true
            );

            await flushPromises();

            expect(
                firstOutputs
                    .getIndicator()
            ).toBe(
                true
            );

            await session.disconnect();

            expect(
                session.getOutputsSession()
            ).toBeNull();

            await session.connect();

            expect(
                outputsSessions
            ).toHaveLength(
                2
            );

            const secondOutputs =
                outputsSessions[1];

            expect(
                session.getOutputsSession()
            ).toBe(
                secondOutputs
            );

            expect(
                secondOutputs
                    .getIndicator()
            ).toBe(
                false
            );
        });

        test('does not restart a stale Outputs receiver after reconnect', async () => {
            const {
                outputsSessions,
                session
            } = createSession();

            await session.connect();

            const firstOutputs =
                outputsSessions[0];

            expect(
                firstOutputs
                    .waitForIndicatorCalls
            ).toBe(
                1
            );

            firstOutputs.resolveNext(
                true
            );

            await flushPromises();

            expect(
                firstOutputs
                    .waitForIndicatorCalls
            ).toBe(
                2
            );

            await session.disconnect();
            await session.connect();

            const secondOutputs =
                outputsSessions[1];

            expect(
                secondOutputs
                    .waitForIndicatorCalls
            ).toBe(
                1
            );

            firstOutputs.resolveNext(
                false
            );

            await flushPromises();

            expect(
                firstOutputs
                    .waitForIndicatorCalls
            ).toBe(
                2
            );

            expect(
                secondOutputs
                    .waitForIndicatorCalls
            ).toBe(
                1
            );
        });
    }
);
