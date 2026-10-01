const JSZip =
    require('jszip');

const {
    PROJECT_JSON_FILENAME,
    parseProjectJson
} = require(
    '@easymaker/easyblox-pictoblox-analyzer/src/browser'
);

const {
    convertExternalSb3Project
} = require('./conversion-runner');

const isArrayBuffer =
    value =>
        (
            typeof ArrayBuffer !==
                'undefined' &&
            value instanceof
                ArrayBuffer
        );

const normalizeBinarySource =
    source => {
        if (
            source instanceof
                Uint8Array
        ) {
            return source;
        }

        if (
            isArrayBuffer(
                source
            )
        ) {
            return new Uint8Array(
                source
            );
        }

        throw new TypeError(
            'SB3 archive converter requires binary project data'
        );
    };

const loadSb3Archive =
    async source => {
        const binary =
            normalizeBinarySource(
                source
            );

        if (
            binary.length ===
            0
        ) {
            throw new Error(
                'SB3 archive converter received an empty project'
            );
        }

        try {
            return await JSZip.loadAsync(
                binary
            );
        } catch (error) {
            throw new Error(
                `Invalid external SB3 archive: ${
                    error.message
                }`
            );
        }
    };

const readArchiveProject =
    async archive => {
        const projectEntry =
            archive.file(
                PROJECT_JSON_FILENAME
            );

        if (!projectEntry) {
            throw new Error(
                'External SB3 archive does not contain project.json'
            );
        }

        const projectJson =
            await projectEntry.async(
                'string'
            );

        return parseProjectJson(
            projectJson
        );
    };

const convertExternalSb3Archive =
    async source => {
        const archive =
            await loadSb3Archive(
                source
            );

        const project =
            await readArchiveProject(
                archive
            );

        const conversion =
            convertExternalSb3Project(
                project
            );

        if (
            !conversion.canConvert
        ) {
            return {
                ...conversion,

                sb3:
                    null
            };
        }

        archive.file(
            PROJECT_JSON_FILENAME,
            JSON.stringify(
                conversion.project
            )
        );

        const sb3 =
            await archive.generateAsync({
                type:
                    'uint8array',

                compression:
                    'DEFLATE',

                compressionOptions: {
                    level:
                        6
                }
            });

        return {
            ...conversion,

            sb3
        };
    };

module.exports = {
    convertExternalSb3Archive
};
