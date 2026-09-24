const BOUNDARY_OUTER_COLOR = [
    40,
    40,
    40,
    255
];

const BOUNDARY_INNER_COLOR = [
    255,
    200,
    0,
    255
];

const BOUNDARY_OUTER_RADIUS =
    3;

const BOUNDARY_INNER_RADIUS =
    1;

const BOUNDARY_PADDING =
    4;

const CORNER_NAMES = [
    'topLeft',
    'topRight',
    'bottomRight',
    'bottomLeft'
];

/**
 * Validate one frame dimension.
 * @param {number} value Dimension value.
 * @returns {boolean} Whether the dimension is valid.
 */
const isValidDimension = value =>
    (
        Number.isInteger(value) &&
        value > 0
    );

/**
 * Clamp one coordinate to a frame boundary.
 * @param {number} value Coordinate value.
 * @param {number} maximum Maximum inclusive coordinate.
 * @returns {number} Clamped coordinate.
 */
const clampCoordinate = (
    value,
    maximum
) =>
    Math.max(
        0,
        Math.min(
            maximum,
            value
        )
    );

/**
 * Normalize the four QR Code corner points.
 * @param {?object} location Decoder location object.
 * @param {number} frameWidth Source frame width.
 * @param {number} frameHeight Source frame height.
 * @returns {?Array<!object>} Canonical ordered points.
 */
const normalizeLocation = (
    location,
    frameWidth,
    frameHeight
) => {
    if (
        !location ||
        typeof location !== 'object'
    ) {
        return null;
    }

    const points = [];

    for (const cornerName of CORNER_NAMES) {
        const point =
            location[cornerName];

        if (
            !point ||
            !Number.isFinite(point.x) ||
            !Number.isFinite(point.y)
        ) {
            return null;
        }

        points.push({
            x:
                clampCoordinate(
                    point.x,
                    frameWidth - 1
                ),
            y:
                clampCoordinate(
                    point.y,
                    frameHeight - 1
                )
        });
    }

    return points;
};

/**
 * Set one RGBA pixel when it lies inside the raster.
 * @param {!Uint8ClampedArray} pixels Destination pixels.
 * @param {number} width Raster width.
 * @param {number} height Raster height.
 * @param {number} x Local x coordinate.
 * @param {number} y Local y coordinate.
 * @param {!Array<number>} color RGBA color.
 */
const setPixel = (
    pixels,
    width,
    height,
    x,
    y,
    color
) => {
    if (
        x < 0 ||
        y < 0 ||
        x >= width ||
        y >= height
    ) {
        return;
    }

    const index =
        (
            (y * width) +
            x
        ) * 4;

    pixels[index] =
        color[0];
    pixels[index + 1] =
        color[1];
    pixels[index + 2] =
        color[2];
    pixels[index + 3] =
        color[3];
};

/**
 * Draw one circular brush point.
 * @param {!Uint8ClampedArray} pixels Destination pixels.
 * @param {number} width Raster width.
 * @param {number} height Raster height.
 * @param {number} x Local x coordinate.
 * @param {number} y Local y coordinate.
 * @param {number} radius Brush radius.
 * @param {!Array<number>} color RGBA color.
 */
const drawBrush = (
    pixels,
    width,
    height,
    x,
    y,
    radius,
    color
) => {
    for (
        let offsetY = -radius;
        offsetY <= radius;
        offsetY++
    ) {
        for (
            let offsetX = -radius;
            offsetX <= radius;
            offsetX++
        ) {
            if (
                (
                    (offsetX * offsetX) +
                    (offsetY * offsetY)
                ) >
                (radius * radius)
            ) {
                continue;
            }

            setPixel(
                pixels,
                width,
                height,
                x + offsetX,
                y + offsetY,
                color
            );
        }
    }
};

