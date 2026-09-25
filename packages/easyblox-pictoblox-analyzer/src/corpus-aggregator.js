const crypto =
    require('node:crypto');

const {
    createProjectInventory
} = require('./project-inventory');

const {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory
} = require('./compatibility-classifier');

const requireProjectId =
    (
        value,
        index
    ) => {
        if (
            typeof value !==
                'string' ||
            value.length ===
                0
        ) {
            throw new TypeError(
                `Corpus project ${index} requires a non-empty id`
            );
        }

        return value;
    };

const normalizeEntries =
    entries => {
        if (
            !Array.isArray(
                entries
            )
        ) {
            throw new TypeError(
                'Project corpus requires an array of entries'
            );
        }

        const ids =
            new Set();

        const normalized =
            entries.map(
                (
                    entry,
                    index
                ) => {
                    if (
                        !entry ||
                        typeof entry !==
                            'object' ||
                        Array.isArray(
                            entry
                        )
                    ) {
                        throw new TypeError(
                            `Corpus project ${index} must be an object`
                        );
                    }

                    const id =
                        requireProjectId(
                            entry.id,
                            index
                        );

                    if (
                        ids.has(
                            id
                        )
                    ) {
                        throw new Error(
                            `Duplicate corpus project id: ${id}`
                        );
                    }

                    ids.add(
                        id
                    );

                    return {
                        id,
                        project:
                            entry.project
                    };
                }
            );

        return normalized.sort(
            (
                left,
                right
            ) =>
                left.id.localeCompare(
                    right.id
                )
        );
    };

const normalizeCatalog =
    catalog => {
        if (
            catalog instanceof
                Map
        ) {
            return catalog;
        }

        return createCompatibilityCatalog(
            catalog
        );
    };

const createProjectSignature =
    project =>
        crypto
            .createHash(
                'sha256'
            )
            .update(
                JSON.stringify(
                    project
                ),
                'utf8'
            )
            .digest(
                'hex'
            );

const getErrorMessage =
    error =>
        error &&
        typeof error.message ===
            'string' ?
            error.message :
            String(
                error
            );

const addExtension =
    (
        extensions,
        extensionId,
        projectId
    ) => {
        let record =
            extensions.get(
                extensionId
            );

        if (!record) {
            record = {
                extensionId,
                projectIds:
                    new Set()
            };

            extensions.set(
                extensionId,
                record
            );
        }

        record.projectIds.add(
            projectId
        );
    };

const addFunctionalOpcode =
    (
        opcodes,
        opcode,
        projectId
    ) => {
        const classificationKey =
            `${
                opcode.status
            }\u0000${
                opcode.opcode
            }`;

        let record =
            opcodes.get(
                classificationKey
            );

        if (!record) {
            record = {
                opcode:
                    opcode.opcode,
                namespace:
                    opcode.namespace,
                status:
                    opcode.status,
                blockCount:
                    0,
                projectIds:
                    new Set()
            };

            if (
                opcode.targetOpcode
            ) {
                record.targetOpcode =
                    opcode.targetOpcode;
            }

            if (
                opcode.note
            ) {
                record.note =
                    opcode.note;
            }

            if (
                opcode.sourceBoards
            ) {
                record.sourceBoards =
                    [
                        ...opcode.sourceBoards
                    ];
            }

            if (
                opcode.sourceFields
            ) {
                record.sourceFields =
                    Object.fromEntries(
                        Object.entries(
                            opcode.sourceFields
                        ).map(
                            ([
                                fieldName,
                                values
                            ]) => [
                                fieldName,
                                [
                                    ...values
                                ]
                            ]
                        )
                    );
            }

            if (
                opcode.transform
            ) {
                record.transform =
                    opcode.transform;
            }

            opcodes.set(
                classificationKey,
                record
            );
        }

        record.blockCount +=
            opcode.count;

        record.projectIds.add(
            projectId
        );
    };

