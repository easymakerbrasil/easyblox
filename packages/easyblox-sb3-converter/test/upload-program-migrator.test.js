const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    migratePictoBloxProjectStructure
} = require('..');

test(
    'project structure migrator moves only the Arduino Upload subtree into the canonical backing store',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    blocks: {
                        flag: {
                            opcode:
                                'event_whenflagclicked',
                            next:
                                'motion',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        motion: {
                            opcode:
                                'motion_movesteps',
                            next:
                                null,
                            parent:
                                'flag',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                false
                        },

                        uploadHat: {
                            opcode:
                                'arduinoUno_whenArduinoUnoStart',
                            next:
                                'servo',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servo: {
                            opcode:
                                'actuators_servoWrite',
                            next:
                                null,
                            parent:
                                'uploadHat',
                            inputs: {
                                ANGLE: [
                                    1,
                                    [
                                        4,
                                        '90'
                                    ]
                                ]
                            },
                            fields: {
                                PIN: [
                                    '9',
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
            migratePictoBloxProjectStructure(
                project
            );

        assert.deepEqual(
            project,
            original,
            'source project remains untouched'
        );

        const stageBlocks =
            result
                .project
                .targets[0]
                .blocks;

        assert.ok(
            stageBlocks.flag
        );

        assert.ok(
            stageBlocks.motion
        );

        assert.equal(
            stageBlocks.uploadHat,
            undefined
        );

        assert.equal(
            stageBlocks.servo,
            undefined
        );

        const uploadBlocks =
            result
                .project
                .easybloxUploadPrograms[
                    'arduino-uno'
                ]
                .blocks;

        assert.equal(
            uploadBlocks
                .uploadHat
                .opcode,
            'arduinoUno_whenArduinoUnoStart'
        );

        assert.equal(
            uploadBlocks
                .servo
                .opcode,
            'actuators_servoWrite'
        );

        assert.deepEqual(
            result.project
                .easybloxProject,
            {
                schemaVersion:
                    1,
                selectedBoardId:
                    'arduino-uno',
                programMode:
                    'upload',
                qrCodes:
                    [],
                qrOverlayPosition:
                    'topRight'
            }
        );

        assert.equal(
            Object.prototype
                .hasOwnProperty.call(
                    result.project,
                    'boardSelected'
                ),
            false
        );

        assert.equal(
            result.report
                .uploadProgramCreated,
            true
        );

        assert.equal(
            result.report
                .migratedBlockCount,
            2
        );

        assert.deepEqual(
            result.report
                .migratedBlockIds,
            [
                'uploadHat',
                'servo'
            ]
        );

        assert.deepEqual(
            result.report
                .deferred,
            []
        );
    }
);

test(
    'project structure migrator keeps Arduino projects in Stage when no Upload entry point exists',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    blocks: {
                        flag: {
                            opcode:
                                'event_whenflagclicked',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        }
                    }
                }
            ]
        };

        const result =
            migratePictoBloxProjectStructure(
                project
            );

        assert.deepEqual(
            result.project
                .easybloxProject,
            {
                schemaVersion:
                    1,
                selectedBoardId:
                    'arduino-uno',
                programMode:
                    'stage',
                qrCodes:
                    [],
                qrOverlayPosition:
                    'topRight'
            }
        );

        assert.equal(
            result.project
                .easybloxUploadPrograms,
            undefined
        );

        assert.ok(
            result.project
                .targets[0]
                .blocks
                .flag
        );

        assert.equal(
            result.report
                .uploadProgramCreated,
            false
        );

        assert.deepEqual(
            result.report
                .deferred,
            []
        );
    }
);

test(
    'project structure migrator defers multiple Upload entry points without moving blocks',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    blocks: {
                        firstHat: {
                            opcode:
                                'arduinoUno_whenArduinoUnoStart',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        secondHat: {
                            opcode:
                                'arduinoUno_whenArduinoUnoStart',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        }
                    }
                }
            ]
        };

        const originalBlocks =
            JSON.parse(
                JSON.stringify(
                    project
                        .targets[0]
                        .blocks
                )
            );

        const result =
            migratePictoBloxProjectStructure(
                project
            );

        assert.deepEqual(
            result.project
                .targets[0]
                .blocks,
            originalBlocks
        );

        assert.equal(
            result.project
                .easybloxUploadPrograms,
            undefined
        );

        assert.equal(
            result.report
                .programMode,
            'stage'
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'multiple-upload-entry-points'
        );
    }
);

test(
    'project structure migrator defers an inconsistent Upload tree without partial migration',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    blocks: {
                        uploadHat: {
                            opcode:
                                'arduinoUno_whenArduinoUnoStart',
                            next:
                                'servo',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servo: {
                            opcode:
                                'actuators_servoWrite',
                            next:
                                null,
                            parent:
                                'wrongParent',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                false
                        }
                    }
                }
            ]
        };

        const originalBlocks =
            JSON.parse(
                JSON.stringify(
                    project
                        .targets[0]
                        .blocks
                )
            );

        const result =
            migratePictoBloxProjectStructure(
                project
            );

        assert.deepEqual(
            result.project
                .targets[0]
                .blocks,
            originalBlocks
        );

        assert.equal(
            result.project
                .easybloxUploadPrograms,
            undefined
        );

        assert.equal(
            result.report
                .deferred[0]
                .reason,
            'block-parent-mismatch'
        );

        assert.equal(
            result.report
                .migratedBlockCount,
            0
        );
    }
);

