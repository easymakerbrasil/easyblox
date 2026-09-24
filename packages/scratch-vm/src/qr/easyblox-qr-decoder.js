const jsQR =
    require('jsqr');

const DEFAULT_INVERSION_ATTEMPTS =
    'attemptBoth';

/**
 * Validate one QR decoder frame.
 * @param {!object} frame ImageData-like RGBA frame.
 * @returns {!object} Normalized frame.
 */
const normalizeFrame = frame => {
    if (
        !frame ||
        typeof frame !== 'object' ||
        Array.isArray(frame)
    ) {
        throw new Error(
            'EasyBlox QR decoder requires a frame'
        );
    }

    const width =
        Number(frame.width);

    const height =
        Number(frame.height);

    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width <= 0 ||
        height <= 0
    ) {
        throw new Error(
            'EasyBlox QR decoder requires positive integer dimensions'
        );
    }

    if (
        !(frame.data instanceof Uint8ClampedArray)
    ) {
        throw new Error(
            'EasyBlox QR decoder requires Uint8ClampedArray RGBA data'
        );
    }

    const expectedLength =
        width *
        height *
        4;

    if (
        frame.data.length !==
        expectedLength
    ) {
        throw new Error(
            'EasyBlox QR decoder frame size does not match its dimensions'
        );
    }

    return {
        data:
            frame.data,
        width,
        height
    };
};

/**
 * Normalize one jsQR point.
 * @param {?object} point jsQR location point.
 * @returns {?object} Normalized x/y point.
 */
const normalizePoint = point => {
    if (
        !point ||
        typeof point.x !== 'number' ||
        typeof point.y !== 'number'
    ) {
        return null;
    }

    return {
        x: point.x,
        y: point.y
    };
};

/**
 * Normalize jsQR location data into the EasyBlox boundary contract.
 * @param {?object} location jsQR location object.
 * @returns {?object} Four QR corner points or null.
 */
const normalizeLocation = location => {
    if (!location) {
        return null;
    }

    const topLeft =
        normalizePoint(
            location.topLeftCorner
        );

    const topRight =
        normalizePoint(
            location.topRightCorner
        );

    const bottomRight =
        normalizePoint(
            location.bottomRightCorner
        );

    const bottomLeft =
        normalizePoint(
            location.bottomLeftCorner
        );

    if (
        !topLeft ||
        !topRight ||
        !bottomRight ||
        !bottomLeft
    ) {
        return null;
    }

    return {
        topLeft,
        topRight,
        bottomRight,
        bottomLeft
    };
};

/**
 * Decode one RGBA frame.
 * @param {!object} frame ImageData-like RGBA frame.
 * @returns {?object} Decoded QR data or null when no QR is found.
 */
const decodeEasyBloxQrFrame = frame => {
    const normalizedFrame =
        normalizeFrame(frame);

    const decoded =
        jsQR(
            normalizedFrame.data,
            normalizedFrame.width,
            normalizedFrame.height,
            {
                inversionAttempts:
                    DEFAULT_INVERSION_ATTEMPTS
            }
        );

    if (!decoded) {
        return null;
    }

    return {
        content:
            decoded.data,
        location:
            normalizeLocation(
                decoded.location
            )
    };
};

module.exports = {
    DEFAULT_INVERSION_ATTEMPTS,
    decodeEasyBloxQrFrame
};
