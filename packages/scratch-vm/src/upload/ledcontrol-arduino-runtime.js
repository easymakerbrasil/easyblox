const {
    LEDCONTROL_LIBRARY_SOURCES
} = require(
    './generated/ledcontrol-library-files'
);

const {
    MAX7219_MATRIX_ADAPTER_SOURCES
} = require(
    './generated/max7219-matrix-adapter-files'
);

const LEDCONTROL_SUPPORT_FILE_SOURCES =
    Object.freeze({
        ...MAX7219_MATRIX_ADAPTER_SOURCES,
        ...LEDCONTROL_LIBRARY_SOURCES
    });

const LEDCONTROL_SUPPORT_FILE_NAMES =
    Object.freeze([
        'MAX7219Matrix.h',
        'MAX7219Matrix.cpp',
        'LedControl.h',
        'LedControl.cpp'
    ]);

const getLedControlSupportFiles = () =>
    LEDCONTROL_SUPPORT_FILE_NAMES.map(
        name => ({
            name,
            content:
                LEDCONTROL_SUPPORT_FILE_SOURCES[
                    name
                ]
        })
    );

module.exports = {
    getLedControlSupportFiles
};
