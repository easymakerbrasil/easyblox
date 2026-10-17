import log from './log';
import {MEDIA_INPUT_KINDS, assertInputKind, getMediaInputPreferences} from './media-input-preferences';

const getMediaDevices = () => (typeof navigator === 'undefined' ? null : navigator.mediaDevices);
const emptyDevices = () => Object.freeze({camera: Object.freeze([]), microphone: Object.freeze([])});
const unknownVisibility = () => Object.freeze({camera: 'unknown', microphone: 'unknown'});

/** Observes input devices without acquiring streams, changing constraints, or deciding permissions. */
class MediaInputInventory {
    constructor ({preferences = getMediaInputPreferences(), getMediaDevices: devicesGetter = getMediaDevices} = {}) {
        this._preferences = preferences;
        this._getMediaDevices = devicesGetter;
        this._listeners = new Set();
        this._mediaDevices = null;
        this._deviceChange = null;
        this._revision = 0;
        this._disposed = false;
        this._snapshot = Object.freeze({
            status: 'idle', devices: emptyDevices(), visibility: unknownVisibility(), error: null
        });
    }

    getSnapshot () {
        return this._snapshot;
    }

    /**
     * The UI supplies localized text for the system default and unnamed device options.
     * @param {string} kind camera or microphone
     * @returns {Array<object>} system default followed by addressable enumerated inputs
     */
    getOptions (kind) {
        assertInputKind(kind);
        const options = [{deviceId: null, label: '', isSystemDefault: true}];
        for (const item of this._snapshot.devices[kind]) {
            if (item.deviceId) options.push({...item, isSystemDefault: false});
        }
        return options;
    }

    /**
     * Describe a future acquisition; this method never performs a fallback.
     * Optional failure evidence must come from an exact-device acquisition of this input alone.
     * NotFoundError is the only supported absence evidence. Permission/busy/constraint errors are not absence.
     * Evidence is scoped to this call so an old failure cannot poison a later selection or reconnection.
     * @param {string} kind camera or microphone
     * @param {object} failure optional {deviceId, error} from the failed exact-device acquisition
     * @returns {object} preferred ID, observed availability, and next-acquisition policy
     */
    getSelection (kind, failure = null) {
        assertInputKind(kind);
        const preferredDeviceId = this._preferences.getPreferredDeviceId(kind);
        const unavailable = preferredDeviceId !== null && failure && failure.deviceId === preferredDeviceId &&
            failure.error && failure.error.name === 'NotFoundError';
        let availability = 'system-default';
        if (preferredDeviceId !== null) {
            availability = 'unknown';
            if (this._snapshot.status === 'ready' &&
                this._snapshot.devices[kind].some(({deviceId}) => deviceId === preferredDeviceId)) {
                availability = 'listed';
            }
            if (unavailable) availability = 'unavailable';
        }
        return {
            preferredDeviceId,
            availability,
            deviceIdForNextAcquisition: unavailable ? null : preferredDeviceId,
            fallback: Boolean(unavailable),
            applyWhen: 'next-acquisition'
        };
    }

    _publish (snapshot) {
        this._snapshot = Object.freeze(snapshot);
        for (const entry of this._listeners) {
            try {
                entry.listener(this._snapshot);
            } catch (error) {
                log.warn('MediaInputInventory._publish: observer failed', error);
            }
        }
    }

    _detach () {
        if (this._deviceChange) {
            const handleChange = this._deviceChange;
            this._deviceChange = null;
            try {
                this._mediaDevices.removeEventListener('devicechange', handleChange);
            } catch (error) {
                log.warn('MediaInputInventory._detach: devicechange listener removal failed', error);
            }
        }
        this._mediaDevices = null;
    }

    _observe (mediaDevices) {
        if (this._mediaDevices === mediaDevices && (this._deviceChange || this._listeners.size === 0)) return;
        this._detach();
        this._mediaDevices = mediaDevices;
        if (!mediaDevices || this._listeners.size === 0 ||
            typeof mediaDevices.addEventListener !== 'function' ||
            typeof mediaDevices.removeEventListener !== 'function') return;
        const handleChange = () => {
            if (!this._disposed && this._deviceChange === handleChange) this.refresh();
        };
        mediaDevices.addEventListener('devicechange', handleChange);
        this._deviceChange = handleChange;
    }

    async refresh () {
        if (this._disposed) return this._snapshot;
        const revision = ++this._revision;
        this._publish({...this._snapshot, status: 'loading', error: null});
        if (this._disposed || revision !== this._revision) return this._snapshot;
        try {
            const mediaDevices = this._getMediaDevices();
            this._observe(mediaDevices);
            if (!mediaDevices || typeof mediaDevices.enumerateDevices !== 'function') {
                this._publish({
                    status: 'unsupported', devices: emptyDevices(), visibility: unknownVisibility(), error: null
                });
                return this._snapshot;
            }
            const result = await mediaDevices.enumerateDevices();
            if (this._disposed || revision !== this._revision) return this._snapshot;
            if (!Array.isArray(result)) throw new Error('Invalid media device enumeration response');
            const devices = {};
            const visibility = {};
            for (const kind of Object.keys(MEDIA_INPUT_KINDS)) {
                const matchesKind = function (item) {
                    return item && item.kind === MEDIA_INPUT_KINDS[kind];
                };
                devices[kind] = Object.freeze(result.filter(matchesKind).map(({deviceId, label}) => Object.freeze({
                    deviceId: typeof deviceId === 'string' ? deviceId : '',
                    label: typeof label === 'string' ? label : ''
                })));
                // Even labelled entries do not prove that every physical device was exposed.
                const limited = devices[kind].length === 0 ||
                    devices[kind].some(({deviceId, label}) => !deviceId || !label);
                visibility[kind] = limited ?
                    'limited-or-empty' : 'not-confirmed-complete';
            }
            this._publish({status: 'ready',
                devices: Object.freeze(devices),
                visibility: Object.freeze(visibility),
                error: null});
        } catch (error) {
            if (this._disposed || revision !== this._revision) return this._snapshot;
            const name = error && typeof error.name === 'string' ? error.name : 'Error';
            log.warn('MediaInputInventory.refresh: enumeration failed', {name});
            this._publish({status: 'error', devices: emptyDevices(), visibility: unknownVisibility(), error: name});
        }
        return this._snapshot;
    }

    /**
     * First subscriber starts observation; the last unsubscribe cancels pending results and observation.
     * @param {function(object): void} listener receives immutable inventory snapshots synchronously
     * @returns {function(): void} idempotent unsubscribe
     */
    subscribe (listener) {
        if (this._disposed) throw new Error('Media input inventory is disposed');
        const entry = {listener};
        this._listeners.add(entry);
        if (this._listeners.size === 1) this.refresh();
        return () => {
            if (!this._listeners.delete(entry) || this._listeners.size > 0) return;
            this._revision++;
            this._detach();
            if (this._snapshot.status === 'loading') {
                this._snapshot = Object.freeze({...this._snapshot, status: 'idle'});
            }
        };
    }

    dispose () {
        if (this._disposed) return;
        this._disposed = true;
        this._revision++;
        this._listeners.clear();
        this._detach();
        this._snapshot = Object.freeze({
            status: 'disposed', devices: emptyDevices(), visibility: unknownVisibility(), error: null
        });
    }
}

export default MediaInputInventory;
