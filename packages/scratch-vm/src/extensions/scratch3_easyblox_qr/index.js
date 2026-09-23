const ArgumentType =
    require('../../extension-support/argument-type');
const BlockExecutionMode =
    require('../../extension-support/block-execution-mode');
const BlockType =
    require('../../extension-support/block-type');

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

class Scratch3EasyBloxQrBlocks {
    constructor (runtime) {
        this.runtime = runtime;

        this._readerSource = null;
        this._boundaryEnabled = true;
        this._detected = false;
        this._content = '';
        this._visibleQrCodeId = null;

        this._cameraEnabledByReader = false;
        this._videoMirrorBeforeReader = null;
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
     * Select and activate the source used by the QR reader.
     * Camera decoding itself is implemented by the decoder integration lot.
     * @param {!object} args Scratch block arguments.
     */
    startReader (args) {
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
    }

    /**
     * Stop the QR reader.
     */
    stopReader () {
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
     * Select a project QR Code for display on the Stage.
     * Actual rendering is implemented by the generator integration lot.
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
                'function' ||
            !this.runtime.getEasyBloxQrCodeById(
                qrCodeId
            )
        ) {
            return;
        }

        this._visibleQrCodeId =
            qrCodeId;
    }

    /**
     * Hide the project QR Code currently selected for the Stage.
     * Actual rendering is implemented by the generator integration lot.
     */
    hideQrCode () {
        this._visibleQrCodeId = null;
    }
}

module.exports =
    Scratch3EasyBloxQrBlocks;
