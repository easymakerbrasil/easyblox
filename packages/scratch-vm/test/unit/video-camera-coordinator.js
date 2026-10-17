const {test} = require('tap');
const Video = require('../../src/io/video');
const Runtime = require('../../src/engine/runtime');
const log = require('../../src/util/log');

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return {promise, resolve, reject};
};

const createProvider = (responses = []) => ({
    enables: 0,
    disables: 0,
    enableVideo () {
        this.enables++;
        return responses.length ? responses.shift() : Promise.resolve();
    },
    disableVideo () {
        this.disables++;
    },
    getFrame (options) {
        return options;
    }
});

const createVideo = (t, provider = createProvider()) => {
    const video = new Video({});
    video.setProvider(provider);
    let previews = 0;
    video._setupPreview = () => {
        previews++;
    };
    t.teardown(() => video.reset());
    return {video, provider, previews: () => previews};
};

const flush = () => new Promise(resolve => setImmediate(resolve));

test('lease validity follows identity and generation without changing capture', async t => {
    const capture = deferred();
    const {video, provider} = createVideo(t, createProvider([capture.promise]));
    const first = video.acquireCamera('qr');
    t.equal(video.isCameraLeaseActive(null), false);
    t.equal(video.isCameraLeaseActive({...first}), false);
    t.equal(video.isCameraLeaseActive(first), true, 'pending ownership is valid');
    capture.resolve();
    await first.ready;
    t.equal(video.isCameraLeaseActive(first), true);
    t.equal(provider.enables, 1);
    t.equal(provider.disables, 0, 'queries do not shut down capture');
    video.releaseCamera(first);
    t.equal(video.isCameraLeaseActive(first), false);
    const second = video.acquireCamera('qr');
    await second.ready;
    t.equal(video.isCameraLeaseActive(first), false, 'same consumer does not revive old ownership');
    video.reset();
    t.equal(video.isCameraLeaseActive(second), false);
    const third = video.acquireCamera('qr');
    await third.ready;
    video.setProvider(createProvider());
    t.equal(video.isCameraLeaseActive(third), false);
    t.equal(await third.ready, third, 'fulfilled readiness keeps its original meaning');
    const current = video.acquireCamera('qr');
    await current.ready;
    t.equal(video.isCameraLeaseActive(current), true);
});

test('one consumer acquires and releases without a renderer or provider.enabled', async t => {
    const {video, provider, previews} = createVideo(t);
    const lease = video.acquireCamera('qr');
    t.equal(lease.consumerId, 'qr');
    t.ok(Object.isFrozen(lease), 'lease identity cannot be edited');
    t.equal(provider.enables, 1);
    t.equal(await lease.ready, lease, 'successful acquisition resolves to its lease');
    t.equal(previews(), 1);
    t.equal(video.releaseCamera(lease), true);
    t.equal(provider.disables, 1);
    t.equal(video.releaseCamera(lease), false, 'release is idempotent');
    t.equal(provider.disables, 1);
});

for (const consumers of [['qr', 'videoSensing'], ['qr', 'videoSensing', 'faceSensing']]) {
    test(`${consumers.length} consumers share one provider activation`, async t => {
        const {video, provider, previews} = createVideo(t);
        const leases = consumers.map(id => video.acquireCamera(id));
        t.same(await Promise.all(leases.map(lease => lease.ready)), leases);
        t.equal(provider.enables, 1);
        t.equal(previews(), 1);
        for (const lease of leases.slice(0, -1)) {
            t.equal(video.releaseCamera(lease), true);
            t.equal(provider.disables, 0, 'remaining consumers keep capture');
        }
        video.releaseCamera(leases[leases.length - 1]);
        t.equal(provider.disables, 1, 'last release stops capture');
    });
}

test('repeated activation returns the same pending and active lease', async t => {
    const capture = deferred();
    const {video, provider} = createVideo(t, createProvider([capture.promise]));
    const lease = video.acquireCamera('qr');
    t.equal(video.acquireCamera('qr'), lease);
    capture.resolve();
    await lease.ready;
    t.equal(video.acquireCamera('qr'), lease);
    t.equal(provider.enables, 1);
});

