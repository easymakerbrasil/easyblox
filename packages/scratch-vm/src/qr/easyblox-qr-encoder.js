const QRCode =
    require('qrcode');

const DEFAULT_ERROR_CORRECTION_LEVEL =
    'M';

const DEFAULT_MARGIN_MODULES =
    4;

const DEFAULT_RASTER_SIZE =
    1024;

/**
 * Normalize QR Code content to the canonical EasyBlox representation.
 * @param {?string} content Content to encode.
 * @returns {string} Normalized QR Code content.
 */
const normalizeContent = content => {
    if (
        content === null ||
        typeof content === 'undefined'
    ) {
        return '';
    }

    return String(content);
};

/**
 * Encode content into a logical QR Code matrix.
 * This operation is independent from DOM, canvas and renderer state.
 * @param {?string} content Content to encode.
 * @returns {!object} Canonical QR Code matrix.
 */
const encodeEasyBloxQr = content => {
    const normalizedContent =
        normalizeContent(content);

    if (!normalizedContent.length) {
        throw new Error(
            'EasyBlox QR Code content must not be empty'
        );
    }

    const qrCode =
        QRCode.create(
            normalizedContent,
            {
                errorCorrectionLevel:
                    DEFAULT_ERROR_CORRECTION_LEVEL
            }
        );

    return {
        content:
            normalizedContent,
        moduleCount:
            qrCode.modules.size,
        modules:
            Uint8Array.from(
                qrCode.modules.data,
                module => {
                    if (module) {
                        return 1;
                    }

                    return 0;
                }
            )
    };
};

/**
 * Rasterize a logical QR Code into deterministic RGBA pixels.
 * The QR modules always use an integer pixel scale to avoid antialiasing.
 * @param {?string} content Content to encode.
 * @param {object} [options] Raster options.
 * @param {number} [options.size] Square output size in pixels.
 * @param {number} [options.marginModules] Quiet-zone width in QR modules.
 * @returns {!object} Canonical RGBA raster.
 */
const rasterizeEasyBloxQr = (
    content,
    options = {}
) => {
    const encoded =
        encodeEasyBloxQr(content);

    const requestedSize =
        Number.isInteger(options.size) ?
            options.size :
            DEFAULT_RASTER_SIZE;

    const marginModules =
        Number.isInteger(options.marginModules) ?
            options.marginModules :
            DEFAULT_MARGIN_MODULES;

    if (requestedSize <= 0) {
        throw new Error(
            'EasyBlox QR Code raster size must be greater than zero'
        );
    }

    if (marginModules < 0) {
        throw new Error(
            'EasyBlox QR Code margin must not be negative'
        );
    }

    const totalModules =
        encoded.moduleCount +
        (marginModules * 2);

    const modulePixelSize =
        Math.floor(
            requestedSize /
            totalModules
        );

    if (modulePixelSize < 1) {
        throw new Error(
            'EasyBlox QR Code raster size is too small'
        );
    }

    const renderedSize =
        totalModules *
        modulePixelSize;

    const offset =
        Math.floor(
            (
                requestedSize -
                renderedSize
            ) / 2
        );

    const pixels =
        new Uint8ClampedArray(
            requestedSize *
            requestedSize *
            4
        );

    pixels.fill(255);

    const setDarkPixel = (x, y) => {
        const index =
            (
                (y * requestedSize) +
                x
            ) * 4;

        pixels[index] = 0;
        pixels[index + 1] = 0;
        pixels[index + 2] = 0;
        pixels[index + 3] = 255;
    };

    for (
        let moduleY = 0;
        moduleY < encoded.moduleCount;
        moduleY++
    ) {
        for (
            let moduleX = 0;
            moduleX < encoded.moduleCount;
            moduleX++
        ) {
            const moduleIndex =
                (
                    moduleY *
                    encoded.moduleCount
                ) +
                moduleX;

            if (
                encoded.modules[
                    moduleIndex
                ] !== 1
            ) {
                continue;
            }

            const pixelX =
                offset +
                (
                    (
                        marginModules +
                        moduleX
                    ) *
                    modulePixelSize
                );

            const pixelY =
                offset +
                (
                    (
                        marginModules +
                        moduleY
                    ) *
                    modulePixelSize
                );

            for (
                let y = 0;
                y < modulePixelSize;
                y++
            ) {
                for (
                    let x = 0;
                    x < modulePixelSize;
                    x++
                ) {
                    setDarkPixel(
                        pixelX + x,
                        pixelY + y
                    );
                }
            }
        }
    }

    return {
        content:
            encoded.content,
        width:
            requestedSize,
        height:
            requestedSize,
        pixels,
        moduleCount:
            encoded.moduleCount,
        modulePixelSize,
        marginModules,
        renderedSize,
        offset
    };
};

module.exports = {
    DEFAULT_ERROR_CORRECTION_LEVEL,
    DEFAULT_MARGIN_MODULES,
    DEFAULT_RASTER_SIZE,
    encodeEasyBloxQr,
    rasterizeEasyBloxQr
};
