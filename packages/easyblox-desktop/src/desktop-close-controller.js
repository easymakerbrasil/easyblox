
const CLOSE_STATES = Object.freeze({
    IDLE: 'idle',
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    DISPOSED: 'disposed'
});

const CLOSE_DECISIONS = Object.freeze({
    SAVE: 'save',
    DISCARD: 'discard',
    CANCEL: 'cancel'
});

const createDesktopCloseController = ({
    onRequest,
    onAuthorized
}) => {
    if (
        typeof onRequest !== 'function' ||
        typeof onAuthorized !== 'function'
    ) {
        throw new TypeError('DESKTOP_CLOSE_INVALID_CALLBACKS');
    }

    let state = CLOSE_STATES.IDLE;
    let generation = 0;
    let pendingId = null;

    const getState = () => state;

    const isPending = () => state === CLOSE_STATES.PENDING;

    const requestClose = () => {
        if (state !== CLOSE_STATES.IDLE) {
            return null;
        }

        const requestId = ++generation;

        state = CLOSE_STATES.PENDING;
        pendingId = requestId;

        try {
            onRequest(requestId);
        } catch (error) {
            pendingId = null;
            state = CLOSE_STATES.IDLE;
            throw error;
        }

        return requestId;
    };

    const resolveClose = (requestId, decision) => {
        if (
            state !== CLOSE_STATES.PENDING ||
            pendingId !== requestId
        ) {
            return false;
        }

        if (decision === CLOSE_DECISIONS.CANCEL) {
            pendingId = null;
            state = CLOSE_STATES.IDLE;
            return true;
        }

        if (
            decision !== CLOSE_DECISIONS.SAVE &&
            decision !== CLOSE_DECISIONS.DISCARD
        ) {
            return false;
        }

        pendingId = null;
        state = CLOSE_STATES.AUTHORIZED;

        try {
            onAuthorized({
                requestId,
                decision
            });
        } catch (error) {
            state = CLOSE_STATES.IDLE;
            throw error;
        }

        return true;
    };

    const cancelPending = () => {
        if (state !== CLOSE_STATES.PENDING) {
            return false;
        }

        pendingId = null;
        state = CLOSE_STATES.IDLE;

        return true;
    };

    const resetAuthorized = () => {
        if (state !== CLOSE_STATES.AUTHORIZED) {
            return false;
        }

        pendingId = null;
        state = CLOSE_STATES.IDLE;

        return true;
    };

    const dispose = () => {
        if (state === CLOSE_STATES.DISPOSED) {
            return;
        }

        pendingId = null;
        state = CLOSE_STATES.DISPOSED;
    };

    return Object.freeze({
        getState,
        isPending,
        requestClose,
        resolveClose,
        cancelPending,
        resetAuthorized,
        dispose
    });
};

module.exports = {
    CLOSE_STATES,
    CLOSE_DECISIONS,
    createDesktopCloseController
};
