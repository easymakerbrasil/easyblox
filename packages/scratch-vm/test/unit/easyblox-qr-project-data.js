const tap = require('tap');

const VirtualMachine =
    require('../../src/virtual-machine');

const createVm = () =>
    new VirtualMachine();

tap.test(
    'EasyBlox QR project resources start empty',
    t => {
        const vm = createVm();

        t.same(
            vm.getEasyBloxQrCodes(),
            []
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR creates resources with stable internal IDs',
    t => {
        const vm = createVm();

        const qrCode =
            vm.createEasyBloxQrCode(
                'Estação 1',
                'https://example.com'
            );

        t.match(
            qrCode.id,
            /^qr_/,
            'uses the canonical QR resource prefix'
        );

        t.equal(
            qrCode.name,
            'Estação 1'
        );

        t.equal(
            qrCode.content,
            'https://example.com'
        );

        t.same(
            vm.getEasyBloxQrCodes(),
            [
                qrCode
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR rasterizes a saved resource by stable ID',
    t => {
        const vm = createVm();

        const created =
            vm.createEasyBloxQrCode(
                'Estação 1',
                'EASYBLOX-PREVIEW-001'
            );

        const raster =
            vm.getEasyBloxQrCodeRaster(
                created.id,
                {
                    size: 128
                }
            );

        t.equal(
            raster.content,
            'EASYBLOX-PREVIEW-001'
        );

        t.equal(
            raster.width,
            128
        );

        t.equal(
            raster.height,
            128
        );

        t.equal(
            raster.pixels.length,
            128 * 128 * 4
        );

        t.equal(
            vm.getEasyBloxQrCodeRaster(
                'qr_missing'
            ),
            null
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR names are unique ignoring case',
    t => {
        const vm = createVm();

        vm.createEasyBloxQrCode(
            'Estação 1',
            'A'
        );

        t.throws(
            () => vm.createEasyBloxQrCode(
                'estação 1',
                'B'
            ),
            /already exists/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR rejects empty resource names',
    t => {
        const vm = createVm();

        t.throws(
            () => vm.createEasyBloxQrCode(
                '   ',
                'conteúdo'
            ),
            /must not be empty/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR updates name and content without changing its ID',
    t => {
        const vm = createVm();

        const created =
            vm.createEasyBloxQrCode(
                'Estação 1',
                'A'
            );

        const updated =
            vm.updateEasyBloxQrCode(
                created.id,
                {
                    name: 'Desafio Final',
                    content: 'B'
                }
            );

        t.equal(
            updated.id,
            created.id,
            'stable ID is preserved'
        );

        t.equal(
            updated.name,
            'Desafio Final'
        );

        t.equal(
            updated.content,
            'B'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR prevents duplicate names during rename',
    t => {
        const vm = createVm();

        vm.createEasyBloxQrCode(
            'Estação 1',
            'A'
        );

        const second =
            vm.createEasyBloxQrCode(
                'Estação 2',
                'B'
            );

        t.throws(
            () => vm.updateEasyBloxQrCode(
                second.id,
                {
                    name: 'ESTAÇÃO 1'
                }
            ),
            /already exists/
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR deletes resources by stable ID',
    t => {
        const vm = createVm();

        const created =
            vm.createEasyBloxQrCode(
                'Estação 1',
                'A'
            );

        t.equal(
            vm.deleteEasyBloxQrCode(
                created.id
            ),
            true
        );

        t.same(
            vm.getEasyBloxQrCodes(),
            []
        );

        t.equal(
            vm.deleteEasyBloxQrCode(
                created.id
            ),
            false
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR returns copies instead of mutable registry entries',
    t => {
        const vm = createVm();

        const created =
            vm.createEasyBloxQrCode(
                'Estação 1',
                'A'
            );

        const qrCodes =
            vm.getEasyBloxQrCodes();

        qrCodes[0].name =
            'Alterado externamente';

        t.equal(
            vm.getEasyBloxQrCodeById(
                created.id
            ).name,
            'Estação 1'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR normalizes serialized project resources',
    t => {
        const vm = createVm();

        vm.runtime.restoreEasyBloxQrCodes([
            {
                id: 'qr_a',
                name: 'Estação 1',
                content: 'A'
            },
            {
                id: 'qr_b',
                name: 'ESTAÇÃO 1',
                content: 'duplicado'
            },
            {
                id: 'qr_a',
                name: 'Outro',
                content: 'id duplicado'
            },
            {
                id: '',
                name: 'Inválido',
                content: 'X'
            },
            null,
            {
                id: 'qr_c',
                name: 'Estação 2',
                content: 'B'
            }
        ]);

        t.same(
            vm.getEasyBloxQrCodes(),
            [
                {
                    id: 'qr_a',
                    name: 'Estação 1',
                    content: 'A'
                },
                {
                    id: 'qr_c',
                    name: 'Estação 2',
                    content: 'B'
                }
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR VM facade and Runtime share the same project registry',
    t => {
        const vm = createVm();

        const created =
            vm.createEasyBloxQrCode(
                'Estação 1',
                'A'
            );

        t.same(
            vm.runtime.getEasyBloxQrCodes(),
            [
                created
            ]
        );

        t.same(
            vm.getEasyBloxQrCodes(),
            vm.runtime.getEasyBloxQrCodes()
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR resources are serialized in easybloxProject',
    t => {
        const vm = createVm();

        const created =
            vm.createEasyBloxQrCode(
                'Estação 1',
                'https://example.com'
            );

        const project =
            JSON.parse(
                vm.toJSON()
            );

        t.equal(
            project.easybloxProject.schemaVersion,
            1
        );

        t.same(
            project.easybloxProject.qrCodes,
            [
                created
            ]
        );

        t.end();
    }
);