test('an old lease cannot release a newer activation of the same consumer', async t => {
    const {video, provider} = createVideo(t);
    const old = video.acquireCamera('qr');
    await old.ready;
    video.releaseCamera(old);
    const current = video.acquireCamera('qr');
    await current.ready;
    t.not(current.id, old.id);
    t.equal(video.releaseCamera(old), false);
    t.equal(video.releaseCamera({...current}), false, 'a copied lease is not its identity');
    t.equal(provider.disables, 1);
    t.equal(video.releaseCamera(current), true);
});

test('cancelling a pending acquisition settles before the provider resolves', async t => {
    const capture = deferred();
    const {video, provider, previews} = createVideo(t, createProvider([capture.promise]));
    const lease = video.acquireCamera('qr');
    video.releaseCamera(lease);
    t.equal(await lease.ready, null, 'cancellation is not success');
    t.equal(provider.disables, 1);
    capture.resolve({enabled: true});
    await flush();
    t.equal(previews(), 0, 'late resolution cannot install preview');
});

test('cancelling one pending consumer keeps the shared acquisition', async t => {
    const capture = deferred();
    const {video, provider} = createVideo(t, createProvider([capture.promise]));
    const qr = video.acquireCamera('qr');
    const face = video.acquireCamera('faceSensing');
    video.releaseCamera(qr);
    t.equal(await qr.ready, null);
    t.equal(provider.disables, 0);
    capture.resolve();
    t.equal(await face.ready, face);
});

test('rapid off/on ignores an old success even if provider.enabled is true', async t => {
    const oldCapture = deferred();
    const {video, provider, previews} = createVideo(t, createProvider([oldCapture.promise]));
    provider.enabled = true;
    const old = video.acquireCamera('qr');
    video.releaseCamera(old);
    const current = video.acquireCamera('qr');
    await current.ready;
    oldCapture.resolve(provider);
    await flush();
    t.equal(await old.ready, null);
    t.equal(previews(), 1);
    t.equal(provider.disables, 1);
    t.equal(video.releaseCamera(current), true);
});

test('shared failure rejects every owner and allows retry', async t => {
    const capture = deferred();
    const {video, provider} = createVideo(t, createProvider([capture.promise]));
    const qr = video.acquireCamera('qr');
    const face = video.acquireCamera('faceSensing');
    const rejected = Promise.all([
        t.rejects(qr.ready, /denied/),
        t.rejects(face.ready, /denied/)
    ]);
    capture.reject(new Error('denied'));
    await rejected;
    t.equal(video.releaseCamera(qr), false);
    const retry = video.acquireCamera('qr');
    t.equal(await retry.ready, retry);
    t.equal(provider.enables, 2);
});

test('an old failure cannot tear down a later activation', async t => {
    const oldCapture = deferred();
    const {video, provider, previews} = createVideo(t, createProvider([oldCapture.promise]));
    const old = video.acquireCamera('qr');
    video.releaseCamera(old);
    const current = video.acquireCamera('videoSensing');
    await current.ready;
    oldCapture.reject(new Error('old failure'));
    await flush();
    t.equal(await old.ready, null);
    t.equal(provider.disables, 1);
    t.equal(previews(), 1);
    t.equal(video.releaseCamera(current), true);
});

test('an old failure leaves a newer pending acquisition intact', async t => {
    const oldCapture = deferred();
    const newCapture = deferred();
    const {video, provider, previews} = createVideo(t,
        createProvider([oldCapture.promise, newCapture.promise]));
    const old = video.acquireCamera('qr');
    video.releaseCamera(old);
    const current = video.acquireCamera('qr');
    oldCapture.reject(new Error('old permission failure'));
    await flush();
    t.equal(provider.disables, 1);
    t.equal(previews(), 0);
    newCapture.resolve();
    t.equal(await current.ready, current);
    t.equal(previews(), 1);
});

test('provider cancellation is not a successful lease', async t => {
    const {video, provider, previews} = createVideo(t, createProvider([Promise.resolve(null)]));
    const lease = video.acquireCamera('qr');
    t.equal(await lease.ready, null);
    t.equal(video.releaseCamera(lease), false);
    t.equal(previews(), 0);
    t.equal(provider.disables, 1);
});

