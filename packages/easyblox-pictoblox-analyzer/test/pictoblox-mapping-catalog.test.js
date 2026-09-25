const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    COMPATIBILITY_STATUSES,
    aggregateProjectCorpus,
    createCompatibilityCatalog,
    createEasyBloxSupportCatalog,
    createPictoBloxMappingCatalog
} = require('..');

test(
    'PictoBlox production mapping catalog exposes the validated production mappings',
    () => {
        const catalog =
            createPictoBloxMappingCatalog();

        assert.equal(
            catalog.totalMappingCount,
            24
        );

        assert.deepEqual(
            catalog.entries.map(
                entry =>
                    entry.opcode
            ),
            [
                'actuators_initialiseMotor',
                'actuators_runMotor',
                'actuators_setRelay',
                'actuators_setServo',
                'actuators_updateMotorState',
                'arduinoUno_arduinoUnoStartUp',
                'arduinoUno_playTone',
                'arduinoUno_setPWM',
                'communication_setBaudRate',
                'communication_writeToSerial',
                'dabble_getGamepadOne',
                'dabble_setBaudRate',
                'dabble_terminalWrite',
                'displayModule_clearDisplay',
                'displayModule_displayMatrix',
                'displayModule_initializeDotMatrixDisplay',
                'displayModule_initializeTM1637Display',
                'displayModule_setMode',
                'displayModule_showNumberTM1637Display',
                'qrCodeScanner_getQRCodeData',
                'qrCodeScanner_isDetected',
                'sensors_readAnalogSensor',
                'sensors_readDHTSensor',
                'sensors_readUltrasonic'
            ]
        );

        const boardNeutralOpcodes =
            new Set([
                'qrCodeScanner_getQRCodeData',
                'qrCodeScanner_isDetected'
            ]);

        catalog.entries
            .forEach(
                entry => {
                    assert.equal(
                        entry.status,
                        COMPATIBILITY_STATUSES
                            .MAPPABLE
                    );

                    if (
                        boardNeutralOpcodes.has(
                            entry.opcode
                        )
                    ) {
                        assert.equal(
                            entry.sourceBoards,
                            undefined
                        );
                    } else {
                        assert.deepEqual(
                            entry.sourceBoards,
                            [
                                'Arduino Uno'
                            ]
                        );
                    }

                    assert.equal(
                        entry.transform.kind,
                        'block'
                    );
                }
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
                    'actuators_runMotor'
                ).transform,
                {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'MOTOR',
                            source:
                                'field',
                            sourceName:
                                'MOTOR'
                        },
                        {
                            target:
                                'DIRECTION',
                            source:
                                'field',
                            sourceName:
                                'DIRECTION',
                            valueMap: {
                                '1':
                                    '0',
                                '2':
                                    '1'
                            }
                        },
                        {
                            target:
                                'SPEED',
                            source:
                                'input',
                            sourceName:
                                'SPEED'
                        }
                    ]
                }
            );

            assert.deepEqual(
                entriesByOpcode.get(
                    'actuators_updateMotorState'
                ).sourceFields,
                {
                    MOTOR_STATE: [
                        '4'
                    ]
                }
            );

            assert.deepEqual(
                entriesByOpcode.get(
                    'actuators_updateMotorState'
                ).transform,
                {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'MOTOR',
                            source:
                                'field',
                            sourceName:
                                'MOTOR'
                        }
                    ]
                }
            );

            assert.deepEqual(
                entriesByOpcode.get(
                    'actuators_setRelay'
                ).transform,
                {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'PIN',
                            source:
                                'field',
                            sourceName:
                                'DIGITAL_PIN'
                        },
                        {
                            target:
                                'STATE',
                            source:
                                'field',
                            sourceName:
                                'MODE',
                            valueMap: {
                                'false':
                                    '0',
                                'true':
                                    '1'
                            }
                        }
                    ]
                }
            );

            assert.deepEqual(
                entriesByOpcode.get(
                    'sensors_readAnalogSensor'
                ).transform,
                {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'PIN',
                            source:
                                'field',
                            sourceName:
                                'PIN',
                            valueMap: {
                                '0':
                                    '14',
                                '1':
                                    '15',
                                '2':
                                    '16',
                                '3':
                                    '17',
                                '4':
                                    '18',
                                '5':
                                    '19'
                            }
                        }
                    ]
                }
            );

            assert.equal(
                entriesByOpcode.get(
                    'sensors_readAnalogSensor'
                ).transform.arguments.some(
                    argument =>
                        argument.sourceName ===
                            'ANALOG_SENSOR'
                ),
                false
            );

            assert.deepEqual(
                entriesByOpcode.get(
                    'sensors_readDHTSensor'
                ).transform,
                {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'TYPE',
                            source:
                                'field',
                            sourceName:
                                'DHT_SENSOR',
                            valueMap: {
                                '1':
                                    '0',
                                '2':
                                    '1'
                            }
                        },
                        {
                            target:
                                'PIN',
                            source:
                                'field',
                            sourceName:
                                'PIN'
                        }
                    ]
                }
            );

        assert.deepEqual(
            entriesByOpcode.get(
                'actuators_setServo'
            ).transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'PIN',
                        source:
                            'field',
                        sourceName:
                            'SERVO_CHANNEL'
                    },
                    {
                        target:
                            'ANGLE',
                        source:
                            'input',
                        sourceName:
                            'ANGLE'
                    }
                ]
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'arduinoUno_playTone'
            ).transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'PIN',
                        source:
                            'field',
                        sourceName:
                            'PIN'
                    },
                    {
                        target:
                            'NOTE',
                        source:
                            'field',
                        sourceName:
                            'NOTE'
                    },
                    {
                        target:
                            'DURATION',
                        source:
                            'field',
                        sourceName:
                            'BEATS'
                    }
                ]
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'communication_setBaudRate'
            ),
            {
                opcode:
                    'communication_setBaudRate',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'serial_serialBegin',
                sourceBoards: [
                    'Arduino Uno'
                ],
                sourceFields: {
                    SERIAL: [
                        '0'
                    ],
                    BAUDRATE: [
                        '115200',
                        '19200',
                        '38400',
                        '4800',
                        '57600',
                        '9600'
                    ]
                },
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'BAUD',
                            source:
                                'field',
                            sourceName:
                                'BAUDRATE'
                        }
                    ]
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'communication_writeToSerial'
            ),
            {
                opcode:
                    'communication_writeToSerial',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'serial_serialWriteLine',
                sourceBoards: [
                    'Arduino Uno'
                ],
                sourceFields: {
                    SERIAL: [
                        '0'
                    ]
                },
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'TEXT',
                            source:
                                'input',
                            sourceName:
                                'DATA'
                        }
                    ]
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'dabble_setBaudRate'
            ),
            {
                opcode:
                    'dabble_setBaudRate',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'easybloxBt_init',
                sourceBoards: [
                    'Arduino Uno'
                ],
                sourceFields: {
                    BAUDRATE: [
                        '9600'
                    ]
                },
                transform: {
                    kind:
                        'block',
                    arguments: []
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'dabble_getGamepadOne'
            ),
            {
                opcode:
                    'dabble_getGamepadOne',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'easybloxBt_isGamepadButtonPressed',
                sourceBoards: [
                    'Arduino Uno'
                ],
                sourceFields: {
                    GAMEPAD_BUTTON: [
                        '0',
                        '1',
                        '2',
                        '3',
                        '6',
                        '7',
                        '8',
                        '9'
                    ]
                },
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'BUTTON',
                            source:
                                'field',
                            sourceName:
                                'GAMEPAD_BUTTON',
                            valueMap: {
                                '0':
                                    'gamepad.dpad.up',
                                '1':
                                    'gamepad.dpad.down',
                                '2':
                                    'gamepad.dpad.left',
                                '3':
                                    'gamepad.dpad.right',
                                '6':
                                    'gamepad.action.top',
                                '7':
                                    'gamepad.action.right',
                                '8':
                                    'gamepad.action.bottom',
                                '9':
                                    'gamepad.action.left'
                            }
                        }
                    ]
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'dabble_terminalWrite'
            ),
            {
                opcode:
                    'dabble_terminalWrite',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'easybloxBt_sendText',
                sourceBoards: [
                    'Arduino Uno'
                ],
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'TEXT',
                            source:
                                'input',
                            sourceName:
                                'DATA'
                        }
                    ]
                }
            }
        );

        assert.equal(
            entriesByOpcode.get(
                'displayModule_initializeDotMatrixDisplay'
            ).targetOpcode,
            'displays_configureMatrix'
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'displayModule_initializeDotMatrixDisplay'
            ).transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'DIN',
                        source:
                            'field',
                        sourceName:
                            'DINPIN'
                    },
                    {
                        target:
                            'CS',
                        source:
                            'field',
                        sourceName:
                            'CSPIN'
                    },
                    {
                        target:
                            'CLK',
                        source:
                            'field',
                        sourceName:
                            'CLKPIN'
                    }
                ]
            }
        );

        assert.equal(
            entriesByOpcode.get(
                'displayModule_displayMatrix'
            ).targetOpcode,
            'displays_matrixWrite'
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'displayModule_displayMatrix'
            ).transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'MATRIX',
                        source:
                            'input',
                        sourceName:
                            'MATRIX',
                        shadowTransform: {
                            sourceOpcode:
                                'matrix2',
                            targetOpcode:
                                'easyblox_matrix_8x8',
                            sourceField:
                                'MATRIX',
                            targetField:
                                'MATRIX',
                            valueTransform:
                                'binary64ToHex16'
                        }
                    }
                ]
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'displayModule_clearDisplay'
            ),
            {
                opcode:
                    'displayModule_clearDisplay',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'displays_lcdClear',
                sourceBoards: [
                    'Arduino Uno'
                ],
                transform: {
                    kind:
                        'block',
                    arguments: []
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'displayModule_setMode'
            ),
            {
                opcode:
                    'displayModule_setMode',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'displays_lcdMode',
                sourceBoards: [
                    'Arduino Uno'
                ],
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'MODE',
                            source:
                                'field',
                            sourceName:
                                'MODE'
                        }
                    ]
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'displayModule_initializeTM1637Display'
            ),
            {
                opcode:
                    'displayModule_initializeTM1637Display',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'displays_tm1637Init',
                sourceBoards: [
                    'Arduino Uno'
                ],
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'CLK',
                            source:
                                'field',
                            sourceName:
                                'CLKPIN'
                        },
                        {
                            target:
                                'DIO',
                            source:
                                'field',
                            sourceName:
                                'DIOPIN'
                        }
                    ]
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'displayModule_showNumberTM1637Display'
            ),
            {
                opcode:
                    'displayModule_showNumberTM1637Display',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'displays_tm1637Show',
                sourceBoards: [
                    'Arduino Uno'
                ],
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'VALUE',
                            source:
                                'input',
                            sourceName:
                                'INPUT'
                        },
                        {
                            target:
                                'LENGTH',
                            source:
                                'field',
                            sourceName:
                                'LENGTH'
                        },
                        {
                            target:
                                'POSITION',
                            source:
                                'field',
                            sourceName:
                                'POSITION'
                        },
                        {
                            target:
                                'POINT',
                            source:
                                'field',
                            sourceName:
                                'DOTS'
                        },
                        {
                            target:
                                'LEADING_ZEROS',
                            source:
                                'field',
                            sourceName:
                                'LEADINGZERO'
                        }
                    ]
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'qrCodeScanner_getQRCodeData'
            ),
            {
                opcode:
                    'qrCodeScanner_getQRCodeData',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'easybloxQr_content',
                transform: {
                    kind:
                        'block',
                    arguments: []
                }
            }
        );

        assert.deepEqual(
            entriesByOpcode.get(
                'qrCodeScanner_isDetected'
            ),
            {
                opcode:
                    'qrCodeScanner_isDetected',
                status:
                    COMPATIBILITY_STATUSES
                        .MAPPABLE,
                targetOpcode:
                    'easybloxQr_isDetected',
                transform: {
                    kind:
                        'block',
                    arguments: []
                }
            }
        );
    }
);

