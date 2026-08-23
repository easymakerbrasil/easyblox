/**
 * Hardware capabilities and defaults for the Arduino UNO Upload target.
 */
const ArduinoUnoBoardProfile = Object.freeze({
    id: 'arduino-uno',

    digitalPins: Object.freeze([
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19
    ]),

    pwmPins: Object.freeze([
        3,
        5,
        6,
        9,
        10,
        11
    ]),

    analogPins: Object.freeze([
        14,
        15,
        16,
        17,
        18,
        19
    ]),

    tonePins: Object.freeze([
        3,
        5,
        6,
        9,
        10,
        11
    ]),

    toneFrequencyRange: Object.freeze({
        min: 1,
        max: 65535
    }),

    servoPins: Object.freeze([
        3,
        5,
        6,
        9,
        10,
        11
    ]),

    servoAngleRange: Object.freeze({
        min: 0,
        max: 180
    }),

    servoPwmConflictPins: Object.freeze([
        9,
        10
    ]),

    motors: Object.freeze({
        1: Object.freeze({
            in1Pin: 2,
            in2Pin: 4,
            pwmPin: 3
        }),

        2: Object.freeze({
            in1Pin: 7,
            in2Pin: 8,
            pwmPin: 5
        })
    })
});

module.exports = ArduinoUnoBoardProfile;
