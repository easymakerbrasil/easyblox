const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');

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
