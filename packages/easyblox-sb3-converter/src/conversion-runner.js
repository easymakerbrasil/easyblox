const {
    createPictoBloxMappingCatalog,
    createPictoBloxUnsupportedCatalog,
    createProjectInventory
} = require(
    '@easymaker/easyblox-pictoblox-analyzer'
);

const {
    createPictoBloxConversionPlan
} = require('./conversion-plan');

const {
    convertPictoBloxProjectSimple
} = require('./simple-project-converter');

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

        const conversion =
            convertPictoBloxProjectSimple(
                project
            );

        const simpleReport =
            conversion.report;

        return {
            origin:
                analysis.origin,

            canConvert:
                true,

            project:
                conversion.project,

            report: {
                processedBlockCount:
                    analysis
                        .plan
                        .counts
                        .functionalBlocks,

                convertedBlockCount:
                    simpleReport
                        .convertedBlockCount,

                deferredStructuralBlockCount:
                    simpleReport
                        .deferredBlockCount,

                reviewBlockCount:
                    analysis
                        .plan
                        .reviewBlockCount,

                requiresStructuralConversion:
                    simpleReport
                        .deferredBlockCount >
                    0,

                requiresReview:
                    analysis
                        .plan
                        .requiresReview,

                plan:
                    analysis.plan,

                simpleMappings:
                    simpleReport
            }
        };
    };

module.exports = {
    PROJECT_ORIGINS,
    detectSb3ProjectOrigin,
    analyzeExternalSb3Project,
    convertExternalSb3Project
};
