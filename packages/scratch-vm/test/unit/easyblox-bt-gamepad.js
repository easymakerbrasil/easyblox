const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');

const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS
} = require('@easymaker/easyconect-core');

const Scratch3EasyBloxBtBlocks =
    require('../../src/extensions/scratch3_easyblox_bt');

const {
    EBCP_CONTRACT,
    encodeFrame
} = require(
    '@easymaker/easyblox-connectivity-core'
);

const {
    getEasyConectWireChannel
} = require(
    '@easymaker/easyconect-core'
);

const BOOLEAN =
    EBCP_CONTRACT.messageTypes.BOOLEAN;

const createExtension = () =>
    new Scratch3EasyBloxBtBlocks({});

tap.test(
    'EasyBlox BT groups communication, Gamepad and Controls in one extension',
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
                'Gamepad',
                'Controles',
                'Motores e Servos',
                'Saídas'
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT exposes one boolean Gamepad reporter',
    t => {
        const info =
            createExtension().getInfo();

        const block =
            info.blocks.find(
                candidate =>
                    candidate !== '---' &&
                    candidate.opcode ===
                        'isGamepadButtonPressed'
            );

        t.ok(
            block,
            'Gamepad reporter exists'
        );

        t.equal(
            block.blockType,
            BlockType.BOOLEAN
        );

        t.equal(
            block.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            block.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            block.text,
            '[BUTTON] está pressionado no gamepad?'
        );

        t.equal(
            block.arguments.BUTTON.type,
            ArgumentType.STRING
        );

        t.equal(
            block.arguments.BUTTON.menu,
            'gamepadButtons'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Gamepad exposes the canonical button menu',
    t => {
        const menu =
            createExtension()
                .getInfo()
                .menus
                .gamepadButtons;

        t.equal(
            menu.acceptReporters,
            false
        );

        t.same(
            menu.items,
            [
                {
                    text: 'cima',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_UP
                },
                {
                    text: 'baixo',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_DOWN
                },
                {
                    text: 'esquerda',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_LEFT
                },
                {
                    text: 'direita',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .DPAD_RIGHT
                },
                {
                    text: 'triângulo',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .ACTION_TOP
                },
                {
                    text: 'quadrado',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .ACTION_LEFT
                },
                {
                    text: 'cruz',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .ACTION_BOTTOM
                },
                {
                    text: 'círculo',
                    value:
                        EASYCONECT_GAMEPAD_SIGNAL_IDS
                            .ACTION_RIGHT
                }
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Gamepad reporter reads canonical EasyConect state',
    t => {
        const extension =
            createExtension();

        const signalId =
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_BOTTOM;

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            false,
            'button starts released'
        );

        extension._easyConectState
            .setSignalValue(
                signalId,
                true
            );

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            true,
            'reporter follows canonical state'
        );

        extension._easyConectState
            .setSignalValue(
                signalId,
                false
            );

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            false,
            'released state is reported again'
        );

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON:
                        'gamepad.unknown'
                }),
            false,
            'unknown menu values fail safely'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Gamepad consumes canonical Stage BOOLEAN updates',
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
                return Promise.resolve(0x40);
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

        const signalId =
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .ACTION_BOTTOM;

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            false,
            'reporter starts released'
        );

        await Promise.resolve();

        t.equal(
            initCount,
            1,
            'first GAMEPAD read starts Bluetooth automatically'
        );

        receiveBluetoothData(
            encodeFrame({
                type: BOOLEAN,
                sequence: 1,
                channel:
                    getEasyConectWireChannel(
                        signalId
                    ),
                payload: true
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            true,
            'BOOLEAN true updates canonical GAMEPAD state'
        );

        t.equal(
            initCount,
            1,
            'subsequent reads do not reinitialize Bluetooth'
        );

        receiveBluetoothData(
            encodeFrame({
                type: BOOLEAN,
                sequence: 2,
                channel:
                    getEasyConectWireChannel(
                        signalId
                    ),
                payload: false
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            false,
            'BOOLEAN false releases the button'
        );
    }
);

tap.test(
    'EasyBlox BT Gamepad stops watchers on project stop and rearms on next read',
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
                return Promise.resolve(0x40);
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

        const signalId =
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_UP;

        extension.isGamepadButtonPressed({
            BUTTON: signalId
        });

        await Promise.resolve();

        receiveBluetoothData(
            encodeFrame({
                type: BOOLEAN,
                sequence: 1,
                channel:
                    getEasyConectWireChannel(
                        signalId
                    ),
                payload: true
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            true,
            'GAMEPAD receives state before project stop'
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
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            false,
            'project stop resets GAMEPAD state'
        );

        receiveBluetoothData(
            encodeFrame({
                type: BOOLEAN,
                sequence: 2,
                channel:
                    getEasyConectWireChannel(
                        signalId
                    ),
                payload: true
            })
        );

        await Promise.resolve();
        await Promise.resolve();

        t.equal(
            extension
                .isGamepadButtonPressed({
                    BUTTON: signalId
                }),
            true,
            'next reporter use rearms GAMEPAD reception'
        );

        t.equal(
            initCount,
            1,
            'project stop does not duplicate Bluetooth initialization'
        );
    }
);
