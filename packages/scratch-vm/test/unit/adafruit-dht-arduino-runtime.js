const fs = require('fs');
const path = require('path');
const test = require('tap').test;

const {
    getAdafruitDhtSupportFiles
} = require(
    '../../src/upload/adafruit-dht-arduino-runtime'
);

const sourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-libraries/adafruit-dht'
    );

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/adafruit-dht-library-files.js'
    );

const canonicalSourceNames = [
    'DHT.h',
    'DHT.cpp'
];

test(
    'Adafruit DHT Arduino dependency is stored as pinned canonical sources',
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
    'Adafruit DHT public API matches the Arduino market convention used by EasyBlox',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'DHT.h'
                ),
                'utf8'
            );

        t.match(
            header,
            /class\s+DHT\b/
        );

        t.match(
            header,
            /void\s+begin\s*\(/
        );

        t.match(
            header,
            /float\s+readTemperature\s*\(/
        );

        t.match(
            header,
            /float\s+readHumidity\s*\(/
        );

        t.end();
    }
);

test(
    'generated browser mirror matches the canonical Adafruit DHT sources',
    t => {
        delete require.cache[
            require.resolve(
                generatedModulePath
            )
        ];

        const {
            ADAFRUIT_DHT_LIBRARY_SOURCES
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
                ADAFRUIT_DHT_LIBRARY_SOURCES[
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
    'Adafruit DHT build support contains only the required Arduino sources',
    t => {
        const supportFiles =
            getAdafruitDhtSupportFiles();

        t.same(
            supportFiles.map(
                file => file.name
            ),
            [
                'DHT.h',
                'DHT.cpp'
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
