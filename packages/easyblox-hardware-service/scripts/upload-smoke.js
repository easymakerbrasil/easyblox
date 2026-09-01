const {
    BuildService,
    UploadService
} = require('../src');

const SOURCE_CODE = [
    '#include <Arduino.h>',
    '',
    'void setup() {',
    '    pinMode(13, OUTPUT);',
    '}',
    '',
    'void loop() {',
    '    digitalWrite(13, HIGH);',
    '    delay(500);',
    '    digitalWrite(13, LOW);',
    '    delay(500);',
    '}',
    ''
].join('\n');

const readPortHint = () => {
    if (
        process.env
            .EASYBLOX_UPLOAD_PORT
    ) {
        return {
            address:
                process.env
                    .EASYBLOX_UPLOAD_PORT
        };
    }

    if (
        process.env
            .EASYBLOX_USB_VID &&
        process.env
            .EASYBLOX_USB_PID
    ) {
        return {
            usbVendorId:
                process.env
                    .EASYBLOX_USB_VID,
            usbProductId:
                process.env
                    .EASYBLOX_USB_PID
        };
    }

    throw new Error(
        'Set EASYBLOX_UPLOAD_PORT or EASYBLOX_USB_VID/EASYBLOX_USB_PID before running the upload smoke test'
    );
};

const main = async () => {
    const buildService =
        new BuildService();

    const uploadService =
        new UploadService();

    let artifact = null;

    try {
        console.log(
            'Compiling EasyBlox upload smoke sketch...'
        );

        artifact =
            await buildService.compile({
                boardId:
                    'arduino-uno',
                code:
                    SOURCE_CODE
            });

        console.log(
            'Uploading to Arduino UNO...'
        );

        const result =
            await uploadService.upload({
                artifact,
                portHint:
                    readPortHint()
            });

        console.log(
            'EasyBlox Arduino upload OK'
        );

        console.log(
            `Port: ${result.port}`
        );

        console.log(
            `FQBN: ${result.fqbn}`
        );
    } finally {
        if (artifact) {
            await buildService.cleanup(
                artifact
            );
        }
    }
};

main().catch(error => {
    console.error(
        `[${error.code || 'UNEXPECTED'}] ${error.message}`
    );

    if (
        error.technicalDetails &&
        error.technicalDetails.stderr
    ) {
        console.error(
            error.technicalDetails.stderr
        );
    }

    process.exitCode = 1;
});
