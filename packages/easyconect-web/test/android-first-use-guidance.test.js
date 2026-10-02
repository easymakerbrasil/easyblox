const assert =
    require(
        'node:assert/strict'
    );

const {
    test
} = require(
    'node:test'
);

const {
    ANDROID_NEARBY_DEVICES_GUIDANCE_KEY,
    acknowledgeAndroidNearbyDevicesGuidance,
    isAndroidUserAgent,
    shouldShowAndroidNearbyDevicesGuidance
} = require(
    '../src/app/android-first-use-guidance'
);

const createStorage =
    initialValues => {
        const values =
            new Map(
                Object.entries(
                    initialValues || {}
                )
            );

        return {
            getItem:
                key =>
                    values.has(key) ?
                        values.get(key) :
                        null,

            setItem:
                (
                    key,
                    value
                ) => {
                    values.set(
                        key,
                        value
                    );
                }
        };
    };

test(
    'Android guidance recognizes Android user agents',
    () => {
        assert.equal(
            isAndroidUserAgent(
                'Mozilla/5.0 (Linux; Android 16)'
            ),
            true
        );

        assert.equal(
            isAndroidUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            ),
            false
        );
    }
);

test(
    'Android guidance is hidden outside Android',
    () => {
        assert.equal(
            shouldShowAndroidNearbyDevicesGuidance({
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                storage:
                    createStorage()
            }),
            false
        );
    }
);

test(
    'Android guidance is shown before it is acknowledged',
    () => {
        assert.equal(
            shouldShowAndroidNearbyDevicesGuidance({
                userAgent:
                    'Mozilla/5.0 (Linux; Android 16)',
                storage:
                    createStorage()
            }),
            true
        );
    }
);

test(
    'Android guidance remains safe when storage is unavailable',
    () => {
        assert.equal(
            shouldShowAndroidNearbyDevicesGuidance({
                userAgent:
                    'Mozilla/5.0 (Linux; Android 16)',
                storage:
                    null
            }),
            true
        );

        assert.equal(
            acknowledgeAndroidNearbyDevicesGuidance({
                storage:
                    null
            }),
            false
        );
    }
);

test(
    'Android guidance is hidden after acknowledgement',
    () => {
        const storage =
            createStorage();

        assert.equal(
            acknowledgeAndroidNearbyDevicesGuidance({
                storage
            }),
            true
        );

        assert.equal(
            storage.getItem(
                ANDROID_NEARBY_DEVICES_GUIDANCE_KEY
            ),
            'acknowledged'
        );

        assert.equal(
            shouldShowAndroidNearbyDevicesGuidance({
                userAgent:
                    'Mozilla/5.0 (Linux; Android 16)',
                storage
            }),
            false
        );
    }
);
