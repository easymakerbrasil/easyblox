const CONTROLLER_MODES = Object.freeze({
    EDIT: 'edit',
    RUN: 'run'
});

const SUPPORTED_CONTROLLER_MODES = new Set(
    Object.values(CONTROLLER_MODES)
);

class ControllerState {
    constructor () {
        this._mode = CONTROLLER_MODES.EDIT;
    }

    getMode () {
        return this._mode;
    }

    setMode (mode) {
        if (!SUPPORTED_CONTROLLER_MODES.has(mode)) {
            throw new Error(`Unsupported controller mode: ${mode}`);
        }

        this._mode = mode;
    }
}

module.exports = {
    ControllerState,
    CONTROLLER_MODES
};
