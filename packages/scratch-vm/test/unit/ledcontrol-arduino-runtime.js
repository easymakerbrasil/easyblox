const fs = require('fs');
const path = require('path');
const test = require('tap').test;

const {
    getLedControlSupportFiles
} = require(
    '../../src/upload/ledcontrol-arduino-runtime'
);

const sourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-libraries/ledcontrol'
    );

const adapterSourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-adapters/max7219-matrix'
    );

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/ledcontrol-library-files.js'
    );

const adapterGeneratedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/max7219-matrix-adapter-files.js'
    );

const canonicalSourceNames = [
    'LedControl.h',
    'LedControl.cpp'
];

const adapterSourceNames = [
    'MAX7219Matrix.h',
    'MAX7219Matrix.cpp'
];

test(
    'LedControl Arduino dependency is stored as pinned canonical sources',
    t => {
        for (const name of canonicalSourceNames) {
            t.equal(
                fs.existsSync(
                    path.join(
                        sourceDirectory,
                        name
                    )
                ),
                true,
                `${name} exists`
            );
        }

        t.equal(
            fs.existsSync(
                path.join(
                    sourceDirectory,
                    'license.txt'
                )
            ),
            true,
            'MIT license is stored with the vendored dependency'
        );

        t.equal(
            fs.existsSync(
                path.join(
                    sourceDirectory,
                    'UPSTREAM.txt'
                )
            ),
            true,
            'upstream version metadata is stored with the dependency'
        );

        t.end();
    }
);

test(
    'LedControl public API provides the low-level MAX7219 transport',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'LedControl.h'
                ),
                'utf8'
            );

        t.match(header, /class\s+LedControl\b/);
        t.match(header, /LedControl\s*\(/);
        t.match(header, /void\s+shutdown\s*\(/);
        t.match(header, /void\s+setScanLimit\s*\(/);
        t.match(header, /void\s+setIntensity\s*\(/);
        t.match(header, /void\s+clearDisplay\s*\(/);
        t.match(header, /void\s+setRow\s*\(/);

        t.end();
    }
);

test(
    'MAX7219Matrix encapsulates high-level matrix semantics',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    adapterSourceDirectory,
                    'MAX7219Matrix.h'
                ),
                'utf8'
            );

        const implementation =
            fs.readFileSync(
                path.join(
                    adapterSourceDirectory,
                    'MAX7219Matrix.cpp'
                ),
                'utf8'
            );

        t.match(
            header,
            /class\s+MAX7219Matrix\s*:\s*public\s+LedControl/
        );

        t.match(header, /void\s+begin\s*\(/);
        t.match(header, /void\s+drawBitmap\s*\(/);
        t.match(header, /void\s+setBrightness\s*\(/);
        t.match(header, /void\s+clear\s*\(/);

        t.match(
            implementation,
            /shutdown\(\s*0,\s*false\s*\);/
        );

        t.match(
            implementation,
            /setScanLimit\(\s*0,\s*7\s*\);/
        );

        t.match(
            implementation,
            /setIntensity\(\s*0,\s*8\s*\);/
        );

        t.match(
            implementation,
            /setRow\(\s*0,\s*row,\s*value\s*\);/
        );

        t.match(
            implementation,
            /round\(\s*brightnessPercent\s*\)/
        );

        t.match(
            implementation,
            /brightness < 0/
        );

        t.match(
            implementation,
            /brightness > 100/
        );

        t.match(
            implementation,
            /brightness \* 15L \+ 50L/
        );

        t.match(
            implementation,
            /clearDisplay\(0\);/
        );

        t.end();
    }
);

test(
    'generated browser mirrors match the canonical MAX7219 sources',
    t => {
        delete require.cache[
            require.resolve(
                generatedModulePath
            )
        ];

        delete require.cache[
            require.resolve(
                adapterGeneratedModulePath
            )
        ];

        const {
            LEDCONTROL_LIBRARY_SOURCES
        } = require(
            generatedModulePath
        );

        const {
            MAX7219_MATRIX_ADAPTER_SOURCES
        } = require(
            adapterGeneratedModulePath
        );

        for (const name of canonicalSourceNames) {
            const canonicalSource =
                fs.readFileSync(
                    path.join(
                        sourceDirectory,
                        name
                    ),
                    'utf8'
                ).replace(
                    /\r\n/g,
                    '\n'
                );

            t.equal(
                LEDCONTROL_LIBRARY_SOURCES[name],
                canonicalSource,
                `${name} browser mirror matches canonical source`
            );
        }

        for (const name of adapterSourceNames) {
            const adapterSource =
                fs.readFileSync(
                    path.join(
                        adapterSourceDirectory,
                        name
                    ),
                    'utf8'
                ).replace(
                    /\r\n/g,
                    '\n'
                );

            t.equal(
                MAX7219_MATRIX_ADAPTER_SOURCES[name],
                adapterSource,
                `${name} browser mirror matches adapter source`
            );
        }

        t.end();
    }
);

test(
    'MAX7219 build support contains adapter and low-level library sources',
    t => {
        const supportFiles =
            getLedControlSupportFiles();

        t.same(
            supportFiles.map(
                file => file.name
            ),
            [
                'MAX7219Matrix.h',
                'MAX7219Matrix.cpp',
                'LedControl.h',
                'LedControl.cpp'
            ]
        );

        for (const supportFile of supportFiles) {
            t.type(
                supportFile.content,
                'string'
            );

            t.ok(
                supportFile.content.length > 0
            );
        }

        t.end();
    }
);
