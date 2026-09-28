const {
    LEDCONTROL_LIBRARY_SOURCES
} = require(
    './generated/ledcontrol-library-files'
);

const LEDCONTROL_SUPPORT_FILE_NAMES =
    Object.freeze([
        'LedControl.h',
        'LedControl.cpp'
    ]);

const getLedControlSupportFiles = () =>
    LEDCONTROL_SUPPORT_FILE_NAMES.map(
        name => ({
            name,
            content:
                LEDCONTROL_LIBRARY_SOURCES[
                    name
                ]
        })
    );

module.exports = {
    getLedControlSupportFiles
};
