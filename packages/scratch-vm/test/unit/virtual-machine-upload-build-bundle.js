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
        'VirtualMachine generates Arduino UNO builds from the requested logical board workspace',
        t => {
            const vm =
                Object.create(
                    VirtualMachine.prototype
                );

            let requestedBoardId = null;

            vm._getValidatedArduinoUnoUploadIr =
                boardId => {
                    requestedBoardId =
                        boardId;

                    return createIr();
                };

            vm.generateArduinoUnoUploadBuildBundle(
                'easymaker-test'
            );

            t.equal(
                requestedBoardId,
                'easymaker-test',
                'logical board ID selects the Upload workspace'
            );

            t.end();
        }
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
    'VirtualMachine packages Adafruit DHT as Arduino support files',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createIr([
                    {
                        type: 'Wait',
                        duration: {
                            type: 'DhtReadExpression',
                            pin: 12,
                            reading: 'temperature'
                        }
                    }
                ]);

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.match(
            bundle.code,
            /#include "DHT\.h"/,
            'pedagogical sketch uses the conventional DHT library'
        );

        t.match(
            bundle.code,
            /DHT dht\(12, DHT11\);/,
            'pedagogical sketch declares the conventional DHT object'
        );

        t.match(
            bundle.code,
            /dht\.begin\(\);/,
            'pedagogical sketch initializes the DHT object'
        );

        t.match(
            bundle.code,
            /dht\.readTemperature\(\)/,
            'pedagogical sketch uses the conventional DHT API'
        );

        t.same(
            bundle.supportFiles.map(
                file => file.name
            ),
            [
                'DHT.h',
                'DHT.cpp'
            ],
            'DHT implementation travels as build support files'
        );

        t.notMatch(
            bundle.code,
            /easybloxReadDht11|easybloxDhtTemperature|EasyBloxDhtCacheEntry/,
            'internal DHT implementation does not leak into the pedagogical sketch'
        );

        t.end();
    }
);

test(
    'VirtualMachine packages HCSR04 as Arduino support files',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createIr([
                    {
                        type: 'Wait',
                        duration: {
                            type: 'UltrasonicReadExpression',
                            trigPin: 16,
                            echoPin: 17
                        }
                    }
                ]);

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.match(
            bundle.code,
            /#include "HCSR04\.h"/,
            'pedagogical sketch uses the conventional HCSR04 library'
        );

        t.match(
            bundle.code,
            /UltraSonicDistanceSensor distanceSensor\(A2, A3\);/,
            'pedagogical sketch declares the conventional HCSR04 object'
        );

        t.match(
            bundle.code,
            /sensor\.measureDistanceCm\(\)/,
            'pedagogical sketch uses the real HCSR04 measurement API'
        );

        t.same(
            bundle.supportFiles.map(
                file => file.name
            ),
            [
                'HCSR04.h',
                'HCSR04.cpp'
            ],
            'HCSR04 implementation travels as build support files'
        );

        t.notMatch(
            bundle.code,
            /easybloxUltrasonicRead/,
            'legacy proprietary ultrasonic helper does not leak into the sketch'
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
