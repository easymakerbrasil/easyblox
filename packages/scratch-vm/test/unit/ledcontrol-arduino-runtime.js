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

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/ledcontrol-library-files.js'
    );

const canonicalSourceNames = [
    'LedControl.h',
    'LedControl.cpp'
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
    'LedControl public API matches the MAX7219 convention used by EasyBlox',
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
    'generated browser mirror matches the canonical LedControl sources',
    t => {
        delete require.cache[
            require.resolve(
                generatedModulePath
            )
        ];

        const {
            LEDCONTROL_LIBRARY_SOURCES
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
                LEDCONTROL_LIBRARY_SOURCES[name],
                canonicalSource,
                `${name} browser mirror matches canonical source`
            );
        }

        t.end();
    }
);

test(
    'LedControl build support contains only the required Arduino sources',
    t => {
        const supportFiles =
            getLedControlSupportFiles();

        t.same(
            supportFiles.map(
                file => file.name
            ),
            [
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
