const assert =
    require('node:assert/strict');
const fs =
    require('node:fs/promises');
const os =
    require('node:os');
const path =
    require('node:path');
const test =
    require('node:test');

const {
    prepareArduinoRuntime,
    resolveArduinoRuntimeRoot
} = require('../src/arduino-runtime');

test(
    'Arduino runtime remains optional for unpackaged development without an override',
    () => {
        assert.equal(
            resolveArduinoRuntimeRoot({
                isPackaged: false,
                resourcesPath:
                    'C:\\fake\\resources',
                env: {}
            }),
            null
        );
    }
);

test(
    'Arduino runtime uses the explicit environment override',
    () => {
        assert.equal(
            resolveArduinoRuntimeRoot({
                isPackaged: false,
                resourcesPath:
                    'C:\\fake\\resources',
                env: {
                    EASYBLOX_ARDUINO_RUNTIME_ROOT:
                        'C:\\EasyBlox\\runtime'
                }
            }),
            path.resolve(
                'C:\\EasyBlox\\runtime'
            )
        );
    }
);

test(
    'Packaged Arduino runtime resolves below Electron resources',
    () => {
        assert.equal(
            resolveArduinoRuntimeRoot({
                isPackaged: true,
                resourcesPath:
                    'C:\\EasyBlox\\resources',
                env: {}
            }),
            path.join(
                'C:\\EasyBlox\\resources',
                'easyblox-arduino-runtime'
            )
        );
    }
);

test(
    'Arduino runtime generates an isolated absolute CLI configuration',
    async t => {
        const temporaryRoot =
            await fs.mkdtemp(
                path.join(
                    os.tmpdir(),
                    'easyblox-desktop-runtime-test-'
                )
            );

        t.after(
            async () => {
                await fs.rm(
                    temporaryRoot,
                    {
                        force: true,
                        recursive: true
                    }
                );
            }
        );

        const runtimeRoot =
            path.join(
                temporaryRoot,
                'runtime'
            );

        const userDataPath =
            path.join(
                temporaryRoot,
                'user-data'
            );

        const cliPath =
            path.join(
                runtimeRoot,
                'bin',
                'arduino-cli.exe'
            );

        const dataPath =
            path.join(
                runtimeRoot,
                'data'
            );

        const stageFirmwarePath =
            path.join(
                runtimeRoot,
                'firmware',
                'arduino-uno',
                'stage.ino'
            );

        await fs.mkdir(
            path.dirname(
                cliPath
            ),
            {
                recursive: true
            }
        );

        await fs.mkdir(
            dataPath,
            {
                recursive: true
            }
        );

        await fs.mkdir(
            path.dirname(
                stageFirmwarePath
            ),
            {
                recursive: true
            }
        );

        await fs.writeFile(
            cliPath,
            'fake-cli',
            'utf8'
        );

        await fs.writeFile(
            stageFirmwarePath,
            'void setup() {}\nvoid loop() {}\n',
            'utf8'
        );

        const runtime =
            await prepareArduinoRuntime({
                isPackaged: false,
                resourcesPath:
                    'C:\\unused',
                userDataPath,
                env: {
                    EASYBLOX_ARDUINO_RUNTIME_ROOT:
                        runtimeRoot
                }
            });

        assert.equal(
            runtime.runtimeRoot,
            path.resolve(
                runtimeRoot
            )
        );

        assert.equal(
            runtime.cliPath,
            cliPath
        );

        assert.equal(
            runtime.dataPath,
            dataPath
        );

        assert.equal(
            runtime.stageFirmwarePath,
            stageFirmwarePath
        );

        const config =
            await fs.readFile(
                runtime.configPath,
                'utf8'
            );

        assert.match(
            config,
            /^directories:/m
        );

        assert.ok(
            config.includes(
                `  data: "${dataPath.replace(/\\/g, '/')}"`
            )
        );

        assert.ok(
            config.includes(
                `  downloads: "${runtime.downloadsPath.replace(/\\/g, '/')}"`
            )
        );

        assert.ok(
            config.includes(
                `  user: "${runtime.userPath.replace(/\\/g, '/')}"`
            )
        );

        assert.match(
            config,
            /skip_board_detection_calls: true/
        );

        const downloads =
            await fs.stat(
                runtime.downloadsPath
            );

        const user =
            await fs.stat(
                runtime.userPath
            );

        assert.equal(
            downloads.isDirectory(),
            true
        );

        assert.equal(
            user.isDirectory(),
            true
        );
    }
);

test(
    'Arduino runtime rejects an incomplete package',
    async t => {
        const temporaryRoot =
            await fs.mkdtemp(
                path.join(
                    os.tmpdir(),
                    'easyblox-desktop-runtime-invalid-'
                )
            );

        t.after(
            async () => {
                await fs.rm(
                    temporaryRoot,
                    {
                        force: true,
                        recursive: true
                    }
                );
            }
        );

        await assert.rejects(
            prepareArduinoRuntime({
                isPackaged: false,
                resourcesPath:
                    'C:\\unused',
                userDataPath:
                    path.join(
                        temporaryRoot,
                        'user-data'
                    ),
                env: {
                    EASYBLOX_ARDUINO_RUNTIME_ROOT:
                        path.join(
                            temporaryRoot,
                            'missing-runtime'
                        )
                }
            }),
            /EasyBlox Arduino runtime is incomplete: arduino-cli\.exe/
        );
    }
);
