const HardwareServiceError =
    require('./hardware-service-error');
const PortDiscovery =
    require('./port-discovery');
const ToolchainProvider =
    require('./toolchain-provider');
const runProcess =
    require('./process-runner');

class UploadService {
    constructor (options = {}) {
        this._toolchainProvider =
            options.toolchainProvider ||
            new ToolchainProvider();

        this._portDiscovery =
            options.portDiscovery ||
            new PortDiscovery();

        this._processRunner =
            options.processRunner ||
            runProcess;
    }

    async upload (request) {
        const artifact =
            request &&
            request.artifact;

        const portHint =
            request &&
            request.portHint;

        this._validateArtifact(
            artifact
        );

        const toolchain =
            this._toolchainProvider.resolve(
                artifact.boardId
            );

        if (
            artifact.fqbn !==
            toolchain.fqbn
        ) {
            throw new HardwareServiceError(
                'INVALID_UPLOAD_ARTIFACT',
                'Build artifact does not match the selected board'
            );
        }

        const port =
            await this._portDiscovery.resolve({
                cliPath:
                    toolchain.cliPath,
                hint:
                    portHint
            });

        const protocol =
            port.protocol || 'serial';

        try {
            await this._processRunner(
                toolchain.cliPath,
                [
                    'upload',
                    '--fqbn',
                    toolchain.fqbn,
                    '--port',
                    port.address,
                    '--protocol',
                    protocol,
                    '--input-dir',
                    artifact.buildPath,
                    artifact.sketchDirectory
                ]
            );
        } catch (error) {
            throw this._translateUploadError(
                error
            );
        }

        return Object.freeze({
            boardId:
                artifact.boardId,
            fqbn:
                artifact.fqbn,
            port:
                port.address,
            protocol
        });
    }

    _validateArtifact (artifact) {
        if (
            !artifact ||
            typeof artifact !== 'object' ||
            typeof artifact.boardId !==
                'string' ||
            typeof artifact.fqbn !==
                'string' ||
            typeof artifact.buildPath !==
                'string' ||
            typeof artifact.sketchDirectory !==
                'string'
        ) {
            throw new HardwareServiceError(
                'INVALID_UPLOAD_ARTIFACT',
                'A valid build artifact is required'
            );
        }
    }

    _translateUploadError (error) {
        const stdout =
            typeof error.stdout ===
                'string' ?
                error.stdout :
                '';

        const stderr =
            typeof error.stderr ===
                'string' ?
                error.stderr :
                '';

        const diagnostic =
            `${stdout}\n${stderr}`;

        let code =
            'UPLOAD_FAILED';

        let message =
            'Arduino upload failed';

        if (
            /access is denied|permission denied|resource busy|device or resource busy/i
                .test(diagnostic)
        ) {
            code =
                'PORT_BUSY';

            message =
                'The serial port is busy';
        } else if (
            /programmer is not responding|not in sync|stk500_recv|stk500_getsync/i
                .test(diagnostic)
        ) {
            code =
                'BOARD_NOT_RESPONDING';

            message =
                'The Arduino board is not responding';
        } else if (
            /no such file|cannot find the file|does not exist/i
                .test(diagnostic)
        ) {
            code =
                'PORT_NOT_FOUND';

            message =
                'The selected serial port was not found';
        }

        return new HardwareServiceError(
            code,
            message,
            {
                cause: error,
                technicalDetails: {
                    exitCode:
                        typeof error.code ===
                        'number' ?
                            error.code :
                            null,
                    processCode:
                        typeof error.code ===
                        'string' ?
                            error.code :
                            null,
                    stdout,
                    stderr
                }
            }
        );
    }
}

module.exports = UploadService;
