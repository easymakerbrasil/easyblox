const {
    createPictoBloxMappingCatalog,
    createPictoBloxUnsupportedCatalog,
    createProjectInventory
} = require(
    '@easymaker/easyblox-pictoblox-analyzer/src/browser'
);

const {
    createPictoBloxConversionPlan
} = require('./conversion-plan');

const {
    convertPictoBloxProjectStructural
} = require('./structural-project-converter');

const {
    normalizePictoBloxSameOpcodeSchemas
} = require('./same-opcode-schema-normalizer');

const {
    migratePictoBloxQrReaderPatterns
} = require('./qr-reader-migrator');

const {
    normalizeEasyBloxMenuShadows
} = require(
    './canonical-menu-shadow-normalizer'
);

const {
    normalizePictoBloxProjectData
} = require('./project-data-normalizer');

const {
    migratePictoBloxProjectStructure
} = require('./upload-program-migrator');

const {
    quarantineUnsafeReviewContent
} = require('./review-quarantine');

const PROJECT_ORIGINS =
    Object.freeze({
        EASYBLOX:
            'easyblox',
        PICTOBLOX:
            'pictoblox',
        UNKNOWN:
            'unknown'
    });

const createKnownPictoBloxOpcodeSet =
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const unsupportedCatalog =
            createPictoBloxUnsupportedCatalog();

        return new Set([
            ...mappingCatalog.entries.map(
                entry =>
                    entry.opcode
            ),
            ...unsupportedCatalog.entries.map(
                entry =>
                    entry.opcode
            )
        ]);
    };

const isEasyBloxProject =
    project =>
        Boolean(
            project &&
            project.easybloxProject &&
            typeof project.easybloxProject ===
                'object' &&
            !Array.isArray(
                project.easybloxProject
            )
        );

const detectSb3ProjectOrigin =
    project => {
        const inventory =
            createProjectInventory(
                project
            );

        if (
            isEasyBloxProject(
                project
            )
        ) {
            return PROJECT_ORIGINS
                .EASYBLOX;
        }

        if (
            inventory.boardSelected
        ) {
            return PROJECT_ORIGINS
                .PICTOBLOX;
        }

        const knownPictoBloxOpcodes =
            createKnownPictoBloxOpcodeSet();

        const containsKnownPictoBloxOpcode =
            inventory
                .functionalOpcodes
                .some(
                    record =>
                        knownPictoBloxOpcodes
                            .has(
                                record.opcode
                            )
                );

        if (
            containsKnownPictoBloxOpcode
        ) {
            return PROJECT_ORIGINS
                .PICTOBLOX;
        }

        return PROJECT_ORIGINS
            .UNKNOWN;
    };

const analyzeExternalSb3Project =
    project => {
        const origin =
            detectSb3ProjectOrigin(
                project
            );

        if (
            origin !==
            PROJECT_ORIGINS.PICTOBLOX
        ) {
            return {
                origin,
                canConvert:
                    false,
                plan:
                    null
            };
        }

        return {
            origin,
            canConvert:
                true,
            plan:
                createPictoBloxConversionPlan(
                    project
                )
        };
    };

