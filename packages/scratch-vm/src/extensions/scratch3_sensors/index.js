const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const formatMessage = require('format-message');

const EasyMakerProductProfile =
    require('../../board-profiles/easymaker-product-profile');
const getProductProfile = require('../../board-profiles/get-product-profile');

const EasyMakerPortSymbols =
    require('../../board-profiles/easymaker-port-symbols');

const EXTENSION_ID = 'sensors';

const EASYMAKER_ULTRASONIC_PORT_ALT_LABELS =
    Object.freeze({
        triangle: 'porta triângulo',
        pentagon: 'porta pentágono',
        asterisk: 'porta asterisco'
    });

const EASYMAKER_DHT_PORT_ALT_LABELS =
    Object.freeze({
        asterisk: 'porta asterisco',
        question: 'porta interrogação',
        chevrons: 'porta menor e maior'
    });

const EASYMAKER_DIGITAL_SENSOR_PORT_ALT_LABELS =
    Object.freeze({
        asterisk: 'porta asterisco',
        question: 'porta interrogação',
        chevrons: 'porta menor e maior'
    });

const EASYMAKER_ANALOG_SENSOR_PORT_ALT_LABELS =
    Object.freeze({
        square: 'porta quadrado',
        circle: 'porta círculo',
        semicircle: 'porta semicírculo',
        triangle: 'porta triângulo',
        pentagon: 'porta pentágono'
    });
/**
 * Hardware sensor blocks for supported EasyBlox boards.
 */
class Scratch3SensorsBlocks {
    /**
     * @param {Runtime} runtime Scratch runtime.
     */
    constructor (runtime) {
        this.runtime = runtime;
        this._peripheral = runtime.getPeripheralExtension('arduinoUno');

        this._joystickXPin = 18;
        this._joystickYPin = 19;
        this._joystickClickPin = 13;
    }

