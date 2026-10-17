
const {contextBridge, ipcRenderer} = require('electron');

const APP_INFO_CHANNEL = 'easyblox:desktop:get-app-info';
const CLOSE_REQUESTED_CHANNEL = 'easyblox:desktop:close-requested';
const CLOSE_RESOLVE_CHANNEL = 'easyblox:desktop:close-resolve';
const CLOSE_ACK_CHANNEL = 'easyblox:desktop:close-ack';

const CLOSE_DECISIONS = [
    'save',
    'discard',
    'cancel'
];

const isValidRequestId = requestId => (
    Number.isSafeInteger(requestId) &&
    requestId > 0
);

const isValidDecision = decision => (
    typeof decision === 'string' &&
    CLOSE_DECISIONS.includes(decision)
);

const url = new URL(location.href);

if (
    process.isMainFrame &&
    url.origin === 'http://127.0.0.1:8601' &&
    !url.username &&
    !url.password &&
    (
        url.pathname === '/' ||
        url.pathname === '/index.html'
    )
) {
    contextBridge.exposeInMainWorld('easybloxDesktop', {
        getAppInfo: (...args) => {
            if (args.length !== 0) {
                return Promise.reject(
                    new Error('DESKTOP_INVALID_ARGUMENTS')
                );
            }

            return ipcRenderer.invoke(APP_INFO_CHANNEL);
        },

        chooseProjectFile: filename => {
            if (
                typeof filename !== 'string' ||
                filename.length < 5 ||
                filename.length > 160 ||
                !filename.toLowerCase().endsWith('.sb3')
            ) {
                return Promise.reject(new Error('DESKTOP_SAVE_INVALID_FILENAME'));
            }
            return ipcRenderer.invoke(
                'easyblox:desktop:project-choose-file', filename
            );
        },

        writeProjectFile: (token, bytes) => {
            if (
                typeof token !== 'string' ||
                token.length === 0 ||
                !ArrayBuffer.isView(bytes) ||
                bytes.BYTES_PER_ELEMENT !== 1 ||
                bytes.byteLength === 0 ||
                bytes.byteLength > 256 * 1024 * 1024
            ) {
                return Promise.reject(new Error('DESKTOP_SAVE_INVALID_ARGUMENTS'));
            }
            return ipcRenderer.invoke(
                'easyblox:desktop:project-write-file', token, bytes
            );
        },

        onCloseRequested: callback => {
            if (typeof callback !== 'function') {
                throw new TypeError(
                    'DESKTOP_CLOSE_INVALID_CALLBACK'
                );
            }

            let active = true;

            const listener = (event, requestId) => {
                if (!active || !isValidRequestId(requestId)) {
                    return;
                }

                callback(requestId);
            };

            ipcRenderer.on(
                CLOSE_REQUESTED_CHANNEL,
                listener
            );

            return () => {
                if (!active) {
                    return;
                }

                active = false;

                ipcRenderer.removeListener(
                    CLOSE_REQUESTED_CHANNEL,
                    listener
                );
            };
        },

        onCloseDecision: callback => {
            if (typeof callback !== 'function') {
                throw new TypeError('DESKTOP_CLOSE_INVALID_CALLBACK');
            }
            let active = true;
            const listener = (event, requestId, decision) => {
                if (
                    !active ||
                    !isValidRequestId(requestId) ||
                    !isValidDecision(decision)
                ) return;
                callback(requestId, decision);
            };
            ipcRenderer.on('easyblox:desktop:close-decision', listener);
            return () => {
                if (!active) return;
                active = false;
                ipcRenderer.removeListener(
                    'easyblox:desktop:close-decision', listener
                );
            };
        },

        ackClose: requestId => {
            if (!isValidRequestId(requestId)) {
                return Promise.reject(
                    new Error('DESKTOP_CLOSE_INVALID_ARGUMENTS')
                );
            }

            return ipcRenderer.invoke(
                CLOSE_ACK_CHANNEL,
                requestId
            );
        },

        resolveClose: (requestId, decision) => {
            if (
                !isValidRequestId(requestId) ||
                !isValidDecision(decision)
            ) {
                return Promise.reject(
                    new Error('DESKTOP_CLOSE_INVALID_ARGUMENTS')
                );
            }

            return ipcRenderer.invoke(
                CLOSE_RESOLVE_CHANNEL,
                requestId,
                decision
            );
        }
    });
}
