jest.mock('get-user-media-promise', () => jest.fn());
jest.mock('../../../../src/lib/log.js', () => ({error: jest.fn()}));

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return {promise, resolve, reject};
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('real VideoProviders sharing the camera manager', () => {
    let getUserMedia;
    let VideoProvider;
    let videos;
    let providers;
    let track;
    let stream;
    let configureVideo;
    let originalCreateObjectURL;
    let originalRevokeObjectURL;

    beforeEach(() => {
        jest.resetModules();
        getUserMedia = require('get-user-media-promise');
        VideoProvider = require('../../../../src/lib/video/video-provider.js').default;
        track = {stop: jest.fn()};
        stream = {getTracks: () => [track]};
        getUserMedia.mockResolvedValue(stream);
        videos = [];
        providers = [];
        configureVideo = () => {};
        originalCreateObjectURL = window.URL.createObjectURL;
        originalRevokeObjectURL = window.URL.revokeObjectURL;
        window.URL.createObjectURL = jest.fn(() => 'blob:test-camera');
        window.URL.revokeObjectURL = jest.fn();
        jest.spyOn(document, 'createElement').mockImplementation(tag => {
            if (tag !== 'video') throw new Error(`Unexpected element: ${tag}`);
            const video = {
                srcObject: null,
                play: jest.fn(() => Promise.resolve()),
                pause: jest.fn(),
                removeAttribute: jest.fn(),
                videoWidth: 640,
                videoHeight: 480
            };
            videos.push(video);
            configureVideo(video);
            return video;
        });
    });

    afterEach(() => {
        providers.forEach(provider => provider.disableVideo());
        if (originalCreateObjectURL) window.URL.createObjectURL = originalCreateObjectURL;
        else delete window.URL.createObjectURL;
        if (originalRevokeObjectURL) window.URL.revokeObjectURL = originalRevokeObjectURL;
        else delete window.URL.revokeObjectURL;
        jest.restoreAllMocks();
    });

    const createProvider = () => {
        const provider = new VideoProvider();
        providers.push(provider);
        return provider;
    };

    test('a rejection from a shared old request cannot release another provider retry', async () => {
        const failed = deferred();
        getUserMedia.mockReturnValueOnce(failed.promise);
        const first = createProvider();
        const second = createProvider();
        let retry;
        first.onError = () => {
            retry = first.enableVideo();
        };
        const firstAttempt = first.enableVideo().catch(error => error);
        const secondAttempt = second.enableVideo().catch(error => error);
        await Promise.resolve();
        const error = new Error('permission denied');
        failed.reject(error);
        expect(await firstAttempt).toBe(error);
        expect(await secondAttempt).toBe(error);
        await retry;
        expect(track.stop).not.toHaveBeenCalled();
        expect(first.video.srcObject).toBe(stream);
        expect(first.videoReady).toBe(true);
        first.disableVideo();
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('two active providers share capture and only the final valid release stops it', async () => {
        const first = createProvider();
        const second = createProvider();
        const activation = first.enableVideo();
        expect(first.enableVideo()).toBe(activation);
        await Promise.all([activation, second.enableVideo()]);
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(first.video).not.toBe(second.video);
        first.disableVideo();
        first.disableVideo();
        expect(track.stop).not.toHaveBeenCalled();
        expect(second.videoReady).toBe(true);
        second.disableVideo();
        second.disableVideo();
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('cancelled pending capture stops a late stream without disturbing a rapid restart', async () => {
        const oldCapture = deferred();
        const oldTrack = {stop: jest.fn()};
        getUserMedia.mockReturnValueOnce(oldCapture.promise);
        const provider = createProvider();
        const old = provider.enableVideo();
        await Promise.resolve();
        provider.disableVideo();
        await expect(old).resolves.toBeNull();
        await provider.enableVideo();
        const currentVideo = provider.video;
        oldCapture.resolve({getTracks: () => [oldTrack]});
        await flush();
        expect(oldTrack.stop).toHaveBeenCalledTimes(1);
        expect(track.stop).not.toHaveBeenCalled();
        expect(provider.video).toBe(currentVideo);
        expect(provider.videoReady).toBe(true);
        provider.disableVideo();
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('providers can share capture while their playback completes at different times', async () => {
        const playback = deferred();
        configureVideo = video => {
            if (videos.length === 1) video.play.mockReturnValue(playback.promise);
        };
        const first = createProvider();
        const second = createProvider();
        const pending = first.enableVideo();
        await second.enableVideo();
        expect(first.video.srcObject).toBe(stream);
        expect(first.videoReady).toBe(false);
        expect(second.videoReady).toBe(true);
        first.disableVideo();
        playback.resolve();
        await expect(pending).resolves.toBeNull();
        expect(first.video).toBeNull();
        expect(track.stop).not.toHaveBeenCalled();
        second.disableVideo();
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('playback success still requires nonzero video dimensions for frames', async () => {
        const provider = createProvider();
        await provider.enableVideo();
        expect(provider.videoReady).toBe(true);
        provider.video.videoWidth = 0;
        expect(provider.videoReady).toBe(false);
        expect(provider.getFrame({})).toBeNull();
        provider.disableVideo();
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test.each([false, true])('play failure (synchronous=%s) releases capture and allows retry', async synchronous => {
        const error = new Error('playback denied');
        configureVideo = video => {
            if (synchronous) {
                video.play.mockImplementation(() => {
                    throw error;
                });
            } else {
                video.play.mockRejectedValue(error);
            }
        };
        const provider = createProvider();
        await expect(provider.enableVideo()).rejects.toBe(error);
        expect(provider.video).toBeNull();
        expect(provider.videoReady).toBe(false);
        expect(provider.enabled).toBe(false);
        expect(track.stop).toHaveBeenCalledTimes(1);
        const nextTrack = {stop: jest.fn()};
        getUserMedia.mockResolvedValue({getTracks: () => [nextTrack]});
        configureVideo = () => {};
        await expect(provider.enableVideo()).resolves.toBe(provider);
        provider.disableVideo();
        expect(nextTrack.stop).toHaveBeenCalledTimes(1);
    });

    test('srcObject failure uses and revokes the existing object URL fallback', async () => {
        configureVideo = video => Object.defineProperty(video, 'srcObject', {set: () => {
            throw new Error('srcObject unsupported');
        }});
        const provider = createProvider();
        await provider.enableVideo();
        expect(provider.video.src).toBe('blob:test-camera');
        provider.disableVideo();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-camera');
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('failure of both stream attachment paths releases the acquired stream', async () => {
        configureVideo = video => Object.defineProperty(video, 'srcObject', {set: () => {
            throw new Error('srcObject unsupported');
        }});
        const error = new Error('object URL unsupported');
        window.URL.createObjectURL.mockImplementation(() => {
            throw error;
        });
        const provider = createProvider();
        await expect(provider.enableVideo()).rejects.toBe(error);
        expect(provider.video).toBeNull();
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('a failed fallback src assignment also revokes its object URL', async () => {
        configureVideo = video => {
            Object.defineProperty(video, 'srcObject', {set: () => {
                throw new Error('srcObject unsupported');
            }});
            Object.defineProperty(video, 'src', {set: () => {
                throw new Error('src assignment failed');
            }});
        };
        const provider = createProvider();
        await expect(provider.enableVideo()).rejects.toThrow('src assignment failed');
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-camera');
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test.each(['pause', 'detach', 'removeAttribute'])('HTML %s failure releases capture', async failure => {
        const provider = createProvider();
        await provider.enableVideo();
        const video = provider.video;
        const error = new Error(`${failure} failed`);
        if (failure === 'detach') {
            Object.defineProperty(video, 'srcObject', {set: () => {
                throw error;
            }});
        } else {
            video[failure].mockImplementation(() => {
                throw error;
            });
        }
        expect(() => provider.disableVideo()).not.toThrow();
        expect(provider.video).toBeNull();
        expect(provider.videoReady).toBe(false);
        expect(track.stop).toHaveBeenCalledTimes(1);
        expect(video.removeAttribute).toHaveBeenCalledWith('src');
        expect(require('../../../../src/lib/log.js').error).toHaveBeenCalled();
        provider.disableVideo();
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('a stale play rejection cannot tear down new playback or escape internally', async () => {
        const errors = [];
        const onUnhandled = error => errors.push(error);
        process.on('unhandledRejection', onUnhandled);
        try {
            const playback = deferred();
            configureVideo = video => {
                if (videos.length === 1) video.play.mockReturnValue(playback.promise);
            };
            const provider = createProvider();
            const old = provider.enableVideo();
            await flush();
            provider.disableVideo();
            const nextTrack = {stop: jest.fn()};
            getUserMedia.mockResolvedValue({getTracks: () => [nextTrack]});
            await provider.enableVideo();
            const currentVideo = provider.video;
            playback.reject(new Error('old playback failure'));
            await expect(old).resolves.toBeNull();
            await flush();
            expect(errors).toEqual([]);
            expect(provider.video).toBe(currentVideo);
            expect(provider.videoReady).toBe(true);
            expect(nextTrack.stop).not.toHaveBeenCalled();
            provider.disableVideo();
            expect(nextTrack.stop).toHaveBeenCalledTimes(1);
        } finally {
            process.removeListener('unhandledRejection', onUnhandled);
        }
    });
});
