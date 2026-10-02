const ANDROID_NEARBY_DEVICES_GUIDANCE_KEY =
    'easyconect.android-nearby-devices-guidance.v1';

const isAndroidUserAgent =
    userAgent =>
        typeof userAgent ===
            'string' &&
        /Android/i.test(
            userAgent
        );

const getBrowserUserAgent =
    () => {
        if (
            typeof navigator ===
                'undefined'
        ) {
            return '';
        }

        return navigator.userAgent || '';
    };

const getBrowserStorage =
    () => {
        if (
            typeof window ===
                'undefined'
        ) {
            return null;
        }

        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    };

const shouldShowAndroidNearbyDevicesGuidance =
    options => {
        const resolvedOptions =
            options || {};

        const userAgent =
            typeof resolvedOptions.userAgent ===
                'string' ?
                resolvedOptions.userAgent :
                getBrowserUserAgent();

        if (
            !isAndroidUserAgent(
                userAgent
            )
        ) {
            return false;
        }

        const storage =
            Object.prototype.hasOwnProperty.call(
                resolvedOptions,
                'storage'
            ) ?
                resolvedOptions.storage :
                getBrowserStorage();

        if (
            !storage ||
            typeof storage.getItem !==
                'function'
        ) {
            return true;
        }

        try {
            return storage.getItem(
                ANDROID_NEARBY_DEVICES_GUIDANCE_KEY
            ) !==
                'acknowledged';
        } catch (error) {
            return true;
        }
    };

const acknowledgeAndroidNearbyDevicesGuidance =
    options => {
        const resolvedOptions =
            options || {};

        const storage =
            Object.prototype.hasOwnProperty.call(
                resolvedOptions,
                'storage'
            ) ?
                resolvedOptions.storage :
                getBrowserStorage();

        if (
            !storage ||
            typeof storage.setItem !==
                'function'
        ) {
            return false;
        }

        try {
            storage.setItem(
                ANDROID_NEARBY_DEVICES_GUIDANCE_KEY,
                'acknowledged'
            );

            return true;
        } catch (error) {
            return false;
        }
    };

module.exports = {
    ANDROID_NEARBY_DEVICES_GUIDANCE_KEY,
    acknowledgeAndroidNearbyDevicesGuidance,
    isAndroidUserAgent,
    shouldShowAndroidNearbyDevicesGuidance
};
