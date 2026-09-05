import EasyBloxControllerDesktopTransport
    from '../../../src/lib/easyblox-controller-desktop-transport';

class FakeWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    static instances = [];

    constructor (url, protocol) {
        this.url = url;
        this.requestedProtocol = protocol;
        this.binaryType = 'blob';
        this.readyState =
            FakeWebSocket.CONNECTING;
        this.sent = [];
        this._listeners = new Map();

        FakeWebSocket.instances.push(
            this
        );
    }

    addEventListener (
        type,
        listener
    ) {
        if (!this._listeners.has(type)) {
            this._listeners.set(
                type,
                []
            );
        }

        this._listeners
            .get(type)
            .push(listener);
    }

    removeEventListener (
        type,
        listener
    ) {
        if (!this._listeners.has(type)) {
            return;
        }

        const listeners =
            this._listeners.get(type);

        const index =
            listeners.indexOf(listener);

        if (index >= 0) {
            listeners.splice(
                index,
                1
            );
        }
    }

    send (bytes) {
        this.sent.push(
            new Uint8Array(bytes)
        );
    }

    close () {
        this.readyState =
            FakeWebSocket.CLOSING;

        this.emitClose(
            1000,
            ''
        );
    }

    emitOpen () {
        this.readyState =
            FakeWebSocket.OPEN;

        this._emit(
            'open',
            {}
        );
    }

    emitMessage (bytes) {
        const payload =
            new Uint8Array(bytes);

        this._emit(
            'message',
            {
                data:
                    payload.buffer.slice(
                        payload.byteOffset,
                        payload.byteOffset +
                            payload.byteLength
                    )
            }
        );
    }

    emitError () {
        this._emit(
            'error',
            {}
        );
    }

    emitClose (
        code = 1006,
        reason = ''
    ) {
        this.readyState =
            FakeWebSocket.CLOSED;

        this._emit(
            'close',
            {
                code,
                reason
            }
        );
    }

    _emit (
        type,
        event
    ) {
        const listeners =
            this._listeners.get(type) ||
            [];

        for (
            const listener of
                [...listeners]
        ) {
            listener(event);
        }
    }
}

describe(
    'EasyBloxControllerDesktopTransport',
    () => {
        beforeEach(() => {
            FakeWebSocket.instances = [];
        });

        test('opens the canonical Controller WebSocket using the hidden device id', async () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            const connecting =
                transport.connect({
                    deviceId:
                        'COM12'
                });

            expect(
                FakeWebSocket.instances
            ).toHaveLength(1);

            const socket =
                FakeWebSocket.instances[0];

            expect(socket.url)
                .toBe(
                    'ws://127.0.0.1:8602/v1/bluetooth?deviceId=COM12'
                );

            expect(
                socket.requestedProtocol
            ).toBe(
                'easyblox-controller-v1'
            );

            expect(
                socket.binaryType
            ).toBe(
                'arraybuffer'
            );

            expect(
                transport.getState()
            ).toBe(
                'connecting'
            );

            socket.emitOpen();

            await connecting;

            expect(
                transport.getState()
            ).toBe(
                'connected'
            );
        });

        test('encodes the internal device id without exposing it as protocol data', async () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            const connecting =
                transport.connect({
                    deviceId:
                        'COM 12'
                });

            const socket =
                FakeWebSocket.instances[0];

            expect(socket.url)
                .toBe(
                    'ws://127.0.0.1:8602/v1/bluetooth?deviceId=COM%2012'
                );

            socket.emitOpen();

            await connecting;
        });

        test('writes raw binary bytes without knowing EBCP', async () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            const connecting =
                transport.connect({
                    deviceId:
                        'COM12'
                });

            const socket =
                FakeWebSocket.instances[0];

            socket.emitOpen();

            await connecting;

            transport.write(
                new Uint8Array([
                    0x45,
                    0x42,
                    0x01
                ])
            );

            expect(socket.sent)
                .toEqual([
                    new Uint8Array([
                        0x45,
                        0x42,
                        0x01
                    ])
                ]);
        });

        test('forwards incoming WebSocket bytes without interpreting them', async () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            const received = [];

            transport.onData(bytes => {
                received.push(bytes);
            });

            const connecting =
                transport.connect({
                    deviceId:
                        'COM12'
                });

            const socket =
                FakeWebSocket.instances[0];

            socket.emitOpen();

            await connecting;

            socket.emitMessage([
                0x10,
                0x20,
                0x30
            ]);

            expect(received)
                .toEqual([
                    new Uint8Array([
                        0x10,
                        0x20,
                        0x30
                    ])
                ]);
        });

        test('rejects connection when the WebSocket fails before opening', async () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            const connecting =
                transport.connect({
                    deviceId:
                        'COM12'
                });

            FakeWebSocket
                .instances[0]
                .emitError();

            await expect(connecting)
                .rejects
                .toThrow(
                    'Controller Bluetooth connection failed'
                );

            expect(
                transport.getState()
            ).toBe(
                'disconnected'
            );
        });

        test('notifies an unexpected WebSocket disconnect', async () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            const disconnects = [];

            transport.onDisconnect(() => {
                disconnects.push(
                    'disconnected'
                );
            });

            const connecting =
                transport.connect({
                    deviceId:
                        'COM12'
                });

            const socket =
                FakeWebSocket.instances[0];

            socket.emitOpen();

            await connecting;

            socket.emitClose(
                1011,
                'Bluetooth connection lost'
            );

            expect(
                transport.getState()
            ).toBe(
                'disconnected'
            );

            expect(disconnects)
                .toEqual([
                    'disconnected'
                ]);
        });

        test('disconnects intentionally without reporting a physical loss', async () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            const disconnects = [];

            transport.onDisconnect(() => {
                disconnects.push(
                    'unexpected'
                );
            });

            const connecting =
                transport.connect({
                    deviceId:
                        'COM12'
                });

            const socket =
                FakeWebSocket.instances[0];

            socket.emitOpen();

            await connecting;

            expect(
                transport.disconnect()
            ).toBe(true);

            expect(
                transport.getState()
            ).toBe(
                'disconnected'
            );

            expect(disconnects)
                .toEqual([]);

            expect(
                transport.disconnect()
            ).toBe(false);
        });

        test('rejects an invalid internal device id before opening a socket', () => {
            const transport =
                new EasyBloxControllerDesktopTransport({
                    WebSocketClass:
                        FakeWebSocket
                });

            expect(
                () =>
                    transport.connect({
                        deviceId:
                            ''
                    })
            ).toThrow(
                'Controller Bluetooth deviceId must be a non-empty string'
            );

            expect(
                FakeWebSocket.instances
            ).toHaveLength(0);
        });
    }
);
