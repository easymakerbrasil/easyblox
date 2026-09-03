const ScratchBlocks = require('scratch-blocks');
const VMScratchBlocks = require('../../../src/lib/blocks').default;

const {
    createEasyBloxConnectionChecker,
    EASYBLOX_EXECUTION_MODE_DISABLED_REASON,
    EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
} = require('../../../src/lib/easyblox-connection-checker');

describe('EasyBlox connection checker Scratch Blocks integration', () => {
    let workspace;
    let injectionDiv;

    beforeAll(() => {
        ScratchBlocks.Blocks.easyblox_test_top = {
            init () {
                this.appendDummyInput()
                    .appendField('top');
                this.setNextStatement(true);
            }
        };

        ScratchBlocks.Blocks.easyblox_test_bottom = {
            init () {
                this.appendDummyInput()
                    .appendField('bottom');
                this.setPreviousStatement(true);
            }
        };
    });

    beforeEach(() => {
        const options = new ScratchBlocks.Options({
            plugins: {
                connectionChecker:
                    createEasyBloxConnectionChecker(ScratchBlocks)
            }
        });

        injectionDiv = document.createElement('div');
        injectionDiv.className = 'injectionDiv';
        document.body.appendChild(injectionDiv);

        const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg'
        );
        svg.setAttribute('class', 'blocklySvg');
        injectionDiv.appendChild(svg);

        workspace = new ScratchBlocks.WorkspaceSvg(options);

        const workspaceDom = workspace.createDom(
            'blocklyMainBackground',
            injectionDiv
        );

        svg.appendChild(workspaceDom);
    });

    afterEach(() => {
        workspace.dispose();
        injectionDiv.remove();
    });

    test('installs the EasyBlox connection checker in the real workspace', () => {
        expect(
            workspace.connectionChecker.constructor.name
        ).toBe('EasyBloxConnectionChecker');
    });

    test('rejects a real drag connection involving an execution-mode disabled block', () => {
        const topBlock =
            workspace.newBlock('easyblox_test_top');
        const bottomBlock =
            workspace.newBlock('easyblox_test_bottom');

        topBlock.setDisabledReason(
            true,
            EASYBLOX_EXECUTION_MODE_DISABLED_REASON
        );

        expect(
            topBlock.hasDisabledReason(
                EASYBLOX_EXECUTION_MODE_DISABLED_REASON
            )
        ).toBe(true);

        const result =
            workspace.connectionChecker.canConnectWithReason(
                topBlock.nextConnection,
                bottomBlock.previousConnection,
                true,
                100
            );

        expect(result).toBe(
            ScratchBlocks.Connection.REASON_CHECKS_FAILED
        );
    });

    test('rejects a real drag connection involving a board-capability disabled block', () => {
        const topBlock =
            workspace.newBlock('easyblox_test_top');
        const bottomBlock =
            workspace.newBlock('easyblox_test_bottom');

        topBlock.setDisabledReason(
            true,
            EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
        );

        expect(
            topBlock.hasDisabledReason(
                EASYBLOX_BOARD_CAPABILITY_DISABLED_REASON
            )
        ).toBe(true);

        const result =
            workspace.connectionChecker.canConnectWithReason(
                topBlock.nextConnection,
                bottomBlock.previousConnection,
                true,
                100
            );

        expect(result).toBe(
            ScratchBlocks.Connection.REASON_CHECKS_FAILED
        );
    });

    test('preserves the EasyBlox connection checker through ScratchBlocks.inject', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);

        let injectedWorkspace;

        try {
            const EasyBloxScratchBlocks = VMScratchBlocks({});

            injectedWorkspace = EasyBloxScratchBlocks.inject(host, {
                plugins: {
                    connectionChecker:
                        createEasyBloxConnectionChecker(ScratchBlocks)
                },
                sounds: false,
                css: false
            });

            expect(
                injectedWorkspace.connectionChecker.constructor.name
            ).toBe('EasyBloxConnectionChecker');
        } finally {
            if (injectedWorkspace) {
                injectedWorkspace.dispose();
            }

            host.remove();
        }
    });
});
