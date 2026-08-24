import {
    filterVariableCategoryForProgramMode
} from '../../../src/lib/variable-category-program-mode';

const createElement = (tagName, attributes = {}) => {
    const element = document.createElement(tagName);

    Object.keys(attributes).forEach(name => {
        element.setAttribute(name, attributes[name]);
    });

    return element;
};

describe('filterVariableCategoryForProgramMode', () => {
    test('preserves the original variable category in Stage mode', () => {
        const elements = [
            createElement('button', {callbackKey: 'CREATE_VARIABLE'}),
            createElement('block', {type: 'data_variable'}),
            createElement('button', {callbackKey: 'CREATE_LIST'}),
            createElement('block', {type: 'data_listcontents'})
        ];

        const getBlockExecutionMode = jest.fn();

        const result = filterVariableCategoryForProgramMode(
            elements,
            'stage',
            getBlockExecutionMode
        );

        expect(result).toBe(elements);
        expect(getBlockExecutionMode).not.toHaveBeenCalled();
    });

    test('removes list creation and Stage-only list blocks in Upload mode', () => {
        const createVariableButton = createElement(
            'button',
            {callbackKey: 'CREATE_VARIABLE'}
        );
        const scalarReporter = createElement(
            'block',
            {type: 'data_variable'}
        );
        const setVariable = createElement(
            'block',
            {type: 'data_setvariableto'}
        );
        const createListButton = createElement(
            'button',
            {callbackKey: 'CREATE_LIST'}
        );
        const listReporter = createElement(
            'block',
            {type: 'data_listcontents'}
        );
        const addToList = createElement(
            'block',
            {type: 'data_addtolist'}
        );

        const getBlockExecutionMode = jest.fn(blockType => {
            if (
                blockType === 'data_listcontents' ||
                blockType === 'data_addtolist'
            ) {
                return 'stage';
            }

            if (blockType === 'data_setvariableto') {
                return 'both';
            }

            return null;
        });

        const result = filterVariableCategoryForProgramMode(
            [
                createVariableButton,
                scalarReporter,
                setVariable,
                createListButton,
                listReporter,
                addToList
            ],
            'upload',
            getBlockExecutionMode
        );

        expect(result).toEqual([
            createVariableButton,
            scalarReporter,
            setVariable
        ]);

        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_variable');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_setvariableto');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_listcontents');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_addtolist');
    });
});
