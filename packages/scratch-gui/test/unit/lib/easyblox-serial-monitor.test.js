import {
    startEasyBloxSerialMonitor
} from '../../../src/lib/easyblox-serial-monitor';

describe('EasyBlox Serial Monitor', () => {
    test('connects the uploaded sketch with its semantic baud rate', async () => {
        const states = [];

        const vm = {
            connectPeripheralSerialMonitor:
                jest.fn().mockReturnValue(true)
        };

        const result =
            await startEasyBloxSerialMonitor({
                vm,
                board: {
                    extensionId: 'arduinoUno'
                },
                peripheralId: 'web-serial-1',
                serialConfig: {
                    baudRate: 57600
                },
                reconnectDelay: 0,
                onState: state => {
                    states.push(state);
                }
            });

        expect(
            vm.connectPeripheralSerialMonitor
        ).toHaveBeenCalledWith(
            'arduinoUno',
            'web-serial-1',
            57600
        );

        expect(result).toEqual({
            started: true,
            baudRate: 57600
        });

        expect(states).toContainEqual({
            state: 'connecting',
            baudRate: 57600
        });
    });

    test('does not open Serial Monitor when the Upload program does not initialize Serial', async () => {
        const states = [];

        const vm = {
            connectPeripheralSerialMonitor: jest.fn()
        };

        const result =
            await startEasyBloxSerialMonitor({
                vm,
                board: {
                    extensionId: 'arduinoUno'
                },
                peripheralId: 'web-serial-1',
                serialConfig: null,
                reconnectDelay: 0,
                onState: state => {
                    states.push(state);
                }
            });

        expect(result).toEqual({
            started: false,
            reason: 'serial-not-configured'
        });

        expect(
            vm.connectPeripheralSerialMonitor
        ).not.toHaveBeenCalled();

        expect(states).toContainEqual({
            state: 'unavailable',
            baudRate: null
        });
    });

    test('requires the original Web Serial peripheral id for automatic monitor reconnect', async () => {
        const states = [];

        const vm = {
            connectPeripheralSerialMonitor: jest.fn()
        };

        const result =
            await startEasyBloxSerialMonitor({
                vm,
                board: {
                    extensionId: 'arduinoUno'
                },
                peripheralId: null,
                serialConfig: {
                    baudRate: 9600
                },
                reconnectDelay: 0,
                onState: state => {
                    states.push(state);
                }
            });

        expect(result).toEqual({
            started: false,
            reason: 'peripheral-id-required'
        });

        expect(states).toContainEqual({
            state: 'connection-required',
            baudRate: 9600
        });

        expect(
            vm.connectPeripheralSerialMonitor
        ).not.toHaveBeenCalled();
    });

    test('reports a rejected Serial Monitor connection pedagogically', async () => {
        const states = [];

        const vm = {
            connectPeripheralSerialMonitor:
                jest.fn().mockReturnValue(false)
        };

        const result =
            await startEasyBloxSerialMonitor({
                vm,
                board: {
                    extensionId: 'arduinoUno'
                },
                peripheralId: 'web-serial-1',
                serialConfig: {
                    baudRate: 19200
                },
                reconnectDelay: 0,
                onState: state => {
                    states.push(state);
                }
            });

        expect(result).toEqual({
            started: false,
            reason: 'connection-rejected'
        });

        expect(states).toContainEqual({
            state: 'error',
            baudRate: 19200
        });
    });
});
