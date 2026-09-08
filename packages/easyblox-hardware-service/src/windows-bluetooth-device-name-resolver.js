const runProcess =
    require('./process-runner');

const REMOTE_ADDRESS_PATTERN =
    /&0&([0-9A-F]{12})_[0-9A-F]+$/i;

const ZERO_ADDRESS =
    '000000000000';

const extractRemoteBluetoothAddress =
    pnpId => {
        if (
            typeof pnpId !==
                'string'
        ) {
            return null;
        }

        const match =
            pnpId.match(
                REMOTE_ADDRESS_PATTERN
            );

        if (!match) {
            return null;
        }

        const address =
            match[1]
                .toUpperCase();

        if (
            address ===
                ZERO_ADDRESS
        ) {
            return null;
        }

        return address;
    };

const parseFriendlyName =
    stdout => {
        if (
            typeof stdout !==
                'string'
        ) {
            return null;
        }

        const expression =
            /^\s*FriendlyName\s+REG_SZ\s+(.+?)\s*$/gim;

        let match;

        while (
            (
                match =
                    expression.exec(
                        stdout
                    )
            ) !== null
        ) {
            const name =
                match[1]
                    .trim();

            if (
                name.length > 0
            ) {
                return name;
            }
        }

        return null;
    };

class WindowsBluetoothDeviceNameResolver {
    constructor ({
        processRunner =
            runProcess
    } = {}) {
        if (
            typeof processRunner !==
                'function'
        ) {
            throw new Error(
                'Windows Bluetooth device name resolver requires a process runner'
            );
        }

        this._processRunner =
            processRunner;
    }

    async resolve ({
        pnpId
    } = {}) {
        const address =
            extractRemoteBluetoothAddress(
                pnpId
            );

        if (!address) {
            return null;
        }

        const registryPath =
            (
                'HKLM\\SYSTEM\\CurrentControlSet\\Enum\\' +
                'BTHENUM\\DEV_' +
                address
            );

        let result;

        try {
            result =
                await this
                    ._processRunner(
                        'reg.exe',
                        [
                            'query',
                            registryPath,
                            '/s',
                            '/v',
                            'FriendlyName'
                        ]
                    );
        } catch (error) {
            return null;
        }

        return parseFriendlyName(
            result &&
            result.stdout
        );
    }
}

module.exports = {
    WindowsBluetoothDeviceNameResolver,
    extractRemoteBluetoothAddress
};
