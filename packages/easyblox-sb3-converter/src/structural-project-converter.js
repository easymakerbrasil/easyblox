const {
    applyMappingValueTransform,
    createPictoBloxMappingCatalog
} = require(
    '@easymaker/easyblox-pictoblox-analyzer'
);

const {
    convertPictoBloxProjectSimple
} = require('./simple-project-converter');

const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const getSerializedShadowId =
    input => {
        if (
            !Array.isArray(
                input
            ) ||
            input.length <
                2
        ) {
            return {
                ok: false,
                reason:
                    'invalid-source-input'
            };
        }

        let shadowDescriptor;

        if (
            input[0] ===
                1
        ) {
            shadowDescriptor =
                input[1];
        } else if (
            input[0] ===
                3
        ) {
            shadowDescriptor =
                input[2];
        } else {
            return {
                ok: false,
                reason:
                    'missing-shadow-reference'
            };
        }

        if (
            typeof shadowDescriptor !==
                'string' ||
            shadowDescriptor.length ===
                0
        ) {
            return {
                ok: false,
                reason:
                    'unsupported-inline-shadow'
            };
        }

        return {
            ok: true,
            shadowId:
                shadowDescriptor
        };
    };

const convertShadowBlock =
    (
        blocks,
        parentBlockId,
        sourceInput,
        shadowTransform
    ) => {
        const shadowReference =
            getSerializedShadowId(
                sourceInput
            );

        if (!shadowReference.ok) {
            return shadowReference;
        }

        const shadowId =
            shadowReference.shadowId;

        if (
            !Object.prototype
                .hasOwnProperty.call(
                    blocks,
                    shadowId
                )
        ) {
            return {
                ok: false,
                reason:
                    'missing-shadow-block'
            };
        }

        const shadowBlock =
            blocks[
                shadowId
            ];

        if (
            !shadowBlock ||
            typeof shadowBlock !==
                'object' ||
            Array.isArray(
                shadowBlock
            )
        ) {
            return {
                ok: false,
                reason:
                    'invalid-shadow-block'
            };
        }

        if (
            shadowBlock.opcode !==
            shadowTransform
                .sourceOpcode
        ) {
            return {
                ok: false,
                reason:
                    'unexpected-shadow-opcode'
            };
        }

        if (
            shadowBlock.shadow !==
                true
        ) {
            return {
                ok: false,
                reason:
                    'source-block-is-not-shadow'
            };
        }

        if (
            shadowBlock.parent !==
            parentBlockId
        ) {
            return {
                ok: false,
                reason:
                    'shadow-parent-mismatch'
            };
        }

        if (
            !shadowBlock.fields ||
            !Object.prototype
                .hasOwnProperty.call(
                    shadowBlock.fields,
                    shadowTransform
                        .sourceField
                )
        ) {
            return {
                ok: false,
                reason:
                    'missing-shadow-field'
            };
        }

        const sourceField =
            shadowBlock.fields[
                shadowTransform
                    .sourceField
            ];

        if (
            !Array.isArray(
                sourceField
            ) ||
            sourceField.length ===
                0
        ) {
            return {
                ok: false,
                reason:
                    'invalid-shadow-field'
            };
        }

        let transformedValue;

        try {
            transformedValue =
                applyMappingValueTransform(
                    shadowTransform
                        .valueTransform,
                    sourceField[0]
                );
        } catch (error) {
            return {
                ok: false,
                reason:
                    'invalid-shadow-value'
            };
        }

        const targetField = [
            ...sourceField
        ];

        targetField[0] =
            transformedValue;

        const convertedShadow =
            cloneJson(
                shadowBlock
            );

        convertedShadow.opcode =
            shadowTransform
                .targetOpcode;

        convertedShadow.fields = {
            [
                shadowTransform
                    .targetField
            ]:
                targetField
        };

        return {
            ok: true,
            shadowId,
            block:
                convertedShadow
        };
    };

