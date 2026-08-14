import WebSerialTransport from '../../../src/lib/serial/web-serial-transport';

describe('WebSerialTransport', () => {
    let originalSerial;

    beforeEach(() => {
        originalSerial = navigator.serial;
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'serial', {
            configurable: true,
            value: originalSerial
        });
    });

    const setSerialApi = serial => {
        Object.defineProperty(navigator, 'serial', {
            configurable: true,
            value: serial
        });
    };

    test('returns selected Web Serial port metadata', async () => {
        const port = {
            getInfo: () => ({
                usbVendorId: 0x2341,
                usbProductId: 0x0043
            })
        };

        setSerialApi({
            addEventListener: jest.fn(),
            requestPort: jest.fn().mockResolvedValue(port)
        });

        const transport = new WebSerialTransport();
        const peripheral = await transport.requestPort();

        expect(peripheral).toEqual({
            peripheralId: 'web-serial-1',
            name: 'USB Serial (2341:0043)'
        });
    });

    test('keeps a stable peripheral id for the same port', async () => {
        const port = {
            getInfo: () => ({})
        };

        const requestPort = jest.fn().mockResolvedValue(port);

        setSerialApi({
            addEventListener: jest.fn(),
            requestPort
        });

        const transport = new WebSerialTransport();

        const first = await transport.requestPort();
        const second = await transport.requestPort();

        expect(first.peripheralId).toBe('web-serial-1');
        expect(second.peripheralId).toBe('web-serial-1');
    });

    test('returns null when the user cancels the browser picker', async () => {
        const error = new Error('No port selected');
        error.name = 'NotFoundError';

        setSerialApi({
            addEventListener: jest.fn(),
            requestPort: jest.fn().mockRejectedValue(error)
        });

        const transport = new WebSerialTransport();

        await expect(transport.requestPort()).resolves.toBeNull();
    });

    test('reports Web Serial as unavailable when navigator.serial is absent', async () => {
        setSerialApi(null);

        const transport = new WebSerialTransport();

        await expect(transport.requestPort()).rejects.toThrow(
            'Web Serial is unavailable'
        );
    });

    test('registers for physical disconnect events', () => {
        const addEventListener = jest.fn();

        setSerialApi({
            addEventListener
        });

        const transport = new WebSerialTransport();

        expect(transport).toBeInstanceOf(WebSerialTransport);

        expect(addEventListener).toHaveBeenCalledWith(
            'disconnect',
            expect.any(Function)
        );
    });

            test('opens, writes and closes a selected serial port', async () => {
        let resolveRead;

        const reader = {
            read: jest.fn(() => new Promise(resolve => {
                resolveRead = resolve;
            })),
            cancel: jest.fn(() => {
                resolveRead({done: true});
                return Promise.resolve();
            }),
            releaseLock: jest.fn()
        };

        const writer = {
            write: jest.fn().mockResolvedValue(),
            releaseLock: jest.fn()
        };

        const port = {
            getInfo: () => ({
                usbVendorId: 0x2341,
                usbProductId: 0x0043
            }),
            open: jest.fn().mockResolvedValue(),
            close: jest.fn().mockResolvedValue(),
            readable: {
                getReader: jest.fn(() => reader)
            },
            writable: {
                getWriter: jest.fn(() => writer)
            }
        };

        setSerialApi({
            addEventListener: jest.fn(),
            requestPort: jest.fn().mockResolvedValue(port)
        });

        const transport = new WebSerialTransport();
        const peripheral = await transport.requestPort();

        await transport.open(peripheral.peripheralId, {
            baudRate: 115200
        });

        expect(port.open).toHaveBeenCalledWith({
            baudRate: 115200
        });

        const bytes = new Uint8Array([0xFF, 0x55, 0x01]);

        await transport.write(bytes);

        expect(writer.write).toHaveBeenCalledWith(bytes);
        expect(writer.releaseLock).toHaveBeenCalled();

        await transport.close();

        expect(reader.cancel).toHaveBeenCalled();
        expect(reader.releaseLock).toHaveBeenCalled();
        expect(port.close).toHaveBeenCalled();
    });

    test('forwards received Uint8Array data', async () => {
        let readCount = 0;

        const bytes = new Uint8Array([0xFF, 0x55, 0x02]);

        const reader = {
            read: jest.fn(() => {
                readCount++;

                if (readCount === 1) {
                    return Promise.resolve({
                        value: bytes,
                        done: false
                    });
                }

                return Promise.resolve({
                    done: true
                });
            }),
            releaseLock: jest.fn()
        };

        const port = {
            getInfo: () => ({}),
            open: jest.fn().mockResolvedValue(),
            readable: {
                getReader: jest.fn(() => reader)
            }
        };

        setSerialApi({
            addEventListener: jest.fn(),
            requestPort: jest.fn().mockResolvedValue(port)
        });

        const onData = jest.fn();

        const transport = new WebSerialTransport();
        transport.setOnData(onData);

        const peripheral = await transport.requestPort();

        await transport.open(peripheral.peripheralId, {
            baudRate: 115200
        });

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(onData).toHaveBeenCalledWith(bytes);
    });
});
