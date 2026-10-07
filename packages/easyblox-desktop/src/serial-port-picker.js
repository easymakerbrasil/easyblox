const path = require('node:path');

const {
    BrowserWindow,
    ipcMain
} = require('electron');

const PORTS_CHANNEL =
    'easyblox:serial-port-picker:ports';

const SELECT_CHANNEL =
    'easyblox:serial-port-picker:select';

const CANCEL_CHANNEL =
    'easyblox:serial-port-picker:cancel';

const normalizeText =
    value => {
        if (
            typeof value === 'string'
        ) {
            return value;
        }

        if (
            typeof value === 'number'
        ) {
            return String(value);
        }

        return '';
    };

const normalizePort =
    port => ({
        portId:
            normalizeText(
                port.portId
            ),
        portName:
            normalizeText(
                port.portName
            ),
        displayName:
            normalizeText(
                port.displayName
            ),
        vendorId:
            normalizeText(
                port.vendorId
            ),
        productId:
            normalizeText(
                port.productId
            )
    });

const showSerialPortPicker =
    ({
        parent,
        ports
    }) => {
        const normalizedPorts =
            Array.isArray(ports) ?
                ports
                    .map(
                        normalizePort
                    )
                    .filter(
                        port =>
                            port.portId.length >
                            0
                    ) :
                [];

        return new Promise(
            resolve => {
                let settled =
                    false;

                const pickerWindow =
                    new BrowserWindow({
                        parent,
                        modal: true,
                        width: 560,
                        height: 440,
                        minWidth: 560,
                        minHeight: 440,
                        maxWidth: 560,
                        maxHeight: 440,
                        resizable: false,
                        minimizable: false,
                        maximizable: false,
                        fullscreenable: false,
                        show: false,
                        frame: false,
                        skipTaskbar: true,
                        autoHideMenuBar: true,
                        backgroundColor:
                            '#f4f4f4',
                        title:
                            'Selecionar porta serial',
                        webPreferences: {
                            preload:
                                path.join(
                                    __dirname,
                                    'serial-port-picker-preload.js'
                                ),
                            contextIsolation:
                                true,
                            nodeIntegration:
                                false,
                            sandbox:
                                true
                        }
                    });

                const cleanup =
                    () => {
                        ipcMain.removeListener(
                            SELECT_CHANNEL,
                            handleSelect
                        );

                        ipcMain.removeListener(
                            CANCEL_CHANNEL,
                            handleCancel
                        );
                    };

                const finish =
                    portId => {
                        if (
                            settled
                        ) {
                            return;
                        }

                        settled =
                            true;

                        cleanup();

                        if (
                            !pickerWindow.isDestroyed()
                        ) {
                            pickerWindow.close();
                        }

                        resolve(
                            portId
                        );
                    };

                const handleSelect =
                    (
                        event,
                        portId
                    ) => {
                        if (
                            event.sender !==
                            pickerWindow.webContents
                        ) {
                            return;
                        }

                        const normalizedPortId =
                            normalizeText(
                                portId
                            );

                        const exists =
                            normalizedPorts.some(
                                port =>
                                    port.portId ===
                                    normalizedPortId
                            );

                        finish(
                            exists ?
                                normalizedPortId :
                                ''
                        );
                    };

                const handleCancel =
                    event => {
                        if (
                            event.sender !==
                            pickerWindow.webContents
                        ) {
                            return;
                        }

                        finish('');
                    };

                ipcMain.on(
                    SELECT_CHANNEL,
                    handleSelect
                );

                ipcMain.on(
                    CANCEL_CHANNEL,
                    handleCancel
                );

                pickerWindow.once(
                    'ready-to-show',
                    () => {
                        if (
                            !pickerWindow.isDestroyed()
                        ) {
                            pickerWindow.show();
                        }
                    }
                );

                pickerWindow.on(
                    'closed',
                    () => {
                        if (
                            settled
                        ) {
                            return;
                        }

                        settled =
                            true;

                        cleanup();

                        resolve('');
                    }
                );

                pickerWindow.webContents.once(
                    'did-finish-load',
                    () => {
                        if (
                            pickerWindow.isDestroyed()
                        ) {
                            return;
                        }

                        pickerWindow.webContents.send(
                            PORTS_CHANNEL,
                            normalizedPorts
                        );
                    }
                );

                pickerWindow
                    .loadFile(
                        path.join(
                            __dirname,
                            'serial-port-picker.html'
                        )
                    )
                    .catch(
                        error => {
                            console.error(
                                `EasyBlox serial port picker failed to load: ${error.message}`
                            );

                            finish('');
                        }
                    );
            }
        );
    };

module.exports = {
    showSerialPortPicker
};
