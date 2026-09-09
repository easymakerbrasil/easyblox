const test = require('node:test');
const assert = require('node:assert/strict');

const controllerCore = require('..');

const {
    ControllerModel,
    CONTROLLER_COMPONENT_TYPES
} = require('../src/controller-model');

const {
    CONTROLLER_BINDING_DIRECTIONS,
    CONTROLLER_COMPONENT_PORTS
} = require('../src/controller-binding-contract');

const {
    createControllerBindingReference
} = require('../src/controller-binding');

const {
    CONTROLLER_BINDING_MESSAGE_KINDS,
    createControllerBindingMessage
} = require('../src/controller-binding-message');

const createModel = () => {
    const model =
        new ControllerModel();

    model.addComponent({
        id:
            'action-button',
        type:
            CONTROLLER_COMPONENT_TYPES.BUTTON,
        label:
            'Ação'
    });

    model.addComponent({
        id:
            'speed-slider',
        type:
            CONTROLLER_COMPONENT_TYPES.SLIDER,
        label:
            'Velocidade'
    });

    model.addComponent({
        id:
            'status-indicator',
        type:
            CONTROLLER_COMPONENT_TYPES.INDICATOR,
        label:
            'Status'
    });

    model.addComponent({
        id:
            'serial-monitor',
        type:
            CONTROLLER_COMPONENT_TYPES.SERIAL,
        label:
            'Serial'
    });

    return model;
};

test('Controller Binding Message API is exposed from the public Controller Core entry point', () => {
    assert.equal(
        controllerCore.CONTROLLER_BINDING_MESSAGE_KINDS,
        CONTROLLER_BINDING_MESSAGE_KINDS
    );

    assert.equal(
        controllerCore.createControllerBindingMessage,
        createControllerBindingMessage
    );
});

test('Controller Binding Message exposes exactly state and stream kinds', () => {
    assert.deepEqual(
        CONTROLLER_BINDING_MESSAGE_KINDS,
        {
            STATE:
                'state',
            STREAM:
                'stream'
        }
    );
});

test('Controller Binding Message creates an immutable state message for Boolean input', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const message =
        createControllerBindingMessage(
            model,
            binding,
            true
        );

    assert.deepEqual(
        message,
        {
            kind:
                'state',
            componentId:
                'action-button',
            port:
                'pressed',
            direction:
                CONTROLLER_BINDING_DIRECTIONS.INPUT,
            value:
                true
        }
    );

    assert.equal(
        Object.isFrozen(
            message
        ),
        true
    );
});

test('Controller Binding Message creates state messages for numeric state controls', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    assert.deepEqual(
        createControllerBindingMessage(
            model,
            binding,
            72
        ),
        {
            kind:
                'state',
            componentId:
                'speed-slider',
            port:
                'value',
            direction:
                CONTROLLER_BINDING_DIRECTIONS.INPUT,
            value:
                72
        }
    );
});

test('Controller Binding Message preserves output direction for Indicator state', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'status-indicator',
            CONTROLLER_COMPONENT_PORTS.INDICATOR.ON
        );

    assert.deepEqual(
        createControllerBindingMessage(
            model,
            binding,
            true
        ),
        {
            kind:
                'state',
            componentId:
                'status-indicator',
            port:
                'on',
            direction:
                CONTROLLER_BINDING_DIRECTIONS.OUTPUT,
            value:
                true
        }
    );
});

test('Controller Binding Message treats Serial text as stream instead of state', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'serial-monitor',
            CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT
        );

    assert.deepEqual(
        createControllerBindingMessage(
            model,
            binding,
            'Olá'
        ),
        {
            kind:
                'stream',
            componentId:
                'serial-monitor',
            port:
                'text',
            direction:
                CONTROLLER_BINDING_DIRECTIONS.BIDIRECTIONAL,
            value:
                'Olá'
        }
    );
});

test('Controller Binding Message validates values through the canonical binding contract', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    assert.throws(
        () =>
            createControllerBindingMessage(
                model,
                binding,
                101
            ),
        /invalid controller binding value/i
    );
});

test('Controller Binding Message does not duplicate component type or friendly label', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const message =
        createControllerBindingMessage(
            model,
            binding,
            false
        );

    assert.equal(
        Object.prototype.hasOwnProperty.call(
            message,
            'componentType'
        ),
        false
    );

    assert.equal(
        Object.prototype.hasOwnProperty.call(
            message,
            'label'
        ),
        false
    );
});