test('synchronous provider failures reject readiness and allow retry', async t => {
    const provider = createProvider();
    const enable = provider.enableVideo;
    provider.enableVideo = function () {
        this.enableVideo = enable;
        throw new Error('synchronous acquisition failure');
    };
    const {video} = createVideo(t, provider);
    const lease = video.acquireCamera('qr');
    await t.rejects(lease.ready, /synchronous acquisition failure/);
    const retry = video.acquireCamera('qr');
    t.equal(await retry.ready, retry);
});

test('project disposal cancels all leases and advances the generation', async t => {
    const runtime = new Runtime();
    const video = runtime.ioDevices.video;
    const capture = deferred();
    const provider = createProvider([capture.promise]);
    video.setProvider(provider);
    let previews = 0;
    video._setupPreview = () => {
        previews++;
    };
    t.teardown(() => runtime.dispose());
    const qr = video.acquireCamera('qr');
    const face = video.acquireCamera('faceSensing');
    runtime.dispose();
    t.equal(await qr.ready, null);
    t.equal(await face.ready, null);
    const current = video.acquireCamera('qr');
    t.ok(current.generation > qr.generation);
    await current.ready;
    capture.resolve(provider);
    await flush();
    t.equal(previews, 1);
    t.equal(video.releaseCamera(qr), false);
    t.equal(provider.disables, 1);
});

test('reset also invalidates leases from completed capture', async t => {
    const {video, provider} = createVideo(t);
    const lease = video.acquireCamera('qr');
    await lease.ready;
    video.reset();
    t.equal(video.releaseCamera(lease), false);
    t.equal(provider.disables, 1);
});

for (const pending of [false, true]) {
    test(`loadProject resets ${pending ? 'pending' : 'active'} identified capture`, async t => {
        const VirtualMachine = require('../../src/virtual-machine');
        const fs = require('fs');
        const path = require('path');
        const fixture = fs.readFileSync(path.join(__dirname, '../fixtures/default.sb3'));
        const vm = new VirtualMachine();
        const video = vm.runtime.ioDevices.video;
        const capture = deferred();
        video.setProvider(createProvider(pending ? [capture.promise] : []));
        let previews = 0;
        video._setupPreview = () => {
            previews++;
        };
        t.teardown(() => {
            vm.runtime.dispose();
            vm.quit();
        });
        await vm.loadProject(fixture);
        const old = video.acquireCamera('qr');
        if (!pending) await old.ready;
        await vm.loadProject(fixture);
        t.equal(video.releaseCamera(old), false);
        if (pending) t.equal(await old.ready, null);
        const before = previews;
        const current = video.acquireCamera('qr');
        t.ok(current.generation > old.generation);
        await current.ready;
        capture.resolve({enabled: true});
        await flush();
        t.equal(previews, before + 1, 'only the new project adds preview');
        t.same(vm.getProjectExtensionIds(), [], 'acquisition does not change serialized extension membership');
    });
}

test('a queued preview callback cannot render into a newer session', async t => {
    const originalImageData = global.ImageData;
    global.ImageData = class {
        constructor (width, height) {
            this.width = width;
            this.height = height;
        }
    };
    let updates = 0;
    let visible = false;
    const renderer = {
        createBitmapSkin: () => 1,
        createDrawable: () => 2,
        updateDrawableSkinId () {},
        updateDrawableEffect () {},
        updateDrawableVisible (id, value) {
            visible = value;
        },
        updateBitmapSkin () {
            updates++;
        }
    };
    const video = new Video({renderer, currentStepTime: 1000000, requestRedraw () {}});
    t.teardown(() => {
        video.reset();
        if (originalImageData) global.ImageData = originalImageData;
        else delete global.ImageData;
    });
    video.setProvider(createProvider());
    const first = video.acquireCamera('qr');
    await first.ready;
    const oldFrame = video._renderPreviewFrame;
    video.reset();
    t.equal(visible, false);
    const second = video.acquireCamera('qr');
    await second.ready;
    const before = updates;
    oldFrame();
    t.equal(updates, before, 'queued old frame cannot update the new skin');
    t.equal(visible, true);
    video._renderPreviewFrame();
    t.equal(updates, before + 1, 'current frame still works');
    video.releaseCamera(second);
    t.equal(visible, false);
    t.equal(video._renderPreviewFrame, null);
});

