jest.mock('get-user-media-promise', () => jest.fn());

describe('EasyBlox shared camera manager', () => {
    let getUserMedia;
    let requestVideoStream;
    let requestDisableVideo;
    let acquisitions;

    beforeEach(() => {
        jest.resetModules();

        getUserMedia = require('get-user-media-promise');
        getUserMedia.mockReset();

        const camera = require(
            '../../../../src/lib/video/camera.js'
        );

        acquisitions = [];
        requestVideoStream = options => {
            const acquisition = camera.requestVideoStream(options);
            acquisitions.push(acquisition);
            return acquisition;
        };
        requestDisableVideo = camera.requestDisableVideo;
    });

    afterEach(() => acquisitions.forEach(acquisition => requestDisableVideo(acquisition)));

    test('shares one capture request between consumers', async () => {
        const stream = {
            getTracks: () => []
        };

        getUserMedia.mockResolvedValue(stream);

        const first = requestVideoStream({width: 640});
        const second = requestVideoStream({width: 640});

        await Promise.resolve();
        expect(getUserMedia).toHaveBeenCalledTimes(1);

        expect(first).not.toBe(second);
        await expect(first.ready).resolves.toBe(stream);
        await expect(second.ready).resolves.toBe(stream);

        expect(requestDisableVideo(first)).toBe(false);
        expect(requestDisableVideo(second)).toBe(true);
    });

    test('allows a new attempt after capture rejection', async () => {
        const error = new Error('Camera unavailable');
        const stream = {
            getTracks: () => []
        };

        getUserMedia
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(stream);

        await expect(
            requestVideoStream({width: 640}).ready
        ).rejects.toThrow('Camera unavailable');

        await expect(
            requestVideoStream({width: 640}).ready
        ).resolves.toBe(stream);

        expect(getUserMedia).toHaveBeenCalledTimes(2);
    });

    test('releases shared capture only after last consumer', async () => {
        getUserMedia.mockResolvedValue({
            getTracks: () => []
        });

        const first = requestVideoStream({width: 640});
        const second = requestVideoStream({width: 640});
        await Promise.all([first.ready, second.ready]);

        expect(requestDisableVideo(first)).toBe(false);
        expect(requestDisableVideo(second)).toBe(true);
    });
    test('allows retry after a shared capture request fails', async () => {
        const error = new Error('Permission denied');
        const stream = {
            getTracks: () => []
        };

        getUserMedia
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(stream);

        const first = requestVideoStream({width: 640});
        const second = requestVideoStream({width: 640});

        await Promise.resolve();
        expect(getUserMedia).toHaveBeenCalledTimes(1);

        await expect(first.ready).rejects.toThrow('Permission denied');
        await expect(second.ready).rejects.toThrow('Permission denied');

        await expect(
            requestVideoStream({width: 640}).ready
        ).resolves.toBe(stream);

        expect(getUserMedia).toHaveBeenCalledTimes(2);
    });

    test('does not reuse a cancelled pending capture', async () => {
        let resolveCapture;

        getUserMedia.mockImplementationOnce(() =>
            new Promise(resolve => {
                resolveCapture = resolve;
            })
        );

        const pending = requestVideoStream({width: 640});

        await Promise.resolve();
        expect(requestDisableVideo(pending)).toBe(true);
        await expect(pending.ready).resolves.toBeNull();

        const track = {
            stop: jest.fn()
        };

        const stream = {
            getTracks: () => [track]
        };

        resolveCapture(stream);

        await Promise.resolve();
        await expect(pending.ready).resolves.toBeNull();

        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('duplicate and failed-request releases cannot stop a retry', async () => {
        const track = {stop: jest.fn()};
        const stream = {getTracks: () => [track]};
        getUserMedia.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce(stream);
        const failed = requestVideoStream({});
        await expect(failed.ready).rejects.toThrow('denied');
        const retry = requestVideoStream({});
        await expect(retry.ready).resolves.toBe(stream);
        expect(requestDisableVideo(failed)).toBe(false);
        expect(requestDisableVideo(failed)).toBe(false);
        expect(requestDisableVideo()).toBe(false);
        expect(track.stop).not.toHaveBeenCalled();
        expect(requestDisableVideo(retry)).toBe(true);
        expect(requestDisableVideo(retry)).toBe(false);
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('a pending consumer can cancel without cancelling another consumer', async () => {
        let resolveCapture;
        const track = {stop: jest.fn()};
        const stream = {getTracks: () => [track]};
        getUserMedia.mockImplementationOnce(() => new Promise(resolve => {
            resolveCapture = resolve;
        }));
        const first = requestVideoStream({});
        const second = requestVideoStream({});
        await Promise.resolve();
        expect(requestDisableVideo(first)).toBe(false);
        await expect(first.ready).resolves.toBeNull();
        resolveCapture(stream);
        await expect(second.ready).resolves.toBe(stream);
        expect(track.stop).not.toHaveBeenCalled();
        requestDisableVideo(second);
        expect(track.stop).toHaveBeenCalledTimes(1);
    });

    test('synchronous capture errors reject ownership and permit retry', async () => {
        getUserMedia.mockImplementationOnce(() => {
            throw new Error('synchronous failure');
        }).mockResolvedValueOnce({getTracks: () => []});
        const failed = requestVideoStream({});
        await expect(failed.ready).rejects.toThrow('synchronous failure');
        expect(requestDisableVideo(failed)).toBe(false);
        await expect(requestVideoStream({}).ready).resolves.toBeDefined();
    });
});
