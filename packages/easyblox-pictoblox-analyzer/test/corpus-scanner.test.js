const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const fs =
    require('node:fs');

const os =
    require('node:os');

const path =
    require('node:path');

const fsp =
    fs.promises;

const JSZip =
    require('jszip');

const {
    COMPATIBILITY_STATUSES,
    discoverSb3Files,
    scanProjectCorpus
} = require('..');

const createProject =
    (
        blocks = {},
        extensions = []
    ) => ({
        targets: [
            {
                name:
                    'Stage',
                isStage:
                    true,
                blocks
            }
        ],
        extensions
    });

const createTempDirectory =
    async () =>
        fsp.mkdtemp(
            path.join(
                os.tmpdir(),
                'easyblox-pictoblox-corpus-'
            )
        );

const writeSb3 =
    async (
        filePath,
        project
    ) => {
        await fsp.mkdir(
            path.dirname(
                filePath
            ),
            {
                recursive:
                    true
            }
        );

        const zip =
            new JSZip();

        zip.file(
            'project.json',
            JSON.stringify(
                project
            )
        );

        const source =
            await zip.generateAsync({
                type:
                    'nodebuffer'
            });

        await fsp.writeFile(
            filePath,
            source
        );
    };

test(
    'corpus scanner discovers SB3 files recursively with deterministic project ids',
    async t => {
        const root =
            await createTempDirectory();

        t.after(
            async () => {
                await fsp.rm(
                    root,
                    {
                        recursive:
                            true,
                        force:
                            true
                    }
                );
            }
        );

        await writeSb3(
            path.join(
                root,
                'a.sb3'
            ),
            createProject()
        );

        await writeSb3(
            path.join(
                root,
                'nested',
                'b.SB3'
            ),
            createProject()
        );

        await writeSb3(
            path.join(
                root,
                'nested',
                'deeper',
                'c.sb3'
            ),
            createProject()
        );

        await fsp.writeFile(
            path.join(
                root,
                'ignore.txt'
            ),
            'not a project',
            'utf8'
        );

        const result =
            await discoverSb3Files(
                root
            );

        assert.equal(
            result.rootPath,
            path.resolve(
                root
            )
        );

        assert.deepEqual(
            result.files.map(
                file =>
                    file.id
            ),
            [
                'a.sb3',
                'nested/b.SB3',
                'nested/deeper/c.sb3'
            ]
        );

        result.files.forEach(
            file => {
                assert.equal(
                    path.isAbsolute(
                        file.filePath
                    ),
                    true
                );
            }
        );
    }
);

test(
    'corpus scanner separates source errors from project analysis errors',
    async t => {
        const root =
            await createTempDirectory();

        t.after(
            async () => {
                await fsp.rm(
                    root,
                    {
                        recursive:
                            true,
                        force:
                            true
                    }
                );
            }
        );

        await writeSb3(
            path.join(
                root,
                'a.sb3'
            ),
            createProject(
                {
                    move: {
                        opcode:
                            'motion_movesteps',
                        shadow:
                            false
                    },
                    costume: {
                        opcode:
                            'looks_costume',
                        shadow:
                            true
                    }
                },
                [
                    'extA'
                ]
            )
        );

        await writeSb3(
            path.join(
                root,
                'nested',
                'b.sb3'
            ),
            createProject({
                unknown: {
                    opcode:
                        'picto_unknown',
                    shadow:
                        false
                }
            })
        );

        await fsp.writeFile(
            path.join(
                root,
                'broken.sb3'
            ),
            Buffer.from(
                'not an sb3 archive',
                'utf8'
            )
        );

        await writeSb3(
            path.join(
                root,
                'invalid.sb3'
            ),
            {}
        );

        const result =
            await scanProjectCorpus(
                root,
                [
                    {
                        opcode:
                            'motion_movesteps',
                        status:
                            COMPATIBILITY_STATUSES
                                .SUPPORTED
                    }
                ]
            );

        assert.deepEqual(
            result.summary,
            {
                discoveredSb3Count:
                    4,
                loadedProjectCount:
                    3,
                sourceErrorCount:
                    1,
                analyzedProjectCount:
                    2,
                analysisErrorCount:
                    1,
                failedProjectCount:
                    2
            }
        );

        assert.deepEqual(
            result.projectIds,
            [
                'a.sb3',
                'broken.sb3',
                'invalid.sb3',
                'nested/b.sb3'
            ]
        );

        assert.equal(
            result.corpus.summary
                .projectCount,
            3
        );

        assert.equal(
            result.corpus.summary
                .analyzedProjectCount,
            2
        );

        assert.equal(
            result.corpus.summary
                .failedProjectCount,
            1
        );

        assert.equal(
            result.corpus.summary
                .blockCount,
            3
        );

        assert.equal(
            result.corpus.summary
                .functionalBlockCount,
            2
        );

        assert.equal(
            result.corpus.summary
                .shadowBlockCount,
            1
        );

        assert.equal(
            result.corpus.compatibility
                .supported
                .blockCount,
            1
        );

        assert.equal(
            result.corpus.compatibility
                .unknown
                .blockCount,
            1
        );

        assert.equal(
            result.sourceErrors.length,
            1
        );

        assert.equal(
            result.sourceErrors[0]
                .id,
            'broken.sb3'
        );

        assert.match(
            result.sourceErrors[0]
                .error,
            /Invalid PictoBlox SB3 archive/
        );

        assert.deepEqual(
            result.corpus.errors,
            [
                {
                    id:
                        'invalid.sb3',
                    error:
                        'PictoBlox project inventory requires a targets array'
                }
            ]
        );
    }
);

test(
    'corpus scanner rejects missing and non-directory roots',
    async t => {
        const root =
            await createTempDirectory();

        t.after(
            async () => {
                await fsp.rm(
                    root,
                    {
                        recursive:
                            true,
                        force:
                            true
                    }
                );
            }
        );

        const filePath =
            path.join(
                root,
                'file.txt'
            );

        await fsp.writeFile(
            filePath,
            'content',
            'utf8'
        );

        await assert.rejects(
            () =>
                discoverSb3Files(
                    filePath
                ),
            /root must be a directory/
        );

        await assert.rejects(
            () =>
                discoverSb3Files(
                    path.join(
                        root,
                        'missing'
                    )
                ),
            /root cannot be read/
        );

        await assert.rejects(
            () =>
                discoverSb3Files(
                    ''
                ),
            /non-empty root path/
        );
    }
);
