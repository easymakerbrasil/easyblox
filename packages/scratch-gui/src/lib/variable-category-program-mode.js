/**
 * Filter the dynamic Variables category according to the current EasyBlox
 * program mode.
 * @param {Array.<Element>} elements - elements produced by Scratch Variables.
 * @param {string} programMode - current EasyBlox program mode.
 * @param {Function} getBlockExecutionMode - resolves the execution mode of a block type.
 * @returns {Array.<Element>} filtered category elements.
 */
export const filterVariableCategoryForProgramMode = (
    elements,
    programMode,
    getBlockExecutionMode
) => {
    if (programMode !== 'upload') {
        return elements;
    }

    return elements.filter(element => {
        if (element.getAttribute('callbackKey') === 'CREATE_LIST') {
            return false;
        }

        const blockType = element.getAttribute('type');

        if (!blockType) {
            return true;
        }

        return getBlockExecutionMode(blockType) !== 'stage';
    });
};
