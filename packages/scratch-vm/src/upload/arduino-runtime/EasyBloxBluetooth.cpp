#include "EasyBloxBluetooth.h"
#include "EasyBloxConfig.h"
#include <SoftwareSerial.h>
#include <avr/interrupt.h>

constexpr uint8_t EASYBLOX_EBCP_MAGIC_0 = 0x45;
constexpr uint8_t EASYBLOX_EBCP_MAGIC_1 = 0x42;
constexpr uint8_t EASYBLOX_EBCP_VERSION = 0x01;
constexpr uint8_t EASYBLOX_EBCP_TYPE_TEXT = 0x01;
constexpr uint8_t EASYBLOX_EBCP_TYPE_NUMBER = 0x02;
constexpr uint8_t EASYBLOX_EBCP_TYPE_BOOLEAN = 0x03;
constexpr uint8_t EASYBLOX_EBCP_ACK = 0x80;
constexpr uint8_t EASYBLOX_EBCP_HELLO = 0x81;
constexpr uint8_t EASYBLOX_EBCP_HELLO_ACK = 0x82;
constexpr uint8_t EASYBLOX_EBCP_PING = 0x83;
constexpr uint8_t EASYBLOX_EBCP_PONG = 0x84;
constexpr uint8_t EASYBLOX_EBCP_MAX_CHANNEL_BYTES = 16;
constexpr uint8_t EASYBLOX_EBCP_MAX_PAYLOAD_BYTES = 32;
constexpr uint8_t EASYBLOX_EBCP_MAX_FRAME_BYTES = 56;
const char EASYBLOX_BT_CHANNEL[] = EASYBLOX_BT_CHANNEL_VALUE;

const char EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL[] =
    EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL_VALUE;
const char EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL[] =
    EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL[] =
    EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL[] =
    EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_SLIDER_CHANNEL[] =
    EASYBLOX_CONTROLS_SLIDER_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_BUTTON_CHANNEL[] =
    EASYBLOX_CONTROLS_BUTTON_CHANNEL_VALUE;
const char EASYBLOX_CONTROLS_SWITCH_CHANNEL[] =
    EASYBLOX_CONTROLS_SWITCH_CHANNEL_VALUE;
const char EASYBLOX_MOTORS_SERVO_MOTOR_1_CHANNEL[] =
    EASYBLOX_MOTORS_SERVO_MOTOR_1_CHANNEL_VALUE;
const char EASYBLOX_MOTORS_SERVO_MOTOR_2_CHANNEL[] =
    EASYBLOX_MOTORS_SERVO_MOTOR_2_CHANNEL_VALUE;
const char EASYBLOX_MOTORS_SERVO_SERVO_1_CHANNEL[] =
    EASYBLOX_MOTORS_SERVO_SERVO_1_CHANNEL_VALUE;
const char EASYBLOX_MOTORS_SERVO_SERVO_2_CHANNEL[] =
    EASYBLOX_MOTORS_SERVO_SERVO_2_CHANNEL_VALUE;
const char EASYBLOX_MOTORS_SERVO_SERVO_3_CHANNEL[] =
    EASYBLOX_MOTORS_SERVO_SERVO_3_CHANNEL_VALUE;
const char EASYBLOX_MOTORS_SERVO_SERVO_4_CHANNEL[] =
    EASYBLOX_MOTORS_SERVO_SERVO_4_CHANNEL_VALUE;

constexpr uint8_t EASYBLOX_GAMEPAD_BUTTON_COUNT = 8;

constexpr uint8_t EASYBLOX_REMOTE_MOTOR_COUNT = 2;
constexpr uint8_t EASYBLOX_REMOTE_SERVO_COUNT = 4;

constexpr uint8_t EASYBLOX_BT_RX_PIN = 2;
constexpr uint8_t EASYBLOX_BT_TX_PIN = 3;
constexpr uint32_t EASYBLOX_BT_BAUD_RATE = 9600;

constexpr uint8_t EASYBLOX_BT_SAFE_BUFFER_SIZE = 64;
constexpr uint8_t EASYBLOX_BT_SAFE_BUFFER_MASK =
    EASYBLOX_BT_SAFE_BUFFER_SIZE - 1;

constexpr uint32_t EASYBLOX_BT_TIMER1_PRESCALER = 8;
constexpr uint32_t EASYBLOX_BT_TIMER1_TICKS_PER_SECOND =
    F_CPU / EASYBLOX_BT_TIMER1_PRESCALER;

constexpr uint16_t EASYBLOX_BT_BIT_TICKS =
    static_cast<uint16_t>(
        (
            EASYBLOX_BT_TIMER1_TICKS_PER_SECOND +
            EASYBLOX_BT_BAUD_RATE / 2
        ) /
        EASYBLOX_BT_BAUD_RATE
    );

constexpr uint16_t EASYBLOX_BT_FIRST_SAMPLE_TICKS =
    static_cast<uint16_t>(
        EASYBLOX_BT_BIT_TICKS +
        EASYBLOX_BT_BIT_TICKS / 2
    );

struct EasyBloxRemoteMotorBinding {
    bool bound;
    uint8_t in1Pin;
    uint8_t in2Pin;
    uint8_t pwmPin;
};

EasyBloxRemoteMotorBinding easybloxBtRemoteMotors[
    EASYBLOX_REMOTE_MOTOR_COUNT
] = {};

constexpr uint16_t EASYBLOX_BT_SERVO_MIN_PULSE_US =
    544;

constexpr uint16_t EASYBLOX_BT_SERVO_MAX_PULSE_US =
    2400;

constexpr uint16_t EASYBLOX_BT_SERVO_TRIM_US =
    2;

constexpr uint16_t EASYBLOX_BT_SERVO_FRAME_TICKS =
    static_cast<uint16_t>(
        EASYBLOX_BT_TIMER1_TICKS_PER_SECOND /
        50UL
    );

