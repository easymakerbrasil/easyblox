const fs = require('fs');
const path = require('path');
const test = require('tap').test;
const {
    EASYBLOX_BT_INTERNAL_IDENTIFIERS
} = require(
    '../../src/upload/easyblox-bt-arduino-runtime'
);

const sourceDirectory =
    path.resolve(
        __dirname,
        '../../src/upload/arduino-runtime'
    );

const generatedModulePath =
    path.resolve(
        __dirname,
        '../../src/upload/generated/easyblox-arduino-runtime-files.js'
    );

const canonicalSourceNames = [
    'EasyBlox.h',
    'EasyBloxBluetooth.h',
    'EasyBloxBluetooth.cpp'
];

test(
    'EasyBlox Arduino runtime is stored as canonical C++ source files',
    t => {
        for (
            const name
            of canonicalSourceNames
        ) {
            t.equal(
                fs.existsSync(
                    path.join(
                        sourceDirectory,
                        name
                    )
                ),
                true,
                `${name} exists as a canonical Arduino source file`
            );
        }

        t.end();
    }
);

test(
    'EasyBlox Bluetooth exposes a pedagogical C++ facade',
    t => {
        const header =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.h'
                ),
                'utf8'
            );

        t.match(
            header,
            /class\s+EasyBloxBluetooth/,
            'Bluetooth runtime declares the EasyBloxBluetooth facade'
        );

        t.match(
            header,
            /void\s+begin\s*\(\s*\)\s*;/,
            'facade exposes begin without transport arguments'
        );

        t.match(
            header,
            /void\s+sendText\s*\(\s*const String\s*&value\s*\)\s*;/,
            'facade exposes TEXT send without the hidden channel'
        );

        t.match(
            header,
            /void\s+sendNumber\s*\(\s*double\s+value\s*\)\s*;/,
            'facade exposes NUMBER send without the hidden channel'
        );

        t.match(
            header,
            /void\s+waitText\s*\(\s*\)\s*;/,
            'facade exposes TEXT wait without the hidden channel'
        );

        t.match(
            header,
            /void\s+waitNumber\s*\(\s*\)\s*;/,
            'facade exposes NUMBER wait without the hidden channel'
        );

        t.match(
            header,
            /const String\s*&\s*receivedText\s*\(\s*\)\s+const\s*;/,
            'facade exposes the received TEXT reporter'
        );

        t.match(
            header,
            /float\s+receivedNumber\s*\(\s*\)\s+const\s*;/,
            'facade exposes the received NUMBER reporter'
        );

        t.match(
            header,
            /extern\s+EasyBloxBluetooth\s+EasyBloxBT\s*;/,
            'runtime exposes the canonical EasyBloxBT object'
        );

        t.notMatch(
            header,
            /\beasybloxBt[A-Za-z0-9_]*/,
            'public header does not expose low-level Bluetooth symbols'
        );

        t.end();
    }
);

test(
    'EasyBlox Bluetooth runtime answers EBCP liveness PING with PONG without resetting received application data',
    t => {
        const source =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.cpp'
                ),
                'utf8'
            );

        t.match(
            source,
            /constexpr\s+uint8_t\s+EASYBLOX_EBCP_PING\s*=\s*0x83\s*;/,
            'runtime declares the canonical EBCP PING control type'
        );

        t.match(
            source,
            /constexpr\s+uint8_t\s+EASYBLOX_EBCP_PONG\s*=\s*0x84\s*;/,
            'runtime declares the canonical EBCP PONG control type'
        );

        t.match(
            source,
            /void\s+easybloxBtSendPong\s*\(\s*\)\s*\{[\s\S]*?EASYBLOX_EBCP_PONG[\s\S]*?0[\s\S]*?""[\s\S]*?0[\s\S]*?0[\s\S]*?\}/,
            'runtime can send a zero-payload PONG control frame'
        );

        const processStart =
            source.indexOf(
                'void easybloxBtProcessFrame()'
            );

        const processEnd =
            source.indexOf(
                'void easybloxBtPushByte',
                processStart
            );

        const processFrameSource =
            source.slice(
                processStart,
                processEnd
            );

        t.match(
            processFrameSource,
            /if\s*\(\s*type\s*==\s*EASYBLOX_EBCP_PING\s*\)\s*\{\s*easybloxBtSendPong\s*\(\s*\)\s*;\s*return\s*;\s*\}/,
            'PING is answered without resetting TEXT or NUMBER readiness'
        );

        t.match(
            processFrameSource,
            /if\s*\(\s*type\s*==\s*EASYBLOX_EBCP_PONG\s*\)\s*\{\s*return\s*;\s*\}/,
            'incoming PONG is treated as transport-neutral control traffic'
        );

        t.end();
    }
);

