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

        const motorsServoConnections = [];
        const motorsServoSessions = [];

        const motorsServoSessionFactory =
            connection => {
                const motorsServoSession = {
                    id:
                        motorsServoSessions.length +
                        1,
                    getMotorValue:
                        jest.fn(
                            () => 0
                        ),
                    setMotorValue:
                        jest.fn(),
                    getServoAngle:
                        jest.fn(
                            () => 0
                        ),
                    setServoAngle:
                        jest.fn()
                };

                motorsServoConnections.push(
                    connection
                );

                motorsServoSessions.push(
                    motorsServoSession
                );

                return motorsServoSession;
            };

        const session =
            new EasyConectDesktopSession({
                client,
                motorsServoSessionFactory
            });

        return {
            client,
            motorsServoConnections,
            motorsServoSessions,
            session
        };
    };

describe(
    'EasyConect Desktop Motors Servo session ownership',
    () => {
        test('starts without a Motors Servo session and creates one after Bluetooth connection', async () => {
            const {
                client,
                motorsServoConnections,
                motorsServoSessions,
                session
            } = createSession();

            expect(
                session
                    .getMotorsServoSession()
            ).toBeNull();

            await session.connect();

            expect(
                motorsServoSessions
            ).toHaveLength(
                1
            );

            expect(
                motorsServoConnections
            ).toEqual([
                client
            ]);

            expect(
                session
                    .getMotorsServoSession()
            ).toBe(
                motorsServoSessions[0]
            );
        });

        test('discards Motors Servo on explicit and unexpected disconnect', async () => {
            const {
                client,
                session
            } = createSession();

            await session.connect();

            expect(
                session
                    .getMotorsServoSession()
            ).not.toBeNull();

            await session.disconnect();

            expect(
                session
                    .getMotorsServoSession()
            ).toBeNull();

            await session.connect();

            expect(
                session
                    .getMotorsServoSession()
            ).not.toBeNull();

            client.emitDisconnect();

            expect(
                session
                    .getMotorsServoSession()
            ).toBeNull();
        });

        test('creates a fresh Motors Servo session after reconnect', async () => {
            const {
                motorsServoSessions,
                session
            } = createSession();

            await session.connect();

            const first =
                session
                    .getMotorsServoSession();

            await session.disconnect();
            await session.connect();

            const second =
                session
                    .getMotorsServoSession();

            expect(
                motorsServoSessions
            ).toHaveLength(
                2
            );

            expect(
                second
            ).not.toBe(
                first
            );

            expect(
                second
            ).toBe(
                motorsServoSessions[1]
            );
        });
    }
);
