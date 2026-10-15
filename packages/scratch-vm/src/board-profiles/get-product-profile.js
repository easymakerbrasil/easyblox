const EasyMakerProductProfile = require('./easymaker-product-profile');
const EasyDuinoJrProductProfile = require('./easyduino-jr-product-profile');

/**
 * Resolve a logical product without inventing a physical profile for generic boards.
 * @param {?string} boardId Logical board identity.
 * @returns {?object} Original product profile, or null for generic behavior.
 */
const getProductProfile = boardId => {
    switch (boardId) {
    case EasyMakerProductProfile.id:
        return EasyMakerProductProfile;
    case EasyDuinoJrProductProfile.id:
        return EasyDuinoJrProductProfile;
    default:
        return null;
    }
};

module.exports = getProductProfile;
