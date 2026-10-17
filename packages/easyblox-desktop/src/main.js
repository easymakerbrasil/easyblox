const path = require('node:path');

const {registerDesktopAppInfo} = require('./desktop-app-info');
const {registerDesktopCloseIpc} = require('./desktop-close-ipc');
const {registerDesktopNativeSaveIpc} = require('./desktop-native-save-ipc');
const {registerMediaPermissions} = require('./media-permissions');

const {
    app,
    BrowserWindow,
    dialog,
    Menu,
    shell
} = require('electron');

const {
    BuildService,
    HardwareHttpServer,
    StageFirmwareManager,
    StageFirmwareProvider,
    ToolchainProvider,
    UploadService
} = require(
    '@easymaker/easyblox-hardware-service'
);

const {
    prepareArduinoRuntime
} = require('./arduino-runtime');

const GuiStaticServer =
    require('./gui-static-server');

const {
    showSerialPortPicker
} = require('./serial-port-picker');

const {
    DEFAULT_UPDATE_MANIFEST_URL,
    parseVersion,
    UpdateService
} = require('./update-service');

const GUI_BUILD_PATH =
    path.resolve(
        __dirname,
        '..',
        '..',
        'scratch-gui',
        'build'
    );

const GUI_URL =
    'http://127.0.0.1:8601';

const UPDATE_MANIFEST_URL =
    (
        !app.isPackaged &&
        process.env
            .EASYBLOX_UPDATE_MANIFEST_URL
    ) ?
        process.env
            .EASYBLOX_UPDATE_MANIFEST_URL :
        DEFAULT_UPDATE_MANIFEST_URL;

const WINDOWS_APP_USER_MODEL_ID =
    'br.com.easyblox.desktop';

const WINDOW_ICON_PATH =
    app.isPackaged ?
        path.join(
            process.resourcesPath,
            'icon.ico'
        ) :
        path.resolve(
            __dirname,
            '..',
            'build',
            'icon.ico'
        );

const SPLASH_HTML_PATH =
    app.isPackaged ?
        path.join(
            process.resourcesPath,
            'splash.html'
        ) :
        path.resolve(
            __dirname,
            '..',
            'build',
            'splash.html'
        );

let hardwareServer = null;
let guiServer = null;
let mainWindow = null;
let splashWindow = null;
let shuttingDown = false;
const serialSelections = new WeakMap();

const isGuiServerTrusted = () => {
    if (shuttingDown || !guiServer) return false;
    // Only the server bound by startDesktop is trusted; a service already occupying the port is never reused.
    const address = guiServer.address();
    return address.host === '127.0.0.1' && address.port === 8601;
};

const fillSplashVersion = async window => {
    const contents = window.webContents;
    if (window.isDestroyed() || contents.isDestroyed()) return;
    let timer;
    let cancel;
    try {
        const version = app.getVersion();
        parseVersion(version);
        const interrupted = new Promise((resolve, reject) => {
            cancel = () => resolve();
            window.once('closed', cancel);
            contents.once('destroyed', cancel);
            timer = setTimeout(() => reject(new Error('Splash version delivery timed out')), 3000);
        });
        await Promise.race([
            // Update only this local DOM while JavaScript in the page remains disabled.
            contents.executeJavaScriptInIsolatedWorld(1001, [{code: `
                const element = document.getElementById('splash-version');
                if (!element) throw new Error('Missing splash version element');
                element.textContent = ${JSON.stringify(`Versão ${version}`)};
            `}]),
            interrupted
        ]);
    } catch (error) {
        console.warn('EasyBlox fillSplashVersion failed', {reason: error.message});
    } finally {
        clearTimeout(timer);
        if (cancel) {
            window.removeListener('closed', cancel);
            contents.removeListener('destroyed', cancel);
        }
    }
};

