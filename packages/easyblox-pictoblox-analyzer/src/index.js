const {
    createProjectInventory,
    getOpcodeNamespace
} = require('./project-inventory');

const {
    PROJECT_JSON_FILENAME,
    parseProjectJson,
    readProjectSource,
    readSb3Project
} = require('./project-reader');

const {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory
} = require('./compatibility-classifier');

module.exports = {
    createProjectInventory,
    getOpcodeNamespace,
    PROJECT_JSON_FILENAME,
    parseProjectJson,
    readProjectSource,
    readSb3Project,
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory
};
