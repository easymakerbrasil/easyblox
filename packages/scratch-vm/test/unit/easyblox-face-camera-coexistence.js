const {test} = require('tap');
const Runtime = require('../../src/engine/runtime');
const Qr = require('../../src/extensions/scratch3_easyblox_qr');
const VideoSensing = require('../../src/extensions/scratch3_video_sensing');

const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return {promise, resolve, reject};
};

const createDetector = () => ({
    estimates: 0,
    disposals: 0,
    estimateFaces () {
        this.estimates++;
        return Promise.resolve([]);
    },
    dispose () {
        this.disposals++;
    }
});

const setup = (t, cameraResponses = [], modelResponses = []) => {
    const runtime = new Runtime();
    const models = [];
    const requests = [];
    const Face = t.mockRequire('../../src/extensions/scratch3_face_sensing', {
        '@tensorflow-models/face-detection': {
            SupportedModels: {MediaPipeFaceDetector: 'mediapipe'},
            createDetector (model, options) {
                requests.push(options);
                if (modelResponses.length) return modelResponses.shift()();
                const detector = createDetector();
                models.push(detector);
                return Promise.resolve(detector);
            }
        }
    });
    const provider = {
        starts: 0,
        stops: 0,
        reads: 0,
        active: false,
        frame: null,
        enableVideo () {
            this.starts++;
            this.active = true;
            return cameraResponses.length ? cameraResponses.shift() : Promise.resolve();
        },
        disableVideo () {
            this.stops++;
            this.active = false;
        },
        getFrame () {
            this.reads++;
            return this.frame;
        }
    };
    runtime.ioDevices.video.setProvider(provider);
    const face = new Face(runtime);
    const qr = new Qr(runtime);
    const sensing = new VideoSensing(runtime);
    t.teardown(() => {
        face.deactivate();
        qr.stopReader();
        sensing._stopLoop();
        runtime.dispose();
    });
    return {runtime, video: runtime.ioDevices.video, face, qr, sensing, provider, models, requests};
};

const watchRejections = t => {
    const errors = [];
    const listener = error => errors.push(error);
    process.on('unhandledRejection', listener);
    t.teardown(() => process.removeListener('unhandledRejection', listener));
    return errors;
};

test('Facial construction and metadata do not acquire capture or load a model', async t => {
    let models = 0;
    let captures = 0;
    const Face = t.mockRequire('../../src/extensions/scratch3_face_sensing', {
        '@tensorflow-models/face-detection': {
            SupportedModels: {MediaPipeFaceDetector: 'mediapipe'},
            createDetector () {
                models++;
                return new Promise(() => {});
            }
        }
    });
    const runtime = new Runtime();
    runtime.ioDevices.video.setProvider({
        enableVideo () {
            captures++;
            return Promise.resolve();
        },
        disableVideo () {},
        getFrame: () => null
    });
    t.teardown(() => runtime.dispose());
    const face = new Face(runtime);
    const first = face.getInfo();
    t.same(face.getInfo(), first);
    await flush();
    t.equal(captures, 0);
    t.equal(models, 0);
    t.same(first.blocks.filter(block => block.opcode).map(block => block.opcode), [
        'goToPart', 'pointInFaceTiltDirection', 'setSizeToFaceSize', 'whenTilted',
        'whenSpriteTouchesPart', 'whenFaceDetected', 'faceIsDetected', 'faceTilt', 'faceSize'
    ]);
    t.equal(first.blocks[0].arguments.PART.defaultValue, '2');
    t.equal(first.blocks[4].arguments.DIRECTION.defaultValue, 'left');
});

test('registration activates once; metadata and unrelated registrations do not activate', async t => {
    const {runtime, face, video, provider, requests} = setup(t);
    runtime.getTargetForStage = () => ({});
    runtime.emit(Runtime.EXTENSION_ADDED, {id: 'translate'});
    t.equal(provider.starts, 0);
    runtime.emit(Runtime.EXTENSION_ADDED, {id: 'faceSensing'});
    await flush();
    const lease = face._cameraLease;
    t.equal(video.isCameraLeaseActive(lease), true);
    t.equal(face.activate(), lease);
    runtime.emit('EASYBLOX_FACE_SENSING_ACTIVATE');
    t.equal(face._cameraLease, lease);
    t.equal(provider.starts, 1);
    t.equal(requests.length, 1);
    face.deactivate();
    face.getInfo();
    runtime.emit(Runtime.BLOCKSINFO_UPDATE, {id: 'faceSensing'});
    await flush();
    t.equal(provider.starts, 1);
    t.equal(video._cameraConsumers.size, 0);
});

