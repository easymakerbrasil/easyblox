import {
    createHash
} from 'node:crypto';
import {
    createReadStream
} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
    fileURLToPath
} from 'node:url';

const filename =
    fileURLToPath(
        import.meta.url
    );

const dirname =
    path.dirname(
        filename
    );

const desktopRoot =
    path.resolve(
        dirname,
        '..'
    );

const manifestPath =
    path.join(
        desktopRoot,
        'runtime',
        'arduino-runtime.manifest.csv'
    );

const stagingDirectory =
    path.join(
        desktopRoot,
        'runtime',
        'staged'
    );

const stagingRoot =
    path.join(
        stagingDirectory,
        'easyblox-arduino-runtime'
    );

const sourceEnvironmentVariable =
    'EASYBLOX_ARDUINO_RUNTIME_SOURCE';

const manifestColumns =
    Object.freeze([
        'RelativePath',
        'Type',
        'Length',
        'SHA256'
    ]);

const parseCsvLine =
    line => {
        const values =
            [];

        let value = '';
        let quoted = false;

        for (
            let index = 0;
            index < line.length;
            index++
        ) {
            const character =
                line[index];

            if (character === '"') {
                if (
                    quoted &&
                    line[index + 1] === '"'
                ) {
                    value += '"';
                    index++;
                } else {
                    quoted = !quoted;
                }

                continue;
            }

            if (
                character === ',' &&
                !quoted
            ) {
                values.push(
                    value
                );

                value = '';
                continue;
            }

            value += character;
        }

        if (quoted) {
            throw new Error(
                'Arduino runtime manifest contains an unterminated quoted field'
            );
        }

        values.push(
            value
        );

        return values;
    };