test(
    'PictoBlox motor state mapping accepts only Arduino Uno Free state',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const createProject =
            (
                boardSelected,
                motorState
            ) => ({
                boardSelected,
                targets: [
                    {
                        name:
                            'Tobi',
                        blocks: {
                            motorState: {
                                opcode:
                                    'actuators_updateMotorState',
                                shadow:
                                    false,
                                fields: {
                                    MOTOR: [
                                        '1',
                                        null
                                    ],
                                    MOTOR_STATE: [
                                        motorState,
                                        null
                                    ]
                                }
                            }
                        }
                    }
                ]
            });

        const result =
            aggregateProjectCorpus(
                [
                    {
                        id:
                            'arduino-free.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '4'
                            )
                    },
                    {
                        id:
                            'arduino-lock.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '3'
                            )
                    },
                    {
                        id:
                            'esp32-free.sb3',
                        project:
                            createProject(
                                'ESP32',
                                '4'
                            )
                    }
                ],
                mappingCatalog.entries
            );

        assert.deepEqual(
            result.compatibility
                .mappable,
            {
                blockCount:
                    1,
                projectCount:
                    1,
                uniqueOpcodeCount:
                    1
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    2,
                projectCount:
                    2,
                uniqueOpcodeCount:
                    1
            }
        );

        const mappable =
            result.functionalOpcodes
                .find(
                    record =>
                        record.opcode ===
                            'actuators_updateMotorState' &&
                        record.status ===
                            'mappable'
                );

        assert.deepEqual(
            mappable,
            {
                opcode:
                    'actuators_updateMotorState',
                namespace:
                    'actuators',
                status:
                    'mappable',
                blockCount:
                    1,
                projectIds: [
                    'arduino-free.sb3'
                ],
                targetOpcode:
                    'actuators_motorStop',
                sourceBoards: [
                    'Arduino Uno'
                ],
                sourceFields: {
                    MOTOR_STATE: [
                        '4'
                    ]
                },
                transform: {
                    kind:
                        'block',
                    arguments: [
                        {
                            target:
                                'MOTOR',
                            source:
                                'field',
                            sourceName:
                                'MOTOR'
                        }
                    ]
                },
                projectCount:
                    1
            }
        );

        const unknown =
            result.functionalOpcodes
                .find(
                    record =>
                        record.opcode ===
                            'actuators_updateMotorState' &&
                        record.status ===
                            'unknown'
                );

        assert.deepEqual(
            unknown.projectIds,
            [
                'arduino-lock.sb3',
                'esp32-free.sb3'
            ]
        );
    }
);

