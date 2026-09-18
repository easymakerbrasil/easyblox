import EasyConectDesktopSession
    from '../../../src/lib/easyconect-desktop-session';

class FakeEasyConectDesktopClient {
    constructor () {
        this.devices = [];
        this.listError = null;
        this.connectError = null;
        this.disconnectResult = true;

        this.listCalls = 0;
        this.connectCalls = [];
        this.disconnectCalls = 0;

        this._disconnectListeners = [];
    }

    listDevices () {
        this.listCalls += 1;

        if (this.listError) {
            return Promise.reject(
                this.listError
            );
        }

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

        if (this.connectError) {
            return Promise.reject(
                this.connectError
            );
        }

        return Promise.resolve();
    }

    disconnect () {
        this.disconnectCalls += 1;

        return Promise.resolve(
            this.disconnectResult
        );
    }

    onDisconnect (listener) {
        this._disconnectListeners.push(
            listener
        );

        return () => {
            this._disconnectListeners =
                this._disconnectListeners
                    .filter(
                        current =>
                            current !==
                            listener
                    );
        };
    }

    send () {
        return Promise.resolve();
    }

    waitFor () {
        return new Promise(
            () => {}
        );
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

class PendingDiscoveryClient extends FakeEasyConectDesktopClient {
    constructor () {
        super();

        this._resolveList =
            null;
    }

    listDevices () {
        this.listCalls += 1;

        return new Promise(
            resolve => {
                this._resolveList =
                    resolve;
            }
        );
    }

    resolveList () {
        if (!this._resolveList) {
            throw new Error(
                'No pending EasyConect discovery'
            );
        }

        const resolve =
            this._resolveList;

        this._resolveList =
            null;

        resolve(
            this.devices
        );
    }
}

class PendingConnectClient extends FakeEasyConectDesktopClient {
    constructor () {
        super();

        this.connected =
            false;

        this._resolveConnect =
            null;
    }

    connect ({
        deviceId
    }) {
        this.connectCalls.push({
            deviceId
        });

        return new Promise(
            resolve => {
                this._resolveConnect =
                    () => {
                        this.connected =
                            true;

                        resolve();
                    };
            }
        );
    }

    resolveConnect () {
        if (!this._resolveConnect) {
            throw new Error(
                'No pending EasyConect connection'
            );
        }

        const resolve =
            this._resolveConnect;

        this._resolveConnect =
            null;

        resolve();
    }

    disconnect () {
        this.disconnectCalls += 1;

        if (!this.connected) {
            return Promise.resolve(
                false
            );
        }

        this.connected =
            false;

        return Promise.resolve(
            true
        );
    }
}

class FakeTerminalSession {
    constructor () {
        this.waitForTextCalls = 0;
        this.waitForNumberCalls = 0;

        this._textResolvers = [];
        this._numberResolvers = [];
    }

    getHistory () {
        return Object.freeze([]);
    }

    waitForText () {
        this.waitForTextCalls += 1;

        return new Promise(
            resolve => {
                this._textResolvers.push(
                    resolve
                );
            }
        );
    }

    waitForNumber () {
        this.waitForNumberCalls += 1;

        return new Promise(
            resolve => {
                this._numberResolvers.push(
                    resolve
                );
            }
        );
    }

    resolveNextText (payload) {
        const resolve =
            this._textResolvers.shift();

        if (resolve) {
            resolve(
                payload
            );
        }
    }

    resolveNextNumber (payload) {
        const resolve =
            this._numberResolvers.shift();

        if (resolve) {
            resolve(
                payload
            );
        }
    }
}

const flushPromises =
    async function () {
        await Promise.resolve();
        await Promise.resolve();
    };

const createSession =
    () => {
        const client =
            new FakeEasyConectDesktopClient();

        const terminalSessions = [];
        const terminalConnections = [];

        const terminalSessionFactory =
            connection => {
                terminalConnections.push(
                    connection
                );

                const terminal =
                    new FakeTerminalSession();

                terminalSessions.push(
                    terminal
                );

                return terminal;
            };

        const session =
            new EasyConectDesktopSession({
                client,
                terminalSessionFactory
            });

        return {
            client,
            session,
            terminalConnections,
            terminalSessions
        };
    };

describe(
    'EasyConectDesktopSession',
    () => {
        test('starts disconnected without a Terminal session', () => {
            const {
                session
            } = createSession();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    null
            });

            expect(
                session.getTerminalSession()
            ).toBeNull();
        });

        test('ignores a discovery result that resolves after explicit disconnect', async () => {
            const client =
                new PendingDiscoveryClient();

            const terminalSessions = [];

            const session =
                new EasyConectDesktopSession({
                    client,
                    terminalSessionFactory:
                        () => {
                            const terminalSession =
                                new FakeTerminalSession();

                            terminalSessions.push(
                                terminalSession
                            );

                            return terminalSession;
                        }
                });

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            const connecting =
                session.connect();

            await flushPromises();

            expect(
                session.getState()
                    .status
            ).toBe(
                'discovering'
            );

            expect(
                client.listCalls
            ).toBe(
                1
            );

            const disconnecting =
                session.disconnect();

            expect(
                await disconnecting
            ).toBe(
                true
            );

            expect(
                session.getState()
                    .status
            ).toBe(
                'disconnected'
            );

            client.resolveList();

            expect(
                await connecting
            ).toBe(
                false
            );

            expect(
                client.connectCalls
            ).toEqual([]);

            expect(
                terminalSessions
            ).toHaveLength(
                0
            );

            expect(
                session.getTerminalSession()
            ).toBeNull();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    null
            });
        });

        test('discovers and connects a single canonical EasyConect device automatically', async () => {
            const {
                client,
                session,
                terminalConnections,
                terminalSessions
            } = createSession();

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            const statuses = [];

            session.onStateChange(
                state => {
                    statuses.push(
                        state.status
                    );
                }
            );

            expect(
                await session.connect()
            ).toBe(
                true
            );

            expect(
                client.listCalls
            ).toBe(
                1
            );

            expect(
                client.connectCalls
            ).toEqual([
                {
                    deviceId:
                        'COM10'
                }
            ]);

            expect(
                statuses
            ).toEqual([
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
                connectedDeviceName:
                    'EasyMaker-39',
                errorCode:
                    null
            });

            expect(
                JSON.stringify(
                    session.getState()
                )
            ).not.toContain(
                'COM10'
            );

            expect(
                terminalSessions
            ).toHaveLength(
                1
            );

            expect(
                terminalConnections
            ).toEqual([
                client
            ]);

            expect(
                session.getTerminalSession()
            ).toBe(
                terminalSessions[0]
            );

            expect(
                terminalSessions[0]
                    .waitForTextCalls
            ).toBe(
                1
            );

            expect(
                terminalSessions[0]
                    .waitForNumberCalls
            ).toBe(
                1
            );
        });

        test('exposes friendly choices when multiple devices are discovered', async () => {
            const {
                client,
                session
            } = createSession();

            client.devices = [
                {
                    deviceId:
                        'COM4',
                    name:
                        'EasyMaker-5'
                },
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            expect(
                await session.connect()
            ).toBe(
                false
            );

            expect(
                client.connectCalls
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
                            'EasyMaker-5'
                    },
                    {
                        key:
                            'device-2',
                        label:
                            'EasyMaker-39'
                    }
                ],
                connectedDeviceName:
                    null,
                errorCode:
                    null
            });

            expect(
                JSON.stringify(
                    session.getState()
                )
            ).not.toMatch(
                /COM4|COM10/
            );

            expect(
                await session.selectDevice(
                    'device-2'
                )
            ).toBe(
                true
            );

            expect(
                client.connectCalls
            ).toEqual([
                {
                    deviceId:
                        'COM10'
                }
            ]);

            expect(
                session.getState()
                    .connectedDeviceName
            ).toBe(
                'EasyMaker-39'
            );
        });

        test('reports no compatible devices without attempting a connection', async () => {
            const {
                client,
                session
            } = createSession();

            expect(
                await session.connect()
            ).toBe(
                false
            );

            expect(
                client.connectCalls
            ).toEqual([]);

            expect(
                session.getState()
            ).toEqual({
                status:
                    'no-devices',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    null
            });
        });

        test('converts discovery failures into a semantic public state', async () => {
            const {
                client,
                session
            } = createSession();

            client.listError =
                new Error(
                    'native discovery COM details'
                );

            expect(
                await session.connect()
            ).toBe(
                false
            );

            expect(
                session.getState()
            ).toEqual({
                status:
                    'error',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    'discovery-failed'
            });

            expect(
                JSON.stringify(
                    session.getState()
                )
            ).not.toMatch(
                /native|COM/i
            );
        });

        test('does not create Terminal when the physical connection fails', async () => {
            const {
                client,
                session,
                terminalSessions
            } = createSession();

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            client.connectError =
                new Error(
                    'WebSocket COM10 failed'
                );

            expect(
                await session.connect()
            ).toBe(
                false
            );

            expect(
                terminalSessions
            ).toHaveLength(
                0
            );

            expect(
                session.getTerminalSession()
            ).toBeNull();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'error',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    'connection-failed'
            });

            client.emitDisconnect();

            expect(
                session.getState()
                    .errorCode
            ).toBe(
                'connection-failed'
            );
        });

        test('discards Terminal immediately on explicit disconnect', async () => {
            const {
                client,
                session
            } = createSession();

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            await session.connect();

            expect(
                session.getTerminalSession()
            ).not.toBeNull();

            const disconnect =
                session.disconnect();

            expect(
                session.getTerminalSession()
            ).toBeNull();

            expect(
                session.getState()
                    .status
            ).toBe(
                'disconnecting'
            );

            expect(
                await disconnect
            ).toBe(
                true
            );

            expect(
                client.disconnectCalls
            ).toBe(
                1
            );

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    null
            });
        });

        test('closes a physical connection that finishes after explicit disconnect', async () => {
            const client =
                new PendingConnectClient();

            const terminalSessions = [];

            const session =
                new EasyConectDesktopSession({
                    client,
                    terminalSessionFactory:
                        () => {
                            const terminalSession =
                                new FakeTerminalSession();

                            terminalSessions.push(
                                terminalSession
                            );

                            return terminalSession;
                        }
                });

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            const connecting =
                session.connect();

            await flushPromises();

            expect(
                session.getState()
                    .status
            ).toBe(
                'connecting'
            );

            const disconnecting =
                session.disconnect();

            await flushPromises();

            expect(
                client.disconnectCalls
            ).toBe(
                1
            );

            expect(
                session.getState()
                    .status
            ).toBe(
                'disconnecting'
            );

            client.resolveConnect();

            expect(
                await connecting
            ).toBe(
                false
            );

            expect(
                await disconnecting
            ).toBe(
                true
            );

            expect(
                client.disconnectCalls
            ).toBe(
                2
            );

            expect(
                client.connected
            ).toBe(
                false
            );

            expect(
                terminalSessions
            ).toHaveLength(
                0
            );

            expect(
                session.getTerminalSession()
            ).toBeNull();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    null
            });
        });

        test('discards Terminal and reports an unexpected physical loss', async () => {
            const {
                client,
                session
            } = createSession();

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            await session.connect();

            expect(
                session.getTerminalSession()
            ).not.toBeNull();

            client.emitDisconnect();

            expect(
                session.getTerminalSession()
            ).toBeNull();

            expect(
                session.getState()
            ).toEqual({
                status:
                    'disconnected',
                devices: [],
                connectedDeviceName:
                    null,
                errorCode:
                    'connection-lost'
            });
        });

        test('creates a fresh Terminal after reconnect and stops stale receive loops', async () => {
            const {
                client,
                session,
                terminalSessions
            } = createSession();

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            await session.connect();

            const firstTerminal =
                terminalSessions[0];

            expect(
                firstTerminal
                    .waitForTextCalls
            ).toBe(
                1
            );

            expect(
                firstTerminal
                    .waitForNumberCalls
            ).toBe(
                1
            );

            await session.disconnect();
            await session.connect();

            const secondTerminal =
                terminalSessions[1];

            expect(
                secondTerminal
            ).not.toBe(
                firstTerminal
            );

            expect(
                secondTerminal.getHistory()
            ).toEqual([]);

            firstTerminal.resolveNextText(
                'stale'
            );

            firstTerminal.resolveNextNumber(
                99
            );

            await flushPromises();

            expect(
                firstTerminal
                    .waitForTextCalls
            ).toBe(
                1
            );

            expect(
                firstTerminal
                    .waitForNumberCalls
            ).toBe(
                1
            );

            expect(
                secondTerminal
                    .waitForTextCalls
            ).toBe(
                1
            );

            expect(
                secondTerminal
                    .waitForNumberCalls
            ).toBe(
                1
            );

            expect(
                session.getTerminalSession()
            ).toBe(
                secondTerminal
            );
        });

        test('dispose invalidates pending Terminal receive loops', async () => {
            const {
                client,
                session,
                terminalSessions
            } = createSession();

            client.devices = [
                {
                    deviceId:
                        'COM10',
                    name:
                        'EasyMaker-39'
                }
            ];

            await session.connect();

            const terminal =
                terminalSessions[0];

            expect(
                terminal.waitForTextCalls
            ).toBe(
                1
            );

            expect(
                terminal.waitForNumberCalls
            ).toBe(
                1
            );

            session.dispose();

            expect(
                session.getTerminalSession()
            ).toBeNull();

            terminal.resolveNextText(
                'stale'
            );

            terminal.resolveNextNumber(
                99
            );

            await flushPromises();

            expect(
                terminal.waitForTextCalls
            ).toBe(
                1
            );

            expect(
                terminal.waitForNumberCalls
            ).toBe(
                1
            );
        });

        test('supports removing a state listener', async () => {
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

            expect(
                listener
            ).not.toHaveBeenCalled();
        });
    }
);
