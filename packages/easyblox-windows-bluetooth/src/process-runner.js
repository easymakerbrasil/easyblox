const {
    execFile
} = require('node:child_process');

const DEFAULT_MAX_BUFFER =
    16 * 1024 * 1024;

const runProcess = (
    file,
    args,
    options = {}
) => new Promise((resolve, reject) => {
    execFile(
        file,
        args,
        {
            ...options,
            encoding: 'utf8',
            maxBuffer: DEFAULT_MAX_BUFFER,
            windowsHide: true,
            shell: false
        },
        (
            error,
            stdout,
            stderr
        ) => {
            if (error) {
                error.stdout = stdout || '';
                error.stderr = stderr || '';

                reject(error);
                return;
            }

            resolve({
                exitCode: 0,
                stdout: stdout || '',
                stderr: stderr || ''
            });
        }
    );
});

module.exports = runProcess;
