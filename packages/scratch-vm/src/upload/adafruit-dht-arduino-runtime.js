const {
    ADAFRUIT_DHT_LIBRARY_SOURCES
} = require(
    './generated/adafruit-dht-library-files'
);

const ADAFRUIT_DHT_SUPPORT_FILE_NAMES =
    Object.freeze([
        'DHT.h',
        'DHT.cpp'
    ]);

const getAdafruitDhtSupportFiles = () =>
    ADAFRUIT_DHT_SUPPORT_FILE_NAMES.map(
        name => ({
            name,
            content:
                ADAFRUIT_DHT_LIBRARY_SOURCES[
                    name
                ]
        })
    );

module.exports = {
    getAdafruitDhtSupportFiles
};
