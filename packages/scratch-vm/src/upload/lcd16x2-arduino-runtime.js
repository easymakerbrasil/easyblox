const {
    LCD16X2_ADAPTER_SOURCES
} = require(
    './generated/lcd16x2-adapter-files'
);

const LCD16X2_SUPPORT_FILE_NAMES =
    Object.freeze([
        'LCD16x2.h',
        'LCD16x2.cpp'
    ]);

const getLcd16x2SupportFiles = () =>
    LCD16X2_SUPPORT_FILE_NAMES.map(
        name => ({
            name,
            content:
                LCD16X2_ADAPTER_SOURCES[
                    name
                ]
        })
    );

module.exports = {
    getLcd16x2SupportFiles
};
