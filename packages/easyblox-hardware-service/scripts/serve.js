const HardwareHttpServer =
    require('../src/http-server');

const portValue =
    Number.parseInt(
        process.env
            .EASYBLOX_HARDWARE_SERVICE_PORT ||
        '8602',
        10
    );

const allowedOrigins =
    process.env
        .EASYBLOX_HARDWARE_ALLOWED_ORIGINS ?
        process.env
            .EASYBLOX_HARDWARE_ALLOWED_ORIGINS
            .split(',')
            .map(value => value.trim())
            .filter(Boolean) :
        undefined;

const server =
    new HardwareHttpServer({
        port:
            Number.isInteger(portValue) ?
                portValue :
                8602,
        allowedOrigins
    });

let shuttingDown = false;

const shutdown = async () => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    try {
        await server.close();
    } finally {
        process.exit(0);
    }
};

process.on(
    'SIGINT',
    shutdown
);

process.on(
    'SIGTERM',
    shutdown
);

server.listen()
    .then(address => {
        console.log(
            `EasyBlox Hardware Service listening on http://${address.host}:${address.port}`
        );
    })
    .catch(error => {
        console.error(
            `EasyBlox Hardware Service failed to start: ${error.message}`
        );

        process.exitCode = 1;
    });