test(
    'PictoBlox communication mappings require Arduino Uno serial 0 and supported baud rates',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const createProject =
            (
                boardSelected,
                serial,
                baudRate
            ) => ({
                boardSelected,
                targets: [
                    {
                        name:
                            'Tobi',
                        blocks: {
                            baud: {
                                opcode:
                                    'communication_setBaudRate',
                                shadow:
                                    false,
                                fields: {
                                    SERIAL: [
                                        serial,
                                        null
                                    ],
                                    BAUDRATE: [
                                        baudRate,
                                        null
                                    ]
                                }
                            },
                            write: {
                                opcode:
                                    'communication_writeToSerial',
                                shadow:
                                    false,
                                fields: {
                                    SERIAL: [
                                        serial,
                                        null
                                    ]
                                },
                                inputs: {
                                    DATA: [
                                        1,
                                        [
                                            10,
                                            'Olá'
                                        ]
                                    ]
                                }
                            }
                        }
                    }
                ]
            });

        const result =
            aggregateProjectCorpus(
                [
                    {
                        id:
                            'arduino-valid.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '0',
                                '9600'
                            )
                    },
                    {
                        id:
                            'arduino-unsupported-baud.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '0',
                                '2400'
                            )
                    },
                    {
                        id:
                            'arduino-serial-one.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '1',
                                '9600'
                            )
                    },
                    {
                        id:
                            'esp32-valid-fields.sb3',
                        project:
                            createProject(
                                'ESP32',
                                '0',
                                '9600'
                            )
                    }
                ],
                mappingCatalog.entries
            );

        assert.deepEqual(
            result.compatibility
                .mappable,
            {
                blockCount:
                    3,
                projectCount:
                    2,
                uniqueOpcodeCount:
                    2
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    5,
                projectCount:
                    3,
                uniqueOpcodeCount:
                    2
            }
        );
    }
);

