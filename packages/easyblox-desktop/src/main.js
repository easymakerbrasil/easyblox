const path = require('node:path');

const {
    app,
    BrowserWindow,
    Menu
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

let hardwareServer = null;
let guiServer = null;
let mainWindow = null;
let shuttingDown = false;

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
                if (mainWindow) {
                    mainWindow.show();
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
