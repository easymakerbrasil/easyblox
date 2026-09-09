const test = require('node:test');
const assert = require('node:assert/strict');

const controllerCore = require('..');

const {
    EBCP_CONTRACT
} = require('@easymaker/easyblox-connectivity-core');

const {
    ControllerModel,
    CONTROLLER_COMPONENT_TYPES
} = require('../src/controller-model');

const {
    CONTROLLER_COMPONENT_PORTS
} = require('../src/controller-binding-contract');

const {
    createControllerBindingReference
} = require('../src/controller-binding');

const {
    CONTROLLER_BINDING_WIRE_CONTRACT,
    ControllerBindingWireRegistry,
    getControllerBindingWireChannel
} = require('../src/controller-binding-wire');

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
            'direction-joystick',
        type:
            CONTROLLER_COMPONENT_TYPES.JOYSTICK,
        label:
            'Direção'
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

test('Controller Binding Wire API is exposed from the public Controller Core entry point', () => {
    assert.equal(
        controllerCore.CONTROLLER_BINDING_WIRE_CONTRACT,
        CONTROLLER_BINDING_WIRE_CONTRACT
    );

    assert.equal(
        controllerCore.ControllerBindingWireRegistry,
        ControllerBindingWireRegistry
    );

    assert.equal(
        controllerCore.getControllerBindingWireChannel,
        getControllerBindingWireChannel
    );
});

test('Controller Binding Wire defines the canonical v1 channel format', () => {
    assert.deepEqual(
        CONTROLLER_BINDING_WIRE_CONTRACT,
        {
            version:
                1,
            channelPrefix:
                'C1.',
            hashHexLength:
                8,
            channelLength:
                11
        }
    );
});

test('Controller Binding Wire produces a valid EBCP channel within the public channel limit', () => {
    const model =
        createModel();

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const channel =
        getControllerBindingWireChannel(
            model,
            binding
        );

    assert.match(
        channel,
        /^C1\.[0-9A-F]{8}$/
    );

    assert.equal(
        Buffer.byteLength(
            channel,
            'ascii'
        ),
        11
    );

    assert.equal(
        Buffer.byteLength(
            channel,
            'ascii'
        ) <=
            EBCP_CONTRACT.channelMaxBytes,
        true
    );
});

test('Controller Binding Wire address is stable when only the friendly label changes', () => {
    const firstModel =
        new ControllerModel();

    firstModel.addComponent({
        id:
            'action-button',
        type:
            CONTROLLER_COMPONENT_TYPES.BUTTON,
        label:
            'Botão 1'
    });

    const secondModel =
        new ControllerModel();

    secondModel.addComponent({
        id:
            'action-button',
        type:
            CONTROLLER_COMPONENT_TYPES.BUTTON,
        label:
            'Ligar motor'
    });

    const firstBinding =
        createControllerBindingReference(
            firstModel,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const secondBinding =
        createControllerBindingReference(
            secondModel,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    assert.equal(
        getControllerBindingWireChannel(
            firstModel,
            firstBinding
        ),
        getControllerBindingWireChannel(
            secondModel,
            secondBinding
        )
    );
});

test('Controller Binding Wire uses different addresses for different ports of the same component', () => {
    const model =
        createModel();

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

    assert.notEqual(
        getControllerBindingWireChannel(
            model,
            xBinding
        ),
        getControllerBindingWireChannel(
            model,
            yBinding
        )
    );
});

test('Controller Binding Wire Registry resolves every binding in both directions', () => {
    const model =
        createModel();

    const registry =
        new ControllerBindingWireRegistry(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const channel =
        registry.getChannel(
            binding
        );

    assert.deepEqual(
        registry.getBinding(
            channel
        ),
        {
            componentId:
                'action-button',
            port:
                'pressed'
        }
    );
});

test('Controller Binding Wire Registry includes all canonical ports of each component', () => {
    const model =
        createModel();

    const registry =
        new ControllerBindingWireRegistry(
            model
        );

    assert.equal(
        registry.getEntries().length,
        4
    );

    assert.deepEqual(
        registry
            .getEntries()
            .map(entry => ({
                componentId:
                    entry.binding.componentId,
                port:
                    entry.binding.port
            })),
        [
            {
                componentId:
                    'action-button',
                port:
                    'pressed'
            },
            {
                componentId:
                    'direction-joystick',
                port:
                    'x'
            },
            {
                componentId:
                    'direction-joystick',
                port:
                    'y'
            },
            {
                componentId:
                    'serial-monitor',
                port:
                    'text'
            }
        ]
    );
});

test('Controller Binding Wire Registry rejects unknown Controller Binding channels', () => {
    const model =
        createModel();

    const registry =
        new ControllerBindingWireRegistry(
            model
        );

    assert.throws(
        () =>
            registry.getBinding(
                'C1.00000000'
            ),
        /unknown controller binding wire channel/i
    );

    assert.throws(
        () =>
            registry.getBinding(
                '1'
            ),
        /invalid controller binding wire channel/i
    );
});
