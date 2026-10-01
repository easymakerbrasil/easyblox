const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const DIGITAL_WRITE_OPCODE =
    'arduinoUno_digitalWrite';

const DIGITAL_PIN_MENU_OPCODE =
    'arduinoUno_menu_digitalPins';

const DIGITAL_VALUE_MENU_OPCODE =
    'arduinoUno_menu_digitalValues';

const DIGITAL_PIN_MENU_FIELD =
    'digitalPins';

const DIGITAL_VALUE_MENU_FIELD =
    'digitalValues';

const DIGITAL_WRITE_MODE_VALUES =
    Object.freeze({
        false:
            '0',

        true:
            '1',

        0:
            '0',

        1:
            '1'
    });

const SUPPORTED_DIGITAL_PINS =
    new Set([
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19'
    ]);

const ANALOG_READ_OPCODE =
    'arduinoUno_analogRead';

const PICTOBLOX_ANALOG_PIN_VALUES =
    Object.freeze({
        0:
            '14',

        1:
            '15',

        2:
            '16',

        3:
            '17',

        4:
            '18',

        5:
            '19'
    });

const EASYBLOX_ANALOG_PIN_VALUES =
    new Set([
        '14',
        '15',
        '16',
        '17',
        '18',
        '19'
    ]);

const hasOwn =
    (
        object,
        property
    ) =>
        Object.prototype
            .hasOwnProperty.call(
                object,
                property
            );

const createUniqueBlockId =
    (
        blocks,
        parentBlockId,
        argumentName
    ) => {
        const baseId =
            `${parentBlockId}__easyblox_${
                argumentName
            }`;

        if (
            !hasOwn(
                blocks,
                baseId
            )
        ) {
            return baseId;
        }

        let suffix =
            2;

        while (
            hasOwn(
                blocks,
                `${baseId}_${suffix}`
            )
        ) {
            suffix +=
                1;
        }

        return `${baseId}_${suffix}`;
    };

const getField =
    (
        block,
        fieldName
    ) => {
        if (
            !block.fields ||
            typeof block.fields !==
                'object' ||
            Array.isArray(
                block.fields
            ) ||
            !hasOwn(
                block.fields,
                fieldName
            )
        ) {
            return null;
        }

        const field =
            block.fields[
                fieldName
            ];

        return (
            Array.isArray(
                field
            ) &&
            field.length >
                0
        ) ?
            field :
            null;
    };

const hasCanonicalDigitalWriteInputs =
    block =>
        Boolean(
            block.inputs &&
            typeof block.inputs ===
                'object' &&
            !Array.isArray(
                block.inputs
            ) &&
            hasOwn(
                block.inputs,
                'PIN'
            ) &&
            hasOwn(
                block.inputs,
                'VALUE'
            )
        );

const createMenuShadowBlock =
    (
        parentBlockId,
        opcode,
        fieldName,
        fieldValue
    ) => ({
        opcode,

        next:
            null,

        parent:
            parentBlockId,

        inputs: {},

        fields: {
            [fieldName]: [
                fieldValue,
                null
            ]
        },

        shadow:
            true,

        topLevel:
            false
    });

