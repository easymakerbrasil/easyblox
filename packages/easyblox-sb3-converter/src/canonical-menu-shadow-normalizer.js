const {
    createEasyBloxSupportCatalog
} = require(
    '@easymaker/easyblox-pictoblox-analyzer/src/browser'
);

const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const isBlockObject =
    block =>
        Boolean(
            block &&
            typeof block ===
                'object' &&
            !Array.isArray(
                block
            )
        );

let menuSchemasByOpcode =
    null;

const getMenuSchemasByOpcode =
    () => {
        if (menuSchemasByOpcode) {
            return menuSchemasByOpcode;
        }

        const catalog =
            createEasyBloxSupportCatalog();

        const schemas =
            new Map();

        (
            Array.isArray(
                catalog.menuArgumentSchemas
            ) ?
                catalog.menuArgumentSchemas :
                []
        ).forEach(
            schema => {
                const current =
                    schemas.get(
                        schema.opcode
                    ) ||
                    [];

                current.push(
                    schema
                );

                schemas.set(
                    schema.opcode,
                    current
                );
            }
        );

        menuSchemasByOpcode =
            schemas;

        return menuSchemasByOpcode;
    };

const createUniqueBlockId =
    (
        blocks,
        parentBlockId,
        argumentName
    ) => {
        const baseId =
            `${parentBlockId}__easybloxMenu_${
                argumentName
            }`;

        if (
            !Object.prototype
                .hasOwnProperty.call(
                    blocks,
                    baseId
                )
        ) {
            return baseId;
        }

        let suffix =
            2;

        while (
            Object.prototype
                .hasOwnProperty.call(
                    blocks,
                    `${baseId}_${suffix}`
                )
        ) {
            suffix++;
        }

        return `${baseId}_${suffix}`;
    };

const normalizeBlocks =
    (
        blocks,
        context,
        normalized,
        deferred,
        normalizedBlockIds
    ) => {
        if (
            !blocks ||
            typeof blocks !==
                'object' ||
            Array.isArray(
                blocks
            )
        ) {
            return;
        }

        const schemasByOpcode =
            getMenuSchemasByOpcode();

        Object.keys(
            blocks
        ).forEach(
            blockId => {
                const block =
                    blocks[
                        blockId
                    ];

                if (
                    !isBlockObject(
                        block
                    ) ||
                    typeof block.opcode !==
                        'string'
                ) {
                    return;
                }

                const schemas =
                    schemasByOpcode.get(
                        block.opcode
                    );

                if (
                    !schemas ||
                    schemas.length ===
                        0
                ) {
                    return;
                }

                const pending = [];
                let hasInvalidField =
                    false;

                schemas.forEach(
                    schema => {
                        if (
                            block.inputs &&
                            typeof block.inputs ===
                                'object' &&
                            !Array.isArray(
                                block.inputs
                            ) &&
                            Object.prototype
                                .hasOwnProperty.call(
                                    block.inputs,
                                    schema
                                        .argumentName
                                )
                        ) {
                            return;
                        }

                        if (
                            !block.fields ||
                            typeof block.fields !==
                                'object' ||
                            Array.isArray(
                                block.fields
                            ) ||
                            !Object.prototype
                                .hasOwnProperty.call(
                                    block.fields,
                                    schema
                                        .argumentName
                                )
                        ) {
                            return;
                        }

                        const sourceField =
                            block.fields[
                                schema
                                    .argumentName
                            ];

                        if (
                            !Array.isArray(
                                sourceField
                            ) ||
                            sourceField.length ===
                                0
                        ) {
                            hasInvalidField =
                                true;

                            deferred.push({
                                ...context,

                                blockId,

                                opcode:
                                    block.opcode,

                                argumentName:
                                    schema
                                        .argumentName,

                                reason:
                                    'invalid-menu-field'
                            });

                            return;
                        }

                        pending.push({
                            schema,

                            value:
                                String(
                                    sourceField[0]
                                )
                        });
                    }
                );

                if (
                    hasInvalidField ||
                    pending.length ===
                        0
                ) {
                    return;
                }

                if (
                    !block.inputs ||
                    typeof block.inputs !==
                        'object' ||
                    Array.isArray(
                        block.inputs
                    )
                ) {
                    block.inputs =
                        {};
                }

                pending.forEach(
                    record => {
                        const {
                            schema,
                            value
                        } =
                            record;

                        const shadowBlockId =
                            createUniqueBlockId(
                                blocks,
                                blockId,
                                schema
                                    .argumentName
                            );

                        blocks[
                            shadowBlockId
                        ] = {
                            opcode:
                                schema
                                    .shadowOpcode,

                            next:
                                null,

                            parent:
                                blockId,

                            inputs: {},

                            fields: {
                                [
                                    schema
                                        .fieldName
                                ]: [
                                    value,
                                    null
                                ]
                            },

                            shadow:
                                true,

                            topLevel:
                                false
                        };

                        block.inputs[
                            schema
                                .argumentName
                        ] = [
                            1,
                            shadowBlockId
                        ];

                        delete block.fields[
                            schema
                                .argumentName
                        ];

                        normalized.push({
                            ...context,

                            blockId,

                            opcode:
                                block.opcode,

                            argumentName:
                                schema
                                    .argumentName,

                            menuName:
                                schema
                                    .menuName,

                            shadowBlockId,

                            value
                        });

                        normalizedBlockIds.add(
                            `${context.domain}:${
                                context.targetIndex ??
                                context.boardId ??
                                ''
                            }:${blockId}`
                        );
                    }
                );
            }
        );
    };

const normalizeEasyBloxMenuShadows =
    project => {
        const convertedProject =
            cloneJson(
                project
            );

        const normalized = [];
        const deferred = [];

        const normalizedBlockIds =
            new Set();

        (
            Array.isArray(
                convertedProject.targets
            ) ?
                convertedProject.targets :
                []
        ).forEach(
            (
                target,
                targetIndex
            ) => {
                normalizeBlocks(
                    target &&
                        target.blocks,
                    {
                        domain:
                            'stage',

                        targetIndex,

                        targetName:
                            target &&
                            target.name ?
                                target.name :
                                null
                    },
                    normalized,
                    deferred,
                    normalizedBlockIds
                );
            }
        );

        const uploadPrograms =
            convertedProject
                .easybloxUploadPrograms &&
            typeof convertedProject
                .easybloxUploadPrograms ===
                'object' &&
            !Array.isArray(
                convertedProject
                    .easybloxUploadPrograms
            ) ?
                convertedProject
                    .easybloxUploadPrograms :
                {};

        Object.entries(
            uploadPrograms
        ).forEach(
            ([
                boardId,
                program
            ]) => {
                normalizeBlocks(
                    program &&
                        program.blocks,
                    {
                        domain:
                            'upload',

                        boardId
                    },
                    normalized,
                    deferred,
                    normalizedBlockIds
                );
            }
        );

        return {
            project:
                convertedProject,

            report: {
                normalizedBlockCount:
                    normalizedBlockIds
                        .size,

                normalizedArgumentCount:
                    normalized.length,

                normalized,

                deferred
            }
        };
    };

module.exports = {
    normalizeEasyBloxMenuShadows
};