test('replacing a provider releases completed capture', async t => {
    const {video, provider} = createVideo(t);
    const old = video.acquireCamera('qr');
    await old.ready;
    const replacement = createProvider();
    video.setProvider(replacement);
    t.equal(provider.disables, 1);
    t.equal(video.releaseCamera(old), false);
    const current = video.acquireCamera('qr');
    t.equal(await current.ready, current);
    t.equal(replacement.enables, 1);
    video.setProvider(null);
    t.equal(replacement.disables, 1);
    t.equal(video.acquireCamera('qr'), null);
});

for (const rejectOld of [false, true]) {
    test(`provider replacement ignores old ${rejectOld ? 'failure' : 'success'}`, async t => {
        const capture = deferred();
        const oldProvider = createProvider([capture.promise]);
        const {video, previews} = createVideo(t, oldProvider);
        const old = video.acquireCamera('qr');
        const provider = createProvider();
        video.setProvider(provider);
        t.equal(oldProvider.disables, 1);
        t.equal(await old.ready, null);
        const current = video.acquireCamera('qr');
        await current.ready;
        if (rejectOld) capture.reject(new Error('replaced provider'));
        else capture.resolve(oldProvider);
        await flush();
        t.equal(previews(), 1);
        t.equal(provider.disables, 0);
        t.equal(oldProvider.disables, 1);
        t.equal(video.releaseCamera(old), false);
        video.setProvider(provider);
        t.equal(video.acquireCamera('qr'), current, 'setting the same provider is a no-op');
    });
}

test('legacy methods remain operational and global shutdown cancels named owners', async t => {
    const {video, provider} = createVideo(t);
    t.equal(await video.enableVideo(), void 0, 'legacy success preserves its return value');
    await video.enableVideo();
    const lease = video.acquireCamera('qr');
    await lease.ready;
    t.equal(provider.enables, 1, 'legacy and named owners share activation');
    t.same(video.getFrame({dimensions: [10, 20], mirror: false, format: 'canvas', cacheTimeout: 7}),
        {dimensions: [10, 20], mirror: false, format: 'canvas', cacheTimeout: 7});
    video.disableVideo();
    t.equal(provider.disables, 1);
    t.equal(video.releaseCamera(lease), false, 'legacy global shutdown invalidates leases');
    t.equal(await video.enableVideo(), void 0);
    t.equal(provider.enables, 2);
});

test('legacy pending activation is cancelled and stale completion cannot add preview', async t => {
    const capture = deferred();
    const {video, previews} = createVideo(t, createProvider([capture.promise]));
    const pending = video.enableVideo();
    video.disableVideo();
    t.equal(await pending, null);
    capture.resolve({enabled: true});
    await flush();
    t.equal(previews(), 0);
});

test('missing provider preserves legacy null and does not create an acquisition', t => {
    const video = new Video({});
    t.equal(video.enableVideo(), null);
    t.equal(video.acquireCamera('qr'), null);
    t.equal(video.getFrame({}), null);
    t.equal(video.releaseCamera(null), false);
    t.end();
});

const createCleanupFailure = t => {
    const originalImageData = global.ImageData;
    const originalWarn = log.warn;
    const warnings = [];
    const previewError = new Error('preview cleanup failure');
    let failPreview = false;
    let active = false;
    global.ImageData = class {};
    log.warn = (...args) => warnings.push(args);
    const renderer = {
        createBitmapSkin: () => 1,
        createDrawable: () => 2,
        updateDrawableSkinId () {},
        updateDrawableEffect () {},
        updateDrawableVisible () {},
        updateBitmapSkin () {
            if (failPreview) throw previewError;
        }
    };
    const provider = createProvider();
    provider.enableVideo = function () {
        this.enables++;
        active = true;
        return Promise.resolve();
    };
    provider.disableVideo = function () {
        this.disables++;
        active = false;
    };
    const video = new Video({renderer, currentStepTime: 1000000, requestRedraw () {}});
    video.setProvider(provider);
    t.teardown(() => {
        failPreview = false;
        video.reset();
        log.warn = originalWarn;
        if (originalImageData) global.ImageData = originalImageData;
        else delete global.ImageData;
    });
    return {
        video,
        provider,
        warnings,
        previewError,
        active: () => active,
        recover: () => {
            failPreview = false;
        },
        fail: () => {
            failPreview = true;
        }
    };
};

