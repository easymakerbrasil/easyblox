const {test} = require('tap');
const Runtime = require('../../src/engine/runtime');
const Qr = require('../../src/extensions/scratch3_easyblox_qr');
const VideoSensing = require('../../src/extensions/scratch3_video_sensing');

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((a, b) => {
        resolve = a;
        reject = b;
    });
    return {promise, resolve, reject};
};
const flush = () => new Promise(resolve => setImmediate(resolve));

const setup = (t, responses = []) => {
    const runtime = new Runtime();
    const provider = {
        starts: 0,
        stops: 0,
        active: false,
        enableVideo () {
            this.starts++;
            this.active = true;
            return responses.length ? responses.shift() : Promise.resolve();
        },
        disableVideo () {
            this.stops++;
            this.active = false;
        },
        getFrame () {
            return null;
        }
    };
    const video = runtime.ioDevices.video;
    video.setProvider(provider);
    const qr = new Qr(runtime);
    const sensing = new VideoSensing(runtime);
    t.teardown(() => {
        qr.stopReader();
        sensing._stopLoop();
        runtime.dispose();
    });
    return {runtime, video, qr, sensing, provider};
};

for (const consumer of ['qr', 'videoSensing']) {
    test(`explicit ${consumer} removal releases only its lease and stops scheduled reads`, async t => {
        const {runtime, video, qr, sensing, provider} = setup(t);
        let reads = 0;
        provider.getFrame = () => {
            reads++;
            return null;
        };
        const other = video.acquireCamera('other');
        if (consumer === 'qr') qr.startReader({SOURCE: 'cameraMirrored'});
        else sensing.videoToggle({VIDEO_STATE: 'on-flipped'});
        await flush();
        await new Promise(resolve => setTimeout(resolve, 150));
        t.ok(reads > 0);
        const lease = consumer === 'qr' ? qr._cameraLease : sensing._cameraLease;
        runtime.emit(consumer === 'qr' ? 'EASYBLOX_QR_DEACTIVATE' : 'EASYBLOX_VIDEO_SENSING_DEACTIVATE');
        runtime.emit(consumer === 'qr' ? 'EASYBLOX_QR_DEACTIVATE' : 'EASYBLOX_VIDEO_SENSING_DEACTIVATE');
        const stoppedReads = reads;
        await new Promise(resolve => setTimeout(resolve, 180));
        t.equal(reads, stoppedReads, 'queued loops cannot request more frames after removal');
        t.equal(video.isCameraLeaseActive(lease), false);
        t.equal(video.isCameraLeaseActive(other), true);
        t.equal(provider.stops, 0);
        if (consumer === 'qr') {
            t.equal(qr._readerTimeout, null);
            t.equal(qr._readerSource, null);
            qr.startReader({SOURCE: 'cameraNormal'});
        } else {
            t.equal(sensing._cameraReady, false);
            runtime.emit('EASYBLOX_VIDEO_SENSING_ACTIVATE');
            runtime.emit('EASYBLOX_VIDEO_SENSING_ACTIVATE');
        }
        await flush();
        t.equal(video._cameraConsumers.size, 2);
        t.equal(provider.starts, 1);
    });
}

for (const reject of [false, true]) {
    test(`removal during shared acquisition ignores late ${reject ? 'rejection' : 'completion'}`, async t => {
        const errors = [];
        const onRejection = error => errors.push(error);
        process.on('unhandledRejection', onRejection);
        t.teardown(() => process.removeListener('unhandledRejection', onRejection));
        const capture = deferred();
        const {runtime, video, qr, sensing, provider} = setup(t, [capture.promise]);
        qr.startReader({SOURCE: 'cameraNormal'});
        sensing.videoToggle({VIDEO_STATE: 'on'});
        const oldQr = qr._cameraLease;
        const oldVideo = sensing._cameraLease;
        runtime.emit('EASYBLOX_QR_DEACTIVATE');
        runtime.emit('EASYBLOX_VIDEO_SENSING_DEACTIVATE');
        t.equal(await oldQr.ready, null);
        t.equal(await oldVideo.ready, null);
        qr.startReader({SOURCE: 'cameraMirrored'});
        runtime.emit('EASYBLOX_VIDEO_SENSING_ACTIVATE');
        await flush();
        const currentQr = qr._cameraLease;
        const currentVideo = sensing._cameraLease;
        if (reject) capture.reject(new Error('obsolete acquisition'));
        else capture.resolve();
        await flush();
        t.equal(qr._cameraLease, currentQr);
        t.equal(sensing._cameraLease, currentVideo);
        t.equal(video.isCameraLeaseActive(currentQr), true);
        t.equal(video.isCameraLeaseActive(currentVideo), true);
        t.equal(provider.starts, 2);
        t.equal(provider.stops, 1);
        t.same(errors, []);
    });
}

