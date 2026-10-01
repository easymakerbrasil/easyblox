const cloneJson =
    value =>
        JSON.parse(
            JSON.stringify(
                value
            )
        );

const isCanonicalScalar =
    value =>
        typeof value ===
            'string' ||
        typeof value ===
            'number' ||
        typeof value ===
            'boolean';

const isCanonicalVariableDescriptor =
    descriptor =>
        (
            Array.isArray(
                descriptor
            ) &&
            (
                descriptor.length ===
                    2 ||
                descriptor.length ===
                    3
            ) &&
            typeof descriptor[0] ===
                'string' &&
            isCanonicalScalar(
                descriptor[1]
            ) &&
            (
                descriptor.length ===
                    2 ||
                typeof descriptor[2] ===
                    'boolean'
            )
        );

const isCanonicalListDescriptor =
    descriptor =>
        (
            Array.isArray(
                descriptor
            ) &&
            descriptor.length ===
                2 &&
            typeof descriptor[0] ===
                'string' &&
            Array.isArray(
                descriptor[1]
            ) &&
            descriptor[1]
                .every(
                    isCanonicalScalar
                )
        );

const normalizePictoBloxProjectData =
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
                'PictoBlox project data normalizer requires a project object'
            );
        }

        const normalizedProject =
            cloneJson(
                project
            );

        const normalizedVariables = [];
        const deferred = [];

        (
            Array.isArray(
                normalizedProject.targets
            ) ?
                normalizedProject.targets :
                []
        ).forEach(
            (
                target,
                targetIndex
            ) => {
                if (
                    !target ||
                    typeof target !==
                        'object' ||
                    Array.isArray(
                        target
                    )
                ) {
                    return;
                }

                const variables =
                    target.variables &&
                    typeof target.variables ===
                        'object' &&
                    !Array.isArray(
                        target.variables
                    ) ?
                        target.variables :
                        {};

                Object.entries(
                    variables
                ).forEach(
                    ([
                        id,
                        descriptor
                    ]) => {
                        if (
                            isCanonicalVariableDescriptor(
                                descriptor
                            )
                        ) {
                            return;
                        }

                        if (
                            Array.isArray(
                                descriptor
                            ) &&
                            descriptor.length ===
                                1 &&
                            typeof descriptor[0] ===
                                'string'
                        ) {
                            variables[id] = [
                                descriptor[0],
                                0
                            ];

                            normalizedVariables.push({
                                targetIndex,

                                targetName:
                                    target.name,

                                id,

                                name:
                                    descriptor[0],

                                defaultValue:
                                    0
                            });

                            return;
                        }

                        deferred.push({
                            kind:
                                'variable',

                            reason:
                                'unsupported-variable-descriptor',

                            targetIndex,

                            targetName:
                                target.name,

                            id,

                            descriptor:
                                cloneJson(
                                    descriptor
                                )
                        });
                    }
                );

                const lists =
                    target.lists &&
                    typeof target.lists ===
                        'object' &&
                    !Array.isArray(
                        target.lists
                    ) ?
                        target.lists :
                        {};

                Object.entries(
                    lists
                ).forEach(
                    ([
                        id,
                        descriptor
                    ]) => {
                        if (
                            isCanonicalListDescriptor(
                                descriptor
                            )
                        ) {
                            return;
                        }

                        deferred.push({
                            kind:
                                'list',

                            reason:
                                'unsupported-list-descriptor',

                            targetIndex,

                            targetName:
                                target.name,

                            id,

                            descriptor:
                                cloneJson(
                                    descriptor
                                )
                        });
                    }
                );
            }
        );

        return {
            project:
                normalizedProject,

            report: {
                normalizedVariableCount:
                    normalizedVariables
                        .length,

                deferredCount:
                    deferred.length,

                normalizedVariables,

                deferred
            }
        };
    };

module.exports = {
    normalizePictoBloxProjectData
};