const addShadowOpcode =
    (
        opcodes,
        opcode,
        projectId
    ) => {
        let record =
            opcodes.get(
                opcode.opcode
            );

        if (!record) {
            record = {
                opcode:
                    opcode.opcode,
                namespace:
                    opcode.namespace,
                blockCount:
                    0,
                projectIds:
                    new Set()
            };

            opcodes.set(
                opcode.opcode,
                record
            );
        }

        record.blockCount +=
            opcode.count;

        record.projectIds.add(
            projectId
        );
    };

const normalizeOpcodeRecords =
    opcodes =>
        Array.from(
            opcodes.values()
        )
            .map(
                record => ({
                    ...record,
                    projectCount:
                        record.projectIds
                            .size,
                    projectIds:
                        Array.from(
                            record.projectIds
                        ).sort()
                })
            )
            .sort(
                (
                    left,
                    right
                ) =>
                    right.projectCount -
                        left.projectCount ||
                    right.blockCount -
                        left.blockCount ||
                    left.opcode.localeCompare(
                        right.opcode
                    )
            );

const normalizeExtensionRecords =
    extensions =>
        Array.from(
            extensions.values()
        )
            .map(
                record => ({
                    extensionId:
                        record.extensionId,
                    projectCount:
                        record.projectIds
                            .size,
                    projectIds:
                        Array.from(
                            record.projectIds
                        ).sort()
                })
            )
            .sort(
                (
                    left,
                    right
                ) =>
                    right.projectCount -
                        left.projectCount ||
                    left.extensionId
                        .localeCompare(
                            right.extensionId
                        )
            );

const createCompatibilitySummary =
    (
        functionalOpcodes,
        statusBlockCounts,
        statusProjectIds
    ) => {
        const summary = {};

        Object.values(
            COMPATIBILITY_STATUSES
        ).forEach(
            status => {
                summary[status] = {
                    blockCount:
                        statusBlockCounts.get(
                            status
                        ) ||
                        0,
                    projectCount:
                        statusProjectIds.get(
                            status
                        ).size,
                    uniqueOpcodeCount:
                        functionalOpcodes.filter(
                            opcode =>
                                opcode.status ===
                                    status
                        ).length
                };
            }
        );

        return summary;
    };

