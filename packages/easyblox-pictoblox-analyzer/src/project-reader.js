const JSZip =
    require('jszip');

const PROJECT_JSON_FILENAME =
    'project.json';

const isArrayBuffer =
    value =>
        (
            typeof ArrayBuffer !==
                'undefined' &&
            value instanceof
                ArrayBuffer
        );

const isBinarySource =
    value =>
        (
            Buffer.isBuffer(
                value
            ) ||
            value instanceof
                Uint8Array ||
            isArrayBuffer(
                value
            )
        );

const normalizeBinarySource =
    value => {
        if (
            Buffer.isBuffer(
                value
            )
        ) {
            return value;
        }

        if (
            value instanceof
                Uint8Array
        ) {
            return Buffer.from(
                value.buffer,
                value.byteOffset,
                value.byteLength
            );
        }

        if (
            isArrayBuffer(
                value
            )
        ) {
            return Buffer.from(
                value
            );
        }

        throw new TypeError(
            'PictoBlox project reader requires binary project data'
        );
    };

const validateProjectObject =
    project => {
        if (
            !project ||
            typeof project !==
                'object' ||
            Array.isArray(
                project
            )
        ) {
            throw new TypeError(
                'PictoBlox project reader requires a project object'
            );
        }

        return project;
    };

const parseProjectJson =
    jsonText => {
        if (
            typeof jsonText !==
                'string'
        ) {
            throw new TypeError(
                'PictoBlox project JSON must be a string'
            );
        }

        let project;

        try {
            project =
                JSON.parse(
                    jsonText
                );
        } catch (error) {
            throw new Error(
                `Invalid PictoBlox project JSON: ${
                    error.message
                }`
            );
        }

        return validateProjectObject(
            project
        );
    };

const looksLikeJson =
    binary => {
        const prefix =
            binary
                .subarray(
                    0,
                    Math.min(
                        binary.length,
                        256
                    )
                )
                .toString(
                    'utf8'
                )
                .trimStart();

        return prefix.startsWith(
            '{'
        );
    };

const readSb3Project =
    async binary => {
        let archive;

        try {
            archive =
                await JSZip.loadAsync(
                    binary
                );
        } catch (error) {
            throw new Error(
                `Invalid PictoBlox SB3 archive: ${
                    error.message
                }`
            );
        }

        const projectEntry =
            archive.file(
                PROJECT_JSON_FILENAME
            );

        if (!projectEntry) {
            throw new Error(
                'PictoBlox SB3 archive does not contain project.json'
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

const readProjectSource =
    async source => {
        if (
            typeof source ===
                'string'
        ) {
            return parseProjectJson(
                source
            );
        }

        if (
            !isBinarySource(
                source
            )
        ) {
            throw new TypeError(
                'PictoBlox project reader requires JSON text or binary project data'
            );
        }

        const binary =
            normalizeBinarySource(
                source
            );

        if (
            binary.length === 0
        ) {
            throw new Error(
                'PictoBlox project source is empty'
            );
        }

        if (
            looksLikeJson(
                binary
            )
        ) {
            return parseProjectJson(
                binary.toString(
                    'utf8'
                )
            );
        }

        return readSb3Project(
            binary
        );
    };

module.exports = {
    PROJECT_JSON_FILENAME,
    parseProjectJson,
    readProjectSource,
    readSb3Project
};
