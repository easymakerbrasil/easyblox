const tap =
    require('tap');

const {
    rasterizeEasyBloxQr
} = require('../../src/qr/easyblox-qr-encoder');

const {
    DEFAULT_INVERSION_ATTEMPTS,
    decodeEasyBloxQrFrame
} = require('../../src/qr/easyblox-qr-decoder');

const rasterToFrame = raster => ({
    data:
        raster.pixels,
    width:
        raster.width,
    height:
        raster.height
});

tap.test(
    'EasyBlox QR decoder exposes the canonical inversion policy',
    t => {
        t.equal(
            DEFAULT_INVERSION_ATTEMPTS,
            'attemptBoth'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR decoder reads a canonical EasyBlox QR raster',
    t => {
        const raster =
            rasterizeEasyBloxQr(
                'EASYBLOX-DECODE-001',
                {
                    size: 256
                }
            );

        const decoded =
            decodeEasyBloxQrFrame(
                rasterToFrame(raster)
            );

        t.ok(
            decoded,
            'QR Code is detected'
        );

        t.equal(
            decoded.content,
            'EASYBLOX-DECODE-001'
        );

        t.ok(
            decoded.location,
            'boundary information is available'
        );

        t.type(
            decoded.location.topLeft.x,
            'number'
        );

        t.type(
            decoded.location.topLeft.y,
            'number'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR decoder preserves UTF-8 content',
    t => {
        const raster =
            rasterizeEasyBloxQr(
                'Estação Fácil — ação 01',
                {
                    size: 256
                }
            );

        const decoded =
            decodeEasyBloxQrFrame(
                rasterToFrame(raster)
            );

        t.equal(
            decoded.content,
            'Estação Fácil — ação 01'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR decoder returns null when no QR Code is present',
    t => {
        const width =
            128;

        const height =
            128;

        const data =
            new Uint8ClampedArray(
                width *
                height *
                4
            );

        data.fill(
            255
        );

        const decoded =
            decodeEasyBloxQrFrame({
                data,
                width,
                height
            });

        t.equal(
            decoded,
            null
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR decoder rejects invalid frame dimensions',
    t => {
        t.throws(
            () =>
                decodeEasyBloxQrFrame({
                    data:
                        new Uint8ClampedArray(
                            16
                        ),
                    width:
                        0,
                    height:
                        2
                }),
            /positive integer dimensions/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR decoder rejects invalid RGBA data',
    t => {
        t.throws(
            () =>
                decodeEasyBloxQrFrame({
                    data: [],
                    width: 2,
                    height: 2
                }),
            /Uint8ClampedArray/
        );

        t.throws(
            () =>
                decodeEasyBloxQrFrame({
                    data:
                        new Uint8ClampedArray(
                            8
                        ),
                    width: 2,
                    height: 2
                }),
            /does not match/
        );

        t.end();
    }
);
