const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory
} = require('..');

const createInventory =
    () => ({
        opcodes: [
            {
                opcode:
                    'control_wait',
                namespace:
                    'control',
                count:
                    1
            },
            {
                opcode:
                    'motion_movesteps',
                namespace:
                    'motion',
                count:
                    2
            },
            {
                opcode:
                    'pictoSensor_read',
                namespace:
                    'pictoSensor',
                count:
                    3
            },
            {
                opcode:
                    'pictoLegacy_run',
                namespace:
                    'pictoLegacy',
                count:
                    1
            },
            {
                opcode:
                    'futureExtension_read',
                namespace:
                    'futureExtension',
                count:
                    4
            }
        ]
    });

test(
    'compatibility classifier exposes the canonical statuses',
    () => {
        assert.deepEqual(
            COMPATIBILITY_STATUSES,
            {
                SUPPORTED:
                    'supported',
                MAPPABLE:
                    'mappable',
                UNSUPPORTED:
                    'unsupported',
                UNKNOWN:
                    'unknown'
            }
        );
    }
);

test(
    'compatibility classifier separates supported mappable unsupported and unknown blocks',
    () => {
        const result =
            classifyProjectInventory(
                createInventory(),
                [
                    {
                        opcode:
                            'control_wait',
                        status:
                            COMPATIBILITY_STATUSES
                                .SUPPORTED
                    },
                    {
                        opcode:
                            'motion_movesteps',
                        status:
                            COMPATIBILITY_STATUSES
                                .SUPPORTED
                    },
                    {
                        opcode:
                            'pictoSensor_read',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easybloxSensor_read'
                    },
                    {
                        opcode:
                            'pictoLegacy_run',
                        status:
                            COMPATIBILITY_STATUSES
                                .UNSUPPORTED,
                        note:
                            'No compatible EasyBlox operation is defined.'
                    }
                ]
            );

        assert.equal(
            result.blockCount,
            11
        );

        assert.equal(
            result.uniqueOpcodeCount,
            5
        );

        assert.deepEqual(
            result.summary,
            {
                supported: {
                    blockCount:
                        3,
                    uniqueOpcodeCount:
                        2
                },
                mappable: {
                    blockCount:
                        3,
                    uniqueOpcodeCount:
                        1
                },
                unsupported: {
                    blockCount:
                        1,
                    uniqueOpcodeCount:
                        1
                },
                unknown: {
                    blockCount:
                        4,
                    uniqueOpcodeCount:
                        1
                }
            }
        );
    }
);

test(
    'compatibility classifier preserves mapping metadata deterministically',
    () => {
        const result =
            classifyProjectInventory(
                createInventory(),
                [
                    {
                        opcode:
                            'pictoSensor_read',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easybloxSensor_read',
                        note:
                            'Candidate mapping for later validation.'
                    }
                ]
            );

        assert.deepEqual(
            result.opcodes[2],
            {
                opcode:
                    'pictoSensor_read',
                namespace:
                    'pictoSensor',
                count:
                    3,
                status:
                    'mappable',
                targetOpcode:
                    'easybloxSensor_read',
                note:
                    'Candidate mapping for later validation.'
            }
        );

        assert.deepEqual(
            result.opcodes.map(
                opcode =>
                    opcode.opcode
            ),
            [
                'control_wait',
                'motion_movesteps',
                'pictoSensor_read',
                'pictoLegacy_run',
                'futureExtension_read'
            ]
        );
    }
);

test(
    'compatibility catalog rejects duplicate opcodes',
    () => {
        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'motion_movesteps',
                        status:
                            COMPATIBILITY_STATUSES
                                .SUPPORTED
                    },
                    {
                        opcode:
                            'motion_movesteps',
                        status:
                            COMPATIBILITY_STATUSES
                                .UNSUPPORTED
                    }
                ]),
            /Duplicate compatibility catalog opcode/
        );
    }
);

test(
    'compatibility catalog requires a target opcode for mappable entries',
    () => {
        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'pictoSensor_read',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE
                    }
                ]),
            /requires a targetOpcode/
        );
    }
);

test(
    'compatibility classifier rejects invalid catalog and inventory data',
    () => {
        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'custom_run',
                        status:
                            'maybe'
                    }
                ]),
            /Unsupported compatibility status/
        );

        assert.throws(
            () =>
                classifyProjectInventory(
                    null
                ),
            /project inventory/
        );

        assert.throws(
            () =>
                classifyProjectInventory({
                    opcodes:
                        'invalid'
                }),
            /inventory opcodes/
        );

        assert.throws(
            () =>
                classifyProjectInventory({
                    opcodes: [
                        {
                            opcode:
                                'custom_run',
                            namespace:
                                'custom',
                            count:
                                0
                        }
                    ]
                }),
            /positive integer count/
        );
    }
);