test(
    'PictoBlox Dabble mappings migrate supported Arduino Uno controls to EasyConect',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const gamepadBlocks =
            Object.fromEntries(
                [
                    '0',
                    '1',
                    '2',
                    '3',
                    '6',
                    '7',
                    '8',
                    '9'
                ].map(
                    (
                        button,
                        index
                    ) => [
                        `gamepad${
                            index
                        }`,
                        {
                            opcode:
                                'dabble_getGamepadOne',
                            shadow:
                                false,
                            fields: {
                                GAMEPAD_BUTTON: [
                                    button,
                                    null
                                ]
                            }
                        }
                    ]
                )
            );

        const createProject =
            (
                boardSelected,
                baudRate,
                extraBlocks = {}
            ) => ({
                boardSelected,
                targets: [
                    {
                        name:
                            'Tobi',
                        blocks: {
                            baud: {
                                opcode:
                                    'dabble_setBaudRate',
                                shadow:
                                    false,
                                fields: {
                                    BAUDRATE: [
                                        baudRate,
                                        null
                                    ]
                                }
                            },
                            ...extraBlocks
                        }
                    }
                ]
            });

        const validBlocks = {
            ...gamepadBlocks,
            terminalWrite: {
                opcode:
                    'dabble_terminalWrite',
                shadow:
                    false,
                inputs: {
                    DATA: [
                        1,
                        [
                            10,
                            'Olá'
                        ]
                    ]
                }
            }
        };

        const result =
            aggregateProjectCorpus(
                [
                    {
                        id:
                            'arduino-valid.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '9600',
                                validBlocks
                            )
                    },
                    {
                        id:
                            'arduino-unsupported-baud.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '115200'
                            )
                    },
                    {
                        id:
                            'arduino-start-select.sb3',
                        project:
                            createProject(
                                'Arduino Uno',
                                '9600',
                                {
                                    start: {
                                        opcode:
                                            'dabble_getGamepadOne',
                                        shadow:
                                            false,
                                        fields: {
                                            GAMEPAD_BUTTON: [
                                                '4',
                                                null
                                            ]
                                        }
                                    },
                                    select: {
                                        opcode:
                                            'dabble_getGamepadOne',
                                        shadow:
                                            false,
                                        fields: {
                                            GAMEPAD_BUTTON: [
                                                '5',
                                                null
                                            ]
                                        }
                                    }
                                }
                            )
                    },
                    {
                        id:
                            'esp32-valid-fields.sb3',
                        project:
                            createProject(
                                'ESP32',
                                '9600',
                                {
                                    gamepad: {
                                        opcode:
                                            'dabble_getGamepadOne',
                                        shadow:
                                            false,
                                        fields: {
                                            GAMEPAD_BUTTON: [
                                                '0',
                                                null
                                            ]
                                        }
                                    },
                                    terminalWrite: {
                                        opcode:
                                            'dabble_terminalWrite',
                                        shadow:
                                            false,
                                        inputs: {
                                            DATA: [
                                                1,
                                                [
                                                    10,
                                                    'Olá'
                                                ]
                                            ]
                                        }
                                    }
                                }
                            )
                    }
                ],
                mappingCatalog.entries
            );

        assert.deepEqual(
            result.compatibility
                .mappable,
            {
                blockCount:
                    11,
                projectCount:
                    2,
                uniqueOpcodeCount:
                    3
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    6,
                projectCount:
                    3,
                uniqueOpcodeCount:
                    3
            }
        );
    }
);

