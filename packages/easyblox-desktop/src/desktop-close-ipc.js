
const {isAllowedGuiUrl} = require('./desktop-app-info');
const {
    CLOSE_DECISIONS,
    createDesktopCloseController
} = require('./desktop-close-controller');

const GUI_ORIGIN = 'http://127.0.0.1:8601';
const CLOSE_REQUESTED_CHANNEL = 'easyblox:desktop:close-requested';
const CLOSE_RESOLVE_CHANNEL = 'easyblox:desktop:close-resolve';
const CLOSE_ACK_CHANNEL = 'easyblox:desktop:close-ack';

const registrations = new WeakMap();

const isValidRequestId = value => (
    Number.isSafeInteger(value) && value > 0
);

const isValidDecision = value => (
    Object.values(CLOSE_DECISIONS).includes(value)
);

const registerDesktopCloseIpc = (window, {
    onAuthorized,
    onAcknowledged,
    onResolved
} = {}) => {
    if (
        typeof onAuthorized !== 'function' ||
        (
            onAcknowledged !== undefined &&
            typeof onAcknowledged !== 'function'
        ) ||
        (
            onResolved !== undefined &&
            typeof onResolved !== 'function'
        )
    ) {
        throw new TypeError('DESKTOP_CLOSE_INVALID_CALLBACKS');
    }

    if (registrations.has(window)) {
        return registrations.get(window);
    }

    const contents = window.webContents;
    const ipc = contents.ipc;

    let disposed = false;
    let pendingFrame = null;
    let pendingRequestId = null;
    let acknowledgedRequestId = null;

    const isTrustedDocument = () => {
        if (
            disposed ||
            window.isDestroyed() ||
            contents.isDestroyed()
        ) {
            return false;
        }

        const frame = contents.mainFrame;

        return Boolean(
            frame &&
            frame.origin === GUI_ORIGIN &&
            isAllowedGuiUrl(frame.url) &&
            typeof contents.getURL === 'function' &&
            isAllowedGuiUrl(contents.getURL())
        );
    };

    const controller = createDesktopCloseController({
        onRequest: requestId => {
            if (!isTrustedDocument()) {
                throw new Error('DESKTOP_UNAUTHORIZED');
            }

            pendingFrame = contents.mainFrame;
            pendingRequestId = requestId;
            acknowledgedRequestId = null;

            try {
                contents.send(
                    CLOSE_REQUESTED_CHANNEL,
                    requestId
                );
            } catch (error) {
                pendingFrame = null;
                pendingRequestId = null;
                acknowledgedRequestId = null;
                throw error;
            }
        },

        onAuthorized: result => {
            if (
                !isTrustedDocument() ||
                pendingFrame !== contents.mainFrame
            ) {
                throw new Error('DESKTOP_UNAUTHORIZED');
            }

            onAuthorized(result);
        }
    });

    const authorize = event => {
        if (
            !isTrustedDocument() ||
            !event ||
            event.sender !== contents ||
            !event.senderFrame ||
            event.senderFrame !== contents.mainFrame
        ) {
            throw new Error('DESKTOP_UNAUTHORIZED');
        }
    };

    const handleAck = (event, ...args) => {
        authorize(event);

        if (
            args.length !== 1 ||
            !isValidRequestId(args[0])
        ) {
            throw new Error('DESKTOP_CLOSE_INVALID_ARGUMENTS');
        }

        const requestId = args[0];

        if (
            controller.getState() !== 'pending' ||
            pendingRequestId !== requestId ||
            pendingFrame !== contents.mainFrame ||
            acknowledgedRequestId === requestId
        ) {
            return {status: 'rejected'};
        }

        acknowledgedRequestId = requestId;

        if (onAcknowledged) {
            try {
                onAcknowledged(requestId);
            } catch (error) {
                console.error(
                    'EasyBlox close ACK notification failed:',
                    error
                );
            }
        }

        return {status: 'acknowledged'};
    };

    const handleResolve = (event, ...args) => {
        authorize(event);

        if (
            args.length !== 2 ||
            !isValidRequestId(args[0]) ||
            !isValidDecision(args[1])
        ) {
            throw new Error('DESKTOP_CLOSE_INVALID_ARGUMENTS');
        }

        const [requestId, decision] = args;

        if (pendingFrame !== contents.mainFrame) {
            controller.cancelPending();
            pendingFrame = null;

            return {status: 'rejected'};
        }

        const accepted = controller.resolveClose(
            requestId,
            decision
        );

        if (!accepted) {
            return {status: 'rejected'};
        }

        pendingFrame = null;
        pendingRequestId = null;
        acknowledgedRequestId = null;

        if (onResolved) {
            try {
                onResolved(requestId, decision);
            } catch (error) {
                console.error(
                    'EasyBlox close resolution notification failed:',
                    error
                );
            }
        }

        return {
            status: decision === CLOSE_DECISIONS.CANCEL ?
                'cancelled' :
                'authorized'
        };
    };

    const handleNavigation = (
        event,
        navigationInfo
    ) => {
        const info = navigationInfo || event;

        if (
            info &&
            (
                info.isMainFrame === false ||
                info.isSameDocument === true
            )
        ) {
            return;
        }

        controller.cancelPending();
        controller.resetAuthorized();
        pendingFrame = null;
        pendingRequestId = null;
        acknowledgedRequestId = null;
    };

    const cleanup = () => {
        if (disposed) {
            return;
        }

        disposed = true;
        pendingFrame = null;
        pendingRequestId = null;
        acknowledgedRequestId = null;

        controller.dispose();

        ipc.removeHandler(CLOSE_RESOLVE_CHANNEL);
        ipc.removeHandler(CLOSE_ACK_CHANNEL);

        contents.removeListener(
            'did-start-navigation',
            handleNavigation
        );

        contents.removeListener(
            'render-process-gone',
            cleanup
        );

        contents.removeListener(
            'destroyed',
            cleanup
        );

        window.removeListener(
            'closed',
            cleanup
        );

        registrations.delete(window);
    };

    const registration = Object.freeze({
        requestClose: () => controller.requestClose(),

        cancelPending: () => {
            pendingFrame = null;
            pendingRequestId = null;
            acknowledgedRequestId = null;

            return controller.cancelPending();
        },

        getState: () => controller.getState(),

        isAcknowledged: requestId => (
            !disposed &&
            isValidRequestId(requestId) &&
            controller.getState() === 'pending' &&
            pendingRequestId === requestId &&
            acknowledgedRequestId === requestId &&
            pendingFrame === contents.mainFrame &&
            isTrustedDocument()
        ),

        resetAuthorized: () => {
            if (disposed) {
                return false;
            }

            return controller.resetAuthorized();
        },

        dispose: cleanup
    });

    ipc.handle(
        CLOSE_RESOLVE_CHANNEL,
        handleResolve
    );

    ipc.handle(
        CLOSE_ACK_CHANNEL,
        handleAck
    );

    contents.on(
        'did-start-navigation',
        handleNavigation
    );

    contents.on(
        'render-process-gone',
        cleanup
    );

    contents.on(
        'destroyed',
        cleanup
    );

    window.on(
        'closed',
        cleanup
    );

    registrations.set(window, registration);

    return registration;
};

module.exports = {
    CLOSE_REQUESTED_CHANNEL,
    CLOSE_RESOLVE_CHANNEL,
    CLOSE_ACK_CHANNEL,
    registerDesktopCloseIpc
};
