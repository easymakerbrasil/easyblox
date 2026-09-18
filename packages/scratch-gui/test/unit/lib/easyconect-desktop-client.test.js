import EasyConectDesktopClient
    from '../../../src/lib/easyconect-desktop-client';

class FakeHardwareServiceClient {
    constructor (response = {
        devices: []
    }) {
        this.response = response;
        this.listCalls = 0;
    }

    listBluetoothDevices () {
        this.listCalls += 1;

        return Promise.resolve(
            this.response
        );
    }
}

class FakeTransport {
    constructor () {
        this.dataListeners = [];
        this.errorListeners = [];
        this.disconnectListeners = [];
    }

    connect () {
        return Promise.resolve();
    }

    disconnect () {
        return Promise.resolve(true);
    }

    write () {
        return Promise.resolve();
    }

    onData (listener) {
        this.dataListeners.push(
            listener
        );
    }

    onError (listener) {
        this.errorListeners.push(
            listener
        );
    }

    onDisconnect (listener) {
        this.disconnectListeners.push(
            listener
        );
    }
}

class FakeConnection {
    constructor () {
        this.connectCalls = [];
        this.disconnectCalls = 0;
        this.sendCalls = [];
        this.waitForCalls = [];

        this.stateListeners = [];
        this.errorListeners = [];
        this.disconnectListeners = [];

        this.stateUnsubscribe =
            jest.fn();

        this.errorUnsubscribe =
            jest.fn();

        this.disconnectUnsubscribe =
            jest.fn();
    }

    getState () {
        return 'connected';
    }

    onStateChange (listener) {
        this.stateListeners.push(
            listener
        );

        return this.stateUnsubscribe;
    }

    onError (listener) {
        this.errorListeners.push(
            listener
        );

        return this.errorUnsubscribe;
    }

    onDisconnect (listener) {
        this.disconnectListeners.push(
            listener
        );

        return this.disconnectUnsubscribe;
    }

    connect ({deviceId}) {
        this.connectCalls.push(
            deviceId
        );

        return Promise.resolve();
    }

    disconnect () {
        this.disconnectCalls += 1;

        return Promise.resolve(true);
    }

    send (
        type,
        channel,
        payload
    ) {
        this.sendCalls.push({
            type,
            channel,
            payload
        });

        return Promise.resolve(7);
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

describe(
    'EasyConectDesktopClient',
    () => {
        test('builds the canonical EasyConect connection over a supplied browser transport', () => {
            const client =
                new EasyConectDesktopClient({
                    hardwareServiceClient:
                        new FakeHardwareServiceClient(),
                    transport:
                        new FakeTransport()
                });

            expect(
                client.getState()
            ).toBe(
                'disconnected'
            );
        });

        test('maps Hardware Service Bluetooth discovery to canonical EasyConect devices', async () => {
            const hardwareServiceClient =
                new FakeHardwareServiceClient({
                    devices: [
                        {
                            id:
                                'COM12',
                            label:
                                'EasyMaker-39',
                            port:
                                'COM12',
                            platformMetadata:
                                'must-not-leak'
                        },
                        {
                            id:
                                'COM8',
                            label:
                                'HC-06'
                        }
                    ]
                });

            const client =
                new EasyConectDesktopClient({
                    hardwareServiceClient,
                    connection:
                        new FakeConnection()
                });

            await expect(
                client.listDevices()
            ).resolves.toEqual([
                {
                    deviceId:
                        'COM12',
                    name:
                        'EasyMaker-39'
                },
                {
                    deviceId:
                        'COM8',
                    name:
                        'HC-06'
                }
            ]);

            expect(
                hardwareServiceClient.listCalls
            ).toBe(1);
        });

        test('treats a missing discovery device array as an empty canonical list', async () => {
            const client =
                new EasyConectDesktopClient({
                    hardwareServiceClient:
                        new FakeHardwareServiceClient({
                            status:
                                'ok'
                        }),
                    connection:
                        new FakeConnection()
                });

            await expect(
                client.listDevices()
            ).resolves.toEqual([]);
        });

        test('forwards canonical connection lifecycle without redefining state', () => {
            const connection =
                new FakeConnection();

            const client =
                new EasyConectDesktopClient({
                    hardwareServiceClient:
                        new FakeHardwareServiceClient(),
                    connection
                });

            const stateListener =
                jest.fn();
            const errorListener =
                jest.fn();
            const disconnectListener =
                jest.fn();

            expect(
                client.getState()
            ).toBe(
                'connected'
            );

            expect(
                client.onStateChange(
                    stateListener
                )
            ).toBe(
                connection.stateUnsubscribe
            );

            expect(
                client.onError(
                    errorListener
                )
            ).toBe(
                connection.errorUnsubscribe
            );

            expect(
                client.onDisconnect(
                    disconnectListener
                )
            ).toBe(
                connection.disconnectUnsubscribe
            );

            expect(
                connection.stateListeners
            ).toEqual([
                stateListener
            ]);

            expect(
                connection.errorListeners
            ).toEqual([
                errorListener
            ]);

            expect(
                connection.disconnectListeners
            ).toEqual([
                disconnectListener
            ]);
        });

        test('forwards connect and disconnect to the canonical EasyConect connection', async () => {
            const connection =
                new FakeConnection();

            const client =
                new EasyConectDesktopClient({
                    hardwareServiceClient:
                        new FakeHardwareServiceClient(),
                    connection
                });

            await client.connect({
                deviceId:
                    'COM12'
            });

            expect(
                connection.connectCalls
            ).toEqual([
                'COM12'
            ]);

            await expect(
                client.disconnect()
            ).resolves.toBe(true);

            expect(
                connection.disconnectCalls
            ).toBe(1);
        });

        test('forwards protocol send without interpreting EBCP application data', async () => {
            const connection =
                new FakeConnection();

            const client =
                new EasyConectDesktopClient({
                    hardwareServiceClient:
                        new FakeHardwareServiceClient(),
                    connection
                });

            await expect(
                client.send(
                    0x01,
                    '1',
                    'olá'
                )
            ).resolves.toBe(7);

            expect(
                connection.sendCalls
            ).toEqual([
                {
                    type:
                        0x01,
                    channel:
                        '1',
                    payload:
                        'olá'
                }
            ]);
        });

        test('forwards protocol waitFor without competing for messages itself', async () => {
            const connection =
                new FakeConnection();

            const client =
                new EasyConectDesktopClient({
                    hardwareServiceClient:
                        new FakeHardwareServiceClient(),
                    connection
                });

            await expect(
                client.waitFor(
                    0x02,
                    '1'
                )
            ).resolves.toEqual({
                type:
                    0x02,
                channel:
                    '1',
                payload:
                    'received'
            });

            expect(
                connection.waitForCalls
            ).toEqual([
                {
                    type:
                        0x02,
                    channel:
                        '1'
                }
            ]);
        });
    }
);