test(
    'PictoBlox QR reporter mappings remain board neutral',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const qrOpcodes = [
            'qrCodeScanner_getQRCodeData',
            'qrCodeScanner_isDetected'
        ];

        const createProject =
            boardSelected => ({
                boardSelected,
                targets: [
                    {
                        name:
                            'Stage',
                        isStage:
                            true,
                        blocks:
                            Object.fromEntries(
                                qrOpcodes.map(
                                    (
                                        opcode,
                                        index
                                    ) => [
                                        `qr${
                                            index
                                        }`,
                                        {
                                            opcode,
                                            shadow:
                                                false
                                        }
                                    ]
                                )
                            )
                    }
                ]
            });

        const result =
            aggregateProjectCorpus(
                [
                    {
                        id:
                            'none.sb3',
                        project:
                            createProject(
                                'None'
                            )
                    },
                    {
                        id:
                            'arduino.sb3',
                        project:
                            createProject(
                                'Arduino Uno'
                            )
                    },
                    {
                        id:
                            'esp32.sb3',
                        project:
                            createProject(
                                'ESP32'
                            )
                    }
                ],
                mappingCatalog.entries
            );

        assert.deepEqual(
            result.compatibility
                .mappable,
            {
                blockCount:
                    6,
                projectCount:
                    3,
                uniqueOpcodeCount:
                    2
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    0,
                projectCount:
                    0,
                uniqueOpcodeCount:
                    0
            }
        );

        const qrRecords =
            result.functionalOpcodes
                .filter(
                    record =>
                        record.opcode.startsWith(
                            'qrCodeScanner_'
                        )
                );

        assert.equal(
            qrRecords.length,
            2
        );

        qrRecords.forEach(
            record => {
                assert.equal(
                    record.status,
                    'mappable'
                );

                assert.equal(
                    record.sourceBoards,
                    undefined
                );
            }
        );
    }
);

