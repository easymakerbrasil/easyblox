const {isAllowedGuiUrl} = require('./desktop-app-info');

const GUI_ORIGIN = 'http://127.0.0.1:8601';
const sessions = new WeakMap();

const isGuiOrigin = value => {
    try {
        const url = new URL(value);
        return url.origin === GUI_ORIGIN && !url.username && !url.password &&
            url.pathname === '/' && !url.search && !url.hash;
    } catch {
        return false;
    }
};

const createPolicy = session => {
    const policy = {owner: null};
    const authorizeDocument = (contents, details) => {
        const owner = policy.owner;
        if (!owner || !owner.active || owner.window.isDestroyed() || owner.contents.isDestroyed() ||
            contents !== owner.contents || !details || details.isMainFrame !== true ||
            !owner.isGuiServerTrusted() || !isAllowedGuiUrl(details.requestingUrl)) return false;
        const frame = contents.mainFrame;
        return frame.origin === GUI_ORIGIN && isAllowedGuiUrl(frame.url) &&
            new URL(details.requestingUrl).href === new URL(frame.url).href &&
            (typeof details.securityOrigin === 'undefined' || isGuiOrigin(details.securityOrigin));
    };

    // Permission callbacks identify the requesting frame with details, not IPC senderFrame.
    session.setPermissionCheckHandler((contents, permission, requestingOrigin, details) => {
        if (!authorizeDocument(contents, details) || !isGuiOrigin(requestingOrigin)) return false;
        if (permission === 'serial') return true;
        return permission === 'media' && (details.mediaType === 'audio' || details.mediaType === 'video');
    });
    session.setPermissionRequestHandler((contents, permission, callback, details) => {
        let allowed = false;
        if (authorizeDocument(contents, details)) {
            if (permission === 'serial') {
                // Device grants and selection remain with Electron and select-serial-port.
                allowed = true;
            } else if (permission === 'media' && isGuiOrigin(details.securityOrigin)) {
                const types = details.mediaTypes;
                allowed = Array.isArray(types) && types.length > 0 && types.length <= 2 &&
                    new Set(types).size === types.length &&
                    types.every(type => type === 'audio' || type === 'video');
            }
        }
        callback(allowed);
    });
    return policy;
};

const registerMediaPermissions = (window, {isGuiServerTrusted}) => {
    const contents = window.webContents;
    const session = contents.session;
    let policy = sessions.get(session);
    if (!policy) {
        policy = createPolicy(session);
        sessions.set(session, policy);
    }
    if (policy.owner && policy.owner.window === window) return policy.owner.cleanup;
    if (policy.owner) policy.owner.cleanup();

    let disposed = false;
    let closeGeneration = 0;
    const owner = {window, contents, isGuiServerTrusted, active: true};
    const handleClose = event => {
        owner.active = false;
        const generation = ++closeGeneration;
        queueMicrotask(() => {
            if (!disposed && generation === closeGeneration && event.defaultPrevented) owner.active = true;
        });
    };
    const handlePreventUnload = event => {
        const generation = closeGeneration;
        queueMicrotask(() => {
            if (!disposed && generation === closeGeneration && !event.defaultPrevented) owner.active = true;
        });
    };
    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        owner.active = false;
        if (policy.owner === owner) policy.owner = null;
        window.removeListener('close', handleClose);
        window.removeListener('closed', cleanup);
        contents.removeListener('destroyed', cleanup);
        contents.removeListener('will-prevent-unload', handlePreventUnload);
        // Keep the session handlers denying requests; clearing them restores Electron's permissive defaults.
    };
    owner.cleanup = cleanup;
    policy.owner = owner;
    window.on('close', handleClose);
    window.on('closed', cleanup);
    contents.on('destroyed', cleanup);
    contents.on('will-prevent-unload', handlePreventUnload);
    return cleanup;
};

module.exports = {registerMediaPermissions};