const normalizeDigitalWrite =
    (
        blocks,
        blockId,
        block
    ) => {
        if (
            hasCanonicalDigitalWriteInputs(
                block
            )
        ) {
            return {
                normalized:
                    false,

                deferred:
                    false
            };
        }

        if (
            block.inputs &&
            typeof block.inputs ===
                'object' &&
            !Array.isArray(
                block.inputs
            ) &&
            (
                hasOwn(
                    block.inputs,
                    'PIN'
                ) ||
                hasOwn(
                    block.inputs,
                    'VALUE'
                )
            )
        ) {
            return {
                normalized:
                    false,

                deferred:
                    true,

                reason:
                    'partial-canonical-digital-write-inputs'
            };
        }

        const pinField =
            getField(
                block,
                'PIN'
            );

        if (!pinField) {
            return {
                normalized:
                    false,

                deferred:
                    true,

                reason:
                    'missing-digital-write-pin'
            };
        }

        const pinValue =
            String(
                pinField[0]
            );

        if (
            !SUPPORTED_DIGITAL_PINS
                .has(
                    pinValue
                )
        ) {
            return {
                normalized:
                    false,

                deferred:
                    true,

                reason:
                    'unsupported-digital-write-pin'
            };
        }

        const modeField =
            getField(
                block,
                'MODE'
            );

        const valueField =
            getField(
                block,
                'VALUE'
            );

        let sourceValue;
        let targetValue;

        if (modeField) {
            sourceValue =
                String(
                    modeField[0]
                );

            if (
                !hasOwn(
                    DIGITAL_WRITE_MODE_VALUES,
                    sourceValue
                )
            ) {
                return {
                    normalized:
                        false,

                    deferred:
                        true,

                    reason:
                        'unsupported-digital-write-mode'
                };
            }

            targetValue =
                DIGITAL_WRITE_MODE_VALUES[
                    sourceValue
                ];
        } else if (valueField) {
            sourceValue =
                String(
                    valueField[0]
                );

            if (
                sourceValue !==
                    '0' &&
                sourceValue !==
                    '1'
            ) {
                return {
                    normalized:
                        false,

                    deferred:
                        true,

                    reason:
                        'unsupported-digital-write-value'
                };
            }

            targetValue =
                sourceValue;
        } else {
            return {
                normalized:
                    false,

                deferred:
                    true,

                reason:
                    'missing-digital-write-value'
            };
        }

        const pinShadowId =
            createUniqueBlockId(
                blocks,
                blockId,
                'PIN'
            );

        blocks[
            pinShadowId
        ] =
            createMenuShadowBlock(
                blockId,
                DIGITAL_PIN_MENU_OPCODE,
                DIGITAL_PIN_MENU_FIELD,
                pinValue
            );

        const valueShadowId =
            createUniqueBlockId(
                blocks,
                blockId,
                'VALUE'
            );

        blocks[
            valueShadowId
        ] =
            createMenuShadowBlock(
                blockId,
                DIGITAL_VALUE_MENU_OPCODE,
                DIGITAL_VALUE_MENU_FIELD,
                targetValue
            );

        const targetInputs = {
            ...(
                block.inputs &&
                typeof block.inputs ===
                    'object' &&
                !Array.isArray(
                    block.inputs
                ) ?
                    block.inputs :
                    {}
            ),

            PIN: [
                1,
                pinShadowId
            ],

            VALUE: [
                1,
                valueShadowId
            ]
        };

        const targetFields = {
            ...(
                block.fields &&
                typeof block.fields ===
                    'object' &&
                !Array.isArray(
                    block.fields
                ) ?
                    block.fields :
                    {}
            )
        };

        delete targetFields.PIN;
        delete targetFields.MODE;
        delete targetFields.VALUE;

        block.inputs =
            targetInputs;

        block.fields =
            targetFields;

        return {
            normalized:
                true,

            deferred:
                false,

            sourceValue,

            targetValue,

            pinValue,

            pinShadowId,

            valueShadowId
        };
    };

const normalizeAnalogRead =
    block => {
        if (
            block.inputs &&
            typeof block.inputs ===
                'object' &&
            !Array.isArray(
                block.inputs
            ) &&
            hasOwn(
                block.inputs,
                'PIN'
            )
        ) {
            return {
                normalized:
                    false,

                deferred:
                    false
            };
        }

        const pinField =
            getField(
                block,
                'PIN'
            );

        if (!pinField) {
            return {
                normalized:
                    false,

                deferred:
                    true,

                reason:
                    'missing-analog-read-pin'
            };
        }

        const sourcePinValue =
            String(
                pinField[0]
            );

        if (
            EASYBLOX_ANALOG_PIN_VALUES
                .has(
                    sourcePinValue
                )
        ) {
            return {
                normalized:
                    false,

                deferred:
                    false
            };
        }

        if (
            !hasOwn(
                PICTOBLOX_ANALOG_PIN_VALUES,
                sourcePinValue
            )
        ) {
            return {
                normalized:
                    false,

                deferred:
                    true,

                reason:
                    'unsupported-analog-read-pin'
            };
        }

        const targetPinValue =
            PICTOBLOX_ANALOG_PIN_VALUES[
                sourcePinValue
            ];

        const targetFields = {
            ...(
                block.fields &&
                typeof block.fields ===
                    'object' &&
                !Array.isArray(
                    block.fields
                ) ?
                    block.fields :
                    {}
            )
        };

        targetFields.PIN = [
            ...pinField
        ];

        targetFields.PIN[0] =
            targetPinValue;

        block.fields =
            targetFields;

        return {
            normalized:
                true,

            deferred:
                false,

            sourcePinValue,

            targetPinValue
        };
    };

