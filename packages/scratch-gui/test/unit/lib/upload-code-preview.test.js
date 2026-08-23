import {
    generateArduinoUnoUploadPreview,
    subscribeToArduinoUnoUploadPreview
} from '../../../src/lib/upload-code-preview';

describe('generateArduinoUnoUploadPreview', () => {
    test('returns generated Arduino UNO C++ from the VM', () => {
        const vm = {
            generateArduinoUnoUploadCode: jest.fn()
                .mockReturnValue('void setup() {}')
        };

        const result = generateArduinoUnoUploadPreview(vm);

        expect(
            vm.generateArduinoUnoUploadCode
        ).toHaveBeenCalledTimes(1);

        expect(result).toEqual({
            code: 'void setup() {}',
            error: null
        });
    });

    test('returns the validation error without generated code', () => {
        const vm = {
            generateArduinoUnoUploadCode: jest.fn(() => {
                throw new Error('Upload validation failed');
            })
        };

        const result = generateArduinoUnoUploadPreview(vm);

        expect(result).toEqual({
            code: '',
            error: 'Upload validation failed'
        });
    });

    test('updates the preview immediately and when the project changes', () => {
        const listeners = {};
        const vm = {
            generateArduinoUnoUploadCode: jest.fn()
                .mockReturnValueOnce('void setup() {}')
                .mockReturnValueOnce('void setup() { digitalWrite(13, HIGH); }'),
            on: jest.fn((event, handler) => {
                listeners[event] = handler;
            }),
            removeListener: jest.fn()
        };
        const onPreview = jest.fn();

        const unsubscribe = subscribeToArduinoUnoUploadPreview(
            vm,
            onPreview
        );

        expect(onPreview).toHaveBeenCalledWith({
            code: 'void setup() {}',
            error: null
        });

        expect(vm.on).toHaveBeenCalledWith(
            'PROJECT_CHANGED',
            expect.any(Function)
        );

        listeners.PROJECT_CHANGED();

        expect(onPreview).toHaveBeenLastCalledWith({
            code: 'void setup() { digitalWrite(13, HIGH); }',
            error: null
        });

        unsubscribe();
    });

    test('removes the project change listener when preview subscription ends', () => {
        const vm = {
            generateArduinoUnoUploadCode: jest.fn()
                .mockReturnValue('void setup() {}'),
            on: jest.fn(),
            removeListener: jest.fn()
        };

        const unsubscribe = subscribeToArduinoUnoUploadPreview(
            vm,
            jest.fn()
        );

        const projectChangedHandler = vm.on.mock.calls.find(
            call => call[0] === 'PROJECT_CHANGED'
        )[1];

        unsubscribe();

        expect(vm.removeListener).toHaveBeenCalledWith(
            'PROJECT_CHANGED',
            projectChangedHandler
        );
    });
});
