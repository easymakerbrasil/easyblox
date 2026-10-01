import {
    PROJECT_ORIGINS,
    convertExternalSb3Archive
} from '@easymaker/easyblox-sb3-converter';

import prepareEasyBloxExternalProjectImport, {
    IMPORT_STATUSES
} from '../../../src/lib/easyblox-external-project-import-service';

jest.mock(
    '@easymaker/easyblox-sb3-converter',
    () => ({
        PROJECT_ORIGINS: {
            EASYBLOX:
                'easyblox',

            PICTOBLOX:
                'pictoblox',

            UNKNOWN:
                'unknown'
        },

        convertExternalSb3Archive:
            jest.fn()
    })
);

describe(
    'EasyBlox external project import service',
    () => {
        beforeEach(
            () => {
                jest.clearAllMocks();
            }
        );

        test(
            'returns a browser-safe converted SB3 for a load-safe PictoBlox project',
            async () => {
                const source =
                    new ArrayBuffer(
                        8
                    );

                const sb3 =
                    new Uint8Array([
                        1,
                        2,
                        3
                    ]);

                convertExternalSb3Archive
                    .mockResolvedValue({
                        origin:
                            PROJECT_ORIGINS
                                .PICTOBLOX,

                        canConvert:
                            true,

                        sb3,

                        report: {
                            isLoadSafe:
                                true,

                            requiresReview:
                                false
                        }
                    });

                const result =
                    await prepareEasyBloxExternalProjectImport(
                        source
                    );

                expect(
                    result.status
                ).toBe(
                    IMPORT_STATUSES.READY
                );

                expect(
                    result.sb3
                ).toBe(
                    sb3
                );

                expect(
                    result.requiresReview
                ).toBe(
                    false
                );

                expect(
                    convertExternalSb3Archive
                ).toHaveBeenCalledWith(
                    source
                );
            }
        );

        test(
            'preserves the review signal for a safely quarantined PictoBlox project',
            async () => {
                const report = {
                    isLoadSafe:
                        true,

                    requiresReview:
                        true
                };

                convertExternalSb3Archive
                    .mockResolvedValue({
                        origin:
                            PROJECT_ORIGINS
                                .PICTOBLOX,

                        canConvert:
                            true,

                        sb3:
                            new Uint8Array([
                                4,
                                5,
                                6
                            ]),

                        report
                    });

                const result =
                    await prepareEasyBloxExternalProjectImport(
                        new ArrayBuffer(
                            4
                        )
                    );

                expect(
                    result.status
                ).toBe(
                    IMPORT_STATUSES.READY
                );

                expect(
                    result.requiresReview
                ).toBe(
                    true
                );

                expect(
                    result.report
                ).toBe(
                    report
                );
            }
        );

        test(
            'directs an EasyBlox project back to the normal Open workflow',
            async () => {
                convertExternalSb3Archive
                    .mockResolvedValue({
                        origin:
                            PROJECT_ORIGINS
                                .EASYBLOX,

                        canConvert:
                            false,

                        sb3:
                            null,

                        report:
                            null
                    });

                const result =
                    await prepareEasyBloxExternalProjectImport(
                        new ArrayBuffer(
                            4
                        )
                    );

                expect(
                    result.status
                ).toBe(
                    IMPORT_STATUSES
                        .ALREADY_EASYBLOX
                );

                expect(
                    result.sb3
                ).toBeNull();
            }
        );

        test(
            'rejects an unknown external SB3 instead of loading it as converted content',
            async () => {
                convertExternalSb3Archive
                    .mockResolvedValue({
                        origin:
                            PROJECT_ORIGINS
                                .UNKNOWN,

                        canConvert:
                            false,

                        sb3:
                            null,

                        report:
                            null
                    });

                const result =
                    await prepareEasyBloxExternalProjectImport(
                        new ArrayBuffer(
                            4
                        )
                    );

                expect(
                    result.status
                ).toBe(
                    IMPORT_STATUSES.UNSUPPORTED
                );

                expect(
                    result.sb3
                ).toBeNull();
            }
        );

        test(
            'refuses to load a PictoBlox conversion that is not load-safe',
            async () => {
                const report = {
                    isLoadSafe:
                        false,

                    requiresReview:
                        true
                };

                convertExternalSb3Archive
                    .mockResolvedValue({
                        origin:
                            PROJECT_ORIGINS
                                .PICTOBLOX,

                        canConvert:
                            true,

                        sb3:
                            new Uint8Array([
                                7,
                                8,
                                9
                            ]),

                        report
                    });

                const result =
                    await prepareEasyBloxExternalProjectImport(
                        new ArrayBuffer(
                            4
                        )
                    );

                expect(
                    result.status
                ).toBe(
                    IMPORT_STATUSES.UNSAFE
                );

                expect(
                    result.sb3
                ).toBeNull();

                expect(
                    result.report
                ).toBe(
                    report
                );
            }
        );
    }
);
