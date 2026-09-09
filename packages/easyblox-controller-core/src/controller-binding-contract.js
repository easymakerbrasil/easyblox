const {
    CONTROLLER_COMPONENT_TYPES
} = require('./controller-model');

const CONTROLLER_BINDING_DIRECTIONS = Object.freeze({
    INPUT: 'input',
    OUTPUT: 'output',
    BIDIRECTIONAL: 'bidirectional'
});

const CONTROLLER_BINDING_VALUE_TYPES = Object.freeze({
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    TEXT: 'text'
});

const CONTROLLER_COMPONENT_PORTS = Object.freeze({
    GAMEPAD: Object.freeze({
        HORIZONTAL:
            'horizontal',
        VERTICAL:
            'vertical',
        BUTTON_A:
            'button-a',
        BUTTON_B:
            'button-b'
    }),
    JOYSTICK: Object.freeze({
        X:
            'x',
        Y:
            'y'
    }),
    SLIDER: Object.freeze({
        VALUE:
            'value'
    }),
    BUTTON: Object.freeze({
        PRESSED:
            'pressed'
    }),
    TOGGLE: Object.freeze({
        ON:
            'on'
    }),
    INDICATOR: Object.freeze({
        ON:
            'on'
    }),
    SERIAL: Object.freeze({
        TEXT:
            'text'
    })
});

const {
    INPUT,
    OUTPUT,
    BIDIRECTIONAL
} = CONTROLLER_BINDING_DIRECTIONS;

const {
    NUMBER,
    BOOLEAN,
    TEXT
} = CONTROLLER_BINDING_VALUE_TYPES;

const CONTROLLER_BINDING_CONTRACT = Object.freeze({
    [CONTROLLER_COMPONENT_TYPES.GAMEPAD]:
        Object.freeze({
            [CONTROLLER_COMPONENT_PORTS.GAMEPAD.HORIZONTAL]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        NUMBER,
                    minimum:
                        -1,
                    maximum:
                        1,
                    integer:
                        true
                }),
            [CONTROLLER_COMPONENT_PORTS.GAMEPAD.VERTICAL]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        NUMBER,
                    minimum:
                        -1,
                    maximum:
                        1,
                    integer:
                        true
                }),
            [CONTROLLER_COMPONENT_PORTS.GAMEPAD.BUTTON_A]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        BOOLEAN
                }),
            [CONTROLLER_COMPONENT_PORTS.GAMEPAD.BUTTON_B]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        BOOLEAN
                })
        }),

    [CONTROLLER_COMPONENT_TYPES.JOYSTICK]:
        Object.freeze({
            [CONTROLLER_COMPONENT_PORTS.JOYSTICK.X]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        NUMBER,
                    minimum:
                        -100,
                    maximum:
                        100,
                    integer:
                        true
                }),
            [CONTROLLER_COMPONENT_PORTS.JOYSTICK.Y]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        NUMBER,
                    minimum:
                        -100,
                    maximum:
                        100,
                    integer:
                        true
                })
        }),

    [CONTROLLER_COMPONENT_TYPES.SLIDER]:
        Object.freeze({
            [CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        NUMBER,
                    minimum:
                        0,
                    maximum:
                        100,
                    integer:
                        true
                })
        }),

    [CONTROLLER_COMPONENT_TYPES.BUTTON]:
        Object.freeze({
            [CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        BOOLEAN
                })
        }),

    [CONTROLLER_COMPONENT_TYPES.TOGGLE]:
        Object.freeze({
            [CONTROLLER_COMPONENT_PORTS.TOGGLE.ON]:
                Object.freeze({
                    direction:
                        INPUT,
                    valueType:
                        BOOLEAN
                })
        }),

    [CONTROLLER_COMPONENT_TYPES.INDICATOR]:
        Object.freeze({
            [CONTROLLER_COMPONENT_PORTS.INDICATOR.ON]:
                Object.freeze({
                    direction:
                        OUTPUT,
                    valueType:
                        BOOLEAN
                })
        }),

    [CONTROLLER_COMPONENT_TYPES.SERIAL]:
        Object.freeze({
            [CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT]:
                Object.freeze({
                    direction:
                        BIDIRECTIONAL,
                    valueType:
                        TEXT
                })
        })
});

const getControllerComponentBindingContract =
    componentType => {
        const contract =
            CONTROLLER_BINDING_CONTRACT[
                componentType
            ];

        if (!contract) {
            throw new Error(
                `Unsupported controller component type: ${componentType}`
            );
        }

        return contract;
    };

const getControllerBindingPortContract =
    (componentType, port) => {
        const componentContract =
            getControllerComponentBindingContract(
                componentType
            );

        const portContract =
            componentContract[
                port
            ];

        if (!portContract) {
            throw new Error(
                `Unsupported controller binding port: ${componentType}.${port}`
            );
        }

        return portContract;
    };

module.exports = {
    CONTROLLER_BINDING_DIRECTIONS,
    CONTROLLER_BINDING_VALUE_TYPES,
    CONTROLLER_COMPONENT_PORTS,
    getControllerComponentBindingContract,
    getControllerBindingPortContract
};
