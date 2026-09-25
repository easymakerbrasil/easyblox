const {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog
} = require('./compatibility-classifier');

const ARDUINO_UNO_BOARD =
    'Arduino Uno';

const RAW_UNSUPPORTED_ENTRIES = [
    {
        opcode:
            'displayModule_initialiseI2CDisplay',
        status:
            COMPATIBILITY_STATUSES
                .UNSUPPORTED,
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        note:
            'PictoBlox preserves an explicit LCD I2C address input while EasyBlox LCD v1 auto-detects supported addresses; the current mapping model cannot constrain conversion by literal input value.'
    },
    {
        opcode:
            'displayModule_setCursor',
        status:
            COMPATIBILITY_STATUSES
                .UNSUPPORTED,
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        note:
            'PictoBlox stores LCD cursor row and column as persistent display state while EasyBlox LCD v1 requires row and column on each write command.'
    },
    {
        opcode:
            'displayModule_write',
        status:
            COMPATIBILITY_STATUSES
                .UNSUPPORTED,
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        note:
            'PictoBlox writes text at the current persistent LCD cursor position while EasyBlox LCD v1 requires text, row, and column in one block; deterministic conversion requires stateful structural rewriting.'
    },
    {
        opcode:
            'qrCodeScanner_analyseImage',
        status:
            COMPATIBILITY_STATUSES
                .UNSUPPORTED,
        note:
            'PictoBlox performs explicit single-frame QR analysis while EasyBlox QR v1 uses continuous reader semantics.'
    },
    {
        opcode:
            'qrCodeScanner_drawBoundingBox',
        status:
            COMPATIBILITY_STATUSES
                .UNSUPPORTED,
        note:
            'Observed PictoBlox projects do not preserve a reliable bounding-box state for deterministic conversion to EasyBlox QR boundary control.'
    },
    {
        opcode:
            'qrCodeScanner_toggleStageVideoFeed',
        status:
            COMPATIBILITY_STATUSES
                .UNSUPPORTED,
        note:
            'PictoBlox video feed control may require both video state and transparency while the current mapping model supports one target block.'
    }
];

const createPictoBloxUnsupportedCatalog =
    () => {
        const catalog =
            createCompatibilityCatalog(
                RAW_UNSUPPORTED_ENTRIES
            );

        const entries =
            Array.from(
                catalog.values()
            ).sort(
                (
                    left,
                    right
                ) =>
                    left.opcode
                        .localeCompare(
                            right.opcode
                        )
            );

        return {
            entries,
            totalUnsupportedCount:
                entries.length
        };
    };

module.exports = {
    createPictoBloxUnsupportedCatalog
};