    /**
     * Describe the hardware sensors extension to the Scratch VM.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        const selectedBoardId =
            typeof this.runtime.getEasyBloxSelectedBoardId ===
                'function' ?
                this.runtime.getEasyBloxSelectedBoardId() :
                null;

        const productProfile = this._getProductProfile();
        const useJrSensorSurface = productProfile && productProfile.id === 'easyduino-jr';

        const useEasyMakerUltrasonicSurface =
            selectedBoardId ===
                EasyMakerProductProfile.id;

        const useEasyMakerDhtSurface =
            selectedBoardId ===
                EasyMakerProductProfile.id;

        const useEasyMakerJoystickSurface =
            selectedBoardId ===
                EasyMakerProductProfile.id;

        const useEasyMakerGenericSensorSurface =
            selectedBoardId ===
                EasyMakerProductProfile.id;

        const easyMakerPhysicalPorts =
            Object.values(
                EasyMakerProductProfile.physicalPorts
            );

        const easyMakerDigitalSensorPortMenuItems =
            Object.keys(
                EasyMakerProductProfile
                    .devices
                    .digitalSensor
                    .ports
            ).map(portId => {
                const physicalPort =
                    easyMakerPhysicalPorts.find(
                        port =>
                            port.id === portId
                    );

                const symbol =
                    physicalPort ?
                        EasyMakerPortSymbols[
                            physicalPort.symbolId
                        ] :
                        null;

                const alt =
                    physicalPort ?
                        EASYMAKER_DIGITAL_SENSOR_PORT_ALT_LABELS[
                            physicalPort.symbolId
                        ] :
                        null;

                return {
                    text:
                        symbol && alt ?
                            {
                                src: symbol.dataURI,
                                alt,
                                width: symbol.width,
                                height: symbol.height
                            } :
                            physicalPort.fallbackLabel,
                    value: portId
                };
            });

        const easyMakerAnalogSensorPortMenuItems =
            Object.keys(
                EasyMakerProductProfile
                    .devices
                    .analogSensor
                    .ports
            ).map(portId => {
                const physicalPort =
                    easyMakerPhysicalPorts.find(
                        port =>
                            port.id === portId
                    );

                const symbol =
                    physicalPort ?
                        EasyMakerPortSymbols[
                            physicalPort.symbolId
                        ] :
                        null;

                const alt =
                    physicalPort ?
                        EASYMAKER_ANALOG_SENSOR_PORT_ALT_LABELS[
                            physicalPort.symbolId
                        ] :
                        null;

                return {
                    text:
                        symbol && alt ?
                            {
                                src: symbol.dataURI,
                                alt,
                                width: symbol.width,
                                height: symbol.height
                            } :
                            physicalPort.fallbackLabel,
                    value: portId
                };
            });

        const easyMakerUltrasonicPortMenuItems =
            Object.keys(
                EasyMakerProductProfile
                    .devices
                    .ultrasonic
                    .ports
            ).map(portId => {
                const physicalPort =
                    easyMakerPhysicalPorts.find(
                        port =>
                            port.id === portId
                    );

                const symbol =
                    physicalPort ?
                        EasyMakerPortSymbols[
                            physicalPort.symbolId
                        ] :
                        null;

                const alt =
                    physicalPort ?
                        EASYMAKER_ULTRASONIC_PORT_ALT_LABELS[
                            physicalPort.symbolId
                        ] :
                        null;

                return {
                    text:
                        symbol && alt ?
                            {
                                src: symbol.dataURI,
                                alt,
                                width: symbol.width,
                                height: symbol.height
                            } :
                            physicalPort.fallbackLabel,
                    value: portId
                };
            });

        const easyMakerDhtPortMenuItems =
            Object.keys(
                EasyMakerProductProfile
                    .devices
                    .dht11
                    .ports
            ).map(portId => {
                const physicalPort =
                    easyMakerPhysicalPorts.find(
                        port =>
                            port.id === portId
                    );

                const symbol =
                    physicalPort ?
                        EasyMakerPortSymbols[
                            physicalPort.symbolId
                        ] :
                        null;

                const alt =
                    physicalPort ?
                        EASYMAKER_DHT_PORT_ALT_LABELS[
                            physicalPort.symbolId
                        ] :
                        null;

                return {
                    text:
                        symbol && alt ?
                            {
                                src: symbol.dataURI,
                                alt,
                                width: symbol.width,
                                height: symbol.height
                            } :
                            physicalPort.fallbackLabel,
                    value: portId
                };
            });

        const easyMakerDigitalSensorBlock = {
            opcode: 'digitalSensorRead',
            blockType: BlockType.BOOLEAN,
            text: useJrSensorSurface ? formatMessage({
                id: 'sensors.jr.digitalSensorRead',
                default: 'sensor digital [TYPE]',
                description: 'Read the integrated EasyDuino Jr digital sensor.'
            }) : 'sensor digital [TYPE] na porta [PORT]',
            hideFromPalette:
                !useEasyMakerGenericSensorSurface && !useJrSensorSurface,
            arguments: {
                TYPE: {
                    type: ArgumentType.STRING,
                    menu: 'digitalSensorTypes',
                    defaultValue: useJrSensorSurface ? 'REFLECTIVE' : 'PIR'
                },
                ...(useJrSensorSurface ? {} : {
                    PORT: {
                        type: ArgumentType.STRING,
                        menu: 'easyMakerDigitalSensorPorts',
                        defaultValue: 'digital-d2-d3'
                    }
                })
            }
        };

        const easyMakerAnalogSensorBlock = {
            opcode: 'analogSensorRead',
            blockType: BlockType.REPORTER,
            text: useJrSensorSurface ? formatMessage({
                id: 'sensors.jr.analogSensorRead',
                default: 'sensor analógico [TYPE]',
                description: 'Read an integrated EasyDuino Jr analog sensor.'
            }) : 'sensor analógico [TYPE] na porta [PORT]',
            hideFromPalette:
                !useEasyMakerGenericSensorSurface && !useJrSensorSurface,
            arguments: {
                TYPE: {
                    type: ArgumentType.STRING,
                    menu: 'analogSensorTypes',
                    defaultValue: 'POTENTIOMETER'
                },
                ...(useJrSensorSurface ? {} : {
                    PORT: {
                        type: ArgumentType.STRING,
                        menu: 'easyMakerAnalogSensorPorts',
                        defaultValue: 'analog-a0'
                    }
                })
            }
        };

        const legacyUltrasonicBlock = {
            opcode: 'ultrasonicRead',
            blockType: BlockType.REPORTER,
            text: useJrSensorSurface ? formatMessage({
                id: 'sensors.jr.ultrasonicRead',
                default: 'obter distância do ultrassônico em cm',
                description: 'EasyDuino Jr onboard ultrasonic distance sensor'
            }) : 'distância do ultrassônico TRIG [TRIG] ECHO [ECHO] (cm)',
            hideFromPalette:
                useEasyMakerUltrasonicSurface,
            arguments: {
                TRIG: {
                    type: ArgumentType.NUMBER,
                    menu: 'ultrasonicPins',
                    defaultValue: 16
                },
                ECHO: {
                    type: ArgumentType.NUMBER,
                    menu: 'ultrasonicPins',
                    defaultValue: 17
                }
            }
        };

        const easyMakerUltrasonicBlock = {
            opcode: 'ultrasonicReadPort',
            blockType: BlockType.REPORTER,
            text: 'distância do ultrassônico na porta [PORT] (cm)',
            hideFromPalette:
                !useEasyMakerUltrasonicSurface,
            arguments: {
                PORT: {
                    type: ArgumentType.STRING,
                    menu: 'easyMakerUltrasonicPorts',
                    defaultValue:
                        EasyMakerProductProfile
                            .physicalPorts
                            .analogA2A3
                            .id
                }
            }
        };
        const legacyDhtBlock = {
            opcode: 'dhtRead',
            blockType: BlockType.REPORTER,
            text: useJrSensorSurface ? formatMessage({
                id: 'sensors.jr.dhtRead',
                default: '[TYPE] do DHT11',
                description: 'EasyDuino Jr onboard temperature and humidity sensor'
            }) : '[TYPE] do DHT no pino [PIN]',
            hideFromPalette:
                useEasyMakerDhtSurface,
            arguments: {
                TYPE: {
                    type: ArgumentType.STRING,
                    menu: 'dhtTypes',
                    defaultValue: '0'
                },
                PIN: {
                    type: ArgumentType.NUMBER,
                    menu: 'dhtPins',
                    defaultValue: 12
                }
            }
        };

        const easyMakerDhtBlock = {
            opcode: 'dhtReadPort',
            blockType: BlockType.REPORTER,
            text: '[TYPE] do DHT na porta [PORT]',
            hideFromPalette:
                !useEasyMakerDhtSurface,
            arguments: {
                TYPE: {
                    type: ArgumentType.STRING,
                    menu: 'dhtTypes',
                    defaultValue: '0'
                },
                PORT: {
                    type: ArgumentType.STRING,
                    menu: 'easyMakerDhtPorts',
                    defaultValue:
                        EasyMakerProductProfile
                            .physicalPorts
                            .digitalD12
                            .id
                }
            }
        };

        return {
            id: EXTENSION_ID,
            name:
                useEasyMakerGenericSensorSurface ?
                    'Sensores' :
                    'Sensores Arduino',
            color1: '#29B6F6',
            color2: '#039BE5',
            color3: '#0277BD',
            blocks: [
                easyMakerDigitalSensorBlock,
                easyMakerAnalogSensorBlock,
                legacyUltrasonicBlock,
                easyMakerUltrasonicBlock,
                legacyDhtBlock,
                easyMakerDhtBlock,
                '---',
                {
                    opcode: 'joystickInit',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        useJrSensorSurface ? true : useEasyMakerJoystickSurface,
                    text: 'inicializar joystick X [X] Y [Y] CLICK [CLICK]',
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            menu: 'joystickAnalogPins',
                            defaultValue: 18
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            menu: 'joystickAnalogPins',
                            defaultValue: 19
                        },
                        CLICK: {
                            type: ArgumentType.NUMBER,
                            menu: 'joystickClickPins',
                            defaultValue: 13
                        }
                    }
                },
                {
                    opcode: 'joystickInitEasyMaker',
                    blockType: BlockType.COMMAND,
                    hideFromPalette:
                        !useEasyMakerJoystickSurface,
                    text: 'inicializar joystick'
                },
                {
                    opcode: 'joystickValue',
                    blockType: BlockType.REPORTER,
                    ...(useJrSensorSurface ? {hideFromPalette: true} : {}),
                    text: 'valor do joystick [AXIS]',
                    arguments: {
                        AXIS: {
                            type: ArgumentType.STRING,
                            menu: 'joystickAxes',
                            defaultValue: 'X'
                        }
                    }
                },
                {
                    opcode: 'joystickClicked',
                    blockType: BlockType.BOOLEAN,
                    ...(useJrSensorSurface ? {hideFromPalette: true} : {}),
                    text: 'joystick clicado?'
                }
            ],
            menus: {
                easyMakerDigitalSensorPorts: {
                    acceptReporters: false,
                    items:
                        easyMakerDigitalSensorPortMenuItems
                },

                easyMakerAnalogSensorPorts: {
                    acceptReporters: false,
                    items:
                        easyMakerAnalogSensorPortMenuItems
                },

                digitalSensorTypes: {
                    acceptReporters: false,
                    items: [
                        {
                            text: 'PIR',
                            value: 'PIR'
                        },
                        {
                            text: 'Tilt',
                            value: 'TILT'
                        },
                        {
                            text: 'Reflexivo',
                            value: 'REFLECTIVE'
                        },
                        {
                            text: 'Chuva',
                            value: 'RAIN'
                        },
                        {
                            text: 'Botão',
                            value: 'BUTTON'
                        },
                        {
                            text: 'Som',
                            value: 'SOUND'
                        }
                    ].filter(item => !useJrSensorSurface || item.value === 'REFLECTIVE')
                },

                analogSensorTypes: {
                    acceptReporters: false,
                    items: [
                        {
                            text: 'Potenciômetro',
                            value: 'POTENTIOMETER'
                        },
                        {
                            text: 'Reflexivo',
                            value: 'REFLECTIVE'
                        },
                        {
                            text: 'LDR',
                            value: 'LDR'
                        },
                        {
                            text: 'Umidade do Solo',
                            value: 'SOIL_MOISTURE'
                        },
                        {
                            text: 'Som',
                            value: 'SOUND'
                        }
                    ].filter(item => !useJrSensorSurface ||
                        ['POTENTIOMETER', 'LDR', 'SOIL_MOISTURE'].includes(item.value))
                },

                easyMakerUltrasonicPorts: {
                    acceptReporters: false,
                    items:
                        easyMakerUltrasonicPortMenuItems
                },

                ultrasonicPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'D2', value: '2'},
                        {text: 'D3', value: '3'},
                        {text: 'D4', value: '4'},
                        {text: 'D5', value: '5'},
                        {text: 'D6', value: '6'},
                        {text: 'D7', value: '7'},
                        {text: 'D8', value: '8'},
                        {text: 'D9', value: '9'},
                        {text: 'D10', value: '10'},
                        {text: 'D11', value: '11'},
                        {text: 'D12', value: '12'},
                        {text: 'D13', value: '13'},
                        {text: 'A0', value: '14'},
                        {text: 'A1', value: '15'},
                        {text: 'A2', value: '16'},
                        {text: 'A3', value: '17'},
                        {text: 'A4', value: '18'},
                        {text: 'A5', value: '19'}
                    ]
                },
                easyMakerDhtPorts: {
                    acceptReporters: false,
                    items:
                        easyMakerDhtPortMenuItems
                },
                dhtTypes: {
                    acceptReporters: true,
                    items: [
                        {text: 'temperatura', value: '0'},
                        {text: 'umidade', value: '1'}
                    ]
                },

                dhtPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'D2', value: '2'},
                        {text: 'D3', value: '3'},
                        {text: 'D4', value: '4'},
                        {text: 'D5', value: '5'},
                        {text: 'D6', value: '6'},
                        {text: 'D7', value: '7'},
                        {text: 'D8', value: '8'},
                        {text: 'D9', value: '9'},
                        {text: 'D10', value: '10'},
                        {text: 'D11', value: '11'},
                        {text: 'D12', value: '12'},
                        {text: 'D13', value: '13'}
                    ]
                },

                joystickAnalogPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'A0', value: '14'},
                        {text: 'A1', value: '15'},
                        {text: 'A2', value: '16'},
                        {text: 'A3', value: '17'},
                        {text: 'A4', value: '18'},
                        {text: 'A5', value: '19'}
                    ]
                },

                joystickClickPins: {
                    acceptReporters: true,
                    items: [
                        {text: 'D2', value: '2'},
                        {text: 'D3', value: '3'},
                        {text: 'D4', value: '4'},
                        {text: 'D5', value: '5'},
                        {text: 'D6', value: '6'},
                        {text: 'D7', value: '7'},
                        {text: 'D8', value: '8'},
                        {text: 'D9', value: '9'},
                        {text: 'D10', value: '10'},
                        {text: 'D11', value: '11'},
                        {text: 'D12', value: '12'},
                        {text: 'D13', value: '13'}
                    ]
                },

                joystickAxes: {
                    acceptReporters: true,
                    items: [
                        {text: 'X', value: 'X'},
                        {text: 'Y', value: 'Y'}
                    ]
                }
            }
        };
    }

    /**
     * Read a semantic digital sensor using the active product's physical mapping.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<boolean>} Digital sensor state.
     */
    digitalSensorRead (args) {
        const type =
            String(args.TYPE).toUpperCase();

        const profile = this._getProductProfile();
        if (profile && profile.id === 'easyduino-jr') {
            if (type !== 'REFLECTIVE') {
                return null;
            }
            const sensor = profile.devices.reflectiveSensor;
            const result = this._peripheral.digitalRead(sensor.pin);
            return result ? result.then(value => (value === null ? null :
                value === (sensor.activeLevel === 'LOW' ? 0 : 1))) : result;
        }

        if (
            type !== 'PIR' &&
            type !== 'TILT' &&
            type !== 'REFLECTIVE' &&
            type !== 'RAIN' &&
            type !== 'BUTTON' &&
            type !== 'SOUND'
        ) {
            return null;
        }

        const port =
            EasyMakerProductProfile
                .devices
                .digitalSensor
                .ports[String(args.PORT)];

        if (!port) {
            return null;
        }

        const result =
            this._peripheral.digitalRead(
                port.pin
            );

        if (!result) {
            return result;
        }

        return result.then(
            value => value === 1
        );
    }