const createSplashWindow =
    async () => {
        splashWindow =
            new BrowserWindow({
                width: 560,
                height: 340,
                resizable: false,
                minimizable: false,
                maximizable: false,
                fullscreenable: false,
                frame: false,
                show: false,
                skipTaskbar: true,
                backgroundColor:
                    '#282828',
                icon:
                    WINDOW_ICON_PATH,
                webPreferences: {
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true,
                    javascript: false
                }
            });

        splashWindow.center();

        splashWindow.on(
            'closed',
            () => {
                splashWindow = null;
            }
        );

        await splashWindow.loadFile(
            SPLASH_HTML_PATH
        );

        const window = splashWindow;
        if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return;
        await fillSplashVersion(window);

        if (
            !window.isDestroyed() &&
            !window.webContents.isDestroyed()
        ) {
            window.show();
        }
    };

const configureSerialPortSelection =
    window => {
        const serialSession =
            window.webContents.session;

        const previous = serialSelections.get(serialSession);
        if (previous) previous();
        let active = true;

        const selectPort = (
            event,
            portList,
            webContents,
            callback
        ) => {
            event.preventDefault();

            if (
                !active || window.isDestroyed() || window.webContents.isDestroyed() ||
                webContents !== window.webContents
            ) {
                callback('');
                return;
            }

            showSerialPortPicker({
                parent: window,
                ports: portList
            })
                .then(
                    portId => {
                        callback(
                            !active || window.isDestroyed() || window.webContents.isDestroyed() ? '' : portId
                        );
                    }
                )
                .catch(
                    error => {
                        console.error(
                            `EasyBlox serial port selection failed: ${error.message}`
                        );

                        callback('');
                    }
                );
        };
        const cleanup = () => {
            active = false;
            serialSession.removeListener('select-serial-port', selectPort);
            window.removeListener('closed', cleanup);
            window.webContents.removeListener('destroyed', cleanup);
            if (serialSelections.get(serialSession) === cleanup) serialSelections.delete(serialSession);
        };
        serialSelections.set(serialSession, cleanup);
        serialSession.on('select-serial-port', selectPort);
        window.on('closed', cleanup);
        window.webContents.on('destroyed', cleanup);
    };

const showUpdateAvailableDialog =
    async updateResult => {
        if (
            !mainWindow ||
            mainWindow.isDestroyed()
        ) {
            return;
        }

        const {
            response
        } =
            await dialog.showMessageBox(
                mainWindow,
                {
                    type:
                        'info',
                    title:
                        'Atualização disponível',
                    message:
                        'Uma nova versão do EasyBlox está disponível.',
                    detail:
                        `Versão instalada: ${updateResult.currentVersion}\n` +
                        `Nova versão: ${updateResult.manifest.version}\n\n` +
                        'Deseja baixar a atualização agora?',
                    buttons: [
                        'Baixar atualização',
                        'Agora não'
                    ],
                    defaultId:
                        0,
                    cancelId:
                        1,
                    noLink:
                        true
                }
            );

        if (
            response !==
            0
        ) {
            return;
        }

        try {
            await shell.openExternal(
                updateResult
                    .manifest
                    .downloadUrl
            );
        } catch (error) {
            console.error(
                `EasyBlox failed to open update download: ${error.message}`
            );
        }
    };

const checkForUpdates =
    async () => {
        if (
            !app.isPackaged &&
            !process.env
                .EASYBLOX_UPDATE_MANIFEST_URL
        ) {
            return;
        }

        const updateService =
            new UpdateService({
                fetchImpl:
                    globalThis.fetch,
                manifestUrl:
                    UPDATE_MANIFEST_URL
            });

        let updateResult;

        try {
            updateResult =
                await updateService.check(
                    app.getVersion()
                );
        } catch (error) {
            console.warn(
                `EasyBlox update check skipped: ${error.message}`
            );
            return;
        }

        if (
            !updateResult.available
        ) {
            return;
        }

        await showUpdateAvailableDialog(
            updateResult
        );
    };

