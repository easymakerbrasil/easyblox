const BuildService =
    require('./build-service');

const StageFirmwareProvider =
    require('./stage-firmware-provider');

const UploadService =
    require('./upload-service');

class StageFirmwareManager {
    constructor (options = {}) {
        this._provider =
            options.provider ||
            new StageFirmwareProvider();

        this._buildService =
            options.buildService ||
            new BuildService();

        this._uploadService =
            options.uploadService ||
            new UploadService();

        this._cache =
            new Map();
    }

    async restore (request = {}) {
        const boardId =
            request.boardId;

        const portHint =
            request.portHint;

        const firmware =
            await this._provider.load(
                boardId
            );

        const cached =
            this._cache.get(
                boardId
            );

        let artifact;
        let reusedBuild = false;

        if (
            cached &&
            cached.version ===
                firmware.version
        ) {
            artifact =
                cached.artifact;

            reusedBuild = true;
        } else {
            if (cached) {
                await this._cleanupEntry(
                    boardId,
                    cached
                );
            }

            artifact =
                await this._buildService.compile({
                    boardId,
                    code:
                        firmware.code
                });

            this._cache.set(
                boardId,
                {
                    version:
                        firmware.version,
                    artifact
                }
            );
        }

        const uploadResult =
            await this._uploadService.upload({
                artifact,
                portHint
            });

        return Object.freeze({
            boardId,
            firmwareVersion:
                firmware.version,
            reusedBuild,
            ...uploadResult
        });
    }

    async cleanup () {
        const entries =
            Array.from(
                this._cache.entries()
            );

        this._cache.clear();

        await Promise.allSettled(
            entries.map(
                ([, entry]) =>
                    this._buildService.cleanup(
                        entry.artifact
                    )
            )
        );
    }

    async _cleanupEntry (
        boardId,
        entry
    ) {
        this._cache.delete(
            boardId
        );

        await this._buildService.cleanup(
            entry.artifact
        );
    }
}

module.exports = StageFirmwareManager;