constexpr uint16_t EASYBLOX_BT_TIMER1_TICKS_PER_MICROSECOND =
    static_cast<uint16_t>(
        EASYBLOX_BT_TIMER1_TICKS_PER_SECOND /
        1000000UL
    );

volatile bool easybloxBtRemoteServoBound[
    EASYBLOX_REMOTE_SERVO_COUNT
] = {};

volatile uint8_t easybloxBtRemoteServoPins[
    EASYBLOX_REMOTE_SERVO_COUNT
] = {};

volatile uint16_t easybloxBtRemoteServoPulseTicks[
    EASYBLOX_REMOTE_SERVO_COUNT
] = {};

bool easybloxBtServoTimer1Initialized =
    false;

volatile int8_t easybloxBtActiveServoSlotIndex =
    -1;

volatile uint16_t easybloxBtServoFrameStartedAt =
    0;

SoftwareSerial easybloxBtSerial(
    EASYBLOX_BT_RX_PIN,
    EASYBLOX_BT_TX_PIN
);

bool easybloxBtSerialInitialized = false;

volatile bool easybloxBtServoSafeTransportActive = false;

volatile bool easybloxBtSafeRxActive = false;
volatile uint8_t easybloxBtSafeRxBitIndex = 0;
volatile uint8_t easybloxBtSafeRxByte = 0;
volatile uint16_t easybloxBtSafeRxNextAt = 0;

volatile uint8_t easybloxBtSafeRxBuffer[
    EASYBLOX_BT_SAFE_BUFFER_SIZE
] = {};

volatile uint8_t easybloxBtSafeRxHead = 0;
volatile uint8_t easybloxBtSafeRxTail = 0;

volatile bool easybloxBtSafeTxActive = false;
volatile uint8_t easybloxBtSafeTxBitIndex = 0;
volatile uint8_t easybloxBtSafeTxByte = 0;
volatile uint16_t easybloxBtSafeTxNextAt = 0;

volatile uint8_t easybloxBtSafeTxBuffer[
    EASYBLOX_BT_SAFE_BUFFER_SIZE
] = {};

volatile uint8_t easybloxBtSafeTxHead = 0;
volatile uint8_t easybloxBtSafeTxTail = 0;

extern void easybloxUserLoop();

uint8_t easybloxBtNextSafeBufferIndex(
    uint8_t index
) {
    return static_cast<uint8_t>(
        (index + 1) &
        EASYBLOX_BT_SAFE_BUFFER_MASK
    );
}

bool easybloxBtTimerReached(
    uint16_t now,
    uint16_t target
) {
    return static_cast<int16_t>(
        now - target
    ) >= 0;
}

bool easybloxBtHasBoundServo() {
    for (
        uint8_t index = 0;
        index < EASYBLOX_REMOTE_SERVO_COUNT;
        ++index
    ) {
        if (
            easybloxBtRemoteServoBound[
                index
            ]
        ) {
            return true;
        }
    }

    return false;
}

int8_t easybloxBtFindNextBoundServoSlot(
    uint8_t startIndex
) {
    for (
        uint8_t index = startIndex;
        index < EASYBLOX_REMOTE_SERVO_COUNT;
        ++index
    ) {
        if (
            easybloxBtRemoteServoBound[
                index
            ]
        ) {
            return static_cast<int8_t>(
                index
            );
        }
    }

    return -1;
}

void easybloxBtWriteServoPinFast(
    uint8_t pin,
    bool high
) {
    if (pin == 5) {
        if (high) {
            PORTD |=
                _BV(PD5);
        } else {
            PORTD &=
                static_cast<uint8_t>(
                    ~_BV(PD5)
                );
        }

        return;
    }

    if (pin == 9) {
        if (high) {
            PORTB |=
                _BV(PB1);
        } else {
            PORTB &=
                static_cast<uint8_t>(
                    ~_BV(PB1)
                );
        }

        return;
    }

    if (pin == 10) {
        if (high) {
            PORTB |=
                _BV(PB2);
        } else {
            PORTB &=
                static_cast<uint8_t>(
                    ~_BV(PB2)
                );
        }

        return;
    }

    if (pin == 11) {
        if (high) {
            PORTB |=
                _BV(PB3);
        } else {
            PORTB &=
                static_cast<uint8_t>(
                    ~_BV(PB3)
                );
        }
    }
}

void easybloxBtConfigureServoTimer1() {
    if (
        easybloxBtServoTimer1Initialized
    ) {
        return;
    }

    const uint8_t oldSreg =
        SREG;

    cli();

    TCCR1A = 0;
    TCCR1B = 0;

    TIMSK1 = 0;

    TCNT1 = 0;

    easybloxBtActiveServoSlotIndex =
        -1;

    easybloxBtServoFrameStartedAt =
        0;

    OCR1A = 100;
    OCR1B = 0;

    TIFR1 =
        _BV(OCF1A) |
        _BV(OCF1B) |
        _BV(TOV1);

    TCCR1B =
        _BV(CS11);

    TIMSK1 |=
        _BV(OCIE1A);

    easybloxBtServoTimer1Initialized =
        true;

    SREG =
        oldSreg;
}

uint16_t easybloxBtServoPulseTicks(
    uint8_t angle
) {
    const uint16_t pulseUs =
        static_cast<uint16_t>(
            map(
                angle,
                0,
                180,
                EASYBLOX_BT_SERVO_MIN_PULSE_US,
                EASYBLOX_BT_SERVO_MAX_PULSE_US
            )
        );

    const uint16_t trimmedPulseUs =
        pulseUs >
            EASYBLOX_BT_SERVO_TRIM_US ?
            static_cast<uint16_t>(
                pulseUs -
                EASYBLOX_BT_SERVO_TRIM_US
            ) :
            pulseUs;

    return static_cast<uint16_t>(
        trimmedPulseUs *
        EASYBLOX_BT_TIMER1_TICKS_PER_MICROSECOND
    );
}

