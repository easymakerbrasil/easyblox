const DEFAULT_UPDATE_MANIFEST_URL =
    'https://easyblox.com.br/downloads/easyblox/windows/latest.json';

const UPDATE_REQUEST_TIMEOUT_MS =
    5000;

const VERSION_PATTERN =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

const parseVersion =
    version => {
        if (
            typeof version !==
            'string'
        ) {
            throw new Error(
                'EasyBlox version must be a string'
            );
        }

        const match =
            VERSION_PATTERN.exec(
                version
            );

        if (!match) {
            throw new Error(
                `Invalid EasyBlox version: ${version}`
            );
        }

        return {
            major:
                Number(match[1]),
            minor:
                Number(match[2]),
            patch:
                Number(match[3]),
            prerelease:
                match[4] ?
                    match[4].split('.') :
                    []
        };
    };

const comparePrerelease =
    (
        leftIdentifiers,
        rightIdentifiers
    ) => {
        if (
            leftIdentifiers.length === 0 &&
            rightIdentifiers.length === 0
        ) {
            return 0;
        }

        if (
            leftIdentifiers.length === 0
        ) {
            return 1;
        }

        if (
            rightIdentifiers.length === 0
        ) {
            return -1;
        }

        const length =
            Math.max(
                leftIdentifiers.length,
                rightIdentifiers.length
            );

        for (
            let index = 0;
            index < length;
            index++
        ) {
            const left =
                leftIdentifiers[index];

            const right =
                rightIdentifiers[index];

            if (left === undefined) {
                return -1;
            }

            if (right === undefined) {
                return 1;
            }

            if (left === right) {
                continue;
            }

            const leftNumeric =
                /^\d+$/.test(
                    left
                );

            const rightNumeric =
                /^\d+$/.test(
                    right
                );

            if (
                leftNumeric &&
                rightNumeric
            ) {
                return (
                    Number(left) >
                    Number(right)
                ) ?
                    1 :
                    -1;
            }

            if (leftNumeric) {
                return -1;
            }

            if (rightNumeric) {
                return 1;
            }

            return (
                left >
                right
            ) ?
                1 :
                -1;
        }

        return 0;
    };

const compareVersions =
    (
        leftVersion,
        rightVersion
    ) => {
        const left =
            parseVersion(
                leftVersion
            );

        const right =
            parseVersion(
                rightVersion
            );

        for (
            const field of [
                'major',
                'minor',
                'patch'
            ]
        ) {
            if (
                left[field] >
                right[field]
            ) {
                return 1;
            }

            if (
                left[field] <
                right[field]
            ) {
                return -1;
            }
        }

        return comparePrerelease(
            left.prerelease,
            right.prerelease
        );
    };

const validateHttpsUrl =
    (
        value,
        fieldName
    ) => {
        let url;

        try {
            url =
                new URL(
                    value
                );
        } catch {
            throw new Error(
                `Invalid update ${fieldName}`
            );
        }

        if (
            url.protocol !==
            'https:'
        ) {
            throw new Error(
                `Update ${fieldName} must use HTTPS`
            );
        }

        return url.toString();
    };

const validateManifest =
    manifest => {
        if (
            !manifest ||
            typeof manifest !==
                'object' ||
            Array.isArray(
                manifest
            )
        ) {
            throw new Error(
                'Invalid EasyBlox update manifest'
            );
        }

        if (
            manifest.schemaVersion !==
            1
        ) {
            throw new Error(
                'Unsupported EasyBlox update manifest schema'
            );
        }

        if (
            manifest.channel !==
            'stable'
        ) {
            throw new Error(
                'Unsupported EasyBlox update channel'
            );
        }

        parseVersion(
            manifest.version
        );

        const publishedAt =
            new Date(
                manifest.publishedAt
            );

        if (
            Number.isNaN(
                publishedAt.getTime()
            )
        ) {
            throw new Error(
                'Invalid update publishedAt'
            );
        }

        return Object.freeze({
            schemaVersion:
                manifest.schemaVersion,
            channel:
                manifest.channel,
            version:
                manifest.version,
            publishedAt:
                publishedAt.toISOString(),
            downloadUrl:
                validateHttpsUrl(
                    manifest.downloadUrl,
                    'downloadUrl'
                ),
            releaseNotesUrl:
                validateHttpsUrl(
                    manifest.releaseNotesUrl,
                    'releaseNotesUrl'
                )
        });
    };

class UpdateService {
    constructor ({
        fetchImpl,
        manifestUrl =
            DEFAULT_UPDATE_MANIFEST_URL,
        timeoutMs =
            UPDATE_REQUEST_TIMEOUT_MS
    }) {
        if (
            typeof fetchImpl !==
            'function'
        ) {
            throw new Error(
                'UpdateService requires fetchImpl'
            );
        }

        this._fetch =
            fetchImpl;

        this._manifestUrl =
            manifestUrl;

        this._timeoutMs =
            timeoutMs;
    }

    async check (
        currentVersion
    ) {
        parseVersion(
            currentVersion
        );

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => {
                    controller.abort();
                },
                this._timeoutMs
            );

        try {
            const response =
                await this._fetch(
                    this._manifestUrl,
                    {
                        signal:
                            controller.signal,
                        cache:
                            'no-store'
                    }
                );

            if (
                !response ||
                !response.ok
            ) {
                throw new Error(
                    'EasyBlox update manifest request failed'
                );
            }

            const manifest =
                validateManifest(
                    await response.json()
                );

            return Object.freeze({
                available:
                    compareVersions(
                        manifest.version,
                        currentVersion
                    ) > 0,
                currentVersion,
                manifest
            });
        } finally {
            clearTimeout(
                timeout
            );
        }
    }
}

module.exports = {
    DEFAULT_UPDATE_MANIFEST_URL,
    UpdateService,
    compareVersions,
    parseVersion,
    validateManifest
};