const convertExternalSb3Project =
    project => {
        const analysis =
            analyzeExternalSb3Project(
                project
            );

        if (
            !analysis.canConvert
        ) {
            return {
                origin:
                    analysis.origin,
                canConvert:
                    false,
                project:
                    null,
                report:
                    null
            };
        }

        const compatibleOpcodeSchemas =
            normalizePictoBloxSameOpcodeSchemas(
                project
            );

        const compatibleOpcodeSchemaReport =
            compatibleOpcodeSchemas.report;

        const conversion =
            convertPictoBloxProjectStructural(
                compatibleOpcodeSchemas.project
            );

        const structuralReport =
            conversion.report;

        const qrReaderMigration =
            migratePictoBloxQrReaderPatterns(
                conversion.project
            );

        const qrReaderMigrationReport =
            qrReaderMigration.report;

        const canonicalMenuShadows =
            normalizeEasyBloxMenuShadows(
                qrReaderMigration.project
            );

        const canonicalMenuReport =
            canonicalMenuShadows.report;

        const projectData =
            normalizePictoBloxProjectData(
                canonicalMenuShadows.project
            );

        const projectDataReport =
            projectData.report;

        const projectStructure =
            migratePictoBloxProjectStructure(
                projectData.project
            );

        const projectStructureReport =
            projectStructure.report;

        const safeLoad =
            compatibleOpcodeSchemaReport
                .deferred
                .length ===
                0 &&
            projectDataReport
                .deferred
                .length ===
                0 &&
            projectStructureReport
                .deferred
                .length ===
                0 ?
                quarantineUnsafeReviewContent(
                    projectStructure.project
                ) :
                {
                    project:
                        projectStructure.project,

                    report: {
                        isLoadSafe:
                            false,

                        skippedReason:
                            compatibleOpcodeSchemaReport
                                .deferred
                                .length >
                                0 ?
                                'same-opcode-schema-deferred' :
                                projectDataReport
                                    .deferred
                                    .length >
                                    0 ?
                                    'project-data-deferred' :
                                    'project-structure-deferred',

                        quarantinedScriptCount:
                            0,

                        quarantinedUploadProgramCount:
                            0,

                        quarantinedBlockCount:
                            0,

                        quarantinedReviewBlockCount:
                            0,

                        remainingUnsafeBlockCount:
                            0,

                        remainingUnsafeBlocks:
                            []
                    }
                };

        const safeLoadReport =
            safeLoad.report;

        const metadataCleanup =
            projectStructureReport
                .metadataCleanup ||
            {
                removedUploadCommentCount:
                    0,
                removedMonitorCount:
                    0
            };

        const removedProjectMetadataCount =
            metadataCleanup
                .removedUploadCommentCount +
            metadataCleanup
                .removedMonitorCount;

        const simpleReport =
            structuralReport
                .simpleMappings;

        const nonStructuralDeferredCount =
            simpleReport
                .deferred
                .filter(
                    record =>
                        record.reason !==
                        'structural-shadow-transform'
                )
                .length;

        const unresolvedPlannedReviewBlockCount =
            Math.max(
                0,
                analysis
                    .plan
                    .reviewBlockCount -
                qrReaderMigrationReport
                    .resolvedReviewBlockCount
            );

        const reviewBlockCount =
            unresolvedPlannedReviewBlockCount +
            nonStructuralDeferredCount +
            structuralReport
                .structuralDeferredBlockCount;

        return {
            origin:
                analysis.origin,

            canConvert:
                true,

            project:
                safeLoad.project,

            report: {
                isLoadSafe:
                safeLoadReport
                    .isLoadSafe,
                processedBlockCount:
                    analysis
                        .plan
                        .counts
                        .functionalBlocks,

                convertedBlockCount:
                    compatibleOpcodeSchemaReport
                        .normalizedBlockCount +
                    simpleReport
                        .convertedBlockCount +
                    structuralReport
                        .structuralConvertedBlockCount +
                    qrReaderMigrationReport
                        .resolvedReviewBlockCount,

                normalizedCompatibleOpcodeCount:
                    compatibleOpcodeSchemaReport
                        .normalizedBlockCount,

                deferredCompatibleOpcodeSchemaCount:
                    compatibleOpcodeSchemaReport
                        .deferred
                        .length,

                deferredStructuralBlockCount:
                    structuralReport
                        .structuralDeferredBlockCount,

                normalizedMenuBlockCount:
                    canonicalMenuReport
                        .normalizedBlockCount,

                normalizedMenuArgumentCount:
                    canonicalMenuReport
                        .normalizedArgumentCount,

                normalizedProjectVariableCount:
                    projectDataReport
                        .normalizedVariableCount,

                deferredProjectDataCount:
                    projectDataReport
                        .deferred
                        .length,

                deferredProjectStructureCount:
                    projectStructureReport
                        .deferred
                        .length,

                removedProjectMetadataCount,

                reviewBlockCount,

                requiresStructuralConversion:
                    structuralReport
                        .structuralDeferredBlockCount >
                        0 ||
                    qrReaderMigrationReport
                        .deferred
                        .length >
                        0 ||
                    projectStructureReport
                        .deferred
                        .length >
                        0,

                requiresReview:
                    reviewBlockCount >
                        0 ||
                    compatibleOpcodeSchemaReport
                        .deferred
                        .length >
                        0 ||
                    projectDataReport
                        .deferred
                        .length >
                        0 ||
                    projectStructureReport
                        .deferred
                        .length >
                        0 ||
                    removedProjectMetadataCount >
                        0 ||
                    safeLoadReport
                        .quarantinedReviewBlockCount >
                        0,

                plan:
                    analysis.plan,

                compatibleOpcodeSchemas:
                    compatibleOpcodeSchemaReport,

                simpleMappings:
                    simpleReport,

                structuralMappings: {
                    convertedBlockCount:
                        structuralReport
                            .structuralConvertedBlockCount,

                    deferredBlockCount:
                        structuralReport
                            .structuralDeferredBlockCount,

                    converted:
                        structuralReport
                            .converted,

                    deferred:
                        structuralReport
                            .deferred
                },

                qrReaderMigration:
                    qrReaderMigrationReport,

                canonicalMenuShadows:
                    canonicalMenuReport,

                projectData:
                    projectDataReport,

                projectStructure:
                    projectStructureReport,

                safeLoad:
                    safeLoadReport
            }
        };
    };

module.exports = {
    PROJECT_ORIGINS,
    detectSb3ProjectOrigin,
    analyzeExternalSb3Project,
    convertExternalSb3Project
};
