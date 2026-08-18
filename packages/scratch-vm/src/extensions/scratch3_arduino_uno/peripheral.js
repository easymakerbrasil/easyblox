const Serial = require('../../io/serial');

const {
    COMMANDS,
    LCD_MODES,
    RESPONSES,
    StageProtocolParser,
    encodeFrame
} = require('./protocol');

const EXTENSION_ID = 'arduinoUno';
const DEFAULT_BAUD_RATE = 115200;
const STAGE_HANDSHAKE_INITIAL_DELAY = 500;
const STAGE_HANDSHAKE_RETRY_DELAY = 500;
const STAGE_HANDSHAKE_MAX_ATTEMPTS = 6;

/**
 * Arduino UNO hardware peripheral.
 *
 * Owns the board-facing serial connection, Stage protocol parser and
 * board-specific connection state.
 */
class ArduinoUnoPeripheral {
    /**
     * @param {Runtime} runtime Scratch runtime.
     */
    constructor (runtime) {
        this._runtime = runtime;

        this._serial = null;

        this._serialOptions = {
            baudRate: DEFAULT_BAUD_RATE
        };

        this._parser = new StageProtocolParser(
            this._handleFrame.bind(this)
        );

        this._nextSequence = 1;
        this._pingSequence = null;
        this._pendingDigitalReads = new Map();
        this._pendingAnalogReads = new Map();
        this._pendingUltrasonicReads = new Map();
        this._pendingDhtReads = new Map();
        this._pendingCommandAcks = new Map();
        this._stageConnected = false;
        this._handshakeTimer = null;
        this._handshakeAttempts = 0;

        this._runtime.registerPeripheralExtension(
            EXTENSION_ID,
            this
        );
    }

    /**
     * Create the shared Serial layer when it is first needed.
     * @returns {Serial} Serial communication instance.
     */
    _getSerial () {
        if (!this._serial) {
            this._serial = new Serial(
                this._runtime,
                EXTENSION_ID,
                this._serialOptions,
                this._handleConnect.bind(this),
                this._reset.bind(this),
                this._handleData.bind(this)
            );
        }

        return this._serial;
    }

    /**
     * Scan or request a serial port from the active platform transport.
     * @returns {void}
     */
    scan () {
        this._getSerial().scan();
    }

    /**
     * Connect to the selected serial port.
     * @param {string} peripheralId Platform-specific serial peripheral id.
     * @returns {void}
     */
    connect (peripheralId) {
        this._getSerial().connect(peripheralId);
    }

    /**
     * Disconnect from the Arduino UNO.
     * @returns {void}
     */
    disconnect () {
        this._reset();

        if (this._serial) {
            this._serial.disconnect();
        }
    }

    /**
     * @returns {boolean} Whether the physical serial connection is active.
     */
    isConnected () {
        return this._serial ? this._serial.isConnected() : false;
    }

    /**
     * @returns {boolean} Whether the EasyBlox Stage protocol handshake succeeded.
     */
    isStageConnected () {
        return this._stageConnected;
    }

