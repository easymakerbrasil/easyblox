const tap = require('tap');

const {
    CONNECTIVITY_RESOURCES
} = require('../../src/connectivity/easyblox-connectivity-contract');

const ArduinoUnoBoardProfile =
    require('../../src/upload/board-profiles/arduino-uno-board-profile');

const UploadResourceValidator =
    require('../../src/upload/upload-resource-validator');

const SOFTWARE_UART_D2_D3 =
    CONNECTIVITY_RESOURCES.SOFTWARE_UART_D2_D3;

const createValidator = () =>
    new UploadResourceValidator(ArduinoUnoBoardProfile);

const createIr = ({
    resources = [SOFTWARE_UART_D2_D3],
    setup = [],
    loop = [],
    procedures = []
} = {}) => ({
    resources,
    setup,
    loop,
    procedures
});

tap.test(
    'Arduino UNO BoardProfile maps the shared software UART resource to D2/D3',
    t => {
        const logicalResources =
            ArduinoUnoBoardProfile.logicalResources || {};

        t.same(
            logicalResources[SOFTWARE_UART_D2_D3],
            {
                pins: [2, 3],
                exclusive: true
            }
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload accepts the software UART D2/D3 resource by itself',
    t => {
        const validator = createValidator();
        const ir = createIr();

        t.equal(
            validator.validate(ir),
            ir
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload deduplicates repeated claims of the same logical resource',
    t => {
        const validator = createValidator();

        const ir = createIr({
            resources: [
                SOFTWARE_UART_D2_D3,
                SOFTWARE_UART_D2_D3
            ]
        });

        t.equal(
            validator.validate(ir),
            ir
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload rejects a logical resource unsupported by the board',
    t => {
        const validator = createValidator();

        const ir = createIr({
            resources: [
                'UNKNOWN_CONNECTIVITY_RESOURCE'
            ]
        });

        t.throws(
            () => validator.validate(ir),
            /Hardware resource is not supported by the selected board/
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload keeps unrelated pins available while software UART D2/D3 is reserved',
    t => {
        const validator = createValidator();

        const ir = createIr({
            setup: [{
                type: 'DigitalWrite',
                pin: 13,
                value: true
            }]
        });

        t.equal(
            validator.validate(ir),
            ir
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload rejects direct pin users that collide with software UART D2/D3',
    t => {
        const conflictCases = [
            {
                name: 'DigitalWrite D2',
                setup: [{
                    type: 'DigitalWrite',
                    pin: 2,
                    value: true
                }],
                pin: 2
            },
            {
                name: 'DigitalWrite D3',
                setup: [{
                    type: 'DigitalWrite',
                    pin: 3,
                    value: true
                }],
                pin: 3
            },
            {
                name: 'DigitalRead D2',
                setup: [{
                    type: 'If',
                    condition: {
                        type: 'DigitalReadExpression',
                        pin: 2
                    },
                    body: []
                }],
                pin: 2
            },
            {
                name: 'PWM D3',
                setup: [{
                    type: 'PwmWrite',
                    pin: 3,
                    value: 128
                }],
                pin: 3
            },
            {
                name: 'Servo D3',
                setup: [{
                    type: 'ServoWrite',
                    pin: 3,
                    angle: 90
                }],
                pin: 3
            },
            {
                name: 'Tone D2',
                setup: [{
                    type: 'ToneStart',
                    pin: 2,
                    frequency: 440
                }],
                pin: 2
            },
            {
                name: 'Relay D2',
                setup: [{
                    type: 'RelayWrite',
                    pin: 2,
                    state: true
                }],
                pin: 2
            },
            {
                name: 'Ultrasonic D2',
                setup: [{
                    type: 'If',
                    condition: {
                        type: 'LessThan',
                        left: {
                            type: 'UltrasonicReadExpression',
                            trigPin: 2,
                            echoPin: 4
                        },
                        right: {
                            type: 'NumberLiteral',
                            value: 20
                        }
                    },
                    body: []
                }],
                pin: 2
            },
            {
                name: 'DHT D2',
                setup: [{
                    type: 'If',
                    condition: {
                        type: 'GreaterThan',
                        left: {
                            type: 'DhtReadExpression',
                            pin: 2,
                            value: 'temperature'
                        },
                        right: {
                            type: 'NumberLiteral',
                            value: 25
                        }
                    },
                    body: []
                }],
                pin: 2
            }
        ];

        for (const conflictCase of conflictCases) {
            const validator = createValidator();

            const ir = createIr({
                setup: conflictCase.setup
            });

            t.throws(
                () => validator.validate(ir),
                new RegExp(
                    `Connectivity resource conflict on pin ${conflictCase.pin}`
                ),
                conflictCase.name
            );
        }

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload rejects default Motor 1 because it occupies D2/D3',
    t => {
        const validator = createValidator();

        const ir = createIr({
            setup: [{
                type: 'MotorWrite',
                motor: 1,
                direction: 0,
                speedPercent: 75
            }]
        });

        t.throws(
            () => validator.validate(ir),
            /Connectivity resource conflict on pin [23]/
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload rejects Display GPIO that collides with software UART D2/D3',
    t => {
        const validator = createValidator();

        const ir = createIr({
            setup: [{
                type: 'Tm1637Init',
                clkPin: 2,
                dioPin: 4
            }]
        });

        t.throws(
            () => validator.validate(ir),
            /Connectivity resource conflict on pin 2/
        );

        t.end();
    }
);

tap.test(
    'Arduino UNO Upload rejects Joystick CLICK that collides with software UART D2/D3',
    t => {
        const validator = createValidator();

        const ir = createIr({
            setup: [{
                type: 'JoystickInit',
                xPin: 14,
                yPin: 15,
                clickPin: 2
            }]
        });

        t.throws(
            () => validator.validate(ir),
            /Connectivity resource conflict on pin 2/
        );

        t.end();
    }
);
