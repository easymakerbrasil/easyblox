const ArgumentType =
    require('../../extension-support/argument-type');
const BlockExecutionMode =
    require('../../extension-support/block-execution-mode');
const BlockType =
    require('../../extension-support/block-type');
const StageLayering =
    require('../../engine/stage-layering');
const {
    rasterizeEasyBloxQr
} = require('../../qr/easyblox-qr-encoder');
const {
    decodeEasyBloxQrFrame
} = require('../../qr/easyblox-qr-decoder');
const {
    EASYBLOX_QR_OVERLAY_POSITION_CHANGED,
    getEasyBloxQrOverlayCoordinates
} = require('../../qr/easyblox-qr-overlay-position');

const EXTENSION_ID =
    'easybloxQr';

const READER_SOURCE_CAMERA_NORMAL =
    'cameraNormal';
const READER_SOURCE_CAMERA_MIRRORED =
    'cameraMirrored';
const READER_SOURCE_STAGE =
    'stage';

const BOUNDARY_ON =
    'on';
const BOUNDARY_OFF =
    'off';

const STAGE_QR_RASTER_SIZE =
    256;

const STAGE_QR_SCALE_PERCENT =
    50;

const CAMERA_FRAME_FORMAT =
    'image-data';

const CAMERA_FRAME_CACHE_TIMEOUT =
    0;

const QR_READER_INTERVAL_MS =
    100;

class Scratch3EasyBloxQrBlocks {
    constructor (runtime) {
        this.runtime = runtime;

        this._readerSource = null;
        this._boundaryEnabled = true;
        this._detected = false;
        this._content = '';
        this._location = null;

        this._readerTimeout = null;
        this._readerSessionId = 0;

        this._visibleQrCodeId = null;

        this._stageQrSkinId = -1;
        this._stageQrDrawableId = -1;

        this._cameraEnabledByReader = false;
        this._videoMirrorBeforeReader = null;

        if (
            this.runtime &&
            typeof this.runtime.on === 'function'
        ) {
            this.runtime.on(
                'RUNTIME_DISPOSED',
                () => {
                    this.stopReader();
                    this._disposeStageQrCode();
                }
            );
            this.runtime.on(
                EASYBLOX_QR_OVERLAY_POSITION_CHANGED,
                position => {
                    this._updateStageQrPosition(
                        position
                    );
                }
            );
        }
    }

