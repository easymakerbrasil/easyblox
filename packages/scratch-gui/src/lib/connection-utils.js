/**
 * @file
 * Utility functions for resolving peripheral connection behavior.
 */

import {PLATFORM} from './platform';

/**
 * Resolve whether the connection UI should use the auto-scanning flow.
 * @param {boolean} useAutoScan The extension's configured auto-scan behavior.
 * @param {?string} connectionTransport The physical connection transport used by the extension.
 * @param {string} platform The current GUI platform.
 * @returns {boolean} Whether the auto-scanning flow should be used.
 */
const resolveUseAutoScan = (useAutoScan, connectionTransport, platform) => {
    if (connectionTransport !== 'serial') {
        return useAutoScan;
    }
    if (platform === PLATFORM.WEB) {
        return true;
    }
    if (platform === PLATFORM.DESKTOP) {
        return false;
    }
    return useAutoScan;
};

export {
    resolveUseAutoScan
};
