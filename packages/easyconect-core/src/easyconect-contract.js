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
        GAMEPAD: 'gamepad',
        CONTROLS: 'controls',
        MOTORS_SERVO: 'motorsServo'
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

const EASYCONECT_CONTROLS_SIGNAL_IDS =
    Object.freeze({
        JOYSTICK_X:
            'controls.joystick.x',
        JOYSTICK_Y:
            'controls.joystick.y',
        SLIDER:
            'controls.slider',
        BUTTON:
            'controls.button',
        SWITCH:
            'controls.switch'
    });

const EASYCONECT_MOTORS_SERVO_SIGNAL_IDS =
    Object.freeze({
        MOTOR_1:
            'motorsServo.motor1',
        MOTOR_2:
            'motorsServo.motor2',
        SERVO_1:
            'motorsServo.servo1',
        SERVO_2:
            'motorsServo.servo2',
        SERVO_3:
            'motorsServo.servo3',
        SERVO_4:
            'motorsServo.servo4'
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

const createNumberInputSignal =
    (
        id,
        minimum,
        maximum
    ) =>
        Object.freeze({
            id,
            type:
                EASYCONECT_SIGNAL_TYPES
                    .NUMBER,
            direction:
                EASYCONECT_SIGNAL_DIRECTIONS
                    .INPUT,
            minimum,
            maximum
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

const EASYCONECT_CONTROLS_MODULE =
    Object.freeze({
        id:
            EASYCONECT_MODULE_IDS
                .CONTROLS,
        signals:
            Object.freeze([
                createNumberInputSignal(
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .JOYSTICK_X,
                    -100,
                    100
                ),
                createNumberInputSignal(
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .JOYSTICK_Y,
                    -100,
                    100
                ),
                createNumberInputSignal(
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .SLIDER,
                    0,
                    100
                ),
                createBooleanInputSignal(
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .BUTTON
                ),
                createBooleanInputSignal(
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .SWITCH
                )
            ])
    });

const EASYCONECT_MOTORS_SERVO_MODULE =
    Object.freeze({
        id:
            EASYCONECT_MODULE_IDS
                .MOTORS_SERVO,
        signals:
            Object.freeze([
                createNumberInputSignal(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_1,
                    -100,
                    100
                ),
                createNumberInputSignal(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .MOTOR_2,
                    -100,
                    100
                ),
                createNumberInputSignal(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .SERVO_1,
                    0,
                    180
                ),
                createNumberInputSignal(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .SERVO_2,
                    0,
                    180
                ),
                createNumberInputSignal(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .SERVO_3,
                    0,
                    180
                ),
                createNumberInputSignal(
                    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                        .SERVO_4,
                    0,
                    180
                )
            ])
    });

module.exports = {
    EASYCONECT_SIGNAL_TYPES,
    EASYCONECT_SIGNAL_DIRECTIONS,
    EASYCONECT_MODULE_IDS,
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_GAMEPAD_MODULE,
    EASYCONECT_CONTROLS_SIGNAL_IDS,
    EASYCONECT_CONTROLS_MODULE,
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
    EASYCONECT_MOTORS_SERVO_MODULE
};
