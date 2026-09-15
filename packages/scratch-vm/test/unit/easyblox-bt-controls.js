const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');

const {
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

const {
    EBCP_CONTROL_TYPES,
    encodeFrame
} = require('../../src/connectivity/easyblox-connectivity-protocol');

const {
    EASYCONECT_CONTROLS_SIGNAL_IDS,
    getEasyConectWireChannel
} = require('@easymaker/easyconect-core');

const Scratch3EasyBloxBtBlocks =
    require('../../src/extensions/scratch3_easyblox_bt');

const NUMBER =
    EBCP_CONTRACT.messageTypes.NUMBER;

const BOOLEAN =
    EBCP_CONTRACT.messageTypes.BOOLEAN;

const createExtension = () =>
    new Scratch3EasyBloxBtBlocks({});

tap.test(
    'EasyBlox BT exposes the canonical Controls section and four blocks',
    t => {
        const info =
            createExtension().getInfo();

        const labels =
            info.blocks
                .filter(
                    block =>
                        block !== '---' &&
                        block.blockType ===
                            BlockType.LABEL
                )
                .map(
                    block => block.text
                );

        t.same(
            labels,
            [
                'Comunicação',
                'GAMEPAD',
                'CONTROLES'
            ]
        );

        const controlsBlocks =
            info.blocks
                .filter(
                    block =>
                        block !== '---' &&
                        [
                            'controlsJoystickPosition',
                            'controlsSliderValue',
                            'isControlsButtonPressed',
                            'isControlsSwitchOn'
                        ].includes(
                            block.opcode
                        )
                );

        t.same(
            controlsBlocks.map(
                block => block.opcode
            ),
            [
                'controlsJoystickPosition',
                'controlsSliderValue',
                'isControlsButtonPressed',
                'isControlsSwitchOn'
            ]
        );

        t.equal(
            controlsBlocks.length,
            4
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT exposes the canonical Controls Scratch block metadata',
    t => {
        const info =
            createExtension().getInfo();

        const findBlock =
            opcode =>
                info.blocks.find(
                    block =>
                        block !== '---' &&
                        block.opcode ===
                            opcode
                );

        const joystick =
            findBlock(
                'controlsJoystickPosition'
            );

        const slider =
            findBlock(
                'controlsSliderValue'
            );

        const button =
            findBlock(
                'isControlsButtonPressed'
            );

        const switchBlock =
            findBlock(
                'isControlsSwitchOn'
            );

        t.ok(
            joystick,
            'joystick reporter exists'
        );

        t.ok(
            slider,
            'slider reporter exists'
        );

        t.ok(
            button,
            'button boolean exists'
        );

        t.ok(
            switchBlock,
            'switch boolean exists'
        );

        if (
            !joystick ||
            !slider ||
            !button ||
            !switchBlock
        ) {
            t.end();
            return;
        }

        t.equal(
            joystick.blockType,
            BlockType.REPORTER
        );

        t.equal(
            joystick.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            joystick.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            joystick.text,
            'posição [AXIS] do joystick'
        );

        t.equal(
            joystick.arguments.AXIS.type,
            ArgumentType.STRING
        );

        t.equal(
            joystick.arguments.AXIS.menu,
            'controlsJoystickAxis'
        );

        t.equal(
            slider.blockType,
            BlockType.REPORTER
        );

        t.equal(
            slider.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            slider.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            slider.text,
            'valor do slider'
        );

        t.equal(
            button.blockType,
            BlockType.BOOLEAN
        );

        t.equal(
            button.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            button.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            button.text,
            'botão está pressionado?'
        );

        t.equal(
            switchBlock.blockType,
            BlockType.BOOLEAN
        );

        t.equal(
            switchBlock.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            switchBlock.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            switchBlock.text,
            'chave está ligada?'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Controls exposes the canonical joystick axis menu',
    t => {
        const menu =
            createExtension()
                .getInfo()
                .menus
                .controlsJoystickAxis;

        t.ok(
            menu,
            'joystick axis menu exists'
        );

        if (!menu) {
            t.end();
            return;
        }

        t.equal(
            menu.acceptReporters,
            false
        );

        t.same(
            menu.items,
            [
                {
                    text: 'horizontal',
                    value:
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_X
                },
                {
                    text: 'vertical',
                    value:
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_Y
                }
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Controls reporters expose canonical default state',
    t => {
        const extension =
            createExtension();

        t.equal(
            extension
                .controlsJoystickPosition({
                    AXIS:
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_X
                }),
            0
        );

        t.equal(
            extension
                .controlsJoystickPosition({
                    AXIS:
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_Y
                }),
            0
        );

        t.equal(
            extension
                .controlsJoystickPosition({
                    AXIS:
                        'controls.joystick.unknown'
                }),
            0,
            'unknown joystick axis fails safely'
        );

        t.equal(
            extension.controlsSliderValue(),
            0
        );

        t.equal(
            extension
                .isControlsButtonPressed(),
            false
        );

        t.equal(
            extension.isControlsSwitchOn(),
            false
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Controls consumes canonical Stage NUMBER and BOOLEAN updates',
    async t => {
        let receiveBluetoothData = null;
        let initCount = 0;

        const provider = {
            onBluetoothSerialData: callback => {
                receiveBluetoothData =
                    callback;
            },

            initBluetoothSerial: () => {
                initCount++;

                return Promise.resolve(
                    0x40
                );
            },

            writeBluetoothSerial: () =>
                0x41
        };

        const runtime = {
            on: () => {},

            getPeripheralExtensionByCapability:
                () => provider
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(
                runtime
            );

        t.equal(
            extension
                .controlsJoystickPosition({
                    AXIS:
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_X
                }),
            0,
            'joystick starts centered'
        );

        await Promise.resolve();

        t.equal(
            initCount,
            1,
            'first Controls read starts Bluetooth automatically'
        );

        const updates = [
            {
                type: NUMBER,
                sequence: 1,
                signalId:
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .JOYSTICK_X,
                payload: -42.5
            },
            {
                type: NUMBER,
                sequence: 2,
                signalId:
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .JOYSTICK_Y,
                payload: 63
            },
            {
                type: NUMBER,
                sequence: 3,
                signalId:
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .SLIDER,
                payload: 75
            },
            {
                type: BOOLEAN,
                sequence: 4,
                signalId:
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .BUTTON,
                payload: true
            },
            {
                type: BOOLEAN,
                sequence: 5,
                signalId:
                    EASYCONECT_CONTROLS_SIGNAL_IDS
                        .SWITCH,
                payload: true
            }
        ];

        for (const update of updates) {
            receiveBluetoothData(
                encodeFrame({
                    type:
                        update.type,
                    sequence:
                        update.sequence,
                    channel:
                        getEasyConectWireChannel(
                            update.signalId
                        ),
                    payload:
                        update.payload
                })
            );

            await Promise.resolve();
            await Promise.resolve();
        }

        t.equal(
            extension
                .controlsJoystickPosition({
                    AXIS:
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_X
                }),
            -42.5
        );

        t.equal(
            extension
                .controlsJoystickPosition({
                    AXIS:
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .JOYSTICK_Y
                }),
            63
        );

        t.equal(
            extension.controlsSliderValue(),
            75
        );

        t.equal(
            extension
                .isControlsButtonPressed(),
            true
        );

        t.equal(
            extension.isControlsSwitchOn(),
            true
        );

        t.equal(
            initCount,
            1,
            'all Controls reporters share one Bluetooth initialization'
        );
    }
);

tap.test(
    'EasyBlox BT Controls resets canonical state when the EBCP session changes',
    async t => {
        let receiveBluetoothData = null;

        const provider = {
            onBluetoothSerialData: callback => {
                receiveBluetoothData =
                    callback;
            },

            initBluetoothSerial: () =>
                Promise.resolve(0x40),

            writeBluetoothSerial: () =>
                0x41
        };

        const runtime = {
            on: () => {},

            getPeripheralExtensionByCapability:
                () => provider
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(
                runtime
            );

        extension.controlsSliderValue();

        await Promise.resolve();

        receiveBluetoothData(
            encodeFrame({
                type: NUMBER,
                sequence: 1,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .SLIDER
                    ),
                payload: 80
            })
        );

        receiveBluetoothData(
            encodeFrame({
                type: BOOLEAN,
                sequence: 2,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .BUTTON
                    ),
                payload: true
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension.controlsSliderValue(),
            80
        );

        t.equal(
            extension
                .isControlsButtonPressed(),
            true
        );

        receiveBluetoothData(
            encodeFrame({
                type:
                    EBCP_CONTROL_TYPES
                        .HELLO,
                sequence: 0,
                channel: '',
                payload:
                    Buffer.alloc(0)
            })
        );

        await Promise.resolve();

        t.equal(
            extension.controlsSliderValue(),
            0,
            'HELLO resets numeric Controls state'
        );

        t.equal(
            extension
                .isControlsButtonPressed(),
            false,
            'HELLO resets boolean Controls state'
        );
    }
);

tap.test(
    'EasyBlox BT Controls stops shared watchers on project stop and rearms on next read',
    async t => {
        const runtimeHandlers =
            new Map();

        let receiveBluetoothData = null;
        let initCount = 0;

        const provider = {
            onBluetoothSerialData: callback => {
                receiveBluetoothData =
                    callback;
            },

            initBluetoothSerial: () => {
                initCount++;

                return Promise.resolve(
                    0x40
                );
            },

            writeBluetoothSerial: () =>
                0x41
        };

        const runtime = {
            on: (event, handler) => {
                const handlers =
                    runtimeHandlers.get(event) ||
                    [];

                handlers.push(handler);

                runtimeHandlers.set(
                    event,
                    handlers
                );
            },

            getPeripheralExtensionByCapability:
                () => provider
        };

        const extension =
            new Scratch3EasyBloxBtBlocks(
                runtime
            );

        extension.controlsSliderValue();

        await Promise.resolve();

        receiveBluetoothData(
            encodeFrame({
                type: NUMBER,
                sequence: 1,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .SLIDER
                    ),
                payload: 55
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension.controlsSliderValue(),
            55,
            'Controls receives state before project stop'
        );

        for (
            const handler of
            runtimeHandlers.get(
                'PROJECT_STOP_ALL'
            ) || []
        ) {
            handler();
        }

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension.controlsSliderValue(),
            0,
            'project stop resets Controls state'
        );

        receiveBluetoothData(
            encodeFrame({
                type: NUMBER,
                sequence: 2,
                channel:
                    getEasyConectWireChannel(
                        EASYCONECT_CONTROLS_SIGNAL_IDS
                            .SLIDER
                    ),
                payload: 35
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension.controlsSliderValue(),
            35,
            'next reporter use rearms shared EasyConect reception'
        );

        t.equal(
            initCount,
            1,
            'project stop does not duplicate Bluetooth initialization'
        );
    }
);
