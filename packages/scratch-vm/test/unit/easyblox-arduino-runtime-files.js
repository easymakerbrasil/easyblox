const fs = require('fs');
const path = require('path');
const test = require('tap').test;
const {
    EASYBLOX_BT_INTERNAL_IDENTIFIERS
} = require(
    '../../src/upload/easyblox-bt-arduino-runtime'
);

const sourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-runtime'
    );

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/easyblox-arduino-runtime-files.js'
    );

const canonicalSourceNames = [
    'EasyBlox.h',
    'EasyBloxBluetooth.h',
    'EasyBloxBluetooth.cpp'
];

test(
    'EasyBlox Arduino runtime is stored as canonical C++ source files',
    t => {
        for (
            const name
            of canonicalSourceNames
        ) {
            t.equal(
                fs.existsSync(
                    path.join(
                        sourceDirectory,
                        name
                    )
                ),
                true,
                `${name} exists as a canonical Arduino source file`
            );
        }

        t.end();
    }
);

test(
    'EasyBlox Bluetooth exposes a pedagogical C++ facade',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.h'
                ),
                'utf8'
            );

        t.match(
            header,
            /class\s+EasyBloxBluetooth/,
            'Bluetooth runtime declares the EasyBloxBluetooth facade'
        );

        t.match(
            header,
            /void\s+begin\s*\(\s*\)\s*;/,
            'facade exposes begin without transport arguments'
        );

        t.match(
            header,
            /void\s+sendText\s*\(\s*const String\s*&value\s*\)\s*;/,
            'facade exposes TEXT send without the hidden channel'
        );

        t.match(
            header,
            /void\s+sendNumber\s*\(\s*double\s+value\s*\)\s*;/,
            'facade exposes NUMBER send without the hidden channel'
        );

        t.match(
            header,
            /void\s+waitText\s*\(\s*\)\s*;/,
            'facade exposes TEXT wait without the hidden channel'
        );

        t.match(
            header,
            /void\s+waitNumber\s*\(\s*\)\s*;/,
            'facade exposes NUMBER wait without the hidden channel'
        );

        t.match(
            header,
            /const String\s*&\s*receivedText\s*\(\s*\)\s+const\s*;/,
            'facade exposes the received TEXT reporter'
        );

        t.match(
            header,
            /float\s+receivedNumber\s*\(\s*\)\s+const\s*;/,
            'facade exposes the received NUMBER reporter'
        );

        t.match(
            header,
            /extern\s+EasyBloxBluetooth\s+EasyBloxBT\s*;/,
            'runtime exposes the canonical EasyBloxBT object'
        );

        t.notMatch(
            header,
            /\beasybloxBt[A-Za-z0-9_]*/,
            'public header does not expose low-level Bluetooth symbols'
        );

        t.end();
    }
);

test(
    'EasyBlox Bluetooth facade identifiers are reserved from student symbols',
    t => {
        t.equal(
            EASYBLOX_BT_INTERNAL_IDENTIFIERS.includes(
                'EasyBloxBT'
            ),
            true,
            'EasyBloxBT object name is reserved'
        );

        t.equal(
            EASYBLOX_BT_INTERNAL_IDENTIFIERS.includes(
                'EasyBloxBluetooth'
            ),
            true,
            'EasyBloxBluetooth class name is reserved'
        );

        t.end();
    }
);

test(
    'generated browser runtime mirror matches the canonical C++ sources',
    t => {
        if (
            !fs.existsSync(
                generatedModulePath
            )
        ) {
            t.fail(
                'generated Arduino runtime module exists'
            );

            t.end();
            return;
        }

        delete require.cache[
            require.resolve(
                generatedModulePath
            )
        ];

        const {
            EASYBLOX_ARDUINO_RUNTIME_SOURCES
        } = require(
            generatedModulePath
        );

        for (
            const name
            of canonicalSourceNames
        ) {
            const sourcePath =
                path.join(
                    sourceDirectory,
                    name
                );

            if (
                !fs.existsSync(
                    sourcePath
                )
            ) {
                continue;
            }

            t.equal(
                EASYBLOX_ARDUINO_RUNTIME_SOURCES[
                    name
                ],
                fs.readFileSync(
                    sourcePath,
                    'utf8'
                ),
                `${name} browser mirror matches its canonical C++ source`
            );
        }

        t.end();
    }
);
