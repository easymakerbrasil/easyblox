const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const HardwareServiceError =
    require('./hardware-service-error');
const ToolchainProvider =
    require('./toolchain-provider');
const runProcess =
    require('./process-runner');

const SKETCH_NAME = 'EasyBloxUpload';

class BuildService {
    constructor (options = {}) {
        this._toolchainProvider =
            options.toolchainProvider ||
            new ToolchainProvider();

        this._processRunner =
            options.processRunner ||
            runProcess;

        this._fs = options.fsApi || fs;
        this._tmpdir =
            options.tmpdir || os.tmpdir;

        this._ownedWorkspaces = new Set();
    }

    async compile (request) {
        const boardId =
            request && request.boardId;
        const code =
            request && request.code;

        const supportFiles =
            request &&
            typeof request.supportFiles !==
                'undefined' ?
                request.supportFiles :
                [];

        this._validateRequest(
            boardId,
            code,
            supportFiles
        );

        const toolchain =
            this._toolchainProvider.resolve(
                boardId
            );

        let workspacePath = null;

        try {
            workspacePath =
                await this._fs.mkdtemp(
                    path.join(
                        this._tmpdir(),
                        'easyblox-build-'
                    )
                );

            this._ownedWorkspaces.add(
                workspacePath
            );

            const sketchDirectory =
                path.join(
                    workspacePath,
                    SKETCH_NAME
                );

            const sketchPath =
                path.join(
                    sketchDirectory,
                    `${SKETCH_NAME}.ino`
                );

            const buildPath =
                path.join(
                    workspacePath,
                    'build'
                );

            await this._fs.mkdir(
                sketchDirectory,
                {
                    recursive: true
                }
            );

            await this._fs.mkdir(
                buildPath,
                {
                    recursive: true
                }
            );

            await this._fs.writeFile(
                sketchPath,
                code,
                'utf8'
            );

            for (
                const supportFile
                of supportFiles
            ) {
                await this._fs.writeFile(
                    path.join(
                        sketchDirectory,
                        supportFile.name
                    ),
                    supportFile.content,
                    'utf8'
                );
            }

            await this._processRunner(
                toolchain.cliPath,
                [
                    'compile',
                    '--fqbn',
                    toolchain.fqbn,
                    '--output-dir',
                    buildPath,
                    sketchDirectory
                ]
            );

            return Object.freeze({
                boardId,
                fqbn: toolchain.fqbn,
                coreId: toolchain.coreId,
                workspacePath,
                sketchDirectory,
                sketchPath,
                buildPath
            });
        } catch (error) {
            if (workspacePath) {
                await this._removeWorkspace(
                    workspacePath
                );
            }

            if (
                error instanceof
                HardwareServiceError
            ) {
                throw error;
            }

            throw new HardwareServiceError(
                'BUILD_FAILED',
                'Arduino build failed',
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
                        stdout:
                            typeof error.stdout ===
                            'string' ?
                                error.stdout :
                                '',
                        stderr:
                            typeof error.stderr ===
                            'string' ?
                                error.stderr :
                                ''
                    }
                }
            );
        }
    }

    async cleanup (artifact) {
        if (
            !artifact ||
            typeof artifact.workspacePath !==
                'string' ||
            !this._ownedWorkspaces.has(
                artifact.workspacePath
            )
        ) {
            return false;
        }

        await this._removeWorkspace(
            artifact.workspacePath
        );

        return true;
    }

    _validateRequest (
        boardId,
        code,
        supportFiles
    ) {
        if (
            typeof boardId !== 'string' ||
            boardId.length === 0
        ) {
            throw new HardwareServiceError(
                'INVALID_BUILD_REQUEST',
                'Build requires a board ID'
            );
        }

        if (
            typeof code !== 'string' ||
            code.trim().length === 0
        ) {
            throw new HardwareServiceError(
                'INVALID_BUILD_REQUEST',
                'Build requires Arduino source code'
            );
        }


        if (!Array.isArray(supportFiles)) {
            throw new HardwareServiceError(
                'INVALID_BUILD_REQUEST',
                'Build support files must be an array'
            );
        }

        const occupiedNames =
            new Set([
                `${SKETCH_NAME}.ino`
                    .toLowerCase()
            ]);

        for (
            const supportFile
            of supportFiles
        ) {
            if (
                !supportFile ||
                typeof supportFile !==
                    'object' ||
                Array.isArray(supportFile) ||
                typeof supportFile.name !==
                    'string' ||
                supportFile.name.length === 0 ||
                typeof supportFile.content !==
                    'string'
            ) {
                throw new HardwareServiceError(
                    'INVALID_BUILD_REQUEST',
                    'Build support file is invalid'
                );
            }

            if (
                supportFile.name === '.' ||
                supportFile.name === '..' ||
                supportFile.name.includes('/') ||
                supportFile.name.includes('\\') ||
                path.isAbsolute(
                    supportFile.name
                )
            ) {
                throw new HardwareServiceError(
                    'INVALID_BUILD_REQUEST',
                    'Build support file name is unsafe'
                );
            }

            const normalizedName =
                supportFile.name
                    .toLowerCase();

            if (
                occupiedNames.has(
                    normalizedName
                )
            ) {
                throw new HardwareServiceError(
                    'INVALID_BUILD_REQUEST',
                    'Build support file name conflicts with another file'
                );
            }

            occupiedNames.add(
                normalizedName
            );
        }

    }

    async _removeWorkspace (
        workspacePath
    ) {
        this._ownedWorkspaces.delete(
            workspacePath
        );

        await this._fs.rm(
            workspacePath,
            {
                force: true,
                recursive: true
            }
        );
    }
}

module.exports = BuildService;
