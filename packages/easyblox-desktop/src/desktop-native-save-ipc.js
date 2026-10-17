'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {isAllowedGuiUrl} = require('./desktop-app-info');

const GUI_ORIGIN = 'http://127.0.0.1:8601';
const CHOOSE_CHANNEL = 'easyblox:desktop:project-choose-file';
const WRITE_CHANNEL = 'easyblox:desktop:project-write-file';
const MAX_PROJECT_BYTES = 256 * 1024 * 1024;

const registerDesktopNativeSaveIpc = (window, {dialog}) => {
    if (!dialog || typeof dialog.showSaveDialog !== 'function') {
        throw new TypeError('DESKTOP_SAVE_INVALID_DIALOG');
    }

    const contents = window.webContents;
    const ipc = contents.ipc;
    const tokens = new Map();
    let disposed = false;

    const isTrusted = event => {
        const frame = contents.mainFrame;
        return !disposed &&
            !window.isDestroyed() &&
            !contents.isDestroyed() &&
            event &&
            event.sender === contents &&
            event.senderFrame === frame &&
            frame &&
            frame.origin === GUI_ORIGIN &&
            isAllowedGuiUrl(frame.url) &&
            typeof contents.getURL === 'function' &&
            isAllowedGuiUrl(contents.getURL());
    };

    const authorize = event => {
        if (!isTrusted(event)) throw new Error('DESKTOP_UNAUTHORIZED');
    };

    const choose = async (event, filename) => {
        authorize(event);
        if (
            typeof filename !== 'string' ||
            filename.length < 5 ||
            filename.length > 160 ||
            !filename.toLowerCase().endsWith('.sb3')
        ) {
            throw new Error('DESKTOP_SAVE_INVALID_FILENAME');
        }

        const safeFilename = filename.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
        const result = await dialog.showSaveDialog(window, {
            title: 'Salvar projeto EasyBlox',
            defaultPath: safeFilename,
            buttonLabel: 'Salvar',
            filters: [{name: 'Projeto EasyBlox', extensions: ['sb3']}],
            properties: ['createDirectory', 'showOverwriteConfirmation']
        });

        if (!isTrusted(event)) throw new Error('DESKTOP_UNAUTHORIZED');
        if (!result || result.canceled || !result.filePath) {
            return {cancelled: true};
        }
        if (path.extname(result.filePath).toLowerCase() !== '.sb3') {
            throw new Error('DESKTOP_SAVE_INVALID_EXTENSION');
        }

        const token = randomUUID();
        tokens.set(token, result.filePath);
        return {
            cancelled: false,
            token,
            name: path.basename(result.filePath)
        };
    };

    const write = async (event, token, data) => {
        authorize(event);
        if (
            typeof token !== 'string' ||
            !tokens.has(token) ||
            !(data instanceof Uint8Array) ||
            data.byteLength === 0 ||
            data.byteLength > MAX_PROJECT_BYTES
        ) {
            throw new Error('DESKTOP_SAVE_INVALID_ARGUMENTS');
        }

        const targetPath = tokens.get(token);
        const tempPath = path.join(
            path.dirname(targetPath),
            `.${path.basename(targetPath)}.${randomUUID()}.tmp`
        );
        try {
            await fs.writeFile(tempPath, Buffer.from(data), {flag: 'wx'});
            if (!isTrusted(event) || tokens.get(token) !== targetPath) {
                throw new Error('DESKTOP_UNAUTHORIZED');
            }
            await fs.rename(tempPath, targetPath);
            return {status: 'saved'};
        } catch (error) {
            await fs.unlink(tempPath).catch(() => {});
            throw error;
        }
    };

    const invalidateTokens = () => tokens.clear();
    const handleNavigation = (event, navigationInfo) => {
        const info = navigationInfo || event;
        if (
            info &&
            (info.isMainFrame === false || info.isSameDocument === true)
        ) return;
        invalidateTokens();
    };
    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        invalidateTokens();
        ipc.removeHandler(CHOOSE_CHANNEL);
        ipc.removeHandler(WRITE_CHANNEL);
        contents.removeListener('did-start-navigation', handleNavigation);
        contents.removeListener('destroyed', cleanup);
        window.removeListener('closed', cleanup);
    };

    ipc.handle(CHOOSE_CHANNEL, choose);
    ipc.handle(WRITE_CHANNEL, write);
    contents.on('did-start-navigation', handleNavigation);
    contents.on('destroyed', cleanup);
    window.on('closed', cleanup);
    return {dispose: cleanup};
};

module.exports = {
    registerDesktopNativeSaveIpc,
    CHOOSE_CHANNEL,
    WRITE_CHANNEL
};