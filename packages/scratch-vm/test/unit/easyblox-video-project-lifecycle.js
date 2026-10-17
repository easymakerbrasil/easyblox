const {test} = require('tap');

const path = require('path');
const fs = require('fs');
const VirtualMachine = require('../../src/virtual-machine');

const Runtime = require('../../src/engine/runtime');
const VideoSensing = require(
    '../../src/extensions/scratch3_video_sensing'
);

// The lifecycle tests exercise extension events, not motion analysis.
// Prevent the extension's recurring analysis timer from keeping TAP alive.
const originalLoop = VideoSensing.prototype._loop;

VideoSensing.prototype._loop = function () {};

process.once('exit', () => {
    VideoSensing.prototype._loop = originalLoop;
});

const createRuntime = () => {
    const runtime = new Runtime();

    const calls = {
        enable: 0,
        disable: 0
    };

    runtime.ioDevices.video.setProvider({
        enableVideo () {
            calls.enable += 1;
            return Promise.resolve();
        },
        disableVideo () {
            calls.disable += 1;
        },
        getFrame () {
            return null;
        }
    });

    return {runtime, calls};
};

const readFixture = filename => fs.readFileSync(
    path.join(
        __dirname,
        '../fixtures',
        filename
    )
);

test('disposing a project disables its camera', async t => {
    const {runtime, calls} = createRuntime();
    const video = runtime.ioDevices.video;
    const lease = video.acquireCamera('videoSensing');
    await lease.ready;

    runtime.dispose();

    t.equal(
        calls.disable,
        1,
        'runtime disposal requests camera shutdown'
    );
    t.equal(video.releaseCamera(lease), false, 'disposed lease is invalid');
    t.equal(video._cameraConsumers.size, 0, 'disposal leaves no camera owners');

    t.end();
});

test('an old Video extension cannot reactivate camera in an empty project', t => {
    const {runtime, calls} = createRuntime();

    const extension = new VideoSensing(runtime);

    // Prevent the extension's background analysis loop
    // from continuing after this test.
    t.teardown(() => {
        runtime.dispose();
    });

    runtime.dispose();

    const activationsBeforeLoad = calls.enable;

    runtime.handleProjectLoaded();

    t.equal(
        calls.enable,
        activationsBeforeLoad,
        'old Video listener does not reactivate capture'
    );

    t.ok(extension, 'extension instance remains available');

    t.end();
});

test('a project containing Video blocks restores its camera state', t => {
    const {runtime, calls} = createRuntime();

    const extension = new VideoSensing(runtime);

    // A lightweight target is enough for the extension ownership check.
    runtime.targets.push({
        blocks: {
            _blocks: {
                videoBlock: {
                    opcode: 'videoSensing_videoToggle'
                }
            }
        }
    });

    // Simulate the Stage's stored video state.
    runtime.getTargetForStage = () => ({
        videoState: 'on',
        videoTransparency: 50
    });

    runtime.handleProjectLoaded();

    t.equal(
        calls.enable,
        1,
        'Video project restores camera activation'
    );

    t.ok(extension, 'Video extension is available');

    // Remove the lightweight target before disposal.
    runtime.targets = [];
    runtime.dispose();

    t.end();
});

test('loadProject releases video between projects', async t => {
    const vm = new VirtualMachine();

    const calls = {
        enable: 0,
        disable: 0
    };

    vm.runtime.ioDevices.video.setProvider({
        enableVideo () {
            calls.enable += 1;
            return Promise.resolve();
        },
        disableVideo () {
            calls.disable += 1;
        },
        getFrame () {
            return null;
        }
    });

    const videoProject = readFixture(
        'load-extensions/confirm-load/videoSensing-simple-project.sb3'
    );

    const defaultProject = readFixture('default.sb3');

    await vm.loadProject(videoProject);

    const firstEnableCount = calls.enable;
    const video = vm.runtime.ioDevices.video;
    const oldLease = video._cameraConsumers.get('videoSensing').lease;
    t.equal(await oldLease.ready, oldLease, 'loaded Video owns a ready identified acquisition');
    const firstDisableCount = calls.disable;

    t.ok(
        firstEnableCount > 0,
        'video project requests camera activation'
    );

    await vm.loadProject(defaultProject);

    t.ok(
        calls.disable > firstDisableCount,
        'loading another project requests camera shutdown'
    );

    t.equal(
        calls.enable,
        firstEnableCount,
        'previous Video extension does not reactivate camera'
    );
    t.equal(video._cameraConsumers.size, 0, 'empty project has no camera acquisition');
    t.equal(video.releaseCamera(oldLease), false, 'previous project lease cannot release again');

    await vm.loadProject(videoProject);

    t.ok(
        calls.enable > firstEnableCount,
        'Video activation is restored when its project is reopened'
    );
    const currentLease = video._cameraConsumers.get('videoSensing').lease;
    t.not(currentLease, oldLease, 'reopened project receives a new identity');
    t.ok(currentLease.generation > oldLease.generation);

    vm.runtime.dispose();
    t.end();
});
