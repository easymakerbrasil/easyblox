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

    test('keeps Upload-compatible variables and lists while removing Stage-only monitors', () => {
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
        const showVariable = createElement(
            'block',
            {type: 'data_showvariable'}
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
        const listLength = createElement(
            'block',
            {type: 'data_lengthoflist'}
        );
        const showList = createElement(
            'block',
            {type: 'data_showlist'}
        );

        const getBlockExecutionMode = jest.fn(blockType => {
            if (
                blockType === 'data_showvariable' ||
                blockType === 'data_showlist'
            ) {
                return 'stage';
            }

            return 'both';
        });

        const result = filterVariableCategoryForProgramMode(
            [
                createVariableButton,
                scalarReporter,
                setVariable,
                showVariable,
                createListButton,
                listReporter,
                addToList,
                listLength,
                showList
            ],
            'upload',
            getBlockExecutionMode
        );

        expect(result).toEqual([
            createVariableButton,
            scalarReporter,
            setVariable,
            createListButton,
            listReporter,
            addToList,
            listLength
        ]);

        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_variable');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_setvariableto');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_showvariable');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_listcontents');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_addtolist');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_lengthoflist');
        expect(getBlockExecutionMode)
            .toHaveBeenCalledWith('data_showlist');
    });
});
