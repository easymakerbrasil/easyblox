const fs = require('fs');
const path = require('path');
const test = require('tap').test;

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
