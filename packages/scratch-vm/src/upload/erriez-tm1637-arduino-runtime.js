const {
    ERRIEZ_TM1637_LIBRARY_SOURCES
} = require(
    './generated/erriez-tm1637-library-files'
);

const {
    TM1637_NUMBER_DISPLAY_ADAPTER_SOURCES
} = require(
    './generated/tm1637-number-display-adapter-files'
);

const TM1637_SUPPORT_FILE_SOURCES =
    Object.freeze({
        ...TM1637_NUMBER_DISPLAY_ADAPTER_SOURCES,
        ...ERRIEZ_TM1637_LIBRARY_SOURCES
    });

const TM1637_SUPPORT_FILE_NAMES =
    Object.freeze([
        'TM1637NumberDisplay.h',
        'TM1637NumberDisplay.cpp',
        'ErriezTM1637.h',
        'ErriezTM1637.cpp'
    ]);

const getErriezTm1637SupportFiles = () =>
    TM1637_SUPPORT_FILE_NAMES.map(
        name => ({
            name,
            content:
                TM1637_SUPPORT_FILE_SOURCES[
                    name
                ]
        })
    );

module.exports = {
    getErriezTm1637SupportFiles
};
