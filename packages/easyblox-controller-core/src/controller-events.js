class ControllerEvents {
    constructor () {
        this._listeners = new Map();
    }

    on (eventName, listener) {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }

        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, []);
        }

        this._listeners.get(eventName).push(listener);
    }

    off (eventName, listener) {
        const listeners = this._listeners.get(eventName);

        if (!listeners) {
            return false;
        }

        const listenerIndex = listeners.indexOf(listener);

        if (listenerIndex === -1) {
            return false;
        }

        listeners.splice(listenerIndex, 1);

        if (listeners.length === 0) {
            this._listeners.delete(eventName);
        }

        return true;
    }

    emit (eventName, payload) {
        const listeners = this._listeners.get(eventName);

        if (!listeners) {
            return;
        }

        for (const listener of [...listeners]) {
            listener(payload);
        }
    }
}

module.exports = {
    ControllerEvents
};
