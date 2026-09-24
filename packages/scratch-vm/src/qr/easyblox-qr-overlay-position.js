const DEFAULT_EASYBLOX_QR_OVERLAY_POSITION =
    'topRight';

const EASYBLOX_QR_OVERLAY_POSITION_CHANGED =
    'EASYBLOX_QR_OVERLAY_POSITION_CHANGED';

const EASYBLOX_QR_OVERLAY_POSITIONS = {
    topLeft: [
        -160,
        100
    ],
    topCenter: [
        0,
        100
    ],
    topRight: [
        160,
        100
    ],
    centerLeft: [
        -160,
        0
    ],
    center: [
        0,
        0
    ],
    centerRight: [
        160,
        0
    ],
    bottomLeft: [
        -160,
        -100
    ],
    bottomCenter: [
        0,
        -100
    ],
    bottomRight: [
        160,
        -100
    ]
};

/**
 * Return whether a value is a canonical EasyBlox QR overlay position.
 * @param {*} position Position identifier.
 * @returns {boolean} Whether the identifier is supported.
 */
const isEasyBloxQrOverlayPosition = position =>
    (
        typeof position === 'string' &&
        Object.prototype.hasOwnProperty.call(
            EASYBLOX_QR_OVERLAY_POSITIONS,
            position
        )
    );

/**
 * Normalize serialized EasyBlox QR overlay position data.
 * @param {*} position Serialized position identifier.
 * @returns {string} Canonical position identifier.
 */
const normalizeEasyBloxQrOverlayPosition = position =>
    (
        isEasyBloxQrOverlayPosition(position) ?
            position :
            DEFAULT_EASYBLOX_QR_OVERLAY_POSITION
    );

/**
 * Convert an EasyBlox QR overlay position into Scratch Stage coordinates.
 * A new coordinate array is returned on every call.
 * @param {*} position Position identifier.
 * @returns {!Array<number>} Scratch Stage x/y coordinates.
 */
const getEasyBloxQrOverlayCoordinates = position => {
    const normalizedPosition =
        normalizeEasyBloxQrOverlayPosition(
            position
        );

    const coordinates =
        EASYBLOX_QR_OVERLAY_POSITIONS[
            normalizedPosition
        ];

    return [
        coordinates[0],
        coordinates[1]
    ];
};

module.exports = {
    DEFAULT_EASYBLOX_QR_OVERLAY_POSITION,
    EASYBLOX_QR_OVERLAY_POSITION_CHANGED,
    EASYBLOX_QR_OVERLAY_POSITIONS,
    getEasyBloxQrOverlayCoordinates,
    isEasyBloxQrOverlayPosition,
    normalizeEasyBloxQrOverlayPosition
};
