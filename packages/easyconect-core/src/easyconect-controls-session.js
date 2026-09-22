const {
    EBCP_CONTRACT
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    EASYCONECT_CONTROLS_SIGNAL_IDS
} = require('./easyconect-contract');

const {
    validateEasyConectSignalValue
} = require('./easyconect-registry');

const {
    getEasyConectWireChannel
} = require('./easyconect-wire-contract');

const NUMBER =
    EBCP_CONTRACT
        .messageTypes
        .NUMBER;

const BOOLEAN =
    EBCP_CONTRACT
        .messageTypes
        .BOOLEAN;

class EasyConectControlsSession {
    constructor (options = {}) {
        const {
            connection
        } = options;

        if (
            !connection ||
            typeof connection !==
                'object'
        ) {
            throw new Error(
                'EasyConect Controls connection must be an object'
            );
        }

        if (
            typeof connection.send !==
                'function'
        ) {
            throw new Error(
                'EasyConect Controls connection send must be a function'
            );
        }

        this._connection =
            connection;

        this._joystickX = 0;
        this._joystickY = 0;
        this._slider = 0;
        this._buttonPressed = false;
        this._switchOn = false;
    }

    getJoystickPosition () {
        return {
            x:
                this._joystickX,
            y:
                this._joystickY
        };
    }

    getSliderValue () {
        return this._slider;
    }

    getButtonPressed () {
        return this._buttonPressed;
    }

    getSwitchOn () {
        return this._switchOn;
    }

    async setJoystickPosition (
        x,
        y
    ) {
        validateEasyConectSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_X,
            x
        );

        validateEasyConectSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_Y,
            y
        );

        let changed = false;

        if (x !== this._joystickX) {
            await this._connection.send(
                NUMBER,
                getEasyConectWireChannel(
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .JOYSTICK_X
                ),
                x
            );

            this._joystickX =
                x;

            changed =
                true;
        }

        if (y !== this._joystickY) {
            await this._connection.send(
                NUMBER,
                getEasyConectWireChannel(
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .JOYSTICK_Y
                ),
                y
            );

            this._joystickY =
                y;

            changed =
                true;
        }

        return changed;
    }

    async setSliderValue (value) {
        validateEasyConectSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .SLIDER,
            value
        );

        if (value === this._slider) {
            return false;
        }

        await this._connection.send(
            NUMBER,
            getEasyConectWireChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SLIDER
            ),
            value
        );

        this._slider =
            value;

        return true;
    }

    async setButtonPressed (pressed) {
        validateEasyConectSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .BUTTON,
            pressed
        );

        if (
            pressed ===
            this._buttonPressed
        ) {
            return false;
        }

        await this._connection.send(
            BOOLEAN,
            getEasyConectWireChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .BUTTON
            ),
            pressed
        );

        this._buttonPressed =
            pressed;

        return true;
    }

    async setSwitchOn (on) {
        validateEasyConectSignalValue(
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .SWITCH,
            on
        );

        if (on === this._switchOn) {
            return false;
        }

        await this._connection.send(
            BOOLEAN,
            getEasyConectWireChannel(
                EASYCONECT_CONTROLS_SIGNAL_IDS
                    .SWITCH
            ),
            on
        );

        this._switchOn =
            on;

        return true;
    }
}

module.exports = {
    EasyConectControlsSession
};
