/**
 * Canonical physical product profile for the EasyMaker board.
 *
 * This profile describes the hardware language exposed to students:
 * physical connectors, visual references and fixed PCB wiring.
 *
 * Arduino pin numbers remain implementation details behind this profile.
 */

const EasyMakerProductProfile = Object.freeze({
    id: 'easymaker',
    targetBoardId: 'arduino-uno',

    physicalPorts: Object.freeze({
        analogA0: Object.freeze({
            id: 'analog-a0',
            symbolId: 'square',
            fallbackLabel: '\u25A1',
            pins: Object.freeze([14])
        }),

        analogA1: Object.freeze({
            id: 'analog-a1',
            symbolId: 'circle',
            fallbackLabel: '\u25CB',
            pins: Object.freeze([15])
        }),

        analogA2: Object.freeze({
            id: 'analog-a2',
            symbolId: 'semicircle',
            fallbackLabel: 'A2',
            pins: Object.freeze([16])
        }),

        analogA2A3: Object.freeze({
            id: 'analog-a2-a3',
            symbolId: 'triangle',
            fallbackLabel: '\u25B3',
            pins: Object.freeze([
                16,
                17
            ])
        }),

        analogA4A5: Object.freeze({
            id: 'analog-a4-a5',
            symbolId: 'pentagon',
            fallbackLabel: '\u2B1F',
            pins: Object.freeze([
                18,
                19
            ])
        }),

        digitalD2D3: Object.freeze({
            id: 'digital-d2-d3',
            symbolId: 'asterisk',
            fallbackLabel: '*',
            pins: Object.freeze([
                2,
                3
            ])
        }),

        digitalD4D7D8: Object.freeze({
            id: 'digital-d4-d7-d8',
            symbolId: 'equals',
            fallbackLabel: '=',
            pins: Object.freeze([
                4,
                7,
                8
            ])
        }),

        digitalD9D10D11: Object.freeze({
            id: 'digital-d9-d10-d11',
            symbolId: 'exclamation',
            fallbackLabel: '!',
            pins: Object.freeze([
                9,
                10,
                11
            ])
        }),

        digitalD12: Object.freeze({
            id: 'digital-d12',
            symbolId: 'question',
            fallbackLabel: '?',
            pins: Object.freeze([12])
        }),

        digitalD13: Object.freeze({
            id: 'digital-d13',
            symbolId: 'chevrons',
            fallbackLabel: '<>',
            pins: Object.freeze([13])
        })
    }),

    devices: Object.freeze({
        trafficLight: Object.freeze({
            id: 'traffic-light',

            ports: Object.freeze({
                'digital-d4-d7-d8': Object.freeze({
                    greenPin: 4,
                    yellowPin: 7,
                    redPin: 8
                }),

                'digital-d9-d10-d11': Object.freeze({
                    greenPin: 9,
                    yellowPin: 10,
                    redPin: 11
                })
            })
        }),

        lcd16x2: Object.freeze({
            id: 'lcd-16x2',
            portId: 'analog-a4-a5',
            bus: 'i2c',

            pins: Object.freeze({
                sdaPin: 18,
                sclPin: 19
            })
        })
    }),

    dedicatedResources: Object.freeze({
        matrixJoystick: Object.freeze({
            id: 'matrix-joystick',
            pins: Object.freeze({
                a4: 18,
                a5: 19,
                d13: 13
            })
        }),

        servoPorts: Object.freeze([
            5,
            9,
            10,
            11
        ]),

        motors: Object.freeze({
            1: Object.freeze({
                symbolId: 'star',
                in1Pin: 4,
                in2Pin: 7,
                pwmPin: 5
            }),

            2: Object.freeze({
                symbolId: 'star',
                in1Pin: 8,
                in2Pin: 12,
                pwmPin: 6
            })
        })
    })
});

module.exports = EasyMakerProductProfile;