const normalizeRelativePath =
    value =>
        value
            .replace(/\//g, '\\')
            .replace(/^\\+/, '');

const assertSafeRelativePath =
    relativePath => {
        const portablePath =
            relativePath.replace(
                /\\/g,
                '/'
            );

        if (
            !portablePath ||
            path.posix.isAbsolute(
                portablePath
            ) ||
            portablePath
                .split('/')
                .some(
                    part =>
                        part === '..' ||
                        part === '.'
                )
        ) {
            throw new Error(
                `Invalid Arduino runtime manifest path: ${relativePath}`
            );
        }
    };

const readManifest =
    async () => {
        const source =
            (
                await fs.readFile(
                    manifestPath,
                    'utf8'
                )
            ).replace(
                /^\uFEFF/,
                ''
            );

        const lines =
            source
                .split(/\r?\n/)
                .filter(
                    line =>
                        line.length > 0
                );

        if (lines.length < 2) {
            throw new Error(
                'Arduino runtime manifest is empty'
            );
        }

        const header =
            parseCsvLine(
                lines.shift()
            );

        if (
            header.length !==
                manifestColumns.length ||
            header.some(
                (
                    column,
                    index
                ) =>
                    column !==
                    manifestColumns[index]
            )
        ) {
            throw new Error(
                'Arduino runtime manifest has an unexpected header'
            );
        }

        const entries =
            lines.map(
                (
                    line,
                    index
                ) => {
                    const values =
                        parseCsvLine(
                            line
                        );

                    if (
                        values.length !==
                        manifestColumns.length
                    ) {
                        throw new Error(
                            `Invalid Arduino runtime manifest row ${index + 2}`
                        );
                    }

                    const entry = {
                        RelativePath:
                            normalizeRelativePath(
                                values[0]
                            ),
                        Type:
                            values[1],
                        Length:
                            values[2],
                        SHA256:
                            values[3]
                                .toUpperCase()
                    };

                    assertSafeRelativePath(
                        entry.RelativePath
                    );

                    if (
                        entry.Type !==
                            'Directory' &&
                        entry.Type !==
                            'File'
                    ) {
                        throw new Error(
                            `Invalid Arduino runtime manifest type for ${entry.RelativePath}`
                        );
                    }

                    if (
                        entry.Type ===
                        'Directory'
                    ) {
                        if (
                            entry.Length ||
                            entry.SHA256
                        ) {
                            throw new Error(
                                `Directory manifest entry contains file metadata: ${entry.RelativePath}`
                            );
                        }

                        return entry;
                    }

                    if (
                        !/^\d+$/.test(
                            entry.Length
                        ) ||
                        !/^[A-F0-9]{64}$/.test(
                            entry.SHA256
                        )
                    ) {
                        throw new Error(
                            `Invalid file metadata in Arduino runtime manifest: ${entry.RelativePath}`
                        );
                    }

                    return entry;
                }
            );

        const paths =
            new Set();

        for (const entry of entries) {
            if (
                paths.has(
                    entry.RelativePath
                )
            ) {
                throw new Error(
                    `Duplicate Arduino runtime manifest path: ${entry.RelativePath}`
                );
            }

            paths.add(
                entry.RelativePath
            );
        }

        return entries;
    };

const hashFile =
    filePath =>
        new Promise(
            (
                resolve,
                reject
            ) => {
                const hash =
                    createHash(
                        'sha256'
                    );

                const stream =
                    createReadStream(
                        filePath
                    );

                stream.on(
                    'data',
                    chunk => {
                        hash.update(
                            chunk
                        );
                    }
                );

                stream.on(
                    'error',
                    reject
                );

                stream.on(
                    'end',
                    () => {
                        resolve(
                            hash
                                .digest('hex')
                                .toUpperCase()
                        );
                    }
                );
            }
        );

const collectRuntimeEntries =
    async runtimeRoot => {
        const entries =
            [];

        const visit =
            async (
                absoluteDirectory,
                relativeDirectory = ''
            ) => {
                const directoryEntries =
                    await fs.readdir(
                        absoluteDirectory,
                        {
                            withFileTypes: true
                        }
                    );

                directoryEntries.sort(
                    (
                        left,
                        right
                    ) =>
                        left.name.localeCompare(
                            right.name,
                            'en'
                        )
                );

                for (
                    const directoryEntry of
                    directoryEntries
                ) {
                    const relativePath =
                        relativeDirectory ?
                            `${relativeDirectory}\\${directoryEntry.name}` :
                            directoryEntry.name;

                    const absolutePath =
                        path.join(
                            absoluteDirectory,
                            directoryEntry.name
                        );

                    if (
                        directoryEntry.isDirectory()
                    ) {
                        entries.push({
                            RelativePath:
                                relativePath,
                            Type:
                                'Directory',
                            Length:
                                '',
                            SHA256:
                                ''
                        });

                        await visit(
                            absolutePath,
                            relativePath
                        );

                        continue;
                    }

                    if (
                        !directoryEntry.isFile()
                    ) {
                        throw new Error(
                            `Unsupported Arduino runtime entry type: ${relativePath}`
                        );
                    }

                    const stats =
                        await fs.stat(
                            absolutePath
                        );

                    entries.push({
                        RelativePath:
                            relativePath,
                        Type:
                            'File',
                        Length:
                            stats.size.toString(),
                        SHA256:
                            await hashFile(
                                absolutePath
                            )
                    });
                }
            };

        await visit(
            runtimeRoot
        );

        return entries;
    };

const compareRuntime =
    (
        expectedEntries,
        actualEntries,
        label
    ) => {
        const expectedByPath =
            new Map(
                expectedEntries.map(
                    entry => [
                        entry.RelativePath,
                        entry
                    ]
                )
            );

        const actualByPath =
            new Map(
                actualEntries.map(
                    entry => [
                        entry.RelativePath,
                        entry
                    ]
                )
            );

        const differences =
            [];

        if (
            expectedEntries.length !==
            actualEntries.length
        ) {
            differences.push(
                `entry count expected=${expectedEntries.length} actual=${actualEntries.length}`
            );
        }

        for (
            const expected of
            expectedEntries
        ) {
            const actual =
                actualByPath.get(
                    expected.RelativePath
                );

            if (!actual) {
                differences.push(
                    `missing: ${expected.RelativePath}`
                );

                continue;
            }

            for (
                const property of
                [
                    'Type',
                    'Length',
                    'SHA256'
                ]
            ) {
                if (
                    actual[property] !==
                    expected[property]
                ) {
                    differences.push(
                        `${expected.RelativePath} ${property} expected=${expected[property]} actual=${actual[property]}`
                    );
                }
            }
        }

        for (
            const actual of
            actualEntries
        ) {
            if (
                !expectedByPath.has(
                    actual.RelativePath
                )
            ) {
                differences.push(
                    `unexpected: ${actual.RelativePath}`
                );
            }
        }

        if (differences.length > 0) {
            const details =
                differences
                    .slice(
                        0,
                        20
                    )
                    .map(
                        difference =>
                            `- ${difference}`
                    )
                    .join('\n');

            throw new Error(
                `${label} does not match the canonical Arduino runtime manifest:\n${details}`
            );
        }
    };

const assertSourceIsSafe =
    sourceRoot => {
        const normalizedSource =
            path.resolve(
                sourceRoot
            );

        const normalizedStaging =
            path.resolve(
                stagingDirectory
            );

        const relative =
            path.relative(
                normalizedStaging,
                normalizedSource
            );

        if (
            relative === '' ||
            (
                !relative.startsWith('..') &&
                !path.isAbsolute(
                    relative
                )
            )
        ) {
            throw new Error(
                'Arduino runtime source must not be inside the generated staging directory'
            );
        }
    };

const stageArduinoRuntime =
    async () => {
        const configuredSource =
            process.env[
                sourceEnvironmentVariable
            ];

        if (
            typeof configuredSource !==
                'string' ||
            configuredSource.trim().length === 0
        ) {
            throw new Error(
                `${sourceEnvironmentVariable} must point to the validated Arduino runtime`
            );
        }

        const sourceRoot =
            path.resolve(
                configuredSource.trim()
            );

        assertSourceIsSafe(
            sourceRoot
        );

        await fs.access(
            sourceRoot
        );

        const expectedEntries =
            await readManifest();

        console.log(
            `EasyBlox Arduino runtime manifest entries: ${expectedEntries.length}`
        );

        console.log(
            `Validating Arduino runtime source: ${sourceRoot}`
        );

        const sourceEntries =
            await collectRuntimeEntries(
                sourceRoot
            );

        compareRuntime(
            expectedEntries,
            sourceEntries,
            'Arduino runtime source'
        );

        console.log(
            'Arduino runtime source validation: GREEN'
        );

        await fs.rm(
            stagingRoot,
            {
                recursive: true,
                force: true
            }
        );

        await fs.mkdir(
            stagingDirectory,
            {
                recursive: true
            }
        );

        console.log(
            `Staging Arduino runtime: ${stagingRoot}`
        );

        await fs.cp(
            sourceRoot,
            stagingRoot,
            {
                recursive: true,
                force: true
            }
        );

        console.log(
            'Validating staged Arduino runtime'
        );

        const stagedEntries =
            await collectRuntimeEntries(
                stagingRoot
            );

        compareRuntime(
            expectedEntries,
            stagedEntries,
            'Staged Arduino runtime'
        );

        console.log(
            `Staged Arduino runtime entries: ${stagedEntries.length}`
        );

        console.log(
            'EasyBlox Arduino runtime staging: GREEN'
        );
    };

await stageArduinoRuntime();
