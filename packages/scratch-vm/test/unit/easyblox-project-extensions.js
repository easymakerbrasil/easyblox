const tap =
    require('tap');

const VirtualMachine =
    require('../../src/virtual-machine');
const MonitorRecord = require('../../src/engine/monitor-record');

for (const opcode of ['videoSensing_videoOn', 'faceSensing_faceSize']) {
    tap.test(`monitor-only projects own ${opcode.split('_')[0]} without querying camera`, t => {
        const vm = new VirtualMachine();
        const video = vm.runtime.ioDevices.video;
        let starts = 0;
        video.setProvider({
            enableVideo () {
                starts++;
                return Promise.resolve();
            },
            disableVideo () {},
            getFrame: () => null
        });
        t.teardown(() => vm.runtime.dispose());
        vm.runtime.requestAddMonitor(MonitorRecord({id: 'monitor', opcode, visible: true}));
        t.same(vm.getProjectExtensionIds(), [opcode.split('_')[0]]);
        t.same(vm.getProjectExtensionIds(), [opcode.split('_')[0]], 'queries are repeatable');
        t.equal(starts, 0, 'ownership lookup cannot acquire capture');
        t.equal(video._cameraConsumers.size, 0);
        vm.runtime.dispose();
        t.same(vm.getProjectExtensionIds(), [], 'project reset clears monitor ownership');
        t.end();
    });
}

tap.test('monitor ownership deduplicates blocks and excludes core monitors and cached services', t => {
    const vm = new VirtualMachine();
    t.teardown(() => vm.runtime.dispose());
    vm.runtime.targets = [{blocks: {_blocks: {face: {opcode: 'faceSensing_faceSize'}}}}];
    vm.runtime.requestAddMonitor(MonitorRecord({id: 'face', opcode: 'faceSensing_faceSize', visible: false}));
    vm.runtime.requestAddMonitor(MonitorRecord({id: 'video', opcode: 'videoSensing_videoOn'}));
    vm.runtime.requestAddMonitor(MonitorRecord({id: 'core', opcode: 'motion_xposition'}));
    vm.extensionManager._loadedExtensions.set('music', 'cached-music');
    vm.runtime.restoreEasyBloxQrCodes([{id: 'qr_monitor', name: 'QR', content: 'MONITORS'}]);
    t.same(vm.getProjectExtensionIds().sort(), ['easybloxQr', 'faceSensing', 'videoSensing']);
    vm.runtime.targets = [];
    vm.runtime.requestRemoveMonitor('face');
    t.same(vm.getProjectExtensionIds().sort(), ['easybloxQr', 'videoSensing'],
        'removed monitors are not collected from cached monitor blocks');
    t.end();
});

tap.test('sb3 roundtrips preserve block, monitor and QR ownership without inheriting cached extensions', async t => {
    const fs = require('fs');
    const path = require('path');
    const JSZip = require('jszip');
    const dispatch = require('../../src/dispatch/central-dispatch');
    const fixture = fs.readFileSync(path.join(__dirname, '../fixtures/default.sb3'));
    const vm = new VirtualMachine();
    t.teardown(() => {
        const service = dispatch.services[vm.extensionManager._loadedExtensions.get('videoSensing')];
        if (service) service._stopLoop();
        vm.runtime.dispose();
        vm.quit();
    });
    for (const source of ['blocks', 'monitors', 'both']) {
        const zip = await JSZip.loadAsync(fixture);
        const project = JSON.parse(await zip.file('project.json').async('string'));
        const opcodes = ['videoSensing_videoOn', 'faceSensing_faceSize'];
        if (source !== 'blocks') {
            project.monitors = opcodes.map((opcode, index) => ({
                id: `monitor-${index}`,
                opcode,
                params: index === 0 ? {ATTRIBUTE: 'motion', SUBJECT: 'Stage'} : {},
                mode: 'default',
                spriteName: null,
                value: 0,
                x: 0,
                y: index * 50,
                visible: index === 0
            }));
        }
        if (source !== 'monitors') {
            opcodes.forEach((opcode, index) => {
                project.targets[1].blocks[`block-${index}`] = {
                    opcode,
                    next: null,
                    parent: null,
                    inputs: {},
                    fields: {},
                    shadow: false,
                    topLevel: true,
                    x: 0,
                    y: index * 50
                };
            });
        }
        zip.file('project.json', JSON.stringify(project));
        await vm.loadProject(await zip.generateAsync({type: 'nodebuffer'}));
        t.same(vm.getProjectExtensionIds().sort(), ['faceSensing', 'videoSensing'], source);
        const saved = JSON.parse(vm.toJSON());
        const roundtrip = await JSZip.loadAsync(fixture);
        roundtrip.file('project.json', JSON.stringify(saved));
        await vm.loadProject(await roundtrip.generateAsync({type: 'nodebuffer'}));
        t.same(vm.getProjectExtensionIds().sort(), ['faceSensing', 'videoSensing'], `${source} roundtrip`);
        t.same(JSON.parse(vm.toJSON()).monitors, saved.monitors, 'monitor data is unchanged');
        await vm.loadProject(fixture);
        t.same(vm.getProjectExtensionIds(), [], 'empty project excludes cached services');
    }
    vm.createEasyBloxQrCode('QR resource', 'RESOURCE-ONLY');
    t.same(vm.getProjectExtensionIds(), ['easybloxQr']);
    const zip = await JSZip.loadAsync(fixture);
    zip.file('project.json', vm.toJSON());
    await vm.loadProject(await zip.generateAsync({type: 'nodebuffer'}));
    t.same(vm.getProjectExtensionIds(), ['easybloxQr'], 'resource-only QR roundtrip');
    await vm.loadProject(fixture);
    t.same(vm.getProjectExtensionIds(), []);
});

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
