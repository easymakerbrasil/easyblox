// Desktop-only adapter: a File System Access-shaped handle backed by the
// Electron save dialog and a per-window, opaque save token.
const createEasyBloxDesktopFilePicker = desktop => async options => {
    const requestedName = options && options.suggestedName ?
        options.suggestedName : 'Projeto.sb3';
    const selection = await desktop.chooseProjectFile(requestedName);
    if (!selection || selection.cancelled) {
        throw new DOMException('File selection cancelled', 'AbortError');
    }
    if (
        typeof selection.token !== 'string' ||
        typeof selection.name !== 'string'
    ) {
        throw new Error('DESKTOP_SAVE_INVALID_SELECTION');
    }

    return {
        name: selection.name,
        createWritable: async () => {
            let content = null;
            let closed = false;
            return {
                write: async value => {
                    if (closed) throw new Error('DESKTOP_SAVE_WRITER_CLOSED');
                    if (value && typeof value.arrayBuffer === 'function') {
                        content = new Uint8Array(await value.arrayBuffer());
                    } else if (value instanceof ArrayBuffer) {
                        content = new Uint8Array(value);
                    } else if (value instanceof Uint8Array) {
                        content = value;
                    } else {
                        throw new TypeError('DESKTOP_SAVE_INVALID_CONTENT');
                    }
                },
                close: async () => {
                    if (closed || !content) {
                        throw new Error('DESKTOP_SAVE_WRITER_EMPTY');
                    }
                    closed = true;
                    const result = await desktop.writeProjectFile(
                        selection.token,
                        content
                    );
                    if (!result || result.status !== 'saved') {
                        throw new Error('DESKTOP_SAVE_NOT_CONFIRMED');
                    }
                    content = null;
                },
                abort: async () => {
                    closed = true;
                    content = null;
                }
            };
        }
    };
};

export default createEasyBloxDesktopFilePicker;