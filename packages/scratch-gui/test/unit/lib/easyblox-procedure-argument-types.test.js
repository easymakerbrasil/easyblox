import registerEasyBloxProcedureArgumentTypes from
    '../../../src/lib/easyblox-procedure-argument-types';

describe('EasyBlox procedure argument types', () => {
    const createScratchBlocks = () => {
        const procedurePrototype = {
            init: function () {
                this.nativeArgumentIds = [];

                this.domToMutation = mutation => {
                    this.nativeArgumentIds = JSON.parse(
                        mutation.getAttribute('argumentids') || '[]'
                    );
                };

                this.mutationToDom = () => {
                    const mutation = document.createElement('mutation');

                    mutation.setAttribute(
                        'argumentids',
                        JSON.stringify(this.nativeArgumentIds)
                    );

                    return mutation;
                };
            }
        };

        const procedureCall = {
            init: function () {
                this.procCode_ = '';
                this.argumentKinds_ = [];

                this.domToMutation = mutation => {
                    this.procCode_ =
                        mutation.getAttribute('proccode') || '';

                    this.argumentKinds_ = [];

                    const matches =
                        this.procCode_.match(/%[nbs]/g) || [];

                    matches.forEach(argumentCode => {
                        if (argumentCode === '%n') {
                            this.argumentKinds_.push('NUMBER');
                        } else if (argumentCode === '%b') {
                            this.argumentKinds_.push('BOOLEAN');
                        } else {
                            this.argumentKinds_.push('STRING');
                        }
                    });
                };

                this.mutationToDom = () => {
                    const mutation =
                        document.createElement('mutation');

                    mutation.setAttribute(
                        'proccode',
                        this.procCode_
                    );

                    return mutation;
                };
            }
        };

        return {
            Blocks: {
                procedures_prototype: procedurePrototype,
                procedures_call: procedureCall
            }
        };
    };

    test('preserves EasyBlox argument types through the prototype mutation round trip', () => {
        const ScratchBlocks = createScratchBlocks();

        registerEasyBloxProcedureArgumentTypes(ScratchBlocks);

        const block = {};

        ScratchBlocks.Blocks.procedures_prototype.init.call(block);

        const mutation = document.createElement('mutation');

        mutation.setAttribute(
            'argumentids',
            JSON.stringify([
                'arg_integer',
                'arg_decimal',
                'arg_text',
                'arg_boolean'
            ])
        );

        mutation.setAttribute(
            'easybloxargumenttypes',
            JSON.stringify([
                'INTEGER',
                'DECIMAL',
                'TEXT',
                'BOOLEAN'
            ])
        );

        block.domToMutation(mutation);

        const serializedMutation = block.mutationToDom();

        expect(
            serializedMutation.getAttribute('argumentids')
        ).toBe(
            JSON.stringify([
                'arg_integer',
                'arg_decimal',
                'arg_text',
                'arg_boolean'
            ])
        );

        expect(
            serializedMutation.getAttribute(
                'easybloxargumenttypes'
            )
        ).toBe(
            JSON.stringify([
                'INTEGER',
                'DECIMAL',
                'TEXT',
                'BOOLEAN'
            ])
        );
    });

    test('registers the procedures prototype extension only once', () => {
        const ScratchBlocks = createScratchBlocks();

        registerEasyBloxProcedureArgumentTypes(ScratchBlocks);

        const registeredInit =
            ScratchBlocks.Blocks.procedures_prototype.init;

        registerEasyBloxProcedureArgumentTypes(ScratchBlocks);

        expect(
            ScratchBlocks.Blocks.procedures_prototype.init
        ).toBe(registeredInit);
    });

    test('uses numeric Scratch call inputs for INTEGER and DECIMAL without changing the canonical proccode', () => {
        const ScratchBlocks = createScratchBlocks();

        registerEasyBloxProcedureArgumentTypes(ScratchBlocks);

        const block = {};

        ScratchBlocks.Blocks.procedures_call.init.call(block);

        const mutation = document.createElement('mutation');

        mutation.setAttribute(
            'proccode',
            'testar %s %s %s %b'
        );

        mutation.setAttribute(
            'argumentids',
            JSON.stringify([
                'arg_integer',
                'arg_decimal',
                'arg_text',
                'arg_boolean'
            ])
        );

        mutation.setAttribute(
            'easybloxargumenttypes',
            JSON.stringify([
                'INTEGER',
                'DECIMAL',
                'TEXT',
                'BOOLEAN'
            ])
        );

        block.domToMutation(mutation);

        expect(block.argumentKinds_).toEqual([
            'NUMBER',
            'NUMBER',
            'STRING',
            'BOOLEAN'
        ]);

        expect(block.procCode_).toBe(
            'testar %s %s %s %b'
        );

        const serializedMutation =
            block.mutationToDom();

        expect(
            serializedMutation.getAttribute('proccode')
        ).toBe(
            'testar %s %s %s %b'
        );

        expect(
            serializedMutation.getAttribute(
                'easybloxargumenttypes'
            )
        ).toBe(
            JSON.stringify([
                'INTEGER',
                'DECIMAL',
                'TEXT',
                'BOOLEAN'
            ])
        );
    });
});