test('removing a Stage QR reader cancels its scheduled reads without altering saved resources', async t => {
    const {runtime, qr, provider} = setup(t);
    runtime.restoreEasyBloxQrCodes([{id: 'qr_saved', name: 'Saved', content: 'KEPT'}]);
    const resources = runtime.getEasyBloxQrCodes();
    qr.startReader({SOURCE: 'stage'});
    t.not(qr._readerTimeout, null);
    runtime.emit('EASYBLOX_QR_DEACTIVATE');
    t.equal(qr._readerTimeout, null);
    t.equal(qr._readerSource, null);
    t.equal(provider.starts, 0);
    t.same(runtime.getEasyBloxQrCodes(), resources);
});

for (const consumers of [['qr'], ['videoSensing'], ['qr', 'videoSensing']]) {
    test(`${consumers.join('+')} cannot read another capture after provider replacement`, async t => {
        const {video, qr, sensing} = setup(t);
        const start = () => {
            if (consumers.includes('qr')) qr.startReader({SOURCE: 'cameraNormal'});
            if (consumers.includes('videoSensing')) sensing.videoToggle({VIDEO_STATE: 'on'});
        };
        start();
        await flush();
        let reads = 0;
        let stops = 0;
        video.setProvider({
            enableVideo: () => Promise.resolve(),
            disableVideo () {
                stops++;
            },
            getFrame () {
                reads++;
                return null;
            }
        });
        await video.enableVideo();
        // Run the real scheduled loops, including QR's 100 ms interval.
        await new Promise(resolve => setTimeout(resolve, 220));
        t.equal(reads, 0, 'invalid owners do not request frames');
        if (consumers.includes('qr')) t.equal(qr._readerTimeout, null, 'obsolete QR loop stops');
        if (consumers.includes('videoSensing')) t.equal(sensing._cameraReady, false);
        t.equal(stops, 0, 'invalid consumers cannot stop the legacy owner');
        start();
        await flush();
        await new Promise(resolve => setTimeout(resolve, 120));
        t.ok(reads > 0, 'a legitimate new acquisition resumes reading');
        qr.stopReader();
        sensing.videoToggle({VIDEO_STATE: 'off'});
        t.equal(stops, 0, 'legacy capture remains owned');
    });
}

test('fulfilled continuations cannot reactivate invalid leases after reset', async t => {
    const {video, qr, sensing} = setup(t);
    const owner = video.acquireCamera('other');
    await owner.ready;
    qr.startReader({SOURCE: 'cameraNormal'});
    sensing.videoToggle({VIDEO_STATE: 'on'});
    video.reset();
    await flush();
    t.equal(qr._readerTimeout, null);
    t.equal(qr._cameraLease, null);
    t.equal(sensing._cameraReady, false);
    t.equal(sensing._cameraLease, null);
    qr.startReader({SOURCE: 'cameraNormal'});
    sensing.videoToggle({VIDEO_STATE: 'on'});
    await flush();
    t.not(qr._readerTimeout, null);
    t.equal(sensing._cameraReady, true);
});

test('QR waits for its shared lease even when startReader is repeated', async t => {
    const capture = deferred();
    const {qr, provider} = setup(t, [capture.promise]);
    qr.startReader({SOURCE: 'cameraNormal'});
    qr.startReader({SOURCE: 'cameraMirrored'});
    t.equal(provider.starts, 1);
    t.equal(qr._readerTimeout, null, 'no decoding before readiness');
    capture.resolve();
    await flush();
    t.not(qr._readerTimeout, null);
    qr.stopReader();
    qr.stopReader();
    t.equal(provider.stops, 1);
});

