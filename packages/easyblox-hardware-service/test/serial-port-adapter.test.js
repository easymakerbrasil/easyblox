const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');

const SerialPortAdapter =
    require('../src/serial-port-adapter');

class FakeSerialPort extends EventEmitter {
    static listedPorts = [];

    static createdOptions = [];

    static async list () {
        return FakeSerialPort.listedPorts.map(port => ({
            ...port
        }));
    }

    constructor (options) {
        super();

        FakeSerialPort.createdOptions.push({
            ...options
        });

        this.path = options.path;
        this.baudRate = options.baudRate;
    }
}

test('Serial Port Adapter lists available ports with a best-effort friendly label', async () => {
    FakeSerialPort.listedPorts = [
        {
            path: 'COM11',
            friendlyName: 'Arduino Uno',
            manufacturer: 'Arduino LLC'
        },
        {
            path: 'COM12',
            friendlyName: 'Serial Padrão por link Bluetooth',
            pnpId: 'BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}'
        },
        {
            path: 'COM13',
            manufacturer: 'Generic Serial'
        },
        {
            path: 'COM14'
        }
    ];

    const adapter =
        new SerialPortAdapter({
            SerialPortClass: FakeSerialPort
        });

    assert.deepEqual(
        await adapter.list(),
        [
            {
                path: 'COM11',
                label: 'Arduino Uno'
            },
            {
                path: 'COM12',
                label: 'Serial Padrão por link Bluetooth',
                pnpId: 'BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}'
            },
            {
                path: 'COM13',
                label: 'Generic Serial'
            },
            {
                path: 'COM14',
                label: 'COM14'
            }
        ]
    );
});

test('Serial Port Adapter creates a closed 8N1 serial port with the requested path and baud rate', () => {
    FakeSerialPort.createdOptions = [];

    const adapter =
        new SerialPortAdapter({
            SerialPortClass: FakeSerialPort
        });

    const port =
        adapter.createPort({
            path: 'COM12',
            baudRate: 9600
        });

    assert.equal(
        port.path,
        'COM12'
    );

    assert.equal(
        port.baudRate,
        9600
    );

    assert.deepEqual(
        FakeSerialPort.createdOptions,
        [{
            path: 'COM12',
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            autoOpen: false
        }]
    );
});

test('Serial Port Adapter rejects invalid creation options before reaching the native library', () => {
    FakeSerialPort.createdOptions = [];

    const adapter =
        new SerialPortAdapter({
            SerialPortClass: FakeSerialPort
        });

    assert.throws(
        () => adapter.createPort({
            path: '',
            baudRate: 9600
        }),
        /serial port path must be a non-empty string/i
    );

    assert.throws(
        () => adapter.createPort({
            path: 'COM12',
            baudRate: 0
        }),
        /serial port baud rate must be a positive integer/i
    );

    assert.deepEqual(
        FakeSerialPort.createdOptions,
        []
    );
});
