const getWindowBridge = () => (typeof window === 'undefined' ? null : window.easybloxDesktop);
const APP_INFO_FIELDS = ['productName', 'version', 'platform', 'isPackaged'];

const isAppInfo = function (value) {
    const isExpectedField = function (key) {
        return APP_INFO_FIELDS.includes(key);
    };
    const isNonemptyString = function (key) {
        return typeof value[key] === 'string' && value[key].trim();
    };
    return value && typeof value === 'object' && !Array.isArray(value) &&
        Reflect.ownKeys(value).length === APP_INFO_FIELDS.length &&
        Reflect.ownKeys(value).every(isExpectedField) &&
        ['productName', 'version', 'platform'].every(isNonemptyString) && typeof value.isPackaged === 'boolean';
};

class EasyBloxDesktopClient {
    constructor ({getBridge = getWindowBridge, timeoutMs = 5000} = {}) {
        this.getBridge = getBridge;
        this.timeoutMs = timeoutMs;
    }

    /**
     * Resolve with {status: 'available', appInfo} or {status: 'unavailable', reason}.
     * Reasons: bridge-absent, invalid-bridge, ipc-error, invalid-response, timeout, cancelled.
     * AbortSignal invalidates this request; it cannot cancel Electron's underlying invoke.
     * @param {object} options optional AbortSignal from the caller's lifecycle
     * @param {AbortSignal} options.signal invalidates a request when aborted
     * @returns {Promise<object>} metadata or an explicit unavailable result, never a fallback version
     */
    getAppInfo ({signal} = {}) {
        if (signal && signal.aborted) return Promise.resolve({status: 'unavailable', reason: 'cancelled'});
        let bridge;
        try {
            bridge = this.getBridge();
            if (!bridge) return Promise.resolve({status: 'unavailable', reason: 'bridge-absent'});
            if (typeof bridge.getAppInfo !== 'function') {
                return Promise.resolve({status: 'unavailable', reason: 'invalid-bridge'});
            }
        } catch {
            return Promise.resolve({status: 'unavailable', reason: 'ipc-error'});
        }

        const timeoutMs = this.timeoutMs;
        const executeRequest = function (resolve) {
            const request = {settled: false, timer: null, handleAbort: null};
            const finish = function (result) {
                if (request.settled) return;
                request.settled = true;
                clearTimeout(request.timer);
                if (signal) signal.removeEventListener('abort', request.handleAbort);
                resolve(result);
            };
            request.handleAbort = () => finish({status: 'unavailable', reason: 'cancelled'});
            request.timer = setTimeout(() => finish({status: 'unavailable', reason: 'timeout'}), timeoutMs);
            if (signal) signal.addEventListener('abort', request.handleAbort, {once: true});

            const acceptInfo = function (value) {
                if (request.settled) return;
                if (!isAppInfo(value)) {
                    finish({status: 'unavailable', reason: 'invalid-response'});
                    return;
                }
                finish({
                    status: 'available',
                    appInfo: {
                        productName: value.productName,
                        version: value.version,
                        platform: value.platform,
                        isPackaged: value.isPackaged
                    }
                });
            };
            Promise.resolve()
                .then(() => (request.settled ? null : bridge.getAppInfo()))
                .then(acceptInfo)
                .catch(() => finish({status: 'unavailable', reason: 'ipc-error'}));
        };
        return new Promise(executeRequest);
    }
}

export default EasyBloxDesktopClient;