test(
    'EasyBlox Bluetooth runtime routes EasyConect Controls before legacy fixed-channel fallbacks',
    t => {
        const source =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.cpp'
                ),
                'utf8'
            );

        const processStart =
            source.indexOf(
                'void easybloxBtProcessFrame()'
            );

        const processEnd =
            source.indexOf(
                'void easybloxBtPushByte',
                processStart
            );

        const processFrameSource =
            source.slice(
                processStart,
                processEnd
            );

        const booleanHandlers =
            processFrameSource.match(
                /if\s*\(\s*type\s*==\s*EASYBLOX_EBCP_TYPE_BOOLEAN\s*\)/g
            ) || [];

        t.equal(
            booleanHandlers.length,
            1,
            'BOOLEAN traffic is routed through one canonical handler'
        );

        const buttonIndex =
            processFrameSource.indexOf(
                'channel == EASYBLOX_CONTROLS_BUTTON_CHANNEL'
            );

        const switchIndex =
            processFrameSource.indexOf(
                'channel == EASYBLOX_CONTROLS_SWITCH_CHANNEL'
            );

        const sliderIndex =
            processFrameSource.indexOf(
                'EASYBLOX_CONTROLS_SLIDER_CHANNEL'
            );

        const legacyChannelGateIndex =
            processFrameSource.indexOf(
                'if (channel != EASYBLOX_BT_CHANNEL)'
            );

        t.ok(
            buttonIndex >= 0,
            'CONTROLES button channel is handled'
        );

        t.ok(
            switchIndex >= 0,
            'CONTROLES switch channel is handled'
        );

        t.ok(
            sliderIndex >= 0,
            'CONTROLES slider channel is handled'
        );

        t.ok(
            legacyChannelGateIndex > buttonIndex &&
                legacyChannelGateIndex > switchIndex &&
                legacyChannelGateIndex > sliderIndex,
            'EasyConect Controls channels are routed before the legacy fixed-channel fallback'
        );

        t.end();
    }
);

test(
    'EasyBlox Arduino delay remains cooperative with Bluetooth liveness',
    t => {
        const publicHeader =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBlox.h'
                ),
                'utf8'
            );

        const source =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.cpp'
                ),
                'utf8'
            );

        t.match(
            publicHeader,
            /void\s+easybloxDelay\s*\(\s*unsigned long\s+milliseconds\s*\)\s*;/,
            'runtime declares the cooperative internal delay'
        );

        t.match(
            publicHeader,
            /#define\s+delay\s+easybloxDelay/,
            'student delay calls are redirected through the cooperative runtime'
        );

        const delayStart =
            source.indexOf(
                'void easybloxDelay('
            );

        const delayEnd =
            source.indexOf(
                'void EasyBloxBluetooth::begin',
                delayStart
            );

        const delaySource =
            source.slice(
                delayStart,
                delayEnd
            );

        t.match(
            delaySource,
            /easybloxBtPoll\s*\(\s*\)\s*;/,
            'cooperative delay continues servicing Bluetooth traffic'
        );

        t.end();
    }
);

test(
    'EasyBlox Bluetooth facade identifiers are reserved from student symbols',
    t => {
        t.equal(
            EASYBLOX_BT_INTERNAL_IDENTIFIERS.includes(
                'EasyBloxBT'
            ),
            true,
            'EasyBloxBT object name is reserved'
        );

        t.equal(
            EASYBLOX_BT_INTERNAL_IDENTIFIERS.includes(
                'EasyBloxBluetooth'
            ),
            true,
            'EasyBloxBluetooth class name is reserved'
        );

        t.end();
    }
);