test('QR Stage mode never acquires capture or overwrites Video orientation', async t => {
    const {qr, video, provider} = setup(t);
    video.mirror = true;
    qr.startReader({SOURCE: 'stage'});
    t.equal(provider.starts, 0);
    qr.startReader({SOURCE: 'cameraNormal'});
    await flush();
    t.equal(video.mirror, true);
    video.mirror = false;
    qr.startReader({SOURCE: 'cameraMirrored'});
    await flush();
    t.equal(video.mirror, false);
    qr.startReader({SOURCE: 'stage'});
    t.equal(provider.stops, 1);
    t.equal(video.mirror, false, 'no obsolete mirror snapshot restored');
});

test('switching pending QR capture to Stage cancels only its participation', async t => {
    const capture = deferred();
    const {qr, provider} = setup(t, [capture.promise]);
    qr.startReader({SOURCE: 'cameraNormal'});
    qr.startReader({SOURCE: 'stage'});
    const stageTimer = qr._readerTimeout;
    capture.resolve();
    await flush();
    t.equal(qr._readerSource, 'stage');
    t.equal(qr._readerTimeout, stageTimer, 'late camera completion cannot replace the Stage loop');
    t.equal(qr._cameraLease, null);
    t.equal(provider.stops, 1);
    t.equal(provider.active, false);
});

test('QR boundary follows the preview orientation without changing detection coordinates', async t => {
    const {runtime, video, qr, provider} = setup(t);
    qr.startReader({SOURCE: 'cameraNormal'});
    await flush();
    const originalImageData = global.ImageData;
    global.ImageData = class {};
    t.teardown(() => {
        if (originalImageData) global.ImageData = originalImageData;
        else delete global.ImageData;
    });
    const positions = [];
    const scales = [];
    runtime.renderer = {
        createBitmapSkin: () => 1,
        createDrawable: () => 2,
        updateDrawableSkinId () {},
        updateBitmapSkin () {},
        updateDrawableVisible () {},
        updateDrawablePosition (id, position) {
            positions.push(position);
        },
        updateDrawableScale (id, scale) {
            scales.push(scale);
        }
    };
    const location = {
        topLeft: {x: 80, y: 60},
        topRight: {x: 140, y: 60},
        bottomRight: {x: 140, y: 130},
        bottomLeft: {x: 80, y: 130}
    };
    video.mirror = false;
    qr._updateReaderDetection({content: 'ORIENTATION', location}, 480, 360);
    const normal = positions[0];
    video.mirror = true;
    qr._updateReaderBoundary();
    t.same(positions[1], [-normal[0], normal[1]]);
    t.same(scales[1], [-100, 100]);
    delete video.mirror;
    provider.mirror = true;
    qr._updateReaderBoundary();
    t.same(positions[2], positions[1], 'provider default orientation is respected');
    video.mirror = true;
    qr._readerSource = 'cameraMirrored';
    qr._updateReaderBoundary();
    t.same(positions[3], normal);
    t.same(scales[3], [100, 100]);
    qr._readerSource = 'stage';
    qr._updateReaderBoundary();
    t.same(positions[4], normal, 'Stage coordinates are never mirrored with the camera');
    t.equal(qr._location, location);
    t.equal(qr.content(), 'ORIENTATION');
    t.equal(video.mirror, true);
});

for (const first of ['qr', 'videoSensing']) {
    test(`coexistence with ${first} starting first and both stop/restart orders`, async t => {
        const {qr, sensing, video, provider} = setup(t);
        const startQr = () => qr.startReader({SOURCE: 'cameraNormal'});
        const startVideo = () => sensing.videoToggle({VIDEO_STATE: 'on'});
        if (first === 'qr') {
            startQr(); startVideo();
        } else {
            startVideo(); startQr();
        }
        await flush();
        t.equal(provider.starts, 1);
        t.equal(video._cameraConsumers.size, 2);
        qr.stopReader();
        t.equal(provider.stops, 0, 'QR stop preserves Video');
        t.equal(provider.active, true);
        startQr();
        await flush();
        sensing.videoToggle({VIDEO_STATE: 'off'});
        t.equal(provider.stops, 0, 'Video off preserves QR');
        t.not(qr._readerTimeout, null);
        startVideo();
        sensing.videoToggle({VIDEO_STATE: 'on-flipped'});
        await flush();
        t.equal(video.mirror, false);
        t.equal(provider.starts, 1);
        t.equal(video._cameraConsumers.size, 2);
        qr.stopReader();
        sensing.videoToggle({VIDEO_STATE: 'off'});
        sensing.videoToggle({VIDEO_STATE: 'off'});
        t.equal(provider.stops, 1);
        t.equal(provider.active, false);
    });
}