test(
    'PictoBlox production mapping targets exist in the real EasyBlox support catalog',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const supportCatalog =
            createEasyBloxSupportCatalog();

        const supportedOpcodes =
            new Set(
                supportCatalog.entries.map(
                    entry =>
                        entry.opcode
                )
            );

        mappingCatalog.entries
            .forEach(
                entry => {
                    assert.equal(
                        supportedOpcodes.has(
                            entry.targetOpcode
                        ),
                        true,
                        `Missing EasyBlox target opcode: ${
                            entry.targetOpcode
                        }`
                    );
                }
            );
    }
);

test(
    'PictoBlox production mappings remain board aware and preserve transform metadata in corpus aggregation',
    () => {
        const mappingCatalog =
            createPictoBloxMappingCatalog();

        const opcodes = [
            'arduinoUno_arduinoUnoStartUp',
            'actuators_initialiseMotor',
            'actuators_runMotor',
            'actuators_setRelay',
            'actuators_setServo',
            'sensors_readAnalogSensor',
            'sensors_readDHTSensor',
            'sensors_readUltrasonic',
            'arduinoUno_setPWM',
            'arduinoUno_playTone',
            'displayModule_displayMatrix',
            'displayModule_initializeDotMatrixDisplay'
        ];

        const createProject =
            boardSelected => ({
                boardSelected,
                targets: [
                    {
                        name:
                            'Stage',
                        isStage:
                            true,
                        blocks:
                            Object.fromEntries(
                                opcodes.map(
                                    (
                                        opcode,
                                        index
                                    ) => [
                                        `block${
                                            index
                                        }`,
                                        {
                                            opcode,
                                            shadow:
                                                false
                                        }
                                    ]
                                )
                            )
                    }
                ]
            });

        const result =
            aggregateProjectCorpus(
                [
                    {
                        id:
                            'arduino.sb3',
                        project:
                            createProject(
                                'Arduino Uno'
                            )
                    },
                    {
                        id:
                            'esp32.sb3',
                        project:
                            createProject(
                                'ESP32'
                            )
                    }
                ],
                mappingCatalog.entries
            );

        assert.equal(
            result.summary
                .uniqueFunctionalOpcodeCount,
            12
        );

        assert.deepEqual(
            result.compatibility
                .mappable,
            {
                blockCount:
                    12,
                projectCount:
                    1,
                uniqueOpcodeCount:
                    12
            }
        );

        assert.deepEqual(
            result.compatibility
                .unknown,
            {
                blockCount:
                    12,
                projectCount:
                    1,
                uniqueOpcodeCount:
                    12
            }
        );

        const servo =
            result.functionalOpcodes
                .find(
                    entry =>
                        entry.opcode ===
                            'actuators_setServo' &&
                        entry.status ===
                            'mappable'
                );

        assert.equal(
            servo.targetOpcode,
            'actuators_servoWrite'
        );

        assert.deepEqual(
            servo.transform,
            {
                kind:
                    'block',
                arguments: [
                    {
                        target:
                            'PIN',
                        source:
                            'field',
                        sourceName:
                            'SERVO_CHANNEL'
                    },
                    {
                        target:
                            'ANGLE',
                        source:
                            'input',
                        sourceName:
                            'ANGLE'
                    }
                ]
            }
        );
    }
);

