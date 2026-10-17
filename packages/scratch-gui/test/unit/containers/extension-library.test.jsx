import {ExtensionLibrary} from '../../../src/containers/extension-library.jsx';
import {Blocks} from '../../../src/containers/blocks.jsx';

// Exercise the source VM while keeping UUID on its CommonJS entry in jsdom.
jest.mock('@scratch/scratch-vm', () => require('../../../../scratch-vm/src/virtual-machine'));
jest.mock('uuid', () => jest.requireActual('../../../../../node_modules/uuid/dist/index.js'));
jest.mock('@tensorflow-models/face-detection', () => ({
    SupportedModels: {MediaPipeFaceDetector: 'mediapipe'},
    createDetector: jest.fn(() => Promise.resolve({
        estimateFaces: jest.fn(() => Promise.resolve([])),
        dispose: jest.fn()
    }))
}));

describe('Library removal with three real camera consumers', () => {
    test('releases session ownership, preserves project data and supports reinclusion', async () => {
        const VirtualMachine = require('../../../../scratch-vm/src/virtual-machine');
        const dispatch = require('../../../../scratch-vm/src/dispatch/central-dispatch');
        const fs = require('fs');
        const path = require('path');
        const JSZip = require('jszip');
        const {setImmediate: flush, setTimeout: delay} = require('timers/promises');
        const deferred = () => {
            let resolve;
            const executor = function (callback) {
                resolve = callback;
            };
            return {promise: new Promise(executor), resolve};
        };
        const nodePerformance = require('perf_hooks').performance;
        const previousTiming = {mark: performance.mark, measure: performance.measure};
        Object.assign(performance, {
            mark: nodePerformance.mark.bind(nodePerformance),
            measure: nodePerformance.measure.bind(nodePerformance)
        });
        const fixture = fs.readFileSync(path.resolve(
            __dirname, '../../../../scratch-vm/test/fixtures/default.sb3'
        ));
        const vm = new VirtualMachine();
        const video = vm.runtime.ioDevices.video;
        const captures = [];
        let reads = 0;
        let frame = null;
        vm.setVideoProvider({
            enableVideo: () => (captures.length ? captures.shift() : Promise.resolve()),
            disableVideo () {},
            getFrame () {
                reads++;
                return frame;
            }
        });
        const ids = ['videoSensing', 'faceSensing', 'easybloxQr'];
        const library = new ExtensionLibrary({
            vm,
            activeExtensionIds: ids,
            intl: {formatMessage: jest.fn().mockReturnValue('Extensions')},
            onExtensionActivate: jest.fn(),
            onExtensionRemove: jest.fn(),
            onCategorySelected: jest.fn()
        });
        const service = function (id) {
            return dispatch.services[vm.extensionManager._loadedExtensions.get(id)];
        };
        const remove = function (id) {
            library.render().props.onItemRemove({extensionId: id});
        };
        const include = function (id) {
            library.handleItemSelect({extensionId: id});
        };
        const errors = [];
        const onRejection = function (error) {
            errors.push(error);
        };
        process.on('unhandledRejection', onRejection);
        let qr;
        let sensing;
        let face;
        try {
            const zip = await JSZip.loadAsync(fixture);
            const project = JSON.parse(await zip.file('project.json').async('string'));
            project.targets[0].videoState = 'on-flipped';
            project.targets[0].videoTransparency = 70;
            project.targets[1].blocks.qr = {
                opcode: 'easybloxQr_isDetected',
                next: null,
                parent: null,
                inputs: {},
                fields: {},
                shadow: false,
                topLevel: true,
                x: 0,
                y: 0
            };
            project.monitors = ['videoSensing_videoOn', 'faceSensing_faceSize'].map((opcode, index) => ({
                id: `monitor-${index}`,
                opcode,
                params: index === 0 ? {ATTRIBUTE: 'motion', SUBJECT: 'Stage'} : {},
                mode: 'default',
                spriteName: null,
                value: 0,
                x: 0,
                y: index * 50,
                visible: true
            }));
            zip.file('project.json', JSON.stringify(project));
            await vm.loadProject(await zip.generateAsync({type: 'nodebuffer'}));
            await flush();
            qr = service('easybloxQr');
            sensing = service('videoSensing');
            face = service('faceSensing');
            const resource = vm.createEasyBloxQrCode('Saved QR', 'KEPT');
            qr.showQrCode({QR_CODE: resource.id});
            qr.startReader({SOURCE: 'cameraNormal'});
            await flush();
            expect(video._cameraConsumers.size).toBe(3);
            const qrLease = qr._cameraLease;
            const faceLease = face._cameraLease;
            const videoLease = sensing._cameraLease;
            remove('videoSensing');
            expect(video.isCameraLeaseActive(videoLease)).toBe(false);
            expect(video.isCameraLeaseActive(qrLease)).toBe(true);
            expect(video.isCameraLeaseActive(faceLease)).toBe(true);
            expect(vm.runtime.getTargetForStage().videoState).toBe('on-flipped');
            expect(vm.runtime.getTargetForStage().videoTransparency).toBe(70);
            sensing.getInfo();
            await vm.extensionManager.refreshBlocks();
            await flush();
            expect(sensing._cameraLease).toBeNull();
            include('videoSensing');
            include('videoSensing');
            await flush();
            expect(video._cameraConsumers.size).toBe(3);
            expect(sensing._cameraLease).not.toBe(videoLease);

            const inference = deferred();
            const detector = face._faceDetector;
            detector.estimateFaces.mockReturnValueOnce(inference.promise);
            frame = {};
            face._loop(face._session);
            await flush();
            frame = null;
            remove('faceSensing');
            expect(video.isCameraLeaseActive(faceLease)).toBe(false);
            expect(video.isCameraLeaseActive(sensing._cameraLease)).toBe(true);
            expect(video.isCameraLeaseActive(qrLease)).toBe(true);
            expect(detector.dispose).not.toHaveBeenCalled();
            include('faceSensing');
            include('faceSensing');
            await flush();
            const currentFace = {box: {height: 55}};
            face._currentFace = currentFace;
            inference.resolve([{box: {height: 999}}]);
            await flush();
            expect(face._currentFace).toBe(currentFace);
            expect(detector.dispose).toHaveBeenCalledTimes(1);
            expect(video._cameraConsumers.size).toBe(3);

            remove('easybloxQr');
            expect(video.isCameraLeaseActive(qrLease)).toBe(false);
            expect(qr._readerTimeout).toBeNull();
            expect(qr._visibleQrCodeId).toBe(resource.id);
            expect(video._cameraConsumers.size).toBe(2);
            include('easybloxQr');
            include('easybloxQr');
            await flush();
            expect(qr._cameraLease).toBeNull();
            expect(qr._readerSource).toBeNull();
            qr.startReader({SOURCE: 'cameraMirrored'});
            await flush();
            expect(video._cameraConsumers.size).toBe(3);
            const before = JSON.parse(vm.toJSON());
            ids.forEach(remove);
            const stoppedReads = reads;
            await delay(200);
            expect(reads).toBe(stoppedReads);
            expect(video._cameraConsumers.size).toBe(0);
            const after = JSON.parse(vm.toJSON());
            expect(after.targets).toEqual(before.targets);
            expect(after.monitors).toEqual(before.monitors);
            expect(after.easybloxProject).toEqual(before.easybloxProject);
            expect(qr._visibleQrCodeId).toBe(resource.id);
            expect(vm.getProjectExtensionIds().sort()).toEqual([...ids].sort());
            const saved = await JSZip.loadAsync(fixture);
            saved.file('project.json', JSON.stringify(after));
            await vm.loadProject(await saved.generateAsync({type: 'nodebuffer'}));
            await flush();
            expect(video._cameraConsumers.size).toBe(2);
            expect(video.isCameraLeaseActive(face._cameraLease)).toBe(true);
            expect(video.isCameraLeaseActive(sensing._cameraLease)).toBe(true);
            expect(qr._readerSource).toBeNull();
            expect(vm.getEasyBloxQrCodes()).toEqual([resource]);
            await vm.loadProject(fixture);
            await flush();
            const acquisition = deferred();
            captures.push(acquisition.promise);
            ids.forEach(include);
            qr.startReader({SOURCE: 'cameraNormal'});
            const pending = [qr._cameraLease, sensing._cameraLease, face._cameraLease];
            ids.forEach(remove);
            expect(await Promise.all(pending.map(({ready}) => ready))).toEqual([null, null, null]);
            acquisition.resolve();
            await flush();
            await vm.extensionManager.refreshBlocks();
            await flush();
            expect(video._cameraConsumers.size).toBe(0);
            expect(qr._readerTimeout).toBeNull();
            expect(face._loopTimeout).toBeNull();
            expect(sensing._cameraReady).toBe(false);
            expect(vm.getProjectExtensionIds()).toEqual([]);
            expect(errors).toEqual([]);
        } finally {
            process.removeListener('unhandledRejection', onRejection);
            if (qr) qr.stopReader();
            if (sensing) sensing._stopLoop();
            if (face) face.deactivate();
            vm.runtime.dispose();
            vm.quit();
            Object.assign(performance, previousTiming);
        }
    });
});

