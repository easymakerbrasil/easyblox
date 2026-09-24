const fs =
    require('node:fs');

const path =
    require('node:path');

const fsp =
    fs.promises;

const {
    readProjectSource
} = require('./project-reader');

const {
    aggregateProjectCorpus
} = require('./corpus-aggregator');

const getErrorMessage =
    error =>
        error &&
        typeof error.message ===
            'string' ?
            error.message :
            String(
                error
            );

const normalizeRootPath =
    rootPath => {
        if (
            typeof rootPath !==
                'string' ||
            rootPath.trim().length ===
                0
        ) {
            throw new TypeError(
                'PictoBlox corpus scanner requires a non-empty root path'
            );
        }

        return path.resolve(
            rootPath
        );
    };

const createProjectId =
    (
        rootPath,
        filePath
    ) =>
        path
            .relative(
                rootPath,
                filePath
            )
            .split(
                path.sep
            )
            .join(
                '/'
            );

const discoverSb3Files =
    async rootPath => {
        const normalizedRootPath =
            normalizeRootPath(
                rootPath
            );

        let rootStat;

        try {
            rootStat =
                await fsp.stat(
                    normalizedRootPath
                );
        } catch (error) {
            throw new Error(
                `PictoBlox corpus root cannot be read: ${
                    error.message
                }`
            );
        }

        if (
            !rootStat.isDirectory()
        ) {
            throw new TypeError(
                'PictoBlox corpus root must be a directory'
            );
        }

        const walk =
            async directory => {
                let entries;

                try {
                    entries =
                        await fsp.readdir(
                            directory,
                            {
                                withFileTypes:
                                    true
                            }
                        );
                } catch (error) {
                    throw new Error(
                        `PictoBlox corpus directory cannot be read: ${
                            directory
                        }: ${
                            error.message
                        }`
                    );
                }

                entries.sort(
                    (
                        left,
                        right
                    ) =>
                        left.name.localeCompare(
                            right.name
                        )
                );

                const files = [];

                for (
                    const entry
                    of entries
                ) {
                    const filePath =
                        path.join(
                            directory,
                            entry.name
                        );

                    if (
                        entry.isDirectory()
                    ) {
                        files.push(
                            ...await walk(
                                filePath
                            )
                        );

                        continue;
                    }

                    if (
                        entry.isFile() &&
                        path.extname(
                            entry.name
                        ).toLowerCase() ===
                            '.sb3'
                    ) {
                        files.push({
                            id:
                                createProjectId(
                                    normalizedRootPath,
                                    filePath
                                ),
                            filePath
                        });
                    }
                }

                return files;
            };

        return {
            rootPath:
                normalizedRootPath,
            files:
                await walk(
                    normalizedRootPath
                )
        };
    };

const scanProjectCorpus =
    async (
        rootPath,
        catalog = []
    ) => {
        const discovery =
            await discoverSb3Files(
                rootPath
            );

        const entries = [];

        const sourceErrors = [];

        for (
            const file
            of discovery.files
        ) {
            try {
                const source =
                    await fsp.readFile(
                        file.filePath
                    );

                const project =
                    await readProjectSource(
                        source
                    );

                entries.push({
                    id:
                        file.id,
                    project
                });
            } catch (error) {
                sourceErrors.push({
                    id:
                        file.id,
                    error:
                        getErrorMessage(
                            error
                        )
                });
            }
        }

        const corpus =
            aggregateProjectCorpus(
                entries,
                catalog
            );

        return {
            rootPath:
                discovery.rootPath,
            summary: {
                discoveredSb3Count:
                    discovery.files.length,
                loadedProjectCount:
                    entries.length,
                sourceErrorCount:
                    sourceErrors.length,
                analyzedProjectCount:
                    corpus.summary
                        .analyzedProjectCount,
                analysisErrorCount:
                    corpus.summary
                        .failedProjectCount,
                failedProjectCount:
                    sourceErrors.length +
                    corpus.summary
                        .failedProjectCount
            },
            projectIds:
                discovery.files.map(
                    file =>
                        file.id
                ),
            corpus,
            sourceErrors
        };
    };

module.exports = {
    discoverSb3Files,
    scanProjectCorpus
};
