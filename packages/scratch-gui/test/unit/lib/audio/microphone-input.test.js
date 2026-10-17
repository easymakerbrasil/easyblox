import MicrophoneInput from '../../../../src/lib/audio/microphone-input';
import {getMediaInputPreferences} from '../../../../src/lib/media-input-preferences';
import getUserMedia from 'get-user-media-promise';
import {deferred, flush, createStream} from '../../../helpers/microphone';

jest.mock('get-user-media-promise', () => jest.fn());
jest.mock('../../../../src/lib/log', () => ({warn: jest.fn(), error: jest.fn()}));

describe('owned microphone acquisition', () => {
    const preferences = getMediaInputPreferences();
    let input;
    let handles;
    let current;
    const acquire = () => {
        const handle = input.acquire();
        handles.push(handle);
        return handle;
    };
    beforeEach(() => {
        preferences.setPreferredDeviceId('microphone', null);
        input = new MicrophoneInput();
        handles = [];
        current = createStream();
        getUserMedia.mockReset().mockResolvedValue(current.stream);
    });
    afterEach(() => {
        for (const handle of handles) input.release(handle);
    });

    test('is lazy, defaults to audio only and reuses one acquisition per consumer', async () => {
        expect(getUserMedia).not.toHaveBeenCalled();
        const first = acquire();
        expect(acquire()).toBe(first);
        await expect(first.ready).resolves.toBe(current.stream);
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(getUserMedia).toHaveBeenCalledWith({audio: true});
        expect(input.release(first)).toBe(true);
        expect(input.release(first)).toBe(false);
        expect(current.track.stop).toHaveBeenCalledTimes(1);
    });

    test('captures an exact preference and applies later changes only after release', async () => {
        preferences.setPreferredDeviceId('microphone', 'mic-A');
        const first = acquire();
        await first.ready;
        preferences.setPreferredDeviceId('microphone', 'mic-B');
        expect(acquire()).toBe(first);
        expect(getUserMedia).toHaveBeenCalledWith({audio: {deviceId: {exact: 'mic-A'}}});
        input.release(first);
        const next = createStream();
        getUserMedia.mockResolvedValue(next.stream);
        const second = acquire();
        await second.ready;
        expect(getUserMedia.mock.calls[1][0]).toEqual({audio: {deviceId: {exact: 'mic-B'}}});
        expect(input.release(first)).toBe(false);
        expect(next.track.stop).not.toHaveBeenCalled();
    });

    test('falls back once for a missing explicit device without erasing it', async () => {
        preferences.setPreferredDeviceId('microphone', 'missing');
        const error = Object.assign(new Error('Missing'), {name: 'NotFoundError'});
        getUserMedia.mockRejectedValueOnce(error);
        await expect(acquire().ready).resolves.toBe(current.stream);
        expect(getUserMedia.mock.calls).toEqual([
            [{audio: {deviceId: {exact: 'missing'}}}], [{audio: true}]
        ]);
        expect(preferences.getMicrophoneDeviceId()).toBe('missing');
    });

    test('a failed default fallback is final and a subsequent acquisition may retry', async () => {
        preferences.setPreferredDeviceId('microphone', 'missing');
        const error = Object.assign(new Error('Missing'), {name: 'NotFoundError'});
        getUserMedia.mockRejectedValueOnce(error).mockRejectedValueOnce(error);
        await expect(acquire().ready).rejects.toBe(error);
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        await expect(acquire().ready).resolves.toBe(current.stream);
    });

    test.each([{name: 'NotAllowedError'}, {name: 'SecurityError'}, {name: 'NotReadableError'}])(
        '$name does not fall back or prevent retry', async ({name}) => {
            preferences.setPreferredDeviceId('microphone', 'mic-A');
            const error = Object.assign(new Error(name), {name});
            getUserMedia.mockRejectedValueOnce(error);
            const failed = acquire();
            await expect(failed.ready).rejects.toBe(error);
            expect(getUserMedia).toHaveBeenCalledTimes(1);
            const second = acquire();
            await second.ready;
            expect(input.release(failed)).toBe(false);
            expect(current.track.stop).not.toHaveBeenCalled();
        });

    test('cancel before dispatch prevents physical access', async () => {
        const first = acquire();
        input.release(first);
        await expect(first.ready).resolves.toBeNull();
        await flush();
        expect(getUserMedia).not.toHaveBeenCalled();
    });

    test.each([{rejectLate: false}, {rejectLate: true}])(
        'cancelled acquisition cannot affect the next one ($rejectLate)', async ({rejectLate}) => {
            const pending = deferred();
            getUserMedia.mockReturnValueOnce(pending.promise);
            const old = acquire();
            await Promise.resolve();
            input.release(old);
            const next = acquire();
            await next.ready;
            const late = createStream();
            if (rejectLate) pending.reject(Object.assign(new Error('Missing'), {name: 'NotFoundError'}));
            else pending.resolve(late.stream);
            await flush();
            expect(input.isActive(next)).toBe(true);
            expect(current.track.stop).not.toHaveBeenCalled();
            expect(late.track.stop).toHaveBeenCalledTimes(rejectLate ? 0 : 1);
            expect(getUserMedia).toHaveBeenCalledTimes(2);
        });

    test('cancel during fallback stops its late stream and leaves retry active', async () => {
        preferences.setPreferredDeviceId('microphone', 'missing');
        const pending = deferred();
        getUserMedia.mockRejectedValueOnce({name: 'NotFoundError'}).mockReturnValueOnce(pending.promise);
        const old = acquire();
        await flush();
        input.release(old);
        await expect(old.ready).resolves.toBeNull();
        const next = acquire();
        await next.ready;
        const late = createStream();
        pending.resolve(late.stream);
        await flush();
        expect(late.track.stop).toHaveBeenCalledTimes(1);
        expect(current.track.stop).not.toHaveBeenCalled();
        expect(input.release(old)).toBe(false);
    });

    test('each consumer releases only its own physical stream', async () => {
        const other = new MicrophoneInput();
        const otherStream = createStream();
        getUserMedia.mockResolvedValueOnce(current.stream).mockResolvedValueOnce(otherStream.stream);
        const first = acquire();
        const second = other.acquire();
        await Promise.all([first.ready, second.ready]);
        input.release(first);
        expect(otherStream.track.stop).not.toHaveBeenCalled();
        other.release(second);
        expect(otherStream.track.stop).toHaveBeenCalledTimes(1);
    });
});
