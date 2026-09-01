const tap = require('tap');

const VirtualMachine = require('../../src/virtual-machine');

const createUploadHat = next => ({
    id: 'upload_hat',
    opcode: 'arduinoUno_whenArduinoUnoStart',
    next,
    parent: null,
    inputs: {},
    fields: {},
    topLevel: true,
    shadow: false
});

const loadUploadBlocks = (vm, blocks) => {
    const uploadProgram =
        vm.getOrCreateUploadProgram('arduino-uno');

    blocks.forEach(block => {
        uploadProgram.blocks.createBlock(block);
    });
};

tap.test(
    'VirtualMachine exposes Arduino UNO Upload Serial configuration from semantic IR',
    t => {
        const vm = new VirtualMachine();

        loadUploadBlocks(vm, [
            createUploadHat('serial_begin'),
            {
                id: 'serial_begin',
                opcode: 'serial_serialBegin',
                next: null,
                parent: 'upload_hat',
                inputs: {},
                fields: {
                    BAUD: {
                        name: 'BAUD',
                        value: '57600'
                    }
                },
                topLevel: false,
                shadow: false
            }
        ]);

        t.same(
            vm.getArduinoUnoUploadSerialConfig(),
            {
                baudRate: 57600
            },
            'Serial Monitor baud comes from canonical Upload IR'
        );

        t.end();
    }
);

tap.test(
    'VirtualMachine reports no Serial Monitor configuration when Upload does not initialize Serial',
    t => {
        const vm = new VirtualMachine();

        loadUploadBlocks(vm, [
            createUploadHat(null)
        ]);

        t.equal(
            vm.getArduinoUnoUploadSerialConfig(),
            null,
            'Upload programs without SerialBegin do not request a monitor session'
        );

        t.end();
    }
);
