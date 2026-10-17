import MicrophoneInput from './microphone-input';
import log from '../log';

class PreferredLoudness {
    constructor (audioContext) {
        this.audioContext = audioContext;
        this._input = new MicrophoneInput();
        this._acquisition = null;
        this._disposed = false;
        this.connectingToMic = false;
        this.mic = null;
        this.analyser = null;
        this.audioStream = null;
        this._lastValue = null;
    }

    _acquire () {
        const acquisition = this._input.acquire();
        this._acquisition = acquisition;
        this.connectingToMic = true;
        const failed = function (error) {
            if (this._acquisition !== acquisition) return;
            this.reset();
            log.warn('PreferredLoudness._acquire: microphone acquisition failed', error);
        }.bind(this);
        const connected = function (stream) {
            if (!stream || this._disposed || this._acquisition !== acquisition ||
                !this._input.isActive(acquisition)) return;
            try {
                this.audioStream = stream;
                this.mic = this.audioContext.createMediaStreamSource(stream);
                this.analyser = this.audioContext.createAnalyser();
                this.mic.connect(this.analyser);
                this.micDataArray = new Float32Array(this.analyser.fftSize);
                this.connectingToMic = false;
            } catch (error) {
                failed(error);
            }
        }.bind(this);
        const callbackFailed = function (error) {
            log.error('PreferredLoudness._acquire: callback failed', error);
        };
        acquisition.ready.then(connected, failed).catch(callbackFailed);
    }

    getLoudness () {
        if (this._disposed) return -1;
        if (this.audioContext.state === 'closed') {
            this.dispose();
            return -1;
        }
        if (this.audioStream && !this.audioStream.active) this.reset();
        if (!this._acquisition) this._acquire();
        if (!this.mic || !this.audioStream.active) return -1;
        this.analyser.getFloatTimeDomainData(this.micDataArray);
        let sum = 0;
        for (const sample of this.micDataArray) sum += Math.pow(sample, 2);
        let rms = Math.sqrt(sum / this.micDataArray.length);
        if (this._lastValue) rms = Math.max(rms, this._lastValue * 0.6);
        this._lastValue = rms;
        // Preserve scratch-audio's smoothing and 0–100 microphone scale.
        return Math.min(Math.round(Math.sqrt(rms * 1.63) * 100), 100);
    }

    reset () {
        const acquisition = this._acquisition;
        const nodes = [this.mic, this.analyser];
        this._acquisition = null;
        this.audioStream = null;
        this.mic = null;
        this.analyser = null;
        this.micDataArray = null;
        this._lastValue = null;
        this.connectingToMic = false;
        try {
            for (const node of nodes) {
                if (!node) continue;
                try {
                    node.disconnect();
                } catch (error) {
                    log.warn('PreferredLoudness.reset: input node cleanup failed', error);
                }
            }
        } finally {
            this._input.release(acquisition);
        }
    }

    dispose () {
        this._disposed = true;
        this.reset();
    }
}

const bindings = new WeakMap();

/**
 * Populate AudioEngine's loudness detector slot without replacing the engine or its output graph.
 * @param {object} engine scratch-audio AudioEngine
 * @param {object} runtime owner emitting RUNTIME_DISPOSED on project replacement
 * @returns {function(): void} release this host's ownership of input and listeners
 */
const bindAudioEngineInput = (engine, runtime) => {
    let binding = bindings.get(engine);
    if (!binding) {
        const input = new PreferredLoudness(engine.audioContext);
        engine.loudness = input;
        const owners = new Set();
        const reset = () => input.reset();
        const context = engine.audioContext;
        let active = true;
        const canObserveContext = typeof context.addEventListener === 'function' &&
            typeof context.removeEventListener === 'function';
        const onStateChange = () => {
            if (context.state === 'closed') binding.cleanup();
        };
        const cleanup = () => {
            if (!active) return;
            active = false;
            input.dispose();
            runtime.removeListener('RUNTIME_DISPOSED', reset);
            if (canObserveContext) context.removeEventListener('statechange', onStateChange);
            owners.clear();
            bindings.delete(engine);
        };
        binding = {owners, cleanup};
        bindings.set(engine, binding);
        runtime.on('RUNTIME_DISPOSED', reset);
        if (canObserveContext) context.addEventListener('statechange', onStateChange);
        onStateChange();
    }
    const owner = {};
    binding.owners.add(owner);
    return () => {
        if (binding.owners.delete(owner) && binding.owners.size === 0) binding.cleanup();
    };
};

export {PreferredLoudness, bindAudioEngineInput};