test('shared acquisition failure is handled and both consumers can retry', async t => {
    const capture = deferred();
    const {qr, sensing, provider} = setup(t, [capture.promise]);
    const unhandled = [];
    const listener = error => unhandled.push(error);
    process.on('unhandledRejection', listener);
    t.teardown(() => process.removeListener('unhandledRejection', listener));
    qr.startReader({SOURCE: 'cameraNormal'});
    sensing.videoToggle({VIDEO_STATE: 'on'});
    capture.reject(new Error('permission denied'));
    await flush();
    t.equal(qr._readerTimeout, null);
    t.equal(qr._cameraLease, null);
    t.equal(sensing._cameraLease, null);
    t.equal(sensing._cameraReady, false);
    qr.startReader({SOURCE: 'cameraNormal'});
    sensing.videoToggle({VIDEO_STATE: 'on-flipped'});
    await flush();
    t.equal(provider.starts, 2);
    t.not(qr._readerTimeout, null);
    t.equal(sensing._cameraReady, true);
    t.same(unhandled, []);
});

test('cancelled consumers ignore late completion during a rapid restart', async t => {
    const capture = deferred();
    const {qr, sensing, provider} = setup(t, [capture.promise]);
    qr.startReader({SOURCE: 'cameraNormal'});
    sensing.videoToggle({VIDEO_STATE: 'on'});
    qr.stopReader();
    sensing.videoToggle({VIDEO_STATE: 'off'});
    await flush();
    t.equal(qr._readerTimeout, null);
    t.equal(sensing._cameraReady, false);
    qr.startReader({SOURCE: 'cameraMirrored'});
    sensing.videoToggle({VIDEO_STATE: 'on-flipped'});
    await flush();
    const currentTimer = qr._readerTimeout;
    capture.resolve();
    await flush();
    t.equal(qr._readerTimeout, currentTimer, 'late completion cannot restart decoding');
    t.equal(provider.starts, 2);
    t.equal(provider.stops, 1);
    t.equal(sensing._cameraReady, true);
});

test('metadata queries do not activate Video; actual registration activates once', async t => {
    const {runtime, sensing, provider} = setup(t);
    const stage = {videoState: 'off', videoTransparency: 70};
    runtime.getTargetForStage = () => stage;
    sensing.getInfo();
    sensing.getInfo();
    t.equal(provider.starts, 0);
    t.equal(stage.videoState, 'off');
    runtime.emit(Runtime.EXTENSION_ADDED, {id: 'videoSensing'});
    await flush();
    t.equal(provider.starts, 1);
    sensing.videoToggle({VIDEO_STATE: 'off'});
    sensing.getInfo();
    runtime.emit(Runtime.EXTENSION_ADDED, {id: 'videoSensing'});
    t.equal(provider.starts, 1, 'refresh cannot reactivate capture');
});

test('project disposal cancels pending acquisitions and their loops', async t => {
    const capture = deferred();
    const {runtime, qr, sensing, provider} = setup(t, [capture.promise]);
    qr.startReader({SOURCE: 'cameraNormal'});
    sensing.videoToggle({VIDEO_STATE: 'on'});
    runtime.dispose();
    capture.resolve();
    await flush();
    t.equal(qr._readerTimeout, null);
    t.equal(qr._cameraLease, null);
    t.equal(sensing._cameraLease, null);
    t.equal(sensing._cameraReady, false);
    t.equal(provider.active, false);
});