for (const consumers of [[], ['qr'], ['videoSensing'], ['qr', 'videoSensing']]) {
    test(`Facial shares capture with ${consumers.join('+') || 'no other consumer'}`, async t => {
        const {face, qr, sensing, video, provider, models} = setup(t);
        face.activate();
        if (consumers.includes('qr')) qr.startReader({SOURCE: 'cameraNormal'});
        if (consumers.includes('videoSensing')) sensing.videoToggle({VIDEO_STATE: 'on'});
        await flush();
        t.equal(provider.starts, 1);
        t.equal(video._cameraConsumers.size, consumers.length + 1);
        face.deactivate();
        face.deactivate();
        t.equal(provider.active, consumers.length > 0);
        t.equal(models[0].disposals, 1);
        t.equal(video._cameraConsumers.size, consumers.length);
        qr.stopReader();
        sensing.videoToggle({VIDEO_STATE: 'off'});
        t.equal(provider.stops, 1);
    });
}

test('stopping QR and Video leaves Facial active with its original lease', async t => {
    const {face, qr, sensing, video, provider} = setup(t);
    const lease = face.activate();
    qr.startReader({SOURCE: 'cameraMirrored'});
    sensing.videoToggle({VIDEO_STATE: 'on-flipped'});
    await flush();
    qr.stopReader();
    t.equal(video.isCameraLeaseActive(lease), true);
    sensing.videoToggle({VIDEO_STATE: 'off'});
    t.equal(video.isCameraLeaseActive(lease), true);
    t.equal(provider.active, true);
    t.equal(provider.stops, 0);
    t.equal(video.mirror, false, 'Facial does not overwrite Video orientation');
});

test('camera and model readiness are independent; no provider acquires nothing', async t => {
    const camera = deferred();
    const model = deferred();
    const {face, video, provider, requests} = setup(t, [camera.promise], [() => model.promise]);
    const loading = [];
    face.runtime.on('EXTENSION_DATA_LOADING', state => loading.push(state));
    provider.frame = {};
    face.activate();
    await flush();
    const detector = createDetector();
    model.resolve(detector);
    await flush();
    face._loop(face._session);
    t.equal(provider.reads, 0, 'model readiness does not authorize pending capture');
    t.same(loading, [true]);
    camera.resolve();
    await flush();
    face._loop(face._session);
    await flush();
    t.equal(detector.estimates, 1);
    t.same(loading, [true, false]);
    face.deactivate();
    video.setProvider(null);
    t.equal(face.activate(), null);
    t.equal(requests.length, 1);
    t.equal(face._loopTimeout, null);
});

test('camera failure is handled and a new activation retries', async t => {
    const errors = watchRejections(t);
    const capture = deferred();
    const {face, video, provider, models} = setup(t, [capture.promise]);
    face.activate();
    await flush();
    capture.reject(new Error('permission denied'));
    await flush();
    t.equal(face._session, null);
    t.equal(face._loopTimeout, null);
    t.equal(models[0].disposals, 1);
    t.equal(provider.active, false);
    const current = face.activate();
    await flush();
    t.equal(video.isCameraLeaseActive(current), true);
    t.equal(provider.starts, 2);
    t.same(errors, []);
});

test('cancellation before readiness cannot start work or affect rapid reactivation', async t => {
    const capture = deferred();
    const {face, video, provider} = setup(t, [capture.promise]);
    const old = face.activate();
    face.deactivate();
    t.equal(await old.ready, null);
    const current = face.activate();
    await flush();
    const detector = face._faceDetector;
    capture.resolve();
    await flush();
    t.equal(face._cameraLease, current);
    t.equal(video.isCameraLeaseActive(current), true);
    t.equal(face._faceDetector, detector);
    t.equal(provider.stops, 1);
    t.equal(provider.starts, 2);
});

test('cancelling pending Facial preserves a pending QR acquisition and disposes its model', async t => {
    const capture = deferred();
    const {face, qr, video, provider, models} = setup(t, [capture.promise]);
    const old = face.activate();
    qr.startReader({SOURCE: 'cameraNormal'});
    await flush();
    const detector = models[0];
    face.deactivate();
    t.equal(await old.ready, null);
    t.equal(detector.disposals, 1);
    t.equal(provider.stops, 0);
    capture.resolve();
    await flush();
    t.not(qr._readerTimeout, null);
    t.equal(face._loopTimeout, null);
    t.equal(video.isCameraLeaseActive(qr._cameraLease), true);
    face.activate();
    await flush();
    t.equal(provider.starts, 1, 'new Facial participation shares the completed capture');
});

test('a late model is disposed without replacing the detector of a new session', async t => {
    const model = deferred();
    const {face, provider} = setup(t, [], [() => model.promise]);
    face.activate();
    await flush();
    provider.frame = {};
    face._loop(face._session);
    t.equal(provider.reads, 0, 'camera readiness does not imply model readiness');
    face.deactivate();
    const current = face.activate();
    await flush();
    const detector = face._faceDetector;
    const oldDetector = createDetector();
    model.resolve(oldDetector);
    await flush();
    t.equal(oldDetector.disposals, 1);
    t.equal(face._faceDetector, detector);
    t.equal(face._cameraLease, current);
    t.equal(provider.active, true);
});

