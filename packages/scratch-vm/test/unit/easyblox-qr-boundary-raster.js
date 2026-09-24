const tap =
    require('tap');

const {
    BOUNDARY_INNER_COLOR,
    BOUNDARY_OUTER_COLOR,
    createEasyBloxQrBoundaryRaster
} = require('../../src/qr/easyblox-qr-boundary-raster');

const getPixel = (
    raster,
    frameX,
    frameY
) => {
    const localX =
        frameX -
        raster.originX;

    const localY =
        frameY -
        raster.originY;

    const index =
        (
            (localY * raster.width) +
            localX
        ) * 4;

    return Array.from(
        raster.pixels.slice(
            index,
            index + 4
        )
    );
};

tap.test(
    'EasyBlox QR boundary raster preserves frame coordinates',
    t => {
        const raster =
            createEasyBloxQrBoundaryRaster(
                {
                    topLeft: {
                        x: 20,
                        y: 30
                    },
                    topRight: {
                        x: 60,
                        y: 30
                    },
                    bottomRight: {
                        x: 60,
                        y: 60
                    },
                    bottomLeft: {
                        x: 20,
                        y: 60
                    }
                },
                100,
                80
            );

        t.equal(
            raster.originX,
            16
        );

        t.equal(
            raster.originY,
            26
        );

        t.equal(
            raster.width,
            49
        );

        t.equal(
            raster.height,
            39
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR boundary raster uses branded inner and contrast outer strokes',
    t => {
        const raster =
            createEasyBloxQrBoundaryRaster(
                {
                    topLeft: {
                        x: 20,
                        y: 30
                    },
                    topRight: {
                        x: 60,
                        y: 30
                    },
                    bottomRight: {
                        x: 60,
                        y: 60
                    },
                    bottomLeft: {
                        x: 20,
                        y: 60
                    }
                },
                100,
                80
            );

        t.same(
            getPixel(
                raster,
                40,
                30
            ),
            BOUNDARY_INNER_COLOR,
            'detected edge uses EasyMaker yellow'
        );

        t.same(
            getPixel(
                raster,
                40,
                27
            ),
            BOUNDARY_OUTER_COLOR,
            'outer contrast stroke uses graphite'
        );

        t.same(
            getPixel(
                raster,
                40,
                45
            ),
            [
                0,
                0,
                0,
                0
            ],
            'inside of the QR boundary remains transparent'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR boundary raster clips safely at frame edges',
    t => {
        const raster =
            createEasyBloxQrBoundaryRaster(
                {
                    topLeft: {
                        x: 1,
                        y: 1
                    },
                    topRight: {
                        x: 20,
                        y: 1
                    },
                    bottomRight: {
                        x: 20,
                        y: 20
                    },
                    bottomLeft: {
                        x: 1,
                        y: 20
                    }
                },
                30,
                30
            );

        t.equal(
            raster.originX,
            0
        );

        t.equal(
            raster.originY,
            0
        );

        t.ok(
            raster.width <= 30
        );

        t.ok(
            raster.height <= 30
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR boundary raster rejects unusable input safely',
    t => {
        t.equal(
            createEasyBloxQrBoundaryRaster(
                null,
                480,
                360
            ),
            null
        );

        t.equal(
            createEasyBloxQrBoundaryRaster(
                {
                    topLeft: {
                        x: 1,
                        y: 1
                    }
                },
                480,
                360
            ),
            null
        );

        t.throws(
            () =>
                createEasyBloxQrBoundaryRaster(
                    {},
                    0,
                    360
                ),
            /positive integer frame dimensions/
        );

        t.end();
    }
);
