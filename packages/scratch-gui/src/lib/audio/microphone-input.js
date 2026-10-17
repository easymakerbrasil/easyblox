import getUserMedia from 'get-user-media-promise';
import {getMediaInputPreferences} from '../media-input-preferences';
import log from '../log';

const stopStream = function (stream) {
    for (const track of stream.getTracks()) {
        try {
            track.stop();
        } catch (error) {
            log.warn('MicrophoneInput.stopStream: track shutdown failed', error);
        }
    }
};

/** One input consumer owns its own acquisition; other consumers never release this stream. */
class MicrophoneInput {
    constructor () {
        this._operation = null;
    }

    acquire () {
        if (this._operation) return this._operation.handle;
        let resolve;
        let reject;
        const ready = new Promise((accept, fail) => {
            resolve = accept;
            reject = fail;
        });
        const handle = Object.freeze({ready});
        const operation = {handle, resolve, reject, stream: null};
        this._operation = operation;
        const capture = async () => {
            if (this._operation !== operation) return null;
            const deviceId = getMediaInputPreferences().getMicrophoneDeviceId();
            try {
                return await getUserMedia({audio: deviceId === null ? true : {deviceId: {exact: deviceId}}});
            } catch (error) {
                if (this._operation !== operation || deviceId === null ||
                    !error || error.name !== 'NotFoundError') throw error;
                log.warn('MicrophoneInput.acquire: preferred microphone not found; trying system default');
                return getUserMedia({audio: true});
            }
        };
        const pending = Promise.resolve().then(capture);
        const complete = function (stream) {
            if (!this.isActive(handle)) {
                if (stream) stopStream(stream);
                return;
            }
            operation.stream = stream;
            resolve(stream);
        }.bind(this);
        const fail = function (error) {
            if (this._operation === operation) this._operation = null;
            reject(error);
        }.bind(this);
        const completionFailed = function (error) {
            log.error('MicrophoneInput.acquire: completion failed', error);
        };
        pending.then(complete, fail).catch(completionFailed);
        return handle;
    }

    isActive (handle) {
        return Boolean(handle && this._operation && this._operation.handle === handle);
    }

    release (handle) {
        if (!this.isActive(handle)) return false;
        const operation = this._operation;
        this._operation = null;
        operation.resolve(null);
        if (operation.stream) stopStream(operation.stream);
        return true;
    }
}

export default MicrophoneInput;
