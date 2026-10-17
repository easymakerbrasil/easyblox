/* @jest-environment node */
import AudioEngine from 'scratch-audio';
import {EventEmitter} from 'events';
import getUserMedia from 'get-user-media-promise';
import {PreferredLoudness, bindAudioEngineInput} from '../../../../src/lib/audio/audio-engine-input';
import {getMediaInputPreferences} from '../../../../src/lib/media-input-preferences';
import {deferred, flush, createStream, createAudioContext} from '../../../helpers/microphone';

jest.mock('get-user-media-promise', () => jest.fn());
jest.mock('../../../../src/lib/log', () => ({warn: jest.fn(), error: jest.fn()}));

describe('AudioEngine preferred microphone adapter', () => {
    const preferences = getMediaInputPreferences();
    let engine;
    let runtime;
    let context;
    let current;
    let release;
    let releases;
    const bind = (target = engine, owner = runtime) => {
        const cleanup = bindAudioEngineInput(target, owner);
        releases.push(cleanup);
        return cleanup;
    };
    beforeEach(() => {
        preferences.setPreferredDeviceId('microphone', null);
        context = createAudioContext();
        engine = new AudioEngine(context);
        runtime = new EventEmitter();
        current = createStream();
        getUserMedia.mockReset().mockResolvedValue(current.stream);
        releases = [];
        release = bind();
    });
    afterEach(() => {
        for (const cleanup of releases) cleanup();
    });

    test('only getLoudness acquires input and all output engine identities are preserved', async () => {
        expect(engine).toBeInstanceOf(AudioEngine);
        expect(engine.loudness).toBeInstanceOf(PreferredLoudness);
        expect(engine.getLoudness).toBe(AudioEngine.prototype.getLoudness);
        const output = engine.inputNode;
        const buffers = engine.audioBuffers;
        const effects = engine.effects;
        expect(getUserMedia).not.toHaveBeenCalled();
        expect(engine.getLoudness()).toBe(-1);
        await flush();
        expect(engine.getLoudness()).toBe(40);
        context.level = 0;
        expect(engine.getLoudness()).toBe(31);
        expect(getUserMedia).toHaveBeenCalledWith({audio: true});
        release();
        expect(engine.inputNode).toBe(output);
        expect(engine.audioBuffers).toBe(buffers);
        expect(engine.effects).toBe(effects);
        expect(output.disconnect).not.toHaveBeenCalled();
        expect(context.close).not.toHaveBeenCalled();
        expect(context.suspend).not.toHaveBeenCalled();
        expect(engine.getLoudness()).toBe(-1);
    });

    test('measurement keeps its device until reset, then uses the current preference', async () => {
        preferences.setPreferredDeviceId('microphone', 'mic-A');
        engine.getLoudness();
        await flush();
        preferences.setPreferredDeviceId('microphone', 'mic-B');
        engine.getLoudness();
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(getUserMedia).toHaveBeenCalledWith({audio: {deviceId: {exact: 'mic-A'}}});
        runtime.emit('RUNTIME_DISPOSED');
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        engine.getLoudness();
        await flush();
        expect(getUserMedia.mock.calls[1][0]).toEqual({audio: {deviceId: {exact: 'mic-B'}}});
    });

    test('permission failure is handled and does not leave connectingToMic stuck', async () => {
        preferences.setPreferredDeviceId('microphone', 'mic-A');
        getUserMedia.mockRejectedValueOnce(Object.assign(new Error('Denied'), {name: 'NotAllowedError'}));
        engine.getLoudness();
        await flush();
        expect(engine.loudness.connectingToMic).toBe(false);
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(engine.getLoudness()).toBe(-1);
        await flush();
        expect(engine.getLoudness()).toBe(40);
    });

    test('project reset cancels pending acquisition and late completion cannot replace a new session', async () => {
        const pending = deferred();
        getUserMedia.mockReturnValueOnce(pending.promise);
        engine.getLoudness();
        await Promise.resolve();
        runtime.emit('RUNTIME_DISPOSED');
        engine.getLoudness();
        await flush();
        const mic = engine.loudness.mic;
        const late = createStream();
        pending.resolve(late.stream);
        await flush();
        expect(late.track.stop).toHaveBeenCalledTimes(1);
        expect(engine.loudness.mic).toBe(mic);
        expect(current.track.stop).not.toHaveBeenCalled();
    });

    test('closed AudioContext disposes input and listeners without restarting capture', async () => {
        engine.getLoudness();
        await flush();
        await context.close();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        expect(runtime.listenerCount('RUNTIME_DISPOSED')).toBe(0);
        expect(engine.getLoudness()).toBe(-1);
        release();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
    });

    test('remount reuses the engine without duplicate listeners or old releases affecting new input', async () => {
        const firstRelease = release;
        const secondRelease = bind();
        expect(runtime.listenerCount('RUNTIME_DISPOSED')).toBe(1);
        engine.getLoudness();
        await flush();
        firstRelease();
        expect(current.track.stop).not.toHaveBeenCalled();
        secondRelease();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        bind();
        const next = createStream();
        getUserMedia.mockResolvedValue(next.stream);
        engine.getLoudness();
        await flush();
        firstRelease();
        expect(next.track.stop).not.toHaveBeenCalled();
        expect(runtime.listenerCount('RUNTIME_DISPOSED')).toBe(1);
    });

    test('graph setup failure and cleanup failure never leave input owned or pending', async () => {
        context.createAnalyser.mockImplementationOnce(() => {
            throw new Error('Setup failed');
        });
        engine.getLoudness();
        await flush();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        expect(engine.loudness.connectingToMic).toBe(false);
        const next = createStream();
        getUserMedia.mockResolvedValue(next.stream);
        engine.getLoudness();
        await flush();
        engine.loudness.mic.disconnect.mockImplementation(() => {
            throw new Error('Cleanup failed');
        });
        release();
        expect(next.track.stop).toHaveBeenCalledTimes(1);
    });

    test('real VM project disposal and sensing blocks use the adapter without changing VM code', () => {
        // Native Node loads the VM's ESM dependencies without changing Jest's transform configuration.
        const result = require('child_process').spawnSync(process.execPath, ['-e', `
            const fs = require('fs');
            const path = require('path');
            const Module = require('module');
            const babel = require('@babel/core');
            const assert = require('assert');
            const gui = path.resolve('packages/scratch-gui');
            const sources = new Set(['audio/audio-engine-input.js', 'audio/microphone-input.js',
                'media-input-preferences.js', 'log.js'].map(file => path.join(gui, 'src/lib', file)));
            const originalLoader = Module._extensions['.js'];
            Module._extensions['.js'] = (module, filename) => {
                if (!sources.has(filename)) return originalLoader(module, filename);
                const compiled = babel.transformFileSync(filename, {babelrc: false, configFile: false,
                    presets: [['@babel/preset-env', {targets: {node: 'current'}, modules: 'commonjs'}]]});
                module._compile(compiled.code, filename);
            };
            const streams = [];
            const requests = [];
            Object.defineProperty(global, 'navigator', {value: {mediaDevices: {getUserMedia: options => {
                requests.push(options);
                const stream = {active: true, stops: 0, getTracks() {
                    return [{stop: () => { stream.stops++; }}];
                }};
                streams.push(stream);
                return Promise.resolve(stream);
            }}}});
            const node = () => ({connect() {}, disconnect() {}});
            const context = {state: 'running', destination: {}, createGain: node,
                createMediaStreamSource: node, createAnalyser: () => ({...node(), fftSize: 8,
                    getFloatTimeDomainData: samples => samples.fill(0.1)})};
            const VM = require('./packages/scratch-vm/src/virtual-machine');
            const Sensing = require('./packages/scratch-vm/src/blocks/scratch3_sensing');
            const AudioEngine = require('scratch-audio');
            const {bindAudioEngineInput} = require(path.join(gui, 'src/lib/audio/audio-engine-input'));
            const preferences = require(path.join(gui, 'src/lib/media-input-preferences')).getMediaInputPreferences();
            const flush = () => new Promise(resolve => setImmediate(resolve));
            (async () => {
                const vm = new VM();
                const engine = new AudioEngine(context);
                const output = engine.inputNode;
                vm.attachAudioEngine(engine);
                const release = bindAudioEngineInput(engine, vm.runtime);
                try {
                    const sensing = new Sensing(vm.runtime);
                    vm.runtime.currentStepTime = 0;
                    assert.equal(sensing.getLoudness(), -1);
                    await flush();
                    assert.equal(sensing.getLoudness(), 40);
                    assert.equal(sensing.isLoud(), true);
                    const zip = await require('jszip').loadAsync(fs.readFileSync(
                        'packages/scratch-vm/test/fixtures/default.sb3'));
                    const project = JSON.parse(await zip.file('project.json').async('string'));
                    for (const target of project.targets) target.sounds = [];
                    zip.file('project.json', JSON.stringify(project));
                    await vm.loadProject(await zip.generateAsync({type: 'nodebuffer'}));
                    assert.equal(streams[0].stops, 1);
                    assert.equal(requests.length, 1);
                    preferences.setPreferredDeviceId('microphone', 'mic-after-project');
                    vm.runtime.currentStepTime = 0;
                    assert.equal(sensing.getLoudness(), -1);
                    await flush();
                    assert.deepEqual(requests[1], {audio: {deviceId: {exact: 'mic-after-project'}}});
                    assert.equal(sensing.getLoudness(), 40);
                    assert.equal(engine.inputNode, output);
                } finally { release(); vm.runtime.dispose(); }
                assert.deepEqual(streams.map(stream => stream.stops), [1, 1]);
                console.log('B3_PROJECT_PASS');
            })().catch(error => { console.error(error); process.exitCode = 1; });
        `], {cwd: require('path').resolve(__dirname, '../../../../../..'), encoding: 'utf8', timeout: 15000});
        if (result.status !== 0) throw new Error(`${result.error || ''}\n${result.stdout}\n${result.stderr}`);
        expect(result.stdout).toContain('B3_PROJECT_PASS');
    }, 20000);

    test('late failures after reset are handled without cancelling later input', async () => {
        const unhandled = [];
        const onUnhandled = function (error) {
            unhandled.push(error);
        };
        process.on('unhandledRejection', onUnhandled);
        try {
            const pending = deferred();
            getUserMedia.mockReturnValueOnce(pending.promise);
            engine.getLoudness();
            await Promise.resolve();
            runtime.emit('RUNTIME_DISPOSED');
            engine.getLoudness();
            await flush();
            pending.reject({name: 'NotFoundError'});
            await flush();
            expect(getUserMedia).toHaveBeenCalledTimes(2);
            expect(engine.getLoudness()).toBe(40);
            expect(unhandled).toEqual([]);
        } finally {
            process.removeListener('unhandledRejection', onUnhandled);
        }
    });

    test('pending capture is cancelled when the AudioContext closes', async () => {
        const pending = deferred();
        getUserMedia.mockReturnValueOnce(pending.promise);
        engine.getLoudness();
        await Promise.resolve();
        await context.close();
        pending.resolve(current.stream);
        await flush();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        expect(engine.getLoudness()).toBe(-1);
        expect(runtime.listenerCount('RUNTIME_DISPOSED')).toBe(0);
    });

    test('uses one default fallback for a missing microphone and retains its preference', async () => {
        preferences.setPreferredDeviceId('microphone', 'missing');
        getUserMedia.mockRejectedValueOnce({name: 'NotFoundError'});
        engine.getLoudness();
        await flush();
        expect(engine.getLoudness()).toBe(40);
        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(getUserMedia.mock.calls[1][0]).toEqual({audio: true});
        expect(preferences.getMicrophoneDeviceId()).toBe('missing');
    });

    test('matches the installed scratch-audio detector scale, clamp and smoothing', async () => {
        const NativeLoudness = require('scratch-audio/src/Loudness');
        const native = new NativeLoudness(context);
        native.mic = context.createMediaStreamSource(current.stream);
        native.audioStream = current.stream;
        native.analyser = context.createAnalyser();
        native.micDataArray = new Float32Array(native.analyser.fftSize);
        engine.getLoudness();
        await flush();
        for (const level of [0.1, 0.8, 0, 0, 1]) {
            context.level = level;
            expect(engine.getLoudness()).toBe(native.getLoudness());
        }
        native.mic.disconnect();
        native.analyser.disconnect();
    });
});
