const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    createEasyBloxSupportCatalog:
        createNodeSupportCatalog
} = require(
    '../src/easyblox-support-catalog'
);

const {
    createEasyBloxSupportCatalog:
        createBrowserSupportCatalog
} = require(
    '../src/easyblox-support-catalog-browser'
);

test(
    'browser support catalog matches the real EasyBlox VM support catalog',
    () => {
        const nodeCatalog =
            createNodeSupportCatalog();

        const browserCatalog =
            createBrowserSupportCatalog();

        assert.deepEqual(
            browserCatalog,
            nodeCatalog
        );
    }
);

test(
    'browser support catalog returns an independent copy',
    () => {
        const first =
            createBrowserSupportCatalog();

        const second =
            createBrowserSupportCatalog();

        const originalEntryCount =
            second.entries.length;

        first.entries.pop();

        assert.equal(
            second.entries.length,
            originalEntryCount
        );

        assert.notEqual(
            first.entries.length,
            second.entries.length
        );
    }
);