test(
    'EasyBlox Motors Servo runtime provides signed motor and bounded Servo handlers',
    t => {
        const source =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.cpp'
                ),
                'utf8'
            );

        t.match(
            source,
            /easybloxBtApplyMotorValue\s*\(/,
            'runtime has one canonical remote motor value handler'
        );

        t.match(
            source,
            /easybloxBtApplyServoValue\s*\(/,
            'runtime has one canonical remote Servo value handler'
        );

        t.match(
            source,
            /void\s+easybloxBtApplyMotorValue\s*\([^)]*\)\s*\{[\s\S]*?digitalWrite\s*\(/,
            'remote motor handler controls direction pins'
        );

        t.match(
            source,
            /void\s+easybloxBtApplyMotorValue\s*\([^)]*\)\s*\{[\s\S]*?analogWrite\s*\(/,
            'remote motor handler controls PWM'
        );

        t.match(
            source,
            /void\s+easybloxBtApplyServoValue\s*\([^)]*\)\s*\{[\s\S]*?easybloxBtRemoteServoPulseTicks\s*\[\s*index\s*\]\s*=\s*easybloxBtServoPulseTicks\s*\(/,
            'remote Servo handler writes normalized angles'
        );

        t.end();
    }
);

test(
    'EasyBlox Motors Servo runtime migrates Bluetooth to a Servo-safe Timer1 COMPB transport',
    t => {
        const source =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.cpp'
                ),
                'utf8'
            );

        t.match(
            source,
            /#include\s*<SoftwareSerial\.h>/,
            'motor-only Bluetooth keeps the existing SoftwareSerial path'
        );

        t.notMatch(
            source,
            /#include\s*<Servo\.h>/,
            'remote Servo does not depend on the Arduino Servo library'
        );

        t.match(
            source,
            /easybloxBtConfigureServoTimer1\s*\(/,
            'runtime owns one canonical Timer1 Servo scheduler'
        );

        t.match(
            source,
            /easybloxBtServoPulseTicks\s*\(/,
            'runtime converts Servo angles to Timer1 pulse ticks'
        );

        t.match(
            source,
            /easybloxBtServoSafeTransportActive/,
            'runtime tracks whether the Servo-safe transport is active'
        );

        t.match(
            source,
            /easybloxBtActivateServoSafeTransport\s*\(/,
            'runtime exposes one migration path from SoftwareSerial'
        );

        t.match(
            source,
            /ISR\s*\(\s*INT0_vect\s*\)/,
            'Servo-safe Bluetooth RX starts from INT0 on D2'
        );

        t.match(
            source,
            /ISR\s*\(\s*TIMER1_COMPB_vect\s*\)/,
            'Servo-safe UART sampling uses Timer1 COMPB'
        );

        t.notMatch(
            source,
            /TCCR2[A-B]?|TCNT2|OCR2[A-B]?|TIMSK2/,
            'Servo-safe transport leaves Timer2 untouched'
        );

        t.match(
            source,
            /ISR\s*\(\s*TIMER1_COMPA_vect\s*\)/,
            'runtime owns Timer1 COMPA for Servo pulse scheduling'
        );

        t.match(
            source,
            /easybloxBtHandleServoTimerCompareAInterrupt\s*\(/,
            'Timer1 COMPA delegates to the canonical Servo scheduler'
        );

        t.end();
    }
);

test(
    'EasyBlox Motors Servo channels are routed before the legacy fixed-channel fallback',
    t => {
        const source =
            fs.readFileSync(
                path.join(
                    sourceDirectory,
                    'EasyBloxBluetooth.cpp'
                ),
                'utf8'
            );

        const motorIndex =
            source.indexOf(
                'EASYBLOX_MOTORS_SERVO_MOTOR_1_CHANNEL'
            );

        const servoIndex =
            source.indexOf(
                'EASYBLOX_MOTORS_SERVO_SERVO_1_CHANNEL'
            );

        const legacyChannelGateIndex =
            source.indexOf(
                'if (channel != EASYBLOX_BT_CHANNEL)'
            );

        t.ok(
            motorIndex >= 0,
            'remote motor channel is handled'
        );

        t.ok(
            servoIndex >= 0,
            'remote Servo channel is handled'
        );

        t.ok(
            motorIndex >= 0 &&
                servoIndex >= 0 &&
                legacyChannelGateIndex > motorIndex &&
                legacyChannelGateIndex > servoIndex,
            'Motors Servo channels are consumed before the legacy fallback'
        );

        t.end();
    }
);

test(
    'generated browser runtime mirror matches the canonical C++ sources',
    t => {
        if (
            !fs.existsSync(
                generatedModulePath
            )
        ) {
            t.fail(
                'generated Arduino runtime module exists'
            );

            t.end();
            return;
        }

        delete require.cache[
            require.resolve(
                generatedModulePath
            )
        ];

        const {
            EASYBLOX_ARDUINO_RUNTIME_SOURCES
        } = require(
            generatedModulePath
        );

        for (
            const name
            of canonicalSourceNames
        ) {
            const sourcePath =
                path.join(
                    sourceDirectory,
                    name
                );

            if (
                !fs.existsSync(
                    sourcePath
                )
            ) {
                continue;
            }

            const canonicalSource =
                fs.readFileSync(
                    sourcePath,
                    'utf8'
                )
                    .replace(
                        /\r\n/g,
                        '\n'
                    );

            t.equal(
                EASYBLOX_ARDUINO_RUNTIME_SOURCES[
                    name
                ],
                canonicalSource,
                `${name} browser mirror matches its canonical C++ source`
            );
        }

        t.end();
    }
);