    /**
     * Read a raw analog sensor using the active product's physical mapping.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Analog value from 0 to 1023.
     */
    analogSensorRead (args) {
        const type =
            String(args.TYPE).toUpperCase();

        const profile = this._getProductProfile();
        if (profile && profile.id === 'easyduino-jr') {
            const sensor = {
                LDR: profile.devices.ldr,
                POTENTIOMETER: profile.devices.potentiometer,
                SOIL_MOISTURE: profile.devices.soilMoisture
            }[type];
            return sensor ? this._peripheral.analogRead(sensor.pin) : null;
        }

        if (
            type !== 'POTENTIOMETER' &&
            type !== 'REFLECTIVE' &&
            type !== 'LDR' &&
            type !== 'SOIL_MOISTURE' &&
            type !== 'SOUND'
        ) {
            return null;
        }

        const port =
            EasyMakerProductProfile
                .devices
                .analogSensor
                .ports[String(args.PORT)];

        if (!port) {
            return null;
        }

        return this._peripheral.analogRead(
            port.pin
        );
    }

    /**
     * Read ultrasonic distance in centimeters.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved with centimeters, or null when unavailable.
     */
    ultrasonicRead (args) {
        const profile = this._getProductProfile();
        if (profile && profile.id === 'easyduino-jr') {
            return this._readUltrasonicDistance(profile.devices.ultrasonic.trigPin, profile.devices.ultrasonic.echoPin);
        }
        return this._readUltrasonicDistance(
            Number(args.TRIG),
            Number(args.ECHO)
        );
    }

