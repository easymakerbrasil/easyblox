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

const createOpcodeRecords =
    counts =>
        Array.from(
            counts.entries()
        )
            .map(
                ([
                    opcode,
                    count
                ]) => ({
                    opcode,
                    namespace:
                        getOpcodeNamespace(
                            opcode
                        ),
                    count
                })
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
                functionalOpcodeCounts
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
