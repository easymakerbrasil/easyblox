const assert =
    require('node:assert/strict');
const fs =
    require('node:fs/promises');
const path =
    require('node:path');
const test =
    require('node:test');

const {
    BuildService,
    HardwareServiceError,
    ToolchainProvider,
    runProcess
} = require('../src');

const FAKE_CLI =
    'C:\\tools\\arduino-cli.exe';

const GENERATED_CODE = [
    '#include <Arduino.h>',
    '',
    'void setup() {',
    '    pinMode(13, OUTPUT);',
    '}',
    '',
    'void loop() {',
    '    digitalWrite(13, HIGH);',
    '}',
    ''
].join('\n');

const createResolvedToolchainProvider =
    () => ({
        resolve: boardId => ({
            boardId,
            fqbn: 'arduino:avr:uno',
            coreId: 'arduino:avr',
            cliPath: FAKE_CLI
        })
    });

test(
    'ToolchainProvider resolves Arduino UNO without exposing FQBN to the GUI',
    () => {
        const provider =
            new ToolchainProvider({
                cliPath: FAKE_CLI,
                env: {},
                platform: 'win32',
                existsSync:
                    candidate =>
                        candidate ===
                        FAKE_CLI
            });

        assert.deepEqual(
            provider.resolve(
                'arduino-uno'
            ),
            {
                boardId: 'arduino-uno',
                fqbn: 'arduino:avr:uno',
                coreId: 'arduino:avr',
                cliPath: FAKE_CLI
            }
        );
    }
);

test(
    'ToolchainProvider rejects unsupported boards semantically',
    () => {
        const provider =
            new ToolchainProvider({
                cliPath: FAKE_CLI,
                env: {},
                platform: 'win32',
                existsSync: () => true
            });

        assert.throws(
            () => provider.resolve(
                'unknown-board'
            ),
            error => {
                assert.ok(
                    error instanceof
                    HardwareServiceError
                );

                assert.equal(
                    error.code,
                    'UNSUPPORTED_BOARD'
                );

                return true;
            }
        );
    }
);

test(
    'ToolchainProvider reports a missing Arduino CLI semantically',
    () => {
        const provider =
            new ToolchainProvider({
                env: {},
                platform: 'linux',
                existsSync: () => false
            });

        assert.throws(
            () => provider.resolve(
                'arduino-uno'
            ),
            error => {
                assert.ok(
                    error instanceof
                    HardwareServiceError
                );

                assert.equal(
                    error.code,
                    'TOOLCHAIN_NOT_FOUND'
                );

                return true;
            }
        );
    }
);

test(
    'process runner executes an executable directly without a shell',
    async () => {
        const result =
            await runProcess(
                process.execPath,
                [
                    '-e',
                    'process.stdout.write("easyblox-ok")'
                ]
            );

        assert.equal(
            result.exitCode,
            0
        );

        assert.equal(
            result.stdout,
            'easyblox-ok'
        );
    }
);

test(
    'BuildService writes the canonical C++ and invokes Arduino CLI compile with an isolated artifact',
    async () => {
        const calls = [];

        const processRunner =
            async (
                file,
                args
            ) => {
                calls.push({
                    file,
                    args
                });

                const sketchDirectory =
                    args[
                        args.length - 1
                    ];

                const sketchPath =
                    path.join(
                        sketchDirectory,
                        'EasyBloxUpload.ino'
                    );

                const writtenCode =
                    await fs.readFile(
                        sketchPath,
                        'utf8'
                    );

                assert.equal(
                    writtenCode,
                    GENERATED_CODE
                );

                return {
                    exitCode: 0,
                    stdout: 'compiled',
                    stderr: ''
                };
            };

        const service =
            new BuildService({
                toolchainProvider:
                    createResolvedToolchainProvider(),
                processRunner
            });

        const artifact =
            await service.compile({
                boardId: 'arduino-uno',
                code: GENERATED_CODE
            });

        assert.equal(
            artifact.boardId,
            'arduino-uno'
        );

        assert.equal(
            artifact.fqbn,
            'arduino:avr:uno'
        );

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
                'compile',
                '--fqbn',
                'arduino:avr:uno',
                '--output-dir',
                artifact.buildPath,
                artifact.sketchDirectory
            ]
        );

        await fs.access(
            artifact.sketchPath
        );

        await fs.access(
            artifact.buildPath
        );

        assert.equal(
            await service.cleanup(
                artifact
            ),
            true
        );

        await assert.rejects(
            fs.access(
                artifact.workspacePath
            )
        );

        assert.equal(
            await service.cleanup(
                artifact
            ),
            false
        );
    }
);

test(
    'BuildService rejects an empty source before invoking the toolchain',
    async () => {
        let providerCalled = false;

        const service =
            new BuildService({
                toolchainProvider: {
                    resolve: () => {
                        providerCalled = true;

                        return {};
                    }
                }
            });

        await assert.rejects(
            service.compile({
                boardId: 'arduino-uno',
                code: '   '
            }),
            error => {
                assert.equal(
                    error.code,
                    'INVALID_BUILD_REQUEST'
                );

                return true;
            }
        );

        assert.equal(
            providerCalled,
            false
        );
    }
);

test(
    'BuildService cleans failed builds and keeps technical stderr out of the semantic message',
    async () => {
        let failedWorkspacePath;

        const processRunner =
            async (
                file,
                args
            ) => {
                assert.equal(
                    file,
                    FAKE_CLI
                );

                const sketchDirectory =
                    args[
                        args.length - 1
                    ];

                failedWorkspacePath =
                    path.dirname(
                        sketchDirectory
                    );

                const error =
                    new Error(
                        'process failed'
                    );

                error.code = 1;
                error.stdout =
                    'technical stdout';
                error.stderr =
                    'technical compiler failure';

                throw error;
            };

        const service =
            new BuildService({
                toolchainProvider:
                    createResolvedToolchainProvider(),
                processRunner
            });

        await assert.rejects(
            service.compile({
                boardId: 'arduino-uno',
                code: GENERATED_CODE
            }),
            error => {
                assert.ok(
                    error instanceof
                    HardwareServiceError
                );

                assert.equal(
                    error.code,
                    'BUILD_FAILED'
                );

                assert.equal(
                    error.message,
                    'Arduino build failed'
                );

                assert.equal(
                    error.message.includes(
                        'technical compiler failure'
                    ),
                    false
                );

                assert.equal(
                    error.technicalDetails.stderr,
                    'technical compiler failure'
                );

                return true;
            }
        );

        assert.ok(
            failedWorkspacePath
        );

        await assert.rejects(
            fs.access(
                failedWorkspacePath
            )
        );
    }
);