for (const action of ['reset', 'release', 'legacy', 'replace']) {
    test(`${action} stops capture even when the renderer fails during cleanup`, async t => {
        const {video, provider, warnings, previewError, active, fail} = createCleanupFailure(t);
        const lease = video.acquireCamera('qr');
        await lease.ready;
        const oldFrame = video._renderPreviewFrame;
        const timer = video._renderPreviewTimeout;
        const replacement = createProvider();
        fail();
        t.doesNotThrow(() => {
            if (action === 'reset') video.reset();
            else if (action === 'release') t.equal(video.releaseCamera(lease), true);
            else if (action === 'legacy') video.disableVideo();
            else video.setProvider(replacement);
        }, 'visual cleanup failure is diagnosed without aborting shutdown');
        t.equal(provider.disables, 1, 'physical shutdown is attempted exactly once');
        t.equal(active(), false, 'capture is not left active without an owner');
        t.equal(video.releaseCamera(lease), false, 'old identity cannot release again');
        t.equal(video._cameraConsumers.size, 0);
        t.equal(video._cameraOperation, null);
        t.equal(video._renderPreviewFrame, null);
        t.equal(timer._destroyed, true, 'the preview timer is cancelled');
        t.doesNotThrow(oldFrame, 'a queued frame does not access the failed renderer');
        t.equal(warnings.length, 1);
        t.match(warnings[0][0], /Video.disableVideo/);
        t.equal(warnings[0][2], previewError, 'diagnostic retains the actual error');
        if (action === 'reset' || action === 'replace') {
            t.ok(video._cameraGeneration > lease.generation);
        }
        if (action === 'replace') t.equal(video.provider, replacement);
    });
}

test('a pending acquisition cancelled during failed cleanup cannot stop a later session', async t => {
    const {video, provider, active, fail, recover, warnings} = createCleanupFailure(t);
    const initial = video.acquireCamera('qr');
    await initial.ready;
    video.releaseCamera(initial);
    const capture = deferred();
    const enable = provider.enableVideo;
    provider.enableVideo = function () {
        enable.call(this);
        return capture.promise;
    };
    const old = video.acquireCamera('qr');
    fail();
    video.reset();
    t.equal(await old.ready, null);
    t.equal(active(), false);
    recover();
    provider.enableVideo = enable;
    const current = video.acquireCamera('qr');
    t.equal(await current.ready, current);
    t.ok(current.generation > old.generation);
    const stops = provider.disables;
    capture.reject(new Error('old acquisition failure'));
    await flush();
    t.equal(provider.disables, stops, 'old failure cannot shut down the current provider activation');
    t.equal(active(), true);
    t.equal(video.releaseCamera(old), false);
    t.equal(warnings.length, 1);
    video.releaseCamera(current);
    t.equal(active(), false);
});

test('a synchronous provider shutdown failure remains observable after visual failure', async t => {
    const {video, provider, fail, warnings} = createCleanupFailure(t);
    await video.acquireCamera('qr').ready;
    const stop = provider.disableVideo;
    const shutdownError = new Error('provider shutdown failure');
    provider.disableVideo = function () {
        stop.call(this);
        throw shutdownError;
    };
    fail();
    t.throws(() => video.reset(), shutdownError, 'provider failure propagates to the synchronous caller');
    provider.disableVideo = stop;
    t.equal(provider.disables, 1);
    t.equal(warnings.length, 1);
    t.equal(video._cameraConsumers.size, 0);
});

