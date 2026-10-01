const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    normalizePictoBloxSameOpcodeSchemas
} = require(
    '../src/same-opcode-schema-normalizer'
);

test(
    'normalizes PictoBlox Arduino digitalWrite fields into canonical EasyBlox menu shadow inputs',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'LED',

                    blocks: {
                        low: {
                            opcode:
                                'arduinoUno_digitalWrite',

                            next:
                                'high',

                            parent:
                                null,

                            inputs: {},

                            fields: {
                                PIN: [
                                    '13',
                                    null
                                ],

                                MODE: [
                                    'false',
                                    null
                                ]
                            },

                            shadow:
                                false,

                            topLevel:
                                true
                        },

                        high: {
                            opcode:
                                'arduinoUno_digitalWrite',

                            next:
                                null,

                            parent:
                                'low',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '13',
                                    null
                                ],

                                MODE: [
                                    'true',
                                    null
                                ]
                            },

                            shadow:
                                false,

                            topLevel:
                                false
                        }
                    }
                }
            ]
        };

        const original =
            JSON.parse(
                JSON.stringify(
                    project
                )
            );

        const result =
            normalizePictoBloxSameOpcodeSchemas(
                project
            );

        assert.deepEqual(
            project,
            original,
            'source project remains untouched'
        );

        const blocks =
            result.project
                .targets[0]
                .blocks;

        assert.deepEqual(
            blocks.low.fields,
            {}
        );

        assert.deepEqual(
            blocks.low.inputs,
            {
                PIN: [
                    1,
                    'low__easyblox_PIN'
                ],

                VALUE: [
                    1,
                    'low__easyblox_VALUE'
                ]
            }
        );

        assert.deepEqual(
            blocks.low__easyblox_PIN,
            {
                opcode:
                    'arduinoUno_menu_digitalPins',

                next:
                    null,

                parent:
                    'low',

                inputs: {},

                fields: {
                    digitalPins: [
                        '13',
                        null
                    ]
                },

                shadow:
                    true,

                topLevel:
                    false
            }
        );

        assert.deepEqual(
            blocks.low__easyblox_VALUE,
            {
                opcode:
                    'arduinoUno_menu_digitalValues',

                next:
                    null,

                parent:
                    'low',

                inputs: {},

                fields: {
                    digitalValues: [
                        '0',
                        null
                    ]
                },

                shadow:
                    true,

                topLevel:
                    false
            }
        );

        assert.deepEqual(
            blocks.high.inputs,
            {
                PIN: [
                    1,
                    'high__easyblox_PIN'
                ],

                VALUE: [
                    1,
                    'high__easyblox_VALUE'
                ]
            }
        );

        assert.equal(
            blocks
                .high__easyblox_VALUE
                .fields
                .digitalValues[0],
            '1'
        );

        assert.equal(
            result.report
                .normalizedBlockCount,
            2
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            0
        );
    }
);

test(
    'preserves an already canonical EasyBlox digitalWrite input structure',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        digital: {
                            opcode:
                                'arduinoUno_digitalWrite',

                            inputs: {
                                PIN: [
                                    1,
                                    'pinShadow'
                                ],

                                VALUE: [
                                    1,
                                    'valueShadow'
                                ]
                            },

                            fields: {}
                        },

                        pinShadow: {
                            opcode:
                                'arduinoUno_menu_digitalPins',

                            next:
                                null,

                            parent:
                                'digital',

                            inputs: {},

                            fields: {
                                digitalPins: [
                                    '13',
                                    null
                                ]
                            },

                            shadow:
                                true,

                            topLevel:
                                false
                        },

                        valueShadow: {
                            opcode:
                                'arduinoUno_menu_digitalValues',

                            next:
                                null,

                            parent:
                                'digital',

                            inputs: {},

                            fields: {
                                digitalValues: [
                                    '1',
                                    null
                                ]
                            },

                            shadow:
                                true,

                            topLevel:
                                false
                        }
                    }
                }
            ]
        };

        const result =
            normalizePictoBloxSameOpcodeSchemas(
                project
            );

        assert.deepEqual(
            result.project,
            project
        );

        assert.equal(
            result.report
                .normalizedBlockCount,
            0
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            0
        );
    }
);

