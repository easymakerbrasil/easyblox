const {
    contextBridge,
    ipcRenderer
} = require('electron');

const PORTS_CHANNEL =
    'easyblox:serial-port-picker:ports';

const SELECT_CHANNEL =
    'easyblox:serial-port-picker:select';

const CANCEL_CHANNEL =
    'easyblox:serial-port-picker:cancel';

contextBridge.exposeInMainWorld(
    'easybloxSerialPortPicker',
    {
        onPorts:
            callback => {
                if (
                    typeof callback !==
                    'function'
                ) {
                    return;
                }

                ipcRenderer.once(
                    PORTS_CHANNEL,
                    (
                        event,
                        ports
                    ) => {
                        callback(
                            ports
                        );
                    }
                );
            },

        select:
            portId => {
                ipcRenderer.send(
                    SELECT_CHANNEL,
                    portId
                );
            },

        cancel:
            () => {
                ipcRenderer.send(
                    CANCEL_CHANNEL
                );
            }
    }
);
