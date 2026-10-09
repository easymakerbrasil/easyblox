const path = require('node:path');

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

        if (
            splashWindow &&
            !splashWindow.isDestroyed()
        ) {
            splashWindow.show();
        }
    };

const configureSerialPortSelection =
    window => {
        const serialSession =
            window.webContents.session;

        serialSession.on(
            'select-serial-port',
            (
                event,
                portList,
                webContents,
                callback
            ) => {
                event.preventDefault();

                if (
                    webContents !==
                    window.webContents
                ) {
                    callback('');
                    return;
                }

                showSerialPortPicker({
                    parent:
                        window,
                    ports:
                        portList
                })
                    .then(
                        portId => {
                            callback(
                                portId
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
            }
        );
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
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true
                }
            });

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
