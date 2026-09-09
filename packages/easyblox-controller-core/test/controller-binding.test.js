const test = require('node:test');
const assert = require('node:assert/strict');

const controllerCore = require('..');

const {
    ControllerModel,
    CONTROLLER_COMPONENT_TYPES
} = require('../src/controller-model');

const {
    CONTROLLER_COMPONENT_PORTS
} = require('../src/controller-binding-contract');

const {
    createControllerBindingReference,
    getControllerBindingReferenceContract,
    validateControllerBindingValue
} = require('../src/controller-binding');

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

test('Controller Binding helpers are exposed from the public Controller Core API', () => {
    assert.equal(
        controllerCore.createControllerBindingReference,
        createControllerBindingReference
    );

    assert.equal(
        controllerCore.getControllerBindingReferenceContract,
        getControllerBindingReferenceContract
    );

    assert.equal(
        controllerCore.validateControllerBindingValue,
        validateControllerBindingValue
    );
});

test('Controller Binding creates the canonical componentId plus port reference', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    assert.deepEqual(
        binding,
        {
            componentId:
                'action-button',
            port:
                'pressed'
        }
    );

    assert.equal(
        Object.isFrozen(
            binding
        ),
        true
    );
});

test('Controller Binding resolves a reference through the component model', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    assert.deepEqual(
        getControllerBindingReferenceContract(
            model,
            binding
        ),
        {
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
    );
});

test('Controller Binding rejects unknown components and ports incompatible with the component type', () => {
    const model =
        createModel();

    assert.throws(
        () =>
            createControllerBindingReference(
                model,
                'missing-component',
                'pressed'
            ),
        /unknown controller component id/i
    );

    assert.throws(
        () =>
            createControllerBindingReference(
                model,
                'action-button',
                CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
            ),
        /unsupported controller binding port/i
    );
});

test('Controller Binding validates approved Boolean and text values strictly', () => {
    const model =
        createModel();

    const buttonBinding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const serialBinding =
        createControllerBindingReference(
            model,
            'serial-monitor',
            CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT
        );

    assert.equal(
        validateControllerBindingValue(
            model,
            buttonBinding,
            true
        ),
        true
    );

    assert.equal(
        validateControllerBindingValue(
            model,
            buttonBinding,
            false
        ),
        false
    );

    assert.equal(
        validateControllerBindingValue(
            model,
            serialBinding,
            'Olá'
        ),
        'Olá'
    );

    assert.throws(
        () =>
            validateControllerBindingValue(
                model,
                buttonBinding,
                1
            ),
        /invalid controller binding value/i
    );

    assert.throws(
        () =>
            validateControllerBindingValue(
                model,
                serialBinding,
                123
            ),
        /invalid controller binding value/i
    );
});

test('Controller Binding accepts inclusive numeric boundaries', () => {
    const model =
        createModel();

    const sliderBinding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    const joystickBinding =
        createControllerBindingReference(
            model,
            'direction-joystick',
            CONTROLLER_COMPONENT_PORTS.JOYSTICK.X
        );

    for (const value of [
        0,
        100
    ]) {
        assert.equal(
            validateControllerBindingValue(
                model,
                sliderBinding,
                value
            ),
            value
        );
    }

    for (const value of [
        -100,
        0,
        100
    ]) {
        assert.equal(
            validateControllerBindingValue(
                model,
                joystickBinding,
                value
            ),
            value
        );
    }
});

test('Controller Binding rejects non-finite, fractional and out-of-range numeric values', () => {
    const model =
        createModel();

    const sliderBinding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    const invalidValues = [
        -1,
        101,
        10.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        '50'
    ];

    for (const value of invalidValues) {
        assert.throws(
            () =>
                validateControllerBindingValue(
                    model,
                    sliderBinding,
                    value
                ),
            /invalid controller binding value/i
        );
    }
});

test('Controller Binding validates output values with the same canonical contract', () => {
    const model =
        createModel();

    const indicatorBinding =
        createControllerBindingReference(
            model,
            'status-indicator',
            CONTROLLER_COMPONENT_PORTS.INDICATOR.ON
        );

    assert.deepEqual(
        getControllerBindingReferenceContract(
            model,
            indicatorBinding
        ),
        {
            direction:
                'output',
            valueType:
                'boolean'
        }
    );

    assert.equal(
        validateControllerBindingValue(
            model,
            indicatorBinding,
            true
        ),
        true
    );

    assert.throws(
        () =>
            validateControllerBindingValue(
                model,
                indicatorBinding,
                'true'
            ),
        /invalid controller binding value/i
    );
});
