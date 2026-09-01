const assert =
    require('node:assert/strict');

const test =
    require('node:test');

const StageFirmwareManager =
    require('../src/stage-firmware-manager');

const StageFirmwareProvider =
    require('../src/stage-firmware-provider');

test(
    'StageFirmwareProvider loads the canonical Arduino UNO Stage firmware with a deterministic content version',
    async () => {
        const provider =
            new StageFirmwareProvider();

        const first =
            await provider.load(
                'arduino-uno'
            );

        const second =
            await provider.load(
                'arduino-uno'
            );

        assert.equal(
            first.boardId,
            'arduino-uno'
        );

        assert.match(
            first.code,
            /Serial\.begin\(115200\)/
        );

        assert.match(
            first.version,
            /^[a-f0-9]{64}$/
        );

        assert.equal(
            first.version,
            second.version
        );
    }
);

test(
    'StageFirmwareManager compiles the Stage firmware once and reuses the cached artifact for later restores',
    async () => {
        const artifact = {
            boardId:
                'arduino-uno',
            workspacePath:
                'cached-stage-artifact'
        };

        let compileCalls = 0;
        let uploadCalls = 0;
        let cleanupCalls = 0;

        const manager =
            new StageFirmwareManager({
                provider: {
                    load:
                        async () => ({
                            boardId:
                                'arduino-uno',
                            code:
                                'void setup() {} void loop() {}',
                            version:
                                'stage-v1'
                        })
                },

                buildService: {
                    compile:
                        async request => {
                            compileCalls += 1;

                            assert.equal(
                                request.boardId,
                                'arduino-uno'
                            );

                            return artifact;
                        },

                    cleanup:
                        async receivedArtifact => {
                            cleanupCalls += 1;

                            assert.equal(
                                receivedArtifact,
                                artifact
                            );

                            return true;
                        }
                },

                uploadService: {
                    upload:
                        async request => {
                            uploadCalls += 1;

                            assert.equal(
                                request.artifact,
                                artifact
                            );

                            return {
                                port:
                                    'COM11'
                            };
                        }
                }
            });

        const first =
            await manager.restore({
                boardId:
                    'arduino-uno',
                portHint: {
                    usbVendorId:
                        0x1A86,
                    usbProductId:
                        0x7523
                }
            });

        const second =
            await manager.restore({
                boardId:
                    'arduino-uno',
                portHint: {
                    usbVendorId:
                        0x1A86,
                    usbProductId:
                        0x7523
                }
            });

        assert.equal(
            compileCalls,
            1
        );

        assert.equal(
            uploadCalls,
            2
        );

        assert.equal(
            first.reusedBuild,
            false
        );

        assert.equal(
            second.reusedBuild,
            true
        );

        assert.equal(
            first.firmwareVersion,
            'stage-v1'
        );

        await manager.cleanup();

        assert.equal(
            cleanupCalls,
            1
        );
    }
);

test(
    'StageFirmwareManager invalidates the cached build when the canonical Stage firmware version changes',
    async () => {
        let firmwareVersion =
            'stage-v1';

        let compileCalls = 0;
        let cleanupCalls = 0;

        const manager =
            new StageFirmwareManager({
                provider: {
                    load:
                        async () => ({
                            boardId:
                                'arduino-uno',
                            code:
                                `// ${firmwareVersion}`,
                            version:
                                firmwareVersion
                        })
                },

                buildService: {
                    compile:
                        async request => {
                            compileCalls += 1;

                            return {
                                boardId:
                                    request.boardId,
                                workspacePath:
                                    `artifact-${compileCalls}`
                            };
                        },

                    cleanup:
                        async () => {
                            cleanupCalls += 1;
                            return true;
                        }
                },

                uploadService: {
                    upload:
                        async () => ({
                            port:
                                'COM11'
                        })
                }
            });

        await manager.restore({
            boardId:
                'arduino-uno',
            portHint: {
                usbVendorId:
                    0x1A86,
                usbProductId:
                    0x7523
            }
        });

        firmwareVersion =
            'stage-v2';

        const result =
            await manager.restore({
                boardId:
                    'arduino-uno',
                portHint: {
                    usbVendorId:
                        0x1A86,
                    usbProductId:
                        0x7523
                }
            });

        assert.equal(
            compileCalls,
            2
        );

        assert.equal(
            cleanupCalls,
            1
        );

        assert.equal(
            result.firmwareVersion,
            'stage-v2'
        );

        assert.equal(
            result.reusedBuild,
            false
        );

        await manager.cleanup();

        assert.equal(
            cleanupCalls,
            2
        );
    }
);