test('real extension registration and sb3 roundtrip preserve Video states and QR arguments', async t => {
    const VirtualMachine = require('../../src/virtual-machine');
    const dispatch = require('../../src/dispatch/central-dispatch');
    const JSZip = require('jszip');
    const fs = require('fs');
    const path = require('path');
    const fixture = fs.readFileSync(path.join(__dirname, '../fixtures/default.sb3'));
    const vm = new VirtualMachine();
    const video = vm.runtime.ioDevices.video;
    let starts = 0;
    let active = false;
    video.setProvider({
        enableVideo () {
            starts++;
            active = true;
            return Promise.resolve();
        },
        disableVideo () {
            active = false;
        },
        getFrame () {
            return null;
        }
    });
    let sensing;
    let qr;
    t.teardown(() => {
        if (qr) qr.stopReader();
        if (sensing) sensing._stopLoop();
        vm.runtime.dispose();
        vm.quit();
    });
    await vm.loadProject(fixture);
    await vm.extensionManager.loadExtensionURL('videoSensing');
    await vm.extensionManager.loadExtensionURL('easybloxQr');
    const service = id => dispatch.services[vm.extensionManager._loadedExtensions.get(id)];
    sensing = service('videoSensing');
    qr = service('easybloxQr');
    await flush();
    t.equal(starts, 1, 'real inclusion activates Video exactly once');
    t.equal(video._cameraConsumers.get('videoSensing').lease, sensing._cameraLease);
    const target = vm.editingTarget;
    target.blocks.createBlock({
        id: 'qr-reader',
        opcode: 'easybloxQr_startReader',
        next: null,
        parent: null,
        inputs: {SOURCE: {name: 'SOURCE', block: 'qr-source', shadow: 'qr-source'}},
        fields: {},
        topLevel: true,
        shadow: false,
        x: 0,
        y: 0
    });
    target.blocks.createBlock({
        id: 'qr-source',
        opcode: 'easybloxQr_menu_readerSources',
        next: null,
        parent: 'qr-reader',
        inputs: {},
        fields: {readerSources: {name: 'readerSources', value: 'cameraMirrored'}},
        topLevel: false,
        shadow: true
    });
    target.blocks.createBlock({
        id: 'video-motion',
        opcode: 'videoSensing_whenMotionGreaterThan',
        next: null,
        parent: null,
        inputs: {},
        fields: {},
        topLevel: true,
        shadow: false,
        x: 0,
        y: 100
    });
    const resource = vm.createEasyBloxQrCode('Classroom QR', 'EASYBLOX-ROUNDTRIP');
    for (const state of ['on-flipped', 'off', 'on']) {
        sensing.videoToggle({VIDEO_STATE: state});
        qr.startReader({SOURCE: 'cameraMirrored'});
        await flush();
        const oldLease = qr._cameraLease;
        const project = JSON.parse(vm.toJSON());
        const zip = await JSZip.loadAsync(fixture);
        zip.file('project.json', JSON.stringify(project));
        await vm.loadProject(await zip.generateAsync({type: 'nodebuffer'}));
        await flush();
        t.equal(qr._readerSource, null, 'QR does not autostart after project replacement');
        t.equal(qr._readerTimeout, null);
        t.equal(video.releaseCamera(oldLease), false);
        t.equal(vm.runtime.getTargetForStage().videoState, state);
        t.equal(sensing._cameraReady, state !== 'off');
        t.equal(active, state !== 'off');
        if (state !== 'off') t.equal(video.mirror, state === 'on');
        t.equal(vm.editingTarget.blocks.getBlock('qr-source').fields.readerSources.value, 'cameraMirrored');
        t.same(vm.getEasyBloxQrCodes(), [resource], 'QR resource survives the sb3 roundtrip');
    }
    const monitorProject = JSON.parse(vm.toJSON());
    monitorProject.targets.forEach(item => {
        delete item.blocks['video-motion'];
    });
    monitorProject.monitors = [{
        id: 'video-monitor',
        opcode: 'videoSensing_videoOn',
        params: {ATTRIBUTE: 'motion', SUBJECT: 'Stage'},
        mode: 'default',
        spriteName: null,
        value: 0,
        x: 0,
        y: 0,
        visible: true
    }];
    const monitorZip = await JSZip.loadAsync(fixture);
    monitorZip.file('project.json', JSON.stringify(monitorProject));
    await vm.loadProject(await monitorZip.generateAsync({type: 'nodebuffer'}));
    await flush();
    t.equal(vm.runtime.getMonitorState().size, 1);
    t.equal(sensing._cameraReady, true, 'a project-owned Video monitor restores its identified capture');
    t.equal(active, true);
});