const convertStructuralBlock =
    (
        blocks,
        blockId,
        block,
        entry
    ) => {
        const targetInputs = {};
        const shadowUpdates = {};

        for (
            const argument of
                entry.transform.arguments
        ) {
            if (
                argument.source !==
                    'input' ||
                !argument.shadowTransform
            ) {
                return {
                    converted: false,
                    reason:
                        'unsupported-structural-argument'
                };
            }

            if (
                !block.inputs ||
                !Object.prototype
                    .hasOwnProperty.call(
                        block.inputs,
                        argument.sourceName
                    )
            ) {
                return {
                    converted: false,
                    reason:
                        'missing-source-input'
                };
            }

            const sourceInput =
                block.inputs[
                    argument.sourceName
                ];

            const shadowResult =
                convertShadowBlock(
                    blocks,
                    blockId,
                    sourceInput,
                    argument
                        .shadowTransform
                );

            if (!shadowResult.ok) {
                return {
                    converted: false,
                    reason:
                        shadowResult.reason
                };
            }

            targetInputs[
                argument.target
            ] =
                cloneJson(
                    sourceInput
                );

            shadowUpdates[
                shadowResult.shadowId
            ] =
                shadowResult.block;
        }

        const convertedBlock =
            cloneJson(
                block
            );

        convertedBlock.opcode =
            entry.targetOpcode;

        convertedBlock.fields = {};

        convertedBlock.inputs =
            targetInputs;

        return {
            converted: true,
            block:
                convertedBlock,
            shadowUpdates
        };
    };

const convertPictoBloxProjectStructural =
    project => {
        const simpleConversion =
            convertPictoBloxProjectSimple(
                project
            );

        const convertedProject =
            simpleConversion.project;

        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const mappings =
            new Map(
                mappingCatalog.entries.map(
                    entry => [
                        entry.opcode,
                        entry
                    ]
                )
            );

        const converted = [];
        const deferred = [];

        simpleConversion
            .report
            .deferred
            .filter(
                record =>
                    record.reason ===
                    'structural-shadow-transform'
            )
            .forEach(
                record => {
                    const target =
                        convertedProject
                            .targets[
                            record.targetIndex
                        ];

                    if (
                        !target ||
                        !target.blocks
                    ) {
                        deferred.push({
                            ...record,
                            reason:
                                'missing-target'
                        });

                        return;
                    }

                    const block =
                        target.blocks[
                            record.blockId
                        ];

                    if (!block) {
                        deferred.push({
                            ...record,
                            reason:
                                'missing-source-block'
                        });

                        return;
                    }

                    const entry =
                        mappings.get(
                            record.sourceOpcode
                        );

                    if (
                        !entry ||
                        !entry.transform
                    ) {
                        deferred.push({
                            ...record,
                            reason:
                                'missing-structural-mapping'
                        });

                        return;
                    }

                    const result =
                        convertStructuralBlock(
                            target.blocks,
                            record.blockId,
                            block,
                            entry
                        );

                    if (
                        !result.converted
                    ) {
                        deferred.push({
                            ...record,
                            reason:
                                result.reason
                        });

                        return;
                    }

                    target.blocks[
                        record.blockId
                    ] =
                        result.block;

                    Object.entries(
                        result.shadowUpdates
                    ).forEach(
                        ([
                            shadowId,
                            shadowBlock
                        ]) => {
                            target.blocks[
                                shadowId
                            ] =
                                shadowBlock;
                        }
                    );

                    converted.push({
                        targetIndex:
                            record.targetIndex,

                        targetName:
                            record.targetName,

                        blockId:
                            record.blockId,

                        sourceOpcode:
                            record.sourceOpcode,

                        targetOpcode:
                            record.targetOpcode,

                        shadowBlockIds:
                            Object.keys(
                                result
                                    .shadowUpdates
                            )
                    });
                }
            );

        return {
            project:
                convertedProject,

            report: {
                simpleMappings:
                    simpleConversion.report,

                structuralConvertedBlockCount:
                    converted.length,

                structuralDeferredBlockCount:
                    deferred.length,

                converted,
                deferred
            }
        };
    };

module.exports = {
    convertPictoBloxProjectStructural
};
