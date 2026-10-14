import EasyBloxDesktopClient from '../../../src/lib/easyblox-desktop-client';

const appInfo = {
    productName: 'EasyBlox', version: '0.4.1', platform: 'win32', isPackaged: true
};

describe('EasyBloxDesktopClient', () => {
    afterEach(() => jest.useRealTimers());

    test('returns only validated real metadata and invokes the bridge without arguments', async () => {
        const getAppInfo = jest.fn().mockResolvedValue({...appInfo, version: '1.2.3'});
        const client = new EasyBloxDesktopClient({getBridge: () => ({getAppInfo})});
        expect(await client.getAppInfo()).toEqual({status: 'available', appInfo: {...appInfo, version: '1.2.3'}});
        expect(getAppInfo).toHaveBeenCalledWith();
    });

    test('works without a bridge in a regular browser without inventing a version', async () => {
        const client = new EasyBloxDesktopClient({getBridge: () => null});
        expect(await client.getAppInfo()).toEqual({status: 'unavailable', reason: 'bridge-absent'});
        expect(await new EasyBloxDesktopClient().getAppInfo()).toEqual({
            status: 'unavailable', reason: 'bridge-absent'
        });
    });

    const checkInvalidMetadata = async function (value) {
        const client = new EasyBloxDesktopClient({getBridge: () => ({getAppInfo: () => Promise.resolve(value)})});
        expect(await client.getAppInfo()).toEqual({status: 'unavailable', reason: 'invalid-response'});
    };
    test.each([
        null, [], {}, {...appInfo, extra: true}, {...appInfo, version: ''},
        {...appInfo, productName: ' '}, {...appInfo, platform: 1}, {...appInfo, isPackaged: 'true'}
    ])('rejects invalid metadata: %p', checkInvalidMetadata);

    test('handles incompatible bridges and rejected IPC', async () => {
        expect(await new EasyBloxDesktopClient({getBridge: () => ({})}).getAppInfo()).toEqual({
            status: 'unavailable', reason: 'invalid-bridge'
        });
        const client = new EasyBloxDesktopClient({getBridge: () => ({
            getAppInfo: () => Promise.reject(new Error('internal detail'))
        })});
        expect(await client.getAppInfo()).toEqual({status: 'unavailable', reason: 'ipc-error'});
    });

    test('times out once and ignores a late response', async () => {
        jest.useFakeTimers();
        let resolve;
        const storeResolver = function (callback) {
            resolve = callback;
        };
        const getAppInfo = jest.fn().mockImplementation(() => new Promise(storeResolver));
        const client = new EasyBloxDesktopClient({getBridge: () => ({getAppInfo}), timeoutMs: 50});
        const request = client.getAppInfo();
        await Promise.resolve();
        jest.advanceTimersByTime(50);
        expect(await request).toEqual({status: 'unavailable', reason: 'timeout'});
        resolve(appInfo);
        await Promise.resolve();
        expect(await request).toEqual({status: 'unavailable', reason: 'timeout'});
        expect(getAppInfo).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    test('cancels pending requests and ignores late success or rejection', async () => {
        jest.useFakeTimers();
        for (const rejectLate of [false, true]) {
            let finish;
            const controller = new AbortController();
            const client = new EasyBloxDesktopClient({getBridge: () => ({
                getAppInfo: () => new Promise((resolve, reject) => {
                    finish = rejectLate ? reject : resolve;
                })
            })});
            const request = client.getAppInfo({signal: controller.signal});
            await Promise.resolve();
            controller.abort();
            expect(await request).toEqual({status: 'unavailable', reason: 'cancelled'});
            finish(rejectLate ? new Error('late rejection') : appInfo);
            await Promise.resolve();
            expect(await request).toEqual({status: 'unavailable', reason: 'cancelled'});
            expect(jest.getTimerCount()).toBe(0);
        }
    });

    test('does not invoke IPC for an already cancelled request', async () => {
        const controller = new AbortController();
        controller.abort();
        const getAppInfo = jest.fn();
        const client = new EasyBloxDesktopClient({getBridge: () => ({getAppInfo})});
        expect(await client.getAppInfo({signal: controller.signal})).toEqual({
            status: 'unavailable', reason: 'cancelled'
        });
        expect(getAppInfo).not.toHaveBeenCalled();
    });
});
