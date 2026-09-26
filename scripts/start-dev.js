const {spawn} = require('node:child_process');

const npmCliPath =
    process.env.npm_execpath;

if (!npmCliPath) {
    throw new Error(
        'npm_execpath is required to start the EasyBlox development services'
    );
}

const processes = [];

let shuttingDown = false;

const stopAll = () => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    for (const child of processes) {
        if (
            child &&
            !child.killed
        ) {
            child.kill();
        }
    }
};

const startProcess = (
    name,
    args
) => {
    const child =
        spawn(
            process.execPath,
            [
                npmCliPath,
                ...args
            ],
            {
                stdio: 'inherit'
            }
        );

    processes.push(
        child
    );

    child.on(
        'error',
        error => {
            console.error(
                `[EasyBlox] ${name} failed to start: ${error.message}`
            );

            stopAll();
            process.exitCode = 1;
        }
    );

    child.on(
        'exit',
        code => {
            if (shuttingDown) {
                return;
            }

            console.error(
                `[EasyBlox] ${name} stopped with code ${code}`
            );

            stopAll();

            process.exitCode =
                typeof code === 'number' ?
                    code :
                    1;
        }
    );

    return child;
};

process.on(
    'SIGINT',
    () => {
        stopAll();
    }
);

process.on(
    'SIGTERM',
    () => {
        stopAll();
    }
);

startProcess(
    'Hardware Service',
    [
        'run',
        'start:hardware'
    ]
);

startProcess(
    'GUI',
    [
        'run',
        'start:gui'
    ]
);
