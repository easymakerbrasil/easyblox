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

                        blockCount += 1;

                        targetOpcodes.add(
                            opcode
                        );

                        opcodeCounts.set(
                            opcode,
                            (
                                opcodeCounts.get(
                                    opcode
                                ) ||
                                0
                            ) +
                            1
                        );

                        namespaceCounts.set(
                            namespace,
                            (
                                namespaceCounts.get(
                                    namespace
                                ) ||
                                0
                            ) +
                            1
                        );
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
            Array.from(
                opcodeCounts.entries()
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

        const namespaces =
            Array.from(
                namespaceCounts.entries()
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

        return {
            targetCount:
                targets.length,
            blockCount:
                opcodes.reduce(
                    (
                        total,
                        opcode
                    ) =>
                        total +
                        opcode.count,
                    0
                ),
            uniqueOpcodeCount:
                opcodes.length,
            declaredExtensions:
                normalizeDeclaredExtensions(
                    project.extensions
                ),
            targets,
            namespaces,
            opcodes
        };
    };

module.exports = {
    createProjectInventory,
    getOpcodeNamespace
};