    /**
     * Read ultrasonic distance from one EasyMaker physical port.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved with centimeters, or null when unavailable.
     */
    ultrasonicReadPort (args) {
        const profile = this._getProductProfile();
        if (profile && profile.id === 'easyduino-jr') {
            return this.ultrasonicRead(args);
        }
        const portId = String(args.PORT);

        const port =
            EasyMakerProductProfile
                .devices
                .ultrasonic
                .ports[portId];

        if (!port) {
            return null;
        }

        return this._readUltrasonicDistance(
            port.trigPin,
            port.echoPin
        );
    }

    /**
     * Read ultrasonic distance using canonical Arduino pins.
     * @param {number} trigPin Arduino trigger pin.
     * @param {number} echoPin Arduino echo pin.
     * @returns {?Promise<number>} Promise resolved with centimeters, or null when unavailable.
     * @private
     */
    _readUltrasonicDistance (trigPin, echoPin) {
        const result = this._peripheral.ultrasonicRead(
            trigPin,
            echoPin
        );

        if (!result) {
            return result;
        }

        return result.then(distanceMm => {
            if (distanceMm === null) {
                return null;
            }

            return distanceMm / 10;
        });
    }

    /**
     * Read temperature or humidity from a DHT sensor.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved with the selected value, or null when unavailable.
     */
    dhtRead (args) {
        const profile = this._getProductProfile();
        if (profile && profile.id === 'easyduino-jr') {
            return this._readDhtValue(profile.devices.dht11.pin, Number(args.TYPE));
        }
        return this._readDhtValue(
            Number(args.PIN),
            Number(args.TYPE)
        );
    }

