const test = require('node:test');
const assert = require('node:assert/strict');
const {Buffer} = require('buffer');

const {
    ControllerConnectivityClient
} = require('../src/controller-connectivity-client');

const controllerCore = require('..');

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
    getControllerBindingWireChannel
} = require('../src/controller-binding-wire');

const {
    EBCP_CONTRACT,
    EBCP_CONTROL_TYPES,
    encodeFrame,
    decodeFrame
} = require('@easymaker/easyblox-connectivity-core');

const TEXT = EBCP_CONTRACT.messageTypes.TEXT;
const NUMBER = EBCP_CONTRACT.messageTypes.NUMBER;

const createBindingModel = () => {
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

test('Controller Core exposes the connectivity client from its public API', () => {
    assert.equal(
        controllerCore.ControllerConnectivityClient,
        ControllerConnectivityClient
    );
});

test('Controller Connectivity Client requires a transport writer', () => {
    assert.throws(
        () => new ControllerConnectivityClient({
            write: null
        }),
        /write must be a function/i
    );
});

test('Controller Connectivity Client sends TEXT on the hidden canonical channel', () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const sequence = client.sendText('frente');

    assert.equal(sequence, 1);
    assert.equal(writes.length, 1);

    assert.deepEqual(
        decodeFrame(writes[0]),
        {
            version: EBCP_CONTRACT.version,
            type: TEXT,
            sequence: 1,
            channel: '1',
            payload: 'frente'
        }
    );
});

test('Controller Connectivity Client sends NUMBER on the hidden canonical channel', () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const sequence = client.sendNumber(12.5);

    assert.equal(sequence, 1);
    assert.equal(writes.length, 1);

    assert.deepEqual(
        decodeFrame(writes[0]),
        {
            version: EBCP_CONTRACT.version,
            type: NUMBER,
            sequence: 1,
            channel: '1',
            payload: 12.5
        }
    );
});

test('Controller Connectivity Client receives TEXT without exposing EBCP metadata', async () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const receivedText = client.waitText();

    client.receive(encodeFrame({
        type: TEXT,
        sequence: 7,
        channel: '1',
        payload: 'ligado'
    }));

    assert.equal(
        await receivedText,
        'ligado'
    );

    assert.equal(
        decodeFrame(writes[0]).type,
        0x80
    );
});

test('Controller Connectivity Client receives NUMBER without exposing EBCP metadata', async () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const receivedNumber = client.waitNumber();

    client.receive(encodeFrame({
        type: NUMBER,
        sequence: 9,
        channel: '1',
        payload: 27.5
    }));

    assert.equal(
        await receivedNumber,
        27.5
    );

    assert.equal(
        decodeFrame(writes[0]).type,
        0x80
    );
});

test('Controller Connectivity Client starts an EBCP session without exposing protocol details', async () => {
    const writes = [];

    const client = new ControllerConnectivityClient({
        write: frame => {
            writes.push(Buffer.from(frame));
        }
    });

    const ready = client.startSession();

    assert.equal(
        writes.length,
        1
    );

    const hello = decodeFrame(writes[0]);

    assert.equal(
        hello.type,
        0x81
    );

    assert.equal(
        hello.sequence,
        0
    );

    assert.equal(
        hello.channel,
        ''
    );

    client.receive(encodeFrame({
        type: 0x82,
        sequence: 0,
        channel: '',
        payload: Buffer.alloc(0)
    }));

    await ready;
});

test('Controller Connectivity Client probes peer liveness without exposing protocol details', async () => {
    const writes = [];

    const client =
        new ControllerConnectivityClient({
            write: frame => {
                writes.push(
                    Buffer.from(frame)
                );
            }
        });

    const alive =
        client.probe();

    assert.equal(
        writes.length,
        1
    );

    const ping =
        decodeFrame(
            writes[0]
        );

    assert.equal(
        ping.type,
        EBCP_CONTROL_TYPES.PING
    );

    assert.equal(
        ping.sequence,
        0
    );

    assert.equal(
        ping.channel,
        ''
    );

    client.receive(
        encodeFrame({
            type:
                EBCP_CONTROL_TYPES.PONG,
            sequence:
                0,
            channel:
                '',
            payload:
                Buffer.alloc(0)
        })
    );

    await alive;
});

