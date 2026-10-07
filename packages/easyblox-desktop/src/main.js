const path = require('node:path');

const {
    app,
    BrowserWindow,
    Menu
} = require('electron');

const GuiStaticServer =
    require('./gui-static-server');

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

let guiServer = null;
let mainWindow = null;
let shuttingDown = false;

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
                webPreferences: {
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true
                }
            });

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

        guiServer =
            new GuiStaticServer({
                rootPath:
                    GUI_BUILD_PATH
            });

        const address =
            await guiServer.listen();

        console.log(
            `EasyBlox GUI listening on http://${address.host}:${address.port}`
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

        app.quit();
    };

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
