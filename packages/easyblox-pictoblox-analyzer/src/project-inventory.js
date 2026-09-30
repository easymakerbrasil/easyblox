const getOpcodeNamespace =
    opcode => {
        const separatorIndex =
            opcode.indexOf('_');

        if (separatorIndex <= 0) {
            return opcode;
        }

        return opcode.substring(
            0,
            separatorIndex
        );
    };

const normalizeDeclaredExtensions =
    extensions => {
        if (!Array.isArray(extensions)) {
            return [];
        }

        return Array.from(
            new Set(
                extensions.filter(
                    extensionId =>
                        typeof extensionId ===
                            'string' &&
                        extensionId.length > 0
                )
            )
        ).sort();
    };

const normalizeBoardSelected =
    boardSelected => {
        if (
            typeof boardSelected !==
                'string'
        ) {
            return null;
        }

        const normalized =
            boardSelected.trim();

        return normalized.length >
            0 ?
            normalized :
            null;
    };

const incrementCount =
    (
        counts,
        key
    ) => {
        counts.set(
            key,
            (
                counts.get(
                    key
                ) ||
                0
            ) +
            1
        );
    };

    const normalizeBlockFields =
    fields => {
        if (
            !fields ||
            typeof fields !==
                'object' ||
            Array.isArray(
                fields
            )
        ) {
            return {};
        }

        const normalized = {};

        Object.keys(
            fields
        )
            .sort()
            .forEach(
                fieldName => {
                    const field =
                        fields[
                            fieldName
                        ];

                    const value =
                        Array.isArray(
                            field
                        ) ?
                            field[0] :
                            (
                                field &&
                                typeof field ===
                                    'object' &&
                                Object.prototype
                                    .hasOwnProperty
                                    .call(
                                        field,
                                        'value'
                                    ) ?
                                    field.value :
                                    field
                            );

                    if (
                        value === null ||
                        typeof value ===
                            'undefined' ||
                        ![
                            'string',
                            'number',
                            'boolean'
                        ].includes(
                            typeof value
                        )
                    ) {
                        return;
                    }

                    normalized[
                        fieldName
                    ] =
                        String(
                            value
                        );
                }
            );

        return normalized;
    };

const incrementFieldVariant =
    (
        variantsByOpcode,
        opcode,
        fields
    ) => {
        const normalizedFields =
            normalizeBlockFields(
                fields
            );

        if (
            Object.keys(
                normalizedFields
            ).length === 0
        ) {
            return;
        }

        let variants =
            variantsByOpcode.get(
                opcode
            );

        if (!variants) {
            variants =
                new Map();

            variantsByOpcode.set(
                opcode,
                variants
            );
        }

        const key =
            JSON.stringify(
                normalizedFields
            );

        const existing =
            variants.get(
                key
            );

        if (existing) {
            existing.count +=
                1;

            return;
        }

        variants.set(
            key,
            {
                fields:
                    normalizedFields,
                count:
                    1
            }
        );
    };

const createOpcodeRecords =
    (
        counts,
        fieldVariantsByOpcode =
            null
    ) =>
        Array.from(
            counts.entries()
        )
            .map(
                ([
                    opcode,
                    count
                ]) => {
                    const record = {
                        opcode,
                        namespace:
                            getOpcodeNamespace(
                                opcode
                            ),
                        count
                    };

                    const fieldVariants =
                        fieldVariantsByOpcode ?
                            fieldVariantsByOpcode
                                .get(
                                    opcode
                                ) :
                            null;

                    if (
                        fieldVariants &&
                        fieldVariants.size >
                            0
                    ) {
                        record.fieldVariants =
                            Array.from(
                                fieldVariants
                                    .values()
                            )
                                .map(
                                    variant => ({
                                        fields: {
                                            ...variant.fields
                                        },
                                        count:
                                            variant.count
                                    })
                                )
                                .sort(
                                    (
                                        left,
                                        right
                                    ) =>
                                        JSON.stringify(
                                            left.fields
                                        ).localeCompare(
                                            JSON.stringify(
                                                right.fields
                                            )
                                        )
                                );
                    }

                    return record;
                }
            )
            .sort(
                (
                    left,
                    right
                ) =>
                    left.opcode.localeCompare(
                        right.opcode
                    )
            );

