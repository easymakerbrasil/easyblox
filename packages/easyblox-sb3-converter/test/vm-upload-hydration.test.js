const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const VirtualMachine =
    require(
        '../../scratch-vm/src/virtual-machine'
    );

const {
    convertExternalSb3Project
} = require('..');

test(
    'converted Arduino project hydrates the real EasyBlox Upload backing store and reserializes canonically',
    async () => {
        const sourceProject = {
            boardSelected:
                'Arduino Uno',

            /*
             * Deliberately retain a stale PictoBlox extension declaration.
             * The EasyBlox VM must derive canonical ownership from the
             * converted blocks when the project is reserialized.
             */
            extensions: [
                'arduinoUno',
                'actuators',
                'displayModule'
            ],

            monitors: [
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
                    isStage:
                        true,

                    name:
                        'Stage',

                    variables: {},
                    lists: {},
                    broadcasts: {},

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
                            x:
                                40,
                            y:
                                40
                        },
                        legacyDisplay: {
                            opcode:
                                'displayModule_write',
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
                            x:
                                140,
                            y:
                                40
                        },
                        uploadHat: {
                            opcode:
                                'arduinoUno_arduinoUnoStartUp',
                            next:
                                'servo',
                            parent:
                                null,
                            inputs: {},
                            fields: {},
                            shadow:
                                false,
                            topLevel:
                                true,
                            x:
                                240,
                            y:
                                40
                        },

                        servo: {
                            opcode:
                                'actuators_setServo',
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
                                SERVO_CHANNEL: [
                                    '9',
                                    null
                                ]
                            },
                            shadow:
                                false,
                            topLevel:
                                false
                        }
                    },

                    comments: {},

                    currentCostume:
                        0,

                    costumes: [],
                    sounds: [],

                    volume:
                        100,

                    layerOrder:
                        0,

                    tempo:
                        60,

                    videoTransparency:
                        50,

                    videoState:
                        'on',

                    textToSpeechLanguage:
                        null
                }
            ],

            meta: {
                semver:
                    '3.0.0',
                vm:
                    'PictoBlox',
                agent:
                    'R3.2C test'
            }
        };

        const converted =
            convertExternalSb3Project(
                sourceProject
            );

        assert.equal(
            converted.canConvert,
            true
        );

        assert.equal(
            converted.project
                .easybloxProject
                .programMode,
            'upload'
        );

        assert.equal(
            converted.report
                .isLoadSafe,
            true
        );

        assert.equal(
            converted.project
                .targets[0]
                .blocks
                .legacyDisplay,
            undefined
        );

        assert.equal(
            converted.project
                .easybloxProject
                .conversionReview
                .quarantinedScripts[0]
                .blocks
                .legacyDisplay
                .opcode,
            'displayModule_write'
        );

        assert.ok(
            converted.project
                .easybloxUploadPrograms[
                    'arduino-uno'
                ]
        );

        assert.deepEqual(
            converted.project
                .monitors,
            []
        );

        assert.deepEqual(
            converted.project
                .extensions,
            [
                'actuators',
                'arduinoUno'
            ]
        );

        assert.equal(
            converted.report
                .removedProjectMetadataCount,
            1
        );

        assert.equal(
            converted.report
                .projectStructure
                .metadataCleanup
                .removedMonitorCount,
            1
        );

        assert.equal(
            converted.report
                .requiresReview,
            true
        );

        const vm =
            new VirtualMachine();

        try {
            const projectForVm =
                JSON.parse(
                    JSON.stringify(
                        converted.project
                    )
                );

            /*
             * deserializeProject receives the parser-normalized representation.
             * scratch-parser normally supplies this field before calling it.
             */
            projectForVm.projectVersion =
                3;

            await vm.deserializeProject(
                projectForVm,
                null
            );

            assert.deepEqual(
                vm.getEasyBloxProjectContext(),
                {
                    selectedBoardId:
                        'arduino-uno',
                    programMode:
                        'upload'
                }
            );

            const stage =
                vm.runtime
                    .getTargetForStage();

            assert.ok(
                stage,
                'real VM restored the Stage target'
            );

            assert.ok(
                stage.blocks.getBlock(
                    'flag'
                ),
                'Stage script remains in the Stage backing store'
            );

            assert.equal(
                stage.blocks.getBlock(
                    'uploadHat'
                ),
                undefined,
                'Upload entry point is not restored into Stage'
            );

            assert.equal(
                stage.blocks.getBlock(
                    'servo'
                ),
                undefined,
                'Upload command is not restored into Stage'
            );

            const uploadProgram =
                vm.getOrCreateUploadProgram(
                    'arduino-uno'
                );

            assert.equal(
                uploadProgram
                    .blocks
                    .getBlock(
                        'uploadHat'
                    )
                    .opcode,
                'arduinoUno_whenArduinoUnoStart'
            );

            assert.equal(
                uploadProgram
                    .blocks
                    .getBlock(
                        'servo'
                    )
                    .opcode,
                'actuators_servoWrite'
            );

            /*
             * Deserialization restores the logical Upload context, while GUI
             * activation remains explicit by current EasyBlox contract.
             */
            vm.setProgramContext(
                'upload',
                'arduino-uno'
            );

            let workspaceXml =
                '';

            vm.on(
                'workspaceUpdate',
                data => {
                    workspaceXml =
                        data.xml;
                }
            );

            vm.refreshWorkspace();

            assert.match(
                workspaceXml,
                /uploadHat/,
                'Upload workspace hydrates the converted entry point'
            );

            assert.match(
                workspaceXml,
                /servo/,
                'Upload workspace hydrates the converted command'
            );

            assert.doesNotMatch(
                workspaceXml,
                /id="flag"/,
                'Stage script does not leak into the Upload workspace'
            );

            const reserialized =
                JSON.parse(
                    vm.toJSON()
                );

            const {
                conversionReview,
                ...reserializedProjectContext
            } =
                reserialized
                    .easybloxProject;

            assert.deepEqual(
                reserializedProjectContext,
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

            assert.ok(
                conversionReview,
                'conversion review metadata survives the real VM round-trip'
            );

            assert.equal(
                conversionReview
                    .quarantinedScripts[0]
                    .blocks
                    .legacyDisplay
                    .opcode,
                'displayModule_write'
            );

            assert.deepEqual(
                vm.getEasyBloxConversionReview(),
                conversionReview
            );

            assert.ok(
                reserialized
                    .easybloxUploadPrograms[
                        'arduino-uno'
                    ]
                    .blocks
                    .uploadHat
            );

            assert.ok(
                reserialized
                    .easybloxUploadPrograms[
                        'arduino-uno'
                    ]
                    .blocks
                    .servo
            );

            assert.ok(
                reserialized
                    .targets[0]
                    .blocks
                    .flag
            );

            assert.equal(
                reserialized
                    .targets[0]
                    .blocks
                    .uploadHat,
                undefined
            );

            assert.ok(
                reserialized
                    .extensions
                    .includes(
                        'arduinoUno'
                    )
            );

            assert.ok(
                reserialized
                    .extensions
                    .includes(
                        'actuators'
                    )
            );

            assert.equal(
                reserialized
                    .extensions
                    .includes(
                        'displayModule'
                    ),
                false,
                'stale PictoBlox extension declaration is not reserialized'
            );

            assert.deepEqual(
                reserialized
                    .monitors,
                [],
                'unsupported PictoBlox monitors do not reach the canonical EasyBlox project'
            );
        } finally {
            vm.quit();
        }
    }
);