describe('Monitor-only project extension restoration with the real VM', () => {
    test.each([
        {ids: ['videoSensing']},
        {ids: ['faceSensing']},
        {ids: ['videoSensing', 'faceSensing']}
    ])('restores toolbox and removable library entries for $ids', async ({ids}) => {
        const VirtualMachine = require('../../../../scratch-vm/src/virtual-machine');
        const dispatch = require('../../../../scratch-vm/src/dispatch/central-dispatch');
        const fs = require('fs');
        const path = require('path');
        const JSZip = require('jszip');
        const flush = require('timers/promises').setImmediate;
        const nodePerformance = require('perf_hooks').performance;
        const previousTiming = {mark: performance.mark, measure: performance.measure};
        Object.assign(performance, {
            mark: nodePerformance.mark.bind(nodePerformance),
            measure: nodePerformance.measure.bind(nodePerformance)
        });
        const fixture = fs.readFileSync(path.resolve(__dirname, '../../../../scratch-vm/test/fixtures/default.sb3'));
        const vm = new VirtualMachine();
        const video = vm.runtime.ioDevices.video;
        let starts = 0;
        vm.setVideoProvider({
            enableVideo () {
                starts++;
                return Promise.resolve();
            },
            disableVideo () {},
            getFrame: () => null
        });
        const blocks = {
            state: {activeExtensionIds: []},
            props: {
                vm,
                onSetActiveExtensions: jest.fn(),
                onDeactivateExtension: jest.fn()
            },
            setState (update) {
                this.state = {...this.state, ...(typeof update === 'function' ? update(this.state) : update)};
            }
        };
        const library = new ExtensionLibrary({
            vm,
            activeExtensionIds: [],
            intl: {formatMessage: jest.fn().mockReturnValue('Extensions')},
            onExtensionRemove (id) {
                Blocks.prototype.handleExtensionRemove.call(blocks, id);
                library.props = {...library.props, activeExtensionIds: blocks.state.activeExtensionIds};
            }
        });
        const sync = () => {
            Blocks.prototype.handleProjectLoaded.call(blocks);
            library.props = {...library.props, activeExtensionIds: blocks.state.activeExtensionIds};
        };
        vm.on('PROJECT_LOADED', sync);
        const service = function (id) {
            return dispatch.services[vm.extensionManager._loadedExtensions.get(id)];
        };
        try {
            const zip = await JSZip.loadAsync(fixture);
            const project = JSON.parse(await zip.file('project.json').async('string'));
            project.monitors = ids.map((id, index) => ({
                id: `monitor-${id}`,
                opcode: id === 'videoSensing' ? 'videoSensing_videoOn' : 'faceSensing_faceSize',
                params: id === 'videoSensing' ? {ATTRIBUTE: 'motion', SUBJECT: 'Stage'} : {},
                mode: 'default',
                spriteName: null,
                value: 0,
                x: 0,
                y: index * 50,
                visible: true
            }));
            zip.file('project.json', JSON.stringify(project));
            await vm.loadProject(await zip.generateAsync({type: 'nodebuffer'}));
            await flush();
            expect(vm.getProjectExtensionIds().sort()).toEqual([...ids].sort());
            expect(blocks.state.activeExtensionIds.sort()).toEqual([...ids].sort());
            expect(blocks.props.onSetActiveExtensions).toHaveBeenCalledWith(expect.arrayContaining(ids));
            expect(library.props.activeExtensionIds.sort()).toEqual([...ids].sort());
            const acquisitions = starts;
            vm.getProjectExtensionIds();
            await vm.extensionManager.refreshBlocks();
            await flush();
            expect(starts).toBe(acquisitions);
            for (const id of ids) {
                expect(library.isItemRemovable({extensionId: id})).toBe(true);
                library.render().props.onItemRemove({extensionId: id});
                expect(blocks.state.activeExtensionIds).not.toContain(id);
                expect(video.isCameraLeaseActive(service(id)._cameraLease)).toBe(false);
                expect(blocks.props.onDeactivateExtension).toHaveBeenCalledWith(id);
                expect(library.isItemRemovable({extensionId: id})).toBe(false);
                if (id === 'faceSensing') expect(service(id)._cameraLease).toBeNull();
            }
            await vm.loadProject(fixture);
            await flush();
            expect(vm.getProjectExtensionIds()).toEqual([]);
            expect(blocks.state.activeExtensionIds).toEqual([]);
            expect(library.props.activeExtensionIds).toEqual([]);
            expect(video._cameraConsumers.size).toBe(0);
        } finally {
            vm.removeListener('PROJECT_LOADED', sync);
            const sensing = service('videoSensing');
            const face = service('faceSensing');
            if (sensing) sensing._stopLoop();
            if (face) face.deactivate();
            vm.runtime.dispose();
            vm.quit();
            Object.assign(performance, previousTiming);
        }
    });
});

