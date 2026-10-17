import AudioRecorder from '../../../../src/lib/audio/audio-recorder';
import SharedAudioContext from '../../../../src/lib/audio/shared-audio-context';
import {getMediaInputPreferences} from '../../../../src/lib/media-input-preferences';
import getUserMedia from 'get-user-media-promise';
import AudioEngine from 'scratch-audio';
import {EventEmitter} from 'events';
import {bindAudioEngineInput} from '../../../../src/lib/audio/audio-engine-input';
import {deferred, flush, createStream, createAudioContext} from '../../../helpers/microphone';

jest.mock('get-user-media-promise', () => jest.fn());
jest.mock('../../../../src/lib/audio/shared-audio-context', () => jest.fn());
jest.mock('../../../../src/lib/log', () => ({warn: jest.fn(), error: jest.fn()}));

describe('preferred microphone recording', () => {
    let recorder;
    let context;
    let current;
    let callbacks;
    const preferences = getMediaInputPreferences();
    beforeEach(() => {
        jest.clearAllMocks();
        preferences.setPreferredDeviceId('microphone', null);
        context = createAudioContext();
        SharedAudioContext.mockImplementation(() => context);
        current = createStream();
        getUserMedia.mockReset().mockResolvedValue(current.stream);
        jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
        jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        callbacks = [jest.fn(), jest.fn(), jest.fn()];
        recorder = new AudioRecorder();
    });
    afterEach(() => {
        recorder.dispose();
        jest.restoreAllMocks();
    });

    test('uses the default without capture at construction and preserves recorded PCM', async () => {
        expect(getUserMedia).not.toHaveBeenCalled();
        recorder.startListening(...callbacks);
        await flush();
        expect(getUserMedia).toHaveBeenCalledWith({audio: true});
        recorder.startRecording();
        recorder.scriptProcessorNode.onaudioprocess({inputBuffer: {getChannelData: () => new Float32Array(8192)}});
        expect(recorder.stop().samples).toHaveLength(8192);
        expect(recorder.stop().sampleRate).toBe(44100);
        expect(callbacks[0]).toHaveBeenCalledTimes(1);
    });

    test('uses an exact preferred microphone without interrupting an active recording', async () => {
        preferences.setPreferredDeviceId('microphone', 'mic-A');
        recorder.startListening(...callbacks);
        await flush();
        recorder.startRecording();
        preferences.setPreferredDeviceId('microphone', 'mic-B');
        recorder.startListening(...callbacks);
        expect(getUserMedia).toHaveBeenCalledTimes(1);
        expect(getUserMedia).toHaveBeenCalledWith({audio: {deviceId: {exact: 'mic-A'}}});
        expect(current.track.stop).not.toHaveBeenCalled();
        expect(recorder.recording).toBe(true);
        recorder.dispose();
        recorder = new AudioRecorder();
        recorder.startListening(...callbacks);
        await flush();
        expect(getUserMedia.mock.calls[1][0]).toEqual({audio: {deviceId: {exact: 'mic-B'}}});
    });

    test('disposal while acquisition is pending stops a late stream and suppresses callbacks', async () => {
        const pending = deferred();
        getUserMedia.mockReturnValueOnce(pending.promise);
        recorder.startListening(...callbacks);
        await Promise.resolve();
        recorder.dispose();
        pending.resolve(current.stream);
        await flush();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        expect(callbacks[0]).not.toHaveBeenCalled();
        expect(context.createMediaStreamSource).not.toHaveBeenCalled();
    });

    test('allows retry after a denied request and treats disposal as terminal', async () => {
        const error = Object.assign(new Error('Denied'), {name: 'NotAllowedError'});
        getUserMedia.mockRejectedValueOnce(error);
        recorder.startListening(...callbacks);
        await flush();
        expect(callbacks[2]).toHaveBeenCalledWith(error);
        recorder.startListening(...callbacks);
        await flush();
        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        recorder.dispose();
        recorder.dispose();
        recorder.startListening(...callbacks);
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        expect(getUserMedia).toHaveBeenCalledTimes(2);
    });

    test('cleanup failure still stops every track, clears RAF and remains idempotent', async () => {
        const otherTrack = {stop: jest.fn()};
        current.stream.getTracks = () => [current.track, otherTrack];
        recorder.startListening(...callbacks);
        await flush();
        const staleUpdate = window.requestAnimationFrame.mock.calls[0][0];
        recorder.sourceNode.disconnect.mockImplementation(() => {
            throw new Error('Disconnect failed');
        });
        expect(() => recorder.dispose()).not.toThrow();
        recorder.dispose();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        expect(otherTrack.stop).toHaveBeenCalledTimes(1);
        expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
        staleUpdate();
        expect(callbacks[1]).not.toHaveBeenCalled();
    });

    test('node setup failure releases capture and allows another attempt', async () => {
        const error = new Error('Audio graph failed');
        context.createAnalyser.mockImplementationOnce(() => {
            throw error;
        });
        recorder.startListening(...callbacks);
        await flush();
        expect(current.track.stop).toHaveBeenCalledTimes(1);
        expect(callbacks[0]).not.toHaveBeenCalled();
        expect(callbacks[2]).toHaveBeenCalledWith(error);
        const next = createStream();
        getUserMedia.mockResolvedValue(next.stream);
        recorder.startListening(...callbacks);
        await flush();
        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        recorder.dispose();
        expect(next.track.stop).toHaveBeenCalledTimes(1);
    });

    test('falls back once for a missing microphone and keeps the stored preference', async () => {
        preferences.setPreferredDeviceId('microphone', 'missing');
        getUserMedia.mockRejectedValueOnce({name: 'NotFoundError'});
        recorder.startListening(...callbacks);
        await flush();
        expect(callbacks[0]).toHaveBeenCalledTimes(1);
        expect(getUserMedia.mock.calls).toEqual([[{audio: {deviceId: {exact: 'missing'}}}], [{audio: true}]]);
        expect(preferences.getMicrophoneDeviceId()).toBe('missing');
    });

    test('error callback exceptions are diagnosed without abandoning a rejected promise', async () => {
        const errors = [];
        const onUnhandled = function (error) {
            errors.push(error);
        };
        process.on('unhandledRejection', onUnhandled);
        try {
            const original = new Error('Permission denied');
            getUserMedia.mockRejectedValueOnce(original);
            callbacks[2].mockImplementationOnce(() => {
                throw new Error('Callback failed');
            });
            recorder.startListening(...callbacks);
            await flush();
            expect(callbacks[2]).toHaveBeenCalledWith(original);
            expect(require('../../../../src/lib/log').error).toHaveBeenCalled();
            recorder.startListening(...callbacks);
            await flush();
            expect(callbacks[0]).toHaveBeenCalledTimes(1);
            expect(errors).toEqual([]);
        } finally {
            process.removeListener('unhandledRejection', onUnhandled);
        }
    });

    test('a queued old PCM callback cannot append samples after setup failure and retry', async () => {
        const processor = {connect: jest.fn(), disconnect: jest.fn()};
        context.createScriptProcessor.mockReturnValueOnce(processor);
        let oldCallback;
        context.createAnalyser.mockImplementationOnce(() => {
            oldCallback = processor.onaudioprocess;
            throw new Error('Setup failed');
        });
        recorder.startListening(...callbacks);
        await flush();
        getUserMedia.mockResolvedValue(createStream().stream);
        recorder.startListening(...callbacks);
        await flush();
        recorder.startRecording();
        oldCallback({inputBuffer: {getChannelData: () => new Float32Array([1])}});
        expect(recorder.buffers).toEqual([]);
    });

    test.each([{first: 'recorder'}, {first: 'loudness'}])(
        'recorder and loudness share the preference, not teardown ownership ($first first)', async ({first}) => {
            preferences.setPreferredDeviceId('microphone', 'mic-shared');
            const meterStream = createStream();
            getUserMedia.mockResolvedValueOnce(current.stream).mockResolvedValueOnce(meterStream.stream);
            const engine = new AudioEngine(context);
            const release = bindAudioEngineInput(engine, new EventEmitter());
            try {
                recorder.startListening(...callbacks);
                engine.getLoudness();
                await flush();
                expect(getUserMedia.mock.calls).toEqual([
                    [{audio: {deviceId: {exact: 'mic-shared'}}}], [{audio: {deviceId: {exact: 'mic-shared'}}}]
                ]);
                if (first === 'recorder') {
                    recorder.dispose();
                    expect(meterStream.track.stop).not.toHaveBeenCalled();
                    expect(engine.getLoudness()).toBe(40);
                } else {
                    release();
                    expect(current.track.stop).not.toHaveBeenCalled();
                    expect(recorder.started).toBe(true);
                }
            } finally {
                release();
                recorder.dispose();
            }
            expect(current.track.stop).toHaveBeenCalledTimes(1);
            expect(meterStream.track.stop).toHaveBeenCalledTimes(1);
        });
});
