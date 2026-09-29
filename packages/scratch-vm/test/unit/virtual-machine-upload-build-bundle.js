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
    'VirtualMachine packages compact MAX7219 adapter and implementation files',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createIr([
                    {
                        type: 'MatrixInit',
                        dinPin: 18,
                        csPin: 19,
                        clkPin: 13
                    },
                    {
                        type: 'MatrixWrite',
                        bitmap: '0066FFFF7E3C1800'
                    },
                    {
                        type: 'MatrixBrightness',
                        brightnessPercent: 75
                    },
                    {
                        type: 'MatrixClear'
                    }
                ]);

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.match(
            bundle.code,
            /#include "MAX7219Matrix\.h"/,
            'pedagogical sketch uses the compact MAX7219 adapter'
        );

        t.match(
            bundle.code,
            /MAX7219Matrix matrix\(A4, 13, A5\);/,
            'pedagogical sketch declares a high-level matrix object'
        );

        t.match(
            bundle.code,
            /matrix\.begin\(\);/,
            'pedagogical sketch initializes the matrix'
        );

        t.match(
            bundle.code,
            /matrix\.drawBitmap\("0066FFFF7E3C1800"\);/,
            'pedagogical sketch draws the bitmap with one high-level call'
        );

        t.match(
            bundle.code,
            /matrix\.setBrightness\(75\);/,
            'pedagogical sketch sets matrix brightness'
        );

        t.match(
            bundle.code,
            /matrix\.clear\(\);/,
            'pedagogical sketch clears the matrix'
        );

        t.notMatch(
            bundle.code,
            /matrix\.setRow|matrixIntensityFromPercent|matrix\.setIntensity|matrix\.shutdown|matrix\.clearDisplay/,
            'MAX7219 implementation details do not leak into the pedagogical sketch'
        );

        t.same(
            bundle.supportFiles.map(
                file => file.name
            ),
            [
                'MAX7219Matrix.h',
                'MAX7219Matrix.cpp',
                'LedControl.h',
                'LedControl.cpp'
            ],
            'adapter and LedControl implementation travel as build support files'
        );

        const adapterImplementation =
            findSupportFile(
                bundle,
                'MAX7219Matrix.cpp'
            );

        t.match(
            adapterImplementation.content,
            /setRow\(\s*0,\s*row,\s*value\s*\);/,
            'low-level row writes remain available in the raw bundle'
        );

        t.end();
    }
);

test(
    'VirtualMachine packages compact LCD16x2 adapter and implementation files',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createIr([
                    {
                        type: 'LcdInit'
                    },
                    {
                        type: 'LcdWrite',
                        text: 'EasyBlox',
                        row: 2,
                        column: 5
                    },
                    {
                        type: 'LcdMode',
                        mode: '4'
                    },
                    {
                        type: 'LcdClear'
                    }
                ]);

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.match(
            bundle.code,
            /#include "LCD16x2\.h"/,
            'pedagogical sketch uses the compact LCD adapter'
        );

        t.match(
            bundle.code,
            /LCD16x2 lcd;/,
            'pedagogical sketch declares a high-level LCD object'
        );

        t.match(
            bundle.code,
            /lcd\.begin\(\);/,
            'pedagogical sketch initializes LCD'
        );

        t.match(
            bundle.code,
            /lcd\.write\("EasyBlox", 2, 5\);/,
            'pedagogical sketch writes LCD text'
        );

        t.match(
            bundle.code,
            /lcd\.setMode\(4\);/,
            'pedagogical sketch sets LCD mode'
        );

        t.match(
            bundle.code,
            /lcd\.clear\(\);/,
            'pedagogical sketch clears LCD'
        );

        t.notMatch(
            bundle.code,
            /easybloxLcd|easyblox_lcd_|Wire\.|0x27|0x3F|delayMicroseconds/,
            'LCD transport details do not leak into the pedagogical sketch'
        );

        t.same(
            bundle.supportFiles.map(
                file => file.name
            ),
            [
                'LCD16x2.h',
                'LCD16x2.cpp'
            ],
            'LCD adapter travels as build support files'
        );

        const adapterImplementation =
            findSupportFile(
                bundle,
                'LCD16x2.cpp'
            );

        t.match(
            adapterImplementation.content,
            /0x27/
        );

        t.match(
            adapterImplementation.content,
            /0x3F/
        );

        t.match(
            adapterImplementation.content,
            /Wire\.begin\(\)/
        );

        t.end();
    }
);

test(
    'VirtualMachine packages compact TM1637 adapter and implementation files',
    t => {
        const vm =
            Object.create(
                VirtualMachine.prototype
            );

        vm._getValidatedArduinoUnoUploadIr =
            () =>
                createIr([
                    {
                        type: 'Tm1637Init',
                        clkPin: 19,
                        dioPin: 18
                    },
                    {
                        type: 'Tm1637Show',
                        value: 1234,
                        length: 4,
                        position: 1,
                        point: '1',
                        leadingZeros: '0'
                    },
                    {
                        type: 'Tm1637Clear'
                    }
                ]);

        const bundle =
            vm.generateArduinoUnoUploadBuildBundle();

        t.match(
            bundle.code,
            /#include "TM1637NumberDisplay\.h"/,
            'pedagogical sketch uses the compact TM1637 adapter'
        );

        t.match(
            bundle.code,
            /TM1637NumberDisplay display\(A5, A4\);/,
            'pedagogical sketch declares a high-level display object'
        );

        t.match(
            bundle.code,
            /display\.begin\(\);/,
            'pedagogical sketch initializes the display'
        );

        t.match(
            bundle.code,
            /display\.setBrightness\(7\);/,
            'pedagogical sketch preserves maximum TM1637 brightness'
        );

        t.match(
            bundle.code,
            /display\.showNumber\(1234, 4, 1, true, false\);/,
            'pedagogical sketch shows the number with one high-level call'
        );

        t.match(
            bundle.code,
            /display\.clear\(\);/,
            'pedagogical sketch clears the display'
        );

        t.notMatch(
            bundle.code,
            /showTm1637Number|writeData|digitSegments|segments\[1\]/,
            'TM1637 implementation details do not leak into the pedagogical sketch'
        );

        t.same(
            bundle.supportFiles.map(
                file => file.name
            ),
            [
                'TM1637NumberDisplay.h',
                'TM1637NumberDisplay.cpp',
                'ErriezTM1637.h',
                'ErriezTM1637.cpp'
            ],
            'adapter and low-level implementation travel as build support files'
        );

        const adapterImplementation =
            findSupportFile(
                bundle,
                'TM1637NumberDisplay.cpp'
            );

        t.match(
            adapterImplementation.content,
            /writeData\(\s*0x00,\s*segments,\s*4\s*\);/,
            'Stage-compatible low-level implementation remains available in the raw bundle'
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
