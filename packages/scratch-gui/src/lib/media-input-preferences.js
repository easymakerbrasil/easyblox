import log from './log';

const MEDIA_INPUT_PREFERENCES_KEY = 'easyblox.media-input-preferences';
const MEDIA_INPUT_KINDS = Object.freeze({camera: 'videoinput', microphone: 'audioinput'});
const isDeviceId = function (value) {
    return value === null || (typeof value === 'string' && value.trim().length > 0);
};
const getStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

const assertInputKind = function (kind) {
    if (!Object.prototype.hasOwnProperty.call(MEDIA_INPUT_KINDS, kind)) {
        throw new Error(`Unsupported media input kind: ${kind}`);
    }
};

/** Preferences are application-local; null identifies the system default, not a physical device. */
class MediaInputPreferences {
    constructor ({getStorage: storageGetter = getStorage} = {}) {
        this._getStorage = storageGetter;
        this._listeners = new Set();
        this._snapshot = Object.freeze({cameraDeviceId: null, microphoneDeviceId: null, persistence: 'available'});
        this._load();
    }

    _load () {
        try {
            const storage = this._getStorage();
            if (!storage) {
                this._snapshot = Object.freeze({...this._snapshot, persistence: 'unavailable'});
                return;
            }
            const raw = storage.getItem(MEDIA_INPUT_PREFERENCES_KEY);
            if (raw === null) return;
            let value;
            try {
                value = JSON.parse(raw);
            } catch {
                value = null;
            }
            if (!value || typeof value !== 'object' || Array.isArray(value) ||
                Object.keys(value).length !== 3 || value.version !== 1 ||
                !isDeviceId(value.cameraDeviceId) || !isDeviceId(value.microphoneDeviceId)) {
                log.warn('MediaInputPreferences._load: invalid or unsupported stored preferences');
                this._snapshot = Object.freeze({...this._snapshot, persistence: 'invalid'});
                return;
            }
            this._snapshot = Object.freeze({
                cameraDeviceId: value.cameraDeviceId,
                microphoneDeviceId: value.microphoneDeviceId,
                persistence: 'available'
            });
        } catch (error) {
            log.warn('MediaInputPreferences._load: storage read failed', {name: error.name});
            this._snapshot = Object.freeze({...this._snapshot, persistence: 'unavailable'});
        }
    }

    getSnapshot () {
        return this._snapshot;
    }

    getPreferredDeviceId (kind) {
        assertInputKind(kind);
        return this._snapshot[`${kind}DeviceId`];
    }

    getCameraDeviceId () {
        return this.getPreferredDeviceId('camera');
    }

    getMicrophoneDeviceId () {
        return this.getPreferredDeviceId('microphone');
    }

    setPreferredDeviceId (kind, deviceId) {
        assertInputKind(kind);
        if (!isDeviceId(deviceId)) throw new Error('Media input device ID must be a nonempty string or null');
        const previous = this._snapshot;
        const next = {...previous, [`${kind}DeviceId`]: deviceId};
        try {
            const storage = this._getStorage();
            next.persistence = storage ? 'available' : 'unavailable';
            if (storage) {
                storage.setItem(MEDIA_INPUT_PREFERENCES_KEY, JSON.stringify({
                    version: 1,
                    cameraDeviceId: next.cameraDeviceId,
                    microphoneDeviceId: next.microphoneDeviceId
                }));
            }
        } catch (error) {
            log.warn('MediaInputPreferences.setPreferredDeviceId: storage write failed', {kind, name: error.name});
            next.persistence = 'unavailable';
        }
        if (previous.cameraDeviceId === next.cameraDeviceId &&
            previous.microphoneDeviceId === next.microphoneDeviceId &&
            previous.persistence === next.persistence) return;
        this._snapshot = Object.freeze(next);
        for (const entry of this._listeners) {
            try {
                entry.listener(this._snapshot);
            } catch (error) {
                log.warn('MediaInputPreferences.setPreferredDeviceId: observer failed', error);
            }
        }
    }

    subscribe (listener) {
        const entry = {listener};
        this._listeners.add(entry);
        return () => this._listeners.delete(entry);
    }
}

// Construct lazily so importing this module never accesses browser storage or media APIs.
let preferences;
const getMediaInputPreferences = () => {
    if (!preferences) preferences = new MediaInputPreferences();
    return preferences;
};

export {MediaInputPreferences, MEDIA_INPUT_PREFERENCES_KEY, MEDIA_INPUT_KINDS,
    assertInputKind, getMediaInputPreferences};