    /**
     * Describe the EasyBlox QR extension to the Scratch VM.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'QR Code',
            color1: '#14845f',
            color2: '#106b4d',
            color3: '#0c523b',
            blocks: [
                {
                    blockType: BlockType.BUTTON,
                    text: 'Criar QR Code',
                    func: 'MAKE_EASYBLOX_QR'
                },
                {
                    blockType: BlockType.BUTTON,
                    text: 'Gerenciar QR Codes',
                    func: 'MANAGE_EASYBLOX_QR'
                },
                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Leitura'
                },
                {
                    opcode: 'startReader',
                    blockType: BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.STAGE_ONLY,
                    text: 'iniciar leitor em [SOURCE]',
                    arguments: {
                        SOURCE: {
                            type: ArgumentType.STRING,
                            menu: 'readerSources',
                            defaultValue:
                                READER_SOURCE_CAMERA_NORMAL
                        }
                    }
                },
                {
                    opcode: 'stopReader',
                    blockType: BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.STAGE_ONLY,
                    text: 'desligar leitor'
                },
                {
                    opcode: 'isDetected',
                    blockType: BlockType.BOOLEAN,
                    executionMode:
                        BlockExecutionMode.STAGE_ONLY,
                    text: 'QR Code detectado?'
                },
                {
                    opcode: 'content',
                    blockType: BlockType.REPORTER,
                    executionMode:
                        BlockExecutionMode.STAGE_ONLY,
                    text: 'conteúdo do QR Code lido'
                },
                {
                    opcode: 'setBoundary',
                    blockType: BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.STAGE_ONLY,
                    text: 'delimitação [STATE]',
                    arguments: {
                        STATE: {
                            type: ArgumentType.STRING,
                            menu: 'boundaryStates',
                            defaultValue:
                                BOUNDARY_ON
                        }
                    }
                },
                '---',
                {
                    blockType: BlockType.LABEL,
                    text: 'Uso'
                },
                {
                    opcode: 'showQrCode',
                    blockType: BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.STAGE_ONLY,
                    text: 'mostrar QR Code [QR_CODE]',
                    arguments: {
                        QR_CODE: {
                            type: ArgumentType.STRING,
                            menu: 'qrCodes',
                            defaultValue:
                                this.getDefaultQrCodeId()
                        }
                    }
                },
                {
                    opcode: 'hideQrCode',
                    blockType: BlockType.COMMAND,
                    executionMode:
                        BlockExecutionMode.STAGE_ONLY,
                    text: 'ocultar QR Code'
                }
            ],
            menus: {
                readerSources: {
                    acceptReporters: false,
                    items: [
                        {
                            text: 'câmera normal',
                            value:
                                READER_SOURCE_CAMERA_NORMAL
                        },
                        {
                            text: 'câmera invertida',
                            value:
                                READER_SOURCE_CAMERA_MIRRORED
                        },
                        {
                            text: 'palco',
                            value:
                                READER_SOURCE_STAGE
                        }
                    ]
                },
                boundaryStates: {
                    acceptReporters: false,
                    items: [
                        {
                            text: 'ligada',
                            value:
                                BOUNDARY_ON
                        },
                        {
                            text: 'desligada',
                            value:
                                BOUNDARY_OFF
                        }
                    ]
                },
                qrCodes: {
                    acceptReporters: false,
                    items: 'getQrCodeMenu'
                }
            }
        };
    }

    /**
     * Return the stable ID used as the default value for new QR display blocks.
     * @returns {string} First project QR Code ID or an empty value.
     */
    getDefaultQrCodeId () {
        const menu =
            this.getQrCodeMenu();

        if (
            menu.length === 0 ||
            !menu[0].value
        ) {
            return '';
        }

        return menu[0].value;
    }

    /**
     * Build the current project QR Code menu.
     * The visible name is separated from the stable internal ID.
     * @returns {!Array<!object>} Scratch menu items.
     */
    getQrCodeMenu () {
        const qrCodes =
            this.runtime &&
            typeof this.runtime.getEasyBloxQrCodes ===
                'function' ?
                this.runtime.getEasyBloxQrCodes() :
                [];

        if (qrCodes.length === 0) {
            return [
                {
                    text: 'nenhum criado',
                    value: ''
                }
            ];
        }

        return qrCodes.map(qrCode => ({
            text: qrCode.name,
            value: qrCode.id
        }));
    }

    /**
     * Return whether the active QR reader source is camera based.
     * @returns {boolean} True for either camera orientation.
     */
    _isCameraReaderSource () {
        return (
            this._readerSource ===
                READER_SOURCE_CAMERA_NORMAL ||
            this._readerSource ===
                READER_SOURCE_CAMERA_MIRRORED
        );
    }

    /**
     * Stop the scheduled camera decoding loop.
     */
    _stopReaderLoop () {
        if (
            this._readerTimeout !==
            null
        ) {
            clearTimeout(
                this._readerTimeout
            );

            this._readerTimeout = null;
        }
    }

    /**
     * Apply one decoder result to the Scratch sensing state.
     * @param {?object} decoded Decoded QR result or null.
     */
    _updateReaderDetection (decoded) {
        if (!decoded) {
            this._detected = false;
            this._content = '';
            this._location = null;
            return;
        }

        this._detected = true;
        this._content =
            decoded.content;
        this._location =
            decoded.location;
    }