const aggregateProjectCorpus =
    (
        entries,
        catalog = []
    ) => {
        const normalizedEntries =
            normalizeEntries(
                entries
            );

        const normalizedCatalog =
            normalizeCatalog(
                catalog
            );

        const functionalOpcodeMap =
            new Map();

        const shadowOpcodeMap =
            new Map();

        const extensionMap =
            new Map();

        const signatures =
            new Map();

        const statusBlockCounts =
            new Map();

        const statusProjectIds =
            new Map(
                Object.values(
                    COMPATIBILITY_STATUSES
                ).map(
                    status => [
                        status,
                        new Set()
                    ]
                )
            );

        Object.values(
            COMPATIBILITY_STATUSES
        ).forEach(
            status => {
                statusBlockCounts.set(
                    status,
                    0
                );
            }
        );

        const projects = [];

        const errors = [];

        let blockCount = 0;

        let functionalBlockCount = 0;

        let shadowBlockCount = 0;

        normalizedEntries.forEach(
            entry => {
                try {
                    const inventory =
                        createProjectInventory(
                            entry.project
                        );

                    const classification =
                        classifyProjectInventory(
                            inventory,
                            normalizedCatalog
                        );

                    const signature =
                        createProjectSignature(
                            entry.project
                        );

                    blockCount +=
                        inventory.blockCount;

                    functionalBlockCount +=
                        inventory
                            .functionalBlockCount;

                    shadowBlockCount +=
                        inventory
                            .shadowBlockCount;

                    inventory
                        .declaredExtensions
                        .forEach(
                            extensionId => {
                                addExtension(
                                    extensionMap,
                                    extensionId,
                                    entry.id
                                );
                            }
                        );

                    classification
                        .opcodes
                        .forEach(
                            opcode => {
                                addFunctionalOpcode(
                                    functionalOpcodeMap,
                                    opcode,
                                    entry.id
                                );

                                statusBlockCounts.set(
                                    opcode.status,
                                    statusBlockCounts.get(
                                        opcode.status
                                    ) +
                                        opcode.count
                                );

                                statusProjectIds
                                    .get(
                                        opcode.status
                                    )
                                    .add(
                                        entry.id
                                    );
                            }
                        );

                    inventory
                        .shadowOpcodes
                        .forEach(
                            opcode => {
                                addShadowOpcode(
                                    shadowOpcodeMap,
                                    opcode,
                                    entry.id
                                );
                            }
                        );

                    const signatureProjects =
                        signatures.get(
                            signature
                        ) ||
                        [];

                    signatureProjects.push(
                        entry.id
                    );

                    signatures.set(
                        signature,
                        signatureProjects
                    );

                    projects.push({
                        id:
                            entry.id,
                        signature,
                        boardSelected:
                            inventory
                                .boardSelected,
                        targetCount:
                            inventory
                                .targetCount,
                        blockCount:
                            inventory
                                .blockCount,
                        functionalBlockCount:
                            inventory
                                .functionalBlockCount,
                        shadowBlockCount:
                            inventory
                                .shadowBlockCount,
                        uniqueFunctionalOpcodeCount:
                            inventory
                                .uniqueFunctionalOpcodeCount,
                        uniqueShadowOpcodeCount:
                            inventory
                                .uniqueShadowOpcodeCount,
                        declaredExtensions:
                            inventory
                                .declaredExtensions,
                        compatibility:
                            classification
                                .summary
                    });
                } catch (error) {
                    errors.push({
                        id:
                            entry.id,
                        error:
                            getErrorMessage(
                                error
                            )
                    });
                }
            }
        );

        const functionalOpcodes =
            normalizeOpcodeRecords(
                functionalOpcodeMap
            );

        const shadowOpcodes =
            normalizeOpcodeRecords(
                shadowOpcodeMap
            );

        const extensions =
            normalizeExtensionRecords(
                extensionMap
            );

        const duplicateGroups =
            Array.from(
                signatures.entries()
            )
                .filter(
                    (
                        [
                            ,
                            projectIds
                        ]
                    ) =>
                        projectIds.length >
                            1
                )
                .map(
                    (
                        [
                            signature,
                            projectIds
                        ]
                    ) => ({
                        signature,
                        projectCount:
                            projectIds.length,
                        projectIds:
                            projectIds.sort()
                    })
                )
                .sort(
                    (
                        left,
                        right
                    ) =>
                        right.projectCount -
                            left.projectCount ||
                        left.signature.localeCompare(
                            right.signature
                        )
                );

        return {
            summary: {
                projectCount:
                    normalizedEntries.length,
                analyzedProjectCount:
                    projects.length,
                failedProjectCount:
                    errors.length,
                blockCount,
                functionalBlockCount,
                shadowBlockCount,
                uniqueFunctionalOpcodeCount:
                    new Set(
                        functionalOpcodes.map(
                            opcode =>
                                opcode.opcode
                        )
                    ).size,
                uniqueShadowOpcodeCount:
                    shadowOpcodes.length,
                declaredExtensionCount:
                    extensions.length,
                distinctProjectJsonCount:
                    signatures.size,
                duplicateGroupCount:
                    duplicateGroups.length
            },
            compatibility:
                createCompatibilitySummary(
                    functionalOpcodes,
                    statusBlockCounts,
                    statusProjectIds
                ),
            functionalOpcodes,
            shadowOpcodes,
            extensions,
            projects:
                projects.sort(
                    (
                        left,
                        right
                    ) =>
                        left.id.localeCompare(
                            right.id
                        )
                ),
            duplicateGroups,
            errors:
                errors.sort(
                    (
                        left,
                        right
                    ) =>
                        left.id.localeCompare(
                            right.id
                        )
                )
        };
    };

module.exports = {
    aggregateProjectCorpus,
    createProjectSignature
};