void easybloxBtSetServoPulse(
    uint8_t servoIndex,
    uint8_t angle
) {
    const uint16_t pulseTicks =
        easybloxBtServoPulseTicks(
            angle
        );

    const uint8_t oldSreg =
        SREG;

    cli();

    easybloxBtRemoteServoPulseTicks[
        servoIndex
    ] =
        pulseTicks;

    SREG =
        oldSreg;
}

void easybloxBtHandleServoTimerCompareAInterrupt() {
    const uint16_t now =
        TCNT1;

    if (
        easybloxBtActiveServoSlotIndex >=
        0
    ) {
        const uint8_t finishedSlot =
            static_cast<uint8_t>(
                easybloxBtActiveServoSlotIndex
            );

        easybloxBtWriteServoPinFast(
            easybloxBtRemoteServoPins[
                finishedSlot
            ],
            false
        );

        const int8_t nextSlot =
            easybloxBtFindNextBoundServoSlot(
                static_cast<uint8_t>(
                    finishedSlot + 1
                )
            );

        if (nextSlot >= 0) {
            easybloxBtActiveServoSlotIndex =
                nextSlot;

            const uint8_t slot =
                static_cast<uint8_t>(
                    nextSlot
                );

            easybloxBtWriteServoPinFast(
                easybloxBtRemoteServoPins[
                    slot
                ],
                true
            );

            OCR1A =
                static_cast<uint16_t>(
                    now +
                    easybloxBtRemoteServoPulseTicks[
                        slot
                    ]
                );

            return;
        }

        easybloxBtActiveServoSlotIndex =
            -1;

        const uint16_t elapsed =
            static_cast<uint16_t>(
                now -
                easybloxBtServoFrameStartedAt
            );

        const uint16_t remaining =
            elapsed <
                EASYBLOX_BT_SERVO_FRAME_TICKS ?
                static_cast<uint16_t>(
                    EASYBLOX_BT_SERVO_FRAME_TICKS -
                    elapsed
                ) :
                1;

        OCR1A =
            static_cast<uint16_t>(
                now +
                remaining
            );

        return;
    }

    easybloxBtServoFrameStartedAt =
        now;

    const int8_t firstSlot =
        easybloxBtFindNextBoundServoSlot(
            0
        );

    if (firstSlot < 0) {
        TIMSK1 &=
            static_cast<uint8_t>(
                ~_BV(OCIE1A)
            );

        return;
    }

    easybloxBtActiveServoSlotIndex =
        firstSlot;

    const uint8_t slot =
        static_cast<uint8_t>(
            firstSlot
        );

    easybloxBtWriteServoPinFast(
        easybloxBtRemoteServoPins[
            slot
        ],
        true
    );

    OCR1A =
        static_cast<uint16_t>(
            now +
            easybloxBtRemoteServoPulseTicks[
                slot
            ]
        );
}

void easybloxBtScheduleCompareBUnsafe() {
    bool hasNext = false;
    uint16_t nextAt = 0;

    if (easybloxBtSafeRxActive) {
        nextAt =
            easybloxBtSafeRxNextAt;
        hasNext = true;
    }

    if (
        easybloxBtSafeTxActive &&
        (
            !hasNext ||
            static_cast<int16_t>(
                easybloxBtSafeTxNextAt -
                nextAt
            ) < 0
        )
    ) {
        nextAt =
            easybloxBtSafeTxNextAt;
        hasNext = true;
    }

    if (!hasNext) {
        TIMSK1 &=
            static_cast<uint8_t>(
                ~_BV(OCIE1B)
            );
        return;
    }

    OCR1B = nextAt;
    TIFR1 = _BV(OCF1B);
    TIMSK1 |= _BV(OCIE1B);
}

void easybloxBtStartNextSafeTxUnsafe(
    uint16_t now
) {
    if (
        easybloxBtSafeTxHead ==
        easybloxBtSafeTxTail
    ) {
        easybloxBtSafeTxActive =
            false;

        PORTD |= _BV(PD3);
        return;
    }

    easybloxBtSafeTxByte =
        easybloxBtSafeTxBuffer[
            easybloxBtSafeTxTail
        ];

    easybloxBtSafeTxTail =
        easybloxBtNextSafeBufferIndex(
            easybloxBtSafeTxTail
        );

    easybloxBtSafeTxBitIndex = 0;
    easybloxBtSafeTxActive = true;

    PORTD &=
        static_cast<uint8_t>(
            ~_BV(PD3)
        );

    easybloxBtSafeTxNextAt =
        static_cast<uint16_t>(
            now +
            EASYBLOX_BT_BIT_TICKS
        );
}

bool easybloxBtEnqueueServoSafeTx(
    uint8_t value
) {
    const uint8_t oldSreg =
        SREG;

    cli();

    const uint8_t nextHead =
        easybloxBtNextSafeBufferIndex(
            easybloxBtSafeTxHead
        );

    if (
        nextHead ==
        easybloxBtSafeTxTail
    ) {
        SREG =
            oldSreg;
        return false;
    }

    easybloxBtSafeTxBuffer[
        easybloxBtSafeTxHead
    ] = value;

    easybloxBtSafeTxHead =
        nextHead;

    if (!easybloxBtSafeTxActive) {
        easybloxBtStartNextSafeTxUnsafe(
            TCNT1
        );

        easybloxBtScheduleCompareBUnsafe();
    }

    SREG =
        oldSreg;

    return true;
}

