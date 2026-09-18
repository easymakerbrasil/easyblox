const OPEN_EASYCONECT =
    'scratch-gui/easyconect-desktop/OPEN';

const CLOSE_EASYCONECT =
    'scratch-gui/easyconect-desktop/CLOSE';

const TOGGLE_EASYCONECT =
    'scratch-gui/easyconect-desktop/TOGGLE';

const SET_EASYCONECT_CONNECTED =
    'scratch-gui/easyconect-desktop/SET_CONNECTED';

const easyConectDesktopInitialState = {
    isOpen:
        false,
    isConnected:
        false
};

const reducer = function (
    state = easyConectDesktopInitialState,
    action
) {
    switch (action.type) {
    case OPEN_EASYCONECT:
        return {
            ...state,
            isOpen:
                true
        };

    case CLOSE_EASYCONECT:
        return {
            ...state,
            isOpen:
                false
        };

    case TOGGLE_EASYCONECT:
        return {
            ...state,
            isOpen:
                !state.isOpen
        };

    case SET_EASYCONECT_CONNECTED:
        return {
            ...state,
            isConnected:
                Boolean(
                    action.isConnected
                )
        };

    default:
        return state;
    }
};

const openEasyConect = () => ({
    type:
        OPEN_EASYCONECT
});

const closeEasyConect = () => ({
    type:
        CLOSE_EASYCONECT
});

const toggleEasyConect = () => ({
    type:
        TOGGLE_EASYCONECT
});

const setEasyConectConnected =
    isConnected => ({
        type:
            SET_EASYCONECT_CONNECTED,
        isConnected:
            Boolean(
                isConnected
            )
    });

const isEasyConectOpen =
    state =>
        Boolean(
            state &&
            state.scratchGui &&
            state.scratchGui.easyConectDesktop &&
            state.scratchGui.easyConectDesktop.isOpen
        );

const isEasyConectConnected =
    state =>
        Boolean(
            state &&
            state.scratchGui &&
            state.scratchGui.easyConectDesktop &&
            state.scratchGui.easyConectDesktop.isConnected
        );

export {
    reducer as default,
    easyConectDesktopInitialState,
    openEasyConect,
    closeEasyConect,
    toggleEasyConect,
    setEasyConectConnected,
    isEasyConectOpen,
    isEasyConectConnected
};
