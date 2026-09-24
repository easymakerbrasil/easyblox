const tap =
    require('tap');

const VirtualMachine =
    require('../../src/virtual-machine');

tap.test(
    'EasyBlox project extension IDs start empty',
    t => {
        const vm =
            new VirtualMachine();

        vm.runtime.targets =
            [];

        t.same(
            vm.getProjectExtensionIds(),
            []
        );

        t.end();
    }
);

tap.test(
    'EasyBlox project extension IDs come from Stage and Upload blocks',
    t => {
        const vm =
            new VirtualMachine();

        vm.runtime.targets = [
            {
                blocks: {
                    _blocks: {
                        qr: {
                            opcode:
                                'easybloxQr_showQrCode'
                        },
                        bluetooth: {
                            opcode:
                                'easybloxBt_sendText'
                        },
                        motion: {
                            opcode:
                                'motion_movesteps'
                        }
                    }
                }
            }
        ];

        vm._easybloxUploadPrograms =
            new Map([
                [
                    'arduino-uno',
                    {
                        blocks: {
                            _blocks: {
                                board: {
                                    opcode:
                                        'arduinoUno_digitalWrite'
                                },
                                bluetoothAgain: {
                                    opcode:
                                        'easybloxBt_sendNumber'
                                }
                            }
                        }
                    }
                ]
            ]);

        t.same(
            vm.getProjectExtensionIds()
                .sort(),
            [
                'arduinoUno',
                'easybloxBt',
                'easybloxQr'
            ].sort()
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR resources keep the QR extension owned by the project',
    t => {
        const vm =
            new VirtualMachine();

        vm.runtime.targets =
            [];

        vm.runtime.restoreEasyBloxQrCodes([
            {
                id: 'qr_a',
                name: 'Estação',
                content: 'A'
            }
        ]);

        t.same(
            vm.getProjectExtensionIds(),
            [
                'easybloxQr'
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox QR resources load the QR extension without QR blocks',
    async t => {
        const vm =
            new VirtualMachine();

        let installedExtensionIds =
            null;

        vm.installTargets =
            (
                targets,
                extensions
            ) => {
                installedExtensionIds =
                    Array.from(
                        extensions.extensionIDs
                    );

                return Promise.resolve();
            };

        await vm.deserializeProject(
            {
                projectVersion: 3,
                targets: [],
                monitors: [],
                extensions: [],
                meta: {},
                easybloxProject: {
                    schemaVersion: 1,
                    selectedBoardId: null,
                    programMode: 'stage',
                    qrCodes: [
                        {
                            id: 'qr_saved',
                            name: 'QR salvo',
                            content:
                                'EASYBLOX-SAVED-QR'
                        }
                    ],
                    qrOverlayPosition:
                        'topRight'
                }
            },
            null
        );

        t.ok(
            installedExtensionIds.includes(
                'easybloxQr'
            ),
            'resource-only QR project installs its extension'
        );
    }
);
