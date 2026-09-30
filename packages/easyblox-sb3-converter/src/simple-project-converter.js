const {
    createPictoBloxMappingCatalog,
    createProjectInventory
} = require(
    '@easymaker/easyblox-pictoblox-analyzer'
);

const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const getBlockFieldValue =
    (
        block,
        fieldName
    ) => {
        if (
            !block ||
            !block.fields ||
            !Object.prototype.hasOwnProperty.call(
                block.fields,
                fieldName
            )
        ) {
            return undefined;
        }

        const field =
            block.fields[
                fieldName
            ];

        if (
            !Array.isArray(
                field
            ) ||
            field.length ===
                0
        ) {
            return undefined;
        }

        return field[0];
    };

const mappingAppliesToBlock =
    (
        entry,
        boardSelected,
        block
    ) => {
        if (
            entry.sourceBoards &&
            !entry.sourceBoards.includes(
                boardSelected
            )
        ) {
            return false;
        }

        if (!entry.sourceFields) {
            return true;
        }

        return Object.entries(
            entry.sourceFields
        ).every(
            ([
                fieldName,
                acceptedValues
            ]) => {
                const sourceValue =
                    getBlockFieldValue(
                        block,
                        fieldName
                    );

                if (
                    typeof sourceValue ===
                        'undefined'
                ) {
                    return false;
                }

                return acceptedValues.includes(
                    String(
                        sourceValue
                    )
                );
            }
        );
    };

const requiresStructuralTransform =
    entry =>
        entry.transform.arguments.some(
            argument =>
                Boolean(
                    argument.shadowTransform
                )
        );

const mapFieldArgument =
    (
        block,
        argument
    ) => {
        if (
            !block.fields ||
            !Object.prototype.hasOwnProperty.call(
                block.fields,
                argument.sourceName
            )
        ) {
            return {
                ok: false,
                reason:
                    'missing-source-field'
            };
        }

        const sourceField =
            block.fields[
                argument.sourceName
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
                    'invalid-source-field'
            };
        }

        const targetField = [
            ...sourceField
        ];

        if (argument.valueMap) {
            const sourceValue =
                String(
                    sourceField[0]
                );

            if (
                !Object.prototype.hasOwnProperty.call(
                    argument.valueMap,
                    sourceValue
                )
            ) {
                return {
                    ok: false,
                    reason:
                        'unmapped-field-value'
                };
            }

            targetField[0] =
                argument.valueMap[
                    sourceValue
                ];
        }

        return {
            ok: true,
            value:
                targetField
        };
    };

const mapInputArgument =
    (
        block,
        argument
    ) => {
        if (
            !block.inputs ||
            !Object.prototype.hasOwnProperty.call(
                block.inputs,
                argument.sourceName
            )
        ) {
            return {
                ok: false,
                reason:
                    'missing-source-input'
            };
        }

        return {
            ok: true,
            value:
                cloneJson(
                    block.inputs[
                        argument.sourceName
                    ]
                )
        };
    };

const convertSimpleBlock =
    (
        block,
        entry
    ) => {
        const targetFields = {};
        const targetInputs = {};

        for (
            const argument of
                entry.transform.arguments
        ) {
            const mapped =
                argument.source ===
                    'field' ?
                    mapFieldArgument(
                        block,
                        argument
                    ) :
                    mapInputArgument(
                        block,
                        argument
                    );

            if (!mapped.ok) {
                return {
                    converted: false,
                    reason:
                        mapped.reason
                };
            }

            if (
                argument.source ===
                    'field'
            ) {
                targetFields[
                    argument.target
                ] =
                    mapped.value;
            } else {
                targetInputs[
                    argument.target
                ] =
                    mapped.value;
            }
        }

        const convertedBlock =
            cloneJson(
                block
            );

        convertedBlock.opcode =
            entry.targetOpcode;

        convertedBlock.fields =
            targetFields;

        convertedBlock.inputs =
            targetInputs;

        return {
            converted: true,
            block:
                convertedBlock
        };
    };

const convertPictoBloxProjectSimple =
    project => {
        const inventory =
            createProjectInventory(
                project
            );

        const convertedProject =
            cloneJson(
                project
            );

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

        convertedProject.targets.forEach(
            (
                target,
                targetIndex
            ) => {
                if (
                    !target ||
                    !target.blocks ||
                    typeof target.blocks !==
                        'object' ||
                    Array.isArray(
                        target.blocks
                    )
                ) {
                    return;
                }

                Object.entries(
                    target.blocks
                ).forEach(
                    ([
                        blockId,
                        block
                    ]) => {
                        if (
                            !block ||
                            typeof block.opcode !==
                                'string' ||
                            block.shadow ===
                                true
                        ) {
                            return;
                        }

                        const entry =
                            mappings.get(
                                block.opcode
                            );

                        if (
                            !entry ||
                            !mappingAppliesToBlock(
                                entry,
                                inventory
                                    .boardSelected,
                                block
                            )
                        ) {
                            return;
                        }

                        if (
                            requiresStructuralTransform(
                                entry
                            )
                        ) {
                            deferred.push({
                                targetIndex,
                                targetName:
                                    target.name ||
                                    null,
                                blockId,
                                sourceOpcode:
                                    block.opcode,
                                targetOpcode:
                                    entry.targetOpcode,
                                reason:
                                    'structural-shadow-transform'
                            });

                            return;
                        }

                        const result =
                            convertSimpleBlock(
                                block,
                                entry
                            );

                        if (!result.converted) {
                            deferred.push({
                                targetIndex,
                                targetName:
                                    target.name ||
                                    null,
                                blockId,
                                sourceOpcode:
                                    block.opcode,
                                targetOpcode:
                                    entry.targetOpcode,
                                reason:
                                    result.reason
                            });

                            return;
                        }

                        target.blocks[
                            blockId
                        ] =
                            result.block;

                        converted.push({
                            targetIndex,
                            targetName:
                                target.name ||
                                null,
                            blockId,
                            sourceOpcode:
                                block.opcode,
                            targetOpcode:
                                entry.targetOpcode
                        });
                    }
                );
            }
        );

        return {
            project:
                convertedProject,

            report: {
                convertedBlockCount:
                    converted.length,

                deferredBlockCount:
                    deferred.length,

                converted,
                deferred
            }
        };
    };

module.exports = {
    convertPictoBloxProjectSimple
};
