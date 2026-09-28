const fs = require('fs');
const path = require('path');
const test = require('tap').test;

const {
    getHcsr04SupportFiles
} = require(
    '../../src/upload/hcsr04-arduino-runtime'
);

const sourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-libraries/hcsr04'
    );

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/hcsr04-library-files.js'
    );

const canonicalSourceNames = [
    'HCSR04.h',
    'HCSR04.cpp'
];

test(
    'HCSR04 Arduino dependency is stored as pinned canonical sources',
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
    'HCSR04 public API matches the Arduino convention used by EasyBlox',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'HCSR04.h'
                ),
                'utf8'
            );

        t.match(
            header,
            /class\s+UltraSonicDistanceSensor\b/
        );

        t.match(
            header,
            /UltraSonicDistanceSensor\s*\(/
        );

        t.match(
            header,
            /float\s+measureDistanceCm\s*\(/
        );

        t.end();
    }
);

test(
    'generated browser mirror matches the canonical HCSR04 sources',
    t => {
        delete require.cache[
            require.resolve(
                generatedModulePath
            )
        ];

        const {
            HCSR04_LIBRARY_SOURCES
        } = require(
            generatedModulePath
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
                HCSR04_LIBRARY_SOURCES[
                    name
                ],
                canonicalSource,
                `${name} browser mirror matches canonical source`
            );
        }

        t.end();
    }
);

test(
    'HCSR04 build support contains only the required Arduino sources',
    t => {
        const supportFiles =
            getHcsr04SupportFiles();

        t.same(
            supportFiles.map(
                file => file.name
            ),
            [
                'HCSR04.h',
                'HCSR04.cpp'
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
