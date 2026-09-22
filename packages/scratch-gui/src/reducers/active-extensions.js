const ACTIVATE_EXTENSION =
    'scratch-gui/active-extensions/ACTIVATE_EXTENSION';

const DEACTIVATE_EXTENSION =
    'scratch-gui/active-extensions/DEACTIVATE_EXTENSION';

const activeExtensionsInitialState = [];

const reducer = function (
    state = activeExtensionsInitialState,
    action
) {
    switch (action.type) {
    case ACTIVATE_EXTENSION:
        if (
            state.includes(
                action.extensionId
            )
        ) {
            return state;
        }

        return [
            ...state,
            action.extensionId
        ];

    case DEACTIVATE_EXTENSION:
        if (
            !state.includes(
                action.extensionId
            )
        ) {
            return state;
        }

        return state.filter(
            extensionId =>
                extensionId !==
                action.extensionId
        );

    default:
        return state;
    }
};

const activateExtension =
    function (extensionId) {
        return {
            type:
                ACTIVATE_EXTENSION,
            extensionId
        };
    };

const deactivateExtension =
    function (extensionId) {
        return {
            type:
                DEACTIVATE_EXTENSION,
            extensionId
        };
    };

const getActiveExtensionIds =
    function (state) {
        if (
            !state ||
            !state.scratchGui ||
            !Array.isArray(
                state
                    .scratchGui
                    .activeExtensions
            )
        ) {
            return [];
        }

        return state
            .scratchGui
            .activeExtensions;
    };

const isExtensionActive =
    function (
        state,
        extensionId
    ) {
        return getActiveExtensionIds(
            state
        ).includes(
            extensionId
        );
    };

export {
    reducer as default,
    activateExtension,
    activeExtensionsInitialState,
    deactivateExtension,
    getActiveExtensionIds,
    isExtensionActive
};
