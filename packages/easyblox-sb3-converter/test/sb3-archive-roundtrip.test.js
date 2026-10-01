const fs =
    require('node:fs');

const path =
    require('node:path');

const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const JSZip =
    require('jszip');

const VirtualMachine =
    require(
        '../../scratch-vm/src/virtual-machine'
    );

const makeTestStorage =
    require(
        '../../scratch-vm/test/fixtures/make-test-storage'
    );

const {
    convertExternalSb3Archive,
    quarantineUnsafeReviewContent
} = require('..');

const SCRATCH_DEFAULT_FIXTURE =
    path.resolve(
        __dirname,
        '..',
        '..',
        'scratch-vm',
        'test',
        'fixtures',
        'default.sb3'
    );

const createPictoBloxUploadFixture =
    async () => {
        const source =
            await fs.promises.readFile(
                SCRATCH_DEFAULT_FIXTURE
            );

        const archive =
            await JSZip.loadAsync(
                source
            );

        const projectEntry =
            archive.file(
                'project.json'
            );

        assert.ok(
            projectEntry,
            'Scratch fixture contains project.json'
        );

        const project =
            JSON.parse(
                await projectEntry.async(
                    'string'
                )
            );

        const stage =
            project.targets.find(
                target =>
                    target.isStage ===
                    true
            );

        assert.ok(
            stage,
            'Scratch fixture contains Stage'
        );

        stage.blocks =
            stage.blocks || {};

        project.boardSelected =
            'Arduino Uno';

        project.extensions =
            Array.from(
                new Set([
                    ...(
                        Array.isArray(
                            project.extensions
                        ) ?
                            project.extensions :
                            []
                    ),

                    'arduinoUno',
                    'actuators',
                    'displayModule'
                ])
            );

        stage.blocks.r33aUploadHat = {
            opcode:
                'arduinoUno_arduinoUnoStartUp',

            next:
                'r33aServo',

            parent:
                null,

            inputs: {},

            fields: {},

            shadow:
                false,

            topLevel:
                true,

            x:
                40,

            y:
                40
        };

        stage.blocks.r33aServo = {
            opcode:
                'actuators_setServo',

            next:
                null,

            parent:
                'r33aUploadHat',

            inputs: {
                ANGLE: [
                    1,
                    [
                        4,
                        '90'
                    ]
                ]
            },

            fields: {
                SERVO_CHANNEL: [
                    '9',
                    null
                ]
            },

            shadow:
                false,

            topLevel:
                false
        };

        stage.blocks.r33aLegacy = {
            opcode:
                'displayModule_write',

            next:
                null,

            parent:
                null,

            inputs: {},

            fields: {},

            shadow:
                false,

            topLevel:
                true,

            x:
                40,

            y:
                180
        };

        archive.file(
            'project.json',
            JSON.stringify(
                project
            )
        );

        return archive.generateAsync({
            type:
                'nodebuffer',

            compression:
                'DEFLATE',

            compressionOptions: {
                level:
                    6
            }
        });
    };

const getArchiveAssetEntries =
    archive =>
        Object.values(
            archive.files
        )
            .filter(
                entry =>
                    !entry.dir &&
                    entry.name !==
                        'project.json'
            )
            .sort(
                (
                    left,
                    right
                ) =>
                    left.name.localeCompare(
                        right.name
                    )
            );

const assertArchiveAssetsPreserved =
    async (
        source,
        converted
    ) => {
        const sourceArchive =
            await JSZip.loadAsync(
                source
            );

        const convertedArchive =
            await JSZip.loadAsync(
                converted
            );

        const sourceEntries =
            getArchiveAssetEntries(
                sourceArchive
            );

        const convertedEntries =
            getArchiveAssetEntries(
                convertedArchive
            );

        assert.deepEqual(
            convertedEntries.map(
                entry =>
                    entry.name
            ),
            sourceEntries.map(
                entry =>
                    entry.name
            ),
            'archive conversion preserves every non-project file'
        );

        for (
            const sourceEntry
            of sourceEntries
        ) {
            const convertedEntry =
                convertedArchive.file(
                    sourceEntry.name
                );

            assert.ok(
                convertedEntry,
                `converted archive retains ${
                    sourceEntry.name
                }`
            );

            const [
                sourceBytes,
                convertedBytes
            ] =
                await Promise.all([
                    sourceEntry.async(
                        'nodebuffer'
                    ),

                    convertedEntry.async(
                        'nodebuffer'
                    )
                ]);

            assert.deepEqual(
                convertedBytes,
                sourceBytes,
                `converted archive preserves bytes for ${
                    sourceEntry.name
                }`
            );
        }
    };

