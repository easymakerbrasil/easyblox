import EasyBloxControllerDesktopConnection
    from '../../../src/lib/easyblox-controller-desktop-connection';

const createDeferred = () => {
    let resolve;
    let reject;

    const promise =
        new Promise(
            (resolvePromise, rejectPromise) => {
                resolve = resolvePromise;
                reject = rejectPromise;
            }
        );

    return {
        promise,
        resolve,
        reject
    };
};

let executionOrder = [];

class FakeTransport {
    constructor () {
        this.connectCalls = [];
        this.disconnectCalls = 0;
        this.writes = [];

        this._dataListeners = [];
        this._disconnectListeners = [];
    }

    connect ({deviceId}) {
        executionOrder.push(
            'transport-connect'
        );

        this.connectCalls.push({
            deviceId
        });

        return Promise.resolve();
    }

    disconnect () {
        this.disconnectCalls += 1;

        return true;
    }

    write (bytes) {
        this.writes.push(
            new Uint8Array(bytes)
        );
    }

    onData (listener) {
        this._dataListeners.push(
            listener
        );
    }

    onDisconnect (listener) {
        this._disconnectListeners.push(
            listener
        );
    }

    emitData (bytes) {
        for (
            const listener of
                this._dataListeners
        ) {
            listener(
                new Uint8Array(bytes)
            );
        }
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

class FakeConnectivityClient {
    static instances = [];

    constructor ({write}) {
        this._write = write;
        this._sessionReady =
            createDeferred();

        this.startSessionCalls = 0;
        this.received = [];

        FakeConnectivityClient.instances
            .push(this);
    }

    startSession () {
        executionOrder.push(
            'session-start'
        );

        this.startSessionCalls += 1;

        return this._sessionReady.promise;
    }

    receive (bytes) {
        this.received.push(
            new Uint8Array(bytes)
        );
    }

    resolveSession () {
        this._sessionReady.resolve();
    }

    rejectSession () {
        this._sessionReady.reject(
            new Error(
                'EBCP handshake failed'
            )
        );
    }

    write (bytes) {
        return this._write(
            new Uint8Array(bytes)
        );
    }
}

describe(
    'EasyBloxControllerDesktopConnection',
    () => {
        beforeEach(() => {
            executionOrder = [];
            FakeConnectivityClient.instances = [];
        });

        test('connects the Desktop transport before starting the Controller session', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            expect(
                connection.getState()
            ).toBe(
                'connecting'
            );

            expect(
                executionOrder
            ).toEqual([
                'transport-connect'
            ]);

            await Promise.resolve();

            expect(
                executionOrder
            ).toEqual([
                'transport-connect',
                'session-start'
            ]);

            expect(
                connection.getState()
            ).toBe(
                'connecting'
            );

            FakeConnectivityClient
                .instances[0]
                .resolveSession();

            await connecting;

            expect(
                connection.getState()
            ).toBe(
                'connected'
            );

            expect(
                transport.connectCalls
            ).toEqual([
                {
                    deviceId:
                        'COM12'
                }
            ]);
        });

        test('wires Controller session writes to the Desktop transport', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            await Promise.resolve();

            const client =
                FakeConnectivityClient
                    .instances[0];

            client.resolveSession();

            await connecting;

            client.write([
                0x45,
                0x42,
                0x01
            ]);

            expect(
                transport.writes
            ).toEqual([
                new Uint8Array([
                    0x45,
                    0x42,
                    0x01
                ])
            ]);
        });

        test('forwards incoming Desktop bytes to the Controller session', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            await Promise.resolve();

            const client =
                FakeConnectivityClient
                    .instances[0];

            client.resolveSession();

            await connecting;

            transport.emitData([
                0x10,
                0x20,
                0x30
            ]);

            expect(
                client.received
            ).toEqual([
                new Uint8Array([
                    0x10,
                    0x20,
                    0x30
                ])
            ]);
        });

        test('disconnects cleanly and discards the current Controller session', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            await Promise.resolve();

            FakeConnectivityClient
                .instances[0]
                .resolveSession();

            await connecting;

            expect(
                connection.disconnect()
            ).toBe(true);

            expect(
                transport.disconnectCalls
            ).toBe(1);

            expect(
                connection.getState()
            ).toBe(
                'disconnected'
            );

            expect(
                connection.disconnect()
            ).toBe(false);
        });

        test('disconnects the transport when the Controller handshake fails', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            await Promise.resolve();

            FakeConnectivityClient
                .instances[0]
                .rejectSession();

            await expect(
                connecting
            ).rejects.toThrow(
                'Controller Bluetooth session failed'
            );

            expect(
                transport.disconnectCalls
            ).toBe(1);

            expect(
                connection.getState()
            ).toBe(
                'disconnected'
            );
        });

        test('notifies the UI layer when the Desktop transport disconnects unexpectedly', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const disconnects = [];

            connection.onDisconnect(() => {
                disconnects.push(
                    'disconnected'
                );
            });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            await Promise.resolve();

            FakeConnectivityClient
                .instances[0]
                .resolveSession();

            await connecting;

            transport.emitDisconnect();

            expect(
                connection.getState()
            ).toBe(
                'disconnected'
            );

            expect(disconnects)
                .toEqual([
                    'disconnected'
                ]);
        });

        test('notifies the UI layer of the successful connection state lifecycle', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const states = [];

            connection.onStateChange(state => {
                states.push(state);
            });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            expect(states)
                .toEqual([
                    'connecting'
                ]);

            await Promise.resolve();

            FakeConnectivityClient
                .instances[0]
                .resolveSession();

            await connecting;

            expect(states)
                .toEqual([
                    'connecting',
                    'connected'
                ]);
        });

        test('returns the observable state to disconnected when the Controller handshake fails', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const states = [];

            connection.onStateChange(state => {
                states.push(state);
            });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            await Promise.resolve();

            FakeConnectivityClient
                .instances[0]
                .rejectSession();

            await expect(
                connecting
            ).rejects.toThrow(
                'Controller Bluetooth session failed'
            );

            expect(states)
                .toEqual([
                    'connecting',
                    'disconnected'
                ]);
        });

        test('reports an unexpected Desktop transport loss through the observable state lifecycle', async () => {
            const transport =
                new FakeTransport();

            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport,
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            const states = [];

            connection.onStateChange(state => {
                states.push(state);
            });

            const connecting =
                connection.connect({
                    deviceId:
                        'COM12'
                });

            await Promise.resolve();

            FakeConnectivityClient
                .instances[0]
                .resolveSession();

            await connecting;

            transport.emitDisconnect();

            expect(states)
                .toEqual([
                    'connecting',
                    'connected',
                    'disconnected'
                ]);
        });

        test('validates observable state listeners before registering them', () => {
            const connection =
                new EasyBloxControllerDesktopConnection({
                    transport:
                        new FakeTransport(),
                    ConnectivityClientClass:
                        FakeConnectivityClient
                });

            expect(
                () =>
                    connection.onStateChange(
                        null
                    )
            ).toThrow(
                'Controller Desktop state listener must be a function'
            );
        });
    }
);
