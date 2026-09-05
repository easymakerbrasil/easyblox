const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ControllerModel,
    CONTROLLER_COMPONENT_TYPES
} = require('../src/controller-model');

test('Controller Model exposes exactly the approved v1 component types', () => {
    assert.deepEqual(
        Object.values(CONTROLLER_COMPONENT_TYPES).sort(),
        [
            'button',
            'gamepad',
            'indicator',
            'joystick',
            'serial',
            'slider',
            'toggle'
        ]
    );
});

test('Controller Model starts with no configured components', () => {
    const model = new ControllerModel();

    assert.deepEqual(
        model.getComponents(),
        []
    );
});

test('Controller Model accepts an approved component with an internal id', () => {
    const model = new ControllerModel();

    model.addComponent({
        id: 'drive-control',
        type: CONTROLLER_COMPONENT_TYPES.GAMEPAD,
        label: 'Direção'
    });

    assert.deepEqual(
        model.getComponents(),
        [{
            id: 'drive-control',
            type: 'gamepad',
            label: 'Direção'
        }]
    );
});

test('Controller Model rejects unsupported component types', () => {
    const model = new ControllerModel();

    assert.throws(
        () => model.addComponent({
            id: 'unsupported-control',
            type: 'gauge',
            label: 'Gauge'
        }),
        /unsupported component type/i
    );
});

test('Controller Model rejects duplicate internal ids', () => {
    const model = new ControllerModel();

    model.addComponent({
        id: 'main-control',
        type: CONTROLLER_COMPONENT_TYPES.BUTTON,
        label: 'Ação'
    });

    assert.throws(
        () => model.addComponent({
            id: 'main-control',
            type: CONTROLLER_COMPONENT_TYPES.TOGGLE,
            label: 'Liga'
        }),
        /duplicate component id/i
    );
});

test('Controller Model rejects invalid component payloads', () => {
    const model = new ControllerModel();

    assert.throws(
        () => model.addComponent(null),
        /component must be an object/i
    );

    assert.throws(
        () => model.addComponent('button'),
        /component must be an object/i
    );

    assert.throws(
        () => model.addComponent([]),
        /component must be an object/i
    );
});

test('Controller Model requires a non-empty string internal id', () => {
    const invalidIds = [
        undefined,
        null,
        '',
        '   ',
        123
    ];

    for (const id of invalidIds) {
        const model = new ControllerModel();

        assert.throws(
            () => model.addComponent({
                id,
                type: CONTROLLER_COMPONENT_TYPES.BUTTON
            }),
            /component id must be a non-empty string/i
        );
    }
});

test('Controller Model finds a component by its internal id', () => {
    const model = new ControllerModel();

    model.addComponent({
        id: 'drive-control',
        type: CONTROLLER_COMPONENT_TYPES.GAMEPAD,
        label: 'Direção'
    });

    assert.deepEqual(
        model.getComponentById('drive-control'),
        {
            id: 'drive-control',
            type: 'gamepad',
            label: 'Direção'
        }
    );

    assert.equal(
        model.getComponentById('missing-control'),
        null
    );
});

test('Controller Model removes a component by its internal id', () => {
    const model = new ControllerModel();

    model.addComponent({
        id: 'action-button',
        type: CONTROLLER_COMPONENT_TYPES.BUTTON,
        label: 'Ação'
    });

    model.addComponent({
        id: 'power-toggle',
        type: CONTROLLER_COMPONENT_TYPES.TOGGLE,
        label: 'Ligado'
    });

    assert.equal(
        model.removeComponent('action-button'),
        true
    );

    assert.deepEqual(
        model.getComponents(),
        [{
            id: 'power-toggle',
            type: 'toggle',
            label: 'Ligado'
        }]
    );

    assert.equal(
        model.removeComponent('missing-control'),
        false
    );
});
