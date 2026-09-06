import EasyBloxControllerDesktopSession
    from '../../../src/lib/easyblox-controller-desktop-session';

class FakeHardwareServiceClient {
    constructor () {
        this.devices = [];
        this.listCalls = 0;
        this.error = null;
    }

    listBluetoothDevices () {
        this.listCalls += 1;

        if (this.error) {
            return Promise.reject(
                this.error
            );
        }

        return Promise.resolve({
            devices:
                this.devices
        });
    }
}

class FakeConnection {
    constructor () {
        this.connectCalls = [];
        this.disconnectCalls = 0;
        this.connectError = null;

        this._disconnectListeners = [];
    }

    connect ({deviceId}) {
        this.connectCalls.push({
            deviceId
        });

        if (this.connectError) {
            return Promise.reject(
                this.connectError
            );
        }

        return Promise.resolve();
    }

    disconnect () {
        this.disconnectCalls += 1;

        return true;
    }

    onDisconnect (listener) {
        this._disconnectListeners
            .push(listener);
    }

    emitDisconnect () {
        for (
            const listener of
                this._disconnectListeners
        ) {
            listener();
        }
    }
}

const createSession =
    () => {
        const hardwareServiceClient =
            new FakeHardwareServiceClient();

        const connection =
            new FakeConnection();

        const session =
            new EasyBloxControllerDesktopSession({
                hardwareServiceClient,
                connection
            });

        return {
            connection,
            hardwareServiceClient,
            session
        };
    };

describe(
    'EasyBloxControllerDesktopSession',
    () => {
        test('starts disconnected without exposing technical device information', () => {
            const {
                session
            } = createSession();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                errorCode:
                    null
            });
        });

        test('discovers and connects the only available Bluetooth device automatically', async () => {
            const {
                connection,
                hardwareServiceClient,
                session
            } = createSession();

            hardwareServiceClient.devices = [
                {
                    id:
                        'COM12',
                    label:
                        'Controle da Sala'
                }
            ];

            const states = [];

            session.onStateChange(
                state => {
                    states.push(
                        state.status
                    );
                }
            );

            await session.connect();

            expect(
                hardwareServiceClient
                    .listCalls
            ).toBe(1);

            expect(
                connection.connectCalls
            ).toEqual([
                {
                    deviceId:
                        'COM12'
                }
            ]);

            expect(states)
                .toEqual([
                    'discovering',
                    'connecting',
                    'connected'
                ]);

            expect(
                session.getState()
            ).toEqual({
                status:
                    'connected',
                devices: [],
                errorCode:
                    null
            });
        });

        test('exposes only friendly opaque choices when more than one Bluetooth device is found', async () => {
            const {
                connection,
                hardwareServiceClient,
                session
            } = createSession();

            hardwareServiceClient.devices = [
                {
                    id:
                        'COM12',
                    label:
                        'Controle A'
                },
                {
                    id:
                        'COM15',
                    label:
                        'Controle B'
                }
            ];

            await session.connect();

            expect(
                connection.connectCalls
            ).toEqual([]);

            expect(
                session.getState()
            ).toEqual({
                status:
                    'selecting',
                devices: [
                    {
                        key:
                            'device-1',
                        label:
                            'Controle A'
                    },
                    {
                        key:
                            'device-2',
                        label:
                            'Controle B'
                    }
                ],
                errorCode:
                    null
            });

            expect(
                JSON.stringify(
                    session.getState()
                )
            ).not.toMatch(
                /COM\d+/i
            );

            await session.selectDevice(
                'device-2'
            );

            expect(
                connection.connectCalls
            ).toEqual([
                {
                    deviceId:
                        'COM15'
                }
            ]);

            expect(
                session.getState()
                    .status
            ).toBe(
                'connected'
            );
        });

        test('reports that no compatible Bluetooth device was found without attempting a connection', async () => {
            const {
                connection,
                session
            } = createSession();

            await session.connect();

            expect(
                connection.connectCalls
            ).toEqual([]);

            expect(
                session.getState()
            ).toEqual({
                status:
                    'no-devices',
                devices: [],
                errorCode:
                    null
            });
        });

        test('converts Bluetooth discovery failures into a pedagogical session state', async () => {
            const {
                hardwareServiceClient,
                session
            } = createSession();

            hardwareServiceClient.error =
                new Error(
                    'native discovery details'
                );

            await session.connect();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'error',
                devices: [],
                errorCode:
                    'discovery-failed'
            });

            expect(
                JSON.stringify(
                    session.getState()
                )
            ).not.toContain(
                'native discovery details'
            );
        });

        test('converts Bluetooth connection failures into a pedagogical session state', async () => {
            const {
                connection,
                hardwareServiceClient,
                session
            } = createSession();

            hardwareServiceClient.devices = [
                {
                    id:
                        'COM12',
                    label:
                        'Controle'
                }
            ];

            connection.connectError =
                new Error(
                    'WebSocket COM12 failed'
                );

            await session.connect();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'error',
                devices: [],
                errorCode:
                    'connection-failed'
            });

            expect(
                JSON.stringify(
                    session.getState()
                )
            ).not.toMatch(
                /COM12|WebSocket/i
            );
        });

        test('does not report connection-lost when a late disconnect follows a failed connection attempt', async () => {
            const {
                connection,
                hardwareServiceClient,
                session
            } = createSession();

            hardwareServiceClient.devices = [
                {
                    id:
                        'COM12',
                    label:
                        'Controle'
                }
            ];

            connection.connectError =
                new Error(
                    'native connection failure'
                );

            await session.connect();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'error',
                devices: [],
                errorCode:
                    'connection-failed'
            });

            connection.emitDisconnect();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'error',
                devices: [],
                errorCode:
                    'connection-failed'
            });
        });

        test('disconnects explicitly and reports an unexpected physical connection loss separately', async () => {
            const {
                connection,
                hardwareServiceClient,
                session
            } = createSession();

            hardwareServiceClient.devices = [
                {
                    id:
                        'COM12',
                    label:
                        'Controle'
                }
            ];

            await session.connect();

            expect(
                session.disconnect()
            ).toBe(true);

            expect(
                connection.disconnectCalls
            ).toBe(1);

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                errorCode:
                    null
            });

            await session.connect();

            connection.emitDisconnect();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                errorCode:
                    'connection-lost'
            });
        });

        test('supports removing a session state listener', async () => {
            const {
                session
            } = createSession();

            const listener =
                jest.fn();

            const unsubscribe =
                session.onStateChange(
                    listener
                );

            expect(
                typeof unsubscribe
            ).toBe(
                'function'
            );

            unsubscribe();

            await session.connect();

            expect(listener)
                .not.toHaveBeenCalled();
        });
    }
);