/**
 * Draw one thick line between two points.
 * @param {!Uint8ClampedArray} pixels Destination pixels.
 * @param {number} width Raster width.
 * @param {number} height Raster height.
 * @param {!object} start Start point.
 * @param {!object} end End point.
 * @param {number} radius Brush radius.
 * @param {!Array<number>} color RGBA color.
 */
const drawLine = (
    pixels,
    width,
    height,
    start,
    end,
    radius,
    color
) => {
    const deltaX =
        end.x -
        start.x;

    const deltaY =
        end.y -
        start.y;

    const steps =
        Math.ceil(
            Math.max(
                Math.abs(deltaX),
                Math.abs(deltaY)
            )
        );

    if (steps === 0) {
        drawBrush(
            pixels,
            width,
            height,
            Math.round(start.x),
            Math.round(start.y),
            radius,
            color
        );

        return;
    }

    for (
        let step = 0;
        step <= steps;
        step++
    ) {
        const ratio =
            step /
            steps;

        drawBrush(
            pixels,
            width,
            height,
            Math.round(
                start.x +
                (deltaX * ratio)
            ),
            Math.round(
                start.y +
                (deltaY * ratio)
            ),
            radius,
            color
        );
    }
};

/**
 * Rasterize the detected QR Code polygon into a cropped transparent bitmap.
 * Coordinates remain relative to the original decoder frame.
 * @param {?object} location Decoder QR Code location.
 * @param {number} frameWidth Source frame width.
 * @param {number} frameHeight Source frame height.
 * @returns {?object} Cropped canonical boundary raster.
 */
const createEasyBloxQrBoundaryRaster = (
    location,
    frameWidth,
    frameHeight
) => {
    if (
        !isValidDimension(frameWidth) ||
        !isValidDimension(frameHeight)
    ) {
        throw new Error(
            'EasyBlox QR boundary requires positive integer frame dimensions'
        );
    }

    const points =
        normalizeLocation(
            location,
            frameWidth,
            frameHeight
        );

    if (!points) {
        return null;
    }

    const pointXs =
        points.map(point => point.x);

    const pointYs =
        points.map(point => point.y);

    const originX =
        Math.max(
            0,
            Math.floor(
                Math.min(...pointXs)
            ) -
            BOUNDARY_PADDING
        );

    const originY =
        Math.max(
            0,
            Math.floor(
                Math.min(...pointYs)
            ) -
            BOUNDARY_PADDING
        );

    const maximumX =
        Math.min(
            frameWidth - 1,
            Math.ceil(
                Math.max(...pointXs)
            ) +
            BOUNDARY_PADDING
        );

    const maximumY =
        Math.min(
            frameHeight - 1,
            Math.ceil(
                Math.max(...pointYs)
            ) +
            BOUNDARY_PADDING
        );

    const width =
        maximumX -
        originX +
        1;

    const height =
        maximumY -
        originY +
        1;

    const pixels =
        new Uint8ClampedArray(
            width *
            height *
            4
        );

    const localPoints =
        points.map(point => ({
            x:
                point.x -
                originX,
            y:
                point.y -
                originY
        }));

    const drawPolygon = (
        radius,
        color
    ) => {
        for (
            let pointIndex = 0;
            pointIndex < localPoints.length;
            pointIndex++
        ) {
            const nextPointIndex =
                (
                    pointIndex +
                    1
                ) %
                localPoints.length;

            drawLine(
                pixels,
                width,
                height,
                localPoints[pointIndex],
                localPoints[nextPointIndex],
                radius,
                color
            );
        }
    };

    drawPolygon(
        BOUNDARY_OUTER_RADIUS,
        BOUNDARY_OUTER_COLOR
    );

    drawPolygon(
        BOUNDARY_INNER_RADIUS,
        BOUNDARY_INNER_COLOR
    );

    return {
        pixels,
        width,
        height,
        originX,
        originY
    };
};

module.exports = {
    BOUNDARY_INNER_COLOR,
    BOUNDARY_OUTER_COLOR,
    BOUNDARY_PADDING,
    createEasyBloxQrBoundaryRaster
};
