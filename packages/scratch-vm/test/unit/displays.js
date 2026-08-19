const test = require('tap').test;
const BlockType =
    require('../../src/extension-support/block-type');

const Scratch3DisplaysBlocks =
    require('../../src/extensions/scratch3_displays');

test('Displays reuse the registered Arduino UNO peripheral', t => {
    const peripheral = {};

    const runtime = {
        getPeripheralExtension: extensionId => {
            t.equal(
                extensionId,
                'arduinoUno',
                'displays request the Arduino UNO peripheral'
            );

            return peripheral;
        }
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    t.equal(
        extension._peripheral,
        peripheral,
        'displays reuse the registered Arduino UNO peripheral instance'
    );

    t.end();
});

test('Displays expose matrix, LCD and TM1637 blocks and menus', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);
    const info = extension.getInfo();

    t.equal(info.id, 'displays');
    t.equal(info.name, 'Displays');

    t.equal(info.color1, '#E53935');
    t.equal(info.color2, '#C62828');
    t.equal(info.color3, '#8E0000');

    t.equal(
    info.blocks[0].blockType,
    BlockType.LABEL,
    'matrix section starts with a flyout label'
);

t.equal(
    info.blocks[0].text,
    'Matriz de LED 8x8'
);

t.equal(
    info.blocks[5],
    '---',
    'matrix and LCD sections are separated'
);

t.equal(
    info.blocks[6].blockType,
    BlockType.LABEL,
    'LCD section starts with a flyout label'
);

t.equal(
    info.blocks[6].text,
    'Display LCD'
);

t.equal(
    info.blocks[11],
    '---',
    'LCD and 7 segment sections are separated'
);

t.equal(
    info.blocks[12].blockType,
    BlockType.LABEL,
    '7 segment section starts with a flyout label'
);

t.equal(
    info.blocks[12].text,
    'Display 7 SEG'
);

const executableBlocks =
    info.blocks.filter(block =>
        block &&
        typeof block === 'object' &&
        block.opcode
    );

t.same(
    executableBlocks.map(block => block.opcode),
    [
        'configureMatrix',
        'matrixWrite',
        'matrixClear',
        'matrixBrightness',
        'lcdInit',
        'lcdWrite',
        'lcdClear',
        'lcdMode',
        'tm1637Init',
        'tm1637Show',
        'tm1637Clear'
    ]
);

const configureBlock =
    executableBlocks.find(
        block => block.opcode === 'configureMatrix'
    );

const writeBlock =
    executableBlocks.find(
        block => block.opcode === 'matrixWrite'
    );

const clearBlock =
    executableBlocks.find(
        block => block.opcode === 'matrixClear'
    );

const brightnessBlock =
    executableBlocks.find(
        block => block.opcode === 'matrixBrightness'
    );

const tm1637InitBlock =
    executableBlocks.find(
        block => block.opcode === 'tm1637Init'
    );

const tm1637ShowBlock =
    executableBlocks.find(
        block => block.opcode === 'tm1637Show'
    );

const tm1637ClearBlock =
    executableBlocks.find(
        block => block.opcode === 'tm1637Clear'
    );

    t.equal(
        configureBlock.text,
        'configurar matriz 8×8 DIN [DIN] CS [CS] CLK [CLK]'
    );

    t.equal(
        configureBlock.arguments.DIN.defaultValue,
        18,
        'EasyMaker DIN defaults to A4'
    );

    t.equal(
        configureBlock.arguments.CS.defaultValue,
        19,
        'EasyMaker CS defaults to A5'
    );

    t.equal(
        configureBlock.arguments.CLK.defaultValue,
        13,
        'EasyMaker CLK defaults to D13'
    );

    t.equal(
        writeBlock.text,
        'mostrar na matriz [MATRIX]'
    );

    t.equal(
        writeBlock.arguments.MATRIX.defaultValue,
        '0066FFFF7E3C1800',
        'matrix defaults to the approved heart pattern'
    );

    t.equal(
        clearBlock.text,
        'limpar matriz'
    );

    t.equal(
        brightnessBlock.text,
        'definir brilho da matriz para [BRIGHTNESS] %'
    );

    t.equal(
        brightnessBlock.arguments.BRIGHTNESS.defaultValue,
        100
    );

    t.equal(
        tm1637InitBlock.text,
        'inicializar display 7 segmentos CLK [CLK] DIO [DIO]'
    );

    t.equal(
        tm1637InitBlock.arguments.CLK.defaultValue,
        19,
        'TM1637 CLK defaults to A5'
    );

    t.equal(
        tm1637InitBlock.arguments.DIO.defaultValue,
        18,
        'TM1637 DIO defaults to A4'
    );

    t.equal(
        tm1637ShowBlock.text,
        'mostrar [VALUE] com [LENGTH] dígitos na posição [POSITION] [POINT] e [LEADING_ZEROS]'
    );

    t.equal(
        tm1637ShowBlock.arguments.VALUE.defaultValue,
        50
    );

    t.equal(
        tm1637ShowBlock.arguments.LENGTH.defaultValue,
        4
    );

    t.equal(
        tm1637ShowBlock.arguments.POSITION.defaultValue,
        1
    );

    t.equal(
        tm1637ShowBlock.arguments.POINT.defaultValue,
        '0'
    );

    t.equal(
        tm1637ShowBlock.arguments.LEADING_ZEROS.defaultValue,
        '0'
    );

    t.equal(
        tm1637ClearBlock.text,
        'limpar display 7 segmentos'
    );

    t.same(
        info.menus.matrixPins.items.map(item => item.value),
        [
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
            '13',
            '14',
            '15',
            '16',
            '17',
            '18',
            '19'
        ]
    );

    t.same(
        info.menus.lcdRows.items.map(item => item.value),
        ['1', '2']
    );

    t.same(
        info.menus.lcdColumns.items.map(item => item.value),
        [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
            '13',
            '14',
            '15',
            '16'
        ]
    );

    t.same(
        info.menus.lcdModes.items.map(item => item.value),
        [
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9'
        ]
    );

    t.same(
        info.menus.tm1637Lengths.items.map(item => item.value),
        ['1', '2', '3', '4']
    );

    t.same(
        info.menus.tm1637Positions.items.map(item => item.value),
        ['1', '2', '3', '4']
    );

    t.same(
        info.menus.tm1637Point.items.map(item => item.value),
        ['0', '1']
    );

    t.same(
        info.menus.tm1637LeadingZeros.items.map(item => item.value),
        ['0', '1']
    );

    t.end();
});

