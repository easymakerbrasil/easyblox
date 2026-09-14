const EASYCONECT_SIGNAL_TYPES =
    Object.freeze({
        BOOLEAN: 'boolean',
        NUMBER: 'number',
        TEXT: 'text'
    });

const EASYCONECT_SIGNAL_DIRECTIONS =
    Object.freeze({
        INPUT: 'input',
        OUTPUT: 'output'
    });

const EASYCONECT_MODULE_IDS =
    Object.freeze({
        GAMEPAD: 'gamepad'
    });

const EASYCONECT_GAMEPAD_SIGNAL_IDS =
    Object.freeze({
        DPAD_UP:
            'gamepad.dpad.up',
        DPAD_DOWN:
            'gamepad.dpad.down',
        DPAD_LEFT:
            'gamepad.dpad.left',
        DPAD_RIGHT:
            'gamepad.dpad.right',
        ACTION_TOP:
            'gamepad.action.top',
        ACTION_LEFT:
            'gamepad.action.left',
        ACTION_BOTTOM:
            'gamepad.action.bottom',
        ACTION_RIGHT:
            'gamepad.action.right'
    });

const createBooleanInputSignal =
    id =>
        Object.freeze({
            id,
            type:
                EASYCONECT_SIGNAL_TYPES
                    .BOOLEAN,
            direction:
                EASYCONECT_SIGNAL_DIRECTIONS
                    .INPUT
        });

const EASYCONECT_GAMEPAD_MODULE =
    Object.freeze({
        id:
            EASYCONECT_MODULE_IDS
                .GAMEPAD,
        signals:
            Object.freeze([
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .DPAD_UP
                ),
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .DPAD_DOWN
                ),
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .DPAD_LEFT
                ),
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .DPAD_RIGHT
                ),
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .ACTION_TOP
                ),
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .ACTION_LEFT
                ),
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .ACTION_BOTTOM
                ),
                createBooleanInputSignal(
                    EASYCONECT_GAMEPAD_SIGNAL_IDS
                        .ACTION_RIGHT
                )
            ])
    });

module.exports = {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_GAMEPAD_MODULE
};
