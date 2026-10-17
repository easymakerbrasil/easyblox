import getUserMedia from 'get-user-media-promise';
import log from '../log.js';
import {getMediaInputPreferences} from '../media-input-preferences';

// Handles own individual shares of one physical capture, including while it is pending.
let activeRequest = null;
const acquisitions = new WeakMap();

const stopStream = stream => {
    if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(track => {
            try {
                track.stop();
            } catch (error) {
                log.error('Camera.stopStream: track shutdown failed', error);
            }
        });
    }
};

const requestVideoStream = videoDesc => {
    const startCapture = !activeRequest;
    const request = activeRequest || {consumers: new Map(), stream: null};
    let resolve;
    let reject;
    const ready = new Promise((resolveStream, rejectStream) => {
        resolve = resolveStream;
        reject = rejectStream;
    });
    // Readiness reports capture acquisition, not HTML video playback or continuing ownership.
    const acquisition = Object.freeze({ready});
    request.consumers.set(acquisition, {resolve, reject});
    acquisitions.set(acquisition, request);
    if (request.stream) resolve(request.stream);

    if (startCapture) {
        activeRequest = request;
        const capture = async () => {
            if (activeRequest !== request) return null;
            const preferredDeviceId = getMediaInputPreferences().getCameraDeviceId();
            const video = preferredDeviceId === null ? videoDesc :
                {...videoDesc, deviceId: {exact: preferredDeviceId}};
            try {
                return await getUserMedia({audio: false, video});
            } catch (error) {
                if (activeRequest !== request || preferredDeviceId === null ||
                    !error || error.name !== 'NotFoundError') throw error;
                // Both attempts belong to the same owners; cancellation must prevent starting fallback.
                const defaultVideo = {...videoDesc};
                delete defaultVideo.deviceId;
                log.warn('Camera.requestVideoStream: preferred camera not found; trying system default');
                return getUserMedia({audio: false, video: defaultVideo});
            }
        };
        // Give owners a chance to cancel before requesting physical access.
        const pendingCapture = Promise.resolve().then(capture);
        pendingCapture.then(stream => {
            if (activeRequest !== request) {
                stopStream(stream);
                return;
            }
            request.stream = stream;
            request.consumers.forEach(consumer => consumer.resolve(stream));
        }, error => {
            if (activeRequest === request) activeRequest = null;
            request.consumers.forEach((consumer, handle) => {
                acquisitions.delete(handle);
                consumer.reject(error);
            });
            request.consumers.clear();
        }).catch(error => {
            log.error('Camera.requestVideoStream: capture completion failed', error);
        });
    }

    return acquisition;
};

const requestDisableVideo = acquisition => {
    const request = acquisitions.get(acquisition);
    if (!request) return false;
    acquisitions.delete(acquisition);
    request.consumers.get(acquisition).resolve(null);
    request.consumers.delete(acquisition);
    if (request.consumers.size > 0) return false;

    if (activeRequest === request) activeRequest = null;

    const stream = request.stream;
    request.stream = null;
    stopStream(stream);

    return true;
};

export {
    requestVideoStream,
    requestDisableVideo
};
