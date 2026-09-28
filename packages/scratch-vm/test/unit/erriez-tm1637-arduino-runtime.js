const fs = require('fs');
const path = require('path');
const test = require('tap').test;

const {
    getErriezTm1637SupportFiles
} = require(
    '../../src/upload/erriez-tm1637-arduino-runtime'
);

const sourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-libraries/erriez-tm1637'
    );

const adapterSourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-adapters/tm1637-number-display'
    );

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/erriez-tm1637-library-files.js'
    );

const adapterGeneratedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/tm1637-number-display-adapter-files.js'
    );

const canonicalSourceNames = [
    'ErriezTM1637.h',
    'ErriezTM1637.cpp'
];

const adapterSourceNames = [
    'TM1637NumberDisplay.h',
    'TM1637NumberDisplay.cpp'
];

test(
    'ErriezTM1637 Arduino dependency is stored as pinned canonical sources',
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

        const upstream =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'UPSTREAM.txt'
                ),
                'utf8'
            );

        t.match(
            upstream,
            /Version:\s*1\.1\.0/,
            'pins ErriezTM1637 version 1.1.0'
        );

        t.end();
    }
);

test(
    'ErriezTM1637 public API provides the low-level display transport',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'ErriezTM1637.h'
                ),
                'utf8'
            );

        t.match(header, /class\s+TM1637\b/);
        t.match(header, /TM1637\s*\(/);
        t.match(header, /void\s+begin\s*\(/);
        t.match(header, /void\s+setBrightness\s*\(/);
        t.match(header, /void\s+clear\s*\(/);
        t.match(
            header,
            /void\s+writeData\s*\(\s*uint8_t\s+address,\s*const\s+uint8_t\s*\*buf,\s*uint8_t\s+len\s*\)/
        );

        t.end();
    }
);

test(
    'TM1637NumberDisplay encapsulates Stage-compatible number semantics',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    adapterSourceDirectory,
                    'TM1637NumberDisplay.h'
                ),
                'utf8'
            );

        const implementation =
            fs.readFileSync(
                path.join(
                    adapterSourceDirectory,
                    'TM1637NumberDisplay.cpp'
                ),
                'utf8'
            );

        t.match(
            header,
            /class\s+TM1637NumberDisplay\s*:\s*public\s+TM1637/
        );

        t.match(
            header,
            /void\s+showNumber\s*\(/
        );

        t.match(
            implementation,
            /if\s*\(!isfinite\(value\)\)/
        );

        t.match(
            implementation,
            /if\s*\(value < 0\)/
        );

        t.match(
            implementation,
            /long remaining\s*=\s*\(long\)value;/
        );

        t.match(
            implementation,
            /requestedLength > 4/
        );

        t.match(
            implementation,
            /position > 4/
        );

        t.match(
            implementation,
            /const uint8_t available\s*=\s*4 - start;/
        );

        t.match(
            implementation,
            /segments\[1\]\s*\|=\s*0x80;/
        );

        t.match(
            implementation,
            /writeData\(\s*0x00,\s*segments,\s*4\s*\);/
        );

        t.end();
    }
);

test(
    'generated browser mirrors match the canonical TM1637 sources',
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
            ERRIEZ_TM1637_LIBRARY_SOURCES
        } = require(
            generatedModulePath
        );

        const {
            TM1637_NUMBER_DISPLAY_ADAPTER_SOURCES
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
                ERRIEZ_TM1637_LIBRARY_SOURCES[name],
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
                TM1637_NUMBER_DISPLAY_ADAPTER_SOURCES[name],
                adapterSource,
                `${name} browser mirror matches adapter source`
            );
        }

        t.end();
    }
);

test(
    'TM1637 build support contains adapter and low-level library sources',
    t => {
        const supportFiles =
            getErriezTm1637SupportFiles();

        t.same(
            supportFiles.map(
                file => file.name
            ),
            [
                'TM1637NumberDisplay.h',
                'TM1637NumberDisplay.cpp',
                'ErriezTM1637.h',
                'ErriezTM1637.cpp'
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
