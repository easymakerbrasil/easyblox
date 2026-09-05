const assert =
    require('node:assert/strict');
const http =
    require('node:http');
const test =
    require('node:test');

const {
    HardwareHttpServer,
    HardwareServiceError
} = require('../src');

const ORIGIN =
    'http://localhost:8601';

const requestJson = options =>
    new Promise(
        (resolve, reject) => {
            const body =
                options.body === undefined ?
                    null :
                    JSON.stringify(
                        options.body
                    );

            const headers = {
                Origin:
                    options.origin ===
                    undefined ?
                        ORIGIN :
                        options.origin
            };

            if (
                options.client !==
                false
            ) {
                headers[
                    'X-EasyBlox-Client'
                ] = 'scratch-gui';
            }

            if (body !== null) {
                headers[
                    'Content-Type'
                ] = 'application/json';

                headers[
                    'Content-Length'
                ] = Buffer.byteLength(
                    body
                );
            }

            const request =
                http.request(
                    {
                        hostname:
                            '127.0.0.1',
                        port:
                            options.port,
                        path:
                            options.path,
                        method:
                            options.method ||
                            'GET',
                        headers
                    },
                    response => {
                        const chunks = [];

                        response.on(
                            'data',
                            chunk => {
                                chunks.push(
                                    chunk
                                );
                            }
                        );

                        response.on(
                            'end',
                            () => {
                                const text =
                                    Buffer.concat(
                                        chunks
                                    )
                                        .toString(
                                            'utf8'
                                        );

                                resolve({
                                    statusCode:
                                        response.statusCode,
                                    headers:
                                        response.headers,
                                    body:
                                        text ?
                                            JSON.parse(
                                                text
                                            ) :
                                            null
                                });
                            }
                        );
                    }
                );

            request.on(
                'error',
                reject
            );

            if (body !== null) {
                request.write(body);
            }

            request.end();
        }
    );

const startServer =
    async options => {
        const server =
            new HardwareHttpServer({
                ...options,
                port: 0
            });

        const address =
            await server.listen();

        return {
            server,
            port:
                address.port
        };
    };

test(
    'HTTP service exposes a loopback health endpoint',
    async () => {
        const {
            server,
            port
        } = await startServer();

        try {
            const response =
                await requestJson({
                    port,
                    path:
                        '/v1/health'
                });

            assert.equal(
                response.statusCode,
                200
            );

            assert.equal(
                response.body.ok,
                true
            );

            assert.equal(
                response.body.service,
                'easyblox-hardware-service'
            );
        } finally {
            await server.close();
        }
    }
);

test(
    'HTTP service exposes Bluetooth devices without public COM labels',
    async () => {
        const {
            server,
            port
        } = await startServer({
            bluetoothTransportFactory:
                () => ({
                    listDevices:
                        async () => [
                            {
                                id:
                                    'COM12',
                                label:
                                    'Serial Padrão por link Bluetooth (COM12)'
                            },
                            {
                                id:
                                    'COM13',
                                label:
                                    'HC-06'
                            }
                        ]
                })
        });

        try {
            const response =
                await requestJson({
                    port,
                    path:
                        '/v1/bluetooth/devices'
                });

            assert.equal(
                response.statusCode,
                200
            );

            assert.deepEqual(
                response.body,
                {
                    devices: [
                        {
                            id:
                                'COM12',
                            label:
                                'Serial Padrão por link Bluetooth'
                        },
                        {
                            id:
                                'COM13',
                            label:
                                'HC-06'
                        }
                    ]
                }
            );

            assert.equal(
                response.body.devices.some(
                    device =>
                        /COM\d+/i.test(
                            device.label
                        )
                ),
                false
            );
        } finally {
            await server.close();
        }
    }
);

test(
    'HTTP service rejects browser requests from an unapproved origin',
    async () => {
        const {
            server,
            port
        } = await startServer();

        try {
            const response =
                await requestJson({
                    port,
                    path:
                        '/v1/build',
                    method:
                        'POST',
                    origin:
                        'https://example.com',
                    body: {
                        boardId:
                            'arduino-uno',
                        code:
                            'void setup(){}'
                    }
                });

            assert.equal(
                response.statusCode,
                403
            );

            assert.equal(
                response.body.error.code,
                'FORBIDDEN_REQUEST'
            );
        } finally {
            await server.close();
        }
    }
);