bool easybloxBtDequeueServoSafeRx(
    uint8_t &value
) {
    const uint8_t oldSreg =
        SREG;

    cli();

    if (
        easybloxBtSafeRxHead ==
        easybloxBtSafeRxTail
    ) {
        SREG =
            oldSreg;
        return false;
    }

    value =
        easybloxBtSafeRxBuffer[
            easybloxBtSafeRxTail
        ];

    easybloxBtSafeRxTail =
        easybloxBtNextSafeBufferIndex(
            easybloxBtSafeRxTail
        );

    SREG =
        oldSreg;

    return true;
}

bool easybloxBtServoTimer1Active() {
    return
        easybloxBtServoTimer1Initialized;
}

void easybloxBtActivateServoSafeTransport() {
    if (
        easybloxBtServoSafeTransportActive ||
        !easybloxBtServoTimer1Active()
    ) {
        return;
    }

    if (easybloxBtSerialInitialized) {
        easybloxBtSerial.end();
    }

    pinMode(
        EASYBLOX_BT_RX_PIN,
        INPUT_PULLUP
    );

    pinMode(
        EASYBLOX_BT_TX_PIN,
        OUTPUT
    );

    digitalWrite(
        EASYBLOX_BT_TX_PIN,
        HIGH
    );

    const uint8_t oldSreg =
        SREG;

    cli();

    easybloxBtSafeRxActive = false;
    easybloxBtSafeRxBitIndex = 0;
    easybloxBtSafeRxByte = 0;

    easybloxBtSafeRxHead = 0;
    easybloxBtSafeRxTail = 0;

    easybloxBtSafeTxActive = false;
    easybloxBtSafeTxBitIndex = 0;
    easybloxBtSafeTxByte = 0;

    easybloxBtSafeTxHead = 0;
    easybloxBtSafeTxTail = 0;

    TIMSK1 &=
        static_cast<uint8_t>(
            ~_BV(OCIE1B)
        );

    EICRA &=
        static_cast<uint8_t>(
            ~(
                _BV(ISC01) |
                _BV(ISC00)
            )
        );

    EICRA |=
        _BV(ISC01);

    EIFR =
        _BV(INTF0);

    easybloxBtServoSafeTransportActive =
        true;

    EIMSK |=
        _BV(INT0);

    SREG =
        oldSreg;
}

void easybloxBtEnsureServoSafeTransport() {
    if (
        !easybloxBtServoSafeTransportActive &&
        easybloxBtServoTimer1Active()
    ) {
        easybloxBtActivateServoSafeTransport();
    }
}

void easybloxBtHandleRxStartInterrupt() {
    if (
        !easybloxBtServoSafeTransportActive ||
        easybloxBtSafeRxActive
    ) {
        return;
    }

    EIMSK &=
        static_cast<uint8_t>(
            ~_BV(INT0)
        );

    easybloxBtSafeRxActive = true;
    easybloxBtSafeRxBitIndex = 0;
    easybloxBtSafeRxByte = 0;

    easybloxBtSafeRxNextAt =
        static_cast<uint16_t>(
            TCNT1 +
            EASYBLOX_BT_FIRST_SAMPLE_TICKS
        );

    easybloxBtScheduleCompareBUnsafe();
}

void easybloxBtHandleTimer1CompareBInterrupt() {
    const uint16_t now =
        TCNT1;

    if (
        easybloxBtSafeRxActive &&
        easybloxBtTimerReached(
            now,
            easybloxBtSafeRxNextAt
        )
    ) {
        if (
            easybloxBtSafeRxBitIndex <
            8
        ) {
            if (
                PIND &
                _BV(PD2)
            ) {
                easybloxBtSafeRxByte |=
                    static_cast<uint8_t>(
                        1U <<
                        easybloxBtSafeRxBitIndex
                    );
            }

            ++easybloxBtSafeRxBitIndex;

            easybloxBtSafeRxNextAt =
                static_cast<uint16_t>(
                    easybloxBtSafeRxNextAt +
                    EASYBLOX_BT_BIT_TICKS
                );
        } else {
            if (
                PIND &
                _BV(PD2)
            ) {
                const uint8_t nextHead =
                    easybloxBtNextSafeBufferIndex(
                        easybloxBtSafeRxHead
                    );

                if (
                    nextHead !=
                    easybloxBtSafeRxTail
                ) {
                    easybloxBtSafeRxBuffer[
                        easybloxBtSafeRxHead
                    ] =
                        easybloxBtSafeRxByte;

                    easybloxBtSafeRxHead =
                        nextHead;
                }
            }

            easybloxBtSafeRxActive =
                false;

            EIFR =
                _BV(INTF0);

            EIMSK |=
                _BV(INT0);
        }
    }

    if (
        easybloxBtSafeTxActive &&
        easybloxBtTimerReached(
            now,
            easybloxBtSafeTxNextAt
        )
    ) {
        if (
            easybloxBtSafeTxBitIndex <
            8
        ) {
            if (
                easybloxBtSafeTxByte &
                static_cast<uint8_t>(
                    1U <<
                    easybloxBtSafeTxBitIndex
                )
            ) {
                PORTD |=
                    _BV(PD3);
            } else {
                PORTD &=
                    static_cast<uint8_t>(
                        ~_BV(PD3)
                    );
            }

            ++easybloxBtSafeTxBitIndex;

            easybloxBtSafeTxNextAt =
                static_cast<uint16_t>(
                    easybloxBtSafeTxNextAt +
                    EASYBLOX_BT_BIT_TICKS
                );
        } else if (
            easybloxBtSafeTxBitIndex ==
            8
        ) {
            PORTD |=
                _BV(PD3);

            ++easybloxBtSafeTxBitIndex;

            easybloxBtSafeTxNextAt =
                static_cast<uint16_t>(
                    easybloxBtSafeTxNextAt +
                    EASYBLOX_BT_BIT_TICKS
                );
        } else {
            easybloxBtStartNextSafeTxUnsafe(
                now
            );
        }
    }

    easybloxBtScheduleCompareBUnsafe();
}