    /**
     * Read temperature or humidity from one EasyMaker DHT physical port.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved with the selected value, or null when unavailable.
     */
    dhtReadPort (args) {
        const profile = this._getProductProfile();
        if (profile && profile.id === 'easyduino-jr') {
            return this.dhtRead(args);
        }
        const portId = String(args.PORT);

        const port =
            EasyMakerProductProfile
                .devices
                .dht11
                .ports[portId];

        if (!port) {
            return null;
        }

        return this._readDhtValue(
            port.pin,
            Number(args.TYPE)
        );
    }

    /**
     * Read temperature or humidity from a DHT sensor.
     * @param {number} pin Arduino pin number.
     * @param {number} type DHT reading type.
     * @returns {?Promise<number>} Promise resolved with the selected value, or null when unavailable.
     * @private
     */
    _readDhtValue (pin, type) {
        const result = this._peripheral.dhtRead(
            pin,
            type
        );

        if (!result) {
            return result;
        }

        return result.then(values => {
            if (values === null) {
                return null;
            }

            if (type === 0) {
                return values.temperature / 100;
            }

            return values.humidity / 100;
        });
    }

    /**
     * Configure the local Arduino joystick pins.
     * @param {object} args Scratch block arguments.
     * @returns {void}
     */
    joystickInit (args) {
        if (this._isEasyMakerSelected()) {
            return this.joystickInitEasyMaker();
        }

        const xPin = Number(args.X);
        const yPin = Number(args.Y);
        const clickPin = Number(args.CLICK);

        if (
            !Number.isInteger(xPin) ||
            !Number.isInteger(yPin) ||
            !Number.isInteger(clickPin) ||
            xPin < 14 ||
            xPin > 19 ||
            yPin < 14 ||
            yPin > 19 ||
            clickPin < 2 ||
            clickPin > 13 ||
            xPin === yPin
        ) {
            return;
        }

        this._joystickXPin = xPin;
        this._joystickYPin = yPin;
        this._joystickClickPin = clickPin;
    }

