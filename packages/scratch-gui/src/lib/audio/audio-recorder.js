import 'get-float-time-domain-data';
import SharedAudioContext from './shared-audio-context.js';
import {computeRMS, computeChunkedRMS} from './audio-util.js';
import MicrophoneInput from './microphone-input';
import log from '../log';

class AudioRecorder {
    constructor () {
        this.audioContext = new SharedAudioContext();
        this.bufferLength = 8192;

        this.userMediaStream = null;
        this.mediaStreamSource = null;
        this.sourceNode = null;
        this.scriptProcessorNode = null;

        this.recordedSamples = 0;
        this.recording = false;
        this.started = false;
        this.buffers = [];

        this.disposed = false;
        this._microphone = new MicrophoneInput();
        this._acquisition = null;
        this._levelFrame = null;
    }

    startListening (onStarted, onUpdate, onError) {
        if (this.disposed || this._acquisition) return;
        const acquisition = this._microphone.acquire();
        this._acquisition = acquisition;
        const failed = error => {
            if (this.disposed || this._acquisition !== acquisition) return;
            this._releaseInput();
            onError(error);
        };
        const connected = stream => {
            if (!stream || this.disposed || this._acquisition !== acquisition ||
                !this._microphone.isActive(acquisition)) return;
            try {
                this.attachUserMediaStream(stream, onUpdate);
                this.started = true;
                onStarted();
            } catch (error) {
                failed(error);
            }
        };
        const callbackFailed = function (error) {
            log.error('AudioRecorder.startListening: callback failed', error);
        };
        acquisition.ready.then(connected, failed).catch(callbackFailed);
    }

    startRecording () {
        this.recording = true;
    }

    attachUserMediaStream (userMediaStream, onUpdate) {
        const acquisition = this._acquisition;
        this.userMediaStream = userMediaStream;
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(userMediaStream);
        this.sourceNode = this.audioContext.createGain();
        this.scriptProcessorNode = this.audioContext.createScriptProcessor(this.bufferLength, 1, 1);

        this.scriptProcessorNode.onaudioprocess = processEvent => {
            if (this.recording && !this.disposed && this._acquisition === acquisition) {
                this.buffers.push(new Float32Array(processEvent.inputBuffer.getChannelData(0)));
            }
        };

        this.analyserNode = this.audioContext.createAnalyser();

        this.analyserNode.fftSize = 2048;

        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);

        const update = () => {
            if (this.disposed || !this.started || this._acquisition !== acquisition) return;
            this._levelFrame = null;
            this.analyserNode.getFloatTimeDomainData(dataArray);
            onUpdate(computeRMS(dataArray));
            if (!this.disposed && this.started && this._acquisition === acquisition) {
                this._levelFrame = requestAnimationFrame(update);
            }
        };

        this._levelFrame = requestAnimationFrame(update);

        // Wire everything together, ending in the destination
        this.mediaStreamSource.connect(this.sourceNode);
        this.sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.scriptProcessorNode);
        this.scriptProcessorNode.connect(this.audioContext.destination);
    }

    stop () {
        const buffer = new Float32Array(this.buffers.length * this.bufferLength);

        let offset = 0;
        for (let i = 0; i < this.buffers.length; i++) {
            const bufferChunk = this.buffers[i];
            buffer.set(bufferChunk, offset);
            offset += bufferChunk.length;
        }

        const chunkLevels = computeChunkedRMS(buffer);
        const maxRMS = Math.max.apply(null, chunkLevels);
        const threshold = maxRMS / 8;

        let firstChunkAboveThreshold = null;
        let lastChunkAboveThreshold = null;
        for (let i = 0; i < chunkLevels.length; i++) {
            if (chunkLevels[i] > threshold) {
                if (firstChunkAboveThreshold === null) firstChunkAboveThreshold = i + 1;
                lastChunkAboveThreshold = i + 1;
            }
        }

        let trimStart = Math.max(2, firstChunkAboveThreshold - 2) / this.buffers.length;
        let trimEnd = Math.min(this.buffers.length - 2, lastChunkAboveThreshold + 2) / this.buffers.length;

        // With very few samples, the automatic trimming can produce invalid values
        if (trimStart >= trimEnd) {
            trimStart = 0;
            trimEnd = 1;
        }

        return {
            levels: chunkLevels,
            samples: buffer,
            sampleRate: this.audioContext.sampleRate,
            trimStart: trimStart,
            trimEnd: trimEnd
        };
    }

    _releaseInput () {
        const acquisition = this._acquisition;
        const nodes = [this.scriptProcessorNode, this.analyserNode, this.sourceNode, this.mediaStreamSource];
        this._acquisition = null;
        this.started = false;
        this.recording = false;
        this.userMediaStream = null;
        if (this.scriptProcessorNode) this.scriptProcessorNode.onaudioprocess = null;
        this.scriptProcessorNode = null;
        this.analyserNode = null;
        this.sourceNode = null;
        this.mediaStreamSource = null;
        try {
            const frame = this._levelFrame;
            this._levelFrame = null;
            if (frame !== null) {
                try {
                    cancelAnimationFrame(frame);
                } catch (error) {
                    log.warn('AudioRecorder._releaseInput: level callback cancellation failed', error);
                }
            }
            for (const node of nodes) {
                if (!node) continue;
                try {
                    node.disconnect();
                } catch (error) {
                    log.warn('AudioRecorder._releaseInput: node cleanup failed', error);
                }
            }
        } finally {
            this._microphone.release(acquisition);
        }
    }

    dispose () {
        this.disposed = true;
        this._releaseInput();
    }
}

export default AudioRecorder;