const assertReferencedAssetsExist =
    async (
        project,
        sb3
    ) => {
        const archive =
            await JSZip.loadAsync(
                sb3
            );

        const referencedFiles =
            [];

        project.targets.forEach(
            target => {
                (
                    target.costumes ||
                    []
                ).forEach(
                    costume => {
                        referencedFiles.push(
                            costume.md5ext ||
                            `${
                                costume.assetId
                            }.${
                                costume.dataFormat
                            }`
                        );
                    }
                );

                (
                    target.sounds ||
                    []
                ).forEach(
                    sound => {
                        referencedFiles.push(
                            sound.md5ext ||
                            `${
                                sound.assetId
                            }.${
                                sound.dataFormat
                            }`
                        );
                    }
                );
            }
        );

        assert.ok(
            referencedFiles.length >
                0,
            'round-trip fixture retains at least one referenced asset'
        );

        referencedFiles.forEach(
            fileName => {
                assert.ok(
                    archive.file(
                        fileName
                    ),
                    `saved SB3 contains referenced asset ${
                        fileName
                    }`
                );
            }
        );
    };

test(
    'real SB3 archive survives conversion VM save and fresh VM reopen with Upload context assets and review intact',
    async () => {
        const sourceSb3 =
            await createPictoBloxUploadFixture();

        const converted =
            await convertExternalSb3Archive(
                sourceSb3
            );

        assert.equal(
            converted.canConvert,
            true
        );

        assert.equal(
            converted.report
                .isLoadSafe,
            true
        );

        assert.equal(
            converted.report
                .projectStructure
                .uploadProgramCreated,
            true
        );

        assert.equal(
            converted.report
                .deferredProjectStructureCount,
            0
        );

        assert.equal(
            converted.project
                .easybloxProject
                .programMode,
            'upload'
        );

        assert.ok(
            converted.project
                .easybloxProject
                .conversionReview
        );

        await assertArchiveAssetsPreserved(
            sourceSb3,
            converted.sb3
        );

        const vm1 =
            new VirtualMachine();

        const vm2 =
            new VirtualMachine();

        vm1.attachStorage(
            makeTestStorage()
        );

        vm2.attachStorage(
            makeTestStorage()
        );

        try {
            await vm1.loadProject(
                converted.sb3
            );

            assert.deepEqual(
                vm1.getEasyBloxProjectContext(),
                {
                    selectedBoardId:
                        'arduino-uno',

                    programMode:
                        'upload'
                }
            );

            const vm1UploadProgram =
                vm1.getOrCreateUploadProgram(
                    'arduino-uno'
                );

            assert.equal(
                vm1UploadProgram
                    .blocks
                    .getBlock(
                        'r33aUploadHat'
                    )
                    .opcode,
                'arduinoUno_whenArduinoUnoStart'
            );

            assert.equal(
                vm1UploadProgram
                    .blocks
                    .getBlock(
                        'r33aServo'
                    )
                    .opcode,
                'actuators_servoWrite'
            );

            const savedBlob =
                await vm1.saveProjectSb3();

            const savedSb3 =
                Buffer.from(
                    await savedBlob.arrayBuffer()
                );

            await vm2.loadProject(
                savedSb3
            );

            assert.deepEqual(
                vm2.getEasyBloxProjectContext(),
                {
                    selectedBoardId:
                        'arduino-uno',

                    programMode:
                        'upload'
                }
            );

            const vm2UploadProgram =
                vm2.getOrCreateUploadProgram(
                    'arduino-uno'
                );

            assert.equal(
                vm2UploadProgram
                    .blocks
                    .getBlock(
                        'r33aUploadHat'
                    )
                    .opcode,
                'arduinoUno_whenArduinoUnoStart'
            );

            assert.equal(
                vm2UploadProgram
                    .blocks
                    .getBlock(
                        'r33aServo'
                    )
                    .opcode,
                'actuators_servoWrite'
            );

            const reopenedProject =
                JSON.parse(
                    vm2.toJSON()
                );

            assert.deepEqual(
                reopenedProject
                    .easybloxProject
                    .conversionReview,
                converted.project
                    .easybloxProject
                    .conversionReview,
                'conversionReview survives VM save and fresh reopen'
            );

            const safetyAudit =
                quarantineUnsafeReviewContent(
                    reopenedProject
                );

            assert.equal(
                safetyAudit.report
                    .quarantinedReviewBlockCount,
                0,
                'freshly reopened project contains no new unsafe active blocks'
            );

            assert.equal(
                safetyAudit.report
                    .remainingUnsafeBlockCount,
                0
            );

            assert.equal(
                safetyAudit.report
                    .isLoadSafe,
                true
            );

            await assertReferencedAssetsExist(
                reopenedProject,
                savedSb3
            );
        } finally {
            vm1.quit();
            vm2.quit();
        }
    }
);
