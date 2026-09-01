const assert =
    require('node:assert/strict');
const test =
    require('node:test');

const {
    HardwareServiceError,
    PortDiscovery,
    UploadService
} = require('../src');

const FAKE_CLI =
    'C:\\tools\\arduino-cli.exe';

const ARTIFACT = Object.freeze({
    boardId: 'arduino-uno',
    fqbn: 'arduino:avr:uno',
    buildPath:
        'C:\\temp\\easyblox\\build',
    sketchDirectory:
        'C:\\temp\\easyblox\\EasyBloxUpload'
});

const createBoardListResult =
    ports => ({
        exitCode: 0,
        stdout: JSON.stringify({
            detected_ports:
                ports.map(port => ({
                    port
                }))
        }),
        stderr: ''
    });

const COM1 = {
    address: 'COM1',
    label: 'COM1',
    protocol: 'serial',
    properties: {}
};

const COM11 = {
    address: 'COM11',
    label: 'COM11',
    protocol: 'serial',
    properties: {
        vid: '0x1A86',
        pid: '0x7523',
        serialNumber: ''
    }
};

const createToolchainProvider =
    () => ({
        resolve: boardId => ({
            boardId,
            fqbn: 'arduino:avr:uno',
            coreId: 'arduino:avr',
            cliPath: FAKE_CLI
        })
    });

test(
    'PortDiscovery resolves an explicit port address',
    async () => {
        const discovery =
            new PortDiscovery({
                processRunner:
                    async () =>
                        createBoardListResult(
                            [
                                COM1,
                                COM11
                            ]
                        )
            });

        const port =
            await discovery.resolve({
                cliPath: FAKE_CLI,
                hint: {
                    address: 'COM11'
                }
            });

        assert.equal(
            port.address,
            'COM11'
        );
    }
);

test(
    'PortDiscovery correlates Web Serial USB VID and PID with Arduino CLI ports',
    async () => {
        const discovery =
            new PortDiscovery({
                processRunner:
                    async () =>
                        createBoardListResult(
                            [
                                COM1,
                                COM11
                            ]
                        )
            });

        const port =
            await discovery.resolve({
                cliPath: FAKE_CLI,
                hint: {
                    usbVendorId: 0x1A86,
                    usbProductId: 0x7523
                }
            });

        assert.equal(
            port.address,
            'COM11'
        );
    }
);

test(
    'PortDiscovery rejects an ambiguous USB match instead of selecting the first COM port',
    async () => {
        const discovery =
            new PortDiscovery({
                processRunner:
                    async () =>
                        createBoardListResult(
                            [
                                COM11,
                                {
                                    ...COM11,
                                    address: 'COM12',
                                    label: 'COM12'
                                }
                            ]
                        )
            });

        await assert.rejects(
            discovery.resolve({
                cliPath: FAKE_CLI,
                hint: {
                    usbVendorId:
                        '0x1A86',
                    usbProductId:
                        '0x7523'
                }
            }),
            error => {
                assert.ok(
                    error instanceof
                    HardwareServiceError
                );

                assert.equal(
                    error.code,
                    'PORT_AMBIGUOUS'
                );

                return true;
            }
        );
    }
);

test(
    'PortDiscovery reports when the selected USB device is absent',
    async () => {
        const discovery =
            new PortDiscovery({
                processRunner:
                    async () =>
                        createBoardListResult(
                            [COM1]
                        )
            });

        await assert.rejects(
            discovery.resolve({
                cliPath: FAKE_CLI,
                hint: {
                    usbVendorId:
                        0x1A86,
                    usbProductId:
                        0x7523
                }
            }),
            error => {
                assert.equal(
                    error.code,
                    'PORT_NOT_FOUND'
                );

                return true;
            }
        );
    }
);

test(
    'UploadService uploads the existing build artifact without recompiling it',
    async () => {
        const calls = [];

        const uploadService =
            new UploadService({
                toolchainProvider:
                    createToolchainProvider(),
                portDiscovery: {
                    resolve:
                        async () => ({
                            ...COM11
                        })
                },
                processRunner:
                    async (
                        file,
                        args
                    ) => {
                        calls.push({
                            file,
                            args
                        });

                        return {
                            exitCode: 0,
                            stdout: 'uploaded',
                            stderr: ''
                        };
                    }
            });

        const result =
            await uploadService.upload({
                artifact: ARTIFACT,
                portHint: {
                    usbVendorId:
                        0x1A86,
                    usbProductId:
                        0x7523
                }
            });

        assert.equal(
            calls.length,
            1
        );

        assert.equal(
            calls[0].file,
            FAKE_CLI
        );

        assert.deepEqual(
            calls[0].args,
            [
                'upload',
                '--fqbn',
                'arduino:avr:uno',
                '--port',
                'COM11',
                '--protocol',
                'serial',
                '--input-dir',
                ARTIFACT.buildPath,
                ARTIFACT.sketchDirectory
            ]
        );

        assert.deepEqual(
            result,
            {
                boardId:
                    'arduino-uno',
                fqbn:
                    'arduino:avr:uno',
                port:
                    'COM11',
                protocol:
                    'serial'
            }
        );
    }
);

test(
    'UploadService translates an occupied Windows serial port without exposing raw stderr in the message',
    async () => {
        const processRunner =
            async () => {
                const error =
                    new Error(
                        'process failed'
                    );

                error.code = 1;
                error.stderr =
                    'avrdude: ser_open(): can\'t open device "\\\\.\\COM11": Access is denied.';

                throw error;
            };

        const uploadService =
            new UploadService({
                toolchainProvider:
                    createToolchainProvider(),
                portDiscovery: {
                    resolve:
                        async () => ({
                            ...COM11
                        })
                },
                processRunner
            });

        await assert.rejects(
            uploadService.upload({
                artifact: ARTIFACT,
                portHint: {
                    address: 'COM11'
                }
            }),
            error => {
                assert.equal(
                    error.code,
                    'PORT_BUSY'
                );

                assert.equal(
                    error.message,
                    'The serial port is busy'
                );

                assert.equal(
                    error.message.includes(
                        'Access is denied'
                    ),
                    false
                );

                assert.match(
                    error.technicalDetails.stderr,
                    /Access is denied/
                );

                return true;
            }
        );
    }
);

test(
    'UploadService translates an Arduino bootloader synchronization failure',
    async () => {
        const processRunner =
            async () => {
                const error =
                    new Error(
                        'process failed'
                    );

                error.code = 1;
                error.stderr =
                    'avrdude: stk500_recv(): programmer is not responding';

                throw error;
            };

        const uploadService =
            new UploadService({
                toolchainProvider:
                    createToolchainProvider(),
                portDiscovery: {
                    resolve:
                        async () => ({
                            ...COM11
                        })
                },
                processRunner
            });

        await assert.rejects(
            uploadService.upload({
                artifact: ARTIFACT,
                portHint: {
                    address: 'COM11'
                }
            }),
            error => {
                assert.equal(
                    error.code,
                    'BOARD_NOT_RESPONDING'
                );

                return true;
            }
        );
    }
);
