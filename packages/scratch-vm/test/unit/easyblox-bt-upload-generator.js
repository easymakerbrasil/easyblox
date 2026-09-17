const tap = require('tap');

const ArduinoUnoGenerator =
    require('../../src/upload/arduino-uno-generator');

const {
    EASYBLOX_BT_INTERNAL_IDENTIFIERS,
    getEasyBloxBtSupportFiles
} = require('../../src/upload/easyblox-bt-arduino-runtime');

const {
    EASYCONECT_GAMEPAD_SIGNAL_IDS,
    EASYCONECT_CONTROLS_SIGNAL_IDS,
    EASYCONECT_MOTORS_SERVO_SIGNAL_IDS,
    getEasyConectWireChannel
} = require('@easymaker/easyconect-core');

const createIr = (
    setup = [],
    loop = []
) => ({
    globals: {
        variables: [],
        lists: []
    },
    procedures: [],
    setup,
    loop
});

const fixedChannel = {
    type: 'TextLiteral',
    value: '1'
};

tap.test(
    'EasyBlox BT internal identifiers are reserved only when Bluetooth is used',
    t => {
        const plainGenerator =
            new ArduinoUnoGenerator();

        plainGenerator._initializeDataSymbols(
            [{
                id: 'student_serial',
                name: 'SoftwareSerial'
            }],
            [],
            [],
            false
        );

        t.equal(
            plainGenerator._variablesById
                .get('student_serial')
                .identifier,
            'SoftwareSerial',
            'Bluetooth-only identifiers remain available in a non-Bluetooth sketch'
        );

        const bluetoothGenerator =
            new ArduinoUnoGenerator();

        bluetoothGenerator._initializeDataSymbols(
            [{
                id: 'student_serial',
                name: 'SoftwareSerial'
            }],
            [],
            [],
            true
        );

        t.not(
            bluetoothGenerator._variablesById
                .get('student_serial')
                .identifier,
            'SoftwareSerial',
            'Bluetooth runtime reserves SoftwareSerial when Bluetooth is used'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator references the encapsulated runtime only when used',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type:
                            'EasyBloxBtInit'
                    }
                ])
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'Bluetooth Upload references the EasyBlox Arduino runtime'
        );

        t.match(
            sketch,
            /EasyBloxBT\.begin\s*\(\s*\)\s*;/,
            'explicit init delegates Bluetooth startup to the runtime library'
        );

        t.notMatch(
            sketch,
            /#include <SoftwareSerial\.h>/,
            'pedagogical sketch does not expose SoftwareSerial'
        );

        t.notMatch(
            sketch,
            /SoftwareSerial\s+easybloxBtSerial/,
            'pedagogical sketch does not expose the D2/D3 transport implementation'
        );

        const plainSketch =
            generator.generate(
                createIr()
            );

        t.notMatch(
            plainSketch,
            /#include "EasyBlox\.h"/,
            'ordinary sketches do not gain the EasyBlox runtime dependency'
        );

        t.equal(
            plainSketch.includes(
                'easybloxBt'
            ),
            false,
            'ordinary sketches do not gain EasyBlox BT calls'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator emits TEXT and NUMBER sends through the pedagogical facade',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch = generator.generate(
            createIr([
                {
                    type: 'EasyBloxBtSendText',
                    value: {
                        type: 'TextLiteral',
                        value: 'ligar'
                    },
                    channel: fixedChannel
                },
                {
                    type: 'EasyBloxBtSendNumber',
                    value: {
                        type: 'DecimalLiteral',
                        value: 42.5
                    },
                    channel: fixedChannel
                }
            ])
        );

        t.match(
            sketch,
            /EasyBloxBT\.sendText\s*\(\s*"ligar"\s*\)\s*;/,
            'TEXT statement uses the fixed EBCP channel'
        );

        t.match(
            sketch,
            /EasyBloxBT\.sendNumber\s*\(\s*42\.5\s*\)\s*;/,
            'NUMBER statement uses the fixed EBCP channel'
        );

        t.notMatch(
            sketch,
            /easybloxBtNextSequence/,
            'application sequence state stays inside the runtime support files'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator emits sequential TEXT and NUMBER waits',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch = generator.generate(
            createIr([
                {
                    type: 'EasyBloxBtWaitText',
                    channel: fixedChannel
                },
                {
                    type: 'EasyBloxBtWaitNumber',
                    channel: fixedChannel
                }
            ])
        );

        t.match(
            sketch,
            /EasyBloxBT\.waitText\s*\(\s*\)\s*;/,
            'TEXT wait blocks sequentially on the fixed channel'
        );

        t.match(
            sketch,
            /EasyBloxBT\.waitNumber\s*\(\s*\)\s*;/,
            'NUMBER wait blocks sequentially on the fixed channel'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator maps received reporters through the pedagogical facade',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        t.equal(
            generator._generateExpression({
                type:
                    'EasyBloxBtReceivedTextExpression'
            }),
            'EasyBloxBT.receivedText()',
            'received TEXT reporter reads the TEXT runtime state'
        );

        t.equal(
            generator._generateExpression({
                type:
                    'EasyBloxBtReceivedNumberExpression'
            }),
            'EasyBloxBT.receivedNumber()',
            'received NUMBER reporter reads the numeric runtime state'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator keeps EBCP implementation outside the pedagogical sketch',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type:
                            'EasyBloxBtInit'
                    }
                ])
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'Bluetooth sketch references the EasyBlox runtime'
        );

        t.notMatch(
            sketch,
            /EASYBLOX_EBCP_MAGIC_0/,
            'magic bytes are not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /EASYBLOX_EBCP_TYPE_TEXT/,
            'EBCP type constants are not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /easybloxBtRxBuffer/,
            'receive parser state is not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /easybloxBtPoll\s*\(/,
            'receive poller implementation is not exposed in the sketch'
        );

        t.notMatch(
            sketch,
            /easybloxBtSendAck\s*\(/,
            'ACK implementation is not exposed in the sketch'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload services EBCP continuously without exposing runtime maintenance in the pedagogical sketch',
    t => {
        const supportFiles =
            getEasyBloxBtSupportFiles();

        const easyBloxHeader =
            supportFiles.find(file =>
                file.name === 'EasyBlox.h'
            ).content;

        const bluetoothRuntime =
            supportFiles.find(file =>
                file.name ===
                    'EasyBloxBluetooth.cpp'
            ).content;

        t.match(
            easyBloxHeader,
            /#define\s+loop\s+easybloxUserLoop/,
            'runtime privately redirects the pedagogical Arduino loop'
        );

        t.match(
            bluetoothRuntime,
            /extern\s+void\s+easybloxUserLoop\s*\(\s*\)\s*;/,
            'runtime can invoke the redirected pedagogical loop'
        );

        t.match(
            bluetoothRuntime,
            /void\s+loop\s*\(\s*\)\s*\{[\s\S]*?easybloxBtPoll\s*\(\s*\)\s*;[\s\S]*?easybloxUserLoop\s*\(\s*\)\s*;[\s\S]*?\}/,
            'runtime-owned Arduino loop services EBCP before running the pedagogical loop'
        );

        t.ok(
            EASYBLOX_BT_INTERNAL_IDENTIFIERS
                .includes(
                    'easybloxUserLoop'
                ),
            'redirected loop identifier is reserved from student symbols'
        );

        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type:
                            'EasyBloxBtInit'
                    }
                ])
            );

        t.match(
            sketch,
            /void\s+loop\s*\(\s*\)/,
            'pedagogical preview keeps the canonical Arduino loop'
        );

        t.notMatch(
            sketch,
            /easybloxUserLoop/,
            'runtime loop redirection stays hidden from the pedagogical preview'
        );

        t.notMatch(
            sketch,
            /easybloxBtPoll\s*\(/,
            'runtime poller stays hidden from the pedagogical preview'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator maps Gamepad Boolean state through the runtime facade',
    t => {
        const signalId =
            EASYCONECT_GAMEPAD_SIGNAL_IDS
                .DPAD_UP;

        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type: 'If',
                        condition: {
                            type:
                                'EasyBloxBtGamepadButtonPressedExpression',
                            signalId
                        },
                        body: []
                    }
                ])
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'GAMEPAD requires the EasyBlox runtime'
        );

        t.match(
            sketch,
            /EasyBloxBT\.begin\s*\(\s*\)\s*;/,
            'GAMEPAD starts Bluetooth automatically'
        );

        t.match(
            sketch,
            /EasyBloxBT\.gamepadButtonPressed\s*\(\s*EasyBloxGamepadButton::DpadUp\s*\)/,
            'GAMEPAD condition uses the typed runtime facade'
        );

        t.notMatch(
            sketch,
            new RegExp(
                getEasyConectWireChannel(
                    signalId
                ).replace(
                    '.',
                    '\\.'
                )
            ),
            'wire channel stays outside the pedagogical sketch'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator maps Controls state through the runtime facade',
    t => {
        const joystickX =
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_X;
        const joystickY =
            EASYCONECT_CONTROLS_SIGNAL_IDS
                .JOYSTICK_Y;

        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type: 'If',
                        condition: {
                            type:
                                'BinaryExpression',
                            operator:
                                'GreaterThan',
                            left: {
                                type:
                                    'EasyBloxBtControlsJoystickExpression',
                                signalId:
                                    joystickX
                            },
                            right: {
                                type:
                                    'IntegerLiteral',
                                value: 0
                            }
                        },
                        body: []
                    },
                    {
                        type: 'If',
                        condition: {
                            type:
                                'BinaryExpression',
                            operator:
                                'GreaterThan',
                            left: {
                                type:
                                    'EasyBloxBtControlsJoystickExpression',
                                signalId:
                                    joystickY
                            },
                            right: {
                                type:
                                    'IntegerLiteral',
                                value: 0
                            }
                        },
                        body: []
                    },
                    {
                        type: 'If',
                        condition: {
                            type:
                                'BinaryExpression',
                            operator:
                                'GreaterThan',
                            left: {
                                type:
                                    'EasyBloxBtControlsSliderExpression'
                            },
                            right: {
                                type:
                                    'IntegerLiteral',
                                value: 0
                            }
                        },
                        body: []
                    },
                    {
                        type: 'If',
                        condition: {
                            type:
                                'EasyBloxBtControlsButtonExpression'
                        },
                        body: []
                    },
                    {
                        type: 'If',
                        condition: {
                            type:
                                'EasyBloxBtControlsSwitchExpression'
                        },
                        body: []
                    }
                ])
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'CONTROLES requires the EasyBlox runtime'
        );

        const beginCalls =
            sketch.match(
                /EasyBloxBT\.begin\s*\(\s*\)\s*;/g
            ) || [];

        t.equal(
            beginCalls.length,
            1,
            'CONTROLES starts Bluetooth automatically exactly once'
        );

        t.match(
            sketch,
            /EasyBloxBT\.controlsJoystickPosition\s*\(\s*EasyBloxControlsJoystickAxis::Horizontal\s*\)/,
            'horizontal joystick uses the typed runtime facade'
        );

        t.match(
            sketch,
            /EasyBloxBT\.controlsJoystickPosition\s*\(\s*EasyBloxControlsJoystickAxis::Vertical\s*\)/,
            'vertical joystick uses the typed runtime facade'
        );

        t.match(
            sketch,
            /EasyBloxBT\.controlsSliderValue\s*\(\s*\)/,
            'slider uses the typed runtime facade'
        );

        t.match(
            sketch,
            /EasyBloxBT\.controlsButtonPressed\s*\(\s*\)/,
            'button uses the typed runtime facade'
        );

        t.match(
            sketch,
            /EasyBloxBT\.controlsSwitchOn\s*\(\s*\)/,
            'switch uses the typed runtime facade'
        );

        for (
            const signalId of
            Object.values(
                EASYCONECT_CONTROLS_SIGNAL_IDS
            )
        ) {
            t.notMatch(
                sketch,
                new RegExp(
                    getEasyConectWireChannel(
                        signalId
                    ).replace(
                        '.',
                        '\\.'
                    )
                ),
                `${signalId} stays outside the pedagogical sketch`
            );
        }

        t.end();
    }
);