test(
    'HTTP build and upload reuse one compiled artifact and clean it afterwards',
    async () => {
        const compileCalls = [];
        const cleanupCalls = [];
        const uploadCalls = [];

        const artifact = {
            boardId:
                'arduino-uno',
            fqbn:
                'arduino:avr:uno',
            buildPath:
                'C:\\temp\\build',
            sketchDirectory:
                'C:\\temp\\EasyBloxUpload'
        };

        const buildService = {
            compile:
                async request => {
                    compileCalls.push(
                        request
                    );

                    return artifact;
                },
            cleanup:
                async value => {
                    cleanupCalls.push(
                        value
                    );

                    return true;
                }
        };

        const uploadService = {
            upload:
                async request => {
                    uploadCalls.push(
                        request
                    );

                    return {
                        boardId:
                            'arduino-uno',
                        fqbn:
                            'arduino:avr:uno',
                        port:
                            'COM11',
                        protocol:
                            'serial'
                    };
                }
        };

        const {
            server,
            port
        } = await startServer({
            buildService,
            uploadService
        });

        try {
            const buildResponse =
                await requestJson({
                    port,
                    path:
                        '/v1/build',
                    method:
                        'POST',
                    body: {
                        boardId:
                            'arduino-uno',
                        code:
                            'void setup(){}',
                        supportFiles: [
                            {
                                name:
                                    'EasyBlox.h',
                                content:
                                    '#pragma once\n'
                            }
                        ]
                    }
                });

            assert.equal(
                buildResponse.statusCode,
                201
            );

            assert.equal(
                typeof buildResponse.body
                    .buildId,
                'string'
            );

            const uploadResponse =
                await requestJson({
                    port,
                    path:
                        '/v1/upload',
                    method:
                        'POST',
                    body: {
                        buildId:
                            buildResponse.body
                                .buildId,
                        portHint: {
                            usbVendorId:
                                0x1A86,
                            usbProductId:
                                0x7523
                        }
                    }
                });

            assert.equal(
                uploadResponse.statusCode,
                200
            );

            assert.equal(
                uploadResponse.body.port,
                'COM11'
            );

            assert.deepEqual(
                compileCalls[0],
                {
                    boardId:
                        'arduino-uno',
                    code:
                        'void setup(){}',
                    supportFiles: [
                        {
                            name:
                                'EasyBlox.h',
                            content:
                                '#pragma once\n'
                        }
                    ]
                }
            );

            assert.equal(
                uploadCalls.length,
                1
            );

            assert.equal(
                uploadCalls[0].artifact,
                artifact
            );

            assert.equal(
                cleanupCalls.length,
                1
            );

            assert.equal(
                cleanupCalls[0],
                artifact
            );
        } finally {
            await server.close();
        }
    }
);

test(
    'HTTP service allows an abandoned build to be cleaned explicitly',
    async () => {
        let cleanupCount = 0;

        const buildService = {
            compile:
                async () => ({
                    boardId:
                        'arduino-uno'
                }),
            cleanup:
                async () => {
                    cleanupCount++;

                    return true;
                }
        };

        const {
            server,
            port
        } = await startServer({
            buildService
        });

        try {
            const buildResponse =
                await requestJson({
                    port,
                    path:
                        '/v1/build',
                    method:
                        'POST',
                    body: {
                        boardId:
                            'arduino-uno',
                        code:
                            'void setup(){}'
                    }
                });

            const deleteResponse =
                await requestJson({
                    port,
                    path:
                        `/v1/build/${buildResponse.body.buildId}`,
                    method:
                        'DELETE'
                });

            assert.equal(
                deleteResponse.statusCode,
                200
            );

            assert.equal(
                deleteResponse.body.cleaned,
                true
            );

            assert.equal(
                cleanupCount,
                1
            );
        } finally {
            await server.close();
        }
    }
);

test(
    'HTTP service never exposes technical compiler stderr to browser clients',
    async () => {
        const buildService = {
            compile:
                async () => {
                    throw new HardwareServiceError(
                        'BUILD_FAILED',
                        'Arduino build failed',
                        {
                            technicalDetails: {
                                stderr:
                                    'SECRET TECHNICAL STDERR'
                            }
                        }
                    );
                },
            cleanup:
                async () =>
                    true
        };

        const {
            server,
            port
        } = await startServer({
            buildService
        });

        try {
            const response =
                await requestJson({
                    port,
                    path:
                        '/v1/build',
                    method:
                        'POST',
                    body: {
                        boardId:
                            'arduino-uno',
                        code:
                            'invalid'
                    }
                });

            assert.equal(
                response.statusCode,
                422
            );

            assert.deepEqual(
                response.body,
                {
                    error: {
                        code:
                            'BUILD_FAILED',
                        message:
                            'Arduino build failed'
                    }
                }
            );

            assert.equal(
                JSON.stringify(
                    response.body
                ).includes(
                    'SECRET TECHNICAL STDERR'
                ),
                false
            );
        } finally {
            await server.close();
        }
    }
);
