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
    createControllerBindingMessage
} = require('../src/controller-binding-message');

const {
    getControllerBindingWireChannel
} = require('../src/controller-binding-wire');

const {
    ControllerBindingWireCodec
} = require('../src/controller-binding-wire-codec');

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

test('Controller Binding Wire Codec is exposed from the public Controller Core entry point', () => {
    assert.equal(
        controllerCore.ControllerBindingWireCodec,
        ControllerBindingWireCodec
    );
});

test('Controller Binding Wire Codec encodes numeric state as EBCP NUMBER', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    const message =
        createControllerBindingMessage(
            model,
            binding,
            72
        );

    assert.deepEqual(
        codec.encode(
            message
        ),
        {
            type:
                EBCP_CONTRACT.messageTypes.NUMBER,
            channel:
                getControllerBindingWireChannel(
                    model,
                    binding
                ),
            payload:
                72
        }
    );
});

test('Controller Binding Wire Codec encodes Boolean state through NUMBER 0 and 1', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const falseMessage =
        createControllerBindingMessage(
            model,
            binding,
            false
        );

    const trueMessage =
        createControllerBindingMessage(
            model,
            binding,
            true
        );

    assert.equal(
        codec.encode(
            falseMessage
        ).type,
        EBCP_CONTRACT.messageTypes.NUMBER
    );

    assert.equal(
        codec.encode(
            falseMessage
        ).payload,
        0
    );

    assert.equal(
        codec.encode(
            trueMessage
        ).payload,
        1
    );
});

test('Controller Binding Wire Codec preserves Indicator output semantics while using NUMBER on the wire', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'status-indicator',
            CONTROLLER_COMPONENT_PORTS.INDICATOR.ON
        );

    const message =
        createControllerBindingMessage(
            model,
            binding,
            true
        );

    const encoded =
        codec.encode(
            message
        );

    assert.equal(
        encoded.type,
        EBCP_CONTRACT.messageTypes.NUMBER
    );

    assert.equal(
        encoded.payload,
        1
    );
});

test('Controller Binding Wire Codec gives Serial the full EBCP TEXT payload capacity', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'serial-monitor',
            CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT
        );

    const text =
        '12345678901234567890123456789012';

    assert.equal(
        Buffer.byteLength(
            text,
            'utf8'
        ),
        EBCP_CONTRACT.maxPayloadBytes
    );

    const encoded =
        codec.encode(
            createControllerBindingMessage(
                model,
                binding,
                text
            )
        );

    assert.deepEqual(
        encoded,
        {
            type:
                EBCP_CONTRACT.messageTypes.TEXT,
            channel:
                getControllerBindingWireChannel(
                    model,
                    binding
                ),
            payload:
                text
        }
    );
});

test('Controller Binding Wire Codec rejects Serial text that exceeds the EBCP byte limit', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
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
            codec.encode(
                createControllerBindingMessage(
                    model,
                    binding,
                    '123456789012345678901234567890123'
                )
            ),
        /controller binding text exceeds the EBCP payload limit/i
    );
});

test('Controller Binding Wire Codec decodes EBCP NUMBER into canonical numeric state', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    assert.deepEqual(
        codec.decode({
            type:
                EBCP_CONTRACT.messageTypes.NUMBER,
            channel:
                getControllerBindingWireChannel(
                    model,
                    binding
                ),
            payload:
                45
        }),
        {
            kind:
                'state',
            componentId:
                'speed-slider',
            port:
                'value',
            direction:
                'input',
            value:
                45
        }
    );
});

test('Controller Binding Wire Codec decodes Boolean NUMBER values strictly as 0 or 1', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

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

    assert.equal(
        codec.decode({
            type:
                EBCP_CONTRACT.messageTypes.NUMBER,
            channel,
            payload:
                0
        }).value,
        false
    );

    assert.equal(
        codec.decode({
            type:
                EBCP_CONTRACT.messageTypes.NUMBER,
            channel,
            payload:
                1
        }).value,
        true
    );

    assert.throws(
        () =>
            codec.decode({
                type:
                    EBCP_CONTRACT.messageTypes.NUMBER,
                channel,
                payload:
                    2
            }),
        /invalid controller binding Boolean wire value/i
    );
});

test('Controller Binding Wire Codec decodes Serial TEXT into a canonical stream message', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

    const binding =
        createControllerBindingReference(
            model,
            'serial-monitor',
            CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT
        );

    assert.deepEqual(
        codec.decode({
            type:
                EBCP_CONTRACT.messageTypes.TEXT,
            channel:
                getControllerBindingWireChannel(
                    model,
                    binding
                ),
            payload:
                'Olá'
        }),
        {
            kind:
                'stream',
            componentId:
                'serial-monitor',
            port:
                'text',
            direction:
                'bidirectional',
            value:
                'Olá'
        }
    );
});

test('Controller Binding Wire Codec rejects mismatched EBCP types and unknown channels', () => {
    const model =
        createModel();

    const codec =
        new ControllerBindingWireCodec(
            model
        );

    const buttonBinding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    assert.throws(
        () =>
            codec.decode({
                type:
                    EBCP_CONTRACT.messageTypes.TEXT,
                channel:
                    getControllerBindingWireChannel(
                        model,
                        buttonBinding
                    ),
                payload:
                    'true'
            }),
        /unexpected EBCP type for controller binding/i
    );

    assert.throws(
        () =>
            codec.decode({
                type:
                    EBCP_CONTRACT.messageTypes.NUMBER,
                channel:
                    'C1.00000000',
                payload:
                    1
            }),
        /unknown controller binding wire channel/i
    );
});
