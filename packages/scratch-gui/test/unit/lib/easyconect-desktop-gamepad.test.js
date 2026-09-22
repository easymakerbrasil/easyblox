import EasyConectDesktopSession
    from '../../../src/lib/easyconect-desktop-session';

class FakeEasyConectDesktopClient {
    constructor () {
        this.devices = [
            {
                deviceId:
                    'device-39',
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
        this.connectCalls.push(
            deviceId
        );

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

    send () {
        return Promise.resolve(
            1
        );
    }

    waitFor () {
        return new Promise(
            () => {}
        );
    }

    onDisconnect (
        listener
    ) {
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

    emitDisconnect () {
        for (
            const listener of
            [...this._disconnectListeners]
        ) {
            listener();
        }
    }
}

const createSession =
    () => {
        const client =
            new FakeEasyConectDesktopClient();

        const gamepadConnections = [];
        const gamepadSessions = [];

        const gamepadSessionFactory =
            connection => {
                const gamepadSession = {
                    id:
                        gamepadSessions.length + 1,
                    setButtonPressed:
                        jest.fn()
                };

                gamepadConnections.push(
                    connection
                );

                gamepadSessions.push(
                    gamepadSession
                );

                return gamepadSession;
            };

        const session =
            new EasyConectDesktopSession({
                client,
                gamepadSessionFactory
            });

        return {
            client,
            gamepadConnections,
            gamepadSessions,
            session
        };
    };

describe(
    'EasyConect Desktop Gamepad session ownership',
    () => {
        test('starts without a Gamepad session and creates one after Bluetooth connection', async () => {
            const {
                client,
                gamepadConnections,
                gamepadSessions,
                session
            } = createSession();

            expect(
                session.getGamepadSession()
            ).toBeNull();

            await session.connect();

            expect(
                gamepadSessions
            ).toHaveLength(
                1
            );

            expect(
                gamepadConnections
            ).toEqual([
                client
            ]);

            expect(
                session.getGamepadSession()
            ).toBe(
                gamepadSessions[0]
            );
        });

        test('discards Gamepad on explicit and unexpected disconnect', async () => {
            const {
                client,
                session
            } = createSession();

            await session.connect();

            expect(
                session.getGamepadSession()
            ).not.toBeNull();

            await session.disconnect();

            expect(
                session.getGamepadSession()
            ).toBeNull();

            await session.connect();

            expect(
                session.getGamepadSession()
            ).not.toBeNull();

            client.emitDisconnect();

            expect(
                session.getGamepadSession()
            ).toBeNull();
        });

        test('creates a fresh Gamepad session after reconnect', async () => {
            const {
                gamepadSessions,
                session
            } = createSession();

            await session.connect();

            const first =
                session.getGamepadSession();

            await session.disconnect();
            await session.connect();

            const second =
                session.getGamepadSession();

            expect(
                gamepadSessions
            ).toHaveLength(
                2
            );

            expect(second)
                .not.toBe(first);
        });
    }
);
