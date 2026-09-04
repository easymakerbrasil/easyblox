const test = require('tap').test;

const VirtualMachine =
    require('../../src/virtual-machine');

const easybloxConnectivityContract =
    require(
        '../../src/connectivity/easyblox-connectivity-contract'
    );

const createIr = (
    setup = []
) => ({
    globals: {
        variables: [],
        lists: []
    },
    procedures: [],
    setup,
    loop: []
});

const findSupportFile = (
    bundle,
    name
) =>
    bundle.supportFiles.find(
        file => file.name === name
    );

test(
    'VirtualMachine keeps ordinary Arduino UNO builds free from EasyBlox runtime support files',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () => createIr();

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.same(
            bundle.supportFiles,
            [],
            'ordinary sketches do not gain EasyBlox support files'
        );

        t.notMatch(
            bundle.code,
            /#include "EasyBlox\.h"/,
            'ordinary sketches do not include the EasyBlox runtime'
        );

        t.end();
    }
);

test(
    'VirtualMachine packages EasyBlox BT as Arduino support files instead of inline runtime code',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createIr([
                    {
                        type:
                            'EasyBloxBtInit'
                    }
                ]);

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.match(
            bundle.code,
            /#include "EasyBlox\.h"/,
            'Bluetooth sketch references the encapsulated EasyBlox runtime'
        );

        t.same(
            bundle.supportFiles.map(
                file => file.name
            ),
            [
                'EasyBlox.h',
                'EasyBloxBluetooth.h',
                'EasyBloxBluetooth.cpp',
                'EasyBloxConfig.h'
            ],
            'Bluetooth build carries the complete runtime support-file set'
        );

        t.notMatch(
            bundle.code,
            /#include <SoftwareSerial\.h>/,
            'SoftwareSerial implementation is hidden from the pedagogical sketch'
        );

        t.notMatch(
            bundle.code,
            /EASYBLOX_EBCP_MAGIC_0/,
            'EBCP implementation is hidden from the pedagogical sketch'
        );

        t.end();
    }
);

test(
    'VirtualMachine derives EasyBloxConfig.h from the canonical hidden Bluetooth channel',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createIr([
                    {
                        type:
                            'EasyBloxBtInit'
                    }
                ]);

        const originalChannel =
            easybloxConnectivityContract
                .EASYBLOX_BT_CHANNEL;

        try {
            easybloxConnectivityContract
                .EASYBLOX_BT_CHANNEL =
                    'test-channel';

            const bundle =
                vm.generateArduinoUnoUploadBuildBundle();

            const configFile =
                findSupportFile(
                    bundle,
                    'EasyBloxConfig.h'
                );

            t.ok(
                configFile,
                'Bluetooth build provides a generated EasyBloxConfig.h'
            );

            if (configFile) {
                t.match(
                    configFile.content,
                    /test-channel/,
                    'generated Arduino configuration follows the canonical connectivity contract'
                );
            }
        } finally {
            easybloxConnectivityContract
                .EASYBLOX_BT_CHANNEL =
                    originalChannel;
        }

        t.end();
    }
);
