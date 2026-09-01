const DEFAULT_BASE_URL =
    'http://127.0.0.1:8602';

export class EasyBloxHardwareServiceError extends Error {
    constructor (
        code,
        message,
        status = null,
        cause = null
    ) {
        super(message);

        this.name =
            'EasyBloxHardwareServiceError';

        this.code = code;
        this.status = status;

        if (cause) {
            this.cause = cause;
        }
    }
}

const readResponsePayload =
    async function (response) {
        try {
            return await response.json();
        } catch (error) {
            return null;
        }
    };

class EasyBloxHardwareServiceClient {
    constructor (options = {}) {
        this._baseUrl = (
            options.baseUrl ||
            DEFAULT_BASE_URL
        ).replace(/\/+$/, '');

        this._fetch =
            options.fetchImpl ||
            (
                typeof globalThis.fetch === 'function' ?
                    globalThis.fetch.bind(globalThis) :
                    null
            );
    }

    health () {
        return this._request(
            '/v1/health',
            'GET'
        );
    }

    build ({
        boardId,
        code
    }) {
        return this._request(
            '/v1/build',
            'POST',
            {
                boardId,
                code
            }
        );
    }

    upload ({
        buildId,
        portHint
    }) {
        return this._request(
            '/v1/upload',
            'POST',
            {
                buildId,
                portHint
            }
        );
    }

    restoreStageFirmware ({
        boardId,
        portHint
    }) {
        return this._request(
            '/v1/stage-firmware/restore',
            'POST',
            {
                boardId,
                portHint
            }
        );
    }

    discard (buildId) {
        return this._request(
            `/v1/build/${encodeURIComponent(buildId)}`,
            'DELETE'
        );
    }

    async _request (
        path,
        method,
        body
    ) {
        const headers = {
            'X-EasyBlox-Client':
                'scratch-gui'
        };

        const options = {
            method,
            headers
        };

        if (typeof body !== 'undefined') {
            headers['Content-Type'] =
                'application/json';

            options.body =
                JSON.stringify(body);
        }

        if (!this._fetch) {
            throw new EasyBloxHardwareServiceError(
                'HARDWARE_SERVICE_UNAVAILABLE',
                'EasyBlox Hardware Service is unavailable'
            );
        };

        let response;

        try {
            response =
                await this._fetch(
                    `${this._baseUrl}${path}`,
                    options
                );
        } catch (error) {
            throw new EasyBloxHardwareServiceError(
                'HARDWARE_SERVICE_UNAVAILABLE',
                'EasyBlox Hardware Service is unavailable',
                null,
                error
            );
        }

        const payload =
            await readResponsePayload(
                response
            );

        if (!response.ok) {
            const serviceError =
                payload &&
                payload.error ?
                    payload.error :
                    null;

            throw new EasyBloxHardwareServiceError(
                serviceError &&
                serviceError.code ?
                    serviceError.code :
                    'HARDWARE_SERVICE_REQUEST_FAILED',
                serviceError &&
                serviceError.message ?
                    serviceError.message :
                    'EasyBlox Hardware Service request failed',
                response.status
            );
        }

        return payload;
    }
}

export default EasyBloxHardwareServiceClient;
