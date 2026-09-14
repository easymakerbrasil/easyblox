class SerialPortAdapter {
    constructor ({SerialPortClass} = {}) {
        this._SerialPortClass =
            SerialPortClass ||
            require('serialport').SerialPort;
    }

    async list () {
        const ports =
            await this._SerialPortClass.list();

        return ports.map(port => ({
            path: port.path,
            label:
                port.friendlyName ||
                port.manufacturer ||
                port.path,
            ...(
                typeof port.pnpId === 'string' &&
                port.pnpId.length > 0 ?
                    {
                        pnpId:
                            port.pnpId
                    } :
                    {}
            )
        }));
    }

    createPort ({
        path,
        baudRate
    }) {
        if (
            typeof path !== 'string' ||
            path.length === 0
        ) {
            throw new Error(
                'Serial port path must be a non-empty string'
            );
        }

        if (
            !Number.isInteger(baudRate) ||
            baudRate <= 0
        ) {
            throw new Error(
                'Serial port baud rate must be a positive integer'
            );
        }

        return new this._SerialPortClass({
            path,
            baudRate,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            autoOpen: false
        });
    }
}

module.exports = SerialPortAdapter;