    /**
     * Capture and decode one frame from the active camera source.
     */
    _readCameraFrame () {
        const video =
            this.runtime &&
            this.runtime.ioDevices &&
            this.runtime.ioDevices.video ?
                this.runtime.ioDevices.video :
                null;

        if (
            !video ||
            typeof video.getFrame !==
                'function'
        ) {
            this._updateReaderDetection(
                null
            );
            return;
        }

        const frame =
            video.getFrame({
                mirror:
                    this._readerSource ===
                    READER_SOURCE_CAMERA_MIRRORED,
                format:
                    CAMERA_FRAME_FORMAT,
                cacheTimeout:
                    CAMERA_FRAME_CACHE_TIMEOUT
            });

        if (!frame) {
            this._updateReaderDetection(
                null
            );
            return;
        }

        try {
            this._updateReaderDetection(
                decodeEasyBloxQrFrame(
                    frame
                )
            );
        } catch {
            this._updateReaderDetection(
                null
            );
        }
    }

    /**
     * Capture and decode the complete rendered Stage.
     */
    _readStageFrame () {
        const renderer =
            this.runtime &&
            this.runtime.renderer ?
                this.runtime.renderer :
                null;

        if (
            !renderer ||
            typeof renderer.extractStageImageData !==
                'function'
        ) {
            this._updateReaderDetection(
                null
            );
            return;
        }

        try {
            const frame =
                renderer.extractStageImageData();

            this._updateReaderDetection(
                frame ?
                    decodeEasyBloxQrFrame(
                        frame
                    ) :
                    null
            );
        } catch {
            this._updateReaderDetection(
                null
            );
        }
    }

    /**
     * Read one frame from the currently selected reader source.
     */
    _readActiveSourceFrame () {
        if (
            this._readerSource ===
            READER_SOURCE_STAGE
        ) {
            this._readStageFrame();
            return;
        }

        if (
            this._isCameraReaderSource()
        ) {
            this._readCameraFrame();
            return;
        }

        this._updateReaderDetection(
            null
        );
    }

    /**
     * Start a race-safe decoding loop for the active reader source.
     * @param {number} readerSessionId Active reader session identifier.
     */
    _startReaderLoop (readerSessionId) {
        this._stopReaderLoop();

        const readNextFrame = () => {
            if (
                readerSessionId !==
                    this._readerSessionId ||
                this._readerSource ===
                    null
            ) {
                this._readerTimeout =
                    null;
                return;
            }

            this._readActiveSourceFrame();

            this._readerTimeout =
                setTimeout(
                    readNextFrame,
                    QR_READER_INTERVAL_MS
                );
        };

        readNextFrame();
    }

    /**
     * Select and activate the source used by the QR reader.
     * Camera decoding itself is implemented by the decoder integration lot.
     * @param {!object} args Scratch block arguments.
     */
    startReader (args) {
        this._stopReaderLoop();

        const readerSessionId =
            ++this._readerSessionId;

        const requestedSource =
            args &&
            typeof args.SOURCE === 'string' ?
                args.SOURCE :
                READER_SOURCE_CAMERA_NORMAL;

        const validSources = [
            READER_SOURCE_CAMERA_NORMAL,
            READER_SOURCE_CAMERA_MIRRORED,
            READER_SOURCE_STAGE
        ];

        const readerSource =
            validSources.includes(requestedSource) ?
                requestedSource :
                READER_SOURCE_CAMERA_NORMAL;

        this._readerSource =
            readerSource;

        this._detected = false;
        this._content = '';
        this._location = null;

        const video =
            this.runtime &&
            this.runtime.ioDevices &&
            this.runtime.ioDevices.video ?
                this.runtime.ioDevices.video :
                null;

        if (
            readerSource ===
            READER_SOURCE_STAGE
        ) {
            if (
                this._cameraEnabledByReader &&
                video &&
                typeof video.disableVideo ===
                    'function'
            ) {
                video.disableVideo();
            }

            this._cameraEnabledByReader =
                false;

            if (
                video &&
                this._videoMirrorBeforeReader !==
                    null
            ) {
                video.mirror =
                    this._videoMirrorBeforeReader;
            }

            this._videoMirrorBeforeReader =
                null;

            this._startReaderLoop(
                readerSessionId
            );

            return;
        }

        if (!video) {
            return;
        }

        if (
            this._videoMirrorBeforeReader ===
            null
        ) {
            this._videoMirrorBeforeReader =
                Boolean(video.mirror);
        }

        video.mirror =
            readerSource ===
            READER_SOURCE_CAMERA_MIRRORED;

        if (
            this._cameraEnabledByReader ||
            video.videoReady
        ) {
            this._startReaderLoop(
                readerSessionId
            );
            return;
        }

        if (
            typeof video.enableVideo !==
                'function'
        ) {
            return;
        }

        const enableResult =
            video.enableVideo();

        this._cameraEnabledByReader =
            enableResult !== null;

        if (
            !enableResult ||
            typeof enableResult.then !==
                'function'
        ) {
            if (
                this._cameraEnabledByReader
            ) {
                this._startCameraReaderLoop(
                    readerSessionId
                );
            }

            return;
        }

        enableResult
            .then(
                () => {
                    if (
                        readerSessionId !==
                            this._readerSessionId ||
                        !this._isCameraReaderSource()
                    ) {
                        return;
                    }

                    this._startCameraReaderLoop(
                        readerSessionId
                    );
                }
            )
            .catch(
                () => {
                    if (
                        readerSessionId ===
                        this._readerSessionId
                    ) {
                        this._updateReaderDetection(
                            null
                        );
                    }
                }
            );
    }

