const test = require('node:test');
const assert = require('node:assert/strict');

const controllerCore = require('..');

const {
    CONTROLLER_COMPONENT_TYPES
} = require('../src/controller-model');

const {
    CONTROLLER_BINDING_DIRECTIONS,
    CONTROLLER_BINDING_VALUE_TYPES,
    CONTROLLER_COMPONENT_PORTS,
    getControllerComponentBindingContract,
    getControllerBindingPortContract
} = require('../src/controller-binding-contract');

test('Controller Binding Contract is exposed from the public Controller Core API', () => {
    assert.equal(
        controllerCore.CONTROLLER_BINDING_DIRECTIONS,
        CONTROLLER_BINDING_DIRECTIONS
    );

    assert.equal(
        controllerCore.CONTROLLER_BINDING_VALUE_TYPES,
        CONTROLLER_BINDING_VALUE_TYPES
    );

    assert.equal(
        controllerCore.CONTROLLER_COMPONENT_PORTS,
        CONTROLLER_COMPONENT_PORTS
    );

    assert.equal(
        controllerCore.getControllerComponentBindingContract,
        getControllerComponentBindingContract
    );

    assert.equal(
        controllerCore.getControllerBindingPortContract,
        getControllerBindingPortContract
    );
});

test('Controller Binding Contract exposes exactly the approved directions and value types', () => {
    assert.deepEqual(
        CONTROLLER_BINDING_DIRECTIONS,
        {
            INPUT:
                'input',
            OUTPUT:
                'output',
            BIDIRECTIONAL:
                'bidirectional'
        }
    );

    assert.deepEqual(
        CONTROLLER_BINDING_VALUE_TYPES,
        {
            NUMBER:
                'number',
            BOOLEAN:
                'boolean',
            TEXT:
                'text'
        }
    );
});

test('Controller Binding Contract exposes the canonical ports for every v1 component', () => {
    assert.deepEqual(
        CONTROLLER_COMPONENT_PORTS,
        {
            GAMEPAD: {
                HORIZONTAL:
                    'horizontal',
                VERTICAL:
                    'vertical',
                BUTTON_A:
                    'button-a',
                BUTTON_B:
                    'button-b'
            },
            JOYSTICK: {
                X:
                    'x',
                Y:
                    'y'
            },
            SLIDER: {
                VALUE:
                    'value'
            },
            BUTTON: {
                PRESSED:
                    'pressed'
            },
            TOGGLE: {
                ON:
                    'on'
            },
            INDICATOR: {
                ON:
                    'on'
            },
            SERIAL: {
                TEXT:
                    'text'
            }
        }
    );
});

test('Controller Binding Contract defines non-blocking numeric input domains', () => {
    assert.deepEqual(
        getControllerComponentBindingContract(
            CONTROLLER_COMPONENT_TYPES.JOYSTICK
        ),
        {
            x: {
                direction:
                    'input',
                valueType:
                    'number',
                minimum:
                    -100,
                maximum:
                    100,
                integer:
                    true
            },
            y: {
                direction:
                    'input',
                valueType:
                    'number',
                minimum:
                    -100,
                maximum:
                    100,
                integer:
                    true
            }
        }
    );

    assert.deepEqual(
        getControllerComponentBindingContract(
            CONTROLLER_COMPONENT_TYPES.SLIDER
        ),
        {
            value: {
                direction:
                    'input',
                valueType:
                    'number',
                minimum:
                    0,
                maximum:
                    100,
                integer:
                    true
            }
        }
    );
});

test('Controller Binding Contract defines the approved Gamepad ports and domains', () => {
    assert.deepEqual(
        getControllerComponentBindingContract(
            CONTROLLER_COMPONENT_TYPES.GAMEPAD
        ),
        {
            horizontal: {
                direction:
                    'input',
                valueType:
                    'number',
                minimum:
                    -1,
                maximum:
                    1,
                integer:
                    true
            },
            vertical: {
                direction:
                    'input',
                valueType:
                    'number',
                minimum:
                    -1,
                maximum:
                    1,
                integer:
                    true
            },
            'button-a': {
                direction:
                    'input',
                valueType:
                    'boolean'
            },
            'button-b': {
                direction:
                    'input',
                valueType:
                    'boolean'
            }
        }
    );
});

test('Controller Binding Contract preserves the approved direction and type of state and stream components', () => {
    assert.deepEqual(
        getControllerBindingPortContract(
            CONTROLLER_COMPONENT_TYPES.BUTTON,
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        ),
        {
            direction:
                'input',
            valueType:
                'boolean'
        }
    );

    assert.deepEqual(
        getControllerBindingPortContract(
            CONTROLLER_COMPONENT_TYPES.TOGGLE,
            CONTROLLER_COMPONENT_PORTS.TOGGLE.ON
        ),
        {
            direction:
                'input',
            valueType:
                'boolean'
        }
    );

    assert.deepEqual(
        getControllerBindingPortContract(
            CONTROLLER_COMPONENT_TYPES.INDICATOR,
            CONTROLLER_COMPONENT_PORTS.INDICATOR.ON
        ),
        {
            direction:
                'output',
            valueType:
                'boolean'
        }
    );

    assert.deepEqual(
        getControllerBindingPortContract(
            CONTROLLER_COMPONENT_TYPES.SERIAL,
            CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT
        ),
        {
            direction:
                'bidirectional',
            valueType:
                'text'
        }
    );
});

test('Controller Binding Contract rejects unsupported component types and ports', () => {
    assert.throws(
        () =>
            getControllerComponentBindingContract(
                'gauge'
            ),
        /unsupported controller component type/i
    );

    assert.throws(
        () =>
            getControllerBindingPortContract(
                CONTROLLER_COMPONENT_TYPES.BUTTON,
                'missing-port'
            ),
        /unsupported controller binding port/i
    );
});