void easybloxBtWriteByte(
    uint8_t value
) {
    easybloxBtEnsureServoSafeTransport();

    if (
        easybloxBtServoSafeTransportActive
    ) {
        while (
            !easybloxBtEnqueueServoSafeTx(
                value
            )
        ) {
            // Timer1 COMPB drains the queue.
        }

        return;
    }

    easybloxBtSerial.write(
        value
    );
}

void easybloxBtBegin() {
    easybloxBtEnsureServoSafeTransport();

    if (
        easybloxBtServoSafeTransportActive
    ) {
        return;
    }

    easybloxBtSerial.begin(
        EASYBLOX_BT_BAUD_RATE
    );

    easybloxBtSerial.listen();

    easybloxBtSerialInitialized =
        true;

    easybloxBtEnsureServoSafeTransport();
}

uint8_t easybloxBtNextSequence = 1;
uint8_t easybloxBtLastReceivedSequence = 0;
String easybloxBtReceivedText = "";
float easybloxBtReceivedNumber = 0.0f;
bool easybloxBtTextReady = false;
bool easybloxBtNumberReady = false;

bool easybloxBtGamepadState[
    EASYBLOX_GAMEPAD_BUTTON_COUNT
] = {};


float easybloxBtControlsJoystickX = 0.0f;
float easybloxBtControlsJoystickY = 0.0f;
float easybloxBtControlsSlider = 0.0f;
bool easybloxBtControlsButton = false;
bool easybloxBtControlsSwitch = false;

uint8_t easybloxBtRxBuffer[EASYBLOX_EBCP_MAX_FRAME_BYTES] = {};
uint8_t easybloxBtRxLength = 0;

uint8_t easybloxBtTakeSequence() {
    const uint8_t sequence = easybloxBtNextSequence;

    ++easybloxBtNextSequence;

    if (easybloxBtNextSequence == 0) {
        easybloxBtNextSequence = 1;
    }

    return sequence;
}

void easybloxBtWriteChecksummed(
    uint8_t value,
    uint8_t &checksum
) {
    easybloxBtWriteByte(
        value
    );

    checksum ^= value;
}

void easybloxBtSendFrame(
    uint8_t type,
    uint8_t sequence,
    const String &channel,
    const uint8_t *payload,
    uint8_t payloadLength
) {
    uint8_t channelLength = static_cast<uint8_t>(channel.length());

    if (channelLength > EASYBLOX_EBCP_MAX_CHANNEL_BYTES) {
        channelLength = EASYBLOX_EBCP_MAX_CHANNEL_BYTES;
    }

    if (payloadLength > EASYBLOX_EBCP_MAX_PAYLOAD_BYTES) {
        payloadLength = EASYBLOX_EBCP_MAX_PAYLOAD_BYTES;
    }

    uint8_t checksum = 0;

    easybloxBtWriteByte(
        EASYBLOX_EBCP_MAGIC_0
    );

    easybloxBtWriteByte(
        EASYBLOX_EBCP_MAGIC_1
    );

    easybloxBtWriteChecksummed(EASYBLOX_EBCP_VERSION, checksum);
    easybloxBtWriteChecksummed(type, checksum);
    easybloxBtWriteChecksummed(sequence, checksum);
    easybloxBtWriteChecksummed(channelLength, checksum);
    easybloxBtWriteChecksummed(payloadLength, checksum);

    for (uint8_t index = 0; index < channelLength; ++index) {
        easybloxBtWriteChecksummed(
            static_cast<uint8_t>(channel[index]),
            checksum
        );
    }

    for (uint8_t index = 0; index < payloadLength; ++index) {
        easybloxBtWriteChecksummed(payload[index], checksum);
    }

    easybloxBtWriteByte(
        checksum
    );
}

void easybloxBtSendText(const String &channel, const String &value) {
    uint8_t payloadLength = static_cast<uint8_t>(value.length());

    if (payloadLength > EASYBLOX_EBCP_MAX_PAYLOAD_BYTES) {
        payloadLength = EASYBLOX_EBCP_MAX_PAYLOAD_BYTES;
    }

    uint8_t payload[EASYBLOX_EBCP_MAX_PAYLOAD_BYTES] = {};

    for (uint8_t index = 0; index < payloadLength; ++index) {
        payload[index] = static_cast<uint8_t>(value[index]);
    }

    easybloxBtSendFrame(
        EASYBLOX_EBCP_TYPE_TEXT,
        easybloxBtTakeSequence(),
        channel,
        payload,
        payloadLength
    );
}

void easybloxBtSendNumber(const String &channel, double value) {
    union {
        float number;
        uint8_t bytes[4];
    } payload;

    payload.number = static_cast<float>(value);

    easybloxBtSendFrame(
        EASYBLOX_EBCP_TYPE_NUMBER,
        easybloxBtTakeSequence(),
        channel,
        payload.bytes,
        4
    );
}

void easybloxBtSendAck(uint8_t acknowledgedSequence) {
    const uint8_t payload[] = {
        acknowledgedSequence
    };

    easybloxBtSendFrame(
        EASYBLOX_EBCP_ACK,
        0,
        "",
        payload,
        1
    );
}

void easybloxBtSendHelloAck() {
    easybloxBtSendFrame(
        EASYBLOX_EBCP_HELLO_ACK,
        0,
        "",
        0,
        0
    );
}

void easybloxBtSendPong() {
    easybloxBtSendFrame(
        EASYBLOX_EBCP_PONG,
        0,
        "",
        0,
        0
    );
}

void easybloxBtResetReceive(uint8_t possibleMagic = 0) {
    easybloxBtRxLength = 0;

    if (possibleMagic == EASYBLOX_EBCP_MAGIC_0) {
        easybloxBtRxBuffer[0] = possibleMagic;
        easybloxBtRxLength = 1;
    }
}