    /**
     * Stop the QR reader.
     */
    stopReader () {
        this._stopReaderLoop();
        this._readerSessionId += 1;

        const video =
            this.runtime &&
            this.runtime.ioDevices &&
            this.runtime.ioDevices.video ?
                this.runtime.ioDevices.video :
                null;

        if (
            this._cameraEnabledByReader &&
            video &&
            typeof video.disableVideo ===
                'function'
        ) {
            video.disableVideo();
        }

        this._cameraEnabledByReader =
            false;

        if (
            video &&
            this._videoMirrorBeforeReader !==
                null
        ) {
            video.mirror =
                this._videoMirrorBeforeReader;
        }

        this._videoMirrorBeforeReader =
            null;

        this._readerSource = null;
        this._detected = false;
        this._content = '';
        this._location = null;
    }

    /**
     * Report whether a QR Code is currently detected.
     * @returns {boolean} Detection state.
     */
    isDetected () {
        return this._detected;
    }

    /**
     * Report the content of the currently detected QR Code.
     * @returns {string} Decoded QR Code content.
     */
    content () {
        return this._content;
    }

    /**
     * Enable or disable the visual QR Code boundary.
     * @param {!object} args Scratch block arguments.
     */
    setBoundary (args) {
        this._boundaryEnabled =
            !args ||
            args.STATE !== BOUNDARY_OFF;
    }

    /**
     * Convert the canonical QR raster into browser ImageData.
     * @param {!object} raster Canonical EasyBlox QR raster.
     * @returns {!ImageData} Browser bitmap data.
     */
    _createStageQrImageData (raster) {
        return new ImageData(
            raster.pixels,
            raster.width,
            raster.height
        );
    }

    /**
     * Resolve the persisted QR overlay coordinates for the current project.
     * @returns {!Array<number>} Scratch Stage x/y coordinates.
     */
    _getStageQrPosition () {
        const position =
            this.runtime &&
            typeof this.runtime
                .getEasyBloxQrOverlayPosition ===
                'function' ?
                this.runtime
                    .getEasyBloxQrOverlayPosition() :
                null;

        return getEasyBloxQrOverlayCoordinates(
            position
        );
    }

    /**
     * Reposition an existing Stage QR overlay immediately.
     * @param {string} position Canonical overlay position identifier.
     */
    _updateStageQrPosition (position) {
        const renderer =
            this.runtime &&
            this.runtime.renderer ?
                this.runtime.renderer :
                null;

        if (
            !renderer ||
            this._stageQrDrawableId === -1
        ) {
            return;
        }

        renderer.updateDrawablePosition(
            this._stageQrDrawableId,
            getEasyBloxQrOverlayCoordinates(
                position
            )
        );

        if (
            typeof this.runtime.requestRedraw ===
                'function'
        ) {
            this.runtime.requestRedraw();
        }
    }

