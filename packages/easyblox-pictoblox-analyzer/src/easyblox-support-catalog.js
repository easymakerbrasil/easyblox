const path =
    require('path');

const {
    COMPATIBILITY_STATUSES
} = require('./compatibility-classifier');

const INTERNAL_ONLY_EXTENSION_IDS =
    new Set([
        'coreExample'
    ]);

const CORE_SERIALIZED_AUXILIARY_OPCODES =
    Object.freeze([
        'colour_picker',
        'control_create_clone_of_menu',
        'data_listcontents',
        'data_variable',
        'event_broadcast_menu',
        'looks_backdrops',
        'looks_costume',
        'math_angle',
        'math_integer',
        'math_number',
        'math_positive_number',
        'math_whole_number',
        'motion_glideto_menu',
        'motion_goto_menu',
        'motion_pointtowards_menu',
        'note',
        'procedures_prototype',
        'sensing_distancetomenu',
        'sensing_keyoptions',
        'sensing_of_object_menu',
        'sensing_touchingobjectmenu',
        'sound_sounds_menu',
        'text'
    ]);

const EASYBLOX_ARGUMENT_SHADOW_OPCODES =
    Object.freeze([
        'easyblox_matrix_8x8',
        'easyblox_motor_speed',
        'easyblox_percentage',
        'easyblox_pwm_value',
        'easyblox_servo_angle',
        'matrix'
    ]);

const getDefaultScratchVmRoot =
    () =>
        path.resolve(
            __dirname,
            '..',
            '..',
            'scratch-vm'
        );

const createMetadataRuntime =
    () => ({
        ioDevices: {
            video: {
                enableVideo:
                    () =>
                        Promise.resolve()
            }
        },

        getEasyBloxQrCodes:
            () => [],

        getEasyBloxQrOverlayPosition:
            () =>
                'topRight',

        getTargetForStage:
            () =>
                null,

        on:
            () => {},

        once:
            () => {},

        emit:
            () => {}
    });

const createMetadataExtension =
    (
        extensionId,
        Extension
    ) => {
        const extension =
            Object.create(
                Extension.prototype
            );

        extension.runtime =
            createMetadataRuntime();

        if (
            extensionId ===
                'text2speech' &&
            typeof extension
                ._getSupportedLocales ===
                'function'
        ) {
            extension._supportedLocales =
                extension
                    ._getSupportedLocales();
        }

        return extension;
    };

const getExtensionOpcodeIds =
    (
        registeredExtensionId,
        Extension
    ) => {
        const extension =
            createMetadataExtension(
                registeredExtensionId,
                Extension
            );

        const info =
            extension.getInfo();

        if (
            !info ||
            typeof info.id !==
                'string' ||
            info.id.length === 0
        ) {
            throw new Error(
                `Built-in extension ${
                    registeredExtensionId
                } did not expose a valid metadata ID`
            );
        }

        const opcodes =
            (info.blocks || [])
                .filter(
                    block =>
                        block &&
                        typeof block ===
                            'object' &&
                        typeof block.opcode ===
                            'string' &&
                        block.opcode.length > 0
                )
                .map(
                    block =>
                        `${info.id}_${
                            block.opcode
                        }`
                );

        const serializedAuxiliaryOpcodes =
            Object.entries(
                info.menus || {}
            )
                .filter(
                    ([
                        ,
                        menu
                    ]) =>
                        menu &&
                        typeof menu ===
                            'object' &&
                        menu.acceptReporters ===
                            true
                )
                .map(
                    ([
                        menuName
                    ]) =>
                        `${info.id}_menu_${
                            menuName
                        }`
                );

        return {
            registeredExtensionId,
            extensionId:
                info.id,
            opcodes:
                Array.from(
                    new Set(
                        opcodes
                    )
                ).sort(),

            serializedAuxiliaryOpcodes:
                Array.from(
                    new Set(
                        serializedAuxiliaryOpcodes
                    )
                ).sort()
        };
    };

const createSupportedEntry =
    (
        opcode,
        source,
        extensionId
    ) => {
        const entry = {
            opcode,
            status:
                COMPATIBILITY_STATUSES
                    .SUPPORTED,
            source
        };

        if (extensionId) {
            entry.extensionId =
                extensionId;
        }

        return entry;
    };

const createSerializedAuxiliaryEntry =
    (
        opcode,
        source,
        extensionId
    ) => {
        const entry = {
            opcode,
            source
        };

        if (extensionId) {
            entry.extensionId =
                extensionId;
        }

        return entry;
    };

