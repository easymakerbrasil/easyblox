const http = require('node:http');
const {randomUUID} = require('node:crypto');
const {WebSocketServer} = require('ws');

const BluetoothSerialTransport =
    require('./bluetooth-serial-transport');
const BluetoothSocketSession =
    require('./bluetooth-socket-session');
const BuildService = require('./build-service');
const HardwareServiceError = require('./hardware-service-error');
const UploadService = require('./upload-service');
const StageFirmwareManager =
    require('./stage-firmware-manager');

const SerialPortAdapter =
    require('./serial-port-adapter');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8602;
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;

const BLUETOOTH_WEBSOCKET_PATH =
    '/v1/bluetooth';
const BLUETOOTH_WEBSOCKET_PROTOCOL =
    'easyblox-controller-v1';

const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
    'http://localhost:8601',
    'http://127.0.0.1:8601'
]);

const sanitizeBluetoothDeviceLabel =
    label => {
        const source =
            typeof label === 'string' ?
                label :
                '';

        const sanitized =
            source
                .replace(
                    /\(\s*COM\s*\d+\s*\)/gi,
                    ''
                )
                .replace(
                    /\bCOM\s*\d+\b/gi,
                    ''
                )
                .replace(
                    /\s{2,}/g,
                    ' '
                )
                .trim();

        return (
            sanitized ||
            'Dispositivo Bluetooth'
        );
    };

const statusForErrorCode = code => {
    switch (code) {
    case 'INVALID_REQUEST':
    case 'INVALID_CONTENT_TYPE':
    case 'INVALID_BUILD_REQUEST':
    case 'INVALID_UPLOAD_ARTIFACT':
    case 'PORT_HINT_REQUIRED':
    case 'UNSUPPORTED_BOARD':
        return 400;
    case 'FORBIDDEN_REQUEST':
        return 403;
    case 'BUILD_NOT_FOUND':
    case 'PORT_NOT_FOUND':
        return 404;
    case 'PORT_AMBIGUOUS':
    case 'PORT_BUSY':
        return 409;
    case 'BUILD_FAILED':
        return 422;
    case 'TOOLCHAIN_NOT_FOUND':
        return 503;
    case 'BOARD_NOT_RESPONDING':
    case 'PORT_DISCOVERY_FAILED':
    case 'UPLOAD_FAILED':
        return 502;
    default:
        return 500;
    }
};

class HardwareHttpServer {
    constructor (options = {}) {
        this._host = DEFAULT_HOST;
        this._port = Number.isInteger(options.port) ?
            options.port :
            DEFAULT_PORT;

        this._allowedOrigins = new Set(
            options.allowedOrigins ||
            DEFAULT_ALLOWED_ORIGINS
        );

        this._maxBodyBytes =
            Number.isInteger(options.maxBodyBytes) ?
                options.maxBodyBytes :
                DEFAULT_MAX_BODY_BYTES;

        this._buildService =
            options.buildService ||
            new BuildService();

        this._uploadService =
            options.uploadService ||
            new UploadService();

        this._stageFirmwareManager =
            options.stageFirmwareManager ||
            new StageFirmwareManager({
                buildService:
                    this._buildService,
                uploadService:
                    this._uploadService
            });

        this._bluetoothTransportFactory =
            options.bluetoothTransportFactory ||
            (() =>
                new BluetoothSerialTransport({
                    serialAdapter:
                        new SerialPortAdapter()
                }));

        this._bluetoothWebSocketServer =
            new WebSocketServer({
                noServer: true
            });

        this._builds = new Map();

        this._server = http.createServer(
            (request, response) => {
                Promise.resolve(
                    this._handleRequest(
                        request,
                        response
                    )
                ).catch(error => {
                    this._sendError(
                        response,
                        error,
                        request.headers.origin
                    );
                });
            }
        );

        this._server.on(
            'upgrade',
            (
                request,
                socket,
                head
            ) => {
                this._handleUpgrade(
                    request,
                    socket,
                    head
                );
            }
        );
    }

    async listen () {
        if (this._server.listening) {
            return this.address();
        }

        await new Promise(
            (resolve, reject) => {
                const handleError = error => {
                    reject(error);
                };

                this._server.once(
                    'error',
                    handleError
                );

                this._server.listen(
                    this._port,
                    this._host,
                    () => {
                        this._server.removeListener(
                            'error',
                            handleError
                        );

                        resolve();
                    }
                );
            }
        );

        return this.address();
    }

    address () {
        const address =
            this._server.address();

        return {
            host: this._host,
            port:
                address &&
                typeof address === 'object' ?
                    address.port :
                    this._port
        };
    }

