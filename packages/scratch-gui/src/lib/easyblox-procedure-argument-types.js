const EASYBLOX_ARGUMENT_TYPES_ATTRIBUTE = 'easybloxargumenttypes';
const EASYBLOX_ARGUMENT_TYPES_PROPERTY = 'easybloxArgumentTypes_';
const EASYBLOX_REGISTERED_PROPERTY =
    'easybloxProcedureArgumentTypesRegistered_';

const readArgumentTypes = mutation => {
    if (!mutation) {
        return [];
    }

    const argumentTypes = mutation.getAttribute(
        EASYBLOX_ARGUMENT_TYPES_ATTRIBUTE
    );

    if (!argumentTypes) {
        return [];
    }

    try {
        return JSON.parse(argumentTypes);
    } catch (error) {
        return [];
    }
};

const createScratchCallProccode = (proccode, argumentTypes) => {
    let argumentIndex = 0;

    return proccode.replace(
        /(^|[^\\])%([nbs])/g,
        (match, prefix, argumentCode) => {
            const valueType = argumentTypes[argumentIndex];
            argumentIndex++;

            if (
                argumentCode === 's' &&
                (
                    valueType === 'INTEGER' ||
                    valueType === 'DECIMAL'
                )
            ) {
                return `${prefix}%n`;
            }

            return match;
        }
    );
};

const registerProcedurePrototype = ScratchBlocks => {
    const procedurePrototype =
        ScratchBlocks &&
        ScratchBlocks.Blocks &&
        ScratchBlocks.Blocks.procedures_prototype;

    if (
        !procedurePrototype ||
        typeof procedurePrototype.init !== 'function' ||
        procedurePrototype[EASYBLOX_REGISTERED_PROPERTY]
    ) {
        return;
    }

    const nativeInit = procedurePrototype.init;

    procedurePrototype.init = function () {
        nativeInit.call(this);

        const nativeDomToMutation = this.domToMutation;
        const nativeMutationToDom = this.mutationToDom;

        if (
            typeof nativeDomToMutation !== 'function' ||
            typeof nativeMutationToDom !== 'function'
        ) {
            return;
        }

        this.domToMutation = function (mutation) {
            nativeDomToMutation.call(this, mutation);

            this[EASYBLOX_ARGUMENT_TYPES_PROPERTY] =
                mutation ?
                    mutation.getAttribute(
                        EASYBLOX_ARGUMENT_TYPES_ATTRIBUTE
                    ) :
                    null;
        };

        this.mutationToDom = function (...args) {
            const mutation =
                nativeMutationToDom.apply(this, args);

            const argumentTypes =
                this[EASYBLOX_ARGUMENT_TYPES_PROPERTY];

            if (mutation && argumentTypes) {
                mutation.setAttribute(
                    EASYBLOX_ARGUMENT_TYPES_ATTRIBUTE,
                    argumentTypes
                );
            }

            return mutation;
        };
    };

    procedurePrototype[EASYBLOX_REGISTERED_PROPERTY] = true;
};

const registerProcedureCall = ScratchBlocks => {
    const procedureCall =
        ScratchBlocks &&
        ScratchBlocks.Blocks &&
        ScratchBlocks.Blocks.procedures_call;

    if (
        !procedureCall ||
        typeof procedureCall.init !== 'function' ||
        procedureCall[EASYBLOX_REGISTERED_PROPERTY]
    ) {
        return;
    }

    const nativeInit = procedureCall.init;

    procedureCall.init = function () {
        nativeInit.call(this);

        const nativeDomToMutation = this.domToMutation;
        const nativeMutationToDom = this.mutationToDom;

        if (
            typeof nativeDomToMutation !== 'function' ||
            typeof nativeMutationToDom !== 'function'
        ) {
            return;
        }

        this.domToMutation = function (mutation) {
            const canonicalProccode =
                mutation ?
                    mutation.getAttribute('proccode') || '' :
                    '';

            const argumentTypes = readArgumentTypes(mutation);

            this[EASYBLOX_ARGUMENT_TYPES_PROPERTY] =
                mutation ?
                    mutation.getAttribute(
                        EASYBLOX_ARGUMENT_TYPES_ATTRIBUTE
                    ) :
                    null;

            if (
                mutation &&
                canonicalProccode &&
                argumentTypes.length > 0
            ) {
                const scratchMutation =
                    mutation.cloneNode(true);

                scratchMutation.setAttribute(
                    'proccode',
                    createScratchCallProccode(
                        canonicalProccode,
                        argumentTypes
                    )
                );

                nativeDomToMutation.call(
                    this,
                    scratchMutation
                );

                this.procCode_ = canonicalProccode;
                return;
            }

            nativeDomToMutation.call(this, mutation);
        };

        this.mutationToDom = function (...args) {
            const mutation =
                nativeMutationToDom.apply(this, args);

            const argumentTypes =
                this[EASYBLOX_ARGUMENT_TYPES_PROPERTY];

            if (mutation && argumentTypes) {
                mutation.setAttribute(
                    EASYBLOX_ARGUMENT_TYPES_ATTRIBUTE,
                    argumentTypes
                );
            }

            return mutation;
        };
    };

    procedureCall[EASYBLOX_REGISTERED_PROPERTY] = true;
};

/**
 * Preserve EasyBlox procedure parameter metadata and use the matching native
 * Scratch input shape when procedure calls are rendered.
 * @param {object} ScratchBlocks ScratchBlocks namespace.
 */
const registerEasyBloxProcedureArgumentTypes = ScratchBlocks => {
    registerProcedurePrototype(ScratchBlocks);
    registerProcedureCall(ScratchBlocks);
};

export default registerEasyBloxProcedureArgumentTypes;
