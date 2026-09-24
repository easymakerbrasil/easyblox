const {
    COMPATIBILITY_STATUSES,
    createCompatibilityCatalog
} = require('./compatibility-classifier');

const ARDUINO_UNO_BOARD =
    'Arduino Uno';

const createBlockTransform =
    args => ({
        kind:
            'block',
        arguments:
            args
    });

const RAW_MAPPING_ENTRIES = [
    {
        opcode:
            'arduinoUno_arduinoUnoStartUp',
        status:
            COMPATIBILITY_STATUSES
                .MAPPABLE,
        targetOpcode:
            'arduinoUno_whenArduinoUnoStart',
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        transform:
            createBlockTransform([])
    },
    {
        opcode:
            'actuators_setServo',
        status:
            COMPATIBILITY_STATUSES
                .MAPPABLE,
        targetOpcode:
            'actuators_servoWrite',
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        transform:
            createBlockTransform([
                {
                    target:
                        'PIN',
                    source:
                        'field',
                    sourceName:
                        'SERVO_CHANNEL'
                },
                {
                    target:
                        'ANGLE',
                    source:
                        'input',
                    sourceName:
                        'ANGLE'
                }
            ])
    },
    {
        opcode:
            'sensors_readUltrasonic',
        status:
            COMPATIBILITY_STATUSES
                .MAPPABLE,
        targetOpcode:
            'sensors_ultrasonicRead',
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        transform:
            createBlockTransform([
                {
                    target:
                        'TRIG',
                    source:
                        'field',
                    sourceName:
                        'TRIG_PIN'
                },
                {
                    target:
                        'ECHO',
                    source:
                        'field',
                    sourceName:
                        'ECHO_PIN'
                }
            ])
    },
    {
        opcode:
            'arduinoUno_setPWM',
        status:
            COMPATIBILITY_STATUSES
                .MAPPABLE,
        targetOpcode:
            'arduinoUno_pwmWrite',
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        transform:
            createBlockTransform([
                {
                    target:
                        'PIN',
                    source:
                        'field',
                    sourceName:
                        'PIN'
                },
                {
                    target:
                        'VALUE',
                    source:
                        'input',
                    sourceName:
                        'VALUE'
                }
            ])
    },
    {
        opcode:
            'arduinoUno_playTone',
        status:
            COMPATIBILITY_STATUSES
                .MAPPABLE,
        targetOpcode:
            'arduinoUno_toneStart',
        sourceBoards: [
            ARDUINO_UNO_BOARD
        ],
        transform:
            createBlockTransform([
                {
                    target:
                        'PIN',
                    source:
                        'field',
                    sourceName:
                        'PIN'
                },
                {
                    target:
                        'NOTE',
                    source:
                        'field',
                    sourceName:
                        'NOTE'
                },
                {
                    target:
                        'DURATION',
                    source:
                        'field',
                    sourceName:
                        'BEATS'
                }
            ])
    }
];

const createPictoBloxMappingCatalog =
    () => {
        const catalog =
            createCompatibilityCatalog(
                RAW_MAPPING_ENTRIES
            );

        const entries =
            Array.from(
                catalog.values()
            ).sort(
                (
                    left,
                    right
                ) =>
                    left.opcode
                        .localeCompare(
                            right.opcode
                        )
            );

        return {
            entries,
            totalMappingCount:
                entries.length
        };
    };

module.exports = {
    createPictoBloxMappingCatalog
};
