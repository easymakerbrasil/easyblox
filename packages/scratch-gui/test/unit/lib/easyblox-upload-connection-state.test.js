import {
    resolveUploadConnectionState,
    shouldIgnorePeripheralDisconnected
} from '../../../src/lib/easyblox-upload-connection-state';

describe(
    'EasyBlox Upload connection state',
    () => {
        test('keeps the board connected while compilation does not need the serial port', () => {
            expect(
                resolveUploadConnectionState(
                    'connected',
                    {
                        state: 'building'
                    }
                )
            ).toBe('connected');
        });

        test('uses a dedicated working state during serial handoff and upload', () => {
            expect(
                resolveUploadConnectionState(
                    'connected',
                    {
                        state: 'preparing'
                    }
                )
            ).toBe('uploading');

            expect(
                resolveUploadConnectionState(
                    'uploading',
                    {
                        state: 'uploading'
                    }
                )
            ).toBe('uploading');
        });

        test('returns to connected after a successful physical upload', () => {
            expect(
                resolveUploadConnectionState(
                    'uploading',
                    {
                        state: 'success'
                    }
                )
            ).toBe('connected');
        });

        test('does not report a compiler or local-service problem as a physical disconnection', () => {
            expect(
                resolveUploadConnectionState(
                    'connected',
                    {
                        state: 'error',
                        code: 'BUILD_FAILED'
                    }
                )
            ).toBe('connected');

            expect(
                resolveUploadConnectionState(
                    'connected',
                    {
                        state: 'error',
                        code:
                            'HARDWARE_SERVICE_UNAVAILABLE'
                    }
                )
            ).toBe('connected');
        });

        test('reports errors that really invalidate physical availability', () => {
            expect(
                resolveUploadConnectionState(
                    'uploading',
                    {
                        state: 'error',
                        code: 'PORT_NOT_FOUND'
                    }
                )
            ).toBe('error');

            expect(
                resolveUploadConnectionState(
                    'uploading',
                    {
                        state: 'error',
                        code:
                            'BOARD_NOT_RESPONDING'
                    }
                )
            ).toBe('error');
        });

        test('ignores the Web Serial disconnect while Upload owns the serial handoff, even if the event arrives late', () => {
            expect(
                shouldIgnorePeripheralDisconnected(
                    'building',
                    false
                )
            ).toBe(false);

            expect(
                shouldIgnorePeripheralDisconnected(
                    'preparing',
                    true
                )
            ).toBe(true);

            expect(
                shouldIgnorePeripheralDisconnected(
                    'uploading',
                    true
                )
            ).toBe(true);

            expect(
                shouldIgnorePeripheralDisconnected(
                    'success',
                    true
                )
            ).toBe(true);

            expect(
                shouldIgnorePeripheralDisconnected(
                    'success',
                    false
                )
            ).toBe(false);
        });
    });
