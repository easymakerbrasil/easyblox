const {contextBridge, ipcRenderer} = require('electron');

const url = new URL(location.href);
if (process.isMainFrame && url.origin === 'http://127.0.0.1:8601' &&
    !url.username && !url.password && (url.pathname === '/' || url.pathname === '/index.html')) {
    contextBridge.exposeInMainWorld('easybloxDesktop', {
        getAppInfo: (...args) => {
            if (args.length !== 0) return Promise.reject(new Error('DESKTOP_INVALID_ARGUMENTS'));
            return ipcRenderer.invoke('easyblox:desktop:get-app-info');
        }
    });
}
