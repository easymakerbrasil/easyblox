const tap = require('tap');

const ArgumentType =
    require('../../src/extension-support/argument-type');
const BlockExecutionMode =
    require('../../src/extension-support/block-execution-mode');
const BlockType =
    require('../../src/extension-support/block-type');

const {
    EASYCONECT_OUTPUTS_SIGNAL_IDS,
    getEasyConectWireChannel
} = require('@easymaker/easyconect-core');

const {
    EBCP_CONTRACT
} = require('../../src/connectivity/easyblox-connectivity-contract');

const Scratch3EasyBloxBtBlocks =
    require('../../src/extensions/scratch3_easyblox_bt');

const BOOLEAN =
    EBCP_CONTRACT.messageTypes.BOOLEAN;

const createExtension = () =>
    new Scratch3EasyBloxBtBlocks({});

tap.test(
    'EasyBlox BT exposes the canonical Outputs section and indicator block',
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
                    block =>
                        block.text
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

        const indicatorBlock =
            info.blocks.find(
                block =>
                    block !== '---' &&
                    block.opcode ===
                        'outputsSetIndicator'
            );

        t.ok(
            indicatorBlock,
            'Outputs indicator block exists'
        );

        if (!indicatorBlock) {
            t.end();
            return;
        }

        t.equal(
            indicatorBlock.blockType,
            BlockType.COMMAND
        );

        t.equal(
            indicatorBlock.executionMode,
            BlockExecutionMode.BOTH
        );

        t.equal(
            indicatorBlock.requiredBoardCapability,
            'bluetoothSerial'
        );

        t.equal(
            indicatorBlock.text,
            'definir indicador [STATE] no EasyConect'
        );

        t.same(
            indicatorBlock.arguments.STATE,
            {
                type:
                    ArgumentType.STRING,
                menu:
                    'outputsIndicatorStates',
                defaultValue:
                    'true'
            }
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Outputs exposes the canonical indicator state menu',
    t => {
        const menu =
            createExtension()
                .getInfo()
                .menus
                .outputsIndicatorStates;

        t.ok(
            menu,
            'Outputs indicator state menu exists'
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
                    text: 'ligado',
                    value: 'true'
                },
                {
                    text: 'desligado',
                    value: 'false'
                }
            ]
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Outputs Stage sends canonical BOOLEAN indicator state',
    t => {
        const sends = [];

        const extension =
            createExtension();

        extension._stageConnectivity = {
            send: (
                type,
                channel,
                payload
            ) => {
                sends.push({
                    type,
                    channel,
                    payload
                });

                return sends.length;
            }
        };

        const indicatorChannel =
            getEasyConectWireChannel(
                EASYCONECT_OUTPUTS_SIGNAL_IDS
                    .INDICATOR
            );

        t.equal(
            extension.outputsSetIndicator({
                STATE: 'true'
            }),
            1
        );

        t.equal(
            extension.outputsSetIndicator({
                STATE: 'false'
            }),
            2
        );

        t.same(
            sends,
            [
                {
                    type:
                        BOOLEAN,
                    channel:
                        indicatorChannel,
                    payload:
                        true
                },
                {
                    type:
                        BOOLEAN,
                    channel:
                        indicatorChannel,
                    payload:
                        false
                }
            ]
        );

        t.equal(
            indicatorChannel,
            'out.ind'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Outputs Stage is safe before Bluetooth initialization',
    t => {
        const extension =
            createExtension();

        t.equal(
            extension.outputsSetIndicator({
                STATE: 'true'
            }),
            null
        );

        t.end();
    }
);
