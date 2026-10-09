import fs from 'node:fs/promises';
import path from 'node:path';
import {
    fileURLToPath
} from 'node:url';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const filename =
    fileURLToPath(
        import.meta.url
    );

const dirname =
    path.dirname(
        filename
    );

const desktopRoot =
    path.resolve(
        dirname,
        '..'
    );

const repositoryRoot =
    path.resolve(
        desktopRoot,
        '..',
        '..'
    );

const sourcePath =
    path.join(
        repositoryRoot,
        'packages',
        'scratch-gui',
        'static',
        'easyblox-favicon.svg'
    );

const outputDirectory =
    path.join(
        desktopRoot,
        'build'
    );

const temporaryDirectory =
    path.join(
        outputDirectory,
        '.icon-tmp'
    );

const pngPath =
    path.join(
        outputDirectory,
        'icon.png'
    );

const icoPath =
    path.join(
        outputDirectory,
        'icon.ico'
    );

const iconSizes =
    Object.freeze([
        16,
        24,
        32,
        48,
        64,
        128,
        256
    ]);

const buildIcons =
    async () => {
        await fs.access(
            sourcePath
        );

        const source =
            await fs.readFile(
                sourcePath
            );

        await fs.mkdir(
            outputDirectory,
            {
                recursive: true
            }
        );

        await fs.rm(
            temporaryDirectory,
            {
                force: true,
                recursive: true
            }
        );

        await fs.mkdir(
            temporaryDirectory,
            {
                recursive: true
            }
        );

        try {
            await sharp(
                source,
                {
                    density: 384
                }
            )
                .resize(
                    1024,
                    1024,
                    {
                        fit: 'contain'
                    }
                )
                .png()
                .toFile(
                    pngPath
                );

            const icoSources =
                [];

            for (
                const size of
                iconSizes
            ) {
                const temporaryPath =
                    path.join(
                        temporaryDirectory,
                        `icon-${size}.png`
                    );

                await sharp(
                    source,
                    {
                        density: 384
                    }
                )
                    .resize(
                        size,
                        size,
                        {
                            fit: 'contain'
                        }
                    )
                    .png()
                    .toFile(
                        temporaryPath
                    );

                icoSources.push(
                    temporaryPath
                );
            }

            const ico =
                await pngToIco(
                    icoSources
                );

            await fs.writeFile(
                icoPath,
                ico
            );
        } finally {
            await fs.rm(
                temporaryDirectory,
                {
                    force: true,
                    recursive: true
                }
            );
        }

        console.log(
            `EasyBlox icon PNG: ${pngPath}`
        );

        console.log(
            `EasyBlox icon ICO: ${icoPath}`
        );
    };

await buildIcons();
