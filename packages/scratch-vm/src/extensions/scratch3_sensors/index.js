const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');

const EXTENSION_ID = 'sensors';

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
    }

    /**
     * Describe the hardware sensors extension to the Scratch VM.
     * @returns {object} Extension metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: 'Sensores Arduino',
            color1: '#29B6F6',
            color2: '#039BE5',
            color3: '#0277BD',
            blocks: [
                {
                    opcode: 'ultrasonicRead',
                    blockType: BlockType.REPORTER,
                    text: 'distância do ultrassônico TRIG [TRIG] ECHO [ECHO] (cm)',
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
                },
                {
                    opcode: 'dhtRead',
                    blockType: BlockType.REPORTER,
                    text: '[TYPE] do DHT no pino [PIN]',
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
                }
            ],
            menus: {
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
                }
            }
        };
    }

    /**
     * Read ultrasonic distance in centimeters.
     * @param {object} args Scratch block arguments.
     * @returns {?Promise<number>} Promise resolved with centimeters, or null when unavailable.
     */
    ultrasonicRead (args) {
        const result = this._peripheral.ultrasonicRead(
            Number(args.TRIG),
            Number(args.ECHO)
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
        const type = Number(args.TYPE);

        const result = this._peripheral.dhtRead(
            Number(args.PIN),
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
}

module.exports = Scratch3SensorsBlocks;