    /**
     * Render one project QR Code as a compact Stage overlay.
     * The same drawable and skin are reused while the project is active.
     * @param {!object} qrCode Project QR Code resource.
     */
    _renderStageQrCode (qrCode) {
        const renderer =
            this.runtime &&
            this.runtime.renderer ?
                this.runtime.renderer :
                null;

        if (!renderer) {
            return;
        }

        const raster =
            rasterizeEasyBloxQr(
                qrCode.content,
                {
                    size:
                        STAGE_QR_RASTER_SIZE
                }
            );

        const imageData =
            this._createStageQrImageData(
                raster
            );

        if (
            this._stageQrSkinId === -1 ||
            this._stageQrDrawableId === -1
        ) {
            this._stageQrSkinId =
                renderer.createBitmapSkin(
                    imageData,
                    1
                );

            this._stageQrDrawableId =
                renderer.createDrawable(
                    StageLayering
                        .EASYBLOX_QR_LAYER
                );

            renderer.updateDrawableSkinId(
                this._stageQrDrawableId,
                this._stageQrSkinId
            );

            renderer.updateDrawablePosition(
                this._stageQrDrawableId,
                this._getStageQrPosition()
            );

            renderer.updateDrawableScale(
                this._stageQrDrawableId,
                [
                    STAGE_QR_SCALE_PERCENT,
                    STAGE_QR_SCALE_PERCENT
                ]
            );
        } else {
            renderer.updateBitmapSkin(
                this._stageQrSkinId,
                imageData,
                1
            );
        }

        renderer.updateDrawableVisible(
            this._stageQrDrawableId,
            true
        );

        if (
            this.runtime &&
            typeof this.runtime.requestRedraw ===
                'function'
        ) {
            this.runtime.requestRedraw();
        }
    }

    /**
     * Destroy the renderer resources owned by the Stage QR overlay.
     */
    _disposeStageQrCode () {
        const renderer =
            this.runtime &&
            this.runtime.renderer ?
                this.runtime.renderer :
                null;

        if (renderer) {
            if (
                this._stageQrDrawableId !== -1 &&
                typeof renderer.destroyDrawable ===
                    'function'
            ) {
                renderer.destroyDrawable(
                    this._stageQrDrawableId,
                    StageLayering
                        .EASYBLOX_QR_LAYER
                );
            }

            if (
                this._stageQrSkinId !== -1 &&
                typeof renderer.destroySkin ===
                    'function'
            ) {
                renderer.destroySkin(
                    this._stageQrSkinId
                );
            }
        }

        this._stageQrDrawableId = -1;
        this._stageQrSkinId = -1;
        this._visibleQrCodeId = null;
    }

    /**
     * Display one project QR Code as a compact Stage overlay.
     * @param {!object} args Scratch block arguments.
     */
    showQrCode (args) {
        const qrCodeId =
            args &&
            typeof args.QR_CODE === 'string' ?
                args.QR_CODE :
                '';

        if (
            !qrCodeId ||
            !this.runtime ||
            typeof this.runtime.getEasyBloxQrCodeById !==
                'function'
        ) {
            return;
        }

        const qrCode =
            this.runtime.getEasyBloxQrCodeById(
                qrCodeId
            );

        if (!qrCode) {
            return;
        }

        this._visibleQrCodeId =
            qrCodeId;

        this._renderStageQrCode(
            qrCode
        );
    }

    /**
     * Hide the project QR Code currently displayed on the Stage.
     */
    hideQrCode () {
        this._visibleQrCodeId = null;

        const renderer =
            this.runtime &&
            this.runtime.renderer ?
                this.runtime.renderer :
                null;

        if (
            renderer &&
            this._stageQrDrawableId !== -1
        ) {
            renderer.updateDrawableVisible(
                this._stageQrDrawableId,
                false
            );

            if (
                typeof this.runtime.requestRedraw ===
                    'function'
            ) {
                this.runtime.requestRedraw();
            }
        }
    }
}

module.exports =
    Scratch3EasyBloxQrBlocks;
