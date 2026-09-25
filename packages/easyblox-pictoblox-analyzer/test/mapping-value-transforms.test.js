const test =
    require('node:test');

const assert =
    require('node:assert/strict');

const {
    applyMappingValueTransform,
    isMappingValueTransformSupported
} = require('..');

test(
    'mapping value transform converts PictoBlox binary 8x8 matrix to EasyBlox hex',
    () => {
        const binary =
            '00000000' +
            '01100110' +
            '11111111' +
            '11111111' +
            '01111110' +
            '00111100' +
            '00011000' +
            '00000000';

        assert.equal(
            applyMappingValueTransform(
                'binary64ToHex16',
                binary
            ),
            '0066FFFF7E3C1800'
        );
    }
);

test(
    'mapping value transform preserves complete 8x8 byte range',
    () => {
        assert.equal(
            applyMappingValueTransform(
                'binary64ToHex16',
                '0'.repeat(64)
            ),
            '0000000000000000'
        );

        assert.equal(
            applyMappingValueTransform(
                'binary64ToHex16',
                '1'.repeat(64)
            ),
            'FFFFFFFFFFFFFFFF'
        );
    }
);

test(
    'mapping value transform registry reports supported transforms',
    () => {
        assert.equal(
            isMappingValueTransformSupported(
                'binary64ToHex16'
            ),
            true
        );

        assert.equal(
            isMappingValueTransformSupported(
                'unknownTransform'
            ),
            false
        );
    }
);

test(
    'binary64ToHex16 rejects malformed matrix payloads',
    () => {
        assert.throws(
            () =>
                applyMappingValueTransform(
                    'binary64ToHex16',
                    '0'.repeat(63)
                ),
            /exactly 64 binary digits/
        );

        assert.throws(
            () =>
                applyMappingValueTransform(
                    'binary64ToHex16',
                    `${'0'.repeat(63)}2`
                ),
            /exactly 64 binary digits/
        );

        assert.throws(
            () =>
                applyMappingValueTransform(
                    'binary64ToHex16',
                    0
                ),
            /matrix payload must be a string/
        );
    }
);

test(
    'mapping value transform rejects unsupported transform names',
    () => {
        assert.throws(
            () =>
                applyMappingValueTransform(
                    'unknownTransform',
                    '0'.repeat(64)
                ),
            /Unsupported mapping value transform/
        );
    }
);
