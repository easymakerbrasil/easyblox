const {
    BuildService
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
    '    delay(250);',
    '    digitalWrite(13, LOW);',
    '    delay(250);',
    '}',
    ''
].join('\n');

const main = async () => {
    const service =
        new BuildService();

    let artifact = null;

    try {
        artifact =
            await service.compile({
                boardId: 'arduino-uno',
                code: SOURCE_CODE
            });

        console.log(
            'EasyBlox Arduino build OK'
        );

        console.log(
            `Board: ${artifact.boardId}`
        );

        console.log(
            `FQBN: ${artifact.fqbn}`
        );

        console.log(
            `Build: ${artifact.buildPath}`
        );
    } finally {
        if (artifact) {
            await service.cleanup(
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
