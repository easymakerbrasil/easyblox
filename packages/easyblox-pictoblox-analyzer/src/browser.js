const {
    createProjectInventory,
    getOpcodeNamespace
} = require('./project-inventory');

const {
    PROJECT_JSON_FILENAME,
    parseProjectJson
} = require('./project-json');

const {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory
} = require('./compatibility-classifier');

const {
    createEasyBloxSupportCatalog
} = require('./easyblox-support-catalog');

const {
    createPictoBloxMappingCatalog
} = require('./pictoblox-mapping-catalog');

const {
    createPictoBloxUnsupportedCatalog
} = require('./pictoblox-unsupported-catalog');

const {
    applyMappingValueTransform,
    isMappingValueTransformSupported
} = require('./mapping-value-transforms');

module.exports = {
    createProjectInventory,
    getOpcodeNamespace,
    PROJECT_JSON_FILENAME,
    parseProjectJson,
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory,
    createEasyBloxSupportCatalog,
    createPictoBloxMappingCatalog,
    createPictoBloxUnsupportedCatalog,
    applyMappingValueTransform,
    isMappingValueTransformSupported
};
