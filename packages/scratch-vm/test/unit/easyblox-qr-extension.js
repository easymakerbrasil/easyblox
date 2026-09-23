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