test('Displays configure matrix pins locally', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    const result = extension.configureMatrix({
        DIN: '2',
        CS: '4',
        CLK: '12'
    });

    t.equal(
        result,
        undefined,
        'matrix configuration does not report a value'
    );

    t.equal(
        extension._matrixDinPin,
        2
    );

    t.equal(
        extension._matrixCsPin,
        4
    );

    t.equal(
        extension._matrixClkPin,
        12
    );

    t.end();
});

test('Displays reject invalid matrix pin configurations', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    extension.configureMatrix({
        DIN: '2',
        CS: '4',
        CLK: '12'
    });

    extension.configureMatrix({
        DIN: '1',
        CS: '4',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects D1'
    );

    extension.configureMatrix({
        DIN: '2',
        CS: '20',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects pins above A5'
    );

    extension.configureMatrix({
        DIN: '2.5',
        CS: '4',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects non-integer pins'
    );

    extension.configureMatrix({
        DIN: '2',
        CS: '2',
        CLK: '12'
    });

    t.same(
        [
            extension._matrixDinPin,
            extension._matrixCsPin,
            extension._matrixClkPin
        ],
        [2, 4, 12],
        'rejects repeated pins'
    );

    t.end();
});

test('Displays propagate asynchronous matrix commands from the shared peripheral', async t => {
    const calls = [];

    const peripheral = {
        matrixWrite: (dinPin, csPin, clkPin, rows) => {
            calls.push([
                'write',
                dinPin,
                csPin,
                clkPin,
                rows
            ]);

            return Promise.resolve(calls.length);
        },

        matrixBrightness: (
            dinPin,
            csPin,
            clkPin,
            brightness
        ) => {
            calls.push([
                'brightness',
                dinPin,
                csPin,
                clkPin,
                brightness
            ]);

            return Promise.resolve(calls.length);
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    extension.configureMatrix({
        DIN: '2',
        CS: '4',
        CLK: '12'
    });

    t.equal(
        await extension.matrixWrite({
            MATRIX: 'FF000000000000FF'
        }),
        1
    );

    t.equal(
        await extension.matrixClear(),
        2
    );

    t.equal(
        await extension.matrixBrightness({
            BRIGHTNESS: 50
        }),
        3
    );

    t.same(
        calls,
        [
            [
                'write',
                2,
                4,
                12,
                [
                    0xFF,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0x00,
                    0xFF
                ]
            ],
            [
                'write',
                2,
                4,
                12,
                [
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0
                ]
            ],
            [
                'brightness',
                2,
                4,
                12,
                50
            ]
        ]
    );

    t.end();
});

test('Displays configure TM1637 pins locally', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    const result = extension.tm1637Init({
        CLK: '12',
        DIO: '11'
    });

    t.equal(
        result,
        undefined,
        'TM1637 configuration does not report a value'
    );

    t.equal(
        extension._tm1637ClkPin,
        12
    );

    t.equal(
        extension._tm1637DioPin,
        11
    );

    t.end();
});

test('Displays reject invalid TM1637 pin configurations', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    extension.tm1637Init({
        CLK: '12',
        DIO: '11'
    });

    extension.tm1637Init({
        CLK: '1',
        DIO: '11'
    });

    t.same(
        [
            extension._tm1637ClkPin,
            extension._tm1637DioPin
        ],
        [12, 11],
        'rejects D1'
    );

    extension.tm1637Init({
        CLK: '12',
        DIO: '20'
    });

    t.same(
        [
            extension._tm1637ClkPin,
            extension._tm1637DioPin
        ],
        [12, 11],
        'rejects pins above A5'
    );

    extension.tm1637Init({
        CLK: '12.5',
        DIO: '11'
    });

    t.same(
        [
            extension._tm1637ClkPin,
            extension._tm1637DioPin
        ],
        [12, 11],
        'rejects non-integer pins'
    );

    extension.tm1637Init({
        CLK: '12',
        DIO: '12'
    });

    t.same(
        [
            extension._tm1637ClkPin,
            extension._tm1637DioPin
        ],
        [12, 11],
        'rejects equal CLK and DIO pins'
    );

    t.end();
});

test('Displays convert TM1637 numbers to segment frames', t => {
    const runtime = {
        getPeripheralExtension: () => ({})
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    t.same(
        extension._tm1637ValueToSegments({
            VALUE: 1234,
            LENGTH: 4,
            POSITION: 1,
            POINT: '0',
            LEADING_ZEROS: '0'
        }),
        [
            0x06,
            0x5B,
            0x4F,
            0x66
        ],
        '1234 uses the physically validated segment frame'
    );

    t.same(
        extension._tm1637ValueToSegments({
            VALUE: 50,
            LENGTH: 4,
            POSITION: 1,
            POINT: '0',
            LEADING_ZEROS: '0'
        }),
        [
            0x00,
            0x00,
            0x6D,
            0x3F
        ],
        '50 is right aligned without leading zeros'
    );

    t.same(
        extension._tm1637ValueToSegments({
            VALUE: 50,
            LENGTH: 4,
            POSITION: 1,
            POINT: '0',
            LEADING_ZEROS: '1'
        }),
        [
            0x3F,
            0x3F,
            0x6D,
            0x3F
        ],
        '50 uses leading zeros when requested'
    );

    t.same(
        extension._tm1637ValueToSegments({
            VALUE: 12,
            LENGTH: 2,
            POSITION: 3,
            POINT: '0',
            LEADING_ZEROS: '0'
        }),
        [
            0x00,
            0x00,
            0x06,
            0x5B
        ],
        'position selects the starting display digit'
    );

    t.same(
        extension._tm1637ValueToSegments({
            VALUE: 1234,
            LENGTH: 4,
            POSITION: 1,
            POINT: '1',
            LEADING_ZEROS: '0'
        }),
        [
            0x06,
            0xDB,
            0x4F,
            0x66
        ],
        'point enables the TM1637 separator bit'
    );

    t.end();
});

test('Displays propagate asynchronous TM1637 commands from the shared peripheral', async t => {
    const calls = [];

    const peripheral = {
        tm1637Write: (
            clkPin,
            dioPin,
            segments
        ) => {
            calls.push([
                clkPin,
                dioPin,
                segments
            ]);

            return Promise.resolve(calls.length);
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    t.equal(
        await extension.tm1637Show({
            VALUE: 1234,
            LENGTH: 4,
            POSITION: 1,
            POINT: '0',
            LEADING_ZEROS: '0'
        }),
        1
    );

    t.equal(
        await extension.tm1637Clear(),
        2
    );

    t.same(
        calls,
        [
            [
                19,
                18,
                [
                    0x06,
                    0x5B,
                    0x4F,
                    0x66
                ]
            ],
            [
                19,
                18,
                [
                    0,
                    0,
                    0,
                    0
                ]
            ]
        ]
    );

    t.end();
});

test('Displays delegate LCD commands to the shared peripheral', t => {
    const calls = [];

    const peripheral = {
        lcdInit: () => {
            calls.push(['init']);
            return 1;
        },

        lcdWrite: (text, row, column) => {
            calls.push([
                'write',
                text,
                row,
                column
            ]);
            return 2;
        },

        lcdClear: () => {
            calls.push(['clear']);
            return 3;
        },

        lcdMode: mode => {
            calls.push([
                'mode',
                mode
            ]);
            return 4;
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    t.equal(
        extension.lcdInit(),
        1
    );

    t.equal(
        extension.lcdWrite({
            TEXT: 'EasyBlox',
            ROW: 1,
            COLUMN: 1
        }),
        2
    );

    t.equal(
        extension.lcdClear(),
        3
    );

    t.equal(
        extension.lcdMode({
            MODE: '0'
        }),
        4
    );

    t.same(
        calls,
        [
            ['init'],
            ['write', 'EasyBlox', 0, 0],
            ['clear'],
            ['mode', 0]
        ]
    );

    t.end();
});

test('Displays normalize LCD row and column coordinates', t => {
    const calls = [];

    const peripheral = {
        lcdWrite: (text, row, column) => {
            calls.push([
                text,
                row,
                column
            ]);

            return calls.length;
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    extension.lcdWrite({
        TEXT: 'A',
        ROW: -10,
        COLUMN: -10
    });

    extension.lcdWrite({
        TEXT: 'B',
        ROW: 99,
        COLUMN: 99
    });

    extension.lcdWrite({
        TEXT: 'C',
        ROW: 1.6,
        COLUMN: 8.6
    });

    t.same(
        calls,
        [
            ['A', 0, 0],
            ['B', 1, 15],
            ['C', 1, 8]
        ]
    );

    t.end();
});

test('Displays delegate all LCD modes as numeric values', t => {
    const receivedModes = [];

    const peripheral = {
        lcdMode: mode => {
            receivedModes.push(mode);
            return mode;
        }
    };

    const runtime = {
        getPeripheralExtension: () => peripheral
    };

    const extension = new Scratch3DisplaysBlocks(runtime);

    for (let mode = 0; mode <= 9; mode++) {
        extension.lcdMode({
            MODE: String(mode)
        });
    }

    t.same(
        receivedModes,
        [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
        ]
    );

    t.end();
});
