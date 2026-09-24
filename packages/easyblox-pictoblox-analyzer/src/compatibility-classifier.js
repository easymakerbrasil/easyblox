const COMPATIBILITY_STATUSES =
    Object.freeze({
        SUPPORTED:
            'supported',
        MAPPABLE:
            'mappable',
        UNSUPPORTED:
            'unsupported',
        UNKNOWN:
            'unknown'
    });

const COMPATIBILITY_STATUS_VALUES =
    Object.freeze(
        Object.values(
            COMPATIBILITY_STATUSES
        )
    );

const requireNonEmptyString =
    (
        value,
        message
    ) => {
        if (
            typeof value !==
                'string' ||
            value.length === 0
        ) {
            throw new TypeError(
                message
            );
        }

        return value;
    };

const normalizeOptionalString =
    (
        value,
        message
    ) => {
        if (
            typeof value ===
                'undefined'
        ) {
            return undefined;
        }

        return requireNonEmptyString(
            value,
            message
        );
    };

const normalizeSourceBoards =
    (
        value,
        opcode
    ) => {
        if (
            typeof value ===
                'undefined'
        ) {
            return undefined;
        }

        if (
            !Array.isArray(
                value
            ) ||
            value.length ===
                0
        ) {
            throw new TypeError(
                `Compatibility catalog entry ${opcode} requires sourceBoards to be a non-empty array`
            );
        }

        const boards =
            value.map(
                (
                    board,
                    index
                ) =>
                    requireNonEmptyString(
                        typeof board ===
                            'string' ?
                            board.trim() :
                            board,
                        `Compatibility catalog entry ${opcode} has an invalid sourceBoards value at index ${index}`
                    )
            );

        return Object.freeze(
            Array.from(
                new Set(
                    boards
                )
            ).sort()
        );
    };

const normalizeCatalogEntry =
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
                `Compatibility catalog entry ${index} must be an object`
            );
        }

        const opcode =
            requireNonEmptyString(
                entry.opcode,
                `Compatibility catalog entry ${index} requires an opcode`
            );

        const status =
            requireNonEmptyString(
                entry.status,
                `Compatibility catalog entry ${index} requires a status`
            );

        if (
            !COMPATIBILITY_STATUS_VALUES
                .includes(
                    status
                )
        ) {
            throw new RangeError(
                `Unsupported compatibility status: ${status}`
            );
        }

        const targetOpcode =
            normalizeOptionalString(
                entry.targetOpcode,
                `Compatibility catalog entry ${opcode} has an invalid targetOpcode`
            );

        const note =
            normalizeOptionalString(
                entry.note,
                `Compatibility catalog entry ${opcode} has an invalid note`
            );

        const sourceBoards =
            normalizeSourceBoards(
                entry.sourceBoards,
                opcode
            );

        if (
            status ===
                COMPATIBILITY_STATUSES
                    .MAPPABLE &&
            !targetOpcode
        ) {
            throw new TypeError(
                `Mappable opcode ${opcode} requires a targetOpcode`
            );
        }

        const normalized = {
            opcode,
            status
        };

        if (targetOpcode) {
            normalized.targetOpcode =
                targetOpcode;
        }

        if (note) {
            normalized.note =
                note;
        }

        if (sourceBoards) {
            normalized.sourceBoards =
                sourceBoards;
        }

        return Object.freeze(
            normalized
        );
    };