test(
    'project structure migrator removes comments owned by migrated Upload blocks while preserving Stage comments',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            monitors: [],

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    comments: {
                        stageComment: {
                            blockId:
                                'flag',
                            x:
                                10,
                            y:
                                10,
                            width:
                                120,
                            height:
                                80,
                            minimized:
                                false,
                            text:
                                'Stage comment'
                        },

                        uploadComment: {
                            blockId:
                                'servo',
                            x:
                                20,
                            y:
                                20,
                            width:
                                120,
                            height:
                                80,
                            minimized:
                                false,
                            text:
                                'Upload comment'
                        },

                        hatComment: {
                            blockId:
                                'uploadHat',
                            x:
                                30,
                            y:
                                30,
                            width:
                                120,
                            height:
                                80,
                            minimized:
                                false,
                            text:
                                'Upload hat comment'
                        }
                    },

                    blocks: {
                        flag: {
                            opcode:
                                'event_whenflagclicked',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true,
                            comment:
                                'stageComment'
                        },

                        uploadHat: {
                            opcode:
                                'arduinoUno_whenArduinoUnoStart',
                            next:
                                'servo',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servo: {
                            opcode:
                                'actuators_servoWrite',
                            next:
                                null,
                            parent:
                                'uploadHat',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                false,
                            comment:
                                'uploadComment'
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
            migratePictoBloxProjectStructure(
                project
            );

        assert.deepEqual(
            project,
            original,
            'source project remains untouched'
        );

        const stage =
            result.project
                .targets[0];

        const uploadBlocks =
            result.project
                .easybloxUploadPrograms[
                    'arduino-uno'
                ]
                .blocks;

        assert.equal(
            uploadBlocks
                .servo
                .comment,
            undefined
        );

        assert.equal(
            stage.comments
                .uploadComment,
            undefined
        );

        assert.equal(
            stage.comments
                .hatComment,
            undefined
        );

        assert.ok(
            stage.comments
                .stageComment
        );

        assert.equal(
            stage.blocks
                .flag
                .comment,
            'stageComment'
        );

        assert.equal(
            result.report
                .metadataCleanup
                .removedUploadCommentCount,
            2
        );

        assert.deepEqual(
            result.report
                .metadataCleanup
                .removedUploadComments
                .map(
                    record =>
                        record.commentId
                ),
            [
                'hatComment',
                'uploadComment'
            ]
        );
    }
);

test(
    'project structure migrator removes unsupported monitors and rebuilds EasyBlox extension metadata',
    () => {
        const project = {
            boardSelected:
                'Arduino Uno',

            extensions: [
                'arduinoUno',
                'actuators',
                'displayModule',
                'qrCodeScanner'
            ],

            monitors: [
                {
                    id:
                        'score',
                    mode:
                        'default',
                    opcode:
                        'data_variable',
                    params: {
                        VARIABLE:
                            'score'
                    },
                    spriteName:
                        null,
                    value:
                        0,
                    width:
                        0,
                    height:
                        0,
                    x:
                        10,
                    y:
                        10,
                    visible:
                        true,
                    sliderMin:
                        0,
                    sliderMax:
                        100,
                    isDiscrete:
                        true
                },

                {
                    id:
                        'pictoQrMonitor',
                    mode:
                        'default',
                    opcode:
                        'qrCodeScanner_getQRCodeData',
                    params: {},
                    spriteName:
                        null,
                    value:
                        '',
                    width:
                        0,
                    height:
                        0,
                    x:
                        20,
                    y:
                        20,
                    visible:
                        true,
                    sliderMin:
                        0,
                    sliderMax:
                        100,
                    isDiscrete:
                        true
                }
            ],

            targets: [
                {
                    name:
                        'Stage',

                    isStage:
                        true,

                    blocks: {
                        flag: {
                            opcode:
                                'event_whenflagclicked',
                            next:
                                null,
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        uploadHat: {
                            opcode:
                                'arduinoUno_whenArduinoUnoStart',
                            next:
                                'servo',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true
                        },

                        servo: {
                            opcode:
                                'actuators_servoWrite',
                            next:
                                null,
                            parent:
                                'uploadHat',
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                false
                        }
                    }
                }
            ]
        };

        const result =
            migratePictoBloxProjectStructure(
                project
            );

        assert.equal(
            result.project
                .monitors
                .length,
            1
        );

        assert.equal(
            result.project
                .monitors[0]
                .opcode,
            'data_variable'
        );

        assert.deepEqual(
            result.project
                .extensions,
            [
                'actuators',
                'arduinoUno'
            ]
        );

        assert.equal(
            result.report
                .metadataCleanup
                .removedMonitorCount,
            1
        );

        assert.equal(
            result.report
                .metadataCleanup
                .removedMonitors[0]
                .monitor
                .opcode,
            'qrCodeScanner_getQRCodeData'
        );

        assert.equal(
            result.report
                .metadataCleanup
                .removedUploadCommentCount,
            0
        );
    }
);