test('Controller Connectivity Client requires a model only for binding operations', () => {
    const client =
        new ControllerConnectivityClient({
            write:
                () => {}
        });

    assert.throws(
        () =>
            client.sendBinding(
                {
                    componentId:
                        'action-button',
                    port:
                        'pressed'
                },
                true
            ),
        /binding operations require a Controller model/i
    );

    assert.throws(
        () =>
            client.waitBinding({
                componentId:
                    'status-indicator',
                port:
                    'on'
            }),
        /binding operations require a Controller model/i
    );
});

test('Controller Connectivity Client sends Button binding as NUMBER 1 on its wire channel', () => {
    const writes = [];
    const model =
        createBindingModel();

    const client =
        new ControllerConnectivityClient({
            model,
            write:
                frame => {
                    writes.push(
                        Buffer.from(
                            frame
                        )
                    );
                }
        });

    const binding =
        createControllerBindingReference(
            model,
            'action-button',
            CONTROLLER_COMPONENT_PORTS.BUTTON.PRESSED
        );

    const sequence =
        client.sendBinding(
            binding,
            true
        );

    assert.equal(
        sequence,
        1
    );

    assert.equal(
        writes.length,
        1
    );

    assert.deepEqual(
        decodeFrame(
            writes[0]
        ),
        {
            version:
                EBCP_CONTRACT.version,
            type:
                NUMBER,
            sequence:
                1,
            channel:
                getControllerBindingWireChannel(
                    model,
                    binding
                ),
            payload:
                1
        }
    );
});

test('Controller Connectivity Client sends numeric binding without changing its value', () => {
    const writes = [];
    const model =
        createBindingModel();

    const client =
        new ControllerConnectivityClient({
            model,
            write:
                frame => {
                    writes.push(
                        Buffer.from(
                            frame
                        )
                    );
                }
        });

    const binding =
        createControllerBindingReference(
            model,
            'speed-slider',
            CONTROLLER_COMPONENT_PORTS.SLIDER.VALUE
        );

    client.sendBinding(
        binding,
        72
    );

    assert.deepEqual(
        decodeFrame(
            writes[0]
        ),
        {
            version:
                EBCP_CONTRACT.version,
            type:
                NUMBER,
            sequence:
                1,
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

test('Controller Connectivity Client enforces binding direction on the Controller side', () => {
    const model =
        createBindingModel();

    const client =
        new ControllerConnectivityClient({
            model,
            write:
                () => {}
        });

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

    assert.throws(
        () =>
            client.sendBinding(
                indicatorBinding,
                true
            ),
        /cannot send an output binding/i
    );

    assert.throws(
        () =>
            client.waitBinding(
                buttonBinding
            ),
        /cannot wait for an input binding/i
    );
});

test('Controller Connectivity Client receives Indicator output as a canonical binding message', async () => {
    const writes = [];
    const model =
        createBindingModel();

    const client =
        new ControllerConnectivityClient({
            model,
            write:
                frame => {
                    writes.push(
                        Buffer.from(
                            frame
                        )
                    );
                }
        });

    const binding =
        createControllerBindingReference(
            model,
            'status-indicator',
            CONTROLLER_COMPONENT_PORTS.INDICATOR.ON
        );

    const received =
        client.waitBinding(
            binding
        );

    client.receive(
        encodeFrame({
            type:
                NUMBER,
            sequence:
                7,
            channel:
                getControllerBindingWireChannel(
                    model,
                    binding
                ),
            payload:
                0
        })
    );

    assert.deepEqual(
        await received,
        {
            kind:
                'state',
            componentId:
                'status-indicator',
            port:
                'on',
            direction:
                'output',
            value:
                false
        }
    );

    assert.equal(
        decodeFrame(
            writes[0]
        ).type,
        0x80
    );
});

test('Controller Connectivity Client receives bidirectional Serial as a canonical stream message', async () => {
    const writes = [];
    const model =
        createBindingModel();

    const client =
        new ControllerConnectivityClient({
            model,
            write:
                frame => {
                    writes.push(
                        Buffer.from(
                            frame
                        )
                    );
                }
        });

    const binding =
        createControllerBindingReference(
            model,
            'serial-monitor',
            CONTROLLER_COMPONENT_PORTS.SERIAL.TEXT
        );

    const received =
        client.waitBinding(
            binding
        );

    client.receive(
        encodeFrame({
            type:
                TEXT,
            sequence:
                8,
            channel:
                getControllerBindingWireChannel(
                    model,
                    binding
                ),
            payload:
                'Olá'
        })
    );

    assert.deepEqual(
        await received,
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

    assert.equal(
        decodeFrame(
            writes[0]
        ).type,
        0x80
    );
});
