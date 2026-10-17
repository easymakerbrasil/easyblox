import {
    MediaInputPreferences,
    MEDIA_INPUT_PREFERENCES_KEY,
    getMediaInputPreferences
} from '../../../src/lib/media-input-preferences';

jest.mock('../../../src/lib/log', () => ({warn: jest.fn(), error: jest.fn()}));

const makeStorage = (value = null) => ({
    getItem: jest.fn(() => value),
    setItem: jest.fn()
});

describe('media input preferences', () => {
    test('defaults to the system devices without writing storage', () => {
        const storage = makeStorage();
        const preferences = new MediaInputPreferences({getStorage: () => storage});
        expect(preferences.getCameraDeviceId()).toBeNull();
        expect(preferences.getMicrophoneDeviceId()).toBeNull();
        expect(preferences.getSnapshot().persistence).toBe('available');
        expect(storage.setItem).not.toHaveBeenCalled();
        expect(getMediaInputPreferences()).toBe(getMediaInputPreferences());
    });

    test('persists only version and preferred input IDs, including unknown IDs', () => {
        const storage = makeStorage();
        const preferences = new MediaInputPreferences({getStorage: () => storage});
        preferences.setPreferredDeviceId('camera', 'unknown-camera');
        preferences.setPreferredDeviceId('microphone', 'mic-2');
        expect(storage.setItem).toHaveBeenLastCalledWith(MEDIA_INPUT_PREFERENCES_KEY, JSON.stringify({
            version: 1, cameraDeviceId: 'unknown-camera', microphoneDeviceId: 'mic-2'
        }));
        const saved = storage.setItem.mock.calls[1][1];
        const restored = new MediaInputPreferences({getStorage: () => makeStorage(saved)});
        expect(restored.getCameraDeviceId()).toBe('unknown-camera');
        expect(restored.getMicrophoneDeviceId()).toBe('mic-2');
        restored.setPreferredDeviceId('camera', null);
        expect(restored.getCameraDeviceId()).toBeNull();
        expect(restored.getMicrophoneDeviceId()).toBe('mic-2');
    });

    const checkInvalidStorage = function (value) {
        const storage = makeStorage(value);
        const preferences = new MediaInputPreferences({getStorage: () => storage});
        expect(preferences.getSnapshot()).toEqual({
            cameraDeviceId: null, microphoneDeviceId: null, persistence: 'invalid'
        });
        expect(storage.setItem).not.toHaveBeenCalled();
    };
    test.each([
        '', '{', 'null', '[]', '{}',
        JSON.stringify({version: 2, cameraDeviceId: 'a', microphoneDeviceId: null}),
        JSON.stringify({version: 1, cameraDeviceId: 3, microphoneDeviceId: null}),
        JSON.stringify({version: 1, cameraDeviceId: '', microphoneDeviceId: null}),
        JSON.stringify({version: 1, cameraDeviceId: null}),
        JSON.stringify({version: 1, cameraDeviceId: null, microphoneDeviceId: null, label: 'not allowed'})
    ])('ignores invalid or unsupported storage without rewriting it: %p', checkInvalidStorage);

    test('keeps in-memory preferences when storage is unavailable and retries later', () => {
        let available = false;
        const storage = makeStorage();
        const preferences = new MediaInputPreferences({getStorage: () => {
            if (!available) throw new Error('Storage access denied');
            return storage;
        }});
        preferences.setPreferredDeviceId('camera', 'camera-1');
        expect(preferences.getSnapshot().persistence).toBe('unavailable');
        expect(preferences.getCameraDeviceId()).toBe('camera-1');
        available = true;
        preferences.setPreferredDeviceId('camera', 'camera-1');
        expect(storage.setItem).toHaveBeenCalledTimes(1);
        expect(preferences.getSnapshot().persistence).toBe('available');
    });

    test('handles read/write failures and a missing storage API', () => {
        const storage = makeStorage();
        storage.getItem.mockImplementation(() => {
            throw new Error('Read failed');
        });
        storage.setItem.mockImplementation(() => {
            throw new Error('Quota exceeded');
        });
        const preferences = new MediaInputPreferences({getStorage: () => storage});
        preferences.setPreferredDeviceId('microphone', 'mic-1');
        expect(preferences.getMicrophoneDeviceId()).toBe('mic-1');
        expect(preferences.getSnapshot().persistence).toBe('unavailable');
        expect(new MediaInputPreferences({getStorage: () => null}).getSnapshot().persistence)
            .toBe('unavailable');
    });

    test('notifies subscribers once per change and supports independent, idempotent unsubscribe', () => {
        const preferences = new MediaInputPreferences({getStorage: () => makeStorage()});
        const listener = jest.fn();
        const stopFirst = preferences.subscribe(listener);
        const stopSecond = preferences.subscribe(listener);
        preferences.setPreferredDeviceId('camera', 'camera-1');
        expect(listener).toHaveBeenCalledTimes(2);
        stopFirst();
        stopFirst();
        preferences.setPreferredDeviceId('camera', 'camera-1');
        expect(listener).toHaveBeenCalledTimes(2);
        preferences.setPreferredDeviceId('camera', null);
        expect(listener).toHaveBeenCalledTimes(3);
        stopSecond();
        preferences.setPreferredDeviceId('microphone', 'mic-1');
        expect(listener).toHaveBeenCalledTimes(3);
        expect(Object.isFrozen(preferences.getSnapshot())).toBe(true);
    });

    test('does not let a failing observer prevent other observers or persistence', () => {
        const storage = makeStorage();
        const preferences = new MediaInputPreferences({getStorage: () => storage});
        preferences.subscribe(() => {
            throw new Error('Observer failure');
        });
        const listener = jest.fn();
        preferences.subscribe(listener);
        expect(() => preferences.setPreferredDeviceId('camera', 'a')).not.toThrow();
        expect(listener).toHaveBeenCalledTimes(1);
        expect(storage.setItem).toHaveBeenCalledTimes(1);
    });

    test('rejects unsupported kinds and invalid IDs without saving them', () => {
        const storage = makeStorage();
        const preferences = new MediaInputPreferences({getStorage: () => storage});
        expect(() => preferences.setPreferredDeviceId('audiooutput', 'speaker')).toThrow();
        for (const id of [void 0, '', ' ', 2, {}]) {
            expect(() => preferences.setPreferredDeviceId('camera', id)).toThrow();
        }
        expect(storage.setItem).not.toHaveBeenCalled();
    });
});