describe('ExtensionLibrary Facial activation with the real VM', () => {
    test('inclusion, removal, empty-project reinclusion and sb3 restoration preserve shared owners', async () => {
        const VirtualMachine = require('../../../../scratch-vm/src/virtual-machine');
        const dispatch = require('../../../../scratch-vm/src/dispatch/central-dispatch');
        const FaceDetection = require('@tensorflow-models/face-detection');
        const fs = require('fs');
        const path = require('path');
        const JSZip = require('jszip');
        const flush = require('timers/promises').setImmediate;
        const nodePerformance = require('perf_hooks').performance;
        const previousTiming = {mark: performance.mark, measure: performance.measure};
        Object.assign(performance, {
            mark: nodePerformance.mark.bind(nodePerformance),
            measure: nodePerformance.measure.bind(nodePerformance)
        });
        FaceDetection.createDetector.mockClear();
        const fixture = fs.readFileSync(path.resolve(__dirname, '../../../../scratch-vm/test/fixtures/default.sb3'));
        const vm = new VirtualMachine();
        const video = vm.runtime.ioDevices.video;
        let starts = 0;
        let stops = 0;
        video.setProvider({
            enableVideo () {
                starts++;
                return Promise.resolve();
            },
            disableVideo () {
                stops++;
            },
            getFrame: () => null
        });
        const library = new ExtensionLibrary({
            vm,
            activeExtensionIds: ['videoSensing', 'easybloxQr', 'faceSensing'],
            intl: {formatMessage: jest.fn().mockReturnValue('Extensions')},
            onExtensionActivate: jest.fn(),
            onExtensionRemove: jest.fn(),
            onCategorySelected: jest.fn(),
            onRequestClose: jest.fn()
        });
        const service = function (id) {
            return dispatch.services[vm.extensionManager._loadedExtensions.get(id)];
        };
        let sensing;
        let qr;
        let face;
        try {
            await vm.loadProject(fixture);
            library.handleItemSelect({extensionId: 'videoSensing'});
            library.handleItemSelect({extensionId: 'easybloxQr'});
            await flush();
            sensing = service('videoSensing');
            qr = service('easybloxQr');
            sensing.videoToggle({VIDEO_STATE: 'on-flipped'});
            qr.startReader({SOURCE: 'cameraNormal'});
            library.handleItemSelect({extensionId: 'faceSensing'});
            await flush();
            face = service('faceSensing');
            const initial = face._cameraLease;
            const detector = face._faceDetector;
            const qrLease = qr._cameraLease;
            const videoLease = sensing._cameraLease;
            const sharedStops = stops;
            expect(video.isCameraLeaseActive(initial)).toBe(true);
            expect(video._cameraConsumers.size).toBe(3);
            expect(starts).toBe(1);
            library.handleItemSelect({extensionId: 'faceSensing'});
            library.handleItemSelect({extensionId: 'faceSensing'});
            await vm.extensionManager.refreshBlocks();
            await flush();
            expect(face._cameraLease).toBe(initial);
            expect(FaceDetection.createDetector).toHaveBeenCalledTimes(1);
            expect(video.mirror).toBe(false);

            library.render().props.onItemRemove({extensionId: 'faceSensing'});
            expect(library.props.onExtensionRemove).toHaveBeenCalledWith('faceSensing');
            expect(face._cameraLease).toBeNull();
            expect(detector.dispose).toHaveBeenCalledTimes(1);
            expect(video.isCameraLeaseActive(qrLease)).toBe(true);
            expect(video.isCameraLeaseActive(videoLease)).toBe(true);
            expect(stops).toBe(sharedStops);
            face.getInfo();
            await vm.extensionManager.refreshBlocks();
            await flush();
            expect(face._cameraLease).toBeNull();
            library.handleItemSelect({extensionId: 'faceSensing'});
            await flush();
            expect(video.isCameraLeaseActive(face._cameraLease)).toBe(true);
            expect(face._cameraLease).not.toBe(initial);
            expect(FaceDetection.createDetector).toHaveBeenCalledTimes(2);
            qr.stopReader();
            sensing.videoToggle({VIDEO_STATE: 'off'});
            expect(video.isCameraLeaseActive(face._cameraLease)).toBe(true);
            expect(stops).toBe(sharedStops);

            await vm.loadProject(fixture);
            await vm.extensionManager.refreshBlocks();
            await flush();
            expect(face._session).toBeNull();
            expect(face._loopTimeout).toBeNull();
            expect(video._cameraConsumers.size).toBe(0);
            expect(starts).toBe(1);
            library.handleItemSelect({extensionId: 'faceSensing'});
            await flush();
            expect(starts).toBe(2);
            expect(video.isCameraLeaseActive(face._cameraLease)).toBe(true);
            const beforeReload = face._cameraLease;
            vm.editingTarget.blocks.createBlock({
                id: 'face-command',
                opcode: 'faceSensing_goToPart',
                next: null,
                parent: null,
                inputs: {PART: {name: 'PART', block: 'face-part', shadow: 'face-part'}},
                fields: {},
                topLevel: true,
                shadow: false,
                x: 0,
                y: 0
            });
            vm.editingTarget.blocks.createBlock({
                id: 'face-part',
                opcode: 'faceSensing_menu_PART',
                next: null,
                parent: 'face-command',
                inputs: {},
                fields: {PART: {name: 'PART', value: '3'}},
                topLevel: false,
                shadow: true
            });
            const zip = await JSZip.loadAsync(fixture);
            zip.file('project.json', vm.toJSON());
            await vm.loadProject(await zip.generateAsync({type: 'nodebuffer'}));
            await flush();
            expect(face._cameraLease).not.toBe(beforeReload);
            expect(video.isCameraLeaseActive(face._cameraLease)).toBe(true);
            expect(vm.editingTarget.blocks.getBlock('face-command').opcode).toBe('faceSensing_goToPart');
            expect(vm.editingTarget.blocks.getBlock('face-part').fields.PART.value).toBe('3');
            expect(video._cameraConsumers.size).toBe(1);
            expect(sensing._cameraReady).toBe(false);
            expect(qr._readerSource).toBeNull();
        } finally {
            if (face) face.deactivate();
            if (qr) qr.stopReader();
            if (sensing) sensing._stopLoop();
            vm.runtime.dispose();
            vm.quit();
            Object.assign(performance, previousTiming);
        }
    });
});

