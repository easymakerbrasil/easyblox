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

        this._disconnectListeners = [];
    }

    listDevices () {
        return Promise.resolve(
            this.devices
        );
    }

    connect () {
        return Promise.resolve(
            true
        );
    }

    disconnect () {
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

        const controlsConnections = [];
        const controlsSessions = [];

        const controlsSessionFactory =
            connection => {
                const controlsSession = {
                    id:
                        controlsSessions.length + 1
                };

                controlsConnections.push(
                    connection
                );

                controlsSessions.push(
                    controlsSession
                );

                return controlsSession;
            };

        const session =
            new EasyConectDesktopSession({
                client,
                controlsSessionFactory
            });

        return {
            client,
            controlsConnections,
            controlsSessions,
            session
        };
    };

describe(
    'EasyConect Desktop Controls session ownership',
    () => {
        test('starts without Controls and creates it only after Bluetooth connects', async () => {
            const {
                client,
                controlsConnections,
                controlsSessions,
                session
            } = createSession();

            expect(
                session.getControlsSession()
            ).toBeNull();

            await session.connect();

            expect(
                controlsSessions
            ).toHaveLength(
                1
            );

            expect(
                controlsConnections
            ).toEqual([
                client
            ]);

            expect(
                session.getControlsSession()
            ).toBe(
                controlsSessions[0]
            );
        });

        test('discards Controls on explicit and unexpected disconnect', async () => {
            const {
                client,
                session
            } = createSession();

            await session.connect();

            expect(
                session.getControlsSession()
            ).not.toBeNull();

            await session.disconnect();

            expect(
                session.getControlsSession()
            ).toBeNull();

            await session.connect();

            expect(
                session.getControlsSession()
            ).not.toBeNull();

            client.emitDisconnect();

            expect(
                session.getControlsSession()
            ).toBeNull();
        });

        test('creates a fresh Controls session after reconnect', async () => {
            const {
                controlsSessions,
                session
            } = createSession();

            await session.connect();

            const first =
                session.getControlsSession();

            await session.disconnect();
            await session.connect();

            const second =
                session.getControlsSession();

            expect(
                controlsSessions
            ).toHaveLength(
                2
            );

            expect(second)
                .not.toBe(first);
        });
    }
);
