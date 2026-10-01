import {
    PROJECT_ORIGINS,
    convertExternalSb3Archive
} from '@easymaker/easyblox-sb3-converter';

const IMPORT_STATUSES =
    Object.freeze({
        READY:
            'ready',

        ALREADY_EASYBLOX:
            'already-easyblox',

        UNSUPPORTED:
            'unsupported',

        UNSAFE:
            'unsafe'
    });

const prepareEasyBloxExternalProjectImport =
    async source => {
        const conversion =
            await convertExternalSb3Archive(
                source
            );

        if (
            conversion.canConvert &&
            conversion.sb3 &&
            conversion.report &&
            conversion.report.isLoadSafe ===
                true
        ) {
            return {
                status:
                    IMPORT_STATUSES.READY,

                origin:
                    conversion.origin,

                sb3:
                    conversion.sb3,

                requiresReview:
                    conversion.report
                        .requiresReview ===
                    true,

                report:
                    conversion.report
            };
        }

        if (
            conversion.origin ===
            PROJECT_ORIGINS.EASYBLOX
        ) {
            return {
                status:
                    IMPORT_STATUSES
                        .ALREADY_EASYBLOX,

                origin:
                    conversion.origin,

                sb3:
                    null,

                requiresReview:
                    false,

                report:
                    null
            };
        }

        if (
            !conversion.canConvert
        ) {
            return {
                status:
                    IMPORT_STATUSES.UNSUPPORTED,

                origin:
                    conversion.origin,

                sb3:
                    null,

                requiresReview:
                    false,

                report:
                    null
            };
        }

        return {
            status:
                IMPORT_STATUSES.UNSAFE,

            origin:
                conversion.origin,

            sb3:
                null,

            requiresReview:
                true,

            report:
                conversion.report ||
                null
        };
    };

export {
    IMPORT_STATUSES
};

export default
prepareEasyBloxExternalProjectImport;