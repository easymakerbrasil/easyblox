const tap =
    require('tap');

const {
    DEFAULT_ERROR_CORRECTION_LEVEL,
    DEFAULT_MARGIN_MODULES,
    DEFAULT_RASTER_SIZE,
    encodeEasyBloxQr,
    rasterizeEasyBloxQr
} =
    require('../../src/qr/easyblox-qr-encoder');

tap.test(
    'EasyBlox QR encoder exposes the canonical v1 defaults',
    t => {
        t.equal(
            DEFAULT_ERROR_CORRECTION_LEVEL,
            'M'
        );

        t.equal(
            DEFAULT_MARGIN_MODULES,
            4
        );

        t.equal(
            DEFAULT_RASTER_SIZE,
            1024
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR encoder rejects empty content',
    t => {
        t.throws(
            () =>
                encodeEasyBloxQr(''),
            /must not be empty/
        );

        t.throws(
            () =>
                encodeEasyBloxQr(null),
            /must not be empty/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR encoder creates a logical binary matrix',
    t => {
        const encoded =
            encodeEasyBloxQr(
                'EASYBLOX-QR-001'
            );

        t.equal(
            encoded.content,
            'EASYBLOX-QR-001'
        );

        t.ok(
            Number.isInteger(
                encoded.moduleCount
            )
        );

        t.ok(
            encoded.moduleCount > 0
        );

        t.equal(
            encoded.modules.length,
            encoded.moduleCount *
                encoded.moduleCount
        );

        t.ok(
            encoded.modules.every(
                module =>
                    module === 0 ||
                    module === 1
            )
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR encoder is deterministic for the same content',
    t => {
        const first =
            encodeEasyBloxQr(
                'EASYBLOX-DETERMINISTIC'
            );

        const second =
            encodeEasyBloxQr(
                'EASYBLOX-DETERMINISTIC'
            );

        t.equal(
            first.moduleCount,
            second.moduleCount
        );

        t.same(
            Array.from(first.modules),
            Array.from(second.modules)
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR encoder supports UTF-8 project content',
    t => {
        const encoded =
            encodeEasyBloxQr(
                'EasyBlox — Robótica 🤖'
            );

        t.equal(
            encoded.content,
            'EasyBlox — Robótica 🤖'
        );

        t.ok(
            encoded.moduleCount > 0
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR raster is canonical 1024 square RGBA',
    t => {
        const raster =
            rasterizeEasyBloxQr(
                'EASYBLOX-QR-001'
            );

        t.equal(
            raster.width,
            1024
        );

        t.equal(
            raster.height,
            1024
        );

        t.equal(
            raster.pixels.length,
            1024 *
                1024 *
                4
        );

        t.equal(
            raster.marginModules,
            4
        );

        t.ok(
            raster.modulePixelSize >= 1
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR raster keeps the outer quiet zone white',
    t => {
        const raster =
            rasterizeEasyBloxQr(
                'EASYBLOX-QUIET-ZONE',
                {
                    size:
                        256
                }
            );

        const firstPixel = [
            raster.pixels[0],
            raster.pixels[1],
            raster.pixels[2],
            raster.pixels[3]
        ];

        const lastIndex =
            raster.pixels.length - 4;

        const lastPixel = [
            raster.pixels[lastIndex],
            raster.pixels[lastIndex + 1],
            raster.pixels[lastIndex + 2],
            raster.pixels[lastIndex + 3]
        ];

        t.same(
            firstPixel,
            [
                255,
                255,
                255,
                255
            ]
        );

        t.same(
            lastPixel,
            [
                255,
                255,
                255,
                255
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR raster rejects impossible dimensions',
    t => {
        t.throws(
            () =>
                rasterizeEasyBloxQr(
                    'A',
                    {
                        size:
                            1
                    }
                ),
            /too small/
        );

        t.throws(
            () =>
                rasterizeEasyBloxQr(
                    'A',
                    {
                        marginModules:
                            -1
                    }
                ),
            /must not be negative/
        );

        t.end();
    }
);