tap.test(
    'EasyBlox BT Arduino support files use canonical EasyConect Gamepad channels',
    t => {
        const supportFiles =
            getEasyBloxBtSupportFiles();

        const config =
            supportFiles.find(
                file =>
                    file.name ===
                        'EasyBloxConfig.h'
            );

        const header =
            supportFiles.find(
                file =>
                    file.name ===
                        'EasyBloxBluetooth.h'
            );

        t.ok(config);
        t.ok(header);

        for (
            const signalId of
            Object.values(
                EASYCONECT_GAMEPAD_SIGNAL_IDS
            )
        ) {
            t.match(
                config.content,
                getEasyConectWireChannel(
                    signalId
                ),
                signalId
            );
        }

        t.match(
            header.content,
            /enum class EasyBloxGamepadButton/,
            'runtime exposes a typed GAMEPAD button enum'
        );

        t.match(
            header.content,
            /bool\s+gamepadButtonPressed\s*\(/,
            'runtime exposes the GAMEPAD Boolean facade'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Arduino support files expose canonical EasyConect Controls channels and facade',
    t => {
        const supportFiles =
            getEasyBloxBtSupportFiles();

        const config =
            supportFiles.find(
                file =>
                    file.name ===
                        'EasyBloxConfig.h'
            );

        const header =
            supportFiles.find(
                file =>
                    file.name ===
                        'EasyBloxBluetooth.h'
            );

        t.ok(config);
        t.ok(header);

        for (
            const signalId of
            Object.values(
                EASYCONECT_CONTROLS_SIGNAL_IDS
            )
        ) {
            t.match(
                config.content,
                getEasyConectWireChannel(
                    signalId
                ),
                signalId
            );
        }

        t.match(
            header.content,
            /enum class EasyBloxControlsJoystickAxis/,
            'runtime exposes a typed CONTROLES joystick enum'
        );

        t.match(
            header.content,
            /float\s+controlsJoystickPosition\s*\(/,
            'runtime exposes the CONTROLES joystick facade'
        );

        t.match(
            header.content,
            /float\s+controlsSliderValue\s*\(/,
            'runtime exposes the CONTROLES slider facade'
        );

        t.match(
            header.content,
            /bool\s+controlsButtonPressed\s*\(/,
            'runtime exposes the CONTROLES button facade'
        );

        t.match(
            header.content,
            /bool\s+controlsSwitchOn\s*\(/,
            'runtime exposes the CONTROLES switch facade'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Upload generator emits Motors Servo bindings through the typed runtime facade',
    t => {
        const generator =
            new ArduinoUnoGenerator();

        const sketch =
            generator.generate(
                createIr([
                    {
                        type:
                            'EasyBloxBtMotorBinding',
                        signalId:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .MOTOR_1,
                        in1Pin: 7,
                        in2Pin: 8,
                        pwmPin: 5
                    },
                    {
                        type:
                            'EasyBloxBtServoBinding',
                        signalId:
                            EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
                                .SERVO_1,
                        pin: 9
                    }
                ])
            );

        t.match(
            sketch,
            /#include "EasyBlox\.h"/,
            'MOTORES & SERVO requires the EasyBlox runtime'
        );

        const beginCalls =
            sketch.match(
                /EasyBloxBT\.begin\s*\(\s*\)\s*;/g
            ) || [];

        t.equal(
            beginCalls.length,
            1,
            'MOTORES & SERVO starts Bluetooth automatically exactly once'
        );

        const motorBindingPattern =
            /EasyBloxBT\.bindMotor\s*\(\s*EasyBloxRemoteMotor::Motor1\s*,\s*7\s*,\s*8\s*,\s*5\s*\)\s*;/;

        const servoBindingPattern =
            /EasyBloxBT\.bindServo\s*\(\s*EasyBloxRemoteServo::Servo1\s*,\s*9\s*\)\s*;/;

        t.match(
            sketch,
            motorBindingPattern,
            'motor binding uses the typed runtime facade'
        );

        t.match(
            sketch,
            servoBindingPattern,
            'servo binding uses the typed runtime facade'
        );

        const beginIndex =
            sketch.indexOf(
                'EasyBloxBT.begin();'
            );

        const motorBindingIndex =
            sketch.search(
                motorBindingPattern
            );

        const servoBindingIndex =
            sketch.search(
                servoBindingPattern
            );

        t.ok(
            beginIndex >= 0 &&
                motorBindingIndex > beginIndex &&
                servoBindingIndex > beginIndex,
            'Bluetooth starts before remote actuator bindings'
        );

        for (
            const signalId of
            Object.values(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            )
        ) {
            t.notMatch(
                sketch,
                new RegExp(
                    getEasyConectWireChannel(
                        signalId
                    ).replace(
                        '.',
                        '\\.'
                    )
                ),
                `${signalId} stays outside the pedagogical sketch`
            );
        }

        t.notMatch(
            sketch,
            /#include <Servo\.h>/,
            'remote Servo implementation stays encapsulated in the runtime support file'
        );

        t.end();
    }
);

tap.test(
    'EasyBlox BT Arduino support files expose canonical Motors Servo channels and binding facade',
    t => {
        const supportFiles =
            getEasyBloxBtSupportFiles();

        const config =
            supportFiles.find(
                file =>
                    file.name ===
                        'EasyBloxConfig.h'
            );

        const header =
            supportFiles.find(
                file =>
                    file.name ===
                        'EasyBloxBluetooth.h'
            );

        const source =
            supportFiles.find(
                file =>
                    file.name ===
                        'EasyBloxBluetooth.cpp'
            );

        t.ok(config);
        t.ok(header);
        t.ok(source);

        for (
            const signalId of
            Object.values(
                EASYCONECT_MOTORS_SERVO_SIGNAL_IDS
            )
        ) {
            t.match(
                config.content,
                getEasyConectWireChannel(
                    signalId
                ),
                signalId
            );
        }

        t.match(
            header.content,
            /enum class EasyBloxRemoteMotor/,
            'runtime exposes a typed remote motor enum'
        );

        t.match(
            header.content,
            /enum class EasyBloxRemoteServo/,
            'runtime exposes a typed remote Servo enum'
        );

        t.match(
            header.content,
            /void\s+bindMotor\s*\(/,
            'runtime exposes the motor binding facade'
        );

        t.match(
            header.content,
            /void\s+bindServo\s*\(/,
            'runtime exposes the Servo binding facade'
        );

        t.match(
            source.content,
            /void\s+EasyBloxBluetooth::bindMotor\s*\(/,
            'runtime implements motor binding'
        );

        t.match(
            source.content,
            /void\s+EasyBloxBluetooth::bindServo\s*\(/,
            'runtime implements Servo binding'
        );

        t.end();
    }
);