const createMainWindow =
    async () => {
        mainWindow =
            new BrowserWindow({
                width: 1440,
                height: 900,
                minWidth: 1100,
                minHeight: 700,
                show: false,
                autoHideMenuBar: true,
                backgroundColor:
                    '#282828',
                title:
                    'EasyBlox',
                icon:
                    WINDOW_ICON_PATH,
                webPreferences: {
                    preload: path.join(__dirname, 'desktop-preload.js'),
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true
                }
            });

        registerDesktopAppInfo(mainWindow, app);
        registerDesktopNativeSaveIpc(mainWindow, {dialog});
        registerMediaPermissions(mainWindow, {isGuiServerTrusted});

        const closingWindow = mainWindow;
        let closeAuthorized = false;
        let authorizedCloseEvent = null;
        let closeAckTimer = null;
        let closeAckRequestId = null;

        const clearCloseAckTimer = () => {
            if (closeAckTimer !== null) {
                clearTimeout(closeAckTimer);
                closeAckTimer = null;
            }

            closeAckRequestId = null;
        };

        const closeRegistration = registerDesktopCloseIpc(
            closingWindow,
            {
                onAcknowledged: requestId => {
                    if (closeAckRequestId === requestId) {
                        clearCloseAckTimer();
                    }

                    const isStillPending = () => (
                        !closingWindow.isDestroyed() &&
                        !closingWindow.webContents.isDestroyed() &&
                        closeRegistration.getState() === 'pending' &&
                        closeRegistration.isAcknowledged(requestId)
                    );

                    Promise.resolve()
                        .then(() => {
                            if (!isStillPending()) return null;
                            return dialog.showMessageBox(closingWindow, {
                                type: 'warning',
                                title: 'Alterações não salvas',
                                message: 'Deseja salvar o projeto antes de fechar o EasyBlox?',
                                buttons: ['Salvar', 'Não salvar', 'Cancelar'],
                                defaultId: 0,
                                cancelId: 2,
                                noLink: true
                            });
                        })
                        .then(result => {
                            if (!result || !isStillPending()) return;
                            const choices = ['save', 'discard', 'cancel'];
                            closingWindow.webContents.send(
                                'easyblox:desktop:close-decision',
                                requestId,
                                choices[result.response] || 'cancel'
                            );
                        })
                        .catch(error => {
                            console.error('EasyBlox close dialog failed:', error);
                            if (isStillPending()) {
                                closeRegistration.cancelPending();
                            }
                        });
                },

                onResolved: requestId => {
                    if (closeAckRequestId === requestId) {
                        clearCloseAckTimer();
                    }
                },

                onAuthorized: () => {
                    clearCloseAckTimer();
                    if (
                        closingWindow.isDestroyed() ||
                        closingWindow.webContents.isDestroyed()
                    ) {
                        return;
                    }

                    closeAuthorized = true;
                    authorizedCloseEvent = null;

                    try {
                        closingWindow.close();

                        if (
                            !authorizedCloseEvent ||
                            authorizedCloseEvent.defaultPrevented
                        ) {
                            closeAuthorized = false;
                            authorizedCloseEvent = null;
                            closeRegistration.resetAuthorized();
                        }
                    } catch (error) {
                        closeAuthorized = false;
                        authorizedCloseEvent = null;
                        closeRegistration.resetAuthorized();
                        throw error;
                    }
                }
            }
        );

        closingWindow.on('close', event => {
            if (
                closeAuthorized &&
                closeRegistration.getState() === 'authorized'
            ) {
                authorizedCloseEvent = event;
                return;
            }

            closeAuthorized = false;
            authorizedCloseEvent = null;

            event.preventDefault();

            try {
                const requestId = closeRegistration.requestClose();

                if (
                    requestId !== null &&
                    closeRegistration.getState() === 'pending' &&
                    !closeRegistration.isAcknowledged(requestId)
                ) {
                    clearCloseAckTimer();
                    closeAckRequestId = requestId;

                    closeAckTimer = setTimeout(() => {
                        if (closeAckRequestId !== requestId) {
                            return;
                        }

                        clearCloseAckTimer();

                        if (
                            closeRegistration.getState() === 'pending' &&
                            !closeRegistration.isAcknowledged(requestId)
                        ) {
                            closeRegistration.cancelPending();
                        }
                    }, 5000);
                }
            } catch (error) {
                clearCloseAckTimer();

                console.error(
                    `EasyBlox close request failed: ${error.message}`
                );
            }
        });

        closingWindow.webContents.on(
            'will-prevent-unload',
            event => {
                if (
                    closeAuthorized &&
                    closeRegistration.getState() === 'authorized'
                ) {
                    event.preventDefault();
                }
            }
        );

        closingWindow.on('closed', clearCloseAckTimer);

        closingWindow.webContents.on(
            'destroyed',
            clearCloseAckTimer
        );

        configureSerialPortSelection(
            mainWindow
        );

        mainWindow.once(
            'ready-to-show',
            () => {
                if (
                    splashWindow &&
                    !splashWindow.isDestroyed()
                ) {
                    splashWindow.close();
                    splashWindow = null;
                }

                if (mainWindow) {
                    mainWindow.show();

                    checkForUpdates()
                        .catch(
                            error => {
                                console.error(
                                    `EasyBlox update notification failed: ${error.message}`
                                );
                            }
                        );
                }
            }
        );

        mainWindow.on(
            'closed',
            () => {
                mainWindow = null;
            }
        );

        await mainWindow.loadURL(
            GUI_URL
        );
    };

