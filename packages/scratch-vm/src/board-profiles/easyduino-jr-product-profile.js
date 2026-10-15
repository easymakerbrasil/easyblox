/**
 * Physical hardware contract for EasyDuino Jr.
 * Analog pins use the Arduino UNO digital identifiers A0=14 through A5=19.
 * Shared wiring describes the shield; it does not reserve pins or enforce conflicts.
 */
const EasyDuinoJrProductProfile = Object.freeze({
    id: 'easyduino-jr',
    targetBoardId: 'arduino-uno',
    microcontroller: 'ATmega328P',
    capabilities: Object.freeze([]),

    physicalPorts: Object.freeze({
        digitalD2: Object.freeze({
            id: 'digital-d2',
            fallbackLabel: 'D2',
            pins: Object.freeze([2])
        }),
        digitalD3: Object.freeze({
            id: 'digital-d3',
            fallbackLabel: 'D3',
            pins: Object.freeze([3])
        }),
        digitalD5: Object.freeze({
            id: 'digital-d5',
            fallbackLabel: 'D5',
            pins: Object.freeze([5])
        }),
        digitalD7: Object.freeze({
            id: 'digital-d7',
            fallbackLabel: 'D7',
            pins: Object.freeze([7])
        }),
        digitalD8: Object.freeze({
            id: 'digital-d8',
            fallbackLabel: 'D8',
            pins: Object.freeze([8])
        }),
        analogA2: Object.freeze({
            id: 'analog-a2',
            fallbackLabel: 'A2',
            pins: Object.freeze([16])
        }),
        analogA3: Object.freeze({
            id: 'analog-a3',
            fallbackLabel: 'A3',
            pins: Object.freeze([17])
        })
    }),

    devices: Object.freeze({
        rgbLed: Object.freeze({
            id: 'rgb-led',
            polarity: 'common-cathode',
            redPin: 9,
            greenPin: 10,
            bluePin: 11
        }),
        buzzer: Object.freeze({
            id: 'buzzer',
            type: 'passive',
            pin: 6
        }),
        ultrasonic: Object.freeze({
            id: 'ultrasonic',
            model: 'HC-SR04',
            trigPin: 16,
            echoPin: 17
        }),
        ldr: Object.freeze({
            id: 'ldr',
            pin: 15
        }),
        potentiometer: Object.freeze({
            id: 'potentiometer',
            pin: 14
        }),
        dht11: Object.freeze({
            id: 'dht-11',
            model: 'DHT11',
            pin: 12
        }),
        reflectiveSensor: Object.freeze({
            id: 'reflective-sensor',
            signal: 'digital',
            activeLevel: 'LOW',
            pin: 13
        }),
        servo: Object.freeze({
            id: 'servo',
            pin: 5
        }),
        tm1637: Object.freeze({
            id: 'tm1637',
            dioPin: 18,
            clkPin: 19
        }),
        trafficLight: Object.freeze({
            id: 'traffic-light',
            greenPin: 4,
            yellowPin: 7,
            redPin: 8
        }),
        soilMoisture: Object.freeze({
            id: 'soil-moisture',
            signal: 'analog',
            pin: 16
        }),
        lcd16x2: Object.freeze({
            id: 'lcd-16x2',
            external: true,
            connection: 'shield-female-header-with-jumpers',
            bus: 'i2c',
            pins: Object.freeze({
                sdaPin: 18,
                sclPin: 19
            })
        })
    }),

    dedicatedResources: Object.freeze({
        motorPowerSupply: 'external-battery',
        motors: Object.freeze({
            1: Object.freeze({
                driver: 'L293D',
                in1Pin: 2,
                in2Pin: 4,
                pwmPin: 3
            }),
            2: Object.freeze({
                driver: 'L293D',
                in1Pin: 7,
                in2Pin: 8,
                pwmPin: 5
            })
        })
    })
});

module.exports = EasyDuinoJrProductProfile;