test(
    'defers unknown PictoBlox digitalWrite MODE values instead of inventing semantics',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        digital: {
                            opcode:
                                'arduinoUno_digitalWrite',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '13',
                                    null
                                ],

                                MODE: [
                                    'toggle',
                                    null
                                ]
                            }
                        }
                    }
                }
            ]
        };

        const result =
            normalizePictoBloxSameOpcodeSchemas(
                project
            );

        assert.deepEqual(
            result.project,
            project
        );

        assert.equal(
            result.report
                .normalizedBlockCount,
            0
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'unsupported-digital-write-mode'
        );
    }
);

test(
    'defers unsupported digital pins instead of creating an invalid EasyBlox menu shadow',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        digital: {
                            opcode:
                                'arduinoUno_digitalWrite',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '1',
                                    null
                                ],

                                MODE: [
                                    'true',
                                    null
                                ]
                            }
                        }
                    }
                }
            ]
        };

        const result =
            normalizePictoBloxSameOpcodeSchemas(
                project
            );

        assert.equal(
            result.report
                .normalizedBlockCount,
            0
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'unsupported-digital-write-pin'
        );
    }
);

test(
    'normalizes PictoBlox analogRead pin indexes to canonical EasyBlox analog pin numbers',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        analog0: {
                            opcode:
                                'arduinoUno_analogRead',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '0',
                                    null
                                ]
                            }
                        },

                        analog1: {
                            opcode:
                                'arduinoUno_analogRead',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '1',
                                    null
                                ]
                            }
                        },

                        analog2: {
                            opcode:
                                'arduinoUno_analogRead',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '2',
                                    null
                                ]
                            }
                        },

                        analog3: {
                            opcode:
                                'arduinoUno_analogRead',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '3',
                                    null
                                ]
                            }
                        },

                        analog4: {
                            opcode:
                                'arduinoUno_analogRead',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '4',
                                    null
                                ]
                            }
                        },

                        analog5: {
                            opcode:
                                'arduinoUno_analogRead',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '5',
                                    null
                                ]
                            }
                        }
                    }
                }
            ]
        };

        const original =
            JSON.parse(
                JSON.stringify(
                    project
                )
            );

        const result =
            normalizePictoBloxSameOpcodeSchemas(
                project
            );

        assert.deepEqual(
            project,
            original,
            'source project remains untouched'
        );

        const blocks =
            result.project
                .targets[0]
                .blocks;

        assert.equal(
            blocks.analog0
                .fields.PIN[0],
            '14'
        );

        assert.equal(
            blocks.analog1
                .fields.PIN[0],
            '15'
        );

        assert.equal(
            blocks.analog2
                .fields.PIN[0],
            '16'
        );

        assert.equal(
            blocks.analog3
                .fields.PIN[0],
            '17'
        );

        assert.equal(
            blocks.analog4
                .fields.PIN[0],
            '18'
        );

        assert.equal(
            blocks.analog5
                .fields.PIN[0],
            '19'
        );

        assert.equal(
            result.report
                .normalizedBlockCount,
            6
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            0
        );

        assert.deepEqual(
            result.report
                .normalized
                .map(
                    record => [
                        record
                            .sourcePinValue,
                        record
                            .targetPinValue
                    ]
                ),
            [
                [
                    '0',
                    '14'
                ],
                [
                    '1',
                    '15'
                ],
                [
                    '2',
                    '16'
                ],
                [
                    '3',
                    '17'
                ],
                [
                    '4',
                    '18'
                ],
                [
                    '5',
                    '19'
                ]
            ]
        );
    }
);

test(
    'defers unsupported PictoBlox analogRead pin indexes instead of inventing a pin',
    () => {
        const project = {
            targets: [
                {
                    name:
                        'Stage',

                    blocks: {
                        analog: {
                            opcode:
                                'arduinoUno_analogRead',

                            inputs: {},

                            fields: {
                                PIN: [
                                    '6',
                                    null
                                ]
                            }
                        }
                    }
                }
            ]
        };

        const result =
            normalizePictoBloxSameOpcodeSchemas(
                project
            );

        assert.deepEqual(
            result.project,
            project
        );

        assert.equal(
            result.report
                .normalizedBlockCount,
            0
        );

        assert.equal(
            result.report
                .deferredBlockCount,
            1
        );

        assert.equal(
            result.report
                .deferred[0]
                .opcode,
            'arduinoUno_analogRead'
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'unsupported-analog-read-pin'
        );
    }
);
