jest.mock('../../../../src/lib/video/camera.js', () => ({
    requestVideoStream: jest.fn(),
    requestDisableVideo: jest.fn()
}));

jest.mock('../../../../src/lib/log.js', () => ({
    error: jest.fn()
}));

const {
    requestVideoStream,
    requestDisableVideo
} = require('../../../../src/lib/video/camera.js');

const VideoProvider = require(
    '../../../../src/lib/video/video-provider.js'
).default;

describe('EasyBlox VideoProvider lifecycle', () => {
    let provider;
    let track;
    let stream;
    let video;
    let acquisition;

    beforeEach(() => {
        jest.clearAllMocks();

        track = {stop: jest.fn()};
        stream = {getTracks: () => [track]};

        video = {
            srcObject: null,
            play: jest.fn(() => Promise.resolve()),
            pause: jest.fn(),
            removeAttribute: jest.fn()
        };

        const originalCreateElement =
            document.createElement.bind(document);

        jest.spyOn(document, 'createElement')
            .mockImplementation(tag => {
                if (tag === 'video') return video;
                return originalCreateElement(tag);
            });

        requestDisableVideo.mockReturnValue(true);
        acquisition = {ready: Promise.resolve(stream)};
        requestVideoStream.mockReturnValue(acquisition);

        provider = new VideoProvider();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('releases its acquisition exactly once', async () => {
        await provider.enableVideo();

        provider.disableVideo();
        provider.disableVideo();

        expect(requestDisableVideo).toHaveBeenCalledTimes(1);
        expect(requestDisableVideo).toHaveBeenCalledWith(acquisition);
        expect(video.pause).toHaveBeenCalledTimes(1);
        expect(video.srcObject).toBeNull();
    });

    test('does not attach a capture cancelled while pending', async () => {
        let resolveCapture;

        requestVideoStream.mockImplementation(() => ({
            ready: new Promise(resolve => {
                resolveCapture = resolve;
            })
        }));

        const pending = provider.enableVideo();

        provider.disableVideo();
        resolveCapture(null);

        await expect(pending).resolves.toBeNull();

        expect(document.createElement).not.toHaveBeenCalled();
        expect(requestDisableVideo).toHaveBeenCalledTimes(1);
    });

    test('propagates acquisition errors and releases ownership', async () => {
        requestVideoStream.mockReturnValue({ready: Promise.reject(new Error('Camera unavailable'))});

        await expect(provider.enableVideo())
            .rejects.toThrow('Camera unavailable');

        expect(requestDisableVideo).toHaveBeenCalledTimes(1);
    });

    test('does not stop physical tracks directly', async () => {
        await provider.enableVideo();
        provider.disableVideo();

        expect(track.stop).not.toHaveBeenCalled();
        expect(requestDisableVideo).toHaveBeenCalledTimes(1);
    });
    test('a cancelled activation cannot override a newer one', async () => {
        let resolveOldCapture;

        const oldCapture = new Promise(resolve => {
            resolveOldCapture = resolve;
        });

        requestVideoStream
            .mockReturnValueOnce({ready: oldCapture})
            .mockReturnValueOnce(acquisition);

        const firstActivation = provider.enableVideo();

        provider.disableVideo();

        const secondActivation = provider.enableVideo();

        // The old request finishes after the newer activation.
        resolveOldCapture(null);

        await expect(firstActivation).resolves.toBeNull();
        await expect(secondActivation).resolves.toBe(provider);

        expect(requestVideoStream).toHaveBeenCalledTimes(2);
        expect(requestDisableVideo).toHaveBeenCalledTimes(1);
        expect(provider.video).toBe(video);
        expect(provider.videoReady).toBe(false);
    });
});
