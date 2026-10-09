const assert =
    require('node:assert/strict');

const {
    test
} = require('node:test');

const {
    UpdateService,
    compareVersions,
    parseVersion,
    validateManifest
} = require(
    '../src/update-service'
);

const createManifest =
    overrides => ({
        schemaVersion: 1,
        channel: 'stable',
        version: '0.4.0',
        publishedAt:
            '2026-10-09T00:00:00Z',
        downloadUrl:
            'https://easyblox.com.br/downloads/easyblox/windows/EasyBlox-Setup-0.4.0.exe',
        releaseNotesUrl:
            'https://easyblox.com.br/downloads/easyblox/windows/0.4.0/',
        ...overrides
    });

test(
    'EasyBlox version parser accepts release and prerelease versions',
    () => {
        assert.deepEqual(
            parseVersion(
                '0.4.0'
            ),
            {
                major: 0,
                minor: 4,
                patch: 0,
                prerelease: []
            }
        );

        assert.deepEqual(
            parseVersion(
                '0.4.0-rc.1'
            ),
            {
                major: 0,
                minor: 4,
                patch: 0,
                prerelease: [
                    'rc',
                    '1'
                ]
            }
        );
    }
);

test(
    'EasyBlox version comparator follows release ordering',
    () => {
        assert.equal(
            compareVersions(
                '0.4.0',
                '0.4.0-rc.1'
            ),
            1
        );

        assert.equal(
            compareVersions(
                '0.4.0-rc.2',
                '0.4.0-rc.1'
            ),
            1
        );

        assert.equal(
            compareVersions(
                '0.4.0',
                '0.4.0'
            ),
            0
        );

        assert.equal(
            compareVersions(
                '0.3.9',
                '0.4.0'
            ),
            -1
        );

        assert.equal(
            compareVersions(
                '1.0.0',
                '0.4.0'
            ),
            1
        );
    }
);

test(
    'EasyBlox update manifest validates the stable HTTPS contract',
    () => {
        const manifest =
            validateManifest(
                createManifest()
            );

        assert.equal(
            manifest.schemaVersion,
            1
        );

        assert.equal(
            manifest.channel,
            'stable'
        );

        assert.equal(
            manifest.version,
            '0.4.0'
        );

        assert.equal(
            manifest.downloadUrl,
            'https://easyblox.com.br/downloads/easyblox/windows/EasyBlox-Setup-0.4.0.exe'
        );
    }
);

test(
    'EasyBlox update manifest rejects non HTTPS download URLs',
    () => {
        assert.throws(
            () =>
                validateManifest(
                    createManifest({
                        downloadUrl:
                            'http://easyblox.com.br/EasyBlox.exe'
                    })
                ),
            /must use HTTPS/
        );
    }
);

test(
    'EasyBlox update service reports a newer stable release',
    async () => {
        const service =
            new UpdateService({
                fetchImpl:
                    async () => ({
                        ok: true,
                        json:
                            async () =>
                                createManifest()
                    })
            });

        const result =
            await service.check(
                '0.4.0-rc.1'
            );

        assert.equal(
            result.available,
            true
        );

        assert.equal(
            result.currentVersion,
            '0.4.0-rc.1'
        );

        assert.equal(
            result.manifest.version,
            '0.4.0'
        );
    }
);

test(
    'EasyBlox update service does not report the current release',
    async () => {
        const service =
            new UpdateService({
                fetchImpl:
                    async () => ({
                        ok: true,
                        json:
                            async () =>
                                createManifest()
                    })
            });

        const result =
            await service.check(
                '0.4.0'
            );

        assert.equal(
            result.available,
            false
        );
    }
);

test(
    'EasyBlox update service rejects failed manifest requests',
    async () => {
        const service =
            new UpdateService({
                fetchImpl:
                    async () => ({
                        ok: false
                    })
            });

        await assert.rejects(
            service.check(
                '0.4.0'
            ),
            /manifest request failed/
        );
    }
);