describe('ExtensionLibrary Video activation with the real VM', () => {
    test('explicit inclusion works again after an empty project, without metadata activation', async () => {
        const VirtualMachine = require('../../../../scratch-vm/src/virtual-machine');
        const dispatch = require('../../../../scratch-vm/src/dispatch/central-dispatch');
        const fs = require('fs');
        const path = require('path');
        const nodePerformance = require('perf_hooks').performance;
        const previousTiming = {mark: performance.mark, measure: performance.measure};
        Object.assign(performance, {
            mark: nodePerformance.mark.bind(nodePerformance),
            measure: nodePerformance.measure.bind(nodePerformance)
        });
        const fixture = fs.readFileSync(path.resolve(__dirname, '../../../../scratch-vm/test/fixtures/default.sb3'));
        const vm = new VirtualMachine();
        let active = false;
        let starts = 0;
        vm.setVideoProvider({
            enableVideo () {
                starts++;
                active = true;
                return Promise.resolve();
            },
            disableVideo () {
                active = false;
            },
            getFrame: () => null
        });
        const library = new ExtensionLibrary({
            vm,
            onExtensionActivate: jest.fn(),
            onExtensionRemove: jest.fn(),
            onCategorySelected: jest.fn()
        });
        const flush = require('timers/promises').setImmediate;
        let sensing;
        try {
            await vm.loadProject(fixture);
            library.handleItemSelect({extensionId: 'videoSensing'});
            await flush();
            sensing = dispatch.services[vm.extensionManager._loadedExtensions.get('videoSensing')];
            expect(active).toBe(true);
            expect(starts).toBe(1);
            sensing.videoToggle({VIDEO_STATE: 'on-flipped'});
            sensing.setVideoTransparency({TRANSPARENCY: 70});
            const initial = sensing._cameraLease;
            library.handleItemSelect({extensionId: 'videoSensing'});
            await flush();
            expect(sensing._cameraLease).toBe(initial);
            expect(starts).toBe(1);
            expect(vm.runtime.ioDevices.video.mirror).toBe(false);
            expect(vm.runtime.getTargetForStage().videoTransparency).toBe(70);

            await vm.loadProject(fixture);
            await flush();
            expect(active).toBe(false);
            sensing.getInfo();
            await vm.extensionManager.refreshBlocks();
            await flush();
            expect(active).toBe(false);
            library.handleItemSelect({extensionId: 'videoSensing'});
            await flush();
            expect(active).toBe(true);
            expect(starts).toBe(2);
            expect(vm.runtime.ioDevices.video.isCameraLeaseActive(sensing._cameraLease)).toBe(true);

            sensing.videoToggle({VIDEO_STATE: 'off'});
            library.handleItemRemove({extensionId: 'videoSensing'});
            library.handleItemSelect({extensionId: 'videoSensing'});
            await flush();
            expect(active).toBe(true);
            expect(starts).toBe(3);
            expect(vm.runtime.ioDevices.video._cameraConsumers.size).toBe(1);
            expect(library.props.onExtensionRemove).toHaveBeenCalledWith('videoSensing');
        } finally {
            if (sensing) sensing._stopLoop();
            vm.runtime.dispose();
            vm.quit();
            Object.assign(performance, previousTiming);
        }
    });
});

