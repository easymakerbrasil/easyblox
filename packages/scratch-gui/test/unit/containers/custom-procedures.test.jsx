import CustomProcedures from '../../../src/containers/custom-procedures.jsx';

describe('CustomProcedures EasyBlox argument types', () => {
    test('serializes EasyBlox argument types aligned by canonical argument id', () => {
        const mutation = document.createElement('mutation');

        const instance = {
            mutationRoot: {
                argumentIds_: [
                    'arg_integer',
                    'arg_text',
                    'arg_boolean'
                ],
                mutationToDom: jest.fn().mockReturnValue(mutation)
            },
            _easybloxArgumentTypesById: new Map([
                ['arg_boolean', 'BOOLEAN'],
                ['arg_integer', 'INTEGER'],
                ['arg_text', 'TEXT']
            ]),
            props: {
                onRequestClose: jest.fn()
            }
        };

        CustomProcedures.WrappedComponent.prototype.handleOk.call(
            instance
        );

        expect(
            mutation.getAttribute('easybloxargumenttypes')
        ).toBe(
            JSON.stringify([
                'INTEGER',
                'TEXT',
                'BOOLEAN'
            ])
        );

        expect(
            instance.props.onRequestClose
        ).toHaveBeenCalledWith(mutation);
    });
});

test('restores EasyBlox argument types from an existing mutation by canonical argument id', () => {
    const mutation = document.createElement('mutation');

    mutation.setAttribute(
        'argumentids',
        JSON.stringify([
            'arg_decimal',
            'arg_boolean',
            'arg_text'
        ])
    );

    mutation.setAttribute(
        'easybloxargumenttypes',
        JSON.stringify([
            'DECIMAL',
            'BOOLEAN',
            'TEXT'
        ])
    );

    const instance = new CustomProcedures.WrappedComponent({
        mutator: mutation
    });

    expect(
        instance._easybloxArgumentTypesById
    ).toEqual(
        new Map([
            ['arg_decimal', 'DECIMAL'],
            ['arg_boolean', 'BOOLEAN'],
            ['arg_text', 'TEXT']
        ])
    );
});

test('associates INTEGER type with the canonical id generated for a new number input', () => {
    const argumentIds = [];

    const instance = {
        mutationRoot: {
            argumentIds_: argumentIds,
            addStringNumberExternal: jest.fn(() => {
                argumentIds.push('arg_integer');
            })
        },
        _easybloxArgumentTypesById: new Map()
    };

    CustomProcedures.WrappedComponent.prototype.handleAddTextNumber.call(
        instance,
        'INTEGER'
    );

    expect(
        instance.mutationRoot.addStringNumberExternal
    ).toHaveBeenCalledTimes(1);

    expect(
        instance._easybloxArgumentTypesById.get('arg_integer')
    ).toBe('INTEGER');
});

test('associates BOOLEAN type with the canonical id generated for a new boolean input', () => {
    const argumentIds = [];

    const instance = {
        mutationRoot: {
            argumentIds_: argumentIds,
            addBooleanExternal: jest.fn(() => {
                argumentIds.push('arg_boolean');
            })
        },
        _easybloxArgumentTypesById: new Map()
    };

    CustomProcedures.WrappedComponent.prototype.handleAddBoolean.call(
        instance
    );

    expect(
        instance.mutationRoot.addBooleanExternal
    ).toHaveBeenCalledTimes(1);

    expect(
        instance._easybloxArgumentTypesById.get('arg_boolean')
    ).toBe('BOOLEAN');
});

test('maps decimal input to DECIMAL EasyBlox value type', () => {
    const instance = {
        handleAddTextNumber: jest.fn()
    };

    CustomProcedures.WrappedComponent.prototype.handleAddDecimal.call(
        instance
    );

    expect(
        instance.handleAddTextNumber
    ).toHaveBeenCalledWith('DECIMAL');
});

test('maps text input to TEXT EasyBlox value type', () => {
    const instance = {
        handleAddTextNumber: jest.fn()
    };

    CustomProcedures.WrappedComponent.prototype.handleAddText.call(
        instance
    );

    expect(
        instance.handleAddTextNumber
    ).toHaveBeenCalledWith('TEXT');
});
