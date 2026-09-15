const {
    EASYCONECT_CONNECTION_STATES,
    EasyConectConnection
} = require(
    '@easymaker/easyconect-core'
);

const {
    EasyConectWindowsBluetoothAdapter
} = require('../src');

const CONNECT_TIMEOUT_MS =
    8000;

const normalize =
    value =>
        value
            .trim()
            .toLowerCase();

const selectDevice =
    (
        devices,
        requestedName
    ) => {
        if (devices.length === 0) {
            throw new Error(
                'No paired EasyConect Bluetooth SPP devices were found'
            );
        }

        if (!requestedName) {
            if (devices.length === 1) {
                return devices[0];
            }

            throw new Error(
                'More than one compatible device was found; pass its friendly name as the first argument'
            );
        }

        const requested =
            normalize(
                requestedName
            );

        const matches =
            devices.filter(
                device =>
                    normalize(
                        device.name
                    ) ===
                    requested
            );

        if (matches.length === 0) {
            throw new Error(
                `No compatible device named "${requestedName}" was found`
            );
        }

        if (matches.length > 1) {
            throw new Error(
                `More than one compatible device named "${requestedName}" was found`
            );
        }

        return matches[0];
    };

const connectWithTimeout =
    async (
        connection,
        deviceId
    ) => {
        let timedOut =
            false;

        const timer =
            setTimeout(
                () => {
                    timedOut =
                        true;

                    connection
                        .disconnect()
                        .catch(
                            () => {}
                        );
                },
                CONNECT_TIMEOUT_MS
            );

        try {
            await connection.connect({
                deviceId
            });
        } catch (error) {
            if (timedOut) {
                throw new Error(
                    `EasyConect EBCP handshake timed out after ${CONNECT_TIMEOUT_MS} ms`
                );
            }

            throw error;
        } finally {
            clearTimeout(
                timer
            );
        }
    };

const main =
    async () => {
        const requestedName =
            process.argv[2] || '';

        const adapter =
            new EasyConectWindowsBluetoothAdapter();

        console.log(
            'Discovering paired Bluetooth SPP devices...'
        );

        const devices =
            await adapter.listDevices();

        if (devices.length === 0) {
            console.log(
                'No compatible devices found.'
            );
        } else {
            console.log(
                'Compatible devices:'
            );

            devices.forEach(
                device => {
                    console.log(
                        `- ${device.name}`
                    );
                }
            );
        }

        const device =
            selectDevice(
                devices,
                requestedName
            );

        console.log(
            `Selected: ${device.name}`
        );

        const connection =
            new EasyConectConnection({
                transport:
                    adapter
            });

        connection.onStateChange(
            state => {
                console.log(
                    `State: ${state}`
                );
            }
        );

        connection.onError(
            error => {
                console.error(
                    `Transport error: ${error.message}`
                );
            }
        );

        connection.onDisconnect(
            () => {
                console.error(
                    'Unexpected physical disconnect'
                );
            }
        );

        try {
            console.log(
                'Opening Bluetooth SPP and starting EBCP handshake...'
            );

            await connectWithTimeout(
                connection,
                device.deviceId
            );

            if (
                connection.getState() !==
                EASYCONECT_CONNECTION_STATES
                    .CONNECTED
            ) {
                throw new Error(
                    'EasyConect did not reach the connected state'
                );
            }

            console.log(
                'PASS: EBCP HELLO/HELLO_ACK session established'
            );

            const disconnected =
                await connection.disconnect();

            if (!disconnected) {
                throw new Error(
                    'EasyConect explicit disconnect was not performed'
                );
            }

            if (
                connection.getState() !==
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTED
            ) {
                throw new Error(
                    'EasyConect did not return to the disconnected state'
                );
            }

            console.log(
                'PASS: Bluetooth SPP disconnected cleanly'
            );

            console.log(
                'PASS: EasyConect Windows physical smoke complete'
            );
        } finally {
            if (
                connection.getState() !==
                EASYCONECT_CONNECTION_STATES
                    .DISCONNECTED
            ) {
                try {
                    await connection.disconnect();
                } catch (error) {
                    // Preserve the original smoke failure.
                }
            }
        }
    };

main()
    .catch(
        error => {
            console.error(
                `FAIL: ${error.message}`
            );

            process.exitCode =
                1;
        }
    );
