const fs = require('fs');
const path = require('path');
const test = require('tap').test;

const {
    getLcd16x2SupportFiles
} = require(
    '../../src/upload/lcd16x2-arduino-runtime'
);

const adapterSourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-adapters/lcd16x2'
    );

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/lcd16x2-adapter-files.js'
    );

const adapterSourceNames = [
    'LCD16x2.h',
    'LCD16x2.cpp'
];

test(
    'LCD16x2 adapter preserves the current I2C LCD contract',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    adapterSourceDirectory,
                    'LCD16x2.h'
                ),
                'utf8'
            );

        const implementation =
            fs.readFileSync(
                path.join(
                    adapterSourceDirectory,
                    'LCD16x2.cpp'
                ),
                'utf8'
            );

        t.match(
            header,
            /class\s+LCD16x2\b/
        );

        t.match(
            header,
            /void\s+begin\s*\(/
        );

        t.match(
            header,
            /void\s+write\s*\(/
        );

        t.match(
            header,
            /void\s+clear\s*\(/
        );

        t.match(
            header,
            /void\s+setMode\s*\(/
        );

        t.match(
            implementation,
            /0x27/
        );

        t.match(
            implementation,
            /0x3F/
        );

        t.match(
            implementation,
            /Wire\.begin\(\)/
        );

        t.match(
            implementation,
            /\(int\)round\(rowValue\)/
        );

        t.match(
            implementation,
            /row > 2/
        );

        t.match(
            implementation,
            /\(int\)round\(columnValue\)/
        );

        t.match(
            implementation,
            /column > 16/
        );

        t.match(
            implementation,
            /command\(0x18\)/
        );

        t.match(
            implementation,
            /command\(0x1C\)/
        );

        t.match(
            implementation,
            /value \| 0x08/
        );

        t.end();
    }
);

test(
    'generated browser mirror matches the canonical LCD16x2 adapter',
    t => {
        delete require.cache[
            require.resolve(
                generatedModulePath
            )
        ];

        const {
            LCD16X2_ADAPTER_SOURCES
        } = require(
            generatedModulePath
        );

        for (const name of adapterSourceNames) {
            const canonicalSource =
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
                LCD16X2_ADAPTER_SOURCES[
                    name
                ],
                canonicalSource,
                `${name} browser mirror matches adapter source`
            );
        }

        t.end();
    }
);

test(
    'LCD16x2 build support contains the adapter sources',
    t => {
        const supportFiles =
            getLcd16x2SupportFiles();

        t.same(
            supportFiles.map(
                file => file.name
            ),
            [
                'LCD16x2.h',
                'LCD16x2.cpp'
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