void easybloxBtResetGamepadState() {
    for (
        uint8_t index = 0;
        index < EASYBLOX_GAMEPAD_BUTTON_COUNT;
        ++index
    ) {
        easybloxBtGamepadState[index] = false;
    }
}

void easybloxBtResetControlsState() {
    easybloxBtControlsJoystickX = 0.0f;
    easybloxBtControlsJoystickY = 0.0f;
    easybloxBtControlsSlider = 0.0f;
    easybloxBtControlsButton = false;
    easybloxBtControlsSwitch = false;
}

int8_t easybloxBtGamepadIndexForChannel(
    const String &channel
) {
    if (channel == EASYBLOX_GAMEPAD_DPAD_UP_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadUp
        );
    }

    if (channel == EASYBLOX_GAMEPAD_DPAD_DOWN_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadDown
        );
    }

    if (channel == EASYBLOX_GAMEPAD_DPAD_LEFT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadLeft
        );
    }

    if (channel == EASYBLOX_GAMEPAD_DPAD_RIGHT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::DpadRight
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_TOP_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionTop
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_LEFT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionLeft
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_BOTTOM_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionBottom
        );
    }

    if (channel == EASYBLOX_GAMEPAD_ACTION_RIGHT_CHANNEL) {
        return static_cast<int8_t>(
            EasyBloxGamepadButton::ActionRight
        );
    }

    return -1;
}

void easybloxBtApplyMotorValue(
    uint8_t motorIndex,
    float value
) {
    if (
        motorIndex >=
            EASYBLOX_REMOTE_MOTOR_COUNT ||
        !easybloxBtRemoteMotors[
            motorIndex
        ].bound ||
        !isfinite(value)
    ) {
        return;
    }

    int speedPercent =
        static_cast<int>(
            round(value)
        );

    if (speedPercent < -100) {
        speedPercent = -100;
    }

    if (speedPercent > 100) {
        speedPercent = 100;
    }

    const bool reverse =
        speedPercent < 0;

    const uint8_t speed =
        static_cast<uint8_t>(
            reverse ?
                -speedPercent :
                speedPercent
        );

    const uint8_t pwm =
        static_cast<uint8_t>(
            (
                static_cast<uint16_t>(
                    speed
                ) *
                255U +
                50U
            ) /
            100U
        );

    const EasyBloxRemoteMotorBinding &binding =
        easybloxBtRemoteMotors[
            motorIndex
        ];

    digitalWrite(
        binding.in1Pin,
        reverse ?
            LOW :
            HIGH
    );

    digitalWrite(
        binding.in2Pin,
        reverse ?
            HIGH :
            LOW
    );

    analogWrite(
        binding.pwmPin,
        pwm
    );
}

void easybloxBtApplyServoValue(
    uint8_t servoIndex,
    float value
) {
    if (
        servoIndex >=
            EASYBLOX_REMOTE_SERVO_COUNT ||
        !easybloxBtRemoteServoBound[
            servoIndex
        ] ||
        !isfinite(value)
    ) {
        return;
    }

    int angle =
        static_cast<int>(
            round(value)
        );

    if (angle < 0) {
        angle = 0;
    }

    if (angle > 180) {
        angle = 180;
    }

    easybloxBtSetServoPulse(
        servoIndex,
        static_cast<uint8_t>(
            angle
        )
    );
}