test(
    'compatibility catalog normalizes transform argument value maps',
    () => {
        const catalog =
            createCompatibilityCatalog([
                {
                    opcode:
                        'picto_value_map',
                    status:
                        COMPATIBILITY_STATUSES
                            .MAPPABLE,
                    targetOpcode:
                        'easy_target',
                    transform: {
                        kind:
                            'block',
                        arguments: [
                            {
                                target:
                                    'DIRECTION',
                                source:
                                    'field',
                                sourceName:
                                    'DIRECTION',
                                valueMap: {
                                    '2':
                                        '1',
                                    '1':
                                        '0'
                                }
                            }
                        ]
                    }
                }
            ]);

        const valueMap =
            catalog.get(
                'picto_value_map'
            ).transform
                .arguments[0]
                .valueMap;

        assert.deepEqual(
            valueMap,
            {
                '1':
                    '0',
                '2':
                    '1'
            }
        );

        assert.equal(
            Object.isFrozen(
                valueMap
            ),
            true
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_empty_value_map',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'field',
                                    sourceName:
                                        'VALUE',
                                    valueMap: {}
                                }
                            ]
                        }
                    }
                ]),
            /valueMap to be a non-empty object/
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_invalid_value_map',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'field',
                                    sourceName:
                                        'VALUE',
                                    valueMap: {
                                        '1':
                                            ''
                                    }
                                }
                            ]
                        }
                    }
                ]),
            /invalid valueMap target/
        );
    }
);

test(
    'compatibility catalog normalizes input shadow transforms',
    () => {
        const catalog =
            createCompatibilityCatalog([
                {
                    opcode:
                        'picto_matrix',
                    status:
                        COMPATIBILITY_STATUSES
                            .MAPPABLE,
                    targetOpcode:
                        'easy_matrix',
                    transform: {
                        kind:
                            'block',
                        arguments: [
                            {
                                target:
                                    'MATRIX',
                                source:
                                    'input',
                                sourceName:
                                    'MATRIX',
                                shadowTransform: {
                                    sourceOpcode:
                                        'matrix2',
                                    targetOpcode:
                                        'easyblox_matrix_8x8',
                                    sourceField:
                                        'MATRIX',
                                    targetField:
                                        'MATRIX',
                                    valueTransform:
                                        'binary64ToHex16'
                                }
                            }
                        ]
                    }
                }
            ]);

        const shadowTransform =
            catalog.get(
                'picto_matrix'
            ).transform
                .arguments[0]
                .shadowTransform;

        assert.deepEqual(
            shadowTransform,
            {
                sourceOpcode:
                    'matrix2',
                targetOpcode:
                    'easyblox_matrix_8x8',
                sourceField:
                    'MATRIX',
                targetField:
                    'MATRIX',
                valueTransform:
                    'binary64ToHex16'
            }
        );

        assert.equal(
            Object.isFrozen(
                shadowTransform
            ),
            true
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_field_shadow',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'field',
                                    sourceName:
                                        'VALUE',
                                    shadowTransform: {
                                        sourceOpcode:
                                            'matrix2',
                                        targetOpcode:
                                            'easyblox_matrix_8x8',
                                        sourceField:
                                            'MATRIX',
                                        targetField:
                                            'MATRIX',
                                        valueTransform:
                                            'binary64ToHex16'
                                    }
                                }
                            ]
                        }
                    }
                ]),
            /shadowTransform requires an input source/
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_unknown_shadow_transform',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'MATRIX',
                                    source:
                                        'input',
                                    sourceName:
                                        'MATRIX',
                                    shadowTransform: {
                                        sourceOpcode:
                                            'matrix2',
                                        targetOpcode:
                                            'easyblox_matrix_8x8',
                                        sourceField:
                                            'MATRIX',
                                        targetField:
                                            'MATRIX',
                                        valueTransform:
                                            'unknownTransform'
                                    }
                                }
                            ]
                        }
                    }
                ]),
            /Unsupported compatibility shadow value transform/
        );
    }
);

test(
    'compatibility catalog rejects invalid structured transforms',
    () => {
        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_missing_arguments',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block'
                        }
                    }
                ]),
            /transform arguments to be an array/
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_invalid_source',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'magic',
                                    sourceName:
                                        'VALUE'
                                }
                            ]
                        }
                    }
                ]),
            /Unsupported compatibility transform argument source/
        );

        assert.throws(
            () =>
                createCompatibilityCatalog([
                    {
                        opcode:
                            'picto_duplicate_target',
                        status:
                            COMPATIBILITY_STATUSES
                                .MAPPABLE,
                        targetOpcode:
                            'easy_target',
                        transform: {
                            kind:
                                'block',
                            arguments: [
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'field',
                                    sourceName:
                                        'A'
                                },
                                {
                                    target:
                                        'VALUE',
                                    source:
                                        'input',
                                    sourceName:
                                        'B'
                                }
                            ]
                        }
                    }
                ]),
            /Duplicate compatibility transform target argument/
        );
    }
);