const normalizePictoBloxSameOpcodeSchemas =
    project => {
        if (
            !project ||
            typeof project !==
                'object' ||
            Array.isArray(
                project
            )
        ) {
            throw new TypeError(
                'PictoBlox same-opcode schema normalizer requires a project object'
            );
        }

        const normalizedProject =
            cloneJson(
                project
            );

        const normalized = [];
        const deferred = [];

        (
            Array.isArray(
                normalizedProject.targets
            ) ?
                normalizedProject.targets :
                []
        ).forEach(
            (
                target,
                targetIndex
            ) => {
                if (
                    !target ||
                    typeof target !==
                        'object' ||
                    Array.isArray(
                        target
                    ) ||
                    !target.blocks ||
                    typeof target.blocks !==
                        'object' ||
                    Array.isArray(
                        target.blocks
                    )
                ) {
                    return;
                }

                const blocks =
                    target.blocks;

                Object.entries(
                    blocks
                ).forEach(
                    ([
                        blockId,
                        block
                    ]) => {
                        if (
                            !block ||
                            typeof block !==
                                'object' ||
                            Array.isArray(
                                block
                            )
                        ) {
                            return;
                        }

                        let result;

                        if (
                            block.opcode ===
                                DIGITAL_WRITE_OPCODE
                        ) {
                            result =
                                normalizeDigitalWrite(
                                    blocks,
                                    blockId,
                                    block
                                );
                        } else if (
                            block.opcode ===
                                ANALOG_READ_OPCODE
                        ) {
                            result =
                                normalizeAnalogRead(
                                    block
                                );
                        } else {
                            return;
                        }

                        if (
                            result.normalized
                        ) {
                            if (
                                block.opcode ===
                                    DIGITAL_WRITE_OPCODE
                            ) {
                                normalized.push({
                                    targetIndex,

                                    targetName:
                                        target.name,

                                    blockId,

                                    opcode:
                                        DIGITAL_WRITE_OPCODE,

                                    pinValue:
                                        result.pinValue,

                                    sourceValue:
                                        result.sourceValue,

                                    targetValue:
                                        result.targetValue,

                                    pinShadowId:
                                        result.pinShadowId,

                                    valueShadowId:
                                        result.valueShadowId
                                });
                            } else {
                                normalized.push({
                                    targetIndex,

                                    targetName:
                                        target.name,

                                    blockId,

                                    opcode:
                                        ANALOG_READ_OPCODE,

                                    sourcePinValue:
                                        result
                                            .sourcePinValue,

                                    targetPinValue:
                                        result
                                            .targetPinValue
                                });
                            }

                            return;
                        }

                        if (
                            result.deferred
                        ) {
                            deferred.push({
                                targetIndex,

                                targetName:
                                    target.name,

                                blockId,

                                opcode:
                                    block.opcode,

                                reason:
                                    result.reason
                            });
                        }
                    }
                );
            }
        );

        return {
            project:
                normalizedProject,

            report: {
                normalizedBlockCount:
                    normalized.length,

                deferredBlockCount:
                    deferred.length,

                normalized,

                deferred
            }
        };
    };

module.exports = {
    normalizePictoBloxSameOpcodeSchemas
};
