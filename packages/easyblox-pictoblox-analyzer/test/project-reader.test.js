const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const JSZip =
    require('jszip');

const {
    parseProjectJson,
    readProjectSource,
    readSb3Project
} = require('..');

const createProject =
    () => ({
        targets: [
            {
                name: 'Stage',
                isStage: true,
                blocks: {}
            }
        ],
        extensions: [
            'quarky'
        ]
    });

test(
    'project reader parses raw project JSON text',
    () => {
        const project =
            parseProjectJson(
                JSON.stringify(
                    createProject()
                )
            );

        assert.equal(
            project.targets[0]
                .name,
            'Stage'
        );

        assert.deepEqual(
            project.extensions,
            [
                'quarky'
            ]
        );
    }
);

test(
    'project reader accepts UTF-8 project JSON binary data',
    async () => {
        const source =
            Buffer.from(
                JSON.stringify(
                    createProject()
                ),
                'utf8'
            );

        const project =
            await readProjectSource(
                source
            );

        assert.equal(
            project.targets.length,
            1
        );

        assert.equal(
            project.targets[0]
                .isStage,
            true
        );
    }
);

test(
    'project reader extracts project.json from an SB3 archive',
    async () => {
        const zip =
            new JSZip();

        zip.file(
            'project.json',
            JSON.stringify(
                createProject()
            )
        );

        zip.file(
            'asset.svg',
            '<svg></svg>'
        );

        const source =
            await zip.generateAsync({
                type: 'nodebuffer'
            });

        const project =
            await readSb3Project(
                source
            );

        assert.deepEqual(
            project.extensions,
            [
                'quarky'
            ]
        );

        assert.equal(
            project.targets[0]
                .name,
            'Stage'
        );
    }
);

test(
    'project reader auto-detects an SB3 binary source',
    async () => {
        const zip =
            new JSZip();

        zip.file(
            'project.json',
            JSON.stringify(
                createProject()
            )
        );

        const source =
            await zip.generateAsync({
                type: 'nodebuffer'
            });

        const project =
            await readProjectSource(
                source
            );

        assert.equal(
            project.targets.length,
            1
        );
    }
);

test(
    'project reader rejects an archive without project.json',
    async () => {
        const zip =
            new JSZip();

        zip.file(
            'asset.svg',
            '<svg></svg>'
        );

        const source =
            await zip.generateAsync({
                type: 'nodebuffer'
            });

        await assert.rejects(
            () =>
                readSb3Project(
                    source
                ),
            /does not contain project\.json/
        );
    }
);

test(
    'project reader rejects malformed JSON and unusable sources',
    async () => {
        assert.throws(
            () =>
                parseProjectJson(
                    '{broken'
                ),
            /Invalid PictoBlox project JSON/
        );

        await assert.rejects(
            () =>
                readProjectSource(
                    Buffer.alloc(
                        0
                    )
                ),
            /source is empty/
        );

        await assert.rejects(
            () =>
                readProjectSource(
                    42
                ),
            /JSON text or binary project data/
        );
    }
);
