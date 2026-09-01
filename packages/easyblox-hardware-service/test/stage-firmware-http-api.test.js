const assert =
    require('node:assert/strict');

const test =
    require('node:test');

const HardwareHttpServer =
    require('../src/http-server');

test(
    'HTTP service restores the Stage firmware without exposing native artifact details to the browser',
    async () => {
        let restoreRequest = null;
        let cleanupCalled = false;

        const stageFirmwareManager = {
            restore:
                async request => {
                    restoreRequest =
                        request;

                    return {
                        boardId:
                            'arduino-uno',
                        firmwareVersion:
                            'stage-v1',
                        reusedBuild:
                            false,
                        port:
                            'COM11'
                    };
                },

            cleanup:
                async () => {
                    cleanupCalled = true;
                }
        };

        const server =
            new HardwareHttpServer({
                port: 0,

                buildService: {
                    cleanup:
                        async () => true
                },

                uploadService: {},

                stageFirmwareManager
            });

        const address =
            await server.listen();

        const response =
            await fetch(
                `http://${address.host}:${address.port}/v1/stage-firmware/restore`,
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'X-EasyBlox-Client':
                            'scratch-gui',

                        Origin:
                            'http://localhost:8601'
                    },

                    body:
                        JSON.stringify({
                            boardId:
                                'arduino-uno',

                            portHint: {
                                usbVendorId:
                                    0x1A86,

                                usbProductId:
                                    0x7523
                            }
                        })
                }
            );

        const body =
            await response.json();

        assert.equal(
            response.status,
            200
        );

        assert.deepEqual(
            restoreRequest,
            {
                boardId:
                    'arduino-uno',

                portHint: {
                    usbVendorId:
                        0x1A86,

                    usbProductId:
                        0x7523
                }
            }
        );

        assert.deepEqual(
            body,
            {
                ok:
                    true,
                boardId:
                    'arduino-uno',
                firmwareVersion:
                    'stage-v1',
                reusedBuild:
                    false,
                port:
                    'COM11'
            }
        );

        assert.equal(
            Object.hasOwn(
                body,
                'artifact'
            ),
            false
        );

        assert.equal(
            Object.hasOwn(
                body,
                'workspacePath'
            ),
            false
        );

        await server.close();

        assert.equal(
            cleanupCalled,
            true
        );
    }
);
