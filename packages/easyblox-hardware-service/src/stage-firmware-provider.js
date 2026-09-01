const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const HardwareServiceError =
    require('./hardware-service-error');

const ARDUINO_UNO_BOARD_ID =
    'arduino-uno';

const DEFAULT_ARDUINO_UNO_STAGE_PATH =
    path.resolve(
        __dirname,
        '..',
        '..',
        'scratch-vm',
        'firmware',
        'arduino-uno',
        'stage',
        'stage.ino'
    );

class StageFirmwareProvider {
    constructor (options = {}) {
        this._fs =
            options.fsApi ||
            fs;

        this._arduinoUnoStagePath =
            options.arduinoUnoStagePath ||
            DEFAULT_ARDUINO_UNO_STAGE_PATH;
    }

    async load (boardId) {
        if (
            boardId !==
            ARDUINO_UNO_BOARD_ID
        ) {
            throw new HardwareServiceError(
                'UNSUPPORTED_BOARD',
                'Stage firmware is not available for this board'
            );
        }

        let code;

        try {
            code =
                await this._fs.readFile(
                    this._arduinoUnoStagePath,
                    'utf8'
                );
        } catch (error) {
            throw new HardwareServiceError(
                'STAGE_FIRMWARE_NOT_FOUND',
                'EasyBlox Stage firmware is not available',
                {
                    cause: error
                }
            );
        }

        if (
            typeof code !== 'string' ||
            code.trim().length === 0
        ) {
            throw new HardwareServiceError(
                'STAGE_FIRMWARE_INVALID',
                'EasyBlox Stage firmware is invalid'
            );
        }

        const version =
            crypto
                .createHash('sha256')
                .update(code, 'utf8')
                .digest('hex');

        return Object.freeze({
            boardId,
            code,
            version
        });
    }
}

module.exports = StageFirmwareProvider;
module.exports.ARDUINO_UNO_BOARD_ID =
    ARDUINO_UNO_BOARD_ID;
module.exports.DEFAULT_ARDUINO_UNO_STAGE_PATH =
    DEFAULT_ARDUINO_UNO_STAGE_PATH;
