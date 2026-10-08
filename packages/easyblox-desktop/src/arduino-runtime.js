const fs = require('node:fs/promises');
const path = require('node:path');

const RUNTIME_DIRECTORY =
    'easyblox-arduino-runtime';

const RUNTIME_ENVIRONMENT_VARIABLE =
    'EASYBLOX_ARDUINO_RUNTIME_ROOT';

const toYamlPath =
    value =>
        value
            .replace(/\\/g, '/')
            .replace(/"/g, '\\"');

const resolveArduinoRuntimeRoot =
    ({
        isPackaged,
        resourcesPath,
        env = process.env
    }) => {
        const explicitRoot =
            env[
                RUNTIME_ENVIRONMENT_VARIABLE
            ];

        if (
            typeof explicitRoot === 'string' &&
            explicitRoot.trim().length > 0
        ) {
            return path.resolve(
                explicitRoot.trim()
            );
        }

        if (!isPackaged) {
            return null;
        }

        return path.join(
            resourcesPath,
            RUNTIME_DIRECTORY
        );
    };

const assertPathExists =
    async (
        candidate,
        label
    ) => {
        try {
            await fs.access(
                candidate
            );
        } catch (error) {
            const runtimeError =
                new Error(
                    `EasyBlox Arduino runtime is incomplete: ${label}`
                );

            runtimeError.cause =
                error;

            throw runtimeError;
        }
    };

const prepareArduinoRuntime =
    async ({
        isPackaged,
        resourcesPath,
        userDataPath,
        env = process.env
    }) => {
        const runtimeRoot =
            resolveArduinoRuntimeRoot({
                isPackaged,
                resourcesPath,
                env
            });

        if (!runtimeRoot) {
            return null;
        }

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

        await assertPathExists(
            cliPath,
            'arduino-cli.exe'
        );

        await assertPathExists(
            dataPath,
            'Arduino data directory'
        );

        await assertPathExists(
            stageFirmwarePath,
            'Arduino UNO Stage firmware'
        );

        const stateRoot =
            path.join(
                userDataPath,
                'arduino-runtime'
            );

        const downloadsPath =
            path.join(
                stateRoot,
                'downloads'
            );

        const userPath =
            path.join(
                stateRoot,
                'user'
            );

        const configPath =
            path.join(
                stateRoot,
                'arduino-cli.yaml'
            );

        await fs.mkdir(
            downloadsPath,
            {
                recursive: true
            }
        );

        await fs.mkdir(
            userPath,
            {
                recursive: true
            }
        );

        const config = [
            'directories:',
            `  data: "${toYamlPath(dataPath)}"`,
            `  downloads: "${toYamlPath(downloadsPath)}"`,
            `  user: "${toYamlPath(userPath)}"`,
            'network:',
            '  cloud_api:',
            '    skip_board_detection_calls: true',
            ''
        ].join('\n');

        await fs.writeFile(
            configPath,
            config,
            'utf8'
        );

        return Object.freeze({
            runtimeRoot,
            cliPath,
            configPath,
            dataPath,
            downloadsPath,
            userPath,
            stageFirmwarePath
        });
    };

module.exports = {
    RUNTIME_DIRECTORY,
    RUNTIME_ENVIRONMENT_VARIABLE,
    prepareArduinoRuntime,
    resolveArduinoRuntimeRoot
};