const createEasyBloxSupportCatalog =
    (
        options = {}
    ) => {
        const scratchVmRoot =
            options.scratchVmRoot ||
            getDefaultScratchVmRoot();

        const Runtime =
            require(
                path.join(
                    scratchVmRoot,
                    'src',
                    'engine',
                    'runtime.js'
                )
            );

        const ExtensionManager =
            require(
                path.join(
                    scratchVmRoot,
                    'src',
                    'extension-support',
                    'extension-manager.js'
                )
            );

        if (
            typeof ExtensionManager
                .getBuiltinExtensionIds !==
                'function' ||
            typeof ExtensionManager
                .getBuiltinExtensionClass !==
                'function'
        ) {
            throw new Error(
                'Scratch VM does not expose built-in extension introspection'
            );
        }

        const runtime =
            new Runtime();

        let coreOpcodes;

        try {
            if (
                typeof runtime
                    .getCoreOpcodeIds !==
                    'function'
            ) {
                throw new Error(
                    'Scratch VM does not expose core opcode introspection'
                );
            }

            coreOpcodes =
                runtime
                    .getCoreOpcodeIds();
        } finally {
            if (
                typeof runtime.quit ===
                    'function'
            ) {
                runtime.quit();
            }
        }

        const extensionIds =
            ExtensionManager
                .getBuiltinExtensionIds()
                .filter(
                    extensionId =>
                        !INTERNAL_ONLY_EXTENSION_IDS
                            .has(
                                extensionId
                            )
                )
                .sort();

        const extensionSummaries =
            extensionIds.map(
                registeredExtensionId => {
                    const Extension =
                        ExtensionManager
                            .getBuiltinExtensionClass(
                                registeredExtensionId
                            );

                    if (
                        typeof Extension !==
                            'function'
                    ) {
                        throw new Error(
                            `Unable to resolve built-in extension: ${
                                registeredExtensionId
                            }`
                        );
                    }

                    return getExtensionOpcodeIds(
                        registeredExtensionId,
                        Extension
                    );
                }
            );

        const entries = [
            ...coreOpcodes.map(
                opcode =>
                    createSupportedEntry(
                        opcode,
                        'core'
                    )
            ),

            ...extensionSummaries
                .flatMap(
                    summary =>
                        summary.opcodes.map(
                            opcode =>
                                createSupportedEntry(
                                    opcode,
                                    'extension',
                                    summary
                                        .extensionId
                                )
                        )
                )
        ].sort(
            (
                left,
                right
            ) =>
                left.opcode.localeCompare(
                    right.opcode
                )
        );

        const serializedAuxiliaryEntries = [
            ...CORE_SERIALIZED_AUXILIARY_OPCODES
                .map(
                    opcode =>
                        createSerializedAuxiliaryEntry(
                            opcode,
                            'core-serialized'
                        )
                ),

            ...EASYBLOX_ARGUMENT_SHADOW_OPCODES
                .map(
                    opcode =>
                        createSerializedAuxiliaryEntry(
                            opcode,
                            'easyblox-shadow'
                        )
                ),

            ...extensionSummaries
                .flatMap(
                    summary =>
                        summary
                            .serializedAuxiliaryOpcodes
                            .map(
                                opcode =>
                                    createSerializedAuxiliaryEntry(
                                        opcode,
                                        'extension-menu',
                                        summary
                                            .extensionId
                                    )
                            )
                )
        ].sort(
            (
                left,
                right
            ) =>
                left.opcode.localeCompare(
                    right.opcode
                )
        );

        const duplicateOpcodes =
            entries.filter(
                (
                    entry,
                    index
                ) =>
                    index > 0 &&
                    entries[
                        index - 1
                    ].opcode ===
                        entry.opcode
            );

        if (
            duplicateOpcodes.length >
                0
        ) {
            throw new Error(
                `Duplicate EasyBlox support opcode: ${
                    duplicateOpcodes[0]
                        .opcode
                }`
            );
        }

        const duplicateSerializedAuxiliaryOpcodes =
            serializedAuxiliaryEntries.filter(
                (
                    entry,
                    index
                ) =>
                    index > 0 &&
                    serializedAuxiliaryEntries[
                        index - 1
                    ].opcode ===
                        entry.opcode
            );

        if (
            duplicateSerializedAuxiliaryOpcodes
                .length >
                0
        ) {
            throw new Error(
                `Duplicate EasyBlox serialized auxiliary opcode: ${
                    duplicateSerializedAuxiliaryOpcodes[0]
                        .opcode
                }`
            );
        }

        const extensionOpcodeCount =
            extensionSummaries.reduce(
                (
                    total,
                    summary
                ) =>
                    total +
                    summary.opcodes.length,
                0
            );

        return {
            entries,
            serializedAuxiliaryEntries,
            coreOpcodeCount:
                coreOpcodes.length,
            extensionOpcodeCount,
            totalOpcodeCount:
                entries.length,
            serializedAuxiliaryOpcodeCount:
                serializedAuxiliaryEntries
                    .length,
            extensionIds,
            extensionSummaries
        };
    };

module.exports = {
    createEasyBloxSupportCatalog
};
