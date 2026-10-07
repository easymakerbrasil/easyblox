import * as ScratchBlocks from 'scratch-blocks';

import downloadBlob from './download-blob';

const PNG_EXPORT_SCALE = 3;

const PNG_EXPORT_FILENAME =
    'Blocos-EasyBlox.png';

const PNG_MIME_TYPE =
    'image/png';

const SVG_DATA_URL_PREFIX =
    'data:image/svg+xml;utf-8,';

const isAbortError = error => (
    error &&
    error.name ===
        'AbortError'
);

const createSavePickerOptions =
    suggestedName => ({
        suggestedName,

        types: [
            {
                description:
                    'Imagem PNG EasyBlox',

                accept: {
                    [PNG_MIME_TYPE]:
                        ['.png']
                }
            }
        ]
    });

const writeBlobToHandle =
    async (
        handle,
        blob
    ) => {
        const writable =
            await handle.createWritable();

        try {
            await writable.write(
                blob
            );

            await writable.close();
        } catch (error) {
            if (
                typeof writable.abort ===
                    'function'
            ) {
                await writable.abort();
            }

            throw error;
        }
    };

const INLINE_STYLE_PROPERTIES = [
    'fill',
    'fill-opacity',
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'letter-spacing',
    'text-anchor',
    'dominant-baseline',
    'opacity',
    'display',
    'visibility'
];

const inlineComputedStyles =
    (
        sourceElement,
        clonedElement
    ) => {
        const computedStyle =
            window.getComputedStyle(
                sourceElement
            );

        INLINE_STYLE_PROPERTIES.forEach(
            property => {
                const value =
                    computedStyle
                        .getPropertyValue(
                            property
                        );

                if (value) {
                    clonedElement
                        .style
                        .setProperty(
                            property,
                            value
                        );
                }
            }
        );

        Array.from(
            sourceElement.children
        ).forEach(
            (
                sourceChild,
                index
            ) => {
                const clonedChild =
                    clonedElement
                        .children[index];

                if (clonedChild) {
                    inlineComputedStyles(
                        sourceChild,
                        clonedChild
                    );
                }
            }
        );
    };

const blockToExportSvgDataUrl =
    blockId => {
        const workspace =
            ScratchBlocks
                .getMainWorkspace();

        const block =
            workspace &&
            workspace.getBlockById(
                blockId
            );

        if (!block) {
            return Promise.reject(
                new Error(
                    `No block found with id ${blockId}.`
                )
            );
        }

        const sourceBlockSvg =
            block.getSvgRoot();

        const blockSvg =
            sourceBlockSvg
                .cloneNode(true);

        inlineComputedStyles(
            sourceBlockSvg,
            blockSvg
        );

        return new Promise(
            resolve => {
                setTimeout(
                    () => {
                        blockSvg.innerHTML =
                            blockSvg
                                .innerHTML
                                .replace(
                                    /&nbsp;/g,
                                    ' '
                                );

                        const NS =
                            'http://www.w3.org/2000/svg';

                        const svg =
                            document
                                .createElementNS(
                                    NS,
                                    'svg'
                                );

                        svg.setAttribute(
                            'xmlns',
                            NS
                        );

                        svg.appendChild(
                            blockSvg
                        );

                        document.body
                            .appendChild(
                                svg
                            );

                        const padding = 10;

                        const extraHatPadding =
                            16;

                        const topPadding =
                            padding +
                            (
                                blockSvg
                                    .getAttribute(
                                        'data-shapes'
                                    ) ===
                                    'hat' ?
                                    extraHatPadding :
                                    0
                            );

                        blockSvg.setAttribute(
                            'transform',
                            `translate(${padding} ${topPadding})`
                        );

                        const bounds =
                            blockSvg
                                .getBoundingClientRect();

                        svg.setAttribute(
                            'width',
                            bounds.width +
                                (2 * padding)
                        );

                        svg.setAttribute(
                            'height',
                            bounds.height +
                                (2 * padding)
                        );

                        const svgString =
                            (
                                new XMLSerializer()
                            ).serializeToString(
                                svg
                            );

                        svg.parentNode
                            .removeChild(
                                svg
                            );

                        resolve(
                            `${SVG_DATA_URL_PREFIX}${encodeURIComponent(svgString)}`
                        );
                    },
                    10
                );
            }
        );
    };

const svgDataUrlToPngBlob =
    dataUrl =>
        new Promise(
            (
                resolve,
                reject
            ) => {
                const svgString =
                    decodeURIComponent(
                        dataUrl.replace(
                            SVG_DATA_URL_PREFIX,
                            ''
                        )
                    );

                const svgBlob =
                    new Blob(
                        [svgString],
                        {
                            type:
                                'image/svg+xml;charset=utf-8'
                        }
                    );

                const svgUrl =
                    window.URL
                        .createObjectURL(
                            svgBlob
                        );

                const image =
                    new Image();

                image.onload = () => {
                    window.URL
                        .revokeObjectURL(
                            svgUrl
                        );

                    const width =
                        Math.max(
                            1,
                            Math.ceil(
                                image.naturalWidth ||
                                image.width
                            )
                        );

                    const height =
                        Math.max(
                            1,
                            Math.ceil(
                                image.naturalHeight ||
                                image.height
                            )
                        );

                    const canvas =
                        document.createElement(
                            'canvas'
                        );

                    canvas.width =
                        width *
                        PNG_EXPORT_SCALE;

                    canvas.height =
                        height *
                        PNG_EXPORT_SCALE;

                    const context =
                        canvas.getContext(
                            '2d'
                        );

                    if (!context) {
                        reject(
                            new Error(
                                'Could not create EasyBlox PNG canvas context.'
                            )
                        );

                        return;
                    }

                    context.drawImage(
                        image,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    canvas.toBlob(
                        blob => {
                            if (!blob) {
                                reject(
                                    new Error(
                                        'Could not create EasyBlox PNG image.'
                                    )
                                );

                                return;
                            }

                            resolve(blob);
                        },
                        PNG_MIME_TYPE
                    );
                };

                image.onerror =
                    () => {
                        window.URL
                            .revokeObjectURL(
                                svgUrl
                            );

                        reject(
                            new Error(
                                'Could not load EasyBlox SVG image.'
                            )
                        );
                    };

                image.src =
                    svgUrl;
            }
        );

const exportBlockAsPng =
    async blockId => {
        const showSaveFilePicker =
            typeof window !==
                'undefined' &&
            typeof window
                .showSaveFilePicker ===
                'function' ?
                window
                    .showSaveFilePicker
                    .bind(window) :
                null;

        let fileHandle = null;

        if (showSaveFilePicker) {
            try {
                fileHandle =
                    await showSaveFilePicker(
                        createSavePickerOptions(
                            PNG_EXPORT_FILENAME
                        )
                    );
            } catch (error) {
                if (
                    isAbortError(
                        error
                    )
                ) {
                    return null;
                }

                throw error;
            }
        }

        const svgDataUrl =
            await blockToExportSvgDataUrl(
                blockId
            );

        const pngBlob =
            await svgDataUrlToPngBlob(
                svgDataUrl
            );

        if (fileHandle) {
            await writeBlobToHandle(
                fileHandle,
                pngBlob
            );
        } else {
            downloadBlob(
                PNG_EXPORT_FILENAME,
                pngBlob
            );
        }

        return pngBlob;
    };

export {
    PNG_EXPORT_FILENAME,
    PNG_EXPORT_SCALE,
    blockToExportSvgDataUrl,
    createSavePickerOptions,
    svgDataUrlToPngBlob
};

export default exportBlockAsPng;
