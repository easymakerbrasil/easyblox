const fs = require('node:fs');

const HardwareServiceError =
    require('./hardware-service-error');

const BOARD_TOOLCHAINS = Object.freeze({
    'arduino-uno': Object.freeze({
        boardId: 'arduino-uno',
        fqbn: 'arduino:avr:uno',
        coreId: 'arduino:avr'
    })
});

const WINDOWS_ARDUINO_IDE_CLI =
    'C:\\Program Files\\Arduino IDE\\resources\\app\\lib\\backend\\resources\\arduino-cli.exe';

class ToolchainProvider {
    constructor (options = {}) {
        this._cliPath = options.cliPath || null;
        this._env = options.env || process.env;
        this._platform =
            options.platform || process.platform;
        this._existsSync =
            options.existsSync || fs.existsSync;
    }

    resolve (boardId) {
        const boardToolchain =
            BOARD_TOOLCHAINS[boardId];

        if (!boardToolchain) {
            throw new HardwareServiceError(
                'UNSUPPORTED_BOARD',
                `Unsupported build board: ${boardId}`
            );
        }

        const cliPath = this._resolveCliPath();

        if (!cliPath) {
            throw new HardwareServiceError(
                'TOOLCHAIN_NOT_FOUND',
                'Arduino CLI was not found'
            );
        }

        return {
            boardId: boardToolchain.boardId,
            fqbn: boardToolchain.fqbn,
            coreId: boardToolchain.coreId,
            cliPath
        };
    }

    _resolveCliPath () {
        const candidates = [
            this._cliPath,
            this._env.EASYBLOX_ARDUINO_CLI
        ];

        if (this._platform === 'win32') {
            candidates.push(
                WINDOWS_ARDUINO_IDE_CLI
            );
        }

        for (const candidate of candidates) {
            if (
                candidate &&
                this._existsSync(candidate)
            ) {
                return candidate;
            }
        }

        return null;
    }
}

module.exports = ToolchainProvider;
module.exports.BOARD_TOOLCHAINS =
    BOARD_TOOLCHAINS;