const startDesktop =
    async () => {
        Menu.setApplicationMenu(
            null
        );

        await createSplashWindow();

        const arduinoRuntime =
            await prepareArduinoRuntime({
                isPackaged:
                    app.isPackaged,
                resourcesPath:
                    process.resourcesPath,
                userDataPath:
                    app.getPath(
                        'userData'
                    ),
                env:
                    process.env
            });

        if (arduinoRuntime) {
            const toolchainProvider =
                new ToolchainProvider({
                    cliPath:
                        arduinoRuntime.cliPath,
                    configPath:
                        arduinoRuntime.configPath
                });

            const buildService =
                new BuildService({
                    toolchainProvider
                });

            const uploadService =
                new UploadService({
                    toolchainProvider
                });

            const stageFirmwareProvider =
                new StageFirmwareProvider({
                    arduinoUnoStagePath:
                        arduinoRuntime
                            .stageFirmwarePath
                });

            const stageFirmwareManager =
                new StageFirmwareManager({
                    provider:
                        stageFirmwareProvider,
                    buildService,
                    uploadService
                });

            hardwareServer =
                new HardwareHttpServer({
                    buildService,
                    uploadService,
                    stageFirmwareManager
                });

            console.log(
                `EasyBlox Arduino runtime: ${arduinoRuntime.runtimeRoot}`
            );
        } else {
            hardwareServer =
                new HardwareHttpServer();
        }

        const hardwareAddress =
            await hardwareServer.listen();

        console.log(
            `EasyBlox Hardware Service listening on http://${hardwareAddress.host}:${hardwareAddress.port}`
        );

        guiServer =
            new GuiStaticServer({
                rootPath:
                    GUI_BUILD_PATH
            });

        const guiAddress =
            await guiServer.listen();

        console.log(
            `EasyBlox GUI listening on http://${guiAddress.host}:${guiAddress.port}`
        );

        await createMainWindow();

        console.log(
            `EasyBlox Desktop ${app.getVersion()} host initialized`
        );
    };

const shutdownDesktop =
    async () => {
        if (shuttingDown) {
            return;
        }

        shuttingDown = true;

        if (guiServer) {
            await guiServer.close();
            guiServer = null;
        }

        if (hardwareServer) {
            await hardwareServer.close();
            hardwareServer = null;
        }

        app.quit();
    };

if (
    process.platform ===
        'win32'
) {
    app.setAppUserModelId(
        WINDOWS_APP_USER_MODEL_ID
    );
}

app.whenReady()
    .then(
        startDesktop
    )
    .catch(
        error => {
            console.error(
                `EasyBlox Desktop failed to start: ${error.message}`
            );

            app.quit();
        }
    );

app.on(
    'window-all-closed',
    () => {
        shutdownDesktop()
            .catch(
                error => {
                    console.error(
                        `EasyBlox Desktop failed to shut down cleanly: ${error.message}`
                    );

                    app.quit();
                }
            );
    }
);
