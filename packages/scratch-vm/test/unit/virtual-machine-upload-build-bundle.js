const test = require('tap').test;

const VirtualMachine =
    require('../../src/virtual-machine');

test(
    'VirtualMachine exposes an Arduino UNO build bundle independently from the preview contract',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm.generateArduinoUnoUploadCode =
            () =>
                'void setup() {}\nvoid loop() {}\n';

        t.same(
            vm.generateArduinoUnoUploadBuildBundle(),
            {
                code:
                    'void setup() {}\nvoid loop() {}\n',
                supportFiles: []
            },
            'build bundle starts with the canonical sketch and no support files'
        );

        t.end();
    }
);