describe('ExtensionLibrary active extensions', () => {
    const createProps = overrides => ({
        activeExtensionIds: [],
        intl: {
            formatMessage: jest.fn(message =>
                message.defaultMessage || message.id
            )
        },
        onCategorySelected: jest.fn(),
        onExtensionRemove: jest.fn(),
        onRequestClose: jest.fn(),
        vm: {
            extensionManager: {
                isExtensionLoaded: jest.fn(),
                loadExtensionURL: jest.fn()
            }
        },
        ...overrides
    });

    const checkBluetooth = function (activeBoardId) {
        const instance = new ExtensionLibrary(createProps({activeBoardId}));
        const isBluetooth = function (item) {
            return item.extensionId === 'easybloxBt';
        };
        const bluetooth = instance.render().props.data.find(isBluetooth);
        expect(bluetooth.disabled).toBe(false);
    };
    test.each(['arduino-uno', 'easymaker', 'easyduino-proto'])(
        'allows the compatible Bluetooth extension for %s', checkBluetooth
    );

    test('marks only active extensions as removable', () => {
        const instance = new ExtensionLibrary(createProps({
            activeExtensionIds: ['translate']
        }));

        const libraryElement = instance.render();

        expect(
            libraryElement.props.isItemRemovable({
                extensionId: 'translate'
            })
        ).toBe(true);

        expect(
            libraryElement.props.isItemRemovable({
                extensionId: 'music'
            })
        ).toBe(false);
    });

    test('removes an active extension by its extension id', () => {
        const onExtensionRemove = jest.fn();

        const instance = new ExtensionLibrary(createProps({
            activeExtensionIds: ['translate'],
            onExtensionRemove
        }));

        instance.handleItemRemove({
            extensionId: 'translate'
        });

        expect(onExtensionRemove).toHaveBeenCalledTimes(1);
        expect(onExtensionRemove).toHaveBeenCalledWith('translate');
    });

    test('activates an extension when it is selected', () => {
        const onCategorySelected = jest.fn();
        const onExtensionActivate = jest.fn();

        const props = createProps({
            onCategorySelected,
            onExtensionActivate
        });

        props.vm.extensionManager.isExtensionLoaded
            .mockReturnValue(true);

        const instance = new ExtensionLibrary(props);

        instance.handleItemSelect({
            extensionId: 'translate'
        });

        expect(onExtensionActivate).toHaveBeenCalledTimes(1);
        expect(onExtensionActivate).toHaveBeenCalledWith('translate');

        expect(onCategorySelected).toHaveBeenCalledTimes(1);
        expect(onCategorySelected).toHaveBeenCalledWith('translate');
    });

    test('disables board-capability extensions when no board is selected', () => {
        const instance =
            new ExtensionLibrary(
                createProps({})
            );

        const libraryElement =
            instance.render();

        const easybloxBt =
            libraryElement.props.data.find(
                item =>
                    item.extensionId ===
                    'easybloxBt'
            );

        const easybloxQr =
            libraryElement.props.data.find(
                item =>
                    item.extensionId ===
                    'easybloxQr'
            );

        expect(easybloxBt.disabled).toBe(true);
        expect(easybloxBt.disabledMessage).toBe(
            'Selecione uma placa para usar esta extensão'
        );

        expect(easybloxQr.disabled).toBe(false);
        expect(easybloxQr.disabledMessage).toBeNull();
    });

    test.each([
        'arduino-uno',
        'easymaker',
        'easymaker-connection',
        'easyduino-proto'
    ])(
        'enables EasyBlox BT for Bluetooth-capable board %s',
        activeBoardId => {
            const instance =
                new ExtensionLibrary(
                    createProps({
                        activeBoardId
                    })
                );

            const libraryElement =
                instance.render();

            const easybloxBt =
                libraryElement.props.data.find(
                    item =>
                        item.extensionId ===
                        'easybloxBt'
                );

            expect(easybloxBt.disabled).toBe(false);
            expect(easybloxBt.disabledMessage).toBeNull();
        }
    );

    test('disables EasyBlox BT for EasyDuino Jr', () => {
        const instance =
            new ExtensionLibrary(
                createProps({
                    activeBoardId:
                        'easyduino-jr'
                })
            );

        const libraryElement =
            instance.render();

        const easybloxBt =
            libraryElement.props.data.find(
                item =>
                    item.extensionId ===
                    'easybloxBt'
            );

        expect(easybloxBt.disabled).toBe(true);
        expect(easybloxBt.disabledMessage).toBe(
            'Esta extensão não é compatível com a placa selecionada'
        );
    });
});
