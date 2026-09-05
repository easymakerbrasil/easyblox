const OPEN_CONTROLLER =
    'scratch-gui/controller-desktop/OPEN';
const CLOSE_CONTROLLER =
    'scratch-gui/controller-desktop/CLOSE';
const TOGGLE_CONTROLLER =
    'scratch-gui/controller-desktop/TOGGLE';

const controllerDesktopInitialState = {
    isOpen: false
};

const reducer = function (
    state = controllerDesktopInitialState,
    action
) {
    switch (action.type) {
    case OPEN_CONTROLLER:
        return {
            ...state,
            isOpen: true
        };
    case CLOSE_CONTROLLER:
        return {
            ...state,
            isOpen: false
        };
    case TOGGLE_CONTROLLER:
        return {
            ...state,
            isOpen: !state.isOpen
        };
    default:
        return state;
    }
};

const openController = () => ({
    type: OPEN_CONTROLLER
});

const closeController = () => ({
    type: CLOSE_CONTROLLER
});

const toggleController = () => ({
    type: TOGGLE_CONTROLLER
});

const isControllerOpen = state =>
    Boolean(
        state &&
        state.scratchGui &&
        state.scratchGui.controllerDesktop &&
        state.scratchGui.controllerDesktop.isOpen
    );

export {
    reducer as default,
    controllerDesktopInitialState,
    openController,
    closeController,
    toggleController,
    isControllerOpen
};
