jest.mock('get-user-media-promise', () => jest.fn());
jest.mock('../../../../src/lib/log', () => ({error: jest.fn(), warn: jest.fn()}));

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((accept, fail) => {
        resolve = accept;
        reject = fail;
    });
    return {promise, resolve, reject};
};
const waitForTurn = function (resolve) {
    setTimeout(() => resolve(), 0);
};
const flush = () => new Promise(waitForTurn);
const missingCamera = () => Object.assign(new Error('Camera not found'), {name: 'NotFoundError'});
const capture = () => {
    const track = {stop: jest.fn(), applyConstraints: jest.fn()};
    return {track, stream: {getTracks: () => [track]}};
};

describe('preferred camera through real Camera Manager and VideoProvider', () => {
    let getUserMedia;
    let preferences;
    let camera;
    let VideoProvider;
    let providers;
    let handles;
    let coordinators;
    let current;
    let log;

    beforeEach(() => {
        jest.resetModules();
        window.localStorage.clear();
        getUserMedia = require('get-user-media-promise');
        preferences = require('../../../../src/lib/media-input-preferences').getMediaInputPreferences();
        camera = require('../../../../src/lib/video/camera');
        VideoProvider = require('../../../../src/lib/video/video-provider').default;
        log = require('../../../../src/lib/log');
        providers = [];
        handles = [];
        coordinators = [];
        current = capture();
        getUserMedia.mockResolvedValue(current.stream);
        const originalCreateElement = document.createElement.bind(document);
        const createElement = function (tag) {
            if (tag !== 'video') return originalCreateElement(tag);
            return {
                srcObject: null,
                videoWidth: 640,
                videoHeight: 480,
                play: jest.fn().mockResolvedValue(),
                pause: jest.fn(),
                removeAttribute: jest.fn()
            };
        };
        jest.spyOn(document, 'createElement').mockImplementation(createElement);
    });

    afterEach(() => {
        for (const coordinator of coordinators) coordinator.reset();
        for (const provider of providers) provider.disableVideo();
        for (const handle of handles) camera.requestDisableVideo(handle);
        window.localStorage.clear();
        jest.restoreAllMocks();
    });

    const createProvider = () => {
        const provider = new VideoProvider();
        providers.push(provider);
        return provider;
    };
    const request = (description = {}) => {
        const handle = camera.requestVideoStream(description);
        handles.push(handle);
        return handle;
    };
    const createCoordinator = function (provider) {
        const Video = require('../../../../../scratch-vm/src/io/video');
        const coordinator = new Video({});
        coordinators.push(coordinator);
        coordinator.setProvider(provider);
        return coordinator;
    };

    test('construction and preference queries do not capture; default preserves the existing constraints', async () => {
        const provider = createProvider();
        expect(preferences.getCameraDeviceId()).toBeNull();
        expect(getUserMedia).not.toHaveBeenCalled();
        await provider.enableVideo();
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(getUserMedia).toHaveBeenCalledWith({
            audio: false, video: {width: {min: 480, ideal: 640}, height: {min: 360, ideal: 480}}
        });
        expect(provider.videoReady).toBe(true);
    });

    test('selects the preferred camera with an exact device ID when two cameras are available', async () => {
        const other = capture();
        getUserMedia.mockImplementation(({video}) => Promise.resolve(
            video.deviceId && video.deviceId.exact === 'camera-B' ? other.stream : current.stream
        ));
        preferences.setPreferredDeviceId('camera', 'camera-B');
        const description = Object.freeze({width: 640, height: 480});
        const handle = request(description);
        await expect(handle.ready).resolves.toBe(other.stream);
        expect(getUserMedia).toHaveBeenCalledWith({
            audio: false, video: {width: 640, height: 480, deviceId: {exact: 'camera-B'}}
        });
        expect(description).toEqual({width: 640, height: 480});
        camera.requestDisableVideo(handle);
        expect(other.track.stop).toHaveBeenCalledTimes(1);
        expect(current.track.stop).not.toHaveBeenCalled();
    });

    test('providers share one fallback, retain the preference and stop only after the last release', async () => {
        preferences.setPreferredDeviceId('camera', 'missing-camera');
        getUserMedia.mockRejectedValueOnce(missingCamera());
        const first = createProvider();
        const second = createProvider();
        await Promise.all([first.enableVideo(), second.enableVideo()]);
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(getUserMedia.mock.calls[0][0].video.deviceId).toEqual({exact: 'missing-camera'});
        expect(getUserMedia.mock.calls[1][0].video).toEqual({
            width: {min: 480, ideal: 640}, height: {min: 360, ideal: 480}
        });
        expect(first.video.srcObject).toBe(current.stream);
        expect(second.video.srcObject).toBe(current.stream);
        expect(preferences.getCameraDeviceId()).toBe('missing-camera');
        expect(log.warn).toHaveBeenCalledWith(
            'Camera.requestVideoStream: preferred camera not found; trying system default'
        );
        first.disableVideo();
        expect(current.track.stop).not.toHaveBeenCalled();
        second.disableVideo();
        second.disableVideo();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
    });

    test('does not repeat fallback if the system default is also missing, and allows retry', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const fallbackError = missingCamera();
        getUserMedia.mockRejectedValueOnce(missingCamera()).mockRejectedValueOnce(fallbackError);
        const provider = createProvider();
        await expect(provider.enableVideo()).rejects.toBe(fallbackError);
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(provider.videoReady).toBe(false);
        await expect(provider.enableVideo()).resolves.toBe(provider);
        expect(getUserMedia).toHaveBeenCalledTimes(3);
        expect(getUserMedia.mock.calls[2][0].video.deviceId).toEqual({exact: 'preferred'});
    });

    test.each([{name: 'NotAllowedError'}, {name: 'SecurityError'}, {name: 'NotReadableError'},
        {name: 'OverconstrainedError'}])('does not fall back after $name', async ({name}) => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const error = Object.assign(new Error(name), {name});
        getUserMedia.mockRejectedValueOnce(error);
        await expect(createProvider().enableVideo()).rejects.toBe(error);
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(log.warn).not.toHaveBeenCalled();
        expect(preferences.getCameraDeviceId()).toBe('preferred');
    });

    test('does not retry the default when no explicit preference was requested', async () => {
        getUserMedia.mockRejectedValueOnce(missingCamera());
        await expect(createProvider().enableVideo()).rejects.toMatchObject({name: 'NotFoundError'});
        expect(getUserMedia).toHaveBeenCalledTimes(1);
    });

    test('defers preference changes until the next capture, including joining providers', async () => {
        preferences.setPreferredDeviceId('camera', 'camera-A');
        const first = createProvider();
        const second = createProvider();
        await first.enableVideo();
        preferences.setPreferredDeviceId('camera', 'camera-B');
        await second.enableVideo();
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(first.video.srcObject).toBe(second.video.srcObject);
        expect(current.track.stop).not.toHaveBeenCalled();
        expect(current.track.applyConstraints).not.toHaveBeenCalled();
        first.disableVideo();
        second.disableVideo();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        const next = capture();
        getUserMedia.mockResolvedValue(next.stream);
        await first.enableVideo();
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(getUserMedia.mock.calls[1][0].video.deviceId).toEqual({exact: 'camera-B'});
        first.disableVideo();
        preferences.setPreferredDeviceId('camera', null);
        await first.enableVideo();
        expect(getUserMedia.mock.calls[2][0].video).not.toHaveProperty('deviceId');
    });

    test('cancellation through the real lease coordinator can prevent the first physical acquisition', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const coordinator = createCoordinator(createProvider());
        const lease = coordinator.acquireCamera('qr');
        coordinator.releaseCamera(lease);
        await expect(lease.ready).resolves.toBeNull();
        await flush();
        expect(getUserMedia).not.toHaveBeenCalled();
    });

    test('cancelled initial acquisition cannot start fallback or affect a newer session', async () => {
        preferences.setPreferredDeviceId('camera', 'camera-A');
        const pending = deferred();
        getUserMedia.mockReturnValueOnce(pending.promise);
        const provider = createProvider();
        const old = provider.enableVideo();
        await Promise.resolve();
        provider.disableVideo();
        await expect(old).resolves.toBeNull();
        preferences.setPreferredDeviceId('camera', 'camera-B');
        await provider.enableVideo();
        pending.reject(missingCamera());
        await flush();
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(log.warn).not.toHaveBeenCalled();
        expect(provider.videoReady).toBe(true);
        expect(current.track.stop).not.toHaveBeenCalled();
    });

    test('one pending owner may cancel while the remaining owner completes fallback', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const pending = deferred();
        getUserMedia.mockReturnValueOnce(pending.promise);
        const first = createProvider();
        const second = createProvider();
        const old = first.enableVideo();
        const remaining = second.enableVideo();
        first.disableVideo();
        await expect(old).resolves.toBeNull();
        pending.reject(missingCamera());
        await expect(remaining).resolves.toBe(second);
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(second.videoReady).toBe(true);
        expect(current.track.stop).not.toHaveBeenCalled();
    });

    test.each([{rejectLate: false}, {rejectLate: true}])(
        'cancels a pending fallback without orphan streams or unhandled rejection ($rejectLate)',
        async ({rejectLate}) => {
            const unhandled = [];
            const onUnhandled = function (error) {
                unhandled.push(error);
            };
            process.on('unhandledRejection', onUnhandled);
            try {
                preferences.setPreferredDeviceId('camera', 'preferred');
                const pendingFallback = deferred();
                getUserMedia.mockRejectedValueOnce(missingCamera()).mockReturnValueOnce(pendingFallback.promise);
                const provider = createProvider();
                const old = provider.enableVideo();
                await flush();
                expect(getUserMedia).toHaveBeenCalledTimes(2);
                provider.disableVideo();
                await expect(old).resolves.toBeNull();
                await provider.enableVideo();
                const obsolete = capture();
                if (rejectLate) pendingFallback.reject(new Error('Old fallback failed'));
                else pendingFallback.resolve(obsolete.stream);
                await flush();
                expect(unhandled).toEqual([]);
                expect(obsolete.track.stop).toHaveBeenCalledTimes(rejectLate ? 0 : 1);
                expect(provider.videoReady).toBe(true);
                expect(current.track.stop).not.toHaveBeenCalled();
                expect(getUserMedia).toHaveBeenCalledTimes(3);
            } finally {
                process.removeListener('unhandledRejection', onUnhandled);
            }
        });

    test('stops a late preferred stream after cancellation without attempting fallback', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const pending = deferred();
        getUserMedia.mockReturnValueOnce(pending.promise);
        const handle = request();
        await Promise.resolve();
        camera.requestDisableVideo(handle);
        pending.resolve(current.stream);
        await expect(handle.ready).resolves.toBeNull();
        await flush();
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(current.track.stop).toHaveBeenCalledTimes(1);
    });

    test('handles synchronous missing-device errors with a single fallback', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        getUserMedia.mockImplementationOnce(() => {
            throw missingCamera();
        });
        await expect(createProvider().enableVideo()).resolves.toBeDefined();
        expect(getUserMedia).toHaveBeenCalledTimes(2);
    });

    test('the real coordinator shares the preferred capture across all three consumer identities', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const coordinator = createCoordinator(createProvider());
        const qr = coordinator.acquireCamera('qr');
        const sensing = coordinator.acquireCamera('videoSensing');
        const face = coordinator.acquireCamera('faceSensing');
        await Promise.all([qr.ready, sensing.ready, face.ready]);
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(getUserMedia.mock.calls[0][0].video.deviceId).toEqual({exact: 'preferred'});
        coordinator.releaseCamera(qr);
        coordinator.releaseCamera(sensing);
        expect(current.track.stop).not.toHaveBeenCalled();
        expect(coordinator.isCameraLeaseActive(face)).toBe(true);
        coordinator.releaseCamera(face);
        expect(current.track.stop).toHaveBeenCalledTimes(1);
    });

    test('fallback removes a caller device constraint without mutating the caller description', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        getUserMedia.mockRejectedValueOnce(missingCamera());
        const description = Object.freeze({width: 640, deviceId: {exact: 'caller-camera'}});
        await expect(request(description).ready).resolves.toBe(current.stream);
        expect(getUserMedia.mock.calls[1][0]).toEqual({audio: false, video: {width: 640}});
        expect(description.deviceId).toEqual({exact: 'caller-camera'});
    });

    test('preference changes during an attempt do not replace its bounded default fallback', async () => {
        preferences.setPreferredDeviceId('camera', 'camera-A');
        const pending = deferred();
        getUserMedia.mockReturnValueOnce(pending.promise);
        const provider = createProvider();
        const activation = provider.enableVideo();
        await Promise.resolve();
        preferences.setPreferredDeviceId('camera', 'camera-B');
        pending.reject(missingCamera());
        await activation;
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(getUserMedia.mock.calls[0][0].video.deviceId).toEqual({exact: 'camera-A'});
        expect(getUserMedia.mock.calls[1][0].video).not.toHaveProperty('deviceId');
        expect(preferences.getCameraDeviceId()).toBe('camera-B');
        provider.disableVideo();
        await provider.enableVideo();
        expect(getUserMedia.mock.calls[2][0].video.deviceId).toEqual({exact: 'camera-B'});
    });

    test('an old shared fallback failure cannot release a new provider retry', async () => {
        preferences.setPreferredDeviceId('camera', 'preferred');
        const fallbackError = Object.assign(new Error('Default permission denied'), {name: 'NotAllowedError'});
        getUserMedia.mockRejectedValueOnce(missingCamera()).mockRejectedValueOnce(fallbackError);
        const first = createProvider();
        const second = createProvider();
        let retry;
        first.onError = () => {
            retry = first.enableVideo();
        };
        const outcomes = await Promise.allSettled([first.enableVideo(), second.enableVideo()]);
        expect(outcomes).toEqual([
            {status: 'rejected', reason: fallbackError}, {status: 'rejected', reason: fallbackError}
        ]);
        await retry;
        expect(first.videoReady).toBe(true);
        expect(first.video.srcObject).toBe(current.stream);
        expect(current.track.stop).not.toHaveBeenCalled();
        expect(getUserMedia).toHaveBeenCalledTimes(3);
        first.disableVideo();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
    });
});
