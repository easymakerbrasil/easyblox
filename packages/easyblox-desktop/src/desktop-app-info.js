const APP_INFO_CHANNEL = 'easyblox:desktop:get-app-info';
const GUI_ORIGIN = 'http://127.0.0.1:8601';
const registrations = new WeakMap();

const isAllowedGuiUrl = value => {
    try {
        const url = new URL(value);
        return url.origin === GUI_ORIGIN &&
            !url.username && !url.password &&
            (url.pathname === '/' || url.pathname === '/index.html');
    } catch {
        return false;
    }
};

const registerDesktopAppInfo = (window, app) => {
    if (registrations.has(window)) return registrations.get(window);

    const contents = window.webContents;
    const ipc = contents.ipc;
    let active = true;
    let disposed = false;
    let closeGeneration = 0;

    const authorize = event => {
        if (!active || window.isDestroyed() || contents.isDestroyed() ||
            event.sender !== contents || !event.senderFrame ||
            event.senderFrame !== contents.mainFrame ||
            event.senderFrame.origin !== GUI_ORIGIN ||
            !isAllowedGuiUrl(event.senderFrame.url)) {
            throw new Error('DESKTOP_UNAUTHORIZED');
        }
    };

    const handleAppInfo = (event, ...args) => {
        authorize(event);
        if (args.length !== 0) throw new Error('DESKTOP_UNAUTHORIZED');

        const productName = app.getName();
        const version = app.getVersion();
        if (typeof productName !== 'string' || !productName.trim() ||
            typeof version !== 'string' || !version.trim() || typeof app.isPackaged !== 'boolean') {
            throw new Error('DESKTOP_INVALID_APP_INFO');
        }
        return {productName, version, platform: process.platform, isPackaged: app.isPackaged};
    };

    const handleNavigation = event => {
        if (event.isMainFrame === false) return;
        if (!isAllowedGuiUrl(event.url)) event.preventDefault();
    };

    const handleClose = event => {
        active = false;
        const generation = ++closeGeneration;
        // Other close listeners may cancel closing after this listener runs.
        queueMicrotask(() => {
            if (!disposed && generation === closeGeneration && event.defaultPrevented) active = true;
        });
    };

    const handlePreventUnload = event => {
        const generation = closeGeneration;
        // Electron cancels closing unless a listener overrides beforeunload.
        queueMicrotask(() => {
            if (!disposed && generation === closeGeneration && !event.defaultPrevented) active = true;
        });
    };

    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        active = false;
        ipc.removeHandler(APP_INFO_CHANNEL);
        contents.removeListener('will-navigate', handleNavigation);
        contents.removeListener('will-redirect', handleNavigation);
        contents.removeListener('will-prevent-unload', handlePreventUnload);
        window.removeListener('close', handleClose);
        window.removeListener('closed', cleanup);
        registrations.delete(window);
    };

    ipc.handle(APP_INFO_CHANNEL, handleAppInfo);
    contents.on('will-navigate', handleNavigation);
    contents.on('will-redirect', handleNavigation);
    contents.on('will-prevent-unload', handlePreventUnload);
    contents.setWindowOpenHandler(() => ({action: 'deny'}));
    window.on('close', handleClose);
    window.on('closed', cleanup);
    registrations.set(window, cleanup);
    return cleanup;
};

module.exports = {APP_INFO_CHANNEL, isAllowedGuiUrl, registerDesktopAppInfo};
