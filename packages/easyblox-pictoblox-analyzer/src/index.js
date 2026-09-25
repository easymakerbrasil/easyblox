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

const {
    createEasyBloxSupportCatalog
} = require('./easyblox-support-catalog');

const {
    createPictoBloxMappingCatalog
} = require('./pictoblox-mapping-catalog');

const {
    applyMappingValueTransform,
    isMappingValueTransformSupported
} = require('./mapping-value-transforms');

const {
    aggregateProjectCorpus,
    createProjectSignature
} = require('./corpus-aggregator');

const {
    discoverSb3Files,
    scanProjectCorpus
} = require('./corpus-scanner');

module.exports = {
    createProjectInventory,
    getOpcodeNamespace,
    PROJECT_JSON_FILENAME,
    parseProjectJson,
    readProjectSource,
    readSb3Project,
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog,
    classifyProjectInventory,
    createEasyBloxSupportCatalog,
    createPictoBloxMappingCatalog,
    applyMappingValueTransform,
    isMappingValueTransformSupported,
    aggregateProjectCorpus,
    createProjectSignature,
    discoverSb3Files,
    scanProjectCorpus
};