for (const transition of ['reset', 'setProvider']) {
    test(`${transition} prevents Facial from reading the next legacy capture`, async t => {
        const {face, video, provider, models} = setup(t);
        face.activate();
        await flush();
        const session = face._session;
        if (transition === 'reset') video.reset();
        else video.setProvider({...provider, starts: 0, stops: 0, reads: 0});
        await video.enableVideo();
        const currentProvider = video.provider;
        const stops = currentProvider.stops;
        face._loop(session);
        t.equal(currentProvider.reads, 0);
        t.equal(currentProvider.stops, stops, 'invalid release does not affect the new owner');
        t.equal(face._loopTimeout, null);
        t.equal(face._session, null);
        t.equal(models[0].disposals, 1);
        const current = face.activate();
        await flush();
        t.equal(video.isCameraLeaseActive(current), true);
        t.equal(video._cameraConsumers.size, 2);
    });

    test(`${transition} invalidates fulfilled camera continuations before they run`, async t => {
        const {face, video, provider, requests} = setup(t);
        await video.enableVideo();
        const old = face.activate();
        if (transition === 'reset') video.reset();
        else video.setProvider({...provider});
        await flush();
        t.equal(await old.ready, old, 'fulfilled readiness is not continuing authorization');
        t.equal(face._session, null);
        t.equal(face._loopTimeout, null);
        t.equal(requests.length, 0);
    });
}

for (const rejects of [false, true]) {
    test(`late inference ${rejects ? 'rejection' : 'result'} cannot update a replacement context`, async t => {
        const errors = watchRejections(t);
        const result = deferred();
        const {runtime, face, provider, models} = setup(t);
        face.activate();
        await flush();
        const oldDetector = models[0];
        let estimates = 0;
        oldDetector.estimateFaces = () => {
            estimates++;
            return result.promise;
        };
        provider.frame = {};
        face._loop(face._session);
        face._loop(face._session);
        await flush();
        t.equal(estimates, 1, 'inference requests do not overlap');
        runtime.dispose();
        t.equal(oldDetector.disposals, 0, 'disposal waits for in-flight inference');
        const current = face.activate();
        await flush();
        const newFace = {box: {height: 55}};
        face._currentFace = newFace;
        provider.frame = null;
        if (rejects) result.reject(new Error('old inference failed'));
        else result.resolve([{box: {height: 999}}]);
        await flush();
        t.equal(face._currentFace, newFace);
        t.equal(face._cameraLease, current);
        t.equal(oldDetector.disposals, 1);
        t.equal(models[1].disposals, 0);
        t.same(errors, []);
    });
}

test('model failure, fallback and retry do not abandon rejections', async t => {
    const errors = watchRejections(t);
    const fail = () => Promise.reject(new Error('model unavailable'));
    const {face, provider, requests} = setup(t, [], [fail, fail]);
    face.activate();
    await flush();
    t.equal(requests.length, 2);
    t.match(requests[1].solutionPath, /^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/face_detection@/);
    t.equal(face._session, null);
    t.equal(face._loopTimeout, null);
    t.equal(provider.active, false);
    face.activate();
    await flush();
    t.ok(face._faceDetector);
    t.same(errors, []);
});

test('late model rejection cannot trigger fallback in an obsolete session', async t => {
    const errors = watchRejections(t);
    const model = deferred();
    const {face, requests} = setup(t, [], [() => model.promise]);
    face.activate();
    await flush();
    face.deactivate();
    model.reject(new Error('cancelled model request'));
    await flush();
    t.equal(requests.length, 1);
    t.equal(face._faceDetector, null);
    t.same(errors, []);
});

test('inference errors and cleanup errors are observed; sampling can retry', async t => {
    const errors = watchRejections(t);
    const {face, provider, models} = setup(t);
    face.activate();
    await flush();
    provider.frame = {};
    models[0].estimateFaces = () => Promise.reject(new Error('inference failed'));
    face._loop(face._session);
    await flush();
    t.equal(face.faceIsDetected(), false);
    models[0].estimateFaces = () => Promise.resolve([{box: {height: 80}}]);
    for (let i = 0; i < 5; i++) {
        face._loop(face._session);
        await flush();
    }
    t.equal(face.faceIsDetected(), true);
    t.equal(face.whenFaceDetected(), true);
    t.equal(face.faceSize(), 80);
    models[0].dispose = () => Promise.reject(new Error('cleanup failed'));
    face.deactivate();
    await flush();
    t.equal(provider.active, false);
    t.same(errors, []);
});
