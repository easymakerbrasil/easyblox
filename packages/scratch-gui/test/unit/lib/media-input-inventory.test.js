/* @jest-environment node */
import MediaInputInventory from '../../../src/lib/media-input-inventory';
import {MediaInputPreferences} from '../../../src/lib/media-input-preferences';
import {requestVideoStream, requestDisableVideo} from '../../../src/lib/video/camera';
import getUserMedia from 'get-user-media-promise';

jest.mock('../../../src/lib/log', () => ({warn: jest.fn(), error: jest.fn()}));
jest.mock('get-user-media-promise', () => jest.fn());

const device = (kind, deviceId, label = deviceId) => ({kind, deviceId, label, groupId: 'not-needed'});
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((accept, fail) => {
        resolve = accept;
        reject = fail;
    });
    return {promise, resolve, reject};
};
const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
};

describe('media input inventory', () => {
    let preferences;
    let mediaDevices;
    let inventory;
    beforeEach(() => {
        preferences = new MediaInputPreferences({getStorage: () => null});
        mediaDevices = {
            enumerateDevices: jest.fn().mockResolvedValue([]),
            getUserMedia: jest.fn(() => {
                throw new Error('Capture is forbidden');
            }),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        inventory = new MediaInputInventory({preferences, getMediaDevices: () => mediaDevices});
    });
    afterEach(() => {
        inventory.dispose();
        expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
    });

    test('is inert at construction and includes a system default option even with an empty list', async () => {
        expect(mediaDevices.enumerateDevices).not.toHaveBeenCalled();
        expect(mediaDevices.addEventListener).not.toHaveBeenCalled();
        expect(inventory.getSnapshot().status).toBe('idle');
        await inventory.refresh();
        expect(inventory.getSnapshot()).toMatchObject({
            status: 'ready',
            devices: {camera: [], microphone: []},
            visibility: {camera: 'limited-or-empty', microphone: 'limited-or-empty'}
        });
        for (const kind of ['camera', 'microphone']) {
            expect(inventory.getOptions(kind)).toEqual([{deviceId: null, label: '', isSystemDefault: true}]);
            expect(inventory.getSelection(kind)).toEqual({
                preferredDeviceId: null,
                availability: 'system-default',
                deviceIdForNextAcquisition: null,
                fallback: false,
                applyWhen: 'next-acquisition'
            });
        }
    });

    test('lists only camera and microphone inputs, without exposing group IDs or output selection', async () => {
        mediaDevices.enumerateDevices.mockResolvedValue([
            device('videoinput', 'cam-1'), device('audioinput', 'mic-1'),
            device('audiooutput', 'speaker'), device('videoinput', 'cam-2'), device('audioinput', 'mic-2')
        ]);
        await inventory.refresh();
        expect(inventory.getOptions('camera').map(({deviceId}) => deviceId)).toEqual([null, 'cam-1', 'cam-2']);
        expect(inventory.getOptions('microphone').map(({deviceId}) => deviceId)).toEqual([null, 'mic-1', 'mic-2']);
        expect(inventory.getSnapshot().devices.camera[0]).toEqual({deviceId: 'cam-1', label: 'cam-1'});
        expect(Object.isFrozen(inventory.getSnapshot().devices.camera[0])).toBe(true);
        expect(() => inventory.getSelection('audiooutput')).toThrow();
    });

    test('does not infer absence or permission grant from an incomplete or fully labelled enumeration', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        mediaDevices.enumerateDevices.mockResolvedValue([device('videoinput', '', '')]);
        await inventory.refresh();
        expect(inventory.getSnapshot().visibility.camera).toBe('limited-or-empty');
        expect(inventory.getOptions('camera')).toHaveLength(1);
        expect(inventory.getSelection('camera')).toMatchObject({
            preferredDeviceId: 'preferred',
            availability: 'unknown',
            deviceIdForNextAcquisition: 'preferred',
            fallback: false
        });
        mediaDevices.enumerateDevices.mockResolvedValue([device('videoinput', 'other', 'Other camera')]);
        await inventory.refresh();
        expect(inventory.getSnapshot().visibility.camera).toBe('not-confirmed-complete');
        expect(inventory.getSelection('camera').availability).toBe('unknown');
    });

    test('represents fallback only for an exact preferred-device NotFoundError, without clearing preference', () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const selection = inventory.getSelection('camera', {
            deviceId: 'preferred', error: {name: 'NotFoundError'}
        });
        expect(selection).toMatchObject({
            preferredDeviceId: 'preferred',
            availability: 'unavailable',
            deviceIdForNextAcquisition: null,
            fallback: true
        });
        expect(preferences.getCameraDeviceId()).toBe('preferred');
        // Failure evidence belongs to one acquisition, not future sessions.
        expect(inventory.getSelection('camera').availability).toBe('unknown');
        for (const errorName of ['NotAllowedError', 'NotReadableError', 'OverconstrainedError', 'SecurityError']) {
            expect(inventory.getSelection('camera', {
                deviceId: 'preferred', error: {name: errorName}
            }).fallback).toBe(false);
        }
        expect(inventory.getSelection('camera', {
            deviceId: 'old-preference', error: {name: 'NotFoundError'}
        }).fallback).toBe(false);
    });

    test('preserves preferences across disconnect/reconnect and never changes an active capture', async () => {
        const track = {stop: jest.fn(), applyConstraints: jest.fn()};
        const stream = {getTracks: () => [track]};
        getUserMedia.mockReset().mockResolvedValue(stream);
        const acquisition = requestVideoStream({deviceId: {exact: 'cam-1'}});
        await acquisition.ready;
        try {
            preferences.setPreferredDeviceId('camera', 'cam-1');
            mediaDevices.enumerateDevices.mockResolvedValue([device('videoinput', 'cam-1')]);
            await inventory.refresh();
            expect(inventory.getSelection('camera').availability).toBe('listed');
            mediaDevices.enumerateDevices.mockResolvedValue([]);
            await inventory.refresh();
            expect(inventory.getSelection('camera').availability).toBe('unknown');
            expect(preferences.getCameraDeviceId()).toBe('cam-1');
            mediaDevices.enumerateDevices.mockResolvedValue([device('videoinput', 'cam-1')]);
            await inventory.refresh();
            expect(inventory.getSelection('camera').availability).toBe('listed');
            preferences.setPreferredDeviceId('camera', 'cam-2');
            expect(getUserMedia).toHaveBeenCalledTimes(1);
            expect(getUserMedia).toHaveBeenCalledWith({audio: false, video: {deviceId: {exact: 'cam-1'}}});
            expect(track.stop).not.toHaveBeenCalled();
            expect(track.applyConstraints).not.toHaveBeenCalled();
        } finally {
            requestDisableVideo(acquisition);
        }
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('attaches one devicechange listener while subscribed and detaches it after the last unsubscribe', async () => {
        const listener = jest.fn();
        const stopFirst = inventory.subscribe(listener);
        const stopSecond = inventory.subscribe(listener);
        await flush();
        expect(mediaDevices.addEventListener).toHaveBeenCalledTimes(1);
        expect(mediaDevices.enumerateDevices).toHaveBeenCalledTimes(1);
        mediaDevices.enumerateDevices.mockResolvedValue([device('audioinput', 'mic-2')]);
        mediaDevices.addEventListener.mock.calls[0][1]();
        await flush();
        expect(inventory.getSelection('microphone').availability).toBe('system-default');
        expect(inventory.getSnapshot().devices.microphone).toHaveLength(1);
        stopFirst();
        stopFirst();
        expect(mediaDevices.removeEventListener).not.toHaveBeenCalled();
        stopSecond();
        expect(mediaDevices.removeEventListener).toHaveBeenCalledWith(
            'devicechange', mediaDevices.addEventListener.mock.calls[0][1]
        );
        const stopThird = inventory.subscribe(jest.fn());
        expect(mediaDevices.addEventListener).toHaveBeenCalledTimes(2);
        stopThird();
    });

    test.each([{rejectOld: false}, {rejectOld: true}])(
        'ignores out-of-order results (old rejection: $rejectOld)', async ({rejectOld}) => {
            const first = deferred();
            const second = deferred();
            mediaDevices.enumerateDevices.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
            const oldRefresh = inventory.refresh();
            const newRefresh = inventory.refresh();
            second.resolve([device('videoinput', 'new')]);
            await newRefresh;
            if (rejectOld) first.reject(new Error('Old failure'));
            else first.resolve([device('videoinput', 'old')]);
            await oldRefresh;
            expect(inventory.getSnapshot().status).toBe('ready');
            expect(inventory.getSnapshot().devices.camera[0].deviceId).toBe('new');
        });

    test.each([{rejectLate: false}, {rejectLate: true}])(
        'ignores late enumeration after dispose (rejection: $rejectLate)', async ({rejectLate}) => {
            const pending = deferred();
            mediaDevices.enumerateDevices.mockReturnValue(pending.promise);
            const listener = jest.fn();
            inventory.subscribe(listener);
            inventory.dispose();
            const callsAtDisposal = listener.mock.calls.length;
            if (rejectLate) pending.reject(new Error('Late failure'));
            else pending.resolve([device('videoinput', 'late')]);
            await flush();
            expect(listener).toHaveBeenCalledTimes(callsAtDisposal);
            expect(inventory.getSnapshot().status).toBe('disposed');
            expect(mediaDevices.removeEventListener).toHaveBeenCalledTimes(1);
            await inventory.refresh();
            expect(mediaDevices.enumerateDevices).toHaveBeenCalledTimes(1);
        });

    test('last unsubscribe invalidates pending enumeration and a saved event callback', async () => {
        const pending = deferred();
        mediaDevices.enumerateDevices.mockReturnValue(pending.promise);
        const listener = jest.fn();
        const stop = inventory.subscribe(listener);
        const handleChange = mediaDevices.addEventListener.mock.calls[0][1];
        stop();
        handleChange();
        pending.resolve([device('videoinput', 'late')]);
        await flush();
        expect(mediaDevices.enumerateDevices).toHaveBeenCalledTimes(1);
        expect(inventory.getSnapshot().devices.camera).toEqual([]);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    test('handles missing media APIs, synchronous throws, invalid responses, and retries', async () => {
        const missing = new MediaInputInventory({preferences, getMediaDevices: () => null});
        expect((await missing.refresh()).status).toBe('unsupported');
        missing.dispose();
        mediaDevices.enumerateDevices.mockImplementationOnce(() => {
            throw new Error('Unavailable');
        });
        expect((await inventory.refresh()).status).toBe('error');
        mediaDevices.enumerateDevices.mockResolvedValueOnce(null);
        expect((await inventory.refresh()).status).toBe('error');
        mediaDevices.enumerateDevices.mockRejectedValueOnce({name: 'NotAllowedError'});
        expect((await inventory.refresh()).error).toBe('NotAllowedError');
        mediaDevices.enumerateDevices.mockResolvedValueOnce([device('videoinput', 'retry')]);
        expect((await inventory.refresh()).status).toBe('ready');
    });

    test('isolates observer failures and makes dispose idempotent', async () => {
        inventory.subscribe(() => {
            throw new Error('Observer failure');
        });
        const listener = jest.fn();
        inventory.subscribe(listener);
        await inventory.refresh();
        expect(listener).toHaveBeenCalled();
        inventory.dispose();
        inventory.dispose();
        expect(mediaDevices.removeEventListener).toHaveBeenCalledTimes(1);
        expect(() => inventory.subscribe(jest.fn())).toThrow('disposed');
    });

    test('can observe after a manual refresh and can be disposed by a loading observer', async () => {
        await inventory.refresh();
        const stop = inventory.subscribe(jest.fn());
        expect(mediaDevices.addEventListener).toHaveBeenCalledTimes(1);
        stop();
        mediaDevices.enumerateDevices.mockClear();
        inventory.subscribe(() => inventory.dispose());
        expect(mediaDevices.enumerateDevices).not.toHaveBeenCalled();
        expect(inventory.getSnapshot().status).toBe('disposed');
    });

    test('works in Node without navigator or storage', async () => {
        expect(typeof window).toBe('undefined');
        const nodeInventory = new MediaInputInventory();
        expect((await nodeInventory.refresh()).status).toBe('unsupported');
        expect(nodeInventory.getSelection('microphone').preferredDeviceId).toBeNull();
        nodeInventory.dispose();
    });
});