const createNamespaceRecords =
    counts =>
        Array.from(
            counts.entries()
        )
            .map(
                ([
                    namespace,
                    count
                ]) => ({
                    namespace,
                    count
                })
            )
            .sort(
                (
                    left,
                    right
                ) =>
                    left.namespace.localeCompare(
                        right.namespace
                    )
            );

const sumCounts =
    records =>
        records.reduce(
            (
                total,
                record
            ) =>
                total +
                record.count,
            0
        );

const createProjectInventory =
    project => {
        if (
            !project ||
            typeof project !== 'object' ||
            Array.isArray(project)
        ) {
            throw new TypeError(
                'PictoBlox project inventory requires a project object'
            );
        }

        if (!Array.isArray(project.targets)) {
            throw new TypeError(
                'PictoBlox project inventory requires a targets array'
            );
        }

        const opcodeCounts =
            new Map();

        const namespaceCounts =
            new Map();

        const functionalOpcodeCounts =
            new Map();

        const functionalFieldVariants =
            new Map();

        const functionalNamespaceCounts =
            new Map();

        const shadowOpcodeCounts =
            new Map();

        const shadowNamespaceCounts =
            new Map();

        const targets =
            project.targets.map(
                (
                    target,
                    targetIndex
                ) => {
                    const blocks =
                        target &&
                        target.blocks &&
                        typeof target.blocks ===
                            'object' &&
                        !Array.isArray(
                            target.blocks
                        ) ?
                            target.blocks :
                            {};

                    let blockCount = 0;

                    const targetOpcodes =
                        new Set();

                    Object.values(
                        blocks
                    ).forEach(block => {
                        if (
                            !block ||
                            typeof block.opcode !==
                                'string' ||
                            block.opcode.length === 0
                        ) {
                            return;
                        }

                        const opcode =
                            block.opcode;

                        const namespace =
                            getOpcodeNamespace(
                                opcode
                            );

                        const isShadow =
                            block.shadow ===
                                true;

                        blockCount += 1;

                        targetOpcodes.add(
                            opcode
                        );

                        incrementCount(
                            opcodeCounts,
                            opcode
                        );

                        incrementCount(
                            namespaceCounts,
                            namespace
                        );

                        if (isShadow) {
                            incrementCount(
                                shadowOpcodeCounts,
                                opcode
                            );

                            incrementCount(
                                shadowNamespaceCounts,
                                namespace
                            );
                        } else {
                            incrementCount(
                                functionalOpcodeCounts,
                                opcode
                            );

                            incrementFieldVariant(
                                functionalFieldVariants,
                                opcode,
                                block.fields
                            );

                            incrementCount(
                                functionalNamespaceCounts,
                                namespace
                            );
                        }
                    });

                    return {
                        index:
                            targetIndex,
                        name:
                            target &&
                            typeof target.name ===
                                'string' ?
                                target.name :
                                '',
                        isStage:
                            Boolean(
                                target &&
                                target.isStage
                            ),
                        blockCount,
                        uniqueOpcodeCount:
                            targetOpcodes.size
                    };
                }
            );

        const opcodes =
            createOpcodeRecords(
                opcodeCounts
            );

        const namespaces =
            createNamespaceRecords(
                namespaceCounts
            );

        const functionalOpcodes =
            createOpcodeRecords(
                functionalOpcodeCounts,
                functionalFieldVariants
            );

        const functionalNamespaces =
            createNamespaceRecords(
                functionalNamespaceCounts
            );

        const shadowOpcodes =
            createOpcodeRecords(
                shadowOpcodeCounts
            );

        const shadowNamespaces =
            createNamespaceRecords(
                shadowNamespaceCounts
            );

        return {
            targetCount:
                targets.length,
            blockCount:
                sumCounts(
                    opcodes
                ),
            functionalBlockCount:
                sumCounts(
                    functionalOpcodes
                ),
            shadowBlockCount:
                sumCounts(
                    shadowOpcodes
                ),
            uniqueOpcodeCount:
                opcodes.length,
            uniqueFunctionalOpcodeCount:
                functionalOpcodes.length,
            uniqueShadowOpcodeCount:
                shadowOpcodes.length,
            boardSelected:
                normalizeBoardSelected(
                    project.boardSelected
                ),
            declaredExtensions:
                normalizeDeclaredExtensions(
                    project.extensions
                ),
            targets,
            namespaces,
            functionalNamespaces,
            shadowNamespaces,
            opcodes,
            functionalOpcodes,
            shadowOpcodes
        };
    };

module.exports = {
    createProjectInventory,
    getOpcodeNamespace
};