    /**
     * Set an Arduino UNO digital output pin HIGH or LOW in Stage mode.
     * @param {number} pin Arduino digital pin, from D2 to D13 or A0 to A5.
     * @param {number} value Digital value: 0 for LOW or 1 for HIGH.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    digitalWrite (pin, value) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            pin < 2 ||
            pin > 19 ||
            (value !== 0 && value !== 1)
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.DIGITAL_WRITE,
            [pin, value]
        );
    }

    /**
     * Set PWM output on an Arduino UNO PWM-capable pin in Stage mode.
     * @param {number} pin Arduino PWM pin: D3, D5, D6, D9, D10 or D11.
     * @param {number} value PWM value from 0 to 255.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    pwmWrite (pin, value) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            !Number.isInteger(value) ||
            ![3, 5, 6, 9, 10, 11].includes(pin) ||
            value < 0 ||
            value > 255
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.PWM_WRITE,
            [pin, value]
        );
    }

    /**
     * Start a tone on an Arduino UNO PWM-capable pin in Stage mode.
     * @param {number} pin Arduino PWM pin: D3, D5, D6, D9, D10 or D11.
     * @param {number} frequency Tone frequency from 1 to 65535 Hz.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    toneStart (pin, frequency) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            !Number.isInteger(frequency) ||
            ![3, 5, 6, 9, 10, 11].includes(pin) ||
            frequency < 1 ||
            frequency > 65535
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.TONE_START,
            [
                pin,
                frequency & 0xFF,
                (frequency >> 8) & 0xFF
            ]
        );
    }

    /**
     * Stop a tone on an Arduino UNO PWM-capable pin in Stage mode.
     * @param {number} pin Arduino PWM pin: D3, D5, D6, D9, D10 or D11.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    toneStop (pin) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            ![3, 5, 6, 9, 10, 11].includes(pin)
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.TONE_STOP,
            [pin]
        );
    }

    /**
     * Move a servo on an Arduino UNO PWM-capable pin in Stage mode.
     * @param {number} pin Arduino PWM pin: D3, D5, D6, D9, D10 or D11.
     * @param {number} angle Servo angle from 0 to 180 degrees.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    servoWrite (pin, angle) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            !Number.isInteger(angle) ||
            ![3, 5, 6, 9, 10, 11].includes(pin) ||
            angle < 0 ||
            angle > 180
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.SERVO_WRITE,
            [pin, angle]
        );
    }

    /**
     * Drive one DC motor through a three-pin H-bridge interface in Stage mode.
     * @param {number} in1Pin First direction pin, from D2 to D13 or A0 to A5.
     * @param {number} in2Pin Second direction pin, from D2 to D13 or A0 to A5.
     * @param {number} pwmPin PWM enable pin: D3, D5, D6, D9, D10 or D11.
     * @param {number} direction Motor direction: 0 forward or 1 reverse.
     * @param {number} speed Motor speed from 0 to 255.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    motorWrite (in1Pin, in2Pin, pwmPin, direction, speed) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(in1Pin) ||
            !Number.isInteger(in2Pin) ||
            !Number.isInteger(pwmPin) ||
            !Number.isInteger(direction) ||
            !Number.isInteger(speed) ||
            in1Pin < 2 ||
            in1Pin > 19 ||
            in2Pin < 2 ||
            in2Pin > 19 ||
            ![3, 5, 6, 9, 10, 11].includes(pwmPin) ||
            in1Pin === in2Pin ||
            in1Pin === pwmPin ||
            in2Pin === pwmPin ||
            direction < 0 ||
            direction > 1 ||
            speed < 0 ||
            speed > 255
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.MOTOR_WRITE,
            [
                in1Pin,
                in2Pin,
                pwmPin,
                direction,
                speed
            ]
        );
    }

    /**
     * Stop one DC motor through a three-pin H-bridge interface in Stage mode.
     * @param {number} in1Pin First direction pin, from D2 to D13 or A0 to A5.
     * @param {number} in2Pin Second direction pin, from D2 to D13 or A0 to A5.
     * @param {number} pwmPin PWM enable pin: D3, D5, D6, D9, D10 or D11.
     * @param {number} stopMode Stop mode: 0 coast or 1 brake.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    motorStop (in1Pin, in2Pin, pwmPin, stopMode) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(in1Pin) ||
            !Number.isInteger(in2Pin) ||
            !Number.isInteger(pwmPin) ||
            !Number.isInteger(stopMode) ||
            in1Pin < 2 ||
            in1Pin > 19 ||
            in2Pin < 2 ||
            in2Pin > 19 ||
            ![3, 5, 6, 9, 10, 11].includes(pwmPin) ||
            in1Pin === in2Pin ||
            in1Pin === pwmPin ||
            in2Pin === pwmPin ||
            stopMode < 0 ||
            stopMode > 1
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.MOTOR_STOP,
            [
                in1Pin,
                in2Pin,
                pwmPin,
                stopMode
            ]
        );
    }

    /**
     * Set one relay output in Stage mode.
     * @param {number} pin Arduino digital pin, from D2 to D13 or A0 to A5.
     * @param {number} state Relay state: 0 off or 1 on.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    relayWrite (pin, state) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            !Number.isInteger(state) ||
            pin < 2 ||
            pin > 19 ||
            state < 0 ||
            state > 1
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.RELAY_WRITE,
            [
                pin,
                state
            ]
        );
    }

    /**
     * Read an Arduino UNO digital input pin in Stage mode.
     * @param {number} pin Arduino digital pin, from D2 to D13 or A0 to A5.
     * @returns {?Promise<number>} Promise resolved with 0 or 1, or null when unavailable.
     */
    digitalRead (pin) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            pin < 2 ||
            pin > 19
        ) {
            return null;
        }

        const sequence = this._sendCommand(
            COMMANDS.DIGITAL_READ,
            [pin]
        );

        if (sequence === null) {
            return null;
        }

        return new Promise(resolve => {
            this._pendingDigitalReads.set(
                sequence,
                {
                    pin,
                    resolve
                }
            );
        });
    }

    /**
     * Read an Arduino UNO analog input pin in Stage mode.
     * @param {number} pin Arduino analog pin, from A0 to A5 as digital ids 14 to 19.
     * @returns {?Promise<number>} Promise resolved with a value from 0 to 1023, or null when unavailable.
     */
    analogRead (pin) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            pin < 14 ||
            pin > 19
        ) {
            return null;
        }

        const sequence = this._sendCommand(
            COMMANDS.ANALOG_READ,
            [pin]
        );

        if (sequence === null) {
            return null;
        }

        return new Promise(resolve => {
            this._pendingAnalogReads.set(
                sequence,
                {
                    pin,
                    resolve
                }
            );
        });
    }

    /**
     * Read an HC-SR04-style ultrasonic distance in Stage mode.
     * @param {number} trigPin Arduino digital pin for trigger.
     * @param {number} echoPin Arduino digital pin for echo.
     * @returns {?Promise<number>} Promise resolved with distance in millimeters, or null when unavailable.
     */
    ultrasonicRead (trigPin, echoPin) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(trigPin) ||
            !Number.isInteger(echoPin) ||
            trigPin < 2 ||
            trigPin > 19 ||
            echoPin < 2 ||
            echoPin > 19 ||
            trigPin === echoPin
        ) {
            return null;
        }

        const sequence = this._sendCommand(
            COMMANDS.ULTRASONIC_READ,
            [
                trigPin,
                echoPin
            ]
        );

        if (sequence === null) {
            return null;
        }

        return new Promise(resolve => {
            this._pendingUltrasonicReads.set(
                sequence,
                {
                    trigPin,
                    echoPin,
                    resolve
                }
            );
        });
    }

    /**
     * Read temperature and humidity from a DHT11-style sensor in Stage mode.
     * @param {number} pin Arduino digital pin connected to the DHT sensor.
     * @param {number} type Requested value type: 0 for temperature, 1 for humidity.
     * @returns {?Promise<object>} Promise resolved with raw hundredths values, or null when unavailable.
     */
    dhtRead (pin, type) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(pin) ||
            pin < 2 ||
            pin > 13 ||
            !Number.isInteger(type) ||
            (type !== 0 && type !== 1)
        ) {
            return null;
        }

        const sequence = this._sendCommand(
            COMMANDS.DHT_READ,
            [
                pin,
                type
            ]
        );

        if (sequence === null) {
            return null;
        }

        return new Promise(resolve => {
            this._pendingDhtReads.set(
                sequence,
                {
                    pin,
                    type,
                    resolve
                }
            );
        });
    }

    /**
     * Initialize a 16x2 I2C LCD in Stage mode.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdInit () {
        if (!this._stageConnected) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.LCD_INIT
        );
    }

    /**
     * Write an 8x8 frame to a MAX7219 matrix in Stage mode.
     * @param {number} dinPin MAX7219 DIN pin.
     * @param {number} csPin MAX7219 CS pin.
     * @param {number} clkPin MAX7219 CLK pin.
     * @param {Array<number>} rows Eight matrix row bytes.
     * @returns {?Promise<number>} Promise resolved after ACK, or null when unavailable.
     */
    matrixWrite (dinPin, csPin, clkPin, rows) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(dinPin) ||
            !Number.isInteger(csPin) ||
            !Number.isInteger(clkPin) ||
            dinPin < 2 ||
            dinPin > 19 ||
            csPin < 2 ||
            csPin > 19 ||
            clkPin < 2 ||
            clkPin > 19 ||
            dinPin === csPin ||
            dinPin === clkPin ||
            csPin === clkPin
        ) {
            return null;
        }

        if (
            !Array.isArray(rows) ||
            rows.length !== 8 ||
            Array.from(rows).some(row =>
                !Number.isInteger(row) ||
                row < 0 ||
                row > 255
            )
        ) {
            return null;
        }

        return this._sendCommandWithAck(
            COMMANDS.MATRIX_WRITE,
            [
                dinPin,
                csPin,
                clkPin,
                ...rows
            ]
        );
    }

    /**
     * Set MAX7219 matrix brightness in Stage mode.
     * @param {number} dinPin MAX7219 DIN pin.
     * @param {number} csPin MAX7219 CS pin.
     * @param {number} clkPin MAX7219 CLK pin.
     * @param {number} brightness Brightness from 0 to 100 percent.
     * @returns {?Promise<number>} Promise resolved after ACK, or null when unavailable.
     */
    matrixBrightness (
        dinPin,
        csPin,
        clkPin,
        brightness
    ) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(dinPin) ||
            !Number.isInteger(csPin) ||
            !Number.isInteger(clkPin) ||
            !Number.isInteger(brightness) ||
            dinPin < 2 ||
            dinPin > 19 ||
            csPin < 2 ||
            csPin > 19 ||
            clkPin < 2 ||
            clkPin > 19 ||
            dinPin === csPin ||
            dinPin === clkPin ||
            csPin === clkPin ||
            brightness < 0 ||
            brightness > 100
        ) {
            return null;
        }

        return this._sendCommandWithAck(
            COMMANDS.MATRIX_BRIGHTNESS,
            [
                dinPin,
                csPin,
                clkPin,
                brightness
            ]
        );
    }

    /**
     * Write text to a 16x2 I2C LCD in Stage mode.
     * Row and column use zero-based protocol coordinates.
     * @param {*} text Value to write.
     * @param {number} row LCD row: 0 or 1.
     * @param {number} column LCD column: 0 to 15.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdWrite (text, row, column) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(row) ||
            !Number.isInteger(column) ||
            row < 0 ||
            row > 1 ||
            column < 0 ||
            column > 15
        ) {
            return null;
        }

        const availableColumns = 16 - column;

        const normalizedText = String(text)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x20-\x7E]/g, '?')
            .slice(0, availableColumns);

        const textBytes = Array.from(
            normalizedText,
            character => character.charCodeAt(0)
        );

        return this._sendCommand(
            COMMANDS.LCD_WRITE,
            [
                row,
                column,
                ...textBytes
            ]
        );
    }

    /**
     * Clear a 16x2 I2C LCD in Stage mode.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdClear () {
        if (!this._stageConnected) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.LCD_CLEAR
        );
    }

    /**
     * Set or execute a 16x2 I2C LCD mode in Stage mode.
     * @param {number} mode One value from LCD_MODES.
     * @returns {?number} Command sequence number or null when unavailable.
     */
    lcdMode (mode) {
        if (!this._stageConnected) {
            return null;
        }

        if (
            !Number.isInteger(mode) ||
            !Object.values(LCD_MODES).includes(mode)
        ) {
            return null;
        }

        return this._sendCommand(
            COMMANDS.LCD_MODE,
            [mode]
        );
    }

    /**
     * Called when the physical serial connection succeeds.
     * Starts the EasyBlox Stage protocol handshake.
     * @returns {void}
     */
    _handleConnect () {
        this._reset();

        this._scheduleHandshake(
            STAGE_HANDSHAKE_INITIAL_DELAY
        );
    }

    /**
     * Schedule a Stage protocol handshake attempt.
     * Arduino UNO boards can reset when the serial port opens, so the
     * handshake is retried while the board bootloader is finishing.
     * @param {number} delay Delay before the attempt, in milliseconds.
     * @returns {void}
     */
    _scheduleHandshake (delay) {
        this._handshakeTimer = setTimeout(() => {
            this._handshakeTimer = null;

            if (!this.isConnected() || this._stageConnected) {
                return;
            }

            this._handshakeAttempts++;

            this._pingSequence = this._sendCommand(
                COMMANDS.PING
            );

            if (
                this._handshakeAttempts <
                STAGE_HANDSHAKE_MAX_ATTEMPTS
            ) {
                this._scheduleHandshake(
                    STAGE_HANDSHAKE_RETRY_DELAY
                );
            }
        }, delay);
    }

    /**
     * Receive raw bytes from the Serial layer.
     * @param {Uint8Array} data Received serial bytes.
     * @returns {void}
     */
    _handleData (data) {
        this._parser.push(data);
    }

    /**
     * Handle a valid EasyBlox Stage protocol frame.
     * @param {object} frame Decoded protocol frame.
     * @returns {void}
     */
    _handleFrame (frame) {
        if (
            frame.command === RESPONSES.PONG &&
            frame.sequence === this._pingSequence
        ) {
            this._stageConnected = true;

            if (this._handshakeTimer) {
                clearTimeout(this._handshakeTimer);
                this._handshakeTimer = null;
            }

            return;
        }

        if (frame.command === RESPONSES.ACK) {
            const pendingCommand =
                this._pendingCommandAcks.get(frame.sequence);

            if (!pendingCommand) {
                return;
            }

            clearTimeout(pendingCommand.timeout);

            this._pendingCommandAcks.delete(
                frame.sequence
            );

            pendingCommand.resolve(
                frame.sequence
            );

            return;
        }

        if (frame.command === RESPONSES.ERROR) {
            const pendingCommand =
                this._pendingCommandAcks.get(frame.sequence);

            if (pendingCommand) {
                clearTimeout(pendingCommand.timeout);

                this._pendingCommandAcks.delete(
                    frame.sequence
                );

                pendingCommand.resolve(null);
                return;
            }
            const pendingUltrasonicRead =
                this._pendingUltrasonicReads.get(frame.sequence);

            if (pendingUltrasonicRead) {
                this._pendingUltrasonicReads.delete(frame.sequence);
                pendingUltrasonicRead.resolve(null);
                return;
            }

            const pendingDhtRead =
                this._pendingDhtReads.get(frame.sequence);

            if (pendingDhtRead) {
                this._pendingDhtReads.delete(frame.sequence);
                pendingDhtRead.resolve(null);
            }

            return;
        }

        if (frame.command === RESPONSES.DIGITAL_READ) {
            const pendingRead =
                this._pendingDigitalReads.get(frame.sequence);

            if (
                !pendingRead ||
                frame.payload.length !== 2 ||
                frame.payload[0] !== pendingRead.pin ||
                (frame.payload[1] !== 0 && frame.payload[1] !== 1)
            ) {
                return;
            }

            this._pendingDigitalReads.delete(frame.sequence);

            pendingRead.resolve(
                frame.payload[1]
            );

            return;
        }

        if (frame.command === RESPONSES.ANALOG_READ) {
            const pendingRead =
                this._pendingAnalogReads.get(frame.sequence);

            if (
                !pendingRead ||
                frame.payload.length !== 3 ||
                frame.payload[0] !== pendingRead.pin
            ) {
                return;
            }

            const value =
                (frame.payload[1] << 8) |
                frame.payload[2];

            if (value > 1023) {
                return;
            }

            this._pendingAnalogReads.delete(frame.sequence);

            pendingRead.resolve(value);
        }

        if (frame.command === RESPONSES.ULTRASONIC_READ) {
            const pendingRead =
                this._pendingUltrasonicReads.get(frame.sequence);

            if (
                !pendingRead ||
                frame.payload.length !== 4 ||
                frame.payload[0] !== pendingRead.trigPin ||
                frame.payload[1] !== pendingRead.echoPin
            ) {
                return;
            }

            const distanceMm =
                (frame.payload[2] << 8) |
                frame.payload[3];

            this._pendingUltrasonicReads.delete(frame.sequence);

            pendingRead.resolve(distanceMm);

            return;
        }

        if (frame.command === RESPONSES.DHT_READ) {
            const pendingRead =
                this._pendingDhtReads.get(frame.sequence);

            if (
                !pendingRead ||
                frame.payload.length !== 5 ||
                frame.payload[0] !== pendingRead.pin
            ) {
                return;
            }

            const temperature =
                (frame.payload[1] << 8) |
                frame.payload[2];

            const humidity =
                (frame.payload[3] << 8) |
                frame.payload[4];

            this._pendingDhtReads.delete(frame.sequence);

            pendingRead.resolve({
                temperature,
                humidity
            });

            return;
        }
    }

    /**
     * Send a Stage protocol command.
     * @param {number} command Protocol command.
     * @param {Uint8Array|Array<number>} payload Command payload.
     * @returns {?number} Sequence number or null when serial is unavailable.
     */
    _sendCommand (command, payload = []) {
        if (!this._serial || !this._serial.isConnected()) {
            return null;
        }

        const sequence = this._nextSequence;

        this._nextSequence++;

        if (this._nextSequence > 0xFF) {
            this._nextSequence = 1;
        }

        const frame = encodeFrame(
            sequence,
            command,
            payload
        );

        this._serial.write(frame);

        return sequence;
    }

    /**
     * Send a Stage protocol command and wait for its ACK.
     * Used by commands which require firmware processing backpressure.
     * @param {number} command Protocol command.
     * @param {Uint8Array|Array<number>} payload Command payload.
     * @returns {?Promise<number>} Promise resolved with the sequence number
     * when acknowledged, or null on failure/timeout.
     */
    _sendCommandWithAck (command, payload = []) {
        if (!this._serial || !this._serial.isConnected()) {
            return null;
        }

        const sequence = this._nextSequence;

        this._nextSequence++;

        if (this._nextSequence > 0xFF) {
            this._nextSequence = 1;
        }

        const frame = encodeFrame(
            sequence,
            command,
            payload
        );

        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                const pendingCommand =
                    this._pendingCommandAcks.get(sequence);

                if (!pendingCommand) {
                    return;
                }

                this._pendingCommandAcks.delete(
                    sequence
                );

                resolve(null);
            }, 1000);

            this._pendingCommandAcks.set(
                sequence,
                {
                    resolve,
                    timeout
                }
            );

            this._serial.write(frame);
        });
    }

    /**
     * Reset board-specific Stage protocol state.
     * @returns {void}
     */
    _reset () {
        if (this._handshakeTimer) {
            clearTimeout(this._handshakeTimer);
            this._handshakeTimer = null;
        }

        this._parser.reset();

        for (const pendingRead of this._pendingDigitalReads.values()) {
            pendingRead.resolve(null);
        }

        this._pendingDigitalReads.clear();

        for (const pendingRead of this._pendingAnalogReads.values()) {
            pendingRead.resolve(null);
        }

        this._pendingAnalogReads.clear();

        for (const pendingRead of this._pendingUltrasonicReads.values()) {
            pendingRead.resolve(null);
        }

        this._pendingUltrasonicReads.clear();

        for (
            const pendingCommand
            of this._pendingCommandAcks.values()
        ) {
            clearTimeout(pendingCommand.timeout);
            pendingCommand.resolve(null);
        }

        this._pendingCommandAcks.clear();

        for (const pendingRead of this._pendingDhtReads.values()) {
            pendingRead.resolve(null);
        }

        this._pendingDhtReads.clear();

        this._nextSequence = 1;
        this._pingSequence = null;
        this._stageConnected = false;
        this._handshakeAttempts = 0;
    }
}

module.exports = ArduinoUnoPeripheral;
