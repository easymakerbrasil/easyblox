const {
    createCompatibilityCatalog,
    createEasyBloxSupportCatalog,
    createPictoBloxMappingCatalog,
    createPictoBloxUnsupportedCatalog,
    createProjectInventory,
    classifyProjectInventory
} = require(
    '@easymaker/easyblox-pictoblox-analyzer/src/browser'
);

const createPictoBloxConversionCatalog =
    () => {
        const supportCatalog =
            createEasyBloxSupportCatalog();

        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const unsupportedCatalog =
            createPictoBloxUnsupportedCatalog();

        return createCompatibilityCatalog([
            ...supportCatalog.entries,
            ...mappingCatalog.entries,
            ...unsupportedCatalog.entries
        ]);
    };

const createPictoBloxConversionPlan =
    project => {
        const inventory =
            createProjectInventory(
                project
            );

        const catalog =
            createPictoBloxConversionCatalog();

        const classification =
            classifyProjectInventory(
                inventory,
                catalog
            );

        const supportedBlockCount =
            classification
                .summary
                .supported
                .blockCount;

        const mappableBlockCount =
            classification
                .summary
                .mappable
                .blockCount;

        const unsupportedBlockCount =
            classification
                .summary
                .unsupported
                .blockCount;

        const unknownBlockCount =
            classification
                .summary
                .unknown
                .blockCount;

        return {
            source: {
                boardSelected:
                    inventory
                        .boardSelected,
                declaredExtensions: [
                    ...inventory
                        .declaredExtensions
                ]
            },

            counts: {
                serializedBlocks:
                    inventory
                        .blockCount,
                functionalBlocks:
                    inventory
                        .functionalBlockCount,
                shadowBlocks:
                    inventory
                        .shadowBlockCount
            },

            compatibility:
                classification.summary,

            convertibleBlockCount:
                supportedBlockCount +
                mappableBlockCount,

            reviewBlockCount:
                unsupportedBlockCount +
                unknownBlockCount,

            requiresReview:
                unsupportedBlockCount >
                    0 ||
                unknownBlockCount >
                    0,

            entries:
                classification.opcodes
        };
    };

module.exports = {
    createPictoBloxConversionCatalog,
    createPictoBloxConversionPlan
};