    async close () {
        const buildIds =
            Array.from(
                this._builds.keys()
            );

        await Promise.allSettled(
            buildIds.map(
                buildId =>
                    this._cleanupBuild(
                        buildId
                    )
            )
        );

        await this._stageFirmwareManager
            .cleanup();

        if (!this._server.listening) {
            return;
        }

        await new Promise(
            (resolve, reject) => {
                this._server.close(
                    error => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve();
                    }
                );
            }
        );
    }

    _handleUpgrade (
        request,
        socket,
        head
    ) {
        const origin =
            request.headers.origin ||
            null;

        if (
            !this._isLoopbackHost(
                request.headers.host
            )
        ) {
            this._rejectUpgrade(
                socket,
                403,
                'Forbidden'
            );

            return;
        }

        if (
            !this._isAllowedOrigin(
                origin
            )
        ) {
            this._rejectUpgrade(
                socket,
                403,
                'Forbidden'
            );

            return;
        }

        let url;

        try {
            url =
                new URL(
                    request.url,
                    `http://${DEFAULT_HOST}`
                );
        } catch (error) {
            this._rejectUpgrade(
                socket,
                400,
                'Bad Request'
            );

            return;
        }

        if (
            url.pathname !==
                BLUETOOTH_WEBSOCKET_PATH
        ) {
            this._rejectUpgrade(
                socket,
                404,
                'Not Found'
            );

            return;
        }

        const deviceId =
            url.searchParams
                .get('deviceId');

        if (
            typeof deviceId !== 'string' ||
            deviceId.trim().length === 0
        ) {
            this._rejectUpgrade(
                socket,
                400,
                'Bad Request'
            );

            return;
        }

        if (
            !this._hasBluetoothWebSocketProtocol(
                request
            )
        ) {
            this._rejectUpgrade(
                socket,
                426,
                'Upgrade Required'
            );

            return;
        }

        this._bluetoothWebSocketServer
            .handleUpgrade(
                request,
                socket,
                head,
                webSocket => {
                    let transport;
                    let session;

                    try {
                        transport =
                            this
                                ._bluetoothTransportFactory();

                        session =
                            new BluetoothSocketSession({
                                socket:
                                    webSocket,
                                transport
                            });
                    } catch (error) {
                        webSocket.close(
                            1011,
                            'Bluetooth service error'
                        );

                        return;
                    }

                    Promise.resolve(
                        session.start({
                            deviceId:
                                deviceId.trim()
                        })
                    ).catch(() => {
                        webSocket.close(
                            1011,
                            'Bluetooth connection failed'
                        );
                    });
                }
            );
    }

    async _handleRequest (
        request,
        response
    ) {
        const origin =
            request.headers.origin ||
            null;

        if (
            !this._isLoopbackHost(
                request.headers.host
            )
        ) {
            throw new HardwareServiceError(
                'FORBIDDEN_REQUEST',
                'Hardware service requests must use the loopback interface'
            );
        }

        if (
            !this._isAllowedOrigin(
                origin
            )
        ) {
            throw new HardwareServiceError(
                'FORBIDDEN_REQUEST',
                'Hardware service request origin is not allowed'
            );
        }

        this._applyCors(
            response,
            origin
        );

        if (request.method === 'OPTIONS') {
            response.statusCode = 204;
            response.end();
            return;
        }

        const url =
            new URL(
                request.url,
                `http://${DEFAULT_HOST}`
            );

        if (
            request.method === 'GET' &&
            url.pathname === '/v1/health'
        ) {
            this._sendJson(
                response,
                200,
                {
                    ok: true,
                    service:
                        'easyblox-hardware-service',
                    version: 1
                }
            );

            return;
        }

        this._validateClientRequest(
            request
        );

        if (
            request.method === 'GET' &&
            url.pathname ===
                '/v1/bluetooth/devices'
        ) {
            await this._handleBluetoothDevices(
                response
            );

            return;
        }

        if (
            request.method === 'POST' &&
            url.pathname === '/v1/build'
        ) {
            await this._handleBuild(
                request,
                response
            );

            return;
        }

        if (
            request.method === 'POST' &&
            url.pathname ===
                '/v1/stage-firmware/restore'
        ) {
            await this._handleStageFirmwareRestore(
                request,
                response
            );

            return;
        }

        if (
            request.method === 'POST' &&
            url.pathname === '/v1/upload'
        ) {
            await this._handleUpload(
                request,
                response
            );

            return;
        }

        if (
            request.method === 'DELETE' &&
            url.pathname.startsWith(
                '/v1/build/'
            )
        ) {
            await this._handleDeleteBuild(
                url,
                response
            );

            return;
        }

        this._sendJson(
            response,
            404,
            {
                error: {
                    code: 'NOT_FOUND',
                    message:
                        'Hardware service endpoint not found'
                }
            }
        );
    }

    _validateClientRequest (request) {
        if (
            request.headers[
                'x-easyblox-client'
            ] !== 'scratch-gui'
        ) {
            throw new HardwareServiceError(
                'FORBIDDEN_REQUEST',
                'Hardware service client header is required'
            );
        }

        if (request.method === 'POST') {
            const contentType =
                request.headers[
                    'content-type'
                ] || '';

            if (
                !contentType
                    .toLowerCase()
                    .startsWith(
                        'application/json'
                    )
            ) {
                throw new HardwareServiceError(
                    'INVALID_CONTENT_TYPE',
                    'Hardware service requests must use JSON'
                );
            }
        }
    }

    async _handleBluetoothDevices (
        response
    ) {
        let transport;

        try {
            transport =
                this
                    ._bluetoothTransportFactory();
        } catch (error) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Bluetooth device discovery failed',
                {
                    cause: error
                }
            );
        }

        if (
            !transport ||
            typeof transport.listDevices !==
                'function'
        ) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Bluetooth device discovery failed'
            );
        }

        let devices;

        try {
            devices =
                await transport
                    .listDevices();
        } catch (error) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Bluetooth device discovery failed',
                {
                    cause: error
                }
            );
        }

        const publicDevices =
            Array.isArray(devices) ?
                devices
                    .filter(device =>
                        device &&
                        typeof device.id ===
                            'string' &&
                        device.id
                            .trim()
                            .length > 0
                    )
                    .map(device => ({
                        id:
                            device.id
                                .trim(),
                        label:
                            sanitizeBluetoothDeviceLabel(
                                device.label
                            )
                    })) :
                [];

        this._sendJson(
            response,
            200,
            {
                devices:
                    publicDevices
            }
        );
    }

    async _handleBluetoothDevices (
        response
    ) {
        let transport;

        try {
            transport =
                this
                    ._bluetoothTransportFactory();
        } catch (error) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Bluetooth device discovery failed',
                {
                    cause: error
                }
            );
        }

        if (
            !transport ||
            typeof transport.listDevices !==
                'function'
        ) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Bluetooth device discovery failed'
            );
        }

        let devices;

        try {
            devices =
                await transport
                    .listDevices();
        } catch (error) {
            throw new HardwareServiceError(
                'PORT_DISCOVERY_FAILED',
                'Bluetooth device discovery failed',
                {
                    cause: error
                }
            );
        }

        const publicDevices =
            Array.isArray(devices) ?
                devices
                    .filter(device =>
                        device &&
                        typeof device.id ===
                            'string' &&
                        device.id
                            .trim()
                            .length > 0
                    )
                    .map(device => ({
                        id:
                            device.id
                                .trim(),
                        label:
                            sanitizeBluetoothDeviceLabel(
                                device.label
                            )
                    })) :
                [];

        this._sendJson(
            response,
            200,
            {
                devices:
                    publicDevices
            }
        );
    }

    async _handleBuild (
        request,
        response
    ) {
        const body =
            await this._readJson(
                request
            );

        const artifact =
            await this._buildService.compile({
                boardId:
                    body.boardId,
                code:
                    body.code,
                supportFiles:
                    body.supportFiles
            });

        const buildId =
            randomUUID();

        this._builds.set(
            buildId,
            artifact
        );

        this._sendJson(
            response,
            201,
            {
                buildId,
                boardId:
                    artifact.boardId
            }
        );
    }

    async _handleUpload (
        request,
        response
    ) {
        const body =
            await this._readJson(
                request
            );

        if (
            !body ||
            typeof body.buildId !==
                'string' ||
            body.buildId.length === 0
        ) {
            throw new HardwareServiceError(
                'INVALID_REQUEST',
                'A valid build id is required'
            );
        }

        const artifact =
            this._builds.get(
                body.buildId
            );

        if (!artifact) {
            throw new HardwareServiceError(
                'BUILD_NOT_FOUND',
                'The compiled program was not found'
            );
        }

        let result;

        try {
            result =
                await this._uploadService.upload({
                    artifact,
                    portHint:
                        body.portHint
                });
        } finally {
            await this._cleanupBuild(
                body.buildId
            );
        }

        this._sendJson(
            response,
            200,
            {
                ok: true,
                ...result
            }
        );
    }

    async _handleStageFirmwareRestore (
        request,
        response
    ) {
        const body =
            await this._readJson(
                request
            );

        const result =
            await this._stageFirmwareManager
                .restore({
                    boardId:
                        body &&
                        body.boardId,
                    portHint:
                        body &&
                        body.portHint
                });

        this._sendJson(
            response,
            200,
            {
                ok: true,
                ...result
            }
        );
    }

    async _handleDeleteBuild (
        url,
        response
    ) {
        const buildId =
            decodeURIComponent(
                url.pathname.slice(
                    '/v1/build/'.length
                )
            );

        const cleaned =
            await this._cleanupBuild(
                buildId
            );

        this._sendJson(
            response,
            200,
            {
                cleaned
            }
        );
    }

    async _cleanupBuild (buildId) {
        const artifact =
            this._builds.get(
                buildId
            );

        if (!artifact) {
            return false;
        }

        this._builds.delete(
            buildId
        );

        try {
            await this._buildService.cleanup(
                artifact
            );
        } catch (error) {
            return false;
        }

        return true;
    }

    async _readJson (request) {
        const chunks = [];
        let length = 0;

        for await (
            const chunk of request
        ) {
            length += chunk.length;

            if (
                length >
                this._maxBodyBytes
            ) {
                throw new HardwareServiceError(
                    'INVALID_REQUEST',
                    'Hardware service request is too large'
                );
            }

            chunks.push(chunk);
        }

        try {
            return JSON.parse(
                Buffer.concat(chunks)
                    .toString('utf8')
            );
        } catch (error) {
            throw new HardwareServiceError(
                'INVALID_REQUEST',
                'Hardware service request contains invalid JSON',
                {
                    cause: error
                }
            );
        }
    }

    _hasBluetoothWebSocketProtocol (
        request
    ) {
        const header =
            request.headers[
                'sec-websocket-protocol'
            ];

        if (typeof header !== 'string') {
            return false;
        }

        return header
            .split(',')
            .map(protocol =>
                protocol.trim()
            )
            .includes(
                BLUETOOTH_WEBSOCKET_PROTOCOL
            );
    }

    _isAllowedOrigin (origin) {
        return (
            !origin ||
            this._allowedOrigins.has(
                origin
            )
        );
    }

    _isLoopbackHost (hostHeader) {
        if (
            typeof hostHeader !==
            'string'
        ) {
            return false;
        }

        const host =
            hostHeader
                .split(':')[0]
                .toLowerCase();

        return (
            host === '127.0.0.1' ||
            host === 'localhost'
        );
    }

    _applyCors (
        response,
        origin
    ) {
        if (!origin) {
            return;
        }

        response.setHeader(
            'Access-Control-Allow-Origin',
            origin
        );

        response.setHeader(
            'Vary',
            'Origin'
        );

        response.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, DELETE, OPTIONS'
        );

        response.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, X-EasyBlox-Client'
        );

        response.setHeader(
            'Access-Control-Max-Age',
            '600'
        );
    }

    _rejectUpgrade (
        socket,
        statusCode,
        statusText
    ) {
        if (
            !socket ||
            socket.destroyed
        ) {
            return;
        }

        socket.end(
            [
                `HTTP/1.1 ${statusCode} ${statusText}`,
                'Connection: close',
                'Content-Length: 0',
                '',
                ''
            ].join('\r\n')
        );
    }

    _sendError (
        response,
        error,
        origin
    ) {
        if (response.headersSent) {
            response.end();
            return;
        }

        if (
            this._isAllowedOrigin(
                origin
            )
        ) {
            this._applyCors(
                response,
                origin
            );
        }

        const normalized =
            error instanceof
                HardwareServiceError ?
                error :
                new HardwareServiceError(
                    'INTERNAL_ERROR',
                    'Hardware service request failed',
                    {
                        cause: error
                    }
                );

        this._sendJson(
            response,
            statusForErrorCode(
                normalized.code
            ),
            {
                error: {
                    code:
                        normalized.code,
                    message:
                        normalized.message
                }
            }
        );
    }

    _sendJson (
        response,
        statusCode,
        payload
    ) {
        response.statusCode =
            statusCode;

        response.setHeader(
            'Content-Type',
            'application/json; charset=utf-8'
        );

        response.end(
            JSON.stringify(payload)
        );
    }
}

module.exports = HardwareHttpServer;
module.exports.DEFAULT_ALLOWED_ORIGINS =
    DEFAULT_ALLOWED_ORIGINS;
