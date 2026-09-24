const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    COMPATIBILITY_STATUSES,
    classifyProjectInventory,
    createEasyBloxSupportCatalog
} = require('..');

test(
    'EasyBlox support catalog is derived from the real VM implementation',
    () => {
        const catalog =
            createEasyBloxSupportCatalog();

        assert.ok(
            catalog.coreOpcodeCount >
                100
        );

        assert.ok(
            catalog.extensionOpcodeCount >
                100
        );

        assert.equal(
            catalog.totalOpcodeCount,
            catalog.entries.length
        );

        assert.equal(
            new Set(
                catalog.entries.map(
                    entry =>
                        entry.opcode
                )
            ).size,
            catalog.entries.length
        );

        assert.ok(
            catalog.extensionIds.includes(
                'arduinoUno'
            )
        );

        assert.ok(
            catalog.extensionIds.includes(
                'easybloxBt'
            )
        );

        assert.ok(
            catalog.extensionIds.includes(
                'easybloxQr'
            )
        );

        assert.ok(
            catalog.extensionIds.includes(
                'faceSensing'
            )
        );

        assert.ok(
            catalog.extensionIds.includes(
                'text2speech'
            )
        );

        assert.equal(
            catalog.extensionIds.includes(
                'coreExample'
            ),
            false
        );

        const entriesByOpcode =
            new Map(
                catalog.entries.map(
                    entry => [
                        entry.opcode,
                        entry
                    ]
                )
            );

        assert.deepEqual(
            entriesByOpcode.get(
                'motion_movesteps'
            ),
            {
                opcode:
                    'motion_movesteps',
                status:
                    COMPATIBILITY_STATUSES
                        .SUPPORTED,
                source:
                    'core'
            }
        );

        assert.equal(
            entriesByOpcode.get(
                'arduinoUno_digitalWrite'
            ).extensionId,
            'arduinoUno'
        );

        assert.equal(
            entriesByOpcode.get(
                'faceSensing_faceIsDetected'
            ).extensionId,
            'faceSensing'
        );

        assert.equal(
            entriesByOpcode.get(
                'text2speech_speakAndWait'
            ).extensionId,
            'text2speech'
        );
    }
);

test(
    'EasyBlox support catalog feeds the compatibility classifier directly',
    () => {
        const catalog =
            createEasyBloxSupportCatalog();

        const result =
            classifyProjectInventory(
                {
                    opcodes: [
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
                                'arduinoUno_digitalWrite',
                            namespace:
                                'arduinoUno',
                            count:
                                1
                        },
                        {
                            opcode:
                                'pictoUnknown_read',
                            namespace:
                                'pictoUnknown',
                            count:
                                3
                        }
                    ]
                },
                catalog.entries
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
                        0,
                    uniqueOpcodeCount:
                        0
                },
                unsupported: {
                    blockCount:
                        0,
                    uniqueOpcodeCount:
                        0
                },
                unknown: {
                    blockCount:
                        3,
                    uniqueOpcodeCount:
                        1
                }
            }
        );
    }
);