void easybloxBtProcessFrame() {
    if (easybloxBtRxLength < 8) {
        return;
    }

    if (easybloxBtRxBuffer[2] != EASYBLOX_EBCP_VERSION) {
        return;
    }

    const uint8_t type = easybloxBtRxBuffer[3];
    const uint8_t sequence = easybloxBtRxBuffer[4];
    const uint8_t channelLength = easybloxBtRxBuffer[5];
    const uint8_t payloadLength = easybloxBtRxBuffer[6];
    const uint8_t checksumIndex =
        static_cast<uint8_t>(7 + channelLength + payloadLength);

    uint8_t checksum = 0;

    for (uint8_t index = 2; index < checksumIndex; ++index) {
        checksum ^= easybloxBtRxBuffer[index];
    }

    if (checksum != easybloxBtRxBuffer[checksumIndex]) {
        return;
    }

    if (type == EASYBLOX_EBCP_PING) {
        easybloxBtSendPong();
        return;
    }

    if (type == EASYBLOX_EBCP_PONG) {
        return;
    }

    if (type == EASYBLOX_EBCP_HELLO) {
        easybloxBtLastReceivedSequence = 0;
        easybloxBtTextReady = false;
        easybloxBtNumberReady = false;
        easybloxBtResetGamepadState();
        easybloxBtResetControlsState();
        easybloxBtSendHelloAck();
        return;
    }

    if (type == EASYBLOX_EBCP_HELLO_ACK) {
        easybloxBtLastReceivedSequence = 0;
        easybloxBtTextReady = false;
        easybloxBtNumberReady = false;
        return;
    }

    if (type == EASYBLOX_EBCP_ACK) {
        return;
    }

    if (
        type != EASYBLOX_EBCP_TYPE_TEXT &&
        type != EASYBLOX_EBCP_TYPE_NUMBER &&
        type != EASYBLOX_EBCP_TYPE_BOOLEAN
    ) {
        return;
    }

    if (sequence == 0) {
        return;
    }

    if (
        type == EASYBLOX_EBCP_TYPE_NUMBER &&
        payloadLength != 4
    ) {
        return;
    }

    if (
        type == EASYBLOX_EBCP_TYPE_BOOLEAN &&
        payloadLength != 1
    ) {
        return;
    }

    const uint8_t payloadOffset =
        static_cast<uint8_t>(
            7 + channelLength
        );

    if (
        type == EASYBLOX_EBCP_TYPE_BOOLEAN &&
        easybloxBtRxBuffer[payloadOffset] > 1
    ) {
        return;
    }

    if (sequence == easybloxBtLastReceivedSequence) {
        easybloxBtSendAck(sequence);
        return;
    }

    easybloxBtLastReceivedSequence = sequence;
    easybloxBtSendAck(sequence);

    String channel;
    channel.reserve(channelLength);

    for (uint8_t index = 0; index < channelLength; ++index) {
        channel += static_cast<char>(
            easybloxBtRxBuffer[7 + index]
        );
    }

    if (type == EASYBLOX_EBCP_TYPE_BOOLEAN) {
        const bool value =
            easybloxBtRxBuffer[
                payloadOffset
            ] == 1;

        const int8_t gamepadIndex =
            easybloxBtGamepadIndexForChannel(
                channel
            );

        if (gamepadIndex >= 0) {
            easybloxBtGamepadState[
                static_cast<uint8_t>(
                    gamepadIndex
                )
            ] = value;

            return;
        }

        if (channel == EASYBLOX_CONTROLS_BUTTON_CHANNEL) {
            easybloxBtControlsButton = value;
            return;
        }

        if (channel == EASYBLOX_CONTROLS_SWITCH_CHANNEL) {
            easybloxBtControlsSwitch = value;
            return;
        }

        return;
    }

    if (type == EASYBLOX_EBCP_TYPE_NUMBER) {
        union {
            float number;
            uint8_t bytes[4];
        } value;

        for (uint8_t index = 0; index < 4; ++index) {
            value.bytes[index] =
                easybloxBtRxBuffer[payloadOffset + index];
        }

        if (
            channel ==
            EASYBLOX_CONTROLS_JOYSTICK_X_CHANNEL
        ) {
            easybloxBtControlsJoystickX =
                value.number;
            return;
        }

        if (
            channel ==
            EASYBLOX_CONTROLS_JOYSTICK_Y_CHANNEL
        ) {
            easybloxBtControlsJoystickY =
                value.number;
            return;
        }

        if (
            channel ==
            EASYBLOX_CONTROLS_SLIDER_CHANNEL
        ) {
            easybloxBtControlsSlider =
                value.number;
            return;
        }

        if (
            channel ==
            EASYBLOX_MOTORS_SERVO_MOTOR_1_CHANNEL
        ) {
            easybloxBtApplyMotorValue(
                0,
                value.number
            );
            return;
        }

        if (
            channel ==
            EASYBLOX_MOTORS_SERVO_MOTOR_2_CHANNEL
        ) {
            easybloxBtApplyMotorValue(
                1,
                value.number
            );
            return;
        }

        if (
            channel ==
            EASYBLOX_MOTORS_SERVO_SERVO_1_CHANNEL
        ) {
            easybloxBtApplyServoValue(
                0,
                value.number
            );
            return;
        }

        if (
            channel ==
            EASYBLOX_MOTORS_SERVO_SERVO_2_CHANNEL
        ) {
            easybloxBtApplyServoValue(
                1,
                value.number
            );
            return;
        }

        if (
            channel ==
            EASYBLOX_MOTORS_SERVO_SERVO_3_CHANNEL
        ) {
            easybloxBtApplyServoValue(
                2,
                value.number
            );
            return;
        }

        if (
            channel ==
            EASYBLOX_MOTORS_SERVO_SERVO_4_CHANNEL
        ) {
            easybloxBtApplyServoValue(
                3,
                value.number
            );
            return;
        }

        if (channel != EASYBLOX_BT_CHANNEL) {
            return;
        }

        easybloxBtReceivedNumber = value.number;
        easybloxBtNumberReady = true;
        return;
    }

    if (channel != EASYBLOX_BT_CHANNEL) {
        return;
    }

    if (type == EASYBLOX_EBCP_TYPE_TEXT) {
        String value;
        value.reserve(payloadLength);

        for (uint8_t index = 0; index < payloadLength; ++index) {
            value += static_cast<char>(
                easybloxBtRxBuffer[payloadOffset + index]
            );
        }

        easybloxBtReceivedText = value;
        easybloxBtTextReady = true;
    }
}

void easybloxBtPushByte(uint8_t value) {
    if (easybloxBtRxLength == 0) {
        if (value == EASYBLOX_EBCP_MAGIC_0) {
            easybloxBtRxBuffer[0] = value;
            easybloxBtRxLength = 1;
        }

        return;
    }

    if (easybloxBtRxLength == 1) {
        if (value == EASYBLOX_EBCP_MAGIC_1) {
            easybloxBtRxBuffer[1] = value;
            easybloxBtRxLength = 2;
        } else if (value != EASYBLOX_EBCP_MAGIC_0) {
            easybloxBtRxLength = 0;
        }

        return;
    }

    if (easybloxBtRxLength >= EASYBLOX_EBCP_MAX_FRAME_BYTES) {
        easybloxBtResetReceive(value);
        return;
    }

    easybloxBtRxBuffer[easybloxBtRxLength++] = value;

    if (easybloxBtRxLength < 7) {
        return;
    }

    const uint8_t channelLength = easybloxBtRxBuffer[5];
    const uint8_t payloadLength = easybloxBtRxBuffer[6];

    if (
        channelLength > EASYBLOX_EBCP_MAX_CHANNEL_BYTES ||
        payloadLength > EASYBLOX_EBCP_MAX_PAYLOAD_BYTES
    ) {
        easybloxBtResetReceive(value);
        return;
    }

    const uint8_t expectedLength =
        static_cast<uint8_t>(8 + channelLength + payloadLength);

    if (easybloxBtRxLength == expectedLength) {
        easybloxBtProcessFrame();
        easybloxBtResetReceive();
    }
}

void easybloxBtPoll() {
    easybloxBtEnsureServoSafeTransport();

    if (
        easybloxBtServoSafeTransportActive
    ) {
        uint8_t value = 0;

        while (
            easybloxBtDequeueServoSafeRx(
                value
            )
        ) {
            easybloxBtPushByte(
                value
            );
        }

        return;
    }

    while (
        easybloxBtSerial.available() >
        0
    ) {
        const int value =
            easybloxBtSerial.read();

        if (value >= 0) {
            easybloxBtPushByte(
                static_cast<uint8_t>(
                    value
                )
            );
        }
    }
}

