const fs =
    require('node:fs');

const path =
    require('node:path');

const {
    createEasyBloxSupportCatalog
} = require(
    '../src/easyblox-support-catalog'
);

const outputPath =
    path.resolve(
        __dirname,
        '..',
        'src',
        'easyblox-support-catalog-browser.generated.json'
    );

const catalog =
    createEasyBloxSupportCatalog();

fs.writeFileSync(
    outputPath,
    `${
        JSON.stringify(
            catalog,
            null,
            4
        )
    }\n`,
    'utf8'
);

console.log(
    `Generated browser support catalog: ${
        outputPath
    }`
);
