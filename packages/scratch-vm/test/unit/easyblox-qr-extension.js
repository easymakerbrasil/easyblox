const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');
const StageLayering =
    require('../../src/engine/stage-layering');

const {
    rasterizeEasyBloxQr
} = require('../../src/qr/easyblox-qr-encoder');

const Scratch3EasyBloxQrBlocks =
    require('../../src/extensions/scratch3_easyblox_qr');

const createExtension = (runtime = {}) =>
    new Scratch3EasyBloxQrBlocks(runtime);

const getBlocks = () =>
    createExtension()
        .getInfo()
        .blocks
        .filter(
            block =>
                block !== '---' &&
                block.blockType !==
                    BlockType.LABEL &&
                block.blockType !==
                    BlockType.BUTTON
        );

const getAuthoringButtons = () =>
    createExtension()
        .getInfo()
        .blocks
        .filter(
            block =>
                block !== '---' &&
                block.blockType ===
                    BlockType.BUTTON
        );

const getBlock = opcode =>
    getBlocks().find(block => block.opcode === opcode);

tap.test(
    'EasyBlox QR exposes its canonical extension identity',
    t => {
        const info =
            createExtension().getInfo();

        t.equal(
            info.id,
            'easybloxQr'
        );

        t.equal(
            info.name,
            'QR Code'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR exposes the two canonical project authoring actions',
    t => {
        const buttons =
            getAuthoringButtons();

        t.same(
            buttons.map(button => ({
                text: button.text,
                func: button.func
            })),
            [
                {
                    text: 'Criar QR Code',
                    func: 'MAKE_EASYBLOX_QR'
                },
                {
                    text: 'Gerenciar QR Codes',
                    func: 'MANAGE_EASYBLOX_QR'
                }
            ]
        );

        t.equal(
            buttons.length,
            2
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR exposes exactly the seven canonical v1 programmable blocks',
    t => {
        const blocks = getBlocks();

        t.same(
            blocks.map(block => block.opcode),
            [
                'startReader',
                'stopReader',
                'isDetected',
                'content',
                'setBoundary',
                'showQrCode',
                'hideQrCode'
            ]
        );

        t.equal(
            blocks.length,
            7
        );

        t.end();
    }
);

tap.test(
    'all EasyBlox QR v1 programmable blocks are Stage only and board neutral',
    t => {
        const blocks = getBlocks();

        for (const block of blocks) {
            t.equal(
                block.executionMode,
                BlockExecutionMode.STAGE_ONLY,
                `${block.opcode} must be Stage only`
            );

            t.equal(
                typeof block.requiredBoardCapability,
                'undefined',
                `${block.opcode} must not require a board capability`
            );
        }

        t.end();
    }
);

tap.test(
    'EasyBlox QR reader blocks expose the canonical shapes',
    t => {
        const startReader =
            getBlock('startReader');
        const stopReader =
            getBlock('stopReader');
        const isDetected =
            getBlock('isDetected');
        const content =
            getBlock('content');
        const setBoundary =
            getBlock('setBoundary');

        t.equal(
            startReader.blockType,
            BlockType.COMMAND
        );

        t.equal(
            startReader.text,
            'iniciar leitor em [SOURCE]'
        );

        t.same(
            startReader.arguments,
            {
                SOURCE: {
                    type: ArgumentType.STRING,
                    menu: 'readerSources',
                    defaultValue: 'cameraNormal'
                }
            }
        );

        t.equal(
            stopReader.text,
            'desligar leitor'
        );

        t.equal(
            isDetected.blockType,
            BlockType.BOOLEAN
        );

        t.equal(
            isDetected.text,
            'QR Code detectado?'
        );

        t.equal(
            content.blockType,
            BlockType.REPORTER
        );

        t.equal(
            content.text,
            'conteúdo do QR Code lido'
        );

        t.equal(
            setBoundary.text,
            'delimitação [STATE]'
        );

        t.same(
            setBoundary.arguments,
            {
                STATE: {
                    type: ArgumentType.STRING,
                    menu: 'boundaryStates',
                    defaultValue: 'on'
                }
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR exposes the canonical reader source and boundary menus',
    t => {
        const menus =
            createExtension().getInfo().menus;

        t.same(
            menus.readerSources.items,
            [
                {
                    text: 'câmera normal',
                    value: 'cameraNormal'
                },
                {
                    text: 'câmera invertida',
                    value: 'cameraMirrored'
                },
                {
                    text: 'palco',
                    value: 'stage'
                }
            ]
        );

        t.same(
            menus.boundaryStates.items,
            [
                {
                    text: 'ligada',
                    value: 'on'
                },
                {
                    text: 'desligada',
                    value: 'off'
                }
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR project menu uses resource names and stable IDs',
    t => {
        const runtime = {
            getEasyBloxQrCodes: () => [
                {
                    id: 'qr_a',
                    name: 'Estação 1',
                    content: 'A'
                },
                {
                    id: 'qr_b',
                    name: 'Desafio Final',
                    content: 'B'
                }
            ]
        };

        const extension =
            createExtension(runtime);

        t.equal(
            extension
                .getInfo()
                .menus
                .qrCodes
                .items,
            'getQrCodeMenu',
            'menu is resolved dynamically'
        );

        t.same(
            extension.getQrCodeMenu(),
            [
                {
                    text: 'Estação 1',
                    value: 'qr_a'
                },
                {
                    text: 'Desafio Final',
                    value: 'qr_b'
                }
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR project menu has a safe empty state',
    t => {
        const extension =
            createExtension();

        t.same(
            extension.getQrCodeMenu(),
            [
                {
                    text: 'nenhum criado',
                    value: ''
                }
            ]
        );

        t.equal(
            extension.getDefaultQrCodeId(),
            ''
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR defaults new display blocks to the first project QR Code',
    t => {
        const runtime = {
            getEasyBloxQrCodes: () => [
                {
                    id: 'qr_a',
                    name: 'Estação 1',
                    content: 'A'
                },
                {
                    id: 'qr_b',
                    name: 'Desafio Final',
                    content: 'B'
                }
            ]
        };

        const extension =
            createExtension(runtime);

        const showQrCode =
            extension
                .getInfo()
                .blocks
                .find(
                    block =>
                        block &&
                        block.opcode ===
                            'showQrCode'
                );

        t.equal(
            extension.getDefaultQrCodeId(),
            'qr_a'
        );

        t.equal(
            showQrCode
                .arguments
                .QR_CODE
                .defaultValue,
            'qr_a'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR usage blocks expose the canonical shapes',
    t => {
        const showQrCode =
            getBlock('showQrCode');
        const hideQrCode =
            getBlock('hideQrCode');

        t.equal(
            showQrCode.blockType,
            BlockType.COMMAND
        );

        t.equal(
            showQrCode.text,
            'mostrar QR Code [QR_CODE]'
        );

        t.same(
            showQrCode.arguments,
            {
                QR_CODE: {
                    type: ArgumentType.STRING,
                    menu: 'qrCodes',
                    defaultValue: ''
                }
            }
        );

        t.equal(
            hideQrCode.blockType,
            BlockType.COMMAND
        );

        t.equal(
            hideQrCode.text,
            'ocultar QR Code'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR boundary layer is ordered above the generated QR overlay',
    t => {
        const qrIndex =
            StageLayering
                .LAYER_GROUPS
                .indexOf(
                    StageLayering
                        .EASYBLOX_QR_LAYER
                );

        const boundaryIndex =
            StageLayering
                .LAYER_GROUPS
                .indexOf(
                    StageLayering
                        .EASYBLOX_QR_BOUNDARY_LAYER
                );

        t.ok(
            qrIndex >= 0
        );

        t.ok(
            boundaryIndex >
                qrIndex
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR renders and toggles the detected boundary immediately',
    t => {
        const previousImageData =
            global.ImageData;

        global.ImageData =
            class ImageDataMock {
                constructor (
                    data,
                    width,
                    height
                ) {
                    this.data = data;
                    this.width = width;
                    this.height = height;
                }
            };

        const calls = {
            createBitmapSkin: [],
            createDrawable: [],
            updateBitmapSkin: [],
            updateDrawableSkinId: [],
            updateDrawablePosition: [],
            updateDrawableScale: [],
            updateDrawableVisible: [],
            redraw: 0
        };

        const renderer = {
            getNativeSize:
                () => [
                    480,
                    360
                ],

            createBitmapSkin:
                imageData => {
                    calls.createBitmapSkin.push(
                        imageData
                    );

                    return 71;
                },

            createDrawable:
                layer => {
                    calls.createDrawable.push(
                        layer
                    );

                    return 72;
                },

            updateBitmapSkin:
                (
                    skinId,
                    imageData
                ) => {
                    calls.updateBitmapSkin.push([
                        skinId,
                        imageData
                    ]);
                },

            updateDrawableSkinId:
                (
                    drawableId,
                    skinId
                ) => {
                    calls.updateDrawableSkinId.push([
                        drawableId,
                        skinId
                    ]);
                },

            updateDrawablePosition:
                (
                    drawableId,
                    position
                ) => {
                    calls.updateDrawablePosition.push([
                        drawableId,
                        position
                    ]);
                },

            updateDrawableScale:
                (
                    drawableId,
                    scale
                ) => {
                    calls.updateDrawableScale.push([
                        drawableId,
                        scale
                    ]);
                },

            updateDrawableVisible:
                (
                    drawableId,
                    visible
                ) => {
                    calls.updateDrawableVisible.push([
                        drawableId,
                        visible
                    ]);
                }
        };

        const extension =
            createExtension({
                renderer,
                requestRedraw:
                    () => {
                        calls.redraw += 1;
                    }
            });

        extension._updateReaderDetection(
            {
                content:
                    'BOUNDARY-TEST',
                location: {
                    topLeft: {
                        x: 100,
                        y: 80
                    },
                    topRight: {
                        x: 180,
                        y: 80
                    },
                    bottomRight: {
                        x: 180,
                        y: 160
                    },
                    bottomLeft: {
                        x: 100,
                        y: 160
                    }
                }
            },
            480,
            360
        );

        t.equal(
            calls.createBitmapSkin.length,
            1
        );

        t.same(
            calls.createDrawable,
            [
                'easybloxQrBoundary'
            ]
        );

        t.same(
            calls.updateDrawableSkinId[0],
            [
                72,
                71
            ]
        );

        t.same(
            calls.updateDrawableScale[0],
            [
                72,
                [
                    100,
                    100
                ]
            ]
        );

        t.same(
            calls.updateDrawableVisible[0],
            [
                72,
                true
            ]
        );

        t.equal(
            extension._boundaryVisible,
            true
        );

        extension.setBoundary({
            STATE: 'off'
        });

        t.same(
            calls.updateDrawableVisible[
                calls.updateDrawableVisible.length -
                1
            ],
            [
                72,
                false
            ]
        );

        t.equal(
            extension._boundaryVisible,
            false
        );

        extension.setBoundary({
            STATE: 'on'
        });

        t.equal(
            calls.createBitmapSkin.length,
            1,
            'renderer resources are reused'
        );

        t.equal(
            calls.updateBitmapSkin.length,
            1
        );

        t.same(
            calls.updateDrawableVisible[
                calls.updateDrawableVisible.length -
                1
            ],
            [
                72,
                true
            ]
        );

        extension._updateReaderDetection(
            null
        );

        t.same(
            calls.updateDrawableVisible[
                calls.updateDrawableVisible.length -
                1
            ],
            [
                72,
                false
            ]
        );

        global.ImageData =
            previousImageData;

        t.end();
    }
);

tap.test(
    'EasyBlox QR Stage capture excludes its own boundary drawable',
    t => {
        const width =
            32;

        const height =
            32;

        const blankPixels =
            new Uint8ClampedArray(
                width *
                height *
                4
            );

        blankPixels.fill(
            255
        );

        let extractionOptions =
            null;

        const extension =
            createExtension({
                renderer: {
                    extractStageImageData:
                        options => {
                            extractionOptions =
                                options;

                            return {
                                data:
                                    blankPixels,
                                width,
                                height
                            };
                        }
                }
            });

        extension._boundaryDrawableId =
            91;

        extension._readStageFrame();

        t.same(
            extractionOptions,
            {
                excludedDrawableIds: [
                    91
                ]
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR Stage reader decodes the complete rendered Stage',
    t => {
        const raster =
            rasterizeEasyBloxQr(
                'STAGE-EASYBLOX-001',
                {
                    size: 256
                }
            );

        let extractionCount = 0;

        const renderer = {
            extractStageImageData:
                () => {
                    extractionCount += 1;

                    return {
                        data:
                            raster.pixels,
                        width:
                            raster.width,
                        height:
                            raster.height
                    };
                }
        };

        const extension =
            createExtension({
                renderer
            });

        extension.startReader({
            SOURCE: 'stage'
        });

        t.equal(
            extractionCount,
            1,
            'Stage frame is read immediately'
        );

        t.equal(
            extension.isDetected(),
            true
        );

        t.equal(
            extension.content(),
            'STAGE-EASYBLOX-001'
        );

        t.ok(
            extension._location,
            'Stage decoder location is retained'
        );

        extension.stopReader();

        t.equal(
            extension.isDetected(),
            false
        );

        t.equal(
            extension.content(),
            ''
        );

        t.equal(
            extension._location,
            null
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR Stage reader clears sensing when the Stage has no QR Code',
    t => {
        const qrRaster =
            rasterizeEasyBloxQr(
                'STAGE-VISIBLE-QR',
                {
                    size: 256
                }
            );

        const blankPixels =
            new Uint8ClampedArray(
                qrRaster.width *
                qrRaster.height *
                4
            );

        blankPixels.fill(
            255
        );

        let currentFrame = {
            data:
                qrRaster.pixels,
            width:
                qrRaster.width,
            height:
                qrRaster.height
        };

        const extension =
            createExtension({
                renderer: {
                    extractStageImageData:
                        () =>
                            currentFrame
                }
            });

        extension.startReader({
            SOURCE: 'stage'
        });

        t.equal(
            extension.isDetected(),
            true
        );

        t.equal(
            extension.content(),
            'STAGE-VISIBLE-QR'
        );

        currentFrame = {
            data:
                blankPixels,
            width:
                qrRaster.width,
            height:
                qrRaster.height
        };

        extension._readStageFrame();

        t.equal(
            extension.isDetected(),
            false
        );

        t.equal(
            extension.content(),
            ''
        );

        t.equal(
            extension._location,
            null
        );

        extension.stopReader();

        t.end();
    }
);

tap.test(
    'EasyBlox QR camera reader decodes frames into sensing state',
    t => {
        const raster =
            rasterizeEasyBloxQr(
                'CAMERA-EASYBLOX-001',
                {
                    size: 256
                }
            );

        const frameCalls = [];

        const video = {
            mirror: true,
            videoReady: true,
            getFrame:
                frameInfo => {
                    frameCalls.push(
                        frameInfo
                    );

                    return {
                        data:
                            raster.pixels,
                        width:
                            raster.width,
                        height:
                            raster.height
                    };
                }
        };

        const extension =
            createExtension({
                ioDevices: {
                    video
                }
            });

        extension.startReader({
            SOURCE: 'cameraNormal'
        });

        t.equal(
            extension.isDetected(),
            true,
            'camera frame detects a QR Code'
        );

        t.equal(
            extension.content(),
            'CAMERA-EASYBLOX-001'
        );

        t.ok(
            extension._location,
            'decoder location is retained for boundary rendering'
        );

        t.same(
            frameCalls[0],
            {
                mirror: false,
                format: 'image-data',
                cacheTimeout: 0
            },
            'normal camera requests an unmirrored ImageData frame'
        );

        extension.startReader({
            SOURCE: 'cameraMirrored'
        });

        t.equal(
            frameCalls[
                frameCalls.length - 1
            ].mirror,
            true,
            'mirrored camera requests a mirrored frame'
        );

        extension.stopReader();

        t.equal(
            extension.isDetected(),
            false
        );

        t.equal(
            extension.content(),
            ''
        );

        t.equal(
            extension._location,
            null
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR camera reader clears sensing when a frame has no QR Code',
    t => {
        const qrRaster =
            rasterizeEasyBloxQr(
                'VISIBLE-QR',
                {
                    size: 256
                }
            );

        const blankPixels =
            new Uint8ClampedArray(
                qrRaster.width *
                qrRaster.height *
                4
            );

        blankPixels.fill(
            255
        );

        let currentFrame = {
            data:
                qrRaster.pixels,
            width:
                qrRaster.width,
            height:
                qrRaster.height
        };

        const video = {
            mirror: false,
            videoReady: true,
            getFrame:
                () =>
                    currentFrame
        };

        const extension =
            createExtension({
                ioDevices: {
                    video
                }
            });

        extension.startReader({
            SOURCE: 'cameraNormal'
        });

        t.equal(
            extension.isDetected(),
            true
        );

        t.equal(
            extension.content(),
            'VISIBLE-QR'
        );

        currentFrame = {
            data:
                blankPixels,
            width:
                qrRaster.width,
            height:
                qrRaster.height
        };

        extension._readCameraFrame();

        t.equal(
            extension.isDetected(),
            false
        );

        t.equal(
            extension.content(),
            ''
        );

        t.equal(
            extension._location,
            null
        );

        extension.stopReader();

        t.end();
    }
);

tap.test(
    'EasyBlox QR starts decoding after a newly enabled camera becomes available',
    t => {
        const raster =
            rasterizeEasyBloxQr(
                'NEW-CAMERA-SESSION',
                {
                    size: 256
                }
            );

        let enableCount = 0;
        let frameCount = 0;

        const enableResult = {
            then:
                callback => {
                    callback();

                    return {
                        catch:
                            () => {}
                    };
                }
        };

        const video = {
            mirror: true,
            videoReady: false,

            enableVideo:
                () => {
                    enableCount += 1;

                    return enableResult;
                },

            disableVideo:
                () => {},

            getFrame:
                () => {
                    frameCount += 1;

                    return {
                        data:
                            raster.pixels,
                        width:
                            raster.width,
                        height:
                            raster.height
                    };
                }
        };

        const extension =
            createExtension({
                ioDevices: {
                    video
                }
            });

        extension.startReader({
            SOURCE: 'cameraNormal'
        });

        t.equal(
            enableCount,
            1,
            'camera is enabled once'
        );

        t.equal(
            frameCount,
            1,
            'reader starts immediately after camera enable resolves'
        );

        t.equal(
            extension.isDetected(),
            true
        );

        t.equal(
            extension.content(),
            'NEW-CAMERA-SESSION'
        );

        extension.stopReader();

        t.end();
    }
);

tap.test(
    'EasyBlox QR stops its active reader when the project is stopped',
    t => {
        const listeners =
            Object.create(null);

        let disableCount = 0;

        const video = {
            mirror: false,
            videoReady: false,

            enableVideo:
                () =>
                    true,

            disableVideo:
                () => {
                    disableCount += 1;
                },

            getFrame:
                () =>
                    null
        };

        const extension =
            createExtension({
                ioDevices: {
                    video
                },

                on:
                    (
                        eventName,
                        listener
                    ) => {
                        listeners[eventName] =
                            listener;
                    }
            });

        t.type(
            listeners.PROJECT_STOP_ALL,
            'function',
            'project stop listener is registered'
        );

        extension.startReader({
            SOURCE: 'cameraNormal'
        });

        t.equal(
            extension._readerSource,
            'cameraNormal'
        );

        t.not(
            extension._readerTimeout,
            null,
            'reader loop is active'
        );

        listeners.PROJECT_STOP_ALL();

        t.equal(
            disableCount,
            1,
            'camera owned by the reader is released'
        );

        t.equal(
            extension._readerSource,
            null
        );

        t.equal(
            extension._readerTimeout,
            null,
            'reader loop is stopped'
        );

        t.equal(
            extension.isDetected(),
            false
        );

        t.equal(
            extension.content(),
            ''
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR camera sources control preview orientation and camera ownership',
    t => {
        let enableCount = 0;
        let disableCount = 0;

        const video = {
            mirror: true,
            videoReady: false,
            enableVideo: () => {
                enableCount += 1;

                return Promise.resolve();
            },
            disableVideo: () => {
                disableCount += 1;
            }
        };

        const extension =
            createExtension({
                ioDevices: {
                    video
                }
            });

        t.equal(
            extension.startReader({
                SOURCE: 'cameraNormal'
            }),
            undefined,
            'camera command has no visual reporter value'
        );

        t.equal(
            enableCount,
            1,
            'normal camera enables video'
        );

        t.equal(
            video.mirror,
            false,
            'normal camera is not mirrored'
        );

        extension.startReader({
            SOURCE: 'cameraMirrored'
        });

        t.equal(
            enableCount,
            1,
            'switching orientation does not enable the camera twice'
        );

        t.equal(
            video.mirror,
            true,
            'inverted camera is mirrored'
        );

        extension.startReader({
            SOURCE: 'stage'
        });

        t.equal(
            disableCount,
            1,
            'switching to Stage releases a camera owned by the QR reader'
        );

        t.equal(
            video.mirror,
            true,
            'previous mirror state is restored'
        );

        t.equal(
            extension._readerSource,
            'stage'
        );

        t.equal(
            extension.isDetected(),
            false
        );

        t.equal(
            extension.content(),
            ''
        );

        extension.stopReader();

        t.end();
    }
);

tap.test(
    'EasyBlox QR does not disable a camera already owned elsewhere',
    t => {
        let enableCount = 0;
        let disableCount = 0;

        const video = {
            mirror: true,
            videoReady: true,
            enableVideo: () => {
                enableCount += 1;

                return Promise.resolve();
            },
            disableVideo: () => {
                disableCount += 1;
            }
        };

        const extension =
            createExtension({
                ioDevices: {
                    video
                }
            });

        extension.startReader({
            SOURCE: 'cameraNormal'
        });

        t.equal(
            enableCount,
            0,
            'existing camera session is reused'
        );

        t.equal(
            video.mirror,
            false
        );

        t.equal(
            extension.stopReader(),
            undefined,
            'stop command has no visual reporter value'
        );

        t.equal(
            disableCount,
            0,
            'foreign camera session is preserved'
        );

        t.equal(
            video.mirror,
            true,
            'previous orientation is restored'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR Stage display selects only existing project resources',
    t => {
        const runtime = {
            getEasyBloxQrCodeById: id =>
                id === 'qr_a' ?
                    {
                        id: 'qr_a',
                        name: 'Estação 1',
                        content: 'A'
                    } :
                    null
        };

        const extension =
            createExtension(runtime);

        extension.showQrCode({
            QR_CODE: 'missing'
        });

        t.equal(
            extension._visibleQrCodeId,
            null
        );

        extension.showQrCode({
            QR_CODE: 'qr_a'
        });

        t.equal(
            extension._visibleQrCodeId,
            'qr_a'
        );

        extension.hideQrCode();

        t.equal(
            extension._visibleQrCodeId,
            null
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR renders one compact Stage overlay and reuses it',
    t => {
        const previousImageData =
            global.ImageData;

        global.ImageData =
            class ImageDataMock {
                constructor (
                    data,
                    width,
                    height
                ) {
                    this.data = data;
                    this.width = width;
                    this.height = height;
                }
            };

        const calls = {
            createBitmapSkin: [],
            createDrawable: [],
            updateBitmapSkin: [],
            updateDrawableSkinId: [],
            updateDrawablePosition: [],
            updateDrawableScale: [],
            updateDrawableVisible: [],
            redraw: 0
        };

        const renderer = {
            createBitmapSkin:
                (imageData, resolution) => {
                    calls.createBitmapSkin.push([
                        imageData,
                        resolution
                    ]);

                    return 41;
                },

            createDrawable:
                layer => {
                    calls.createDrawable.push(
                        layer
                    );

                    return 42;
                },

            updateBitmapSkin:
                (
                    skinId,
                    imageData,
                    resolution
                ) => {
                    calls.updateBitmapSkin.push([
                        skinId,
                        imageData,
                        resolution
                    ]);
                },

            updateDrawableSkinId:
                (drawableId, skinId) => {
                    calls.updateDrawableSkinId.push([
                        drawableId,
                        skinId
                    ]);
                },

            updateDrawablePosition:
                (drawableId, position) => {
                    calls.updateDrawablePosition.push([
                        drawableId,
                        position
                    ]);
                },

            updateDrawableScale:
                (drawableId, scale) => {
                    calls.updateDrawableScale.push([
                        drawableId,
                        scale
                    ]);
                },

            updateDrawableVisible:
                (drawableId, visible) => {
                    calls.updateDrawableVisible.push([
                        drawableId,
                        visible
                    ]);
                }
        };

        const resources = {
            qr_a: {
                id: 'qr_a',
                name: 'Estação 1',
                content: 'A'
            },
            qr_b: {
                id: 'qr_b',
                name: 'Estação 2',
                content: 'B'
            }
        };

        const runtime = {
            renderer,
            getEasyBloxQrCodeById:
                id =>
                    resources[id] || null,
            requestRedraw:
                () => {
                    calls.redraw += 1;
                }
        };

        const extension =
            createExtension(runtime);

        extension.showQrCode({
            QR_CODE: 'qr_a'
        });

        t.equal(
            calls.createBitmapSkin.length,
            1,
            'one bitmap skin is created'
        );

        t.equal(
            calls.createDrawable.length,
            1,
            'one drawable is created'
        );

        t.equal(
            calls.createDrawable[0],
            'easybloxQr',
            'QR uses its dedicated overlay layer'
        );

        t.same(
            calls.updateDrawablePosition[0],
            [
                42,
                [
                    160,
                    100
                ]
            ],
            'overlay uses the canonical top-right position'
        );

        t.same(
            calls.updateDrawableScale[0],
            [
                42,
                [
                    50,
                    50
                ]
            ],
            'overlay uses the compact canonical scale'
        );

        t.same(
            calls.updateDrawableVisible[0],
            [
                42,
                true
            ]
        );

        t.equal(
            calls.createBitmapSkin[0][0].width,
            256
        );

        t.equal(
            calls.createBitmapSkin[0][0].height,
            256
        );

        extension.showQrCode({
            QR_CODE: 'qr_b'
        });

        t.equal(
            calls.createBitmapSkin.length,
            1,
            'second QR reuses the existing skin'
        );

        t.equal(
            calls.createDrawable.length,
            1,
            'second QR reuses the existing drawable'
        );

        t.equal(
            calls.updateBitmapSkin.length,
            1,
            'existing skin receives the new QR bitmap'
        );

        t.equal(
            extension._visibleQrCodeId,
            'qr_b'
        );

        t.equal(
            calls.redraw,
            2
        );

        global.ImageData =
            previousImageData;

        t.end();
    }
);

tap.test(
    'EasyBlox QR repositions a visible Stage overlay immediately',
    t => {
        const previousImageData =
            global.ImageData;

        global.ImageData =
            class ImageDataMock {
                constructor (
                    data,
                    width,
                    height
                ) {
                    this.data = data;
                    this.width = width;
                    this.height = height;
                }
            };

        let positionListener = null;

        const positionCalls = [];
        let redrawCount = 0;

        const runtime = {
            renderer: {
                createBitmapSkin:
                    () => 41,
                createDrawable:
                    () => 42,
                updateDrawableSkinId:
                    () => {},
                updateDrawablePosition:
                    (drawableId, position) => {
                        positionCalls.push([
                            drawableId,
                            position
                        ]);
                    },
                updateDrawableScale:
                    () => {},
                updateDrawableVisible:
                    () => {}
            },

            getEasyBloxQrCodeById:
                () => ({
                    id: 'qr_a',
                    name: 'Estação 1',
                    content: 'A'
                }),

            getEasyBloxQrOverlayPosition:
                () =>
                    'topRight',

            requestRedraw:
                () => {
                    redrawCount += 1;
                },

            on:
                (eventName, listener) => {
                    if (
                        eventName ===
                        'EASYBLOX_QR_OVERLAY_POSITION_CHANGED'
                    ) {
                        positionListener =
                            listener;
                    }
                }
        };

        const extension =
            createExtension(runtime);

        extension.showQrCode({
            QR_CODE: 'qr_a'
        });

        t.same(
            positionCalls[0],
            [
                42,
                [
                    160,
                    100
                ]
            ],
            'persisted position is used when the overlay is created'
        );

        t.type(
            positionListener,
            'function'
        );

        positionListener(
            'bottomLeft'
        );

        t.same(
            positionCalls[
                positionCalls.length - 1
            ],
            [
                42,
                [
                    -160,
                    -100
                ]
            ],
            'visible overlay moves immediately'
        );

        t.equal(
            redrawCount,
            2
        );

        global.ImageData =
            previousImageData;

        t.end();
    }
);

tap.test(
    'EasyBlox QR hide preserves reusable renderer resources',
    t => {
        const previousImageData =
            global.ImageData;

        global.ImageData =
            class ImageDataMock {
                constructor (
                    data,
                    width,
                    height
                ) {
                    this.data = data;
                    this.width = width;
                    this.height = height;
                }
            };

        const visibleCalls = [];
        let redrawCount = 0;

        const runtime = {
            renderer: {
                createBitmapSkin:
                    () => 41,
                createDrawable:
                    () => 42,
                updateDrawableSkinId:
                    () => {},
                updateDrawablePosition:
                    () => {},
                updateDrawableScale:
                    () => {},
                updateDrawableVisible:
                    (drawableId, visible) => {
                        visibleCalls.push([
                            drawableId,
                            visible
                        ]);
                    }
            },
            getEasyBloxQrCodeById:
                () => ({
                    id: 'qr_a',
                    name: 'Estação 1',
                    content: 'A'
                }),
            requestRedraw:
                () => {
                    redrawCount += 1;
                }
        };

        const extension =
            createExtension(runtime);

        extension.showQrCode({
            QR_CODE: 'qr_a'
        });

        extension.hideQrCode();

        t.equal(
            extension._visibleQrCodeId,
            null
        );

        t.equal(
            extension._stageQrSkinId,
            41
        );

        t.equal(
            extension._stageQrDrawableId,
            42
        );

        t.same(
            visibleCalls[
                visibleCalls.length - 1
            ],
            [
                42,
                false
            ]
        );

        t.equal(
            redrawCount,
            2
        );

        global.ImageData =
            previousImageData;

        t.end();
    }
);

tap.test(
    'EasyBlox QR destroys Stage overlay resources when the runtime is disposed',
    t => {
        const previousImageData =
            global.ImageData;

        global.ImageData =
            class ImageDataMock {
                constructor (
                    data,
                    width,
                    height
                ) {
                    this.data = data;
                    this.width = width;
                    this.height = height;
                }
            };

        let disposeListener = null;

        const destroyedDrawables = [];
        const destroyedSkins = [];

        const runtime = {
            renderer: {
                createBitmapSkin:
                    () => 41,
                createDrawable:
                    () => 42,
                updateDrawableSkinId:
                    () => {},
                updateDrawablePosition:
                    () => {},
                updateDrawableScale:
                    () => {},
                updateDrawableVisible:
                    () => {},
                destroyDrawable:
                    (drawableId, layer) => {
                        destroyedDrawables.push([
                            drawableId,
                            layer
                        ]);
                    },
                destroySkin:
                    skinId => {
                        destroyedSkins.push(
                            skinId
                        );
                    }
            },

            getEasyBloxQrCodeById:
                () => ({
                    id: 'qr_a',
                    name: 'Estação 1',
                    content: 'A'
                }),

            requestRedraw:
                () => {},

            on:
                (eventName, listener) => {
                    if (
                        eventName ===
                        'RUNTIME_DISPOSED'
                    ) {
                        disposeListener =
                            listener;
                    }
                }
        };

        const extension =
            createExtension(runtime);

        extension.showQrCode({
            QR_CODE: 'qr_a'
        });

        t.type(
            disposeListener,
            'function'
        );

        disposeListener();

        t.same(
            destroyedDrawables,
            [
                [
                    42,
                    'easybloxQr'
                ]
            ]
        );

        t.same(
            destroyedSkins,
            [
                41
            ]
        );

        t.equal(
            extension._stageQrDrawableId,
            -1
        );

        t.equal(
            extension._stageQrSkinId,
            -1
        );

        t.equal(
            extension._visibleQrCodeId,
            null
        );

        global.ImageData =
            previousImageData;

        t.end();
    }
);