void easybloxDelay(unsigned long milliseconds) {
    const unsigned long startedAt =
        millis();

    while (
        static_cast<unsigned long>(
            millis() - startedAt
        ) < milliseconds
    ) {
        easybloxBtPoll();
        delay(1);
    }

    easybloxBtPoll();
}

void loop() {
    easybloxBtPoll();
    easybloxUserLoop();
}

void easybloxBtWaitText(const String &channel) {
    (void)channel;

    while (!easybloxBtTextReady) {
        easybloxBtPoll();
    }

    easybloxBtTextReady = false;
}

void easybloxBtWaitNumber(const String &channel) {
    (void)channel;

    while (!easybloxBtNumberReady) {
        easybloxBtPoll();
    }

    easybloxBtNumberReady = false;
}


void EasyBloxBluetooth::begin() {
    easybloxBtResetGamepadState();
    easybloxBtResetControlsState();
    easybloxBtBegin();
}

void EasyBloxBluetooth::sendText(
    const String &value
) {
    easybloxBtSendText(
        EASYBLOX_BT_CHANNEL,
        value
    );
}

void EasyBloxBluetooth::sendNumber(
    double value
) {
    easybloxBtSendNumber(
        EASYBLOX_BT_CHANNEL,
        value
    );
}

void EasyBloxBluetooth::waitText() {
    easybloxBtWaitText(
        EASYBLOX_BT_CHANNEL
    );
}

void EasyBloxBluetooth::waitNumber() {
    easybloxBtWaitNumber(
        EASYBLOX_BT_CHANNEL
    );
}

const String &EasyBloxBluetooth::receivedText() const {
    return easybloxBtReceivedText;
}

float EasyBloxBluetooth::receivedNumber() const {
    return easybloxBtReceivedNumber;
}

bool EasyBloxBluetooth::gamepadButtonPressed(
    EasyBloxGamepadButton button
) {
    easybloxBtPoll();

    const uint8_t index =
        static_cast<uint8_t>(
            button
        );

    if (
        index >=
        EASYBLOX_GAMEPAD_BUTTON_COUNT
    ) {
        return false;
    }

    return easybloxBtGamepadState[
        index
    ];
}

float EasyBloxBluetooth::controlsJoystickPosition(
    EasyBloxControlsJoystickAxis axis
) {
    easybloxBtPoll();

    if (
        axis ==
        EasyBloxControlsJoystickAxis::Vertical
    ) {
        return easybloxBtControlsJoystickY;
    }

    return easybloxBtControlsJoystickX;
}

float EasyBloxBluetooth::controlsSliderValue() {
    easybloxBtPoll();

    return easybloxBtControlsSlider;
}

bool EasyBloxBluetooth::controlsButtonPressed() {
    easybloxBtPoll();

    return easybloxBtControlsButton;
}

bool EasyBloxBluetooth::controlsSwitchOn() {
    easybloxBtPoll();

    return easybloxBtControlsSwitch;
}

void EasyBloxBluetooth::bindMotor(
    EasyBloxRemoteMotor motor,
    uint8_t in1Pin,
    uint8_t in2Pin,
    uint8_t pwmPin
) {
    const uint8_t index =
        static_cast<uint8_t>(
            motor
        );

    if (
        index >=
        EASYBLOX_REMOTE_MOTOR_COUNT
    ) {
        return;
    }

    EasyBloxRemoteMotorBinding &binding =
        easybloxBtRemoteMotors[
            index
        ];

    binding.bound = true;
    binding.in1Pin = in1Pin;
    binding.in2Pin = in2Pin;
    binding.pwmPin = pwmPin;

    pinMode(
        in1Pin,
        OUTPUT
    );

    pinMode(
        in2Pin,
        OUTPUT
    );

    pinMode(
        pwmPin,
        OUTPUT
    );

    easybloxBtApplyMotorValue(
        index,
        0.0f
    );
}

void EasyBloxBluetooth::bindServo(
    EasyBloxRemoteServo servo,
    uint8_t pin
) {
    const uint8_t index =
        static_cast<uint8_t>(
            servo
        );

    if (
        index >=
        EASYBLOX_REMOTE_SERVO_COUNT
    ) {
        return;
    }

    const bool firstBoundServo =
        !easybloxBtHasBoundServo();

    if (
        easybloxBtRemoteServoBound[
            index
        ] &&
        easybloxBtRemoteServoPins[
            index
        ] != pin
    ) {
        easybloxBtWriteServoPinFast(
            easybloxBtRemoteServoPins[
                index
            ],
            false
        );
    }

    pinMode(
        pin,
        OUTPUT
    );

    digitalWrite(
        pin,
        LOW
    );

    const uint8_t oldSreg =
        SREG;

    cli();

    easybloxBtRemoteServoPins[
        index
    ] =
        pin;

    easybloxBtRemoteServoBound[
        index
    ] =
        true;

    easybloxBtRemoteServoPulseTicks[
        index
    ] =
        easybloxBtServoPulseTicks(
            0
        );

    SREG =
        oldSreg;

    if (firstBoundServo) {
        easybloxBtConfigureServoTimer1();
    }

    easybloxBtActivateServoSafeTransport();
}

ISR(INT0_vect) {
    easybloxBtHandleRxStartInterrupt();
}

ISR(TIMER1_COMPA_vect) {
    easybloxBtHandleServoTimerCompareAInterrupt();
}

ISR(TIMER1_COMPB_vect) {
    easybloxBtHandleTimer1CompareBInterrupt();
}

EasyBloxBluetooth EasyBloxBT;