const createCompatibilityCatalog =
    (
        entries = []
    ) => {
        if (
            !Array.isArray(
                entries
            )
        ) {
            throw new TypeError(
                'Compatibility catalog requires an array of entries'
            );
        }

        const catalog =
            new Map();

        entries.forEach(
            (
                entry,
                index
            ) => {
                const normalized =
                    normalizeCatalogEntry(
                        entry,
                        index
                    );

                if (
                    catalog.has(
                        normalized.opcode
                    )
                ) {
                    throw new Error(
                        `Duplicate compatibility catalog opcode: ${
                            normalized.opcode
                        }`
                    );
                }

                catalog.set(
                    normalized.opcode,
                    normalized
                );
            }
        );

        return catalog;
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

const normalizeInventoryBoard =
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

const catalogEntryAppliesToBoard =
    (
        entry,
        boardSelected
    ) => {
        if (
            !entry ||
            !entry.sourceBoards
        ) {
            return Boolean(
                entry
            );
        }

        const board =
            normalizeInventoryBoard(
                boardSelected
            );

        return (
            board !==
                null &&
            entry.sourceBoards
                .includes(
                    board
                )
        );
    };
const validateInventoryOpcode =
    (
        opcodeRecord,
        index
    ) => {
        if (
            !opcodeRecord ||
            typeof opcodeRecord !==
                'object' ||
            Array.isArray(
                opcodeRecord
            )
        ) {
            throw new TypeError(
                `Inventory opcode ${index} must be an object`
            );
        }

        const opcode =
            requireNonEmptyString(
                opcodeRecord.opcode,
                `Inventory opcode ${index} requires an opcode`
            );

        const namespace =
            requireNonEmptyString(
                opcodeRecord.namespace,
                `Inventory opcode ${opcode} requires a namespace`
            );

        if (
            !Number.isInteger(
                opcodeRecord.count
            ) ||
            opcodeRecord.count <= 0
        ) {
            throw new TypeError(
                `Inventory opcode ${opcode} requires a positive integer count`
            );
        }

        return {
            opcode,
            namespace,
            count:
                opcodeRecord.count
        };
    };

const createEmptySummary =
    () => {
        const summary = {};

        COMPATIBILITY_STATUS_VALUES
            .forEach(status => {
                summary[status] = {
                    blockCount: 0,
                    uniqueOpcodeCount: 0
                };
            });

        return summary;
    };

const classifyProjectInventory =
    (
        inventory,
        catalog = []
    ) => {
        if (
            !inventory ||
            typeof inventory !==
                'object' ||
            Array.isArray(
                inventory
            )
        ) {
            throw new TypeError(
                'Compatibility classifier requires a project inventory'
            );
        }

        if (
            typeof inventory.functionalOpcodes !==
                'undefined' &&
            !Array.isArray(
                inventory.functionalOpcodes
            )
        ) {
            throw new TypeError(
                'Compatibility classifier requires functional inventory opcodes to be an array'
            );
        }

        const inventoryOpcodes =
            Array.isArray(
                inventory.functionalOpcodes
            ) ?
                inventory.functionalOpcodes :
                inventory.opcodes;

        if (
            !Array.isArray(
                inventoryOpcodes
            )
        ) {
            throw new TypeError(
                'Compatibility classifier requires inventory opcodes'
            );
        }

        const normalizedCatalog =
            normalizeCatalog(
                catalog
            );

        const summary =
            createEmptySummary();

        const opcodes =
            inventoryOpcodes.map(
                (
                    opcodeRecord,
                    index
                ) => {
                    const normalizedOpcode =
                        validateInventoryOpcode(
                            opcodeRecord,
                            index
                        );

                    const catalogEntry =
                        normalizedCatalog.get(
                            normalizedOpcode.opcode
                        );

                    const applicableCatalogEntry =
                        catalogEntryAppliesToBoard(
                            catalogEntry,
                            inventory
                                .boardSelected
                        ) ?
                            catalogEntry :
                            null;

                    const status =
                        applicableCatalogEntry ?
                            applicableCatalogEntry
                                .status :
                            COMPATIBILITY_STATUSES
                                .UNKNOWN;

                    summary[status]
                        .blockCount +=
                        normalizedOpcode.count;

                    summary[status]
                        .uniqueOpcodeCount +=
                        1;

                    const classified = {
                        ...normalizedOpcode,
                        status
                    };

                    if (
                        applicableCatalogEntry &&
                        applicableCatalogEntry
                            .targetOpcode
                    ) {
                        classified.targetOpcode =
                            applicableCatalogEntry
                                .targetOpcode;
                    }

                    if (
                        applicableCatalogEntry &&
                        applicableCatalogEntry
                            .note
                    ) {
                        classified.note =
                            applicableCatalogEntry
                                .note;
                    }

                    if (
                        applicableCatalogEntry &&
                        applicableCatalogEntry
                            .sourceBoards
                    ) {
                        classified.sourceBoards =
                            [
                                ...applicableCatalogEntry
                                    .sourceBoards
                            ];
                    }

                    return classified;
                }
            );

        return {
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
            summary,
            opcodes
        };
    };

module.exports = {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory
};