for (const failStop of [false, true]) {
    test(`acquisition rejection with cleanup failure${failStop ? ' and provider failure' : ''} is handled`, t => {
        const {spawnSync} = require('child_process');
        // A separate process detects unhandled rejections without competing with TAP's own handler.
        const diagnostic = () => {
            const VideoIO = require(process.argv[1]);
            const logger = require(require('path').join(require('path').dirname(process.argv[1]), '../util/log'));
            const failProvider = process.argv[2] === 'true';
            const acquisitionError = new Error('capture denied');
            const unhandled = [];
            const warnings = [];
            const errors = [];
            let disables = 0;
            let enables = 0;
            let active = false;
            process.on('unhandledRejection', error => unhandled.push(error.message));
            logger.warn = (...args) => warnings.push(args);
            logger.error = (...args) => errors.push(args);
            const runtime = {};
            const video = new VideoIO(runtime);
            video.setProvider({
                enableVideo () {
                    active = true;
                    return ++enables === 1 ? Promise.reject(acquisitionError) : Promise.resolve();
                },
                disableVideo () {
                    active = false;
                    if (++disables === 1 && failProvider) throw new Error('provider shutdown failure');
                }
            });
            global.ImageData = class {};
            runtime.renderer = {updateBitmapSkin () {
                throw new Error('preview cleanup failure');
            }};
            video._skinId = 1;
            const lease = video.acquireCamera('qr');
            const caught = lease.ready.catch(error => error === acquisitionError);
            setImmediate(async () => {
                const originalError = await caught;
                const stopsAfterFailure = disables;
                runtime.renderer = null;
                const retry = video.acquireCamera('qr');
                const retried = await retry.ready === retry;
                video.releaseCamera(retry);
                setImmediate(() => process.stdout.write(JSON.stringify({
                    originalError,
                    stopsAfterFailure,
                    unhandled,
                    retried,
                    active,
                    warnings: warnings.length,
                    errors: errors.map(args => args[2].message)
                })));
            });
        };
        const child = spawnSync(process.execPath, ['-e', `(${diagnostic.toString()})()`,
            require.resolve('../../src/io/video'), String(failStop)], {encoding: 'utf8', timeout: 10000});
        t.equal(child.status, 0, child.stderr);
        const result = JSON.parse(child.stdout);
        t.equal(result.originalError, true, 'readiness rejects with the original acquisition error');
        t.equal(result.stopsAfterFailure, 1);
        t.same(result.unhandled, [], 'no internal rejection is abandoned');
        t.equal(result.warnings, 1, 'visual failure is diagnosed');
        t.same(result.errors, failStop ? ['provider shutdown failure'] : []);
        t.equal(result.retried, true);
        t.equal(result.active, false);
        t.end();
    });
}

test('loadProject completes and stops capture despite a preview cleanup failure', async t => {
    const VirtualMachine = require('../../src/virtual-machine');
    const FakeRenderer = require('../fixtures/fake-renderer');
    const fixture = require('fs').readFileSync(require('path').join(__dirname, '../fixtures/default.sb3'));
    const originalImageData = global.ImageData;
    const originalWarn = log.warn;
    const warnings = [];
    let failPreview = false;
    let active = false;
    global.ImageData = class {};
    log.warn = (...args) => warnings.push(args);
    const renderer = new FakeRenderer();
    renderer._nextSkinId = 1;
    renderer.updateBitmapSkin = () => {
        if (failPreview) throw new Error('preview cleanup failure');
    };
    renderer.destroyDrawable = () => {};
    renderer.destroySkin = () => {};
    const vm = new VirtualMachine();
    vm.attachRenderer(renderer);
    vm.runtime.currentStepTime = 1000000;
    const video = vm.runtime.ioDevices.video;
    const provider = createProvider();
    provider.enableVideo = () => {
        active = true;
        return Promise.resolve();
    };
    provider.disableVideo = () => {
        provider.disables++;
        active = false;
    };
    video.setProvider(provider);
    t.teardown(() => {
        failPreview = false;
        vm.runtime.dispose();
        vm.quit();
        log.warn = originalWarn;
        if (originalImageData) global.ImageData = originalImageData;
        else delete global.ImageData;
    });
    await vm.loadProject(fixture);
    const previousStage = vm.runtime.getTargetForStage();
    const lease = video.acquireCamera('qr');
    await lease.ready;
    const before = provider.disables;
    failPreview = true;
    await vm.loadProject(fixture);
    t.equal(provider.disables, before + 1);
    t.equal(active, false, 'project replacement does not leave capture active');
    t.equal(video.releaseCamera(lease), false);
    t.ok(video._cameraGeneration > lease.generation);
    t.equal(video._cameraConsumers.size, 0);
    t.equal(video._renderPreviewFrame, null);
    t.not(vm.runtime.getTargetForStage(), previousStage, 'the replacement project was installed');
    t.equal(warnings.filter(args => args[0] === 'Video.disableVideo: preview cleanup failed').length, 1);
});
