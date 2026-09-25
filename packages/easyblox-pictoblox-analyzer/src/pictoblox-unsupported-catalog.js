const {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog
} = require('./compatibility-classifier');

const RAW_UNSUPPORTED_ENTRIES = [
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
