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
    ControllerBindingStateStore
} = require('../src/controller-binding-state-store');

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
            'direction-joystick',
        type:
            CONTROLLER_COMPONENT_TYPES.JOYSTICK,
        label:
            'Direção'
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

test('Controller Binding State Store is exposed from the public Controller Core API', () => {
    assert.equal(
        controllerCore.ControllerBindingStateStore,
        ControllerBindingStateStore
    );
});

test('Controller Binding State Store starts empty', () => {
    const model =
        createModel();

    const store =
        new ControllerBindingStateStore(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    assert.equal(
        store.getState(
            binding
        ),
        null
    );

    assert.deepEqual(
        store.createSnapshot(),
        []
    );
});

test('Controller Binding State Store keeps the latest canonical state message', () => {
    const model =
        createModel();

    const store =
        new ControllerBindingStateStore(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const message =
        store.setState(
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

    assert.equal(
        store.getState(
            binding
        ),
        message
    );
});

test('Controller Binding State Store overwrites the same component port without duplicating snapshots', () => {
    const model =
        createModel();

    const store =
        new ControllerBindingStateStore(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    store.setState(
        binding,
        10
    );

    store.setState(
        binding,
        72
    );

    assert.deepEqual(
        store.createSnapshot(),
        [
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
        ]
    );
});

test('Controller Binding State Store keeps different ports of the same component independently', () => {
    const model =
        createModel();

    const store =
        new ControllerBindingStateStore(
            model
        );

    const xBinding =
        createControllerBindingReference(
            model,
            'direction-joystick',
            CONTROLLER_COMPONENT_PORTS.JOYSTICK.X
        );

    const yBinding =
        createControllerBindingReference(
            model,
            'direction-joystick',
            CONTROLLER_COMPONENT_PORTS.JOYSTICK.Y
        );

    store.setState(
        xBinding,
        -25
    );

    store.setState(
        yBinding,
        80
    );

    assert.deepEqual(
        store.createSnapshot(),
        [
            {
                kind:
                    'state',
                componentId:
                    'direction-joystick',
                port:
                    'x',
                direction:
                    CONTROLLER_BINDING_DIRECTIONS.INPUT,
                value:
                    -25
            },
            {
                kind:
                    'state',
                componentId:
                    'direction-joystick',
                port:
                    'y',
                direction:
                    CONTROLLER_BINDING_DIRECTIONS.INPUT,
                value:
                    80
            }
        ]
    );
});

test('Controller Binding State Store rejects stream messages instead of caching Serial history', () => {
    const model =
        createModel();

    const store =
        new ControllerBindingStateStore(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'serial-monitor',
            CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT
        );

    assert.throws(
        () =>
            store.setState(
                binding,
                'não armazenar'
            ),
        /state store accepts only state messages/i
    );

    assert.deepEqual(
        store.createSnapshot(),
        []
    );
});

test('Controller Binding State Store creates an input snapshot for controller reconnection', () => {
    const model =
        createModel();

    const store =
        new ControllerBindingStateStore(
            model
        );

    const buttonBinding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const sliderBinding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    const indicatorBinding =
        createControllerBindingReference(
            model,
            'status-indicator',
            CONTROLLER_COMPONENT_PORTS.INDICATOR.ON
        );

    store.setState(
        buttonBinding,
        false
    );

    store.setState(
        sliderBinding,
        72
    );

    store.setState(
        indicatorBinding,
        true
    );

    const snapshot =
        store.createSnapshot(
            CONTROLLER_BINDING_DIRECTIONS.INPUT
        );

    assert.deepEqual(
        snapshot,
        [
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
                    false
            },
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
        ]
    );

    assert.equal(
        Object.isFrozen(
            snapshot
        ),
        true
    );
});

test('Controller Binding State Store filters output snapshots and rejects invalid directions', () => {
    const model =
        createModel();

    const store =
        new ControllerBindingStateStore(
            model
        );

    const buttonBinding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const indicatorBinding =
        createControllerBindingReference(
            model,
            'status-indicator',
            CONTROLLER_COMPONENT_PORTS.INDICATOR.ON
        );

    store.setState(
        buttonBinding,
        true
    );

    store.setState(
        indicatorBinding,
        false
    );

    assert.deepEqual(
        store.createSnapshot(
            CONTROLLER_BINDING_DIRECTIONS.OUTPUT
        ),
        [
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
                    false
            }
        ]
    );

    assert.throws(
        () =>
            store.createSnapshot(
                'sideways'
            ),
        /unsupported controller binding direction/i
    );
});
