const crypto =
    require('node:crypto');

const fs =
    require('node:fs');

const path =
    require('node:path');

const JSZip =
    require('jszip');

const {
    discoverSb3Files
} = require(
    '@easymaker/easyblox-pictoblox-analyzer'
);

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

const hashBuffer =
    buffer =>
        crypto
            .createHash(
                'sha256'
            )
            .update(
                buffer
            )
            .digest(
                'hex'
            );

const getArchiveFileHashes =
    async source => {
        const archive =
            await JSZip.loadAsync(
                source
            );

        const records =
            await Promise.all(
                Object.values(
                    archive.files
                )
                    .filter(
                        entry =>
                            !entry.dir &&
                            entry.name !==
                                'project.json'
                    )
                    .map(
                        async entry => ({
                            name:
                                entry.name,

                            hash:
                                hashBuffer(
                                    await entry.async(
                                        'nodebuffer'
                                    )
                                )
                        })
                    )
            );

        return records.sort(
            (
                left,
                right
            ) =>
                left.name.localeCompare(
                    right.name
                )
        );
    };

const getReferencedAssetNames =
    project => {
        const names =
            new Set();

        (
            project.targets ||
            []
        ).forEach(
            target => {
                (
                    target.costumes ||
                    []
                ).forEach(
                    costume => {
                        names.add(
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
                        names.add(
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

        return Array.from(
            names
        ).sort();
    };

const getMissingReferencedAssets =
    async (
        project,
        sb3
    ) => {
        const archive =
            await JSZip.loadAsync(
                sb3
            );

        return getReferencedAssetNames(
            project
        ).filter(
            fileName =>
                !archive.file(
                    fileName
                )
        );
    };

const createVm =
    () => {
        const vm =
            new VirtualMachine();

        vm.attachStorage(
            makeTestStorage()
        );

        return vm;
    };

const validateProject =
    async (
        corpusRoot,
        relativePath
    ) => {
        const absolutePath =
            path.resolve(
                corpusRoot,
                ...relativePath.split('/')
            );

        const sourceSb3 =
            await fs.promises.readFile(
                absolutePath
            );

        const sourceAssetHashes =
            await getArchiveFileHashes(
                sourceSb3
            );

        const converted =
            await convertExternalSb3Archive(
                sourceSb3
            );

        const result = {
            project:
                relativePath,

            origin:
                converted.origin,

            canConvert:
                converted.canConvert,

            conversionLoadSafe:
                converted.report ?
                    converted.report
                        .isLoadSafe :
                    false,

            requiresReview:
                converted.report ?
                    converted.report
                        .requiresReview :
                    false,

            normalizedProjectVariableCount:
                converted.report ?
                    converted.report
                        .normalizedProjectVariableCount :
                    null,

            deferredProjectDataCount:
                converted.report ?
                    converted.report
                        .deferredProjectDataCount :
                    null,

            deferredProjectStructureCount:
                converted.report ?
                    converted.report
                        .deferredProjectStructureCount :
                    null,

            safeLoadSkippedReason:
                converted.report &&
                converted.report.safeLoad ?
                    converted.report
                        .safeLoad
                        .skippedReason ||
                    null :
                    null,

            functionalReviewBlockCount:
                converted.report ?
                    converted.report
                        .reviewBlockCount :
                    null,

            quarantinedReviewBlockCount:
                converted.report ?
                    converted.report
                        .safeLoad
                        .quarantinedReviewBlockCount :
                    null,

            context:
                null,

            sourceAssetsPreserved:
                false,

            reviewPersisted:
                false,

            newUnsafeAfterRoundTrip:
                null,

            remainingUnsafeAfterRoundTrip:
                null,

            missingReferencedAssets:
                [],

            failures: []
        };

        result.reviewSources =
            [];

        if (converted.report) {
            if (
                converted.report
                    .reviewBlockCount >
                0
            ) {
                result.reviewSources.push(
                    'functional-blocks'
                );
            }

            if (
                converted.report
                    .safeLoad &&
                converted.report
                    .safeLoad
                    .quarantinedReviewBlockCount >
                0
            ) {
                result.reviewSources.push(
                    'quarantine'
                );
            }

            if (
                converted.report
                    .removedProjectMetadataCount >
                0
            ) {
                result.reviewSources.push(
                    'metadata-cleanup'
                );
            }

            if (
                converted.report
                    .deferredProjectDataCount >
                0
            ) {
                result.reviewSources.push(
                    'project-data-deferred'
                );
            }

            if (
                converted.report
                    .deferredProjectStructureCount >
                0
            ) {
                result.reviewSources.push(
                    'project-structure-deferred'
                );
            }
        }

        if (
            !converted.canConvert
        ) {
            return result;
        }

        if (!converted.sb3) {
            result.failures.push(
                'converted-archive-missing'
            );

            return result;
        }

        if (
            !converted.report
                .isLoadSafe
        ) {
            result.failures.push(
                'converted-project-not-load-safe'
            );

            return result;
        }

        const convertedAssetHashes =
            await getArchiveFileHashes(
                converted.sb3
            );

        result.sourceAssetsPreserved =
            JSON.stringify(
                convertedAssetHashes
            ) ===
            JSON.stringify(
                sourceAssetHashes
            );

        if (
            !result.sourceAssetsPreserved
        ) {
            result.failures.push(
                'archive-assets-changed-during-conversion'
            );
        }

        const vm1 =
            createVm();

        const vm2 =
            createVm();

        try {
            await vm1.loadProject(
                converted.sb3
            );

            const expectedContext =
                {
                    selectedBoardId:
                        converted.project
                            .easybloxProject
                            .selectedBoardId,

                    programMode:
                        converted.project
                            .easybloxProject
                            .programMode
                };

            const vm1Context =
                vm1.getEasyBloxProjectContext();

            if (
                JSON.stringify(
                    vm1Context
                ) !==
                JSON.stringify(
                    expectedContext
                )
            ) {
                result.failures.push(
                    'vm1-context-mismatch'
                );
            }

            const savedBlob =
                await vm1.saveProjectSb3();

            const savedSb3 =
                Buffer.from(
                    await savedBlob.arrayBuffer()
                );

            await vm2.loadProject(
                savedSb3
            );

            const vm2Context =
                vm2.getEasyBloxProjectContext();

            result.context =
                vm2Context;

            if (
                JSON.stringify(
                    vm2Context
                ) !==
                JSON.stringify(
                    expectedContext
                )
            ) {
                result.failures.push(
                    'vm2-context-mismatch'
                );
            }

            const reopenedProject =
                JSON.parse(
                    vm2.toJSON()
                );

            const expectedReview =
                converted.project
                    .easybloxProject
                    .conversionReview ||
                null;

            const reopenedReview =
                reopenedProject
                    .easybloxProject
                    .conversionReview ||
                null;

            result.reviewPersisted =
                JSON.stringify(
                    reopenedReview
                ) ===
                JSON.stringify(
                    expectedReview
                );

            if (
                !result.reviewPersisted
            ) {
                result.failures.push(
                    'conversion-review-mismatch'
                );
            }

            const safetyAudit =
                quarantineUnsafeReviewContent(
                    reopenedProject
                );

            result.newUnsafeAfterRoundTrip =
                safetyAudit.report
                    .quarantinedReviewBlockCount;

            result.remainingUnsafeAfterRoundTrip =
                safetyAudit.report
                    .remainingUnsafeBlockCount;

            if (
                result.newUnsafeAfterRoundTrip !==
                    0 ||
                result.remainingUnsafeAfterRoundTrip !==
                    0 ||
                safetyAudit.report
                    .isLoadSafe !==
                    true
            ) {
                result.failures.push(
                    'unsafe-active-content-after-roundtrip'
                );
            }

            result.missingReferencedAssets =
                await getMissingReferencedAssets(
                    reopenedProject,
                    savedSb3
                );

            if (
                result.missingReferencedAssets
                    .length >
                0
            ) {
                result.failures.push(
                    'missing-assets-after-roundtrip'
                );
            }
        } catch (error) {
            result.failures.push(
                `exception:${
                    error &&
                    error.message ?
                        error.message :
                        String(error)
                }`
            );
        } finally {
            vm1.quit();
            vm2.quit();
        }

        return result;
    };

const classifyResult =
    result => {
        if (
            !result.canConvert
        ) {
            if (
                result.origin ===
                    'unknown'
            ) {
                return 'SKIPPED_UNKNOWN';
            }

            if (
                result.origin ===
                    'easyblox'
            ) {
                return 'SKIPPED_EASYBLOX';
            }

            return 'SKIPPED_OTHER';
        }

        if (
            !result.conversionLoadSafe
        ) {
            return 'DEFERRED';
        }

        if (
            result.failures.length >
            0
        ) {
            return 'FAILED';
        }

        if (
            result.requiresReview
        ) {
            return 'SAFE_WITH_REVIEW';
        }

        return 'PASS';
    };

const main =
    async () => {
        const [
            corpusRoot,
            ...argumentsList
        ] =
            process.argv.slice(
                2
            );

        if (!corpusRoot) {
            console.error(
                'Usage: node scripts/validate-r33a-corpus.js <corpus-root> --all'
            );

            console.error(
                '   or: node scripts/validate-r33a-corpus.js <corpus-root> <relative-path> [...]'
            );

            process.exitCode =
                1;

            return;
        }

        const allMode =
            argumentsList.length ===
                1 &&
            argumentsList[0] ===
                '--all';

        if (
            argumentsList.includes(
                '--all'
            ) &&
            !allMode
        ) {
            console.error(
                '--all cannot be combined with explicit project paths'
            );

            process.exitCode =
                1;

            return;
        }

        let relativePaths =
            argumentsList;

        if (allMode) {
            const discovery =
                await discoverSb3Files(
                    corpusRoot
                );

            relativePaths =
                discovery.files.map(
                    file =>
                        file.id
                );

            console.log(
                `R3.3B_DISCOVERED_SB3=${
                    relativePaths.length
                }`
            );
        }

        if (
            relativePaths.length ===
                0
        ) {
            console.error(
                'No SB3 projects selected for validation'
            );

            process.exitCode =
                1;

            return;
        }

        const results = [];

        for (
            const relativePath
            of relativePaths
        ) {
            const result =
                await validateProject(
                    corpusRoot,
                    relativePath
                );

            result.classification =
                classifyResult(
                    result
                );

            results.push(
                result
            );

            if (allMode) {
                console.log(
                    [
                        `[${result.classification}]`,
                        result.project,
                        `origin=${
                            result.origin
                        }`,
                        `functionalReview=${
                            result.functionalReviewBlockCount
                        }`,
                        `quarantineReview=${
                            result.quarantinedReviewBlockCount
                        }`,
                        `reviewSources=${
                            result.reviewSources.length >
                                0 ?
                                result.reviewSources.join(
                                    ','
                                ) :
                                'none'
                        }`,
                        `normalizedVars=${
                            result.normalizedProjectVariableCount
                        }`,
                        `dataDeferred=${
                            result.deferredProjectDataCount
                        }`,
                        `structureDeferred=${
                            result.deferredProjectStructureCount
                        }`,
                        `failures=${
                            result.failures.length
                        }`
                    ].join(
                        ' '
                    )
                );
            }
        }

        if (!allMode) {
            results.forEach(
                result => {
                    console.log('');
                    console.log(
                        `--- ${
                            result.project
                        } ---`
                    );

                    console.log(
                        JSON.stringify(
                            result,
                            null,
                            2
                        )
                    );
                }
            );
        }

        const classificationCounts =
            Object.create(
                null
            );

        results.forEach(
            result => {
                classificationCounts[
                    result.classification
                ] =
                    (
                        classificationCounts[
                            result.classification
                        ] ||
                        0
                    ) +
                    1;
            }
        );

        const passCount =
            classificationCounts.PASS ||
            0;

        const reviewCount =
            classificationCounts
                .SAFE_WITH_REVIEW ||
            0;

        const deferredCount =
            classificationCounts.DEFERRED ||
            0;

        const failedCount =
            classificationCounts.FAILED ||
            0;

        const skippedUnknownCount =
            classificationCounts
                .SKIPPED_UNKNOWN ||
            0;

        const skippedEasyBloxCount =
            classificationCounts
                .SKIPPED_EASYBLOX ||
            0;

        const skippedOtherCount =
            classificationCounts
                .SKIPPED_OTHER ||
            0;

        console.log('');
        console.log(
            allMode ?
                '=== R3.3B CORPUS SUMMARY ===' :
                '=== R3.3A.3 SUMMARY ==='
        );

        console.log(
            `TOTAL=${results.length}`
        );

        console.log(
            `PASS=${passCount}`
        );

        console.log(
            `SAFE_WITH_REVIEW=${reviewCount}`
        );

        console.log(
            `DEFERRED=${deferredCount}`
        );

        console.log(
            `FAILED=${failedCount}`
        );

        console.log(
            `SKIPPED_UNKNOWN=${
                skippedUnknownCount
            }`
        );

        console.log(
            `SKIPPED_EASYBLOX=${
                skippedEasyBloxCount
            }`
        );

        console.log(
            `SKIPPED_OTHER=${
                skippedOtherCount
            }`
        );

        console.log(
            `ROUNDTRIP_SAFE=${
                passCount +
                reviewCount
            }`
        );

        if (
            !allMode &&
            (
                deferredCount >
                    0 ||
                failedCount >
                    0 ||
                skippedUnknownCount >
                    0 ||
                skippedEasyBloxCount >
                    0 ||
                skippedOtherCount >
                    0
            )
        ) {
            process.exitCode =
                1;
        }
    };

main()
    .catch(
        error => {
            console.error(
                error
            );

            process.exitCode =
                1;
        }
    );