    /**
     * Configure the fixed EasyMaker joystick JST connector.
     * @returns {void}
     */
    joystickInitEasyMaker () {
        const pins =
            EasyMakerProductProfile
                .dedicatedResources
                .matrixJoystick
                .pins;

        this._joystickXPin = pins.a4;
        this._joystickYPin = pins.a5;
        this._joystickClickPin = pins.d13;
    }

    /**
     * Read one Arduino joystick axis.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved with the selected axis value, or null when unavailable.
     */
    joystickValue (args) {
        const axis = String(args.AXIS);

        if (
            axis !== 'X' &&
            axis !== 'Y'
        ) {
            return null;
        }

        const result = this._peripheral.joystickRead(
            this._joystickXPin,
            this._joystickYPin,
            this._joystickClickPin
        );

        if (!result) {
            return result;
        }

        return result.then(values => {
            if (values === null) {
                return null;
            }

            return axis === 'X' ?
                values.x :
                values.y;
        });
    }

    /**
     * Read the Arduino joystick click state.
     * @returns {?Promise<boolean>} Promise resolved with true when clicked, or null when unavailable.
     */
    joystickClicked () {
        const result = this._peripheral.joystickRead(
            this._joystickXPin,
            this._joystickYPin,
            this._joystickClickPin
        );

        if (!result) {
            return result;
        }

        return result.then(values => {
            if (values === null) {
                return null;
            }

            return values.clicked;
        });

    }

    /**
     * Resolve the currently selected logical product without caching board changes.
     * @returns {?object} Physical product profile, or null for generic boards.
     * @private
     */
    _getProductProfile () {
        return getProductProfile(typeof this.runtime.getEasyBloxSelectedBoardId === 'function' ?
            this.runtime.getEasyBloxSelectedBoardId() : null);
    }

    /**
     * Report whether the active physical board is EasyMaker.
     * @returns {boolean} True when EasyMaker is selected.
     * @private
     */
    _isEasyMakerSelected () {
        return (
            typeof this.runtime
                .getEasyBloxSelectedBoardId ===
                    'function' &&
            this.runtime
                .getEasyBloxSelectedBoardId() ===
                    EasyMakerProductProfile.id
        );
    }
}

module.exports = Scratch3SensorsBlocks;
