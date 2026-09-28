const {
    HCSR04_LIBRARY_SOURCES
} = require(
    './generated/hcsr04-library-files'
);

const HCSR04_SUPPORT_FILE_NAMES =
    Object.freeze([
        'HCSR04.h',
        'HCSR04.cpp'
    ]);

const getHcsr04SupportFiles = () =>
    HCSR04_SUPPORT_FILE_NAMES.map(
        name => ({
            name,
            content:
                HCSR04_LIBRARY_SOURCES[
                    name
                ]
        })
    );

module.exports = {
    getHcsr04SupportFiles
};
