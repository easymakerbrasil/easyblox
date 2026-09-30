const binary64ToHex16 =
    value => {
        if (
            typeof value !==
                'string'
        ) {
            throw new TypeError(
                'binary64ToHex16 matrix payload must be a string'
            );
        }

        if (
            !/^[01]{64}$/.test(
                value
            )
        ) {
            throw new RangeError(
                'binary64ToHex16 requires exactly 64 binary digits'
            );
        }

        let result = '';

        for (
            let index = 0;
            index < value.length;
            index += 8
        ) {
            result +=
                parseInt(
                    value.slice(
                        index,
                        index + 8
                    ),
                    2
                )
                    .toString(16)
                    .toUpperCase()
                    .padStart(
                        2,
                        '0'
                    );
        }

        return result;
    };

const VALUE_TRANSFORMS =
    Object.freeze({
        binary64ToHex16
    });

const isMappingValueTransformSupported =
    name =>
        typeof name ===
            'string' &&
        Object.prototype
            .hasOwnProperty.call(
                VALUE_TRANSFORMS,
                name
            );

const applyMappingValueTransform =
    (
        name,
        value
    ) => {
        if (
            !isMappingValueTransformSupported(
                name
            )
        ) {
            throw new RangeError(
                `Unsupported mapping value transform: ${name}`
            );
        }

        return VALUE_TRANSFORMS[
            name
        ](
            value
        );
    };

module.exports = {
    applyMappingValueTransform,
    isMappingValueTransformSupported
};
